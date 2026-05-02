using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.Models;

namespace WoodenHousesAPI.Services;

public record AccountsBatchResult(int PaymentRemindersQueued, int PaymentRemindersFailed, bool ReportSent);

public interface IAccountsAgentService : IAgentService
{
    Task<AccountsBatchResult> RunWeeklyAsync(CancellationToken ct = default);
}

public class AccountsAgentService(
    AppDbContext                  db,
    IClaudeService                claude,
    IAgentContextService          contextSvc,
    IEmailService                 email,
    IConfiguration                config,
    ILogger<AccountsAgentService> log) : IAccountsAgentService
{
    public string AgentType => "accounts";

    private const int PaymentReminderDaysAfterAccepted = 3;

    public async Task<AccountsBatchResult> RunWeeklyAsync(CancellationToken ct = default)
    {
        int remindersQueued = 0, remindersFailed = 0;

        // ── Payment reminders: accepted quotes with no confirmation yet ───────────
        var cutoff = DateTime.UtcNow.AddDays(-PaymentReminderDaysAfterAccepted);

        var hasReminder = await db.AgentTasks
            .Where(t => t.AgentType == AgentType
                     && t.TriggerType == "payment_reminder"
                     && t.QuoteId != null
                     && t.Status != "failed" && t.Status != "rejected")
            .Select(t => t.QuoteId!.Value)
            .Distinct()
            .ToListAsync(ct);

        var eligibleQuotes = await db.Quotes
            .Where(q => q.Status == "accepted"
                     && q.AcceptedAt != null
                     && q.AcceptedAt <= cutoff
                     && !hasReminder.Contains(q.Id))
            .OrderBy(q => q.AcceptedAt)
            .ToListAsync(ct);

        foreach (var quote in eligibleQuotes)
        {
            if (ct.IsCancellationRequested) break;
            var outcome = await ProcessPaymentReminderAsync(quote, ct);
            if (outcome == "queued") remindersQueued++;
            else remindersFailed++;
            await Task.Delay(700, ct);
        }

        // ── Weekly report to admin ────────────────────────────────────────────────
        var reportSent = false;
        try
        {
            await SendWeeklyReportAsync(ct);
            reportSent = true;
        }
        catch (Exception ex)
        {
            log.LogError(ex, "[AccountsAgent] Weekly report failed to send");
        }

        log.LogInformation(
            "[AccountsAgent] Weekly run complete — remindersQueued={R} remindersFailed={F} reportSent={S}",
            remindersQueued, remindersFailed, reportSent);

        return new AccountsBatchResult(remindersQueued, remindersFailed, reportSent);
    }

    private record DraftResult(string Subject, string Body, int InputTokens, int OutputTokens);

    // ─── Payment reminder ─────────────────────────────────────────────────────

    private async Task<string> ProcessPaymentReminderAsync(Quote quote, CancellationToken ct)
    {
        var task = new AgentTask
        {
            AgentType    = AgentType,
            TriggerType  = "payment_reminder",
            QuoteId      = quote.Id,
            ContactId    = quote.ContactId,
            ToAddress    = quote.CustomerEmail,
            InputSummary = $"{quote.CustomerName} <{quote.CustomerEmail}> | {quote.QuoteNumber} | KES {quote.FinalPrice:N0} | payment_reminder",
            Status       = "pending_approval",
        };
        db.AgentTasks.Add(task);
        await db.SaveChangesAsync(ct);

        try
        {
            var draft = await GeneratePaymentReminderDraftAsync(quote, ct);
            task.DraftSubject  = draft.Subject;
            task.DraftBody     = draft.Body;
            task.InputTokens   = draft.InputTokens;
            task.OutputTokens  = draft.OutputTokens;
            await db.SaveChangesAsync(ct);
            log.LogInformation("[AccountsAgent] payment_reminder queued for {Email} (task {Id})",
                quote.CustomerEmail, task.Id);
            return "queued";
        }
        catch (Exception ex)
        {
            task.Status       = "failed";
            task.ErrorMessage = ex.Message;
            await db.SaveChangesAsync(ct);
            log.LogError(ex, "[AccountsAgent] payment_reminder failed for quote {Id}", quote.Id);
            return "failed";
        }
    }

    private async Task<DraftResult> GeneratePaymentReminderDraftAsync(
        Quote quote, CancellationToken ct)
    {
        var daysSince = quote.AcceptedAt.HasValue
            ? (int)(DateTime.UtcNow - quote.AcceptedAt.Value).TotalDays
            : 0;

        var taskContext = $"""
            Trigger: Payment reminder for accepted quote
            Client name: {quote.CustomerName}
            Quote number: {quote.QuoteNumber}
            Total amount: KES {quote.FinalPrice:N0}
            House type: {quote.HouseType ?? "wooden house"}
            Payment terms: {quote.PaymentTerms ?? "as agreed"}
            Days since quote acceptance: {daysSince}
            """;

        var systemPrompt = await contextSvc.BuildSystemPromptAsync(taskContext, ct);

        var userMessage = $"""
            Write a polite payment reminder email for a client who accepted our quote but has not yet confirmed payment.

            Client: {quote.CustomerName}
            Quote number: {quote.QuoteNumber}
            Total: KES {quote.FinalPrice:N0}
            Payment terms: {quote.PaymentTerms ?? "as agreed"}
            Days since acceptance: {daysSince}

            Requirements:
            - Express excitement about starting their project
            - Reference the quote number clearly
            - State the total and payment terms
            - Provide a clear next step (initiate payment / contact us to confirm schedule)
            - Professional and warm — not pushy or alarming
            - Under 200 words
            - Sign off as "Accounts Team · Wooden Houses Kenya"

            Return ONLY valid JSON (no markdown fences): "subject" (string) and "body" (string, complete HTML email with inline styles only).
            """;

        var result = await claude.CompleteAsync(systemPrompt, userMessage, ct);
        var (subject, body) = ParseDraft(result.Text);
        return new DraftResult(subject, body, result.InputTokens, result.OutputTokens);
    }

    // ─── Weekly report ────────────────────────────────────────────────────────

    private async Task SendWeeklyReportAsync(CancellationToken ct)
    {
        var adminEmail = config["Email:AdminNotifyAddress"] ?? "ericabuto@gmail.com";
        var now        = DateTime.UtcNow;
        var weekStart  = now.AddDays(-7);

        var newContacts    = await db.Contacts.CountAsync(c => c.CreatedAt >= weekStart && !c.IsSpam, ct);
        var agentReplied   = await db.Contacts.CountAsync(c => c.ContactedAt >= weekStart, ct);
        var quotesSent     = await db.Quotes.CountAsync(q => q.SentAt >= weekStart, ct);
        var quotesAccepted = await db.Quotes.CountAsync(q => q.AcceptedAt >= weekStart, ct);
        var quotesRejected = await db.Quotes.CountAsync(q => q.Status == "rejected" && q.UpdatedAt >= weekStart, ct);
        var pendingQueue   = await db.AgentTasks.CountAsync(t => t.Status == "pending_approval", ct);
        var agentTasksWeek = await db.AgentTasks.CountAsync(t => t.CreatedAt >= weekStart, ct);

        var pipelineValue  = await db.Quotes
            .Where(q => q.Status == "sent" || q.Status == "accepted")
            .SumAsync(q => (decimal?)q.FinalPrice ?? 0, ct);

        var acceptedValue  = await db.Quotes
            .Where(q => q.AcceptedAt >= weekStart)
            .SumAsync(q => (decimal?)q.FinalPrice ?? 0, ct);

        var html = BuildReportHtml(now, weekStart,
            newContacts, agentReplied, quotesSent, quotesAccepted, quotesRejected,
            pendingQueue, agentTasksWeek, pipelineValue, acceptedValue);

        await email.SendAdminReportAsync(
            adminEmail,
            $"Weekly Business Report — {now:MMM d, yyyy} | Wooden Houses Kenya",
            html);

        log.LogInformation("[AccountsAgent] Weekly report sent to {Admin}", adminEmail);
    }

    private static string BuildReportHtml(
        DateTime now, DateTime weekStart,
        int newContacts, int agentReplied,
        int quotesSent, int quotesAccepted, int quotesRejected,
        int pendingQueue, int agentTasksWeek,
        decimal pipelineValue, decimal acceptedValue)
    {
        var dateRange = $"{weekStart:MMM d} – {now:MMM d, yyyy}";

        return $"""
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background:#F5F0EB;font-family:'Helvetica Neue',Arial,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#F5F0EB">
                <tr><td align="center" style="padding:32px 16px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

                    <!-- Header -->
                    <tr><td align="center" bgcolor="#8B5E3C"
                        style="background:#8B5E3C;padding:28px 40px;border-radius:12px 12px 0 0;">
                      <p style="margin:0;color:#fff;font-size:20px;font-weight:700;">Wooden Houses Kenya</p>
                      <p style="margin:6px 0 0;color:#C49A6C;font-size:13px;">Weekly Business Report</p>
                      <p style="margin:8px 0 0;color:#eee;font-size:12px;">{dateRange}</p>
                    </td></tr>

                    <!-- Body -->
                    <tr><td style="background:#fff;padding:32px 40px;border-radius:0 0 12px 12px;">

                      <p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#8B5E3C;border-bottom:2px solid #F5F0EB;padding-bottom:8px;">
                        Leads &amp; Agent Activity
                      </p>
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                        {Row("New enquiries this week",     newContacts.ToString(),    newContacts > 0    ? "#065F46" : "#6B7280")}
                        {Row("Replies sent by AI agents",   agentReplied.ToString(),   agentReplied > 0   ? "#065F46" : "#6B7280")}
                        {Row("Agent tasks created",         agentTasksWeek.ToString(), agentTasksWeek > 0 ? "#1D4ED8" : "#6B7280")}
                        {Row("Pending in approval queue",   pendingQueue.ToString(),   pendingQueue > 0   ? "#B45309" : "#6B7280")}
                      </table>

                      <p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#8B5E3C;border-bottom:2px solid #F5F0EB;padding-bottom:8px;">
                        Quotes &amp; Revenue
                      </p>
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                        {Row("Quotes sent this week",       quotesSent.ToString(),                      quotesSent > 0     ? "#1D4ED8" : "#6B7280")}
                        {Row("Quotes accepted this week",   quotesAccepted.ToString(),                  quotesAccepted > 0 ? "#065F46" : "#6B7280")}
                        {Row("Quotes rejected this week",   quotesRejected.ToString(),                  quotesRejected > 0 ? "#991B1B" : "#6B7280")}
                        {Row("Revenue won this week",       $"KES {acceptedValue:N0}",                  acceptedValue > 0  ? "#065F46" : "#6B7280")}
                        {Row("Total active pipeline",       $"KES {pipelineValue:N0}",                  "#1D4ED8")}
                      </table>

                      <div style="text-align:center;">
                        <a href="https://woodenhouseskenya.com/dashboard"
                           style="background:#8B5E3C;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:600;display:inline-block;">
                          Open Dashboard →
                        </a>
                      </div>

                    </td></tr>

                    <!-- Footer -->
                    <tr><td align="center" style="padding:20px 0 0;">
                      <p style="margin:0;font-size:11px;color:#aaa;">
                        Auto-generated by Wooden Houses Kenya AI Accounts Agent ·
                        <a href="https://woodenhouseskenya.com/dashboard/agents" style="color:#8B5E3C;">View agent activity</a>
                      </p>
                    </td></tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;
    }

    private static string Row(string label, string value, string valueColor) => $"""
        <tr>
          <td style="padding:9px 0;border-bottom:1px solid #F5F0EB;color:#555;font-size:13px;">{label}</td>
          <td style="padding:9px 0;border-bottom:1px solid #F5F0EB;text-align:right;font-weight:700;font-size:14px;color:{valueColor};">{value}</td>
        </tr>
        """;

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
        var subject = root.GetProperty("subject").GetString() ?? "Payment Confirmation — Wooden Houses Kenya";
        var body    = root.GetProperty("body").GetString()    ?? raw;
        return (subject, body);
    }
}
