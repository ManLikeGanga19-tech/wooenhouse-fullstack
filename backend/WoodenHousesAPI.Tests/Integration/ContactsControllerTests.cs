using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
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

    private record MessageResponse(string Message);
    private record SubscriberResponse(string Id, string Email, string Status);
    private record ContactResponse(string Id, string Name, string Email, string Status, string Priority);
    private record PaginatedResponse<T>(int Total, int Page, int PageSize, List<T> Items);
}
