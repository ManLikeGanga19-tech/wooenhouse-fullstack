using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.Models;

namespace WoodenHousesAPI.Services;

public interface IQuoteAgentService : IAgentService
{
    Task<AgentTask> HandleQuoteSendAsync(Guid quoteId, CancellationToken ct = default);
}

public class QuoteAgentService(
    AppDbContext               db,
    IClaudeService             claude,
    IAgentContextService       contextSvc,
    IConfiguration             config,
    ILogger<QuoteAgentService> log) : IQuoteAgentService
{
    public string AgentType => "quote";

    public async Task<AgentTask> HandleQuoteSendAsync(Guid quoteId, CancellationToken ct = default)
    {
        var quote = await db.Quotes
            .Include(q => q.LineItems)
            .FirstOrDefaultAsync(q => q.Id == quoteId, ct)
            ?? throw new InvalidOperationException($"Quote {quoteId} not found.");

        // Generate the public token now so Claude can embed the real link in the draft
        if (string.IsNullOrEmpty(quote.PublicToken))
        {
            quote.PublicToken = Guid.NewGuid().ToString("N");
            quote.UpdatedAt   = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
        }

        var frontendUrl = config["Frontend:Url"] ?? "https://woodenhouseskenya.com";
        var publicLink  = $"{frontendUrl}/quote/{quote.PublicToken}";

        var task = new AgentTask
        {
            AgentType    = AgentType,
            TriggerType  = "quote_send",
            QuoteId      = quote.Id,
            ContactId    = quote.ContactId,
            ToAddress    = quote.CustomerEmail,
            InputSummary = $"{quote.CustomerName} <{quote.CustomerEmail}> | {quote.QuoteNumber} | KES {quote.FinalPrice:N0}",
            Status       = "pending_approval",
        };
        db.AgentTasks.Add(task);
        await db.SaveChangesAsync(ct);

        try
        {
            var (subject, body) = await GenerateDraftAsync(quote, publicLink, ct);
            task.DraftSubject = subject;
            task.DraftBody    = body;
            await db.SaveChangesAsync(ct);

            log.LogInformation("[QuoteAgent] Draft queued for {QuoteNumber} → {Email} (task {Id})",
                quote.QuoteNumber, quote.CustomerEmail, task.Id);
        }
        catch (Exception ex)
        {
            task.Status       = "failed";
            task.ErrorMessage = ex.Message;
            await db.SaveChangesAsync(ct);
            log.LogError(ex, "[QuoteAgent] Failed for quote {QuoteId}", quoteId);
        }

        return task;
    }

    private async Task<(string subject, string body)> GenerateDraftAsync(
        Quote quote, string publicLink, CancellationToken ct)
    {
        var lineItemsSummary = quote.LineItems.Any()
            ? string.Join(", ", quote.LineItems.Take(3).Select(li => li.Description))
                + (quote.LineItems.Count > 3 ? $" and {quote.LineItems.Count - 3} more items" : "")
            : quote.HouseType ?? "wooden house construction";

        var validUntil = quote.CreatedAt.AddDays(quote.ValidityDays).ToString("MMMM d, yyyy");

        var taskContext = $"""
            Trigger: Quote cover email
            Quote number: {quote.QuoteNumber}
            Customer name: {quote.CustomerName}
            House type: {quote.HouseType ?? "not specified"}
            House size: {quote.HouseSize ?? "not specified"}
            Location: {quote.Location ?? "not specified"}
            Total price: KES {quote.FinalPrice:N0}
            Payment terms: {quote.PaymentTerms ?? "not specified"}
            Delivery timeline: {quote.DeliveryTimeline ?? "not specified"}
            Valid until: {validUntil}
            Quote link: {publicLink}
            """;

        var systemPrompt = await contextSvc.BuildSystemPromptAsync(taskContext, ct);

        var userMessage = $"""
            Draft a warm, professional email to accompany quote {quote.QuoteNumber} we are sending to a client.

            Client: {quote.CustomerName}
            Project: {quote.HouseType ?? "wooden house"}{(string.IsNullOrEmpty(quote.HouseSize) ? "" : $" ({quote.HouseSize})")}
            Location: {quote.Location ?? "not specified"}
            Total: KES {quote.FinalPrice:N0}
            Payment terms: {quote.PaymentTerms ?? "to be agreed"}
            Delivery: {quote.DeliveryTimeline ?? "to be confirmed"}
            What is included: {lineItemsSummary}
            Valid until: {validUntil}

            The email MUST include a clearly visible "View Your Quotation" button/link pointing to:
            {publicLink}

            Requirements:
            - Address the client by first name
            - Express genuine enthusiasm about their project
            - Briefly describe what the quote covers in plain language (do not list every item)
            - Include the CTA button with the link above — make it prominent
            - Mention the validity date ({validUntil}) and encourage a timely decision
            - Invite them to call or reply with questions
            - Under 200 words, professional and warm
            - Sign off as "Accounts Team · Wooden Houses Kenya"

            Return ONLY valid JSON (no markdown fences): "subject" (string) and "body" (string, a complete HTML email with inline styles only — no CSS classes).
            """;

        var raw = await claude.CompleteAsync(systemPrompt, userMessage, ct);
        return ParseDraft(raw);
    }

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
        var subject = root.GetProperty("subject").GetString() ?? "Your Quotation — Wooden Houses Kenya";
        var body    = root.GetProperty("body").GetString()    ?? raw;
        return (subject, body);
    }
}
