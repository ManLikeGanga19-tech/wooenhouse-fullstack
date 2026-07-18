using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using WoodenHousesAPI.Services;
using WoodenHousesAPI.Tests.Integration.Helpers;

namespace WoodenHousesAPI.Tests.Integration;

[Collection("Integration")]
public class ContactsControllerTests(TestWebApplicationFactory factory)
   
{
    private readonly HttpClient _client = factory.CreateClient();

    // ─── POST /api/contact (public) ───────────────────────────────────────────

    [Fact]
    public async Task SubmitContact_ValidPayload_Returns200AndSavesToDb()
    {
        var response = await _client.PostAsJsonAsync("/api/contact", new
        {
            name        = "Daniel Oganga",
            email       = "daniel@test.com",
            phone       = "+254700000000",
            serviceType = "wooden-house",
            location    = "Nairobi",
            budget      = "1m-2m",
            timeline    = "3-6months",
            message     = "I want to build a 3-bedroom wooden house.",
            newsletter  = true,
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<MessageResponse>();
        body!.Message.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task SubmitContact_NewsletterOptIn_AlsoCreatesSubscriber()
    {
        var email = $"newsletter-{Guid.NewGuid()}@test.com";

        await _client.PostAsJsonAsync("/api/contact", new
        {
            name       = "Newsletter User",
            email,
            newsletter = true,
        });

        // Verify via admin endpoint
        var authClient = await factory.CreateAuthenticatedClientAsync();
        var subs = await authClient.GetFromJsonAsync<List<SubscriberResponse>>("/api/admin/newsletter");
        subs.Should().Contain(s => s.Email == email);
    }

    [Fact]
    public async Task SubmitContact_MissingRequiredName_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/contact", new
        {
            email = "valid@test.com",
            // name missing
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task SubmitContact_InvalidEmail_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/contact", new
        {
            name  = "Test Person",
            email = "not-an-email",
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task SubmitContact_MessageTooLong_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/contact", new
        {
            name    = "Test Person",
            email   = "test@test.com",
            message = new string('x', 2001), // over 2000 char limit
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ─── GET /api/admin/contacts (protected) ─────────────────────────────────

    [Fact]
    public async Task GetContacts_Authenticated_ReturnsPagedList()
    {
        var authClient = await factory.CreateAuthenticatedClientAsync();
        var response   = await authClient.GetAsync("/api/admin/contacts");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<PaginatedResponse<object>>();
        body!.Total.Should().BeGreaterThan(0);
        body.Items.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetContacts_Unauthenticated_Returns401()
    {
        var response = await _client.GetAsync("/api/admin/contacts");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetContacts_FilterByStatus_ReturnsOnlyMatchingRecords()
    {
        var authClient = await factory.CreateAuthenticatedClientAsync();
        var response   = await authClient.GetAsync("/api/admin/contacts?status=new");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<PaginatedResponse<ContactResponse>>();
        body!.Items.Should().OnlyContain(c => c.Status == "new");
    }

    [Fact]
    public async Task GetContactById_ExistingContact_Returns200()
    {
        // First get the list to find a real ID
        var authClient = await factory.CreateAuthenticatedClientAsync();
        var list = await authClient.GetFromJsonAsync<PaginatedResponse<ContactResponse>>("/api/admin/contacts");
        var id   = list!.Items.First().Id;

        var response = await authClient.GetAsync($"/api/admin/contacts/{id}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetContactById_NonExistentId_Returns404()
    {
        var authClient = await factory.CreateAuthenticatedClientAsync();
        var response   = await authClient.GetAsync($"/api/admin/contacts/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task PatchContact_UpdateStatus_Persists()
    {
        var authClient = await factory.CreateAuthenticatedClientAsync();
        var list = await authClient.GetFromJsonAsync<PaginatedResponse<ContactResponse>>("/api/admin/contacts");
        var id   = list!.Items.First().Id;

        var patch = await authClient.PatchAsJsonAsync($"/api/admin/contacts/{id}", new
        {
            status   = "contacted",
            priority = "high",
            notes    = "Called and confirmed interest.",
        });

        patch.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await patch.Content.ReadFromJsonAsync<ContactResponse>();
        updated!.Status.Should().Be("contacted");
        updated.Priority.Should().Be("high");
    }

    // ─── Spam handling (regression: production incident) ──────────────────────

    [Fact]
    public async Task SubmitContact_WithoutRecaptchaToken_IsNotSpam_AndReachesAdminInbox()
    {
        // Production incident: the frontend shipped without a reCAPTCHA site key,
        // so it sent no token. Every genuine lead was flagged IsSpam=true and
        // vanished from the dashboard, which hides spam by default.
        var email = $"no-token-{Guid.NewGuid()}@test.com";

        var response = await _client.PostAsJsonAsync("/api/contact", new
        {
            name    = "Lead Without Token",
            email,
            message = "I submitted with no reCAPTCHA token.",
            // recaptchaToken deliberately omitted
        });
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var authClient = await factory.CreateAuthenticatedClientAsync();
        var inbox = await authClient.GetFromJsonAsync<PaginatedResponse<SpamContactResponse>>(
            "/api/admin/contacts?pageSize=500");

        var lead = inbox!.Items.SingleOrDefault(c => c.Email == email);
        lead.Should().NotBeNull("a lead with no reCAPTCHA token must reach the admin inbox");
        lead!.IsSpam.Should().BeFalse();
        lead.SpamReason.Should().BeNull();
    }

    [Fact]
    public async Task SubmitContact_HoneypotFilled_IsFlaggedSpam_AndHiddenFromInbox()
    {
        // Bot gating must still work — the honeypot is now the primary defence.
        var email = $"honeypot-{Guid.NewGuid()}@test.com";

        var response = await _client.PostAsJsonAsync("/api/contact", new
        {
            name    = "Spam Bot",
            email,
            message = "buy cheap things",
            hp      = "bots-fill-this",
        });

        // Detection is never revealed to the caller.
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var authClient = await factory.CreateAuthenticatedClientAsync();

        var inbox = await authClient.GetFromJsonAsync<PaginatedResponse<SpamContactResponse>>(
            "/api/admin/contacts?pageSize=500");
        inbox!.Items.Should().NotContain(c => c.Email == email);

        var spam = await authClient.GetFromJsonAsync<PaginatedResponse<SpamContactResponse>>(
            "/api/admin/contacts?showSpam=true&pageSize=500");
        spam!.Items.Should().Contain(c => c.Email == email && c.IsSpam && c.SpamReason == "honeypot");
    }

    [Fact]
    public async Task SubmitContact_SubmittedImpossiblyFast_IsFlaggedSpam()
    {
        var email = $"fast-submit-{Guid.NewGuid()}@test.com";

        await _client.PostAsJsonAsync("/api/contact", new
        {
            name     = "Fast Bot",
            email,
            message  = "submitted instantly",
            loadedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), // 0 ms elapsed
        });

        var authClient = await factory.CreateAuthenticatedClientAsync();
        var spam = await authClient.GetFromJsonAsync<PaginatedResponse<SpamContactResponse>>(
            "/api/admin/contacts?showSpam=true&pageSize=500");

        spam!.Items.Should().Contain(c => c.Email == email && c.SpamReason == "fast-submit");
    }

    [Fact]
    public async Task SubmitContact_RealRecaptchaService_SecretConfiguredButNoToken_StillReachesAdminInbox()
    {
        // Reproduces the EXACT production configuration that caused the incident:
        //   • the backend HAS a real reCAPTCHA secret key configured, and
        //   • the frontend sends NO token (site key missing from the prod build).
        // This wires up the REAL RecaptchaService rather than the test no-op. It
        // short-circuits on the missing token, so no call to Google is ever made.
        var prodLikeFactory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, config) =>
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Recaptcha:SecretKey"] = "a-real-looking-production-secret",
                }));

            builder.ConfigureServices(services =>
            {
                var noOp = services.SingleOrDefault(d => d.ServiceType == typeof(IRecaptchaService));
                if (noOp is not null) services.Remove(noOp);

                services.AddHttpClient<IRecaptchaService, RecaptchaService>();
            });
        });

        var email = $"prod-scenario-{Guid.NewGuid()}@test.com";

        var response = await prodLikeFactory.CreateClient().PostAsJsonAsync("/api/contact", new
        {
            name    = "Production Lead",
            email,
            message = "Backend has a secret key; the frontend sent no token.",
        });
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var authClient = await factory.CreateAuthenticatedClientAsync();
        var inbox = await authClient.GetFromJsonAsync<PaginatedResponse<SpamContactResponse>>(
            "/api/admin/contacts?pageSize=500");

        var lead = inbox!.Items.SingleOrDefault(c => c.Email == email);
        lead.Should().NotBeNull("this is the exact production scenario that buried every lead");
        lead!.IsSpam.Should().BeFalse();
        lead.SpamReason.Should().NotBe("recaptcha");
    }

    private record MessageResponse(string Message);
    private record SubscriberResponse(string Id, string Email, string Status);
    private record ContactResponse(string Id, string Name, string Email, string Status, string Priority);
    private record SpamContactResponse(string Id, string Email, bool IsSpam, string? SpamReason);
    private record PaginatedResponse<T>(int Total, int Page, int PageSize, List<T> Items);
}
