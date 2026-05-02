using System.ComponentModel.DataAnnotations;

namespace WoodenHousesAPI.Models;

public class Contact
{
    public Guid      Id           { get; set; } = Guid.NewGuid();

    [MaxLength(200)]
    public string    Name         { get; set; } = string.Empty;

    [MaxLength(255)]
    public string    Email        { get; set; } = string.Empty;

    [MaxLength(30)]
    public string?   Phone        { get; set; }

    [MaxLength(100)]
    public string?   ServiceType  { get; set; }

    [MaxLength(200)]
    public string?   Location     { get; set; }

    [MaxLength(100)]
    public string?   Budget       { get; set; }

    [MaxLength(100)]
    public string?   Timeline     { get; set; }

    [MaxLength(2000)]
    public string?   Message      { get; set; }

    public bool      Newsletter   { get; set; } = false;

    // Admin-managed fields
    [MaxLength(20)]
    public string    Status       { get; set; } = "new";      // new | contacted | quoted | closed

    [MaxLength(20)]
    public string    Priority     { get; set; } = "medium";   // low | medium | high

    [MaxLength(2000)]
    public string?   Notes        { get; set; }

    // Spam detection
    public bool      IsSpam       { get; set; } = false;

    [MaxLength(50)]
    public string?   SpamReason   { get; set; }               // honeypot | fast-submit | manual

    public DateTime  CreatedAt    { get; set; } = DateTime.UtcNow;
    public DateTime  UpdatedAt    { get; set; } = DateTime.UtcNow;
    public DateTime? ContactedAt  { get; set; }

    // Navigation
    public ICollection<Quote> Quotes { get; set; } = [];
}
