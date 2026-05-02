using System.ComponentModel.DataAnnotations;

namespace WoodenHousesAPI.DTOs.Newsletter;

public class SubscribeRequest
{
    [Required, EmailAddress, MaxLength(255)]
    public string  Email  { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Name     { get; set; }

    [MaxLength(50)]
    public string? Source   { get; set; } = "footer";

    // ── Spam detection (never stored, evaluated server-side) ──────────────────
    public string? Hp             { get; set; }
    public long?   LoadedAt       { get; set; }
    public string? RecaptchaToken { get; set; }
}
