using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WoodenHousesAPI.Services;

namespace WoodenHousesAPI.Controllers.Admin;

[ApiController]
[Route("api/admin/upload")]
[Authorize]
public class AdminUploadController(IFileService fileService) : ControllerBase
{
    /// <summary>
    /// Upload a single image (JPG, PNG, WebP, GIF — max 10 MB).
    /// Returns the public URL path: /uploads/projects/{guid}.ext
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "No file provided." });

        try
        {
            var url = await fileService.UploadAsync(file, "projects");
            return Ok(new { url });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
