using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.Models;

namespace WoodenHousesAPI.Services;

/// <summary>
/// Controls whether the agent sends the email immediately or parks it for human review.
/// AutoSend  → live contact-form submissions (response expected within seconds)
/// Queue     → existing/backlog contacts (admin reviews before sending)
/// </summary>
public enum AgentDispatchMode { AutoSend, QueueForApproval }

public record BatchProcessResult(int Queued, int Skipped, int Failed, int Total);

public interface ISalesAgentService : IAgentService
{
    /// <summary>Draft and dispatch (or queue) a reply for a single contact.</summary>
    Task<AgentTask> HandleContactAsync(
        Guid             contactId,
        AgentDispatchMode mode        = AgentDispatchMode.AutoSend,
        string           triggerType  = "contact_form",
        CancellationToken ct          = default);

    /// <summary>
    /// Find every "new" non-spam contact that has no active agent task and queue a reply.
    /// Safe to call repeatedly — already-handled contacts are skipped.
    /// </summary>
    Task<BatchProcessResult> ProcessUnhandledContactsAsync(CancellationToken ct = default);

    /// <summary>Return the count of contacts eligible for batch processing.</summary>
    Task<int> CountUnhandledContactsAsync(CancellationToken ct = default);
}

public class SalesAgentService(
    AppDbContext               db,
    IClaudeService             claude,
    IAgentContextService       contextSvc,
    IEmailService              email,
    ILogger<SalesAgentService> log) : ISalesAgentService
{
    public string AgentType => "sales";

    // ─── Public API ───────────────────────────────────────────────────────────

    public async Task<AgentTask> HandleContactAsync(
        Guid              contactId,
        AgentDispatchMode mode        = AgentDispatchMode.AutoSend,
        string            triggerType = "contact_form",
        CancellationToken ct          = default)
    {
        var contact = await db.Contacts.FindAsync([contactId], ct)
            ?? throw new InvalidOperationException($"Contact {contactId} not found.");

        // Idempotency: return existing active task rather than creating a duplicate
        var existing = await db.AgentTasks
            .Where(t => t.AgentType  == AgentType
                     && t.ContactId  == contactId
                     && t.TriggerType == triggerType
                     && t.Status != "failed"
                     && t.Status != "rejected")
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (existing != null)
        {
            log.LogInformation("[SalesAgent] Skipping duplicate — contact {ContactId} trigger {Trigger} already has task {Id}",
                contactId, triggerType, existing.Id);
            return existing;
        }

        // Persist the task record immediately — gives us an audit trail even if Claude fails
        var task = new AgentTask
        {
            AgentType    = AgentType,
            TriggerType  = triggerType,
            ContactId    = contact.Id,
            ToAddress    = contact.Email,
            InputSummary = BuildInputSummary(contact),
            Status       = "pending_approval", // always start pending; promoted below on success
        };
        db.AgentTasks.Add(task);
        await db.SaveChangesAsync(ct);

        try
        {
            var draft = await GenerateDraftAsync(contact, ct);

            task.DraftSubject  = draft.Subject;
            task.DraftBody     = draft.Body;
            task.InputTokens   = draft.InputTokens;
            task.OutputTokens  = draft.OutputTokens;

            if (mode == AgentDispatchMode.AutoSend)
            {
                task.FinalSubject = draft.Subject;
                task.FinalBody    = draft.Body;
                task.Status       = "auto_sent";
                task.ApprovedBy   = "auto";
                task.ExecutedAt   = DateTime.UtcNow;

                // Mark contact as contacted so it no longer shows as unhandled
                contact.Status      = "contacted";
                contact.ContactedAt = DateTime.UtcNow;
                contact.UpdatedAt   = DateTime.UtcNow;

                await db.SaveChangesAsync(ct);
                await email.SendAgentEmailAsync(contact.Email, draft.Subject, draft.Body, ct);

                log.LogInformation("[SalesAgent] Auto-sent reply to {Email} (task {Id})",
                    contact.Email, task.Id);
            }
            else
            {
                // Leave status as pending_approval — admin reviews in the queue before sending
                task.Status = "pending_approval";
                await db.SaveChangesAsync(ct);

                log.LogInformation("[SalesAgent] Queued reply for {Email} (task {Id})",
                    contact.Email, task.Id);
            }
        }
        catch (Exception ex)
        {
            task.Status       = "failed";
            task.ErrorMessage = ex.Message;
            await db.SaveChangesAsync(ct);
            log.LogError(ex, "[SalesAgent] Failed for contact {ContactId}", contactId);
        }

        return task;
    }

    public async Task<int> CountUnhandledContactsAsync(CancellationToken ct = default)
    {
        var handledContactIds = await db.AgentTasks
            .Where(t => t.AgentType == AgentType
                     && t.ContactId != null
                     && t.Status != "failed"
                     && t.Status != "rejected")
            .Select(t => t.ContactId!.Value)
            .Distinct()
            .ToListAsync(ct);

        return await db.Contacts
            .Where(c => !c.IsSpam
                     && c.Status == "new"
                     && !handledContactIds.Contains(c.Id))
            .CountAsync(ct);
    }

    public async Task<BatchProcessResult> ProcessUnhandledContactsAsync(CancellationToken ct = default)
    {
        // Snapshot IDs of contacts that already have an active (non-failed, non-rejected) task
        var handledContactIds = await db.AgentTasks
            .Where(t => t.AgentType == AgentType
                     && t.ContactId != null
                     && t.Status != "failed"
                     && t.Status != "rejected")
            .Select(t => t.ContactId!.Value)
            .Distinct()
            .ToListAsync(ct);

        var eligible = await db.Contacts
            .Where(c => !c.IsSpam
                     && c.Status == "new"
                     && !handledContactIds.Contains(c.Id))
            .OrderBy(c => c.CreatedAt)    // oldest first
            .Select(c => c.Id)
            .ToListAsync(ct);

        int queued = 0, skipped = 0, failed = 0;

        foreach (var contactId in eligible)
        {
            if (ct.IsCancellationRequested) break;

            try
            {
                var result = await HandleContactAsync(
                    contactId,
                    AgentDispatchMode.QueueForApproval,
                    "admin_batch",
                    ct);

                if (result.Status == "pending_approval") queued++;
                else if (result.Status == "failed")      failed++;
                else                                     skipped++;

                // Respect Claude API rate limits — pause between calls
                if (eligible.Count > 1)
                    await Task.Delay(700, ct);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                failed++;
                log.LogError(ex, "[SalesAgent] Batch: failed for contact {ContactId}", contactId);
            }
        }

        log.LogInformation(
            "[SalesAgent] Batch complete — total={Total} queued={Queued} failed={Failed} skipped={Skipped}",
            eligible.Count, queued, failed, skipped);

        return new BatchProcessResult(queued, skipped, failed, eligible.Count);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private record DraftResult(string Subject, string Body, int InputTokens, int OutputTokens);

    private async Task<DraftResult> GenerateDraftAsync(
        Contact contact, CancellationToken ct)
    {
        var taskContext = BuildTaskContext(contact);
        var systemPrompt = await contextSvc.BuildSystemPromptAsync(taskContext, ct);

        var userMessage = $"""
            Draft a warm, professional response email to this potential client.

            Client name: {contact.Name}
            Client email: {contact.Email}
            Service interest: {contact.ServiceType ?? "General inquiry"}
            Budget: {contact.Budget ?? "Not specified"}
            Timeline: {contact.Timeline ?? "Not specified"}
            Location: {contact.Location ?? "Not specified"}
            Their message: {contact.Message ?? "No message provided"}

            Requirements:
            - Address the client by first name
            - Acknowledge their specific interest and message
            - Briefly highlight relevant services or past projects
            - Propose a clear next step (site visit / consultation call)
            - Keep it under 200 words, friendly but professional
            - Sign off as "The Wooden Houses Kenya Team"

            Return ONLY valid JSON (no markdown fences) with two keys: "subject" (string) and "body" (string).
            The body should be a complete HTML email with simple inline styles only (no CSS classes).
            """;

        var result = await claude.CompleteAsync(systemPrompt, userMessage, ct);
        var (subject, body) = ParseDraft(result.Text);
        return new DraftResult(subject, body, result.InputTokens, result.OutputTokens);
    }

    private static string BuildInputSummary(Contact c) =>
        $"{c.Name} <{c.Email}> | {c.ServiceType ?? "general"} | budget={c.Budget ?? "?"} | timeline={c.Timeline ?? "?"}";

    private static string BuildTaskContext(Contact c) => $"""
        Trigger: Contact inquiry
        Client name: {c.Name}
        Email: {c.Email}
        Phone: {c.Phone ?? "not provided"}
        Service interest: {c.ServiceType ?? "general inquiry"}
        Budget: {c.Budget ?? "not specified"}
        Timeline: {c.Timeline ?? "not specified"}
        Location: {c.Location ?? "not specified"}
        Message: {c.Message ?? "no message"}
        Submitted: {c.CreatedAt:yyyy-MM-dd HH:mm} UTC
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
        var subject = root.GetProperty("subject").GetString() ?? "Thank you for your inquiry";
        var body    = root.GetProperty("body").GetString()    ?? raw;
        return (subject, body);
    }
}
