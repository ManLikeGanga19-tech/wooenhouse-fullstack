namespace WoodenHousesAPI.Models;

public class Service
{
    public Guid     Id          { get; set; } = Guid.NewGuid();
    public string   Title       { get; set; } = string.Empty;
    public string   Slug        { get; set; } = string.Empty;
    public string?  Description { get; set; }
    public string?  Icon        { get; set; }
    public string?  ImageUrl    { get; set; }
    public string   Features    { get; set; } = "[]"; // JSON array of feature strings
    public int      SortOrder   { get; set; } = 0;
    public string   Status      { get; set; } = "published"; // published | draft
    public DateTime CreatedAt   { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt   { get; set; } = DateTime.UtcNow;
}
