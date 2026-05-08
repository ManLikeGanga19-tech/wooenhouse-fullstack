using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.Models;
using WoodenHousesAPI.Services;

namespace WoodenHousesAPI.Controllers.Admin;

[ApiController]
[Route("api/admin/mailbox")]
[Authorize]
public class AdminMailboxController(
    AppDbContext            db,
    IOptions<MailboxConfig> cfg,
    IImapService            imap,
    IEmailService           email,
    ILogger<AdminMailboxController> logger) : ControllerBase
{
    // ── GET /api/admin/mailbox/accounts ──────────────────────────────────────
    [HttpGet("accounts")]
    public IActionResult GetAccounts()
    {
        var accounts = cfg.Value.Accounts
            .Where(a => !string.IsNullOrWhiteSpace(a.Email))
            .Select(a => new
            {
                a.Email,
                a.DisplayName,
                a.Color,
                HasPassword = !string.IsNullOrWhiteSpace(a.Password),
            });
        return Ok(accounts);
    }

    // ── GET /api/admin/mailbox/emails?account=&folder=&page=&q= ─────────────
    [HttpGet("emails")]
    public async Task<IActionResult> GetEmails(
        [FromQuery] string  account,
        [FromQuery] string  folder  = "inbox",
        [FromQuery] int     page    = 1,
        [FromQuery] string? q       = null)
    {
        const int pageSize = 30;

        var query = db.InboxEmails
            .Where(e => e.AccountEmail == account && e.Folder == folder);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var lower = q.ToLower();
            query = query.Where(e =>
                e.Subject.ToLower().Contains(lower) ||
                e.FromAddress.ToLower().Contains(lower) ||
                e.FromName.ToLower().Contains(lower));
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(e => e.ReceivedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new
            {
                e.Id,
                e.AccountEmail,
                e.Folder,
                e.Subject,
                e.FromAddress,
                e.FromName,
                e.ToAddresses,
                e.IsRead,
                e.IsStarred,
                e.HasAttachment,
                e.ReceivedAt,
                Preview = e.TextBody != null
                    ? e.TextBody.Substring(0, Math.Min(160, e.TextBody.Length))
                    : null,
            })
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    // ── GET /api/admin/mailbox/emails/{id} ───────────────────────────────────
    [HttpGet("emails/{id:guid}")]
    public async Task<IActionResult> GetEmail(Guid id)
    {
        var email = await db.InboxEmails.FindAsync(id);
        if (email is null) return NotFound();

        // Auto-mark as read
        if (!email.IsRead)
        {
            email.IsRead = true;
            await db.SaveChangesAsync();
        }

        return Ok(email);
    }

    // ── PATCH /api/admin/mailbox/emails/{id} ─────────────────────────────────
    [HttpPatch("emails/{id:guid}")]
    public async Task<IActionResult> PatchEmail(Guid id, [FromBody] PatchEmailRequest req)
    {
        var em = await db.InboxEmails.FindAsync(id);
        if (em is null) return NotFound();

        if (req.IsRead.HasValue)     em.IsRead     = req.IsRead.Value;
        if (req.IsStarred.HasValue)  em.IsStarred  = req.IsStarred.Value;
        if (req.Folder is not null)  em.Folder     = req.Folder;

        await db.SaveChangesAsync();
        return Ok(new { em.Id, em.IsRead, em.IsStarred, em.Folder });
    }

    // ── DELETE /api/admin/mailbox/emails/{id} ────────────────────────────────
    [HttpDelete("emails/{id:guid}")]
    public async Task<IActionResult> DeleteEmail(Guid id)
    {
        var em = await db.InboxEmails.FindAsync(id);
        if (em is null) return NotFound();
        db.InboxEmails.Remove(em);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ── GET /api/admin/mailbox/counts?account= ───────────────────────────────
    [HttpGet("counts")]
    public async Task<IActionResult> GetCounts([FromQuery] string account)
    {
        var counts = await db.InboxEmails
            .Where(e => e.AccountEmail == account)
            .GroupBy(e => e.Folder)
            .Select(g => new
            {
                Folder   = g.Key,
                Total    = g.Count(),
                Unread   = g.Count(e => !e.IsRead),
            })
            .ToListAsync();

        return Ok(counts);
    }

    // ── POST /api/admin/mailbox/sync ─────────────────────────────────────────
    [HttpPost("sync")]
    public IActionResult ManualSync([FromQuery] string? account = null)
    {
        var accounts = cfg.Value.Accounts;
        if (account is not null)
            accounts = accounts.Where(a => a.Email == account).ToList();

        _ = Task.Run(async () =>
        {
            foreach (var acc in accounts)
            {
                try { await imap.SyncAccountAsync(acc); }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Manual sync failed for {Email}", acc.Email);
                }
            }
        });

        return Accepted(new { message = "Sync started" });
    }

    // ── POST /api/admin/mailbox/compose ──────────────────────────────────────
    [HttpPost("compose")]
    public async Task<IActionResult> Compose([FromBody] ComposeEmailRequest req)
    {
        // Validate the from account exists
        var fromAccount = cfg.Value.Accounts.FirstOrDefault(a => a.Email == req.From);
        if (fromAccount is null)
            return BadRequest(new { error = "Unknown from address" });

        try
        {
            var htmlBody = req.HtmlBody ?? WrapPlainText(req.Body ?? "");
            await email.ComposeEmailAsync(req.From, fromAccount.DisplayName, req.To, req.Subject, htmlBody, req.Cc, req.InReplyTo);

            // Save to Sent folder in our DB
            var sent = new InboxEmail
            {
                AccountEmail = req.From,
                Folder       = "sent",
                Uid          = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                MessageId    = $"<{Guid.NewGuid()}@woodenhouseskenya.com>",
                Subject      = req.Subject,
                FromAddress  = req.From,
                FromName     = fromAccount.DisplayName,
                ToAddresses  = req.To,
                CcAddresses  = req.Cc,
                TextBody     = req.Body,
                HtmlBody     = htmlBody,
                IsRead       = true,
                ReceivedAt   = DateTime.UtcNow,
            };
            db.InboxEmails.Add(sent);
            await db.SaveChangesAsync();

            return Ok(new { message = "Email sent", id = sent.Id });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send compose email from {From} to {To}", req.From, req.To);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    private static string WrapPlainText(string text) =>
        $"<div style=\"font-family:sans-serif;font-size:15px;line-height:1.6;\">{text.Replace("\n", "<br/>")}</div>";
}

// DTOs
public record PatchEmailRequest(bool? IsRead, bool? IsStarred, string? Folder);
public record ComposeEmailRequest(
    string  From,
    string  To,
    string  Subject,
    string? Cc       = null,
    string? Body     = null,
    string? HtmlBody = null,
    string? InReplyTo = null);
