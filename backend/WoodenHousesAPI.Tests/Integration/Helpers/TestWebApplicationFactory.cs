using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Testcontainers.PostgreSql;
using WoodenHousesAPI.Data;
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

