using MailKit;
using MailKit.Net.Imap;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using MimeKit;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.Models;
using WoodenHousesAPI.Services;
using WoodenHousesAPI.Tests.Integration.Helpers;

namespace WoodenHousesAPI.Tests.Integration;

/// <summary>
/// Runs the dashboard's mailbox sync against a real IMAP server and checks
/// that the dashboard and the mailbox (what Outlook shows) stay in step in
/// both directions.
/// </summary>
[Collection("Integration")]
public class MailboxSyncTests(TestWebApplicationFactory factory, DovecotFixture dovecot)
    : IClassFixture<DovecotFixture>
{
    private readonly MailboxAccount _account = DovecotFixture.NewAccount();

    // ─── Server → dashboard ──────────────────────────────────────────────────

    [Fact]
    public async Task Sync_PullsEveryRoleFolder_IncludingOutlookSentItems()
    {
        using (var outlook = await dovecot.ConnectAsync(_account))
        {
            await DeliverAsync(outlook, "INBOX", "Quote request");
            await DeliverAsync(outlook, "INBOX", "Site visit");
            await DeliverAsync(outlook, "INBOX.Sent", "Sent from webmail");
            // Outlook without SPECIAL-USE files its sent mail in its own folder
            await outlook.Inbox.CreateAsync("Sent Items", true);
            await DeliverAsync(outlook, "INBOX.Sent Items", "Sent from Outlook");
        }

        await SyncAsync();

        var rows = await RowsAsync();
        rows.Where(r => r.Folder == "inbox").Select(r => r.Subject)
            .Should().BeEquivalentTo("Quote request", "Site visit");
        rows.Where(r => r.Folder == "sent").Select(r => r.Subject)
            .Should().BeEquivalentTo("Sent from webmail", "Sent from Outlook");

        var status = await StatusAsync();
        status!.LastSuccessAt.Should().NotBeNull();
        status.LastError.Should().BeNull();
    }

    [Fact]
    public async Task Sync_ReflectsReadFlaggedDeletedAndMovedChangesMadeInOutlook()
    {
        uint readUid, deletedUid, movedUid;
        using (var outlook = await dovecot.ConnectAsync(_account))
        {
            readUid    = await DeliverAsync(outlook, "INBOX", "Read in Outlook");
            deletedUid = await DeliverAsync(outlook, "INBOX", "Deleted in Outlook");
            movedUid   = await DeliverAsync(outlook, "INBOX", "Moved to Trash in Outlook");
            await DeliverAsync(outlook, "INBOX", "Untouched");
        }
        await SyncAsync();
        (await RowsAsync()).Should().HaveCount(4).And.OnlyContain(r => !r.IsRead && !r.IsStarred);

        using (var outlook = await dovecot.ConnectAsync(_account))
        {
            var inbox = outlook.Inbox;
            await inbox.OpenAsync(FolderAccess.ReadWrite);
            await inbox.StoreAsync(new UniqueId(readUid),
                new StoreFlagsRequest(StoreAction.Add, MessageFlags.Seen | MessageFlags.Flagged));
            await inbox.StoreAsync(new UniqueId(deletedUid), new StoreFlagsRequest(StoreAction.Add, MessageFlags.Deleted));
            await inbox.ExpungeAsync([new UniqueId(deletedUid)]);
            await inbox.MoveToAsync(new UniqueId(movedUid), await outlook.GetFolderAsync("INBOX.Trash"));
        }
        await SyncAsync();

        var rows = await RowsAsync();
        rows.Should().HaveCount(3);
        rows.Single(r => r.Subject == "Read in Outlook").Should().Match<InboxEmail>(r => r.IsRead && r.IsStarred);
        rows.Should().NotContain(r => r.Subject == "Deleted in Outlook");
        rows.Single(r => r.Subject == "Moved to Trash in Outlook").Folder.Should().Be("trash");
        rows.Single(r => r.Subject == "Untouched").Should().Match<InboxEmail>(r => !r.IsRead && r.Folder == "inbox");
    }

    [Fact]
    public async Task Sync_RebuildsFolder_WhenServerUidValidityChanges()
    {
        using (var outlook = await dovecot.ConnectAsync(_account))
            await DeliverAsync(outlook, "INBOX", "Before renumbering");
        await SyncAsync();
        var before = (await RowsAsync()).Single();

        // Simulate the server renumbering INBOX (cPanel restore / migration)
        await WithDbAsync(db => db.MailboxFolderStates
            .Where(s => s.AccountEmail == _account.Email && s.FolderPath == "INBOX")
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.UidValidity, 1)));
        await SyncAsync();

        var after = (await RowsAsync()).Single();
        after.Subject.Should().Be("Before renumbering");
        after.Id.Should().NotBe(before.Id, "stale UIDs are discarded and the folder re-fetched");
    }

    [Fact]
    public async Task Sync_ReportsFailure_WhenThePasswordIsWrong()
    {
        var wrong = new MailboxAccount { Email = _account.Email, Password = "not-the-password" };

        await WithDbAsync(db => NewService(db, wrong).SyncAccountAsync(wrong));

        var status = await StatusAsync();
        status!.LastSuccessAt.Should().BeNull();
        status.LastError.Should().NotBeNullOrWhiteSpace();
    }

    // ─── Dashboard → server ──────────────────────────────────────────────────

    [Fact]
    public async Task DashboardReadStarMoveAndDelete_AreAppliedOnTheServer()
    {
        using (var outlook = await dovecot.ConnectAsync(_account))
            await DeliverAsync(outlook, "INBOX", "Act on me");
        await SyncAsync();

        // Read + star
        await WithDbAsync(async db =>
        {
            var row = await db.InboxEmails.SingleAsync(e => e.AccountEmail == _account.Email);
            await NewService(db).SetFlagsAsync(row, isRead: true, isStarred: true);
        });
        using (var outlook = await dovecot.ConnectAsync(_account))
        {
            await outlook.Inbox.OpenAsync(FolderAccess.ReadOnly);
            var flags = (await outlook.Inbox.FetchAsync(0, -1, new FetchRequest(MessageSummaryItems.Flags))).Single().Flags!.Value;
            flags.Should().HaveFlag(MessageFlags.Seen).And.HaveFlag(MessageFlags.Flagged);
        }

        // Delete from the inbox = move to Trash
        await WithDbAsync(async db =>
        {
            var row = await db.InboxEmails.SingleAsync(e => e.AccountEmail == _account.Email);
            await NewService(db).MoveAsync(row, "trash");
            await db.SaveChangesAsync();
        });
        (await ServerCountAsync("INBOX")).Should().Be(0);
        (await ServerCountAsync("INBOX.Trash")).Should().Be(1);

        await SyncAsync();
        var rows = await RowsAsync();
        rows.Should().ContainSingle().Which.Folder.Should().Be("trash");

        // Delete from Trash = permanent
        await WithDbAsync(async db =>
        {
            var row = await db.InboxEmails.SingleAsync(e => e.AccountEmail == _account.Email);
            await NewService(db).DeleteAsync(row);
        });
        (await ServerCountAsync("INBOX.Trash")).Should().Be(0);
    }

    [Fact]
    public async Task ComposedEmail_IsFiledInServerSent_AndListedOnce()
    {
        // What the compose endpoint does after Resend delivers the message
        var messageId = $"{Guid.NewGuid()}@woodenhouseskenya.com";
        var copy = new MimeMessage { Subject = "Your quotation", MessageId = messageId, Body = new TextPart("plain") { Text = "Hi" } };
        copy.From.Add(new MailboxAddress("Test", _account.Email));
        copy.To.Add(MailboxAddress.Parse("client@example.com"));

        await WithDbAsync(async db =>
        {
            var appended = await NewService(db).AppendSentAsync(_account, copy);
            appended.Should().NotBeNull();
            appended!.Value.FolderPath.Should().Be("INBOX.Sent", "the SPECIAL-USE Sent folder wins");
            db.InboxEmails.Add(new InboxEmail
            {
                AccountEmail = _account.Email, Folder = "sent", Subject = copy.Subject,
                MessageId = messageId, FolderPath = appended.Value.FolderPath, Uid = appended.Value.Uid,
            });
            await db.SaveChangesAsync();
        });

        // Something else was sent from Outlook too — Sent must keep syncing
        using (var outlook = await dovecot.ConnectAsync(_account))
            await DeliverAsync(outlook, "INBOX.Sent", "Sent from Outlook");
        await SyncAsync();

        (await ServerCountAsync("INBOX.Sent")).Should().Be(2);
        (await RowsAsync()).Where(r => r.Folder == "sent").Select(r => r.Subject)
            .Should().BeEquivalentTo("Your quotation", "Sent from Outlook");
    }

    [Fact]
    public async Task Sync_AdoptsDashboardRowWithoutUid_InsteadOfDuplicatingIt()
    {
        // A sent/moved row whose server UID wasn't known at the time
        var messageId = $"{Guid.NewGuid()}@woodenhouseskenya.com";
        await WithDbAsync(db =>
        {
            db.InboxEmails.Add(new InboxEmail
                { AccountEmail = _account.Email, Folder = "sent", Subject = "Pending", MessageId = messageId });
            return db.SaveChangesAsync();
        });
        using (var outlook = await dovecot.ConnectAsync(_account))
            await DeliverAsync(outlook, "INBOX.Sent", "Pending", messageId);

        await SyncAsync();

        var row = (await RowsAsync()).Should().ContainSingle().Subject;
        row.Uid.Should().NotBeNull();
        row.FolderPath.Should().Be("INBOX.Sent");
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private ImapService NewService(AppDbContext db, MailboxAccount? account = null) =>
        new(db, Options.Create(dovecot.ConfigFor(account ?? _account)), NullLogger<ImapService>.Instance);

    private Task SyncAsync() => WithDbAsync(db => NewService(db).SyncAccountAsync(_account));

    private async Task WithDbAsync(Func<AppDbContext, Task> action)
    {
        using var scope = factory.Services.CreateScope();
        await action(scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }

    private async Task<List<InboxEmail>> RowsAsync()
    {
        List<InboxEmail> rows = [];
        await WithDbAsync(async db => rows = await db.InboxEmails.AsNoTracking()
            .Where(e => e.AccountEmail == _account.Email).ToListAsync());
        return rows;
    }

    private async Task<MailboxAccountStatus?> StatusAsync()
    {
        MailboxAccountStatus? status = null;
        await WithDbAsync(async db => status = await db.MailboxAccountStatuses.AsNoTracking()
            .SingleOrDefaultAsync(s => s.AccountEmail == _account.Email));
        return status;
    }

    private async Task<int> ServerCountAsync(string path)
    {
        using var outlook = await dovecot.ConnectAsync(_account);
        var folder = await outlook.GetFolderAsync(path);
        await folder.OpenAsync(FolderAccess.ReadOnly);
        return folder.Count;
    }

    private static async Task<uint> DeliverAsync(ImapClient client, string path, string subject, string? messageId = null)
    {
        var msg = new MimeMessage { Subject = subject, Body = new TextPart("plain") { Text = subject } };
        if (messageId is not null) msg.MessageId = messageId;
        msg.From.Add(MailboxAddress.Parse("someone@example.com"));
        msg.To.Add(MailboxAddress.Parse("director@woodenhouseskenya.com"));

        var folder = await client.GetFolderAsync(path);
        var uid = await folder.AppendAsync(new AppendRequest(msg));
        return uid!.Value.Id;
    }
}
