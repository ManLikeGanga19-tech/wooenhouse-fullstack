using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using WoodenHousesAPI.Tests.Integration.Helpers;

namespace WoodenHousesAPI.Tests.Integration;

/// <summary>
/// Tests all public (unauthenticated) endpoints:
///   GET  /health
///   GET  /api/projects
///   GET  /api/projects/{slug}
///   GET  /api/services
///   POST /api/newsletter/subscribe
///   POST /api/newsletter/unsubscribe
/// </summary>
[Collection("Integration")]
public class PublicEndpointsTests(TestWebApplicationFactory factory)
   
{
    private readonly HttpClient _client = factory.CreateClient();

    // ─── Health ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task HealthCheck_Returns200()
    {
        var response = await _client.GetAsync("/health");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ─── Projects ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetProjects_ReturnsPublishedProjects()
    {
        var response = await _client.GetAsync("/api/projects");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<List<ProjectResponse>>();
        body.Should().NotBeNull();
        body!.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetProjects_FilterFeatured_OnlyReturnsFeaturedProjects()
    {
        var response = await _client.GetAsync("/api/projects?featured=true");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<List<ProjectResponse>>();
        body!.Should().OnlyContain(p => p.Featured);
    }

    [Fact]
    public async Task GetProjectBySlug_ExistingSlug_Returns200()
    {
        var response = await _client.GetAsync("/api/projects/test-project-nairobi");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var project = await response.Content.ReadFromJsonAsync<ProjectResponse>();
        project!.Slug.Should().Be("test-project-nairobi");
    }

    [Fact]
    public async Task GetProjectBySlug_NonExistentSlug_Returns404()
    {
        var response = await _client.GetAsync("/api/projects/does-not-exist");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ─── Services ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetServices_ReturnsPublishedServices()
    {
        var response = await _client.GetAsync("/api/services");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<List<ServiceResponse>>();
        body!.Should().NotBeEmpty();
        body.Should().OnlyContain(s => s.Status == "published");
    }

    // ─── House types (price estimator) ────────────────────────────────────────

    [Fact]
    public async Task GetHouseTypes_ReturnsAllFiveTypesWithCorrectPrices()
    {
        var response = await _client.GetAsync("/api/house-types");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<HouseTypesResponse>();
        body!.Currency.Should().Be("USD");
        body.UsdToKes.Should().BeGreaterThan(0);
        body.Types.Should().HaveCount(5);

        // The boss's exact figures — these must never silently drift.
        body.Types.Should().ContainEquivalentOf(new { Bedrooms = 1, AveragePriceUsd = 19_500 });
        body.Types.Should().ContainEquivalentOf(new { Bedrooms = 2, AveragePriceUsd = 27_000 });
        body.Types.Should().ContainEquivalentOf(new { Bedrooms = 3, AveragePriceUsd = 50_000 });
        body.Types.Should().ContainEquivalentOf(new { Bedrooms = 4, AveragePriceUsd = 77_000 });
        body.Types.Should().ContainEquivalentOf(new { Bedrooms = 5, AveragePriceUsd = 100_000 });
    }

    // ─── Newsletter ───────────────────────────────────────────────────────────

    [Fact]
    public async Task Subscribe_NewEmail_Returns200()
    {
        var email    = $"new-{Guid.NewGuid()}@test.com";
        var response = await _client.PostAsJsonAsync("/api/newsletter/subscribe", new
        {
            email,
            name   = "New Subscriber",
            source = "footer",
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<MessageResponse>();
        body!.Message.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Subscribe_DuplicateActiveEmail_Returns200WithAlreadySubscribed()
    {
        // subscriber@test.com is seeded as active
        var response = await _client.PostAsJsonAsync("/api/newsletter/subscribe", new
        {
            email = "subscriber@test.com",
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<MessageResponse>();
        body!.Message.Should().Contain("already subscribed");
    }

    [Fact]
    public async Task Subscribe_InvalidEmail_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/newsletter/subscribe", new
        {
            email = "not-valid",
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Unsubscribe_ExistingSubscriber_Returns200()
    {
        // Subscribe first
        var email = $"unsub-{Guid.NewGuid()}@test.com";
        await _client.PostAsJsonAsync("/api/newsletter/subscribe", new { email });

        // Then unsubscribe
        var response = await _client.PostAsJsonAsync("/api/newsletter/unsubscribe", new { email });
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Unsubscribe_UnknownEmail_Returns404()
    {
        var response = await _client.PostAsJsonAsync("/api/newsletter/unsubscribe", new
        {
            email = "nobody@nowhere.com",
        });

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ─── Security: admin routes must be protected ─────────────────────────────

    [Theory]
    [InlineData("GET",  "/api/admin/contacts")]
    [InlineData("GET",  "/api/admin/quotes")]
    [InlineData("GET",  "/api/admin/newsletter")]
    [InlineData("GET",  "/api/admin/projects")]
    public async Task AdminRoutes_WithoutAuth_Return401(string method, string path)
    {
        var request  = new HttpRequestMessage(new HttpMethod(method), path);
        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized,
            because: $"{method} {path} must be protected");
    }

    private record MessageResponse(string Message);
    private record ProjectResponse(string Id, string Slug, bool Featured, string Status);
    private record ServiceResponse(string Id, string Title, string Status);
    private record HouseTypeResponse(int Bedrooms, string Label, int AveragePriceUsd, string BuildTime);
    private record HouseTypesResponse(string Currency, decimal UsdToKes, string Note, List<HouseTypeResponse> Types);
}
