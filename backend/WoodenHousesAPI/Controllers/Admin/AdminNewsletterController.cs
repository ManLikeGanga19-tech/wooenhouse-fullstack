using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.Data;

namespace WoodenHousesAPI.Controllers.Admin;

[ApiController]
[Route("api/admin/newsletter")]
[Authorize]
public class AdminNewsletterController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
    {
        var query = db.NewsletterSubscribers.AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(s => s.Status == status);

        var items = await query
            .OrderByDescending(s => s.SubscribedAt)
            .ToListAsync();

        return Ok(items);
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
}
