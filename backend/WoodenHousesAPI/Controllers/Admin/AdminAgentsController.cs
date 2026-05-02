using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.Models;
using WoodenHousesAPI.Services;

namespace WoodenHousesAPI.Controllers.Admin;

[ApiController]
[Route("api/admin/agents")]
[Authorize]
public class AdminAgentsController(
    AppDbContext            db,
    IEmailService           email,
    IAuditService           audit,
    ISalesAgentService      salesAgent,
    IServiceScopeFactory    scopeFactory,
    ILogger<AdminAgentsController> log) : ControllerBase
{
    // ─── Agent Tasks ─────────────────────────────────────────────────────────

    [HttpGet("tasks")]
    public async Task<IActionResult> GetTasks(
        [FromQuery] string? status,
        [FromQuery] string? agentType,
        [FromQuery] int page     = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = db.AgentTasks
            .Include(t => t.Contact)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(t => t.Status == status);

        if (!string.IsNullOrWhiteSpace(agentType))
            query = query.Where(t => t.AgentType == agentType);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new
            {
                t.Id,
                t.AgentType,
                t.TriggerType,
                t.Status,
                t.ContactId,
                ContactName  = t.Contact != null ? t.Contact.Name : null,
                ContactEmail = t.Contact != null ? t.Contact.Email : null,
                t.ToAddress,
                t.InputSummary,
                t.DraftSubject,
                t.DraftBody,
                t.FinalSubject,
                t.FinalBody,
                t.ErrorMessage,
                t.ApprovedBy,
                t.RejectedBy,
                t.RejectionNote,
                t.CreatedAt,
                t.ExecutedAt,
            })
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("tasks/{id:guid}")]
    public async Task<IActionResult> GetTask(Guid id)
    {
        var task = await db.AgentTasks
            .Include(t => t.Contact)
            .Include(t => t.Quote)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (task is null) return NotFound();

        return Ok(new
        {
            task.Id,
            task.AgentType,
            task.TriggerType,
            task.Status,
            task.ContactId,
            ContactName  = task.Contact?.Name,
            ContactEmail = task.Contact?.Email,
            task.QuoteId,
            task.ToAddress,
            task.InputSummary,
            task.DraftSubject,
            task.DraftBody,
            task.FinalSubject,
            task.FinalBody,
            task.ErrorMessage,
            task.ApprovedBy,
            task.RejectedBy,
            task.RejectionNote,
            task.CreatedAt,
            task.ExecutedAt,
        });
    }

    // ─── Approval Queue ───────────────────────────────────────────────────────

    [HttpGet("queue")]
    public async Task<IActionResult> GetQueue()
    {
        var items = await db.AgentTasks
            .Include(t => t.Contact)
            .Where(t => t.Status == "pending_approval")
            .OrderBy(t => t.CreatedAt)
            .Select(t => new
            {
                t.Id,
                t.AgentType,
                t.TriggerType,
                t.ContactId,
                ContactName  = t.Contact != null ? t.Contact.Name : null,
                ContactEmail = t.Contact != null ? t.Contact.Email : null,
                t.ToAddress,
                t.DraftSubject,
                t.DraftBody,
                t.CreatedAt,
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost("tasks/{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveTaskRequest req)
    {
        var task = await db.AgentTasks.FindAsync(id);
        if (task is null) return NotFound();
        if (task.Status != "pending_approval")
            return BadRequest(new { message = "Task is not pending approval." });

        var adminEmail = User.Identity?.Name ?? "admin";

        task.FinalSubject = string.IsNullOrWhiteSpace(req.Subject) ? task.DraftSubject : req.Subject;
        task.FinalBody    = string.IsNullOrWhiteSpace(req.Body)    ? task.DraftBody    : req.Body;
        task.Status       = "approved";
        task.ApprovedBy   = adminEmail;
        task.ExecutedAt   = DateTime.UtcNow;

        await db.SaveChangesAsync();

        // Send the email
        try
        {
            await email.SendAgentEmailAsync(task.ToAddress!, task.FinalSubject, task.FinalBody);
        }
        catch (Exception ex)
        {
            task.Status       = "failed";
            task.ErrorMessage = ex.Message;
            await db.SaveChangesAsync();
            return StatusCode(502, new { message = $"Email send failed: {ex.Message}" });
        }

        // Update the linked contact status so it no longer appears as unhandled
        if (task.ContactId.HasValue)
        {
            var contact = await db.Contacts.FindAsync(task.ContactId.Value);
            if (contact is not null && contact.Status == "new")
            {
                contact.Status      = "contacted";
                contact.ContactedAt = DateTime.UtcNow;
                contact.UpdatedAt   = DateTime.UtcNow;
                await db.SaveChangesAsync();
            }
        }

        await audit.LogAsync("agent_task_approved", adminEmail,
            $"Approved agent task {id} ({task.AgentType})");

        return Ok(new { message = "Approved and sent." });
    }

    [HttpPost("tasks/{id:guid}/reject")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectTaskRequest req)
    {
        var task = await db.AgentTasks.FindAsync(id);
        if (task is null) return NotFound();
        if (task.Status != "pending_approval")
            return BadRequest(new { message = "Task is not pending approval." });

        var adminEmail = User.Identity?.Name ?? "admin";

        task.Status        = "rejected";
        task.RejectedBy    = adminEmail;
        task.RejectionNote = req.Note;

        await db.SaveChangesAsync();

        await audit.LogAsync("agent_task_rejected", adminEmail,
            $"Rejected agent task {id} ({task.AgentType}): {req.Note}");

        return Ok(new { message = "Task rejected." });
    }

    // ─── Backlog Processing ───────────────────────────────────────────────────

    /// <summary>
    /// Returns the number of "new" non-spam contacts that have no active agent task.
    /// Used by the dashboard to show how many contacts are waiting for a reply.
    /// </summary>
    [HttpGet("unprocessed-count")]
    public async Task<IActionResult> GetUnprocessedCount(CancellationToken ct)
    {
        var count = await salesAgent.CountUnhandledContactsAsync(ct);
        return Ok(new { count });
    }

    /// <summary>
    /// Queues AI-drafted replies for all unhandled "new" contacts.
    /// Runs in the background — returns 202 immediately.
    /// Each draft lands in the approval queue for admin review before sending.
    /// </summary>
    [HttpPost("process-new-contacts")]
    public IActionResult ProcessNewContacts()
    {
        var adminEmail = User.Identity?.Name ?? "admin";

        _ = Task.Run(async () =>
        {
            // Use a fresh DI scope so the DbContext isn't shared with the HTTP request scope
            using var scope = scopeFactory.CreateScope();
            var agent = scope.ServiceProvider.GetRequiredService<ISalesAgentService>();

            try
            {
                var result = await agent.ProcessUnhandledContactsAsync();
                log.LogInformation(
                    "[AdminAgents] Batch triggered by {Admin} — queued={Queued} failed={Failed} skipped={Skipped}",
                    adminEmail, result.Queued, result.Failed, result.Skipped);
            }
            catch (Exception ex)
            {
                log.LogError(ex, "[AdminAgents] Batch processing failed (triggered by {Admin})", adminEmail);
            }
        });

        return Accepted(new { message = "Processing started. Check the approval queue in a moment." });
    }

    /// <summary>
    /// Generate a reply for a single existing contact and add it to the approval queue.
    /// </summary>
    [HttpPost("contacts/{contactId:guid}/generate-reply")]
    public async Task<IActionResult> GenerateReply(Guid contactId, CancellationToken ct)
    {
        var contact = await db.Contacts.FindAsync([contactId], ct);
        if (contact is null) return NotFound(new { message = "Contact not found." });

        if (contact.IsSpam)
            return BadRequest(new { message = "Cannot generate a reply for a spam contact." });

        // Check for an already-active task so we don't create duplicates
        var existing = await db.AgentTasks
            .Where(t => t.ContactId == contactId
                     && t.AgentType == "sales"
                     && t.Status != "failed"
                     && t.Status != "rejected")
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (existing is not null)
            return Conflict(new
            {
                message = $"This contact already has an active agent task (status: {existing.Status}).",
                taskId  = existing.Id,
                status  = existing.Status,
            });

        var task = await salesAgent.HandleContactAsync(
            contactId,
            AgentDispatchMode.QueueForApproval,
            "admin_manual",
            ct);

        var adminEmail = User.Identity?.Name ?? "admin";
        await audit.LogAsync("agent_reply_generated", adminEmail,
            $"Generated reply for contact {contactId} ({contact.Name})");

        return Ok(new
        {
            message = "Reply drafted and added to the approval queue.",
            taskId  = task.Id,
            status  = task.Status,
        });
    }

    // ─── Metrics ─────────────────────────────────────────────────────────────

    [HttpGet("metrics")]
    public async Task<IActionResult> GetMetrics()
    {
        var now   = DateTime.UtcNow;
        var day   = now.AddDays(-1);
        var week  = now.AddDays(-7);
        var month = now.AddDays(-30);

        var tasks = await db.AgentTasks.ToListAsync();

        var totalToday  = tasks.Count(t => t.CreatedAt >= day);
        var totalWeek   = tasks.Count(t => t.CreatedAt >= week);
        var totalMonth  = tasks.Count(t => t.CreatedAt >= month);
        var pending     = tasks.Count(t => t.Status == "pending_approval");
        var autoSent    = tasks.Count(t => t.Status == "auto_sent");
        var approved    = tasks.Count(t => t.Status == "approved");
        var rejected    = tasks.Count(t => t.Status == "rejected");
        var failed      = tasks.Count(t => t.Status == "failed");

        var byType = tasks
            .GroupBy(t => t.AgentType)
            .Select(g => new { agentType = g.Key, count = g.Count() })
            .ToList();

        return Ok(new
        {
            totalToday,
            totalWeek,
            totalMonth,
            pending,
            autoSent,
            approved,
            rejected,
            failed,
            byType,
        });
    }

    // ─── Agent Context ────────────────────────────────────────────────────────

    [HttpGet("context")]
    public async Task<IActionResult> GetContext()
    {
        var rows = await db.AgentContexts
            .OrderBy(c => c.SortOrder)
            .ToListAsync();

        return Ok(rows);
    }

    [HttpPut("context/{key}")]
    public async Task<IActionResult> UpdateContext(string key, [FromBody] UpdateContextRequest req)
    {
        var row = await db.AgentContexts.FindAsync(key);
        if (row is null) return NotFound();

        row.Value     = req.Value;
        row.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();

        var adminEmail = User.Identity?.Name ?? "admin";
        await audit.LogAsync("agent_context_updated", adminEmail,
            $"Updated agent context key '{key}'");

        return Ok(row);
    }

    [HttpPost("context")]
    public async Task<IActionResult> CreateContext([FromBody] CreateContextRequest req)
    {
        if (await db.AgentContexts.AnyAsync(c => c.Key == req.Key))
            return Conflict(new { message = "A context entry with that key already exists." });

        var row = new AgentContext
        {
            Key       = req.Key,
            Label     = req.Label,
            Value     = req.Value,
            Hint      = req.Hint,
            SortOrder = req.SortOrder,
            UpdatedAt = DateTime.UtcNow,
        };
        db.AgentContexts.Add(row);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetContext), new { }, row);
    }

    [HttpDelete("context/{key}")]
    public async Task<IActionResult> DeleteContext(string key)
    {
        var row = await db.AgentContexts.FindAsync(key);
        if (row is null) return NotFound();

        db.AgentContexts.Remove(row);
        await db.SaveChangesAsync();

        var adminEmail = User.Identity?.Name ?? "admin";
        await audit.LogAsync("agent_context_deleted", adminEmail,
            $"Deleted agent context key '{key}'");

        return NoContent();
    }
}

// ─── Request DTOs ─────────────────────────────────────────────────────────────

public record ApproveTaskRequest(string? Subject, string? Body);
public record RejectTaskRequest(string? Note);
public record UpdateContextRequest(string Value);
public record CreateContextRequest(
    string Key,
    string Label,
    string Value,
    string? Hint,
    int SortOrder = 0);
