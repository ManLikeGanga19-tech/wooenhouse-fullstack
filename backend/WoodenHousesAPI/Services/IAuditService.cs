namespace WoodenHousesAPI.Services;

public interface IAuditService
{
    Task LogAsync(string action, string entityType, string? entityId, string? details = null);
}
