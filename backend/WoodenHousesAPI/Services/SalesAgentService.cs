using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.Models;

namespace WoodenHousesAPI.Services;

public interface ISalesAgentService : IAgentService
{
    Task<AgentTask> HandleNewContactAsync(Guid contactId, CancellationToken ct = default);
}

public class SalesAgentService(
    AppDbContext            db,
    IClaudeService          claude,
    IAgentContextService    contextSvc,
    IEmailService           email,
    ILogger<SalesAgentService> log) : ISalesAgentService
{
    public string AgentType => "sales";

    public async Task<AgentTask> HandleNewContactAsync(Guid contactId, CancellationToken ct = default)
    {
        var contact = await db.Contacts.FindAsync([contactId], ct)
            ?? throw new InvalidOperationException($"Contact {contactId} not found.");

        // Build task record first so we have a persistent log even if Claude fails
        var task = new AgentTask
        {
            AgentType    = AgentType,
            TriggerType  = "contact_form",
            ContactId    = contact.Id,
            ToAddress    = contact.Email,
            InputSummary = BuildInputSummary(contact),
        };
        db.AgentTasks.Add(task);
        await db.SaveChangesAsync(ct);

        try
        {
            var taskContext = BuildTaskContext(contact);
            var systemPrompt = await contextSvc.BuildSystemPromptAsync(taskContext, ct);

            var userMessage = $"""
                A new inquiry has arrived. Draft a warm, professional response email to this potential client.

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
                - Propose a next step (site visit / consultation call)
                - Keep it under 200 words, friendly but professional
                - Sign off as "The Wooden Houses Kenya Team"

                Return ONLY valid JSON (no markdown fences) with two keys: "subject" (string) and "body" (string).
                The body should be a full HTML email with simple inline styles.
                """;

            var raw = await claude.CompleteAsync(systemPrompt, userMessage, ct);
            var (subject, body) = ParseDraft(raw);

            task.DraftSubject = subject;
            task.DraftBody    = body;

            // Auto-send immediately — sales inquiry responses should go out without delay
            task.FinalSubject = subject;
            task.FinalBody    = body;
            task.Status       = "auto_sent";
            task.ApprovedBy   = "auto";
            task.ExecutedAt   = DateTime.UtcNow;

            await db.SaveChangesAsync(ct);

            await email.SendAgentEmailAsync(contact.Email, subject, body, ct);

            log.LogInformation("[SalesAgent] Auto-sent reply to {Email} (task {TaskId})", contact.Email, task.Id);
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

    private static string BuildInputSummary(Contact c) =>
        $"{c.Name} <{c.Email}> | {c.ServiceType ?? "general"} | budget={c.Budget ?? "?"} | timeline={c.Timeline ?? "?"}";

    private static string BuildTaskContext(Contact c) => $"""
        Trigger: New contact form submission
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
        // Strip markdown code fences if Claude wrapped the JSON
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
