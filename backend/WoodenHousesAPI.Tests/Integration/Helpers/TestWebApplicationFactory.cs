using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Testcontainers.PostgreSql;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.DTOs.Mailbox;
using WoodenHousesAPI.Models;
using WoodenHousesAPI.Services;

namespace WoodenHousesAPI.Tests.Integration.Helpers;

/// <summary>
/// Spins up a real PostgreSQL container via Testcontainers,
/// runs all migrations, seeds a known dataset, then boots the full
/// ASP.NET Core app against that database.
///
/// The factory is shared across the entire "Integration" collection via
/// ICollectionFixture so only ONE PostgreSQL container is ever started
/// and the Serilog bootstrap logger is only frozen once.
/// </summary>
public class TestWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("woodenhouses_test")
        .WithUsername("test")
        .WithPassword("test")
        .Build();

    public const string AdminEmail    = "testadmin@woodenhouseskenya.com";
    public const string AdminPassword = "TestAdmin@123!";

    // ─── IAsyncLifetime ───────────────────────────────────────────────────────

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
    }

    public new async Task DisposeAsync()
    {
        await _postgres.DisposeAsync();
    }

    // ─── WebApplicationFactory overrides ─────────────────────────────────────

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        // Suppress Serilog in tests — prevents "logger already frozen" errors
        // caused by the bootstrap logger being frozen multiple times.
        builder.ConfigureLogging(logging =>
        {
            logging.ClearProviders();
            logging.AddConsole();
            logging.SetMinimumLevel(LogLevel.Warning);
        });

        builder.ConfigureServices(services =>
        {
            // Replace the real DbContext with one pointing at the test container.
            // Do NOT call services.BuildServiceProvider() here — that would
            // freeze the Serilog bootstrap logger before the main host is built.
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (descriptor != null)
                services.Remove(descriptor);

            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(_postgres.GetConnectionString()));

            // Replace the real email service with a no-op so tests never
            // attempt to connect to an SMTP server (which causes 2-minute timeouts).
            var emailDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(IEmailService));
            if (emailDescriptor != null)
                services.Remove(emailDescriptor);

            services.AddScoped<IEmailService, NullEmailService>();

            // Replace the real reCAPTCHA service with a no-op so tests never
            // call Google's siteverify API (no token is sent from test requests).
            var recaptchaDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(IRecaptchaService));
            if (recaptchaDescriptor != null)
                services.Remove(recaptchaDescriptor);

            services.AddScoped<IRecaptchaService, NullRecaptchaService>();

            // IAuditService uses IHttpContextAccessor which is already registered
            // — just ensure it's present for the test host too
            var auditDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(IAuditService));
            if (auditDescriptor is null)
                services.AddScoped<IAuditService, AuditService>();

            // Replace the real mailbox service so tests never attempt IMAP/SMTP
            // connections (which would timeout in CI where port 993 is blocked).
            var mailboxDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(IMailboxService));
            if (mailboxDescriptor != null)
                services.Remove(mailboxDescriptor);

            services.AddScoped<IMailboxService, NullMailboxService>();
        });
    }

    /// <summary>
    /// Called AFTER the host is fully built. Safe to resolve services and
    /// run migrations here — Serilog is already frozen by this point.
    /// </summary>
    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);

        using var scope = host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.Migrate();
        SeedTestData(db);

        return host;
    }

    // ─── Test data seed ───────────────────────────────────────────────────────

    private static void SeedTestData(AppDbContext db)
    {
        if (!db.AdminUsers.Any(u => u.Email == AdminEmail))
        {
            db.AdminUsers.Add(new AdminUser
            {
                Email        = AdminEmail,
                Name         = "Test Admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(AdminPassword, workFactor: 4),
                Role         = "superadmin",
            });
        }

        if (!db.Contacts.Any(c => c.Email == "alice@test.com"))
        {
            db.Contacts.AddRange(
                new Contact { Name = "Alice Kamau", Email = "alice@test.com", Status = "new",       Priority = "high",   ServiceType = "wooden-house" },
                new Contact { Name = "Bob Mwangi",  Email = "bob@test.com",   Status = "contacted", Priority = "medium", ServiceType = "carpentry" },
                new Contact { Name = "Carol Njeri", Email = "carol@test.com", Status = "quoted",    Priority = "low",    ServiceType = "consultation" }
            );
        }

        if (!db.NewsletterSubscribers.Any(s => s.Email == "subscriber@test.com"))
        {
            db.NewsletterSubscribers.Add(new NewsletterSubscriber
            {
                Email  = "subscriber@test.com",
                Name   = "Test Subscriber",
                Status = "active",
                Source = "footer",
            });
        }

        // DatabaseSeeder (run during host startup) may have already seeded real projects,
        // so check for the specific slug rather than db.Projects.Any().
        if (!db.Projects.Any(p => p.Slug == "test-project-nairobi"))
        {
            db.Projects.Add(new Project
            {
                Title       = "Test Project Nairobi",
                Slug        = "test-project-nairobi",
                Description = "A beautiful test project",
                Status      = "published",
                Featured    = true,
                Images      = "[]",
            });
        }

        // DatabaseSeeder may already have seeded services — check specific slug
        if (!db.Services.Any(s => s.Slug == "custom-wooden-houses"))
        {
            db.Services.Add(new Models.Service
            {
                Title    = "Custom Wooden Houses",
                Slug     = "custom-wooden-houses",
                Status   = "published",
                Features = "[]",
            });
        }

        db.SaveChanges();
    }

    // ─── Auth helper ─────────────────────────────────────────────────────────

    public async Task<HttpClient> CreateAuthenticatedClientAsync()
    {
        var client   = CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email    = AdminEmail,
            password = AdminPassword,
        });
        response.EnsureSuccessStatusCode();
        return client;
    }
}

/// <summary>
/// No-op reCAPTCHA service for integration tests — always returns success
/// so tests never call Google's siteverify API.
/// </summary>
internal sealed class NullRecaptchaService : IRecaptchaService
{
    public Task<(bool success, float score)> VerifyAsync(string? token)
        => Task.FromResult((true, 1.0f));
}

/// <summary>
/// No-op email service for integration tests — swallows all sends so
/// tests never attempt a real SMTP/Resend connection.
/// </summary>
internal sealed class NullEmailService : IEmailService
{
    public Task SendContactNotificationAsync(string fromName, string fromEmail, string? message)
        => Task.CompletedTask;

    public Task SendContactAutoReplyAsync(string toEmail, string toName)
        => Task.CompletedTask;

    public Task SendQuoteToCustomerAsync(string toEmail, string customerName, string quoteNumber, string quoteHtml)
        => Task.CompletedTask;

    public Task SendNewsletterAsync(IEnumerable<string> recipients, string subject, string htmlBody)
        => Task.CompletedTask;

    public Task SendNewsletterWelcomeAsync(string toEmail, string? name)
        => Task.CompletedTask;

    public Task SendNewsletterSubscriptionAlertAsync(string email, string? name)
        => Task.CompletedTask;

    public Task SendNewsletterBroadcastAsync(IEnumerable<string> recipients, string subject, string content)
        => Task.CompletedTask;
}

/// <summary>
/// Stub mailbox service for integration tests — returns canned data for the
/// known test account and throws KeyNotFoundException for unknown addresses,
/// so tests never attempt IMAP/SMTP connections.
/// </summary>
internal sealed class NullMailboxService : IMailboxService
{
    private static readonly List<MailboxAccountInfo> Accounts =
    [
        new("Sales",       "sales@woodenhouseskenya.com"),
        new("Procurement", "procurement@woodenhouseskenya.com"),
        new("Info",        "info@woodenhouseskenya.com"),
        new("Director",    "director@woodenhouseskenya.com"),
        new("Accounts",    "accounts@woodenhouseskenya.com"),
    ];

    private static readonly List<FolderDto> Folders =
    [
        new("INBOX",   "Inbox",   "inbox",          45, 3),
        new("Sent",    "Sent",    "send",            12, 0),
        new("Drafts",  "Drafts",  "pencil",           2, 0),
        new("Trash",   "Trash",   "trash",            7, 0),
        new("Junk",    "Junk",    "alert-triangle",   1, 0),
        new("Archive", "Archive", "archive",         23, 0),
    ];

    private void EnsureKnown(string address)
    {
        if (!Accounts.Any(a => a.Address.Equals(address, StringComparison.OrdinalIgnoreCase)))
            throw new KeyNotFoundException($"Mailbox account '{address}' not configured.");
    }

    public IReadOnlyList<MailboxAccountInfo> GetAccounts() => Accounts;

    public Task<List<FolderDto>> GetFoldersAsync(string address, CancellationToken ct = default)
    {
        EnsureKnown(address);
        return Task.FromResult(Folders);
    }

    public Task<(List<EmailSummaryDto> Emails, int Total)> GetEmailsAsync(
        string address, string folder, int page, int pageSize, string? search, CancellationToken ct = default)
    {
        EnsureKnown(address);
        var emails = new List<EmailSummaryDto>
        {
            new(101, "Test subject", "client@example.com", "Test Client",
                address, DateTime.UtcNow, false, false, null),
        };
        return Task.FromResult((emails, 1));
    }

    public Task<EmailDetailDto?> GetEmailAsync(
        string address, string folder, uint uid, CancellationToken ct = default)
    {
        EnsureKnown(address);
        EmailDetailDto? dto = uid == 0 ? null : new EmailDetailDto(
            uid, "Test subject", "client@example.com", "Test Client",
            address, null, null, DateTime.UtcNow, true,
            "<p>Hello</p>", "Hello", "<msg@test>", null, null, []);
        return Task.FromResult(dto);
    }

    public Task MarkReadAsync(string address, string folder, uint uid, bool isRead, CancellationToken ct = default)
    { EnsureKnown(address); return Task.CompletedTask; }

    public Task MoveEmailAsync(string address, string folder, uint uid, string targetFolder, CancellationToken ct = default)
    { EnsureKnown(address); return Task.CompletedTask; }

    public Task DeleteEmailAsync(string address, string folder, uint uid, CancellationToken ct = default)
    { EnsureKnown(address); return Task.CompletedTask; }

    public Task SendEmailAsync(SendEmailRequest request, CancellationToken ct = default)
    { EnsureKnown(request.AccountAddress); return Task.CompletedTask; }

    public Task SaveDraftAsync(SendEmailRequest request, CancellationToken ct = default)
    { EnsureKnown(request.AccountAddress); return Task.CompletedTask; }

    public Task<(byte[] Data, string ContentType, string FileName)> GetAttachmentAsync(
        string address, string folder, uint uid, string partSpecifier, CancellationToken ct = default)
    {
        EnsureKnown(address);
        return Task.FromResult((new byte[] { 0x00 }, "application/octet-stream", "test.bin"));
    }
}
