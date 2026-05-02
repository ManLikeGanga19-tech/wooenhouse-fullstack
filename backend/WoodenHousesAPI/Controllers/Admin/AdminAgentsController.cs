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
    IQuoteAgentService      quoteAgent,
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
                t.QuoteId,
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

        // Update linked contact status
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

        // For quote agent tasks: flip quote to "sent" and stamp SentAt
        if (task.AgentType == "quote" && task.QuoteId.HasValue)
        {
            var quote = await db.Quotes.FindAsync(task.QuoteId.Value);
            if (quote is not null && quote.Status == "draft")
            {
                quote.Status    = "sent";
                quote.SentAt    = DateTime.UtcNow;
                quote.UpdatedAt = DateTime.UtcNow;
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

    // ─── Quote Agent ─────────────────────────────────────────────────────────

    /// <summary>Generate an AI cover email for a quote and add it to the approval queue.</summary>
    [HttpPost("quotes/{quoteId:guid}/generate-cover")]
    public async Task<IActionResult> GenerateQuoteCover(Guid quoteId, CancellationToken ct)
    {
        var quote = await db.Quotes.FindAsync([quoteId], ct);
        if (quote is null) return NotFound(new { message = "Quote not found." });

        var existing = await db.AgentTasks
            .Where(t => t.QuoteId == quoteId
                     && t.AgentType == "quote"
                     && t.Status != "failed"
                     && t.Status != "rejected")
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (existing is not null)
            return Conflict(new
            {
                message = $"This quote already has an active agent task (status: {existing.Status}).",
                taskId  = existing.Id,
                status  = existing.Status,
            });

        var task       = await quoteAgent.HandleQuoteSendAsync(quoteId, ct);
        var adminEmail = User.Identity?.Name ?? "admin";
        await audit.LogAsync("agent_quote_cover_generated", adminEmail,
            $"Generated AI cover for quote {quoteId} ({quote.QuoteNumber})");

        return Ok(new
        {
            message = "AI cover email drafted and added to the approval queue.",
            taskId  = task.Id,
            status  = task.Status,
        });
    }

    // ─── Follow-up Agent ──────────────────────────────────────────────────────

    /// <summary>Manually trigger the follow-up agent (same logic as the daily scheduler).</summary>
    [HttpPost("run-followups")]
    public IActionResult RunFollowups()
    {
        var adminEmail = User.Identity?.Name ?? "admin";

        _ = Task.Run(async () =>
        {
            using var scope = scopeFactory.CreateScope();
            var agent = scope.ServiceProvider.GetRequiredService<IFollowupAgentService>();
            try
            {
                var result = await agent.RunScheduledFollowupsAsync();
                log.LogInformation(
                    "[AdminAgents] Follow-ups triggered by {Admin} — queued={Q} failed={F}",
                    adminEmail, result.Queued, result.Failed);
            }
            catch (Exception ex)
            {
                log.LogError(ex, "[AdminAgents] Follow-up run failed (triggered by {Admin})", adminEmail);
            }
        });

        return Accepted(new { message = "Follow-up agent started. Drafts will appear in the approval queue shortly." });
    }

    // ─── Accounts Agent ───────────────────────────────────────────────────────

    /// <summary>Manually trigger the accounts agent (same logic as the weekly scheduler).</summary>
    [HttpPost("run-accounts")]
    public IActionResult RunAccounts()
    {
        var adminEmail = User.Identity?.Name ?? "admin";

        _ = Task.Run(async () =>
        {
            using var scope = scopeFactory.CreateScope();
            var agent = scope.ServiceProvider.GetRequiredService<IAccountsAgentService>();
            try
            {
                var result = await agent.RunWeeklyAsync();
                log.LogInformation(
                    "[AdminAgents] Accounts triggered by {Admin} — remindersQueued={R} reportSent={S}",
                    adminEmail, result.PaymentRemindersQueued, result.ReportSent);
            }
            catch (Exception ex)
            {
                log.LogError(ex, "[AdminAgents] Accounts run failed (triggered by {Admin})", adminEmail);
            }
        });

        return Accepted(new { message = "Accounts agent started. Payment reminders and weekly report are being prepared." });
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

    // ─── Context File Upload ──────────────────────────────────────────────────

    /// <summary>Upload a document (.txt, .md, .pdf) to the agent context knowledge base.</summary>
    [HttpPost("context/upload")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
    public async Task<IActionResult> UploadContextFile(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "No file provided." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext is not (".txt" or ".md" or ".pdf"))
            return BadRequest(new { message = "Only .txt, .md, and .pdf files are supported." });

        string text;
        try
        {
            text = ext == ".pdf"
                ? ExtractPdfText(file)
                : await ReadTextFileAsync(file, ct);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Could not read file: {ex.Message}" });
        }

        if (string.IsNullOrWhiteSpace(text))
            return BadRequest(new { message = "The file appears to be empty or contains no readable text." });

        // Cap at 50,000 characters to avoid overwhelming the prompt
        if (text.Length > 50_000)
            text = text[..50_000] + "\n\n[Content truncated at 50,000 characters]";

        var slug  = Path.GetFileNameWithoutExtension(file.FileName)
                        .ToLowerInvariant()
                        .Replace(" ", "_")
                        .Replace("-", "_");
        var key   = $"upload_{slug}_{Guid.NewGuid():N}"[..40]; // ensure uniqueness, max 40 chars
        var label = Path.GetFileName(file.FileName);

        var row = new AgentContext
        {
            Key       = key,
            Label     = label,
            Value     = text,
            Hint      = $"Uploaded file ({ext.TrimStart('.')}). {text.Length:N0} characters.",
            SortOrder = 999,
            UpdatedAt = DateTime.UtcNow,
        };
        db.AgentContexts.Add(row);
        await db.SaveChangesAsync(ct);

        var adminEmail = User.Identity?.Name ?? "admin";
        await audit.LogAsync("agent_context_file_uploaded", adminEmail, $"Uploaded file '{label}' as context key '{key}'");

        return Ok(row);
    }

    private static string ExtractPdfText(IFormFile file)
    {
        using var stream = file.OpenReadStream();
        using var ms     = new MemoryStream();
        stream.CopyTo(ms);

        using var pdf = UglyToad.PdfPig.PdfDocument.Open(ms.ToArray());
        var sb = new System.Text.StringBuilder();
        foreach (var page in pdf.GetPages())
        {
            sb.AppendLine(page.Text);
        }
        return sb.ToString();
    }

    private static async Task<string> ReadTextFileAsync(IFormFile file, CancellationToken ct)
    {
        using var reader = new StreamReader(file.OpenReadStream());
        return await reader.ReadToEndAsync(ct);
    }

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

    // ─── Health / Telemetry ───────────────────────────────────────────────────

    [HttpGet("health")]
    public async Task<IActionResult> GetHealth()
    {
        var now       = DateTime.UtcNow;
        var todayUtc  = now.Date;
        var weekAgo   = now.AddDays(-7);

        // ── System metrics ──────────────────────────────────────────────────
        var proc    = System.Diagnostics.Process.GetCurrentProcess();
        var uptimeSec = (now - proc.StartTime.ToUniversalTime()).TotalSeconds;
        var memoryMb  = proc.WorkingSet64 / 1024.0 / 1024.0;

        // CPU %: average since process start across all logical CPUs
        var cpuPercent = proc.TotalProcessorTime.TotalSeconds
            / (uptimeSec * Environment.ProcessorCount) * 100.0;

        // ── Token aggregates ────────────────────────────────────────────────
        var tokenAgg = await db.AgentTasks
            .Where(t => t.InputTokens > 0 || t.OutputTokens > 0)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                InputTotal   = (long)g.Sum(t => t.InputTokens),
                OutputTotal  = (long)g.Sum(t => t.OutputTokens),
            })
            .FirstOrDefaultAsync();

        var tokenAggToday = await db.AgentTasks
            .Where(t => t.CreatedAt >= todayUtc && (t.InputTokens > 0 || t.OutputTokens > 0))
            .GroupBy(_ => 1)
            .Select(g => new
            {
                InputTotal  = (long)g.Sum(t => t.InputTokens),
                OutputTotal = (long)g.Sum(t => t.OutputTokens),
            })
            .FirstOrDefaultAsync();

        var tokenAggWeek = await db.AgentTasks
            .Where(t => t.CreatedAt >= weekAgo && (t.InputTokens > 0 || t.OutputTokens > 0))
            .GroupBy(_ => 1)
            .Select(g => new
            {
                InputTotal  = (long)g.Sum(t => t.InputTokens),
                OutputTotal = (long)g.Sum(t => t.OutputTokens),
            })
            .FirstOrDefaultAsync();

        // Sonnet 4.6 pricing: $3/M input, $15/M output
        static double EstimateCost(long input, long output) =>
            input * 0.000003 + output * 0.000015;

        // ── Per-agent stats ─────────────────────────────────────────────────
        var agentTypes = new[]
        {
            new { Type = "sales",    Name = "Sales Agent",    Description = "Responds to new contact inquiries",      Schedule = "On contact form submission" },
            new { Type = "quote",    Name = "Quote Agent",    Description = "Drafts cover emails for client quotes",   Schedule = "On quote generation" },
            new { Type = "followup", Name = "Follow-up Agent",Description = "Follows up unanswered contacts & quotes", Schedule = "Daily at 08:00 EAT" },
            new { Type = "accounts", Name = "Accounts Agent", Description = "Payment reminders & weekly report",       Schedule = "Every Monday at 09:00 EAT" },
        };

        var taskStats = await db.AgentTasks
            .GroupBy(t => t.AgentType)
            .Select(g => new
            {
                AgentType      = g.Key,
                Total          = g.Count(),
                Pending        = g.Count(t => t.Status == "pending_approval"),
                AutoSent       = g.Count(t => t.Status == "auto_sent"),
                Approved       = g.Count(t => t.Status == "approved"),
                Rejected       = g.Count(t => t.Status == "rejected"),
                Failed         = g.Count(t => t.Status == "failed"),
                TodayCount     = g.Count(t => t.CreatedAt >= todayUtc),
                WeekCount      = g.Count(t => t.CreatedAt >= weekAgo),
                LastRunAt      = g.Max(t => (DateTime?)t.CreatedAt),
                InputTokens    = (long)g.Sum(t => t.InputTokens),
                OutputTokens   = (long)g.Sum(t => t.OutputTokens),
            })
            .ToListAsync();

        var agents = agentTypes.Select(a =>
        {
            var s = taskStats.FirstOrDefault(x => x.AgentType == a.Type);
            return new
            {
                a.Type,
                a.Name,
                a.Description,
                a.Schedule,
                Stats = new
                {
                    Total        = s?.Total        ?? 0,
                    Pending      = s?.Pending      ?? 0,
                    AutoSent     = s?.AutoSent     ?? 0,
                    Approved     = s?.Approved     ?? 0,
                    Rejected     = s?.Rejected     ?? 0,
                    Failed       = s?.Failed       ?? 0,
                    TodayCount   = s?.TodayCount   ?? 0,
                    WeekCount    = s?.WeekCount    ?? 0,
                    LastRunAt    = s?.LastRunAt,
                    InputTokens  = s?.InputTokens  ?? 0L,
                    OutputTokens = s?.OutputTokens ?? 0L,
                    EstCost      = EstimateCost(s?.InputTokens ?? 0L, s?.OutputTokens ?? 0L),
                },
            };
        });

        return Ok(new
        {
            GeneratedAt = now,
            System = new
            {
                UptimeSeconds = (long)uptimeSec,
                MemoryMb      = Math.Round(memoryMb, 1),
                CpuPercent    = Math.Round(Math.Min(cpuPercent, 100.0), 1),
                Processors    = Environment.ProcessorCount,
            },
            Tokens = new
            {
                Today = new
                {
                    Input     = tokenAggToday?.InputTotal   ?? 0L,
                    Output    = tokenAggToday?.OutputTotal  ?? 0L,
                    Total     = (tokenAggToday?.InputTotal  ?? 0L) + (tokenAggToday?.OutputTotal ?? 0L),
                    EstCostUsd = EstimateCost(tokenAggToday?.InputTotal ?? 0L, tokenAggToday?.OutputTotal ?? 0L),
                },
                Week = new
                {
                    Input     = tokenAggWeek?.InputTotal   ?? 0L,
                    Output    = tokenAggWeek?.OutputTotal  ?? 0L,
                    Total     = (tokenAggWeek?.InputTotal  ?? 0L) + (tokenAggWeek?.OutputTotal ?? 0L),
                    EstCostUsd = EstimateCost(tokenAggWeek?.InputTotal ?? 0L, tokenAggWeek?.OutputTotal ?? 0L),
                },
                AllTime = new
                {
                    Input     = tokenAgg?.InputTotal   ?? 0L,
                    Output    = tokenAgg?.OutputTotal  ?? 0L,
                    Total     = (tokenAgg?.InputTotal  ?? 0L) + (tokenAgg?.OutputTotal ?? 0L),
                    EstCostUsd = EstimateCost(tokenAgg?.InputTotal ?? 0L, tokenAgg?.OutputTotal ?? 0L),
                },
            },
            Agents = agents,
        });
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
