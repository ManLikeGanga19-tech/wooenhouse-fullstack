using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.Data;

namespace WoodenHousesAPI.Controllers;

[ApiController]
[Route("api/blog")]
public class BlogPostsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? category,
        [FromQuery] bool?   featured,
        [FromQuery] int     page  = 1,
        [FromQuery] int     limit = 12)
    {
        var query = db.BlogPosts
            .Where(b => b.Status == "published")
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(b => b.Category == category);

        if (featured.HasValue)
            query = query.Where(b => b.Featured == featured.Value);

        var total = await query.CountAsync();

        var posts = await query
            .OrderByDescending(b => b.Featured)
            .ThenByDescending(b => b.PublishedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(b => new {
                b.Id, b.Title, b.Slug, b.Excerpt,
                b.CoverImage, b.Category, b.Author,
                b.Tags, b.ReadTimeMinutes, b.Featured,
                b.PublishedAt,
            })
            .ToListAsync();

        return Ok(new { total, page, limit, posts });
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var post = await db.BlogPosts
            .Where(b => b.Slug == slug && b.Status == "published")
            .Select(b => new {
                b.Id, b.Title, b.Slug, b.Excerpt, b.Content,
                b.CoverImage, b.Category, b.Author,
                b.Tags, b.ReadTimeMinutes, b.Featured,
                b.PublishedAt,
            })
            .FirstOrDefaultAsync();

        if (post is null) return NotFound();
        return Ok(post);
    }
}
