using System.Text.Json.Serialization;

namespace WoodenHousesAPI.Services;

public class RecaptchaService(HttpClient httpClient, IConfiguration config) : IRecaptchaService
{
    private const string VerifyUrl   = "https://www.google.com/recaptcha/api/siteverify";
    private const float  MinScore    = 0.5f;

    private readonly string _secretKey = config["Recaptcha:SecretKey"] ?? string.Empty;

    public async Task<RecaptchaResult> VerifyAsync(string? token)
    {
        // Not configured (local dev without key, or tests) — allow.
        if (string.IsNullOrWhiteSpace(_secretKey))
            return RecaptchaResult.Human;

        // No token supplied. This is almost always a front-end/config problem
        // (e.g. NEXT_PUBLIC_RECAPTCHA_SITE_KEY missing at build time), NOT proof
        // of a bot. Fail open and let the honeypot + timing checks gate spam —
        // never silently bury a real lead just because the token didn't arrive.
        if (string.IsNullOrWhiteSpace(token))
            return RecaptchaResult.Human;

        var form = new FormUrlEncodedContent(
        [
            new KeyValuePair<string, string>("secret",   _secretKey),
            new KeyValuePair<string, string>("response", token),
        ]);

        try
        {
            var response = await httpClient.PostAsync(VerifyUrl, form);
            if (!response.IsSuccessStatusCode)
                return RecaptchaResult.Human; // Google unreachable — fail open

            var result = await response.Content.ReadFromJsonAsync<RecaptchaResponse>();

            // success=false means the token was rejected — expired, duplicate, or
            // (critically) a site-key/secret mismatch that would reject EVERY real
            // user. That's a configuration failure, not a bot, so fail open.
            if (result is null || !result.Success)
                return RecaptchaResult.Human;

            // A verified low score is the only trustworthy bot signal.
            return result.Score < MinScore ? RecaptchaResult.Bot : RecaptchaResult.Human;
        }
        catch
        {
            // Network / parse error — fail open (don't block real users due to outage).
            return RecaptchaResult.Human;
        }
    }

    // ─── Google siteverify response shape ────────────────────────────────────
    private sealed class RecaptchaResponse
    {
        [JsonPropertyName("success")] public bool    Success { get; set; }
        [JsonPropertyName("score")]   public float   Score   { get; set; }
        [JsonPropertyName("action")]  public string? Action  { get; set; }
    }
}
