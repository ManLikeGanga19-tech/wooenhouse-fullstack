using System.ComponentModel.DataAnnotations;

namespace WoodenHousesAPI.Models;

public class Project
{
    public Guid      Id           { get; set; } = Guid.NewGuid();

    [MaxLength(300)]
    public string    Title        { get; set; } = string.Empty;

    [MaxLength(300)]
    public string    Slug         { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string?   Description  { get; set; }

    [MaxLength(200)]
    public string?   Location     { get; set; }

    [MaxLength(100)]
    public string?   Category     { get; set; }

    [MaxLength(2000)]
    public string?   CoverImage   { get; set; }        // primary image URL

    [MaxLength(50_000)]
    public string    Images       { get; set; } = "[]"; // JSON array of image URLs

    public bool      Featured     { get; set; } = false;

    [MaxLength(20)]
    public string    Status       { get; set; } = "published"; // published | draft

    public DateTime? CompletedAt  { get; set; }
    public DateTime  CreatedAt    { get; set; } = DateTime.UtcNow;
    public DateTime  UpdatedAt    { get; set; } = DateTime.UtcNow;
}
