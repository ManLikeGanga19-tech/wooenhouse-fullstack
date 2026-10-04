using MailKit;
using MailKit.Net.Imap;
using MailKit.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MimeKit;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.Models;

using static WoodenHousesAPI.Common.LogSanitizer;
namespace WoodenHousesAPI.Services;

public interface IImapService
{
    /// <summary>Brings the stored copy of every dashboard folder in line with the server.</summary>
    Task SyncAccountAsync(MailboxAccount account, CancellationToken ct = default);

    /// <summary>Pushes read / starred changes to the server (\Seen / \Flagged).</summary>
    Task SetFlagsAsync(InboxEmail email, bool? isRead, bool? isStarred, CancellationToken ct = default);

    /// <summary>Moves the message on the server and updates the entity; caller saves.</summary>
    Task MoveAsync(InboxEmail email, string targetFolder, CancellationToken ct = default);

    /// <summary>Permanently deletes the message on the server.</summary>
    Task DeleteAsync(InboxEmail email, CancellationToken ct = default);

    /// <summary>Saves a copy of a sent message into the account's Sent folder on the server.</summary>
    Task<(string FolderPath, long? Uid)?> AppendSentAsync(MailboxAccount account, MimeMessage message, CancellationToken ct = default);
}

public class ImapService(
    AppDbContext            db,
    IOptions<MailboxConfig> cfg,
    ILogger<ImapService>    logger) : IImapService
{
    private const int BatchSize  = 25;  // fetch bodies in batches to stay memory-friendly
    private const int UpdateSize = 200; // rows loaded at once when applying flag changes / removals

    // ── Sync ─────────────────────────────────────────────────────────────────

    public async Task SyncAccountAsync(MailboxAccount account, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(account.Password))
        {
            logger.LogWarning("Skipping {Email} — no password configured", MaskEmail(account.Email));
            await RecordStatusAsync(account.Email, success: false, "No password configured on the server");
            return;
        }

        // Hard per-account timeout so a bad connection never stalls the whole sync cycle
        using var perAccountCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        perAccountCts.CancelAfter(TimeSpan.FromSeconds(cfg.Value.SyncTimeoutSeconds));
        var token = perAccountCts.Token;

        string? folderError = null;
        try
        {
            using var client = await ConnectAsync(account, token);
            var folders = await DiscoverFoldersAsync(client, token);

            foreach (var (folder, folderKey) in folders)
            {
                if (token.IsCancellationRequested) break;
                try
                {
                    await folder.OpenAsync(FolderAccess.ReadOnly, token);
                    await SyncFolderAsync(account.Email, folderKey, folder, token);
                }
                catch (Exception ex) when (!ct.IsCancellationRequested)
                {
                    db.ChangeTracker.Clear();
                    folderError ??= $"{folder.FullName}: {ex.Message}";
                    logger.LogError(ex, "Error syncing {Folder} for {Email}", folder.FullName, MaskEmail(account.Email));
                }
                finally
                {
                    if (folder.IsOpen) await folder.CloseAsync(false, CancellationToken.None);
                }
            }

            // Folders deleted or renamed on the server take their messages with them
            if (!token.IsCancellationRequested)
                await RemoveVanishedFoldersAsync(account.Email, folders.Select(f => f.Folder.FullName).ToList());

            await client.DisconnectAsync(true, CancellationToken.None);

            if (token.IsCancellationRequested && !ct.IsCancellationRequested)
                folderError = $"Sync did not finish within {cfg.Value.SyncTimeoutSeconds}s; it will resume next cycle";

            await RecordStatusAsync(account.Email, success: folderError is null, folderError);
        }
        catch (Exception ex) when (!ct.IsCancellationRequested)
        {
            logger.LogError(ex, "IMAP sync failed for {Email} on {Host}:{Port} — {Msg}",
                MaskEmail(account.Email), cfg.Value.ImapHost, cfg.Value.ImapPort, Clean(ex.Message));
            await RecordStatusAsync(account.Email, success: false, ex.Message);
        }
    }

    internal async Task SyncFolderAsync(
        string accountEmail, string folderKey, IMailFolder folder, CancellationToken ct)
    {
        var path = folder.FullName;

        // UIDs are only meaningful together with UIDVALIDITY. If the server has
        // renumbered the folder (restore, migration) every stored UID is stale.
        var validity = (long)folder.UidValidity;
        var state    = await db.MailboxFolderStates.FindAsync([accountEmail, path], ct);
        if (state is null || state.UidValidity != validity)
        {
            if (state is not null)
                logger.LogWarning("UIDVALIDITY changed for {Email}/{Folder} — re-syncing from scratch",
                    MaskEmail(accountEmail), path);

            await db.InboxEmails
                .Where(e => e.AccountEmail == accountEmail && e.FolderPath == path && e.Uid != null)
                .ExecuteDeleteAsync(ct);

            state ??= db.MailboxFolderStates.Add(new MailboxFolderState
                { AccountEmail = accountEmail, FolderPath = path }).Entity;
            state.UidValidity = validity;
        }
        state.LastSyncedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        // One cheap round-trip lists every message's UID and flags: that is
        // enough to find new mail, deleted/moved mail and read/flag changes.
        var serverList = folder.Count == 0
            ? []
            : await folder.FetchAsync(0, -1,
                new FetchRequest(MessageSummaryItems.UniqueId | MessageSummaryItems.Flags | MessageSummaryItems.InternalDate), ct);
        var onServer = serverList.ToDictionary(s => (long)s.UniqueId.Id);

        var stored = await db.InboxEmails
            .Where(e => e.AccountEmail == accountEmail && e.FolderPath == path && e.Uid != null)
            .Select(e => new { e.Id, Uid = e.Uid!.Value, e.IsRead, e.IsStarred })
            .ToListAsync(ct);

        // Gone from the server (deleted, or moved to another folder)
        var goneIds = stored.Where(s => !onServer.ContainsKey(s.Uid)).Select(s => s.Id).ToList();
        foreach (var chunk in goneIds.Chunk(UpdateSize))
            await db.InboxEmails
                .Where(e => chunk.Contains(e.Id) && e.FolderPath == path)
                .ExecuteDeleteAsync(ct);

        // Read / starred changed on the server (e.g. in Outlook)
        var changedIds = stored
            .Where(s => onServer.TryGetValue(s.Uid, out var m) &&
                        (IsSeen(m) != s.IsRead || IsFlagged(m) != s.IsStarred))
            .Select(s => s.Id)
            .ToList();
        foreach (var chunk in changedIds.Chunk(UpdateSize))
        {
            var rows = await db.InboxEmails
                .Where(e => chunk.Contains(e.Id) && e.FolderPath == path && e.Uid != null)
                .ToListAsync(ct);
            foreach (var row in rows)
            {
                if (!onServer.TryGetValue(row.Uid!.Value, out var m)) continue;
                row.IsRead    = IsSeen(m);
                row.IsStarred = IsFlagged(m);
            }
            await db.SaveChangesAsync(ct);
            db.ChangeTracker.Clear();
        }

        // Anything on the server we don't have yet — newest first, so a long
        // first sync shows recent mail straight away. Comparing the full set
        // (not "UID > highest seen") also recovers messages a past run skipped.
        var storedUids = stored.Select(s => s.Uid).ToHashSet();
        var newUids = onServer.Keys.Where(u => !storedUids.Contains(u)).OrderByDescending(u => u).ToList();
        if (newUids.Count == 0) return;

        logger.LogInformation("Sync: {Email}/{Folder} — {Count} new", MaskEmail(accountEmail), path, newUids.Count);

        foreach (var batch in newUids.Chunk(BatchSize))
        {
            if (ct.IsCancellationRequested) break;
            await ProcessBatchAsync(accountEmail, folderKey, folder, batch, onServer, ct);
        }
    }

    private async Task ProcessBatchAsync(
        string accountEmail, string folderKey, IMailFolder folder,
        long[] batch, Dictionary<long, IMessageSummary> onServer, CancellationToken ct)
    {
        var path = folder.FullName;

        // Rows created by the dashboard (sent / moved) before the server assigned
        // them a UID. When their server copy arrives we adopt it instead of
        // inserting a duplicate.
        var pending = await db.InboxEmails
            .Where(e => e.AccountEmail == accountEmail && e.Folder == folderKey &&
                        e.Uid == null && e.MessageId != "")
            .ToListAsync(ct);

        foreach (var uid in batch)
        {
            if (ct.IsCancellationRequested) break;
            var summary = onServer[uid];

            MimeMessage mime;
            try
            {
                mime = await folder.GetMessageAsync(summary.UniqueId, ct);
            }
            catch (Exception ex) when (!ct.IsCancellationRequested)
            {
                logger.LogWarning(ex, "Could not fetch body for UID {Uid} in {Email}/{Folder}",
                    uid, MaskEmail(accountEmail), path);
                continue;
            }

            var messageId = NormalizeMessageId(mime.MessageId);
            var adopt = messageId.Length == 0 ? null : pending.FirstOrDefault(p => NormalizeMessageId(p.MessageId) == messageId);
            if (adopt is not null)
            {
                pending.Remove(adopt);
                adopt.FolderPath = path;
                adopt.Uid        = uid;
                adopt.IsRead     = IsSeen(summary);
                adopt.IsStarred  = IsFlagged(summary);
                adopt.SyncedAt   = DateTime.UtcNow;
                continue;
            }

            db.InboxEmails.Add(new InboxEmail
            {
                AccountEmail  = accountEmail,
                Folder        = folderKey,
                FolderPath    = path,
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
                IsRead        = IsSeen(summary),
                IsStarred     = IsFlagged(summary),
                HasAttachment = mime.Attachments.Any(),
                // Arrival time on the server — what Outlook sorts by — rather
                // than the sender-supplied Date header.
                ReceivedAt    = (summary.InternalDate ?? mime.Date).UtcDateTime,
                SyncedAt      = DateTime.UtcNow,
            });
        }

        // Save what we fetched even if the timeout hit mid-batch, so the next
        // cycle resumes instead of starting the batch over.
        await db.SaveChangesAsync(CancellationToken.None);
        db.ChangeTracker.Clear();
    }

    private async Task RemoveVanishedFoldersAsync(string accountEmail, List<string> livePaths)
    {
        await db.InboxEmails
            .Where(e => e.AccountEmail == accountEmail && e.Uid != null && !livePaths.Contains(e.FolderPath))
            .ExecuteDeleteAsync();
        await db.MailboxFolderStates
            .Where(s => s.AccountEmail == accountEmail && !livePaths.Contains(s.FolderPath))
            .ExecuteDeleteAsync();
    }

    private async Task RecordStatusAsync(string accountEmail, bool success, string? error)
    {
        try
        {
            var status = await db.MailboxAccountStatuses.FindAsync(accountEmail);
            if (status is null)
            {
                status = new MailboxAccountStatus { AccountEmail = accountEmail };
                db.MailboxAccountStatuses.Add(status);
            }
            status.LastAttemptAt = DateTime.UtcNow;
            status.LastError     = error is null ? null : Clean(error);
            if (success) status.LastSuccessAt = status.LastAttemptAt;
            await db.SaveChangesAsync(CancellationToken.None);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not record mailbox status for {Email}", MaskEmail(accountEmail));
        }
    }

    // ── Write-back to the server ────────────────────────────────────────────

    public async Task SetFlagsAsync(InboxEmail email, bool? isRead, bool? isStarred, CancellationToken ct = default)
    {
        if (email.Uid is null) return; // not on the server yet — the sync will pick up its real flags

        using var client = await ConnectAsync(FindAccount(email.AccountEmail), ct);
        var folder = await OpenForWriteAsync(client, email, ct);
        if (folder is null) return;

        var uid = new UniqueId((uint)email.Uid.Value);
        if (isRead    == true)  await folder.StoreAsync(uid, new StoreFlagsRequest(StoreAction.Add,    MessageFlags.Seen)    { Silent = true }, ct);
        if (isRead    == false) await folder.StoreAsync(uid, new StoreFlagsRequest(StoreAction.Remove, MessageFlags.Seen)    { Silent = true }, ct);
        if (isStarred == true)  await folder.StoreAsync(uid, new StoreFlagsRequest(StoreAction.Add,    MessageFlags.Flagged) { Silent = true }, ct);
        if (isStarred == false) await folder.StoreAsync(uid, new StoreFlagsRequest(StoreAction.Remove, MessageFlags.Flagged) { Silent = true }, ct);

        await client.DisconnectAsync(true, CancellationToken.None);
    }

    public async Task MoveAsync(InboxEmail email, string targetFolder, CancellationToken ct = default)
    {
        if (email.Folder == targetFolder) return;

        if (email.Uid is null)
        {
            email.Folder = targetFolder;
            return;
        }

        using var client = await ConnectAsync(FindAccount(email.AccountEmail), ct);
        var target = (await DiscoverFoldersAsync(client, ct)).FirstOrDefault(f => f.Key == targetFolder).Folder
            ?? throw new InvalidOperationException($"This mailbox has no {targetFolder} folder on the server");

        var source = await OpenForWriteAsync(client, email, ct)
            ?? throw new InvalidOperationException("The message is no longer in that folder on the server");

        var newUid = await source.MoveToAsync(new UniqueId((uint)email.Uid.Value), target, ct);

        email.Folder     = targetFolder;
        email.FolderPath = target.FullName;
        // Without UIDPLUS the server doesn't say the new UID; the next sync
        // adopts the moved copy by Message-ID.
        email.Uid        = newUid?.Id;

        await client.DisconnectAsync(true, CancellationToken.None);
    }

    public async Task DeleteAsync(InboxEmail email, CancellationToken ct = default)
    {
        if (email.Uid is null) return;

        using var client = await ConnectAsync(FindAccount(email.AccountEmail), ct);
        var folder = await OpenForWriteAsync(client, email, ct);
        if (folder is null) return;

        var uid = new UniqueId((uint)email.Uid.Value);
        await folder.StoreAsync(uid, new StoreFlagsRequest(StoreAction.Add, MessageFlags.Deleted) { Silent = true }, ct);
        // Only expunge this one message; a plain EXPUNGE would also purge
        // anything else marked deleted in the folder.
        if (client.Capabilities.HasFlag(ImapCapabilities.UidPlus))
            await folder.ExpungeAsync([uid], ct);

        await client.DisconnectAsync(true, CancellationToken.None);
    }

    public async Task<(string FolderPath, long? Uid)?> AppendSentAsync(
        MailboxAccount account, MimeMessage message, CancellationToken ct = default)
    {
        using var client = await ConnectAsync(account, ct);
        var sent = (await DiscoverFoldersAsync(client, ct)).FirstOrDefault(f => f.Key == MailboxFolders.Sent).Folder;
        if (sent is null)
        {
            logger.LogWarning("No Sent folder on the server for {Email}; sent copy kept on the dashboard only",
                MaskEmail(account.Email));
            return null;
        }

        var uid = await sent.AppendAsync(new AppendRequest(message, MessageFlags.Seen), ct);
        await client.DisconnectAsync(true, CancellationToken.None);
        return (sent.FullName, uid?.Id);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private async Task<ImapClient> ConnectAsync(MailboxAccount account, CancellationToken ct)
    {
        var client = new ImapClient { Timeout = 20_000 }; // 20 s socket-level timeout
        if (cfg.Value.AcceptInvalidCertificates)
            client.ServerCertificateValidationCallback = (_, _, _, _) => true;

        try
        {
            await client.ConnectAsync(cfg.Value.ImapHost, cfg.Value.ImapPort, SecureSocketOptions.SslOnConnect, ct);
            await client.AuthenticateAsync(account.Email, account.Password, ct);
            return client;
        }
        catch
        {
            client.Dispose();
            throw;
        }
    }

    /// <summary>
    /// Every server folder that maps to a dashboard folder. Within each logical
    /// folder the server's SPECIAL-USE folder comes first, so writes (moves,
    /// sent copies) land where Outlook and webmail look.
    /// </summary>
    private static async Task<List<(IMailFolder Folder, string Key)>> DiscoverFoldersAsync(
        ImapClient client, CancellationToken ct)
    {
        var all = new List<IMailFolder> { client.Inbox };
        foreach (var ns in client.PersonalNamespaces)
            all.AddRange(await client.GetFoldersAsync(ns, StatusItems.None, false, ct));

        return all
            .DistinctBy(f => f.FullName, StringComparer.OrdinalIgnoreCase)
            .Select(f => (Folder: f, Key: MailboxFolders.Classify(f.FullName, f.Name, f.Attributes)))
            .Where(f => f.Key is not null)
            .Select(f => (f.Folder, Key: f.Key!))
            .OrderByDescending(f => MailboxFolders.IsSpecialUse(f.Folder.Attributes))
            .ToList();
    }

    /// <summary>
    /// Opens the message's folder read-write, or returns null if the folder is
    /// gone or has been renumbered since the UID was stored.
    /// </summary>
    private async Task<IMailFolder?> OpenForWriteAsync(ImapClient client, InboxEmail email, CancellationToken ct)
    {
        IMailFolder folder;
        try { folder = await client.GetFolderAsync(email.FolderPath, ct); }
        catch (FolderNotFoundException) { return null; }

        await folder.OpenAsync(FolderAccess.ReadWrite, ct);

        var state = await db.MailboxFolderStates.AsNoTracking()
            .FirstOrDefaultAsync(s => s.AccountEmail == email.AccountEmail && s.FolderPath == email.FolderPath, ct);
        if (state is not null && state.UidValidity != (long)folder.UidValidity)
        {
            logger.LogWarning("Skipping write to {Folder}: UIDVALIDITY changed since last sync", email.FolderPath);
            return null;
        }
        return folder;
    }

    private MailboxAccount FindAccount(string email) =>
        cfg.Value.Accounts.FirstOrDefault(a => a.Email.Equals(email, StringComparison.OrdinalIgnoreCase))
        ?? throw new InvalidOperationException("Mailbox account is not configured");

    private static bool IsSeen(IMessageSummary m)    => m.Flags?.HasFlag(MessageFlags.Seen)    == true;
    private static bool IsFlagged(IMessageSummary m) => m.Flags?.HasFlag(MessageFlags.Flagged) == true;

    internal static string NormalizeMessageId(string? id) => (id ?? string.Empty).Trim().Trim('<', '>');
}
