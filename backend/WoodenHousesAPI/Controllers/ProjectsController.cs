using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.Data;

namespace WoodenHousesAPI.Controllers;

/// <summary>
/// PUBLIC endpoint — returns published projects for the frontend.
/// </summary>
[ApiController]
[Route("api/projects")]
[EnableRateLimiting("standard")]
public class ProjectsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool? featured)
    {
        var query = db.Projects
            .Where(p => p.Status == "published")
            .OrderByDescending(p => p.Featured)
            .ThenByDescending(p => p.CompletedAt);

        if (featured.HasValue)
            query = (IOrderedQueryable<Models.Project>)query.Where(p => p.Featured == featured.Value);

        var projects = await query
            .Select(p => new {
                p.Id, p.Title, p.Slug, p.Description,
                p.Location, p.Category, p.CoverImage,
                p.Images, p.Featured, p.CompletedAt,
            })
            .ToListAsync();

        return Ok(projects);
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var project = await db.Projects
            .Where(p => p.Slug == slug && p.Status == "published")
            .Select(p => new {
                p.Id, p.Title, p.Slug, p.Description,
                p.Location, p.Category, p.CoverImage,
                p.Images, p.Featured, p.CompletedAt,
            })
            .FirstOrDefaultAsync();

        if (project is null) return NotFound();
        return Ok(project);
    }
}
