using WoodenHousesAPI.Data;
using WoodenHousesAPI.Models;

namespace WoodenHousesAPI.Services;

public class AuditService(AppDbContext db, IHttpContextAccessor http) : IAuditService
{
    public async Task LogAsync(string action, string entityType, string? entityId, string? details = null)
    {
        var adminEmail = http.HttpContext?.User?.FindFirst("email")?.Value;

        db.AuditLogs.Add(new AuditLog
        {
            Action     = action,
            EntityType = entityType,
            EntityId   = entityId,
            AdminEmail = adminEmail,
            Details    = details,
        });

        await db.SaveChangesAsync();
    }
}
