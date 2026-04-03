using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.Models;

namespace WoodenHousesAPI.Controllers.Admin;

[ApiController]
[Route("api/admin/projects")]
[Authorize]
public class AdminProjectsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var projects = await db.Projects
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
        return Ok(projects);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Project project)
    {
        project.Id        = Guid.NewGuid();
        project.CreatedAt = DateTime.UtcNow;
        project.UpdatedAt = DateTime.UtcNow;
        db.Projects.Add(project);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = project.Id }, project);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Project updated)
    {
        var project = await db.Projects.FindAsync(id);
        if (project is null) return NotFound();

        project.Title       = updated.Title;
        project.Slug        = updated.Slug;
        project.Description = updated.Description;
        project.Location    = updated.Location;
        project.Category    = updated.Category;
        project.CoverImage  = updated.CoverImage;
        project.Images      = updated.Images;
        project.Featured    = updated.Featured;
        project.Status      = updated.Status;
        project.CompletedAt = updated.CompletedAt;
        project.UpdatedAt   = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(project);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var project = await db.Projects.FindAsync(id);
        if (project is null) return NotFound();
        db.Projects.Remove(project);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
