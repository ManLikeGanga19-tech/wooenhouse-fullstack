using System.ComponentModel.DataAnnotations;

namespace WoodenHousesAPI.DTOs.Newsletter;

public class SubscribeRequest
{
    [Required, EmailAddress]
    public string  Email  { get; set; } = string.Empty;

    public string? Name     { get; set; }
    public string? Source   { get; set; } = "footer";

    // ── Spam detection (never stored, evaluated server-side) ──────────────────
    public string? Hp             { get; set; }
    public long?   LoadedAt       { get; set; }
    public string? RecaptchaToken { get; set; }
}
