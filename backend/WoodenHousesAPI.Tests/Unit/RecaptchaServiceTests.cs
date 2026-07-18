using System.Globalization;
using System.Net;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using WoodenHousesAPI.Services;

namespace WoodenHousesAPI.Tests.Unit;

/// <summary>
/// Regression coverage for the production incident where every contact-form
/// submission was silently flagged as spam and never reached the dashboard.
///
/// Root cause: the production frontend was built without a reCAPTCHA site key,
/// so it sent no token. The backend treated a missing/unverifiable token as
/// proof of a bot, saved the contact with IsSpam=true, and the admin list
/// (which hides spam by default) never showed the lead.
///
/// The rule these tests lock in: ONLY a token that Google positively verifies
/// with a below-threshold score may be treated as a bot. Every other outcome —
/// no secret, no token, Google down, token rejected — fails OPEN, because each
/// of those is a plumbing/config failure, not evidence of a bot.
/// </summary>
public class RecaptchaServiceTests
{
    private const string SecretKey = "test-secret-key";

    private static RecaptchaService CreateSut(
        Func<HttpRequestMessage, HttpResponseMessage> respond,
        string? secretKey = SecretKey)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Recaptcha:SecretKey"] = secretKey,
            })
            .Build();

        return new RecaptchaService(new HttpClient(new StubHandler(respond)), config);
    }

    // ─── Fail-open cases: a real lead must never be buried ────────────────────

    [Fact]
    public async Task VerifyAsync_SecretKeyNotConfigured_ReturnsHuman()
    {
        // Local dev / tests: no secret configured — allow, and never call Google.
        var sut = CreateSut(
            _ => throw new InvalidOperationException("Google must not be called"),
            secretKey: "");

        var result = await sut.VerifyAsync("any-token");

        result.Should().Be(RecaptchaResult.Human);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task VerifyAsync_TokenMissing_ReturnsHuman_AndNeverCallsGoogle(string? token)
    {
        // THE production bug. The frontend shipped with no site key, so no token
        // was sent. This previously returned Bot and buried every real lead.
        var googleWasCalled = false;
        var sut = CreateSut(_ =>
        {
            googleWasCalled = true;
            return JsonResponse(success: true, score: 0.9f);
        });

        var result = await sut.VerifyAsync(token);

        result.Should().Be(RecaptchaResult.Human);
        googleWasCalled.Should().BeFalse("a missing token is a config problem, not a bot");
    }

    [Fact]
    public async Task VerifyAsync_GoogleRejectsToken_ReturnsHuman()
    {
        // success=false is exactly what a site-key/secret MISMATCH returns, and it
        // would reject every genuine visitor. Must fail open, not flag spam.
        var sut = CreateSut(_ => JsonResponse(success: false, score: 0f));

        var result = await sut.VerifyAsync("token-from-mismatched-site-key");

        result.Should().Be(RecaptchaResult.Human);
    }

    [Fact]
    public async Task VerifyAsync_GoogleReturnsHttpError_ReturnsHuman()
    {
        var sut = CreateSut(_ => new HttpResponseMessage(HttpStatusCode.InternalServerError));

        var result = await sut.VerifyAsync("any-token");

        result.Should().Be(RecaptchaResult.Human);
    }

    [Fact]
    public async Task VerifyAsync_NetworkFailure_ReturnsHuman()
    {
        var sut = CreateSut(_ => throw new HttpRequestException("network is down"));

        var result = await sut.VerifyAsync("any-token");

        result.Should().Be(RecaptchaResult.Human);
    }

    [Fact]
    public async Task VerifyAsync_MalformedGoogleResponse_ReturnsHuman()
    {
        var sut = CreateSut(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("null", Encoding.UTF8, "application/json"),
        });

        var result = await sut.VerifyAsync("any-token");

        result.Should().Be(RecaptchaResult.Human);
    }

    // ─── The only case that still blocks: a verified bot ──────────────────────

    [Theory]
    [InlineData(0.0f)]
    [InlineData(0.1f)]
    [InlineData(0.49f)]
    public async Task VerifyAsync_VerifiedTokenBelowThreshold_ReturnsBot(float score)
    {
        // Bot protection must still work when reCAPTCHA is correctly configured.
        var sut = CreateSut(_ => JsonResponse(success: true, score));

        var result = await sut.VerifyAsync("real-token-scored-as-a-bot");

        result.Should().Be(RecaptchaResult.Bot);
    }

    [Theory]
    [InlineData(0.5f)]  // exactly at the threshold — a human
    [InlineData(0.9f)]
    [InlineData(1.0f)]
    public async Task VerifyAsync_VerifiedTokenAtOrAboveThreshold_ReturnsHuman(float score)
    {
        var sut = CreateSut(_ => JsonResponse(success: true, score));

        var result = await sut.VerifyAsync("real-token-scored-as-a-human");

        result.Should().Be(RecaptchaResult.Human);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private static HttpResponseMessage JsonResponse(bool success, float score)
    {
        var json = string.Format(
            CultureInfo.InvariantCulture,
            "{{\"success\":{0},\"score\":{1},\"action\":\"contact_form\"}}",
            success ? "true" : "false",
            score.ToString(CultureInfo.InvariantCulture));

        return new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json"),
        };
    }

    private sealed class StubHandler(Func<HttpRequestMessage, HttpResponseMessage> respond) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
            => Task.FromResult(respond(request));
    }
}
