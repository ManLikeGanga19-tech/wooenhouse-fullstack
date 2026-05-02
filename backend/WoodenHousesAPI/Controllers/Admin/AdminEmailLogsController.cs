using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.Services;

namespace WoodenHousesAPI.Controllers.Admin;

[ApiController]
[Route("api/admin/email-logs")]
[Authorize]
public class AdminEmailLogsController(AppDbContext db, IEmailService emailService) : ControllerBase
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
            .Select(e => new
            {
                e.Id,
                e.Type,
                e.FromAddress,
                e.ToAddress,
                e.Subject,
                e.Status,
                e.ErrorMessage,
                e.SentAt,
                HasBody = e.HtmlBody != null,
            })
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var log = await db.EmailLogs.FindAsync(id);
        if (log is null) return NotFound();
        return Ok(log);
    }

    [HttpPost("{id:guid}/resend")]
    public async Task<IActionResult> Resend(Guid id)
    {
        var log = await db.EmailLogs.FindAsync(id);
        if (log is null) return NotFound();

        if (string.IsNullOrWhiteSpace(log.HtmlBody))
            return BadRequest(new { message = "No email body stored for this log entry — cannot resend." });

        try
        {
            await emailService.ResendEmailAsync(log.FromAddress, log.ToAddress, log.Subject, log.HtmlBody);
            return Ok(new { message = $"Email resent to {log.ToAddress}." });
        }
        catch (Exception ex)
        {
            return StatusCode(502, new { message = $"Resend failed: {ex.Message}" });
        }
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
