using System.ComponentModel.DataAnnotations;

namespace WoodenHousesAPI.Models;

public class BlogPost
{
    public Guid     Id               { get; set; } = Guid.NewGuid();

    [MaxLength(300)]
    public string   Title            { get; set; } = string.Empty;

    [MaxLength(300)]
    public string   Slug             { get; set; } = string.Empty;

    [MaxLength(500)]
    public string   Excerpt          { get; set; } = string.Empty;

    [MaxLength(200_000)]
    public string   Content          { get; set; } = string.Empty; // markdown

    [MaxLength(2000)]
    public string?  CoverImage       { get; set; }

    [MaxLength(100)]
    public string   Category         { get; set; } = "Insights";

    [MaxLength(200)]
    public string   Author           { get; set; } = "Wooden Houses Kenya";

    [MaxLength(2000)]
    public string?  Tags             { get; set; } // JSON array string

    [Range(1, 120)]
    public int      ReadTimeMinutes  { get; set; } = 5;

    public bool     Featured         { get; set; } = false;

    [MaxLength(20)]
    public string   Status          { get; set; } = "draft"; // draft | published

    public DateTime? PublishedAt     { get; set; }
    public DateTime CreatedAt        { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt        { get; set; } = DateTime.UtcNow;
}
