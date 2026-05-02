using System.ComponentModel.DataAnnotations;

namespace WoodenHousesAPI.Models;

public class Service
{
    public Guid     Id          { get; set; } = Guid.NewGuid();

    [MaxLength(200)]
    public string   Title       { get; set; } = string.Empty;

    [MaxLength(200)]
    public string   Slug        { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string?  Description { get; set; }

    [MaxLength(100)]
    public string?  Icon        { get; set; }

    [MaxLength(2000)]
    public string?  ImageUrl    { get; set; }

    [MaxLength(10_000)]
    public string   Features    { get; set; } = "[]"; // JSON array of feature strings

    public int      SortOrder   { get; set; } = 0;

    [MaxLength(20)]
    public string   Status      { get; set; } = "published"; // published | draft

    public DateTime CreatedAt   { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt   { get; set; } = DateTime.UtcNow;
}
