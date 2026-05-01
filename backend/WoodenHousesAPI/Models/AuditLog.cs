namespace WoodenHousesAPI.Models;

public class AuditLog
{
    public Guid     Id         { get; set; } = Guid.NewGuid();
    public string   Action     { get; set; } = string.Empty;  // e.g. "contact.updated", "quote.deleted"
    public string   EntityType { get; set; } = string.Empty;  // e.g. "Contact", "Quote"
    public string?  EntityId   { get; set; }
    public string?  AdminEmail { get; set; }
    public string?  Details    { get; set; }
    public DateTime CreatedAt  { get; set; } = DateTime.UtcNow;
}
