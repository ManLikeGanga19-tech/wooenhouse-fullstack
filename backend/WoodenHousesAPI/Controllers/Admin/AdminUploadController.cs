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
    /// Server-side upload → object storage (Contabo). Returns the public URL.
    /// On Contabo there is no Render-style request-timeout, so routing the bytes
    /// through the API (streamed to storage) is simpler and keeps validation here.
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(200L * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 200L * 1024 * 1024)]
    public async Task<IActionResult> Upload(IFormFile file, [FromQuery] string folder = "uploads")
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "No file provided." });

        try
        {
            var url = await fileService.UploadAsync(file, folder);
            return Ok(new { url });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
