using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.Data;

namespace WoodenHousesAPI.Controllers.Admin;

[ApiController]
[Route("api/admin/contacts")]
[Authorize]
public class AdminContactsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status,
        [FromQuery] string? priority,
        [FromQuery] string? search,
        [FromQuery] bool showSpam = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = db.Contacts.AsQueryable();

        // By default show only legitimate submissions; showSpam=true shows only spam
        query = showSpam
            ? query.Where(c => c.IsSpam)
            : query.Where(c => !c.IsSpam);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(c => c.Status == status);

        if (!string.IsNullOrEmpty(priority))
            query = query.Where(c => c.Priority == priority);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(c =>
                c.Name.Contains(search)  ||
                c.Email.Contains(search) ||
                (c.Phone != null && c.Phone.Contains(search)));

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    /// <summary>Returns the count of spam contacts (for the admin badge).</summary>
    [HttpGet("spam-count")]
    public async Task<IActionResult> SpamCount()
    {
        var count = await db.Contacts.CountAsync(c => c.IsSpam);
        return Ok(new { count });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var contact = await db.Contacts
            .Include(c => c.Quotes)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (contact is null) return NotFound();
        return Ok(contact);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Dictionary<string, object?> patch)
    {
        var contact = await db.Contacts.FindAsync(id);
        if (contact is null) return NotFound();

        if (patch.TryGetValue("status",      out var s) && s is not null) contact.Status      = s.ToString()!;
        if (patch.TryGetValue("priority",    out var p) && p is not null) contact.Priority    = p.ToString()!;
        if (patch.TryGetValue("notes",       out var n))                  contact.Notes       = n?.ToString();
        if (patch.TryGetValue("contactedAt", out var ca) && ca is not null)
            contact.ContactedAt = DateTime.Parse(ca.ToString()!);
        if (patch.TryGetValue("isSpam", out var sp) && sp is not null)
        {
            contact.IsSpam     = bool.Parse(sp.ToString()!);
            contact.SpamReason = contact.IsSpam ? "manual" : null;
        }

        contact.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(contact);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var contact = await db.Contacts.FindAsync(id);
        if (contact is null) return NotFound();

        db.Contacts.Remove(contact);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
