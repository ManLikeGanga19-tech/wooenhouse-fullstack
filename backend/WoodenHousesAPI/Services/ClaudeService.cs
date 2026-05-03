using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace WoodenHousesAPI.Services;

public class ClaudeSettings
{
    public string ApiKey { get; set; } = string.Empty;
    public string Model  { get; set; } = "claude-sonnet-4-6";
}

public record ClaudeMessage(string Role, string Content);

public class ClaudeUsage
{
    [JsonPropertyName("input_tokens")]
    public int InputTokens  { get; set; }

    [JsonPropertyName("output_tokens")]
    public int OutputTokens { get; set; }
}

public class ClaudeResponse
{
    public List<ClaudeContent> Content { get; set; } = [];

    [JsonPropertyName("stop_reason")]
    public string StopReason { get; set; } = string.Empty;

    public ClaudeUsage? Usage { get; set; }
}

public class ClaudeContent
{
    public string Type { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
}

public record ClaudeResult(string Text, int InputTokens, int OutputTokens);

public interface IClaudeService
{
    Task<ClaudeResult> CompleteAsync(string systemPrompt, string userMessage, CancellationToken ct = default, string? model = null);
}

public class ClaudeService(
    HttpClient         http,
    IOptions<ClaudeSettings> options,
    ILogger<ClaudeService>   log) : IClaudeService
{
    private readonly ClaudeSettings _cfg = options.Value;

    private static readonly JsonSerializerOptions _json = new()
    {
        PropertyNamingPolicy        = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition      = JsonIgnoreCondition.WhenWritingNull,
    };

    public async Task<ClaudeResult> CompleteAsync(
        string systemPrompt, string userMessage, CancellationToken ct = default, string? model = null)
    {
        if (string.IsNullOrWhiteSpace(_cfg.ApiKey))
            throw new InvalidOperationException("Claude API key is not configured.");

        var resolvedModel = model ?? _cfg.Model;
        var requestBody = new
        {
            model      = resolvedModel,
            max_tokens = 2048,
            system     = systemPrompt,
            messages   = new[] { new { role = "user", content = userMessage } },
        };

        var json    = JsonSerializer.Serialize(requestBody, _json);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        http.DefaultRequestHeaders.Clear();
        http.DefaultRequestHeaders.Add("x-api-key", _cfg.ApiKey);
        http.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");
        http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        log.LogInformation("[Claude] Sending request — model={Model}", resolvedModel);

        var response = await http.PostAsync("https://api.anthropic.com/v1/messages", content, ct);
        var body     = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            log.LogError("[Claude] API error {Status}: {Body}", response.StatusCode, body);

            // Try to extract a clean error message from the Anthropic error payload
            try
            {
                using var errDoc = System.Text.Json.JsonDocument.Parse(body);
                var errMsg = errDoc.RootElement
                    .GetProperty("error")
                    .GetProperty("message")
                    .GetString() ?? string.Empty;

                if (errMsg.Contains("credit balance", StringComparison.OrdinalIgnoreCase) ||
                    errMsg.Contains("insufficient", StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException(
                        "CREDITS_LOW: Your Anthropic credit balance is too low. " +
                        "Go to console.anthropic.com → Plans & Billing to top up.");
                }

                if (!string.IsNullOrWhiteSpace(errMsg))
                    throw new InvalidOperationException($"Claude API error: {errMsg}");
            }
            catch (InvalidOperationException) { throw; }
            catch { /* JSON parse failed — fall through to generic */ }

            throw new InvalidOperationException($"Claude API returned {response.StatusCode}: {body}");
        }

        var result = JsonSerializer.Deserialize<ClaudeResponse>(body, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
        });

        var text         = result?.Content.FirstOrDefault(c => c.Type == "text")?.Text ?? string.Empty;
        var inputTokens  = result?.Usage?.InputTokens  ?? 0;
        var outputTokens = result?.Usage?.OutputTokens ?? 0;

        log.LogInformation("[Claude] Response received — {Length} chars | tokens in={In} out={Out}",
            text.Length, inputTokens, outputTokens);

        return new ClaudeResult(text, inputTokens, outputTokens);
    }
}
