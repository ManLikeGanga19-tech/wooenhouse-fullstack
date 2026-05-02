using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WoodenHousesAPI.Services;

namespace WoodenHousesAPI.Controllers.Admin;

[ApiController]
[Route("api/admin/upload")]
[Authorize]
public class AdminUploadController(IFileService fileService, IConfiguration config) : ControllerBase
{
    /// <summary>
    /// Returns a short-lived Cloudinary signed-upload token so the browser can POST
    /// files directly to Cloudinary without routing file bytes through this server.
    /// Eliminates the Render 30-second request-body timeout on large uploads.
    /// </summary>
    [HttpGet("signature")]
    public IActionResult GetSignature([FromQuery] string folder = "wooden-houses-kenya/uploads")
    {
        var cloudName = config["Cloudinary:CloudName"];
        var apiKey    = config["Cloudinary:ApiKey"];
        var apiSecret = config["Cloudinary:ApiSecret"];

        if (cloudName is null || apiKey is null || apiSecret is null)
            return StatusCode(503, new { message = "Cloudinary is not configured on this server." });

        var timestamp   = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        // Parameters must be sorted alphabetically; resource_type and api_key are excluded from signing
        var paramString = $"folder={folder}&timestamp={timestamp}";
        var signature   = Sha1Hex(paramString + apiSecret);

        return Ok(new
        {
            cloudName,
            apiKey,
            signature,
            timestamp,
            folder,
            uploadUrl = $"https://api.cloudinary.com/v1_1/{cloudName}/auto/upload",
        });
    }

    /// <summary>
    /// Legacy server-side upload kept for the agent-context file endpoint which needs
    /// text extraction before storing.  Blog / project images should use the signature
    /// flow instead.
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

    private static string Sha1Hex(string input)
    {
        var bytes = System.Security.Cryptography.SHA1.HashData(
            System.Text.Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
