using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.Models;

namespace WoodenHousesAPI.Controllers.Admin;

[ApiController]
[Route("api/admin/services")]
[Authorize]
public class AdminServicesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var services = await db.Services
            .OrderBy(s => s.SortOrder)
            .ThenBy(s => s.Title)
            .ToListAsync();
        return Ok(services);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Service service)
    {
        service.Id        = Guid.NewGuid();
        service.CreatedAt = DateTime.UtcNow;
        service.UpdatedAt = DateTime.UtcNow;
        db.Services.Add(service);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = service.Id }, service);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Service updated)
    {
        var service = await db.Services.FindAsync(id);
        if (service is null) return NotFound();

        service.Title       = updated.Title;
        service.Slug        = updated.Slug;
        service.Description = updated.Description;
        service.Icon        = updated.Icon;
        service.ImageUrl    = updated.ImageUrl;
        service.Features    = updated.Features;
        service.SortOrder   = updated.SortOrder;
        service.Status      = updated.Status;
        service.UpdatedAt   = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(service);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var service = await db.Services.FindAsync(id);
        if (service is null) return NotFound();
        db.Services.Remove(service);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
