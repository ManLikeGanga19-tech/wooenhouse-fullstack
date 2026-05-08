using MailKit;
using MailKit.Net.Imap;
using MailKit.Search;
using MailKit.Security;
using Microsoft.EntityFrameworkCore;
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
    AppDbContext            db,
    IOptions<MailboxConfig> cfg,
    ILogger<ImapService>    logger) : IImapService
{
    private const int BatchSize = 25; // fetch bodies in batches to stay memory-friendly

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

        // Hard per-account timeout so a bad connection never stalls the whole sync cycle
        using var perAccountCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        perAccountCts.CancelAfter(TimeSpan.FromSeconds(30));
        var token = perAccountCts.Token;

        using var client = new ImapClient();
        client.Timeout = 20_000; // 20 s socket-level timeout
        client.ServerCertificateValidationCallback = (s, c, h, e) => true; // bypass hosting self-signed cert

        try
        {
            await client.ConnectAsync(cfg.Value.ImapHost, cfg.Value.ImapPort, SecureSocketOptions.SslOnConnect, token);
            await client.AuthenticateAsync(account.Email, account.Password, token);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "IMAP connect/auth failed for {Email} on {Host}:{Port} — {Msg}",
                account.Email, cfg.Value.ImapHost, cfg.Value.ImapPort, ex.Message);
            return;
        }

        foreach (var (folderKey, aliases) in FolderAliases)
        {
            if (token.IsCancellationRequested) break;

            var folder = await OpenFolderAsync(client, aliases, token);
            if (folder is null) continue;

            try
            {
                await SyncFolderAsync(account.Email, folderKey, folder, token);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error syncing {Folder} for {Email}", folderKey, account.Email);
            }
            finally
            {
                await folder.CloseAsync(false, CancellationToken.None);
            }
        }

        await client.DisconnectAsync(true, CancellationToken.None);
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
        if (folder.Count == 0) return;

        // Find highest UID already stored for this account+folder
        var lastUid = await db.InboxEmails
            .Where(e => e.AccountEmail == accountEmail && e.Folder == folderKey)
            .MaxAsync(e => (long?)e.Uid, ct);

        IList<UniqueId> uids;

        if (lastUid == null)
        {
            // First ever sync — pull full history
            logger.LogInformation("Full historical sync: {Email}/{Folder} ({Count} messages)",
                accountEmail, folderKey, folder.Count);
            uids = await folder.SearchAsync(SearchQuery.All, ct);
        }
        else
        {
            // Delta sync — only UIDs newer than the last one we have
            var nextUid = new UniqueId((uint)lastUid.Value + 1);
            uids = await folder.SearchAsync(
                SearchQuery.Uids(new UniqueIdRange(nextUid, UniqueId.MaxValue)), ct);

            if (uids.Count == 0)
            {
                logger.LogDebug("No new messages in {Email}/{Folder}", accountEmail, folderKey);
                return;
            }
            logger.LogInformation("Delta sync: {Email}/{Folder} — {Count} new",
                accountEmail, folderKey, uids.Count);
        }

        // Process in batches so we don't load all bodies at once
        for (int i = 0; i < uids.Count; i += BatchSize)
        {
            if (ct.IsCancellationRequested) break;
            var batch = uids.Skip(i).Take(BatchSize).ToList();
            await ProcessBatchAsync(accountEmail, folderKey, folder, batch, ct);
        }
    }

    private async Task ProcessBatchAsync(
        string accountEmail, string folderKey,
        IMailFolder folder, List<UniqueId> batch, CancellationToken ct)
    {
        // Fetch summaries (flags + envelope) for the whole batch in one round-trip
        var summaries = await folder.FetchAsync(batch,
            MessageSummaryItems.UniqueId |
            MessageSummaryItems.Envelope |
            MessageSummaryItems.Flags, ct);

        // Build set of UIDs already in DB for this batch (defensive dedup)
        var batchUids = batch.Select(u => (long)u.Id).ToHashSet();
        var existingList = await db.InboxEmails
            .Where(e => e.AccountEmail == accountEmail &&
                        e.Folder       == folderKey    &&
                        batchUids.Contains(e.Uid))
            .Select(e => e.Uid)
            .ToListAsync(ct);
        var existing = existingList.ToHashSet();

        foreach (var summary in summaries)
        {
            if (ct.IsCancellationRequested) break;

            var uid = (long)summary.UniqueId.Id;
            if (existing.Contains(uid)) continue;

            MimeMessage? mime = null;
            try
            {
                mime = await folder.GetMessageAsync(summary.UniqueId, ct);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Could not fetch body for UID {Uid} in {Email}/{Folder}",
                    uid, accountEmail, folderKey);
                continue;
            }

            db.InboxEmails.Add(new InboxEmail
            {
                AccountEmail  = accountEmail,
                Folder        = folderKey,
                Uid           = uid,
                MessageId     = summary.Envelope?.MessageId ?? string.Empty,
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
            });
        }

        await db.SaveChangesAsync(ct);
    }
}
