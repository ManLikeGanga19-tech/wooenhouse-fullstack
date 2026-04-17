namespace WoodenHousesAPI.Models;

public class BlogPost
{
    public Guid     Id               { get; set; } = Guid.NewGuid();
    public string   Title            { get; set; } = string.Empty;
    public string   Slug             { get; set; } = string.Empty;
    public string   Excerpt          { get; set; } = string.Empty;
    public string   Content          { get; set; } = string.Empty; // markdown
    public string?  CoverImage       { get; set; }
    public string   Category         { get; set; } = "Insights";
    public string   Author           { get; set; } = "Wooden Houses Kenya";
    public string?  Tags             { get; set; } // JSON array string
    public int      ReadTimeMinutes  { get; set; } = 5;
    public bool     Featured         { get; set; } = false;
    public string   Status          { get; set; } = "draft"; // draft | published
    public DateTime? PublishedAt     { get; set; }
    public DateTime CreatedAt        { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt        { get; set; } = DateTime.UtcNow;
}
