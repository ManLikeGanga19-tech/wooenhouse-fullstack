using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using WoodenHousesAPI.Tests.Integration.Helpers;

namespace WoodenHousesAPI.Tests.Integration;

[Collection("Integration")]
public class AuthControllerTests(TestWebApplicationFactory factory)
   
{
    private readonly HttpClient _client = factory.CreateClient();

    // ─── POST /api/auth/login ─────────────────────────────────────────────────

    [Fact]
    public async Task Login_ValidCredentials_Returns200AndSetsAuthCookie()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email    = TestWebApplicationFactory.AdminEmail,
            password = TestWebApplicationFactory.AdminPassword,
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<LoginResponseBody>();
        body!.Email.Should().Be(TestWebApplicationFactory.AdminEmail);
        body.Name.Should().NotBeNullOrWhiteSpace();
        body.Role.Should().NotBeNullOrWhiteSpace();

        // Cookie must be set
        response.Headers.TryGetValues("Set-Cookie", out var cookies);
        cookies.Should().NotBeNull();
        cookies!.Should().Contain(c => c.Contains("wh_access_token"));

        // Cookie must be HttpOnly
        cookies!.Should().Contain(c => c.Contains("wh_access_token") && c.Contains("httponly", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Login_WrongPassword_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email    = TestWebApplicationFactory.AdminEmail,
            password = "WrongPassword!",
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_UnknownEmail_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email    = "nobody@test.com",
            password = "anypassword",
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_InvalidEmailFormat_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email    = "not-an-email",
            password = "somepassword",
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_MissingPassword_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email    = TestWebApplicationFactory.AdminEmail,
            password = "",
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_ErrorMessageDoesNotRevealWhichFieldWasWrong()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email    = TestWebApplicationFactory.AdminEmail,
            password = "WrongPassword!",
        });

        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Invalid credentials");
        body.Should().NotContain("password");
        body.Should().NotContain("email");
    }

    // ─── GET /api/auth/me ─────────────────────────────────────────────────────

    [Fact]
    public async Task Me_WithValidSession_Returns200AndUserInfo()
    {
        var authClient = await factory.CreateAuthenticatedClientAsync();
        var response   = await authClient.GetAsync("/api/auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<LoginResponseBody>();
        body!.Email.Should().Be(TestWebApplicationFactory.AdminEmail);
    }

    [Fact]
    public async Task Me_WithNoSession_Returns401()
    {
        var response = await _client.GetAsync("/api/auth/me");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ─── POST /api/auth/logout ────────────────────────────────────────────────

    [Fact]
    public async Task Logout_ClearsAuthCookie()
    {
        var authClient = await factory.CreateAuthenticatedClientAsync();

        var response = await authClient.PostAsync("/api/auth/logout", null);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.TryGetValues("Set-Cookie", out var cookies);
        // Cookie should be expired/cleared
        cookies?.Should().Contain(c =>
            c.Contains("wh_access_token") &&
            (c.Contains("expires=Thu, 01 Jan 1970", StringComparison.OrdinalIgnoreCase) ||
             c.Contains("max-age=0", StringComparison.OrdinalIgnoreCase)));
    }

    private record LoginResponseBody(string Name, string Email, string Role, DateTime ExpiresAt);
}
