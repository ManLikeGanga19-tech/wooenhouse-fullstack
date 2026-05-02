using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.Data;

namespace WoodenHousesAPI.Controllers;

/// <summary>
/// PUBLIC endpoint — returns published services for the frontend.
/// </summary>
[ApiController]
[Route("api/services")]
[EnableRateLimiting("standard")]
public class ServicesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var services = await db.Services
            .Where(s => s.Status == "published")
            .OrderBy(s => s.SortOrder)
            .Select(s => new {
                s.Id, s.Title, s.Slug, s.Description,
                s.Icon, s.ImageUrl, s.Features, s.Status,
            })
            .ToListAsync();

        return Ok(services);
    }
}
