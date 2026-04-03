namespace WoodenHousesAPI.Models;

public class Project
{
    public Guid      Id           { get; set; } = Guid.NewGuid();
    public string    Title        { get; set; } = string.Empty;
    public string    Slug         { get; set; } = string.Empty;
    public string?   Description  { get; set; }
    public string?   Location     { get; set; }
    public string?   Category     { get; set; }
    public string?   CoverImage   { get; set; }        // primary image URL
    public string    Images       { get; set; } = "[]"; // JSON array of image URLs
    public bool      Featured     { get; set; } = false;
    public string    Status       { get; set; } = "published"; // published | draft
    public DateTime? CompletedAt  { get; set; }
    public DateTime  CreatedAt    { get; set; } = DateTime.UtcNow;
    public DateTime  UpdatedAt    { get; set; } = DateTime.UtcNow;
}
