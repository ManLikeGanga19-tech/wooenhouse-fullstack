using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.Data;

namespace WoodenHousesAPI.Controllers.Admin;

[ApiController]
[Route("api/admin/email-logs")]
[Authorize]
public class AdminEmailLogsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status,
        [FromQuery] string? type,
        [FromQuery] int page     = 1,
        [FromQuery] int pageSize = 50)
    {
        var q = db.EmailLogs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            q = q.Where(e => e.Status == status);

        if (!string.IsNullOrWhiteSpace(type))
            q = q.Where(e => e.Type == type);

        var total = await q.CountAsync();
        var items = await q
            .OrderByDescending(e => e.SentAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var sent   = await db.EmailLogs.CountAsync(e => e.Status == "sent");
        var failed = await db.EmailLogs.CountAsync(e => e.Status == "failed");
        var today  = await db.EmailLogs.CountAsync(e =>
            e.SentAt >= DateTime.UtcNow.Date && e.Status == "sent");

        return Ok(new { sent, failed, today, total = sent + failed });
    }
}
