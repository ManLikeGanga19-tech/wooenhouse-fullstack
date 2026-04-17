using System.Text.Json.Serialization;

namespace WoodenHousesAPI.Services;

public class RecaptchaService(HttpClient httpClient, IConfiguration config) : IRecaptchaService
{
    private const string VerifyUrl   = "https://www.google.com/recaptcha/api/siteverify";
    private const float  MinScore    = 0.5f;

    private readonly string _secretKey = config["Recaptcha:SecretKey"] ?? string.Empty;

    public async Task<(bool success, float score)> VerifyAsync(string? token)
    {
        // Not configured (local dev without key, or tests) — pass silently
        if (string.IsNullOrWhiteSpace(_secretKey))
            return (true, 1.0f);

        // Token missing — treat as bot
        if (string.IsNullOrWhiteSpace(token))
            return (false, 0f);

        var form = new FormUrlEncodedContent(
        [
            new KeyValuePair<string, string>("secret",   _secretKey),
            new KeyValuePair<string, string>("response", token),
        ]);

        try
        {
            var response = await httpClient.PostAsync(VerifyUrl, form);
            if (!response.IsSuccessStatusCode)
                return (false, 0f);

            var result = await response.Content.ReadFromJsonAsync<RecaptchaResponse>();
            if (result is null || !result.Success)
                return (false, result?.Score ?? 0f);

            return (result.Score >= MinScore, result.Score);
        }
        catch
        {
            // Network / parse error — fail open (don't block real users due to outage)
            return (true, 1.0f);
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
