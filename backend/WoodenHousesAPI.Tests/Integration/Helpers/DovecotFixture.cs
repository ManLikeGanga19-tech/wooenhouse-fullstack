using System.Text;
using DotNet.Testcontainers.Builders;
using DotNet.Testcontainers.Containers;
using MailKit;
using MailKit.Net.Imap;
using MailKit.Security;
using WoodenHousesAPI.Services;

namespace WoodenHousesAPI.Tests.Integration.Helpers;

/// <summary>
/// A real Dovecot IMAP server laid out like the production cPanel host:
/// folders live under "INBOX." and Sent/Drafts/Junk/Trash carry SPECIAL-USE
/// attributes. Any username logs in with the password "pass", and every user
/// gets their own mailbox, so each test uses a fresh address for isolation.
/// </summary>
public class DovecotFixture : IAsyncLifetime
{
    public const string Password = "pass";

    private const string Config = """
        mail_home=/srv/mail/%Lu
        mail_location=sdbox:~/Mail
        mail_uid=1000
        mail_gid=1000
        protocols = imap
        first_valid_uid = 1000
        last_valid_uid = 1000
        passdb {
          driver = static
          args = password=pass
        }
        ssl=required
        ssl_cert=</etc/dovecot/cert.pem
        ssl_key=</etc/dovecot/key.pem
        namespace inbox {
          inbox = yes
          prefix = INBOX.
          separator = .
          mailbox Sent {
            special_use = \Sent
            auto = subscribe
          }
          mailbox Drafts {
            special_use = \Drafts
            auto = subscribe
          }
          mailbox Junk {
            special_use = \Junk
            auto = subscribe
          }
          mailbox Trash {
            special_use = \Trash
            auto = subscribe
          }
        }
        listen = *
        log_path=/dev/stdout
        """;

    private readonly IContainer _container = new ContainerBuilder()
        .WithImage("dovecot/dovecot:2.3.21")
        .WithResourceMapping(Encoding.UTF8.GetBytes(Config), "/etc/dovecot/dovecot.conf")
        .WithPortBinding(993, true)
        .WithWaitStrategy(Wait.ForUnixContainer().UntilPortIsAvailable(993))
        .Build();

    public Task InitializeAsync() => _container.StartAsync();
    public Task DisposeAsync()    => _container.DisposeAsync().AsTask();

    public MailboxConfig ConfigFor(params MailboxAccount[] accounts) => new()
    {
        ImapHost                  = _container.Hostname,
        ImapPort                  = _container.GetMappedPublicPort(993),
        AcceptInvalidCertificates = true, // the image's self-signed cert
        Accounts                  = [.. accounts],
    };

    public static MailboxAccount NewAccount() => new()
    {
        Email       = $"user-{Guid.NewGuid():N}@woodenhouseskenya.com",
        DisplayName = "Test",
        Password    = Password,
    };

    /// <summary>A plain IMAP session, standing in for Outlook acting on the mailbox.</summary>
    public async Task<ImapClient> ConnectAsync(MailboxAccount account)
    {
        var client = new ImapClient { ServerCertificateValidationCallback = (_, _, _, _) => true };
        await client.ConnectAsync(_container.Hostname, _container.GetMappedPublicPort(993), SecureSocketOptions.SslOnConnect);
        await client.AuthenticateAsync(account.Email, Password);
        return client;
    }
}
