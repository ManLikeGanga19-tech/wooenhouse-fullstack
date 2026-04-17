using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.Models;

namespace WoodenHousesAPI.Controllers.Admin;

[ApiController]
[Route("api/admin/blog")]
[Authorize]
public class AdminBlogPostsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var posts = await db.BlogPosts
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new {
                b.Id, b.Title, b.Slug, b.Category,
                b.Status, b.Featured, b.PublishedAt,
                b.ReadTimeMinutes, b.CreatedAt, b.UpdatedAt,
            })
            .ToListAsync();
        return Ok(posts);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var post = await db.BlogPosts.FindAsync(id);
        if (post is null) return NotFound();
        return Ok(post);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] BlogPost post)
    {
        post.Id        = Guid.NewGuid();
        post.CreatedAt = DateTime.UtcNow;
        post.UpdatedAt = DateTime.UtcNow;

        if (post.Status == "published" && post.PublishedAt is null)
            post.PublishedAt = DateTime.UtcNow;

        db.BlogPosts.Add(post);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = post.Id }, post);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] BlogPost updated)
    {
        var post = await db.BlogPosts.FindAsync(id);
        if (post is null) return NotFound();

        post.Title           = updated.Title;
        post.Slug            = updated.Slug;
        post.Excerpt         = updated.Excerpt;
        post.Content         = updated.Content;
        post.CoverImage      = updated.CoverImage;
        post.Category        = updated.Category;
        post.Author          = updated.Author;
        post.Tags            = updated.Tags;
        post.ReadTimeMinutes = updated.ReadTimeMinutes;
        post.Featured        = updated.Featured;
        post.Status          = updated.Status;
        post.UpdatedAt       = DateTime.UtcNow;

        if (post.Status == "published" && post.PublishedAt is null)
            post.PublishedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(post);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var post = await db.BlogPosts.FindAsync(id);
        if (post is null) return NotFound();
        db.BlogPosts.Remove(post);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
