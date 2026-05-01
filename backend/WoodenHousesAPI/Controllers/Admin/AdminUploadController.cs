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
    /// Upload an image (JPG, PNG, WebP, GIF) or video (MP4, MOV, AVI, WebM) — max 200 MB.
    /// Returns the public URL.
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(200L * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 200L * 1024 * 1024)]
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
