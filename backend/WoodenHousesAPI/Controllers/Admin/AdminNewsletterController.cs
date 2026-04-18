using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.DTOs.Newsletter;
using WoodenHousesAPI.Services;

namespace WoodenHousesAPI.Controllers.Admin;

[ApiController]
[Route("api/admin/newsletter")]
[Authorize]
public class AdminNewsletterController(AppDbContext db, IEmailService emailService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status,
        [FromQuery] bool showSpam = false)
    {
        var query = db.NewsletterSubscribers.AsQueryable();

        // By default show only legitimate subscribers; showSpam=true shows only spam
        query = showSpam
            ? query.Where(s => s.IsSpam)
            : query.Where(s => !s.IsSpam);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(s => s.Status == status);

        var items = await query
            .OrderByDescending(s => s.SubscribedAt)
            .ToListAsync();

        return Ok(items);
    }

    /// <summary>Returns the count of spam subscribers (for the admin badge).</summary>
    [HttpGet("spam-count")]
    public async Task<IActionResult> SpamCount()
    {
        var count = await db.NewsletterSubscribers.CountAsync(s => s.IsSpam);
        return Ok(new { count });
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Dictionary<string, object?> patch)
    {
        var subscriber = await db.NewsletterSubscribers.FindAsync(id);
        if (subscriber is null) return NotFound();

        if (patch.TryGetValue("isSpam", out var sp) && sp is not null)
        {
            subscriber.IsSpam     = bool.Parse(sp.ToString()!);
            subscriber.SpamReason = subscriber.IsSpam ? "manual" : null;
        }

        await db.SaveChangesAsync();
        return Ok(subscriber);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var subscriber = await db.NewsletterSubscribers.FindAsync(id);
        if (subscriber is null) return NotFound();

        db.NewsletterSubscribers.Remove(subscriber);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("send")]
    public async Task<IActionResult> SendBroadcast([FromBody] NewsletterBroadcastRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Subject) || string.IsNullOrWhiteSpace(request.Content))
            return BadRequest(new { message = "Subject and content are required." });

        var recipients = await db.NewsletterSubscribers
            .Where(s => s.Status == "active" && !s.IsSpam)
            .Select(s => s.Email)
            .ToListAsync();

        if (recipients.Count == 0)
            return BadRequest(new { message = "No active subscribers found." });

        _ = emailService.SendNewsletterBroadcastAsync(recipients, request.Subject, request.Content);

        return Ok(new
        {
            message = $"Newsletter queued for {recipients.Count} subscriber{(recipients.Count == 1 ? "" : "s")}.",
            count   = recipients.Count,
        });
    }

    [HttpGet("active-count")]
    public async Task<IActionResult> ActiveCount()
    {
        var count = await db.NewsletterSubscribers.CountAsync(s => s.Status == "active" && !s.IsSpam);
        return Ok(new { count });
    }
}
