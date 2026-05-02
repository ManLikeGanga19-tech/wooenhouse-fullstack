using System.ComponentModel.DataAnnotations;

namespace WoodenHousesAPI.DTOs.Contact;

public class CreateContactRequest
{
    [Required, MinLength(2), MaxLength(200)]
    public string  Name        { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(255)]
    public string  Email       { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? Phone       { get; set; }

    [MaxLength(100)]
    public string? ServiceType { get; set; }

    [MaxLength(200)]
    public string? Location    { get; set; }

    [MaxLength(100)]
    public string? Budget      { get; set; }

    [MaxLength(100)]
    public string? Timeline    { get; set; }

    [MaxLength(2000)]
    public string? Message     { get; set; }

    public bool    Newsletter  { get; set; } = false;

    // ── Spam detection (never stored, evaluated server-side) ──────────────────
    /// <summary>Honeypot — must be empty. Bots fill this; humans never see it.</summary>
    public string? Hp             { get; set; }
    /// <summary>Unix ms timestamp recorded when the form was rendered client-side.</summary>
    public long?   LoadedAt       { get; set; }
    /// <summary>reCAPTCHA v3 token generated client-side before submit.</summary>
    public string? RecaptchaToken { get; set; }
}
