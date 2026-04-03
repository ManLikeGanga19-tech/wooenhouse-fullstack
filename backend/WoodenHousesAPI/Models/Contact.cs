namespace WoodenHousesAPI.Models;

public class Contact
{
    public Guid      Id           { get; set; } = Guid.NewGuid();
    public string    Name         { get; set; } = string.Empty;
    public string    Email        { get; set; } = string.Empty;
    public string?   Phone        { get; set; }
    public string?   ServiceType  { get; set; }
    public string?   Location     { get; set; }
    public string?   Budget       { get; set; }
    public string?   Timeline     { get; set; }
    public string?   Message      { get; set; }
    public bool      Newsletter   { get; set; } = false;

    // Admin-managed fields
    public string    Status       { get; set; } = "new";      // new | contacted | quoted | closed
    public string    Priority     { get; set; } = "medium";   // low | medium | high
    public string?   Notes        { get; set; }

    public DateTime  CreatedAt    { get; set; } = DateTime.UtcNow;
    public DateTime  UpdatedAt    { get; set; } = DateTime.UtcNow;
    public DateTime? ContactedAt  { get; set; }

    // Navigation
    public ICollection<Quote> Quotes { get; set; } = [];
}
