using MailKit;
using MailKit.Net.Imap;
using MailKit.Net.Smtp;
using MailKit.Search;
using MailKit.Security;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using MimeKit;
using MimeKit.Text;
using WoodenHousesAPI.DTOs.Mailbox;

namespace WoodenHousesAPI.Services;

public class MailboxSettings
{
    public string                    ImapHost { get; set; } = string.Empty;
    public int                       ImapPort { get; set; } = 993;
    public string                    SmtpHost { get; set; } = string.Empty;
    public int                       SmtpPort { get; set; } = 465;
    public List<MailboxAccountEntry> Accounts { get; set; } = [];
}

public class MailboxAccountEntry
{
    public string Name     { get; set; } = string.Empty;
    public string Address  { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

// ─── Folder display-name + icon map ──────────────────────────────────────────
file static class FolderMeta
{
    private static readonly Dictionary<string, (string Display, string Icon)> _map = new(StringComparer.OrdinalIgnoreCase)
    {
        ["INBOX"]          = ("Inbox",   "inbox"),
        ["Sent"]           = ("Sent",    "send"),
        ["Sent Messages"]  = ("Sent",    "send"),
        ["Drafts"]         = ("Drafts",  "pencil"),
        ["Trash"]          = ("Trash",   "trash"),
        ["Deleted Items"]  = ("Trash",   "trash"),
        ["Junk"]           = ("Junk",    "alert-triangle"),
        ["Spam"]           = ("Junk",    "alert-triangle"),
        ["Archive"]        = ("Archive", "archive"),
        ["Archives"]       = ("Archive", "archive"),
    };

    public static (string Display, string Icon) For(string name)
    {
        if (_map.TryGetValue(name, out var v)) return v;
        var last = name.Contains('/') ? name[(name.LastIndexOf('/') + 1)..] : name;
        return (last, "folder");
    }
}

public class MailboxService(
    IOptions<MailboxSettings>  options,
    MailboxConnectionPool      pool,
    IMemoryCache               cache,
    ILogger<MailboxService>    log) : IMailboxService
{
    private readonly MailboxSettings _cfg = options.Value;

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private MailboxAccountEntry GetAccount(string address) =>
        _cfg.Accounts.FirstOrDefault(a =>
            string.Equals(a.Address, address, StringComparison.OrdinalIgnoreCase))
        ?? throw new KeyNotFoundException($"Mailbox account '{address}' not configured.");

    private Task<MailboxSession> OpenAsync(string address, CancellationToken ct)
    {
        var acc = GetAccount(address);
        return pool.AcquireAsync(acc.Address, acc.Password, _cfg.ImapHost, _cfg.ImapPort, ct);
    }

    private void Bust(params string[] keys)
    {
        foreach (var k in keys) cache.Remove(k);
    }

    private static string FolderKey(string address, string folder)   => $"mbx:folders:{address}";
    private static string ListKey(string address, string folder, int page, int ps, string? q)
        => $"mbx:list:{address}:{folder}:{page}:{ps}:{q}";
    private static string MsgKey(string address, string folder, uint uid) => $"mbx:msg:{address}:{folder}:{uid}";

    // ─── Accounts ────────────────────────────────────────────────────────────

    public IReadOnlyList<MailboxAccountInfo> GetAccounts() =>
        _cfg.Accounts.Select(a => new MailboxAccountInfo(a.Name, a.Address)).ToList();

    // ─── Folders ─────────────────────────────────────────────────────────────

    public async Task<List<FolderDto>> GetFoldersAsync(string address, CancellationToken ct = default)
    {
        var key = FolderKey(address, "");
        if (cache.TryGetValue(key, out List<FolderDto>? cached)) return cached!;

        using var s = await OpenAsync(address, ct);

        var allFolders = new List<FolderDto>();

        // Use IMAP STATUS command for each folder — one round-trip per folder
        // instead of SELECT (open) + CLOSE, which is ~3x faster.
        var ns      = s.Client.PersonalNamespaces[0];
        var folders = await s.Client.GetFoldersAsync(ns, false, ct);

        // Ensure INBOX is first in the list
        var ordered = folders
            .OrderBy(f => string.Equals(f.FullName, "INBOX", StringComparison.OrdinalIgnoreCase) ? 0 : 1)
            .ThenBy(f => f.Name);

        foreach (var f in ordered)
        {
            if ((f.Attributes & FolderAttributes.NoSelect) != 0) continue;

            try
            {
                await f.StatusAsync(StatusItems.Count | StatusItems.Unread, ct);
                var (display, icon) = FolderMeta.For(f.Name);
                allFolders.Add(new FolderDto(f.FullName, display, icon, f.Count, f.Unread));
            }
            catch (Exception ex)
            {
                log.LogWarning(ex, "[IMAP] Could not STATUS folder {Folder}", f.FullName);
            }
        }

        cache.Set(key, allFolders, TimeSpan.FromMinutes(5));
        return allFolders;
    }

    // ─── Email list ───────────────────────────────────────────────────────────

    public async Task<(List<EmailSummaryDto> Emails, int Total)> GetEmailsAsync(
        string address, string folder, int page, int pageSize, string? search,
        CancellationToken ct = default)
    {
        var key = ListKey(address, folder, page, pageSize, search);
        if (cache.TryGetValue(key, out (List<EmailSummaryDto>, int) hit)) return hit;

        using var s = await OpenAsync(address, ct);

        var f = await s.Client.GetFolderAsync(folder, ct);
        await f.OpenAsync(FolderAccess.ReadOnly, ct);

        IList<IMessageSummary> summaries;

        if (!string.IsNullOrWhiteSpace(search))
        {
            var query  = SearchQuery.SubjectContains(search).Or(SearchQuery.FromContains(search));
            var uids   = await f.SearchAsync(query, ct);
            summaries  = await f.FetchAsync(uids,
                MessageSummaryItems.UniqueId | MessageSummaryItems.Envelope |
                MessageSummaryItems.Flags   | MessageSummaryItems.BodyStructure, ct);
        }
        else
        {
            summaries = await f.FetchAsync(0, -1,
                MessageSummaryItems.UniqueId | MessageSummaryItems.Envelope |
                MessageSummaryItems.Flags   | MessageSummaryItems.BodyStructure, ct);
        }

        await f.CloseAsync(false, ct);

        var sorted = summaries.OrderByDescending(m => m.Date).ToList();
        var total  = sorted.Count;
        var paged  = sorted.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        var result = paged.Select(m =>
        {
            var from     = m.Envelope.From?.OfType<MailboxAddress>().FirstOrDefault();
            var toAddr   = m.Envelope.To?.ToString() ?? "";
            var preview  = null as string; // full body only fetched on detail
            return new EmailSummaryDto(
                Uid:            m.UniqueId.Id,
                Subject:        m.Envelope.Subject ?? "(no subject)",
                From:           from?.Address ?? m.Envelope.From?.ToString() ?? "",
                FromName:       from?.Name ?? "",
                To:             toAddr,
                Date:           m.Date.UtcDateTime,
                IsRead:         m.Flags?.HasFlag(MessageFlags.Seen) ?? false,
                HasAttachments: m.Attachments.Any(),
                Preview:        preview);
        }).ToList();

        var tuple = (result, total);
        cache.Set(key, tuple, TimeSpan.FromMinutes(2));
        return tuple;
    }

    // ─── Email detail ─────────────────────────────────────────────────────────

    public async Task<EmailDetailDto?> GetEmailAsync(
        string address, string folder, uint uid, CancellationToken ct = default)
    {
        var key = MsgKey(address, folder, uid);
        if (cache.TryGetValue(key, out EmailDetailDto? hit)) return hit;

        using var s = await OpenAsync(address, ct);

        var f = await s.Client.GetFolderAsync(folder, ct);
        await f.OpenAsync(FolderAccess.ReadWrite, ct);

        var uniqueId = new UniqueId(uid);
        var message  = await f.GetMessageAsync(uniqueId, ct);

        // Mark as read
        await f.AddFlagsAsync(uniqueId, MessageFlags.Seen, true, ct);
        await f.CloseAsync(false, ct);

        var attachments = message.Attachments.Select(a =>
        {
            var part     = a as MimePart;
            var fileName = part?.FileName ?? a.ContentType?.Name ?? "attachment";
            var mime     = a.ContentType?.MimeType ?? "application/octet-stream";
            long size    = 0;
            if (part?.Content?.Stream is { } st)
            {
                if (st.CanSeek) size = st.Length;
            }
            return new AttachmentDto(a.ContentId ?? a.ContentType?.Name ?? "", fileName, mime, size);
        }).ToList();

        var dto = new EmailDetailDto(
            Uid:        uid,
            Subject:    message.Subject ?? "(no subject)",
            From:       message.From.ToString(),
            FromName:   message.From.OfType<MailboxAddress>().FirstOrDefault()?.Name ?? "",
            To:         message.To.ToString(),
            Cc:         message.Cc.Any() ? message.Cc.ToString() : null,
            Bcc:        message.Bcc.Any() ? message.Bcc.ToString() : null,
            Date:       message.Date.UtcDateTime,
            IsRead:     true,
            HtmlBody:   message.HtmlBody,
            TextBody:   message.TextBody,
            MessageId:  message.MessageId,
            InReplyTo:  message.InReplyTo,
            References: message.References.Any() ? string.Join(" ", message.References) : null,
            Attachments: attachments);

        cache.Set(key, dto, TimeSpan.FromMinutes(30));

        // Bust folder cache so unread count refreshes; list entries expire on their 2-min TTL
        cache.Remove(FolderKey(address, folder));

        return dto;
    }

    // ─── Mark read / unread ───────────────────────────────────────────────────

    public async Task MarkReadAsync(string address, string folder, uint uid, bool isRead,
        CancellationToken ct = default)
    {
        using var s = await OpenAsync(address, ct);
        var f       = await s.Client.GetFolderAsync(folder, ct);
        await f.OpenAsync(FolderAccess.ReadWrite, ct);

        var id = new UniqueId(uid);
        if (isRead)
            await f.AddFlagsAsync(id, MessageFlags.Seen, true, ct);
        else
            await f.RemoveFlagsAsync(id, MessageFlags.Seen, true, ct);

        await f.CloseAsync(false, ct);

        Bust(MsgKey(address, folder, uid), FolderKey(address, folder));
    }

    // ─── Move ─────────────────────────────────────────────────────────────────

    public async Task MoveEmailAsync(string address, string folder, uint uid, string targetFolder,
        CancellationToken ct = default)
    {
        using var s = await OpenAsync(address, ct);

        var src  = await s.Client.GetFolderAsync(folder, ct);
        var dest = await s.Client.GetFolderAsync(targetFolder, ct);
        await src.OpenAsync(FolderAccess.ReadWrite, ct);

        var id = new UniqueId(uid);
        await src.MoveToAsync(id, dest, ct);
        await src.CloseAsync(true, ct);

        Bust(MsgKey(address, folder, uid),
             FolderKey(address, folder),
             FolderKey(address, targetFolder));
    }

    // ─── Delete (move to Trash or permanent) ─────────────────────────────────

    public async Task DeleteEmailAsync(string address, string folder, uint uid,
        CancellationToken ct = default)
    {
        using var s = await OpenAsync(address, ct);

        var src = await s.Client.GetFolderAsync(folder, ct);
        await src.OpenAsync(FolderAccess.ReadWrite, ct);

        IMailFolder? trash = null;
        try { trash = s.Client.GetFolder(SpecialFolder.Trash); } catch { /* not supported */ }

        var id = new UniqueId(uid);

        if (trash is not null && !string.Equals(src.FullName, trash.FullName, StringComparison.OrdinalIgnoreCase))
        {
            await src.MoveToAsync(id, trash, ct);
        }
        else
        {
            // Already in Trash — permanently delete
            await src.AddFlagsAsync(id, MessageFlags.Deleted, true, ct);
            await src.ExpungeAsync(ct);
        }

        await src.CloseAsync(true, ct);
        Bust(MsgKey(address, folder, uid), FolderKey(address, folder));
    }

    // ─── Send ─────────────────────────────────────────────────────────────────

    public async Task SendEmailAsync(SendEmailRequest req, CancellationToken ct = default)
    {
        var acc     = GetAccount(req.AccountAddress);
        var message = BuildMimeMessage(acc, req);

        using var smtp = new SmtpClient();
        await smtp.ConnectAsync(_cfg.SmtpHost, _cfg.SmtpPort, SecureSocketOptions.SslOnConnect, ct);
        await smtp.AuthenticateAsync(acc.Address, acc.Password, ct);
        await smtp.SendAsync(message, ct);
        await smtp.DisconnectAsync(true, ct);

        // Append to Sent folder (best-effort)
        try
        {
            using var s    = await OpenAsync(req.AccountAddress, ct);
            IMailFolder? sent = null;
            try { sent = s.Client.GetFolder(SpecialFolder.Sent); } catch { /* fallback */ }
            sent ??= await TryGetFolderAsync(s.Client, "Sent", ct);

            if (sent is not null)
            {
                await sent.OpenAsync(FolderAccess.ReadWrite, ct);
                await sent.AppendAsync(message, MessageFlags.Seen, ct);
                await sent.CloseAsync(false, ct);
            }
        }
        catch (Exception ex)
        {
            log.LogWarning(ex, "[IMAP] Could not append to Sent for {Address}", acc.Address);
        }
    }

    // ─── Save draft ───────────────────────────────────────────────────────────

    public async Task SaveDraftAsync(SendEmailRequest req, CancellationToken ct = default)
    {
        var acc     = GetAccount(req.AccountAddress);
        var message = BuildMimeMessage(acc, req);

        using var s    = await OpenAsync(req.AccountAddress, ct);
        IMailFolder? drafts = null;
        try { drafts = s.Client.GetFolder(SpecialFolder.Drafts); } catch { /* fallback */ }
        drafts ??= await TryGetFolderAsync(s.Client, "Drafts", ct);

        if (drafts is null)
            throw new InvalidOperationException("Drafts folder not found.");

        await drafts.OpenAsync(FolderAccess.ReadWrite, ct);
        await drafts.AppendAsync(message, MessageFlags.Draft, ct);
        await drafts.CloseAsync(false, ct);
    }

    // ─── Attachment download ──────────────────────────────────────────────────

    public async Task<(byte[] Data, string ContentType, string FileName)> GetAttachmentAsync(
        string address, string folder, uint uid, string partSpecifier,
        CancellationToken ct = default)
    {
        using var s = await OpenAsync(address, ct);
        var f       = await s.Client.GetFolderAsync(folder, ct);
        await f.OpenAsync(FolderAccess.ReadOnly, ct);

        var message = await f.GetMessageAsync(new UniqueId(uid), ct);
        await f.CloseAsync(false, ct);

        // Find attachment by content-id or file name
        var attachment = message.Attachments
            .FirstOrDefault(a =>
                string.Equals(a.ContentId, partSpecifier, StringComparison.OrdinalIgnoreCase) ||
                string.Equals((a as MimePart)?.FileName, partSpecifier, StringComparison.OrdinalIgnoreCase));

        if (attachment is not MimePart part)
            throw new FileNotFoundException("Attachment not found.");

        using var ms = new MemoryStream();
        await part.Content.DecodeToAsync(ms, ct);

        return (ms.ToArray(),
                part.ContentType?.MimeType ?? "application/octet-stream",
                part.FileName ?? "attachment");
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private static MimeMessage BuildMimeMessage(MailboxAccountEntry acc, SendEmailRequest req)
    {
        var msg = new MimeMessage();
        msg.From.Add(new MailboxAddress(acc.Name, acc.Address));
        msg.To.AddRange(InternetAddressList.Parse(req.To));

        if (!string.IsNullOrWhiteSpace(req.Cc))  msg.Cc.AddRange(InternetAddressList.Parse(req.Cc));
        if (!string.IsNullOrWhiteSpace(req.Bcc)) msg.Bcc.AddRange(InternetAddressList.Parse(req.Bcc));

        msg.Subject = req.Subject;

        if (!string.IsNullOrWhiteSpace(req.InReplyTo)) msg.InReplyTo = req.InReplyTo;

        var builder = new BodyBuilder
        {
            HtmlBody = req.HtmlBody,
            TextBody = req.TextBody ?? StripHtml(req.HtmlBody),
        };
        msg.Body = builder.ToMessageBody();
        return msg;
    }

    private static string? StripHtml(string? html)
    {
        if (string.IsNullOrWhiteSpace(html)) return null;
        return System.Text.RegularExpressions.Regex.Replace(html, "<[^>]*>", "").Trim();
    }

    private static async Task<IMailFolder?> TryGetFolderAsync(IImapClient client, string name, CancellationToken ct)
    {
        try { return await client.GetFolderAsync(name, ct); }
        catch { return null; }
    }
}
