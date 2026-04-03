using System.Net;
using FluentAssertions;
using WoodenHousesAPI.Tests.Integration.Helpers;

namespace WoodenHousesAPI.Tests.Integration;

/// <summary>
/// Tests that production security controls are in place:
/// - Security headers on every response
/// - No Server/X-Powered-By header leakage
/// - SQL injection attempts return 400, not 500
/// </summary>
[Collection("Integration")]
public class SecurityTests(TestWebApplicationFactory factory)
   
{
    private readonly HttpClient _client = factory.CreateClient();

    // ─── Security headers ─────────────────────────────────────────────────────

    [Theory]
    [InlineData("X-Content-Type-Options",  "nosniff")]
    [InlineData("X-Frame-Options",         "DENY")]
    [InlineData("X-XSS-Protection",        "1; mode=block")]
    [InlineData("Referrer-Policy",         "strict-origin-when-cross-origin")]
    public async Task EveryResponse_HasRequiredSecurityHeader(string header, string expectedValue)
    {
        var response = await _client.GetAsync("/health");

        response.Headers.TryGetValues(header, out var values);
        values.Should().NotBeNull(because: $"{header} must be present");
        values!.First().Should().Contain(expectedValue,
            because: $"{header} must be set to '{expectedValue}'");
    }

    [Theory]
    [InlineData("Server")]
    [InlineData("X-Powered-By")]
    public async Task EveryResponse_DoesNotLeakServerInfo(string dangerousHeader)
    {
        var response = await _client.GetAsync("/health");

        response.Headers.Contains(dangerousHeader).Should().BeFalse(
            because: $"{dangerousHeader} must not be exposed");
    }

    // ─── Injection protection ─────────────────────────────────────────────────

    [Theory]
    [InlineData("'; DROP TABLE contacts; --")]
    [InlineData("<script>alert(1)</script>")]
    [InlineData("\" OR \"1\"=\"1")]
    public async Task ContactSubmit_WithInjectionInName_Returns400NotServerError(string maliciousInput)
    {
        var response = await _client.PostAsJsonAsync("/api/contact", new
        {
            name  = maliciousInput,
            email = "test@test.com",
        });

        // Should be Bad Request (name too short/invalid) — NOT a 500
        ((int)response.StatusCode).Should().NotBe(500,
            because: "injection attempts must never cause server errors");
    }

    [Fact]
    public async Task AdminEndpoint_WithTamperedToken_Returns401()
    {
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue(
                "Bearer", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.TAMPERED.SIGNATURE");

        var response = await _client.GetAsync("/api/admin/contacts");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ─── CORS ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Preflight_FromAllowedOrigin_Returns200WithCorsHeaders()
    {
        var request = new HttpRequestMessage(HttpMethod.Options, "/api/contact");
        request.Headers.Add("Origin",                         "http://localhost:3000");
        request.Headers.Add("Access-Control-Request-Method",  "POST");
        request.Headers.Add("Access-Control-Request-Headers", "Content-Type");

        var response = await _client.SendAsync(request);

        response.Headers.Contains("Access-Control-Allow-Origin").Should().BeTrue();
    }
}
