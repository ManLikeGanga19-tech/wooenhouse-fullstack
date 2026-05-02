using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.Models;

namespace WoodenHousesAPI.Services;

public record FollowupBatchResult(int Queued, int Skipped, int Failed);

public interface IFollowupAgentService : IAgentService
{
    Task<FollowupBatchResult> RunScheduledFollowupsAsync(CancellationToken ct = default);
}

public class FollowupAgentService(
    AppDbContext                  db,
    IClaudeService                claude,
    IAgentContextService          contextSvc,
    ILogger<FollowupAgentService> log) : IFollowupAgentService
{
    public string AgentType => "followup";

    private const int FollowUp1DaysAfterContact      = 3;
    private const int FollowUp2DaysAfterFollowUp1    = 7;
    private const int QuoteReminderDaysAfterSend     = 3;  // sent but never opened
    private const int ViewedQuoteFollowupDays        = 3;  // opened but no decision yet

    public async Task<FollowupBatchResult> RunScheduledFollowupsAsync(CancellationToken ct = default)
    {
        int queued = 0, skipped = 0, failed = 0;

        // ── Follow-up 1: contacts replied to 3+ days ago with no response ────────
        var cutoff1 = DateTime.UtcNow.AddDays(-FollowUp1DaysAfterContact);

        var hasFollowup1 = await db.AgentTasks
            .Where(t => t.AgentType == AgentType
                     && t.TriggerType == "followup_1"
                     && t.ContactId != null
                     && t.Status != "failed" && t.Status != "rejected")
            .Select(t => t.ContactId!.Value)
            .Distinct()
            .ToListAsync(ct);

        var eligibleFollowup1 = await db.Contacts
            .Where(c => !c.IsSpam
                     && c.Status == "contacted"
                     && c.ContactedAt != null
                     && c.ContactedAt <= cutoff1
                     && !hasFollowup1.Contains(c.Id))
            .OrderBy(c => c.ContactedAt)
            .ToListAsync(ct);

        foreach (var contact in eligibleFollowup1)
        {
            if (ct.IsCancellationRequested) break;
            var outcome = await ProcessContactFollowupAsync(contact, "followup_1", ct);
            if (outcome == "queued") queued++;
            else if (outcome == "failed") failed++;
            else skipped++;
            await Task.Delay(700, ct);
        }

        // ── Follow-up 2: follow-up 1 sent 7+ days ago, still no response ─────────
        var cutoff2 = DateTime.UtcNow.AddDays(-FollowUp2DaysAfterFollowUp1);

        var sentFollowup1ContactIds = await db.AgentTasks
            .Where(t => t.AgentType == AgentType
                     && t.TriggerType == "followup_1"
                     && t.ContactId != null
                     && (t.Status == "approved" || t.Status == "auto_sent")
                     && t.ExecutedAt != null
                     && t.ExecutedAt <= cutoff2)
            .Select(t => t.ContactId!.Value)
            .Distinct()
            .ToListAsync(ct);

        var hasFollowup2 = await db.AgentTasks
            .Where(t => t.AgentType == AgentType
                     && t.TriggerType == "followup_2"
                     && t.ContactId != null
                     && t.Status != "failed" && t.Status != "rejected")
            .Select(t => t.ContactId!.Value)
            .Distinct()
            .ToListAsync(ct);

        var eligibleFollowup2ContactIds = sentFollowup1ContactIds.Except(hasFollowup2).ToList();

        var eligibleFollowup2 = await db.Contacts
            .Where(c => !c.IsSpam
                     && c.Status == "contacted"
                     && eligibleFollowup2ContactIds.Contains(c.Id))
            .OrderBy(c => c.ContactedAt)
            .ToListAsync(ct);

        foreach (var contact in eligibleFollowup2)
        {
            if (ct.IsCancellationRequested) break;
            var outcome = await ProcessContactFollowupAsync(contact, "followup_2", ct);
            if (outcome == "queued") queued++;
            else if (outcome == "failed") failed++;
            else skipped++;
            await Task.Delay(700, ct);
        }

        // ── Quote reminders: sent 3+ days ago, never opened ──────────────────────
        var cutoffQuote = DateTime.UtcNow.AddDays(-QuoteReminderDaysAfterSend);

        var hasQuoteReminder = await db.AgentTasks
            .Where(t => t.AgentType == AgentType
                     && t.TriggerType == "quote_reminder"
                     && t.QuoteId != null
                     && t.Status != "failed" && t.Status != "rejected")
            .Select(t => t.QuoteId!.Value)
            .Distinct()
            .ToListAsync(ct);

        var eligibleReminders = await db.Quotes
            .Where(q => q.Status == "sent"
                     && q.ViewedAt == null
                     && q.SentAt != null
                     && q.SentAt <= cutoffQuote
                     && !hasQuoteReminder.Contains(q.Id))
            .OrderBy(q => q.SentAt)
            .ToListAsync(ct);

        foreach (var quote in eligibleReminders)
        {
            if (ct.IsCancellationRequested) break;
            var outcome = await ProcessQuoteReminderAsync(quote, ct);
            if (outcome == "queued") queued++;
            else if (outcome == "failed") failed++;
            else skipped++;
            await Task.Delay(700, ct);
        }

        // ── Viewed-quote follow-up: quote opened but no decision after 3+ days ──
        var cutoffViewed = DateTime.UtcNow.AddDays(-ViewedQuoteFollowupDays);

        var hasViewedFollowup = await db.AgentTasks
            .Where(t => t.AgentType == AgentType
                     && t.TriggerType == "viewed_quote_followup"
                     && t.QuoteId != null
                     && t.Status != "failed" && t.Status != "rejected")
            .Select(t => t.QuoteId!.Value)
            .Distinct()
            .ToListAsync(ct);

        var eligibleViewedQuotes = await db.Quotes
            .Where(q => (q.Status == "sent" || q.Status == "viewed")
                     && q.ViewedAt != null
                     && q.ViewedAt <= cutoffViewed
                     && !hasViewedFollowup.Contains(q.Id))
            .OrderBy(q => q.ViewedAt)
            .ToListAsync(ct);

        foreach (var quote in eligibleViewedQuotes)
        {
            if (ct.IsCancellationRequested) break;
            var outcome = await ProcessViewedQuoteFollowupAsync(quote, ct);
            if (outcome == "queued") queued++;
            else if (outcome == "failed") failed++;
            else skipped++;
            await Task.Delay(700, ct);
        }

        log.LogInformation(
            "[FollowupAgent] Run complete — queued={Q} failed={F} skipped={S}",
            queued, failed, skipped);

        return new FollowupBatchResult(queued, skipped, failed);
    }

    private record DraftResult(string Subject, string Body, int InputTokens, int OutputTokens);

    // ─── Contact follow-up ────────────────────────────────────────────────────

    private async Task<string> ProcessContactFollowupAsync(
        Contact contact, string triggerType, CancellationToken ct)
    {
        var task = new AgentTask
        {
            AgentType    = AgentType,
            TriggerType  = triggerType,
            ContactId    = contact.Id,
            ToAddress    = contact.Email,
            InputSummary = $"{contact.Name} <{contact.Email}> | {triggerType} | {contact.ServiceType ?? "general"}",
            Status       = "pending_approval",
        };
        db.AgentTasks.Add(task);
        await db.SaveChangesAsync(ct);

        try
        {
            var draft = await GenerateContactFollowupDraftAsync(contact, triggerType, ct);
            task.DraftSubject  = draft.Subject;
            task.DraftBody     = draft.Body;
            task.InputTokens   = draft.InputTokens;
            task.OutputTokens  = draft.OutputTokens;
            await db.SaveChangesAsync(ct);
            log.LogInformation("[FollowupAgent] {Trigger} queued for {Email} (task {Id})",
                triggerType, contact.Email, task.Id);
            return "queued";
        }
        catch (Exception ex)
        {
            task.Status       = "failed";
            task.ErrorMessage = ex.Message;
            await db.SaveChangesAsync(ct);
            log.LogError(ex, "[FollowupAgent] {Trigger} failed for contact {Id}", triggerType, contact.Id);
            return "failed";
        }
    }

    private async Task<DraftResult> GenerateContactFollowupDraftAsync(
        Contact contact, string triggerType, CancellationToken ct)
    {
        var daysSince = contact.ContactedAt.HasValue
            ? (int)(DateTime.UtcNow - contact.ContactedAt.Value).TotalDays
            : 0;

        var isFinal = triggerType == "followup_2";

        var taskContext = $"""
            Trigger: {(isFinal ? "Second and final follow-up" : "First follow-up")}
            Client name: {contact.Name}
            Service interest: {contact.ServiceType ?? "general wooden house construction"}
            Location: {contact.Location ?? "not specified"}
            Budget: {contact.Budget ?? "not specified"}
            Original message: {contact.Message ?? "no message provided"}
            Days since initial reply: {daysSince}
            """;

        var systemPrompt = await contextSvc.BuildSystemPromptAsync(taskContext, ct);

        var tone = isFinal
            ? "This is the second and final follow-up. Be warm but slightly more direct. Create gentle urgency — mention you want to make sure the inquiry doesn't slip through. Invite them to reply or call."
            : "This is the first gentle follow-up. Keep it light and genuinely helpful — offer to answer questions or schedule a site visit.";

        var userMessage = $"""
            Write a follow-up email to a potential client who has not responded to our initial reply.

            Client: {contact.Name}
            Service: {contact.ServiceType ?? "wooden house construction"}
            Days since we replied: {daysSince}
            {tone}

            Requirements:
            - Address them by first name
            - Reference their specific interest naturally (don't make it feel like a template)
            - Offer a clear, easy next step (reply, call, site visit)
            - Under 150 words
            - Sign off as "{(isFinal ? "Sales Team · Wooden Houses Kenya" : "The Wooden Houses Kenya Team")}"

            Return ONLY valid JSON (no markdown fences): "subject" (string) and "body" (string, complete HTML email with inline styles only).
            """;

        var result = await claude.CompleteAsync(systemPrompt, userMessage, ct);
        var (subject, body) = ParseDraft(result.Text);
        return new DraftResult(subject, body, result.InputTokens, result.OutputTokens);
    }

    // ─── Quote reminder ───────────────────────────────────────────────────────

    private async Task<string> ProcessQuoteReminderAsync(Quote quote, CancellationToken ct)
    {
        var task = new AgentTask
        {
            AgentType    = AgentType,
            TriggerType  = "quote_reminder",
            QuoteId      = quote.Id,
            ContactId    = quote.ContactId,
            ToAddress    = quote.CustomerEmail,
            InputSummary = $"{quote.CustomerName} <{quote.CustomerEmail}> | {quote.QuoteNumber} | quote_reminder",
            Status       = "pending_approval",
        };
        db.AgentTasks.Add(task);
        await db.SaveChangesAsync(ct);

        try
        {
            var draft = await GenerateQuoteReminderDraftAsync(quote, ct);
            task.DraftSubject  = draft.Subject;
            task.DraftBody     = draft.Body;
            task.InputTokens   = draft.InputTokens;
            task.OutputTokens  = draft.OutputTokens;
            await db.SaveChangesAsync(ct);
            log.LogInformation("[FollowupAgent] quote_reminder queued for {Email} (task {Id})",
                quote.CustomerEmail, task.Id);
            return "queued";
        }
        catch (Exception ex)
        {
            task.Status       = "failed";
            task.ErrorMessage = ex.Message;
            await db.SaveChangesAsync(ct);
            log.LogError(ex, "[FollowupAgent] quote_reminder failed for quote {Id}", quote.Id);
            return "failed";
        }
    }

    private async Task<DraftResult> GenerateQuoteReminderDraftAsync(
        Quote quote, CancellationToken ct)
    {
        var daysSince = quote.SentAt.HasValue
            ? (int)(DateTime.UtcNow - quote.SentAt.Value).TotalDays
            : 0;

        var taskContext = $"""
            Trigger: Quote not yet viewed — gentle reminder
            Client name: {quote.CustomerName}
            Quote number: {quote.QuoteNumber}
            Total: KES {quote.FinalPrice:N0}
            House type: {quote.HouseType ?? "not specified"}
            Days since quote was sent: {daysSince}
            """;

        var systemPrompt = await contextSvc.BuildSystemPromptAsync(taskContext, ct);

        var userMessage = $"""
            Write a gentle reminder email for a client who has not yet opened their quote.

            Client: {quote.CustomerName}
            Quote reference: {quote.QuoteNumber}
            Amount: KES {quote.FinalPrice:N0}
            Days since sent: {daysSince}

            Requirements:
            - Address them by first name
            - Mention the quote reference number ({quote.QuoteNumber})
            - Gently note the quote is waiting for their review
            - Offer to answer questions or adjust the scope if needed
            - Under 120 words
            - Sign off as "Accounts Team · Wooden Houses Kenya"

            Return ONLY valid JSON (no markdown fences): "subject" (string) and "body" (string, complete HTML email with inline styles only).
            """;

        var result = await claude.CompleteAsync(systemPrompt, userMessage, ct);
        var (subject, body) = ParseDraft(result.Text);
        return new DraftResult(subject, body, result.InputTokens, result.OutputTokens);
    }

    // ─── Viewed-quote follow-up ───────────────────────────────────────────────

    private async Task<string> ProcessViewedQuoteFollowupAsync(Quote quote, CancellationToken ct)
    {
        var task = new AgentTask
        {
            AgentType    = AgentType,
            TriggerType  = "viewed_quote_followup",
            QuoteId      = quote.Id,
            ContactId    = quote.ContactId,
            ToAddress    = quote.CustomerEmail,
            InputSummary = $"{quote.CustomerName} <{quote.CustomerEmail}> | {quote.QuoteNumber} | viewed_quote_followup",
            Status       = "pending_approval",
        };
        db.AgentTasks.Add(task);
        await db.SaveChangesAsync(ct);

        try
        {
            var draft = await GenerateViewedQuoteFollowupDraftAsync(quote, ct);
            task.DraftSubject  = draft.Subject;
            task.DraftBody     = draft.Body;
            task.InputTokens   = draft.InputTokens;
            task.OutputTokens  = draft.OutputTokens;
            await db.SaveChangesAsync(ct);
            log.LogInformation("[FollowupAgent] viewed_quote_followup queued for {Email} (task {Id})",
                quote.CustomerEmail, task.Id);
            return "queued";
        }
        catch (Exception ex)
        {
            task.Status       = "failed";
            task.ErrorMessage = ex.Message;
            await db.SaveChangesAsync(ct);
            log.LogError(ex, "[FollowupAgent] viewed_quote_followup failed for quote {Id}", quote.Id);
            return "failed";
        }
    }

    private async Task<DraftResult> GenerateViewedQuoteFollowupDraftAsync(
        Quote quote, CancellationToken ct)
    {
        var daysSinceViewed = quote.ViewedAt.HasValue
            ? (int)(DateTime.UtcNow - quote.ViewedAt.Value).TotalDays
            : 0;

        var taskContext = $"""
            Trigger: Quote was viewed but no decision yet
            Client name: {quote.CustomerName}
            Quote number: {quote.QuoteNumber}
            Total: KES {quote.FinalPrice:N0}
            House type: {quote.HouseType ?? "wooden house"}
            Delivery timeline: {quote.DeliveryTimeline ?? "to be confirmed"}
            Payment terms: {quote.PaymentTerms ?? "as agreed"}
            Days since client viewed the quote: {daysSinceViewed}
            """;

        var systemPrompt = await contextSvc.BuildSystemPromptAsync(taskContext, ct);

        var userMessage = $"""
            Write a friendly follow-up email to a client who opened and viewed our quote but has not yet made a decision.

            Client: {quote.CustomerName}
            Quote: {quote.QuoteNumber}
            Amount: KES {quote.FinalPrice:N0}
            Project: {quote.HouseType ?? "wooden house"}{(string.IsNullOrEmpty(quote.HouseSize) ? "" : $" ({quote.HouseSize})")}
            Days since they viewed the quote: {daysSinceViewed}

            They clearly showed interest by opening it — this follow-up should:
            - Acknowledge they had a chance to look at it
            - Offer to clarify anything, adjust scope, or arrange a site visit
            - Gently highlight the value and next steps
            - Be warm, not pushy — this is a high-value construction purchase decision
            - Under 160 words
            - Sign off as "Sales Team · Wooden Houses Kenya"

            Return ONLY valid JSON (no markdown fences): "subject" (string) and "body" (string, complete HTML email with inline styles only).
            """;

        var result = await claude.CompleteAsync(systemPrompt, userMessage, ct);
        var (subject, body) = ParseDraft(result.Text);
        return new DraftResult(subject, body, result.InputTokens, result.OutputTokens);
    }

    // ─── Shared helper ────────────────────────────────────────────────────────

    private static (string subject, string body) ParseDraft(string raw)
    {
        var json = raw.Trim();
        if (json.StartsWith("```"))
        {
            var start = json.IndexOf('\n') + 1;
            var end   = json.LastIndexOf("```");
            if (end > start) json = json[start..end].Trim();
        }

        using var doc = System.Text.Json.JsonDocument.Parse(json);
        var root    = doc.RootElement;
        var subject = root.GetProperty("subject").GetString() ?? "Following up — Wooden Houses Kenya";
        var body    = root.GetProperty("body").GetString()    ?? raw;
        return (subject, body);
    }
}
