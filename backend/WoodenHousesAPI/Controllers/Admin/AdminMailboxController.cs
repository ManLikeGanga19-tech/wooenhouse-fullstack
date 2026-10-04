using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MimeKit;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.Models;
using WoodenHousesAPI.Services;

using static WoodenHousesAPI.Common.LogSanitizer;
namespace WoodenHousesAPI.Controllers.Admin;

[ApiController]
[Route("api/admin/mailbox")]
[Authorize]
public class AdminMailboxController(
    AppDbContext            db,
    IOptions<MailboxConfig> cfg,
    IImapService            imap,
    MailboxSyncService      syncService,
    IEmailService           email,
    ILogger<AdminMailboxController> logger) : ControllerBase
{
    // ── GET /api/admin/mailbox/accounts ──────────────────────────────────────
    [HttpGet("accounts")]
    public async Task<IActionResult> GetAccounts()
    {
        var statuses = await db.MailboxAccountStatuses.AsNoTracking()
            .ToDictionaryAsync(s => s.AccountEmail, StringComparer.OrdinalIgnoreCase);

        var accounts = cfg.Value.Accounts
            .Where(a => !string.IsNullOrWhiteSpace(a.Email))
            .Select(a =>
            {
                statuses.TryGetValue(a.Email, out var st);
                return new
                {
                    a.Email,
                    a.DisplayName,
                    a.Color,
                    HasPassword   = !string.IsNullOrWhiteSpace(a.Password),
                    LastSyncedAt  = st?.LastSuccessAt,
                    LastAttemptAt = st?.LastAttemptAt,
                    SyncError     = st?.LastError,
                };
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

        // Auto-mark as read — here and on the server, so Outlook shows it read too
        if (!email.IsRead)
        {
            try { await imap.SetFlagsAsync(email, isRead: true, isStarred: null); }
            catch (Exception ex)
            {
                // Opening an email shouldn't fail because the mail server is slow;
                // the next sync restores the server's state if this didn't land.
                logger.LogWarning(ex, "Could not mark email {Id} read on the server", id);
            }
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
        if (req.Folder is not null && !MailboxFolders.All.Contains(req.Folder))
            return BadRequest(new { error = "Unknown folder" });

        // The mail server is the source of truth: change it first, and only
        // record the change here if it succeeded, so Outlook and the dashboard
        // can't drift apart.
        try
        {
            if (req.IsRead.HasValue || req.IsStarred.HasValue)
                await imap.SetFlagsAsync(em, req.IsRead, req.IsStarred);
            if (req.Folder is not null)
                await imap.MoveAsync(em, req.Folder);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Mailbox update failed on the server for email {Id}", id);
            return StatusCode(502, new { error = "Couldn't update the mail server — please try again" });
        }

        if (req.IsRead.HasValue)     em.IsRead     = req.IsRead.Value;
        if (req.IsStarred.HasValue)  em.IsStarred  = req.IsStarred.Value;

        await db.SaveChangesAsync();
        return Ok(new { em.Id, em.IsRead, em.IsStarred, em.Folder });
    }

    // ── DELETE /api/admin/mailbox/emails/{id} ────────────────────────────────
    [HttpDelete("emails/{id:guid}")]
    public async Task<IActionResult> DeleteEmail(Guid id)
    {
        var em = await db.InboxEmails.FindAsync(id);
        if (em is null) return NotFound();

        // Same as Outlook: delete moves to Trash; deleting from Trash is permanent.
        try
        {
            if (em.Folder != MailboxFolders.Trash)
                await imap.MoveAsync(em, MailboxFolders.Trash);
            else
            {
                await imap.DeleteAsync(em);
                db.InboxEmails.Remove(em);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Mailbox delete failed on the server for email {Id}", id);
            return StatusCode(502, new { error = "Couldn't delete on the mail server — please try again" });
        }

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
        if (account is not null && !cfg.Value.Accounts.Any(a => a.Email == account))
            return BadRequest(new { error = "Unknown account" });

        syncService.RequestSync(account);
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

            // Resend only delivers the message; also file a copy in the mailbox's
            // Sent folder on the server so it shows in Outlook's Sent Items.
            var messageId = $"{Guid.NewGuid()}@woodenhouseskenya.com";
            (string FolderPath, long? Uid)? appended = null;
            try
            {
                var copy = BuildSentCopy(req, fromAccount.DisplayName, htmlBody, messageId);
                appended = await imap.AppendSentAsync(fromAccount, copy);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Email sent but the Sent copy couldn't be saved on the server for {From}", MaskEmail(req.From));
            }

            // Show it in Sent straight away. With no UID yet the next sync adopts
            // the server copy by Message-ID instead of listing it twice.
            var sent = new InboxEmail
            {
                AccountEmail = req.From,
                Folder       = MailboxFolders.Sent,
                FolderPath   = appended?.FolderPath ?? string.Empty,
                Uid          = appended?.Uid,
                MessageId    = messageId,
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
            logger.LogError(ex, "Failed to send compose email from {From} to {To}", MaskEmail(req.From), MaskEmail(req.To));
            return StatusCode(500, new { error = ex.Message });
        }
    }

    private static MimeMessage BuildSentCopy(ComposeEmailRequest req, string displayName, string htmlBody, string messageId)
    {
        var msg = new MimeMessage
        {
            Subject   = req.Subject,
            MessageId = messageId,
            Date      = DateTimeOffset.UtcNow,
            Body      = new BodyBuilder { HtmlBody = htmlBody, TextBody = req.Body }.ToMessageBody(),
        };
        msg.From.Add(new MailboxAddress(displayName, req.From));
        msg.To.AddRange(InternetAddressList.Parse(req.To));
        if (!string.IsNullOrWhiteSpace(req.Cc))        msg.Cc.AddRange(InternetAddressList.Parse(req.Cc));
        if (!string.IsNullOrWhiteSpace(req.InReplyTo)) msg.InReplyTo = req.InReplyTo;
        return msg;
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
