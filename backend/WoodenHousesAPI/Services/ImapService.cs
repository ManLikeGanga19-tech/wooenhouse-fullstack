using MailKit;
using MailKit.Net.Imap;
using MailKit.Search;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.Models;

namespace WoodenHousesAPI.Services;

public interface IImapService
{
    Task SyncAccountAsync(MailboxAccount account, CancellationToken ct = default);
}

public class ImapService(
    AppDbContext         db,
    IOptions<MailboxConfig> cfg,
    ILogger<ImapService> logger) : IImapService
{
    private static readonly string[] FolderNames =
        ["inbox", "sent", "drafts", "junk", "trash"];

    // IMAP folder names vary by provider; we check common names
    private static readonly Dictionary<string, string[]> FolderAliases = new()
    {
        ["inbox"]  = ["INBOX"],
        ["sent"]   = ["Sent", "Sent Messages", "Sent Items", "INBOX.Sent"],
        ["drafts"] = ["Drafts", "Draft", "INBOX.Drafts"],
        ["junk"]   = ["Junk", "Spam", "INBOX.Junk", "Junk Email"],
        ["trash"]  = ["Trash", "Deleted", "Deleted Items", "INBOX.Trash"],
    };

    public async Task SyncAccountAsync(MailboxAccount account, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(account.Password))
        {
            logger.LogWarning("Skipping {Email} — no password configured", account.Email);
            return;
        }

        using var client = new ImapClient();

        // Bypass cPanel self-signed certificate
        client.ServerCertificateValidationCallback = (s, c, h, e) => true;

        try
        {
            await client.ConnectAsync(cfg.Value.ImapHost, cfg.Value.ImapPort, SecureSocketOptions.SslOnConnect, ct);
            await client.AuthenticateAsync(account.Email, account.Password, ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "IMAP connect/auth failed for {Email}", account.Email);
            return;
        }

        foreach (var (folderKey, aliases) in FolderAliases)
        {
            var folder = await OpenFolderAsync(client, aliases, ct);
            if (folder is null) continue;

            try
            {
                await SyncFolderAsync(account.Email, folderKey, folder, ct);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error syncing folder {Folder} for {Email}", folderKey, account.Email);
            }
            finally
            {
                await folder.CloseAsync(false, ct);
            }
        }

        await client.DisconnectAsync(true, ct);
    }

    private static async Task<IMailFolder?> OpenFolderAsync(
        ImapClient client, string[] aliases, CancellationToken ct)
    {
        foreach (var name in aliases)
        {
            try
            {
                var folder = await client.GetFolderAsync(name, ct);
                if (folder is null) continue;
                await folder.OpenAsync(FolderAccess.ReadOnly, ct);
                return folder;
            }
            catch { /* try next alias */ }
        }
        return null;
    }

    private async Task SyncFolderAsync(
        string accountEmail, string folderKey, IMailFolder folder, CancellationToken ct)
    {
        // Fetch the 100 most recent messages
        var count     = folder.Count;
        if (count == 0) return;

        var startIdx  = Math.Max(0, count - 100);
        var endIdx    = count - 1;

        var summaries = await folder.FetchAsync(startIdx, endIdx,
            MessageSummaryItems.UniqueId |
            MessageSummaryItems.Envelope |
            MessageSummaryItems.Flags |
            MessageSummaryItems.Headers, ct);

        foreach (var summary in summaries)
        {
            var uid       = (long)summary.UniqueId.Id;
            var messageId = summary.Envelope?.MessageId ?? string.Empty;

            // Skip if already synced (dedup by uid + account + folder)
            var exists = db.InboxEmails.Any(e =>
                e.AccountEmail == accountEmail &&
                e.Folder       == folderKey    &&
                e.Uid          == uid);

            if (exists) continue;

            // Fetch full message body
            MimeMessage? mime = null;
            try
            {
                mime = await folder.GetMessageAsync(summary.UniqueId, ct);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Could not fetch body for UID {Uid}", uid);
                continue;
            }

            var email = new InboxEmail
            {
                AccountEmail  = accountEmail,
                Folder        = folderKey,
                Uid           = uid,
                MessageId     = messageId,
                Subject       = mime.Subject ?? "(no subject)",
                FromAddress   = mime.From.Mailboxes.FirstOrDefault()?.Address ?? string.Empty,
                FromName      = mime.From.Mailboxes.FirstOrDefault()?.Name    ?? string.Empty,
                ToAddresses   = string.Join(";", mime.To.Mailboxes.Select(m => m.Address)),
                CcAddresses   = mime.Cc.Count > 0
                                    ? string.Join(";", mime.Cc.Mailboxes.Select(m => m.Address))
                                    : null,
                TextBody      = mime.TextBody,
                HtmlBody      = mime.HtmlBody,
                IsRead        = summary.Flags.HasValue && summary.Flags.Value.HasFlag(MessageFlags.Seen),
                HasAttachment = mime.Attachments.Any(),
                ReceivedAt    = mime.Date.UtcDateTime,
                SyncedAt      = DateTime.UtcNow,
            };

            db.InboxEmails.Add(email);
        }

        await db.SaveChangesAsync(ct);
    }
}
