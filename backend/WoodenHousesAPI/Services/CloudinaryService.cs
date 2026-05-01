using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace WoodenHousesAPI.Services;

/// <summary>
/// Stores uploaded images on Cloudinary.
/// Used in production (Render has an ephemeral local filesystem).
/// Falls back to FileService in local development when no Cloudinary config is present.
/// </summary>
public class CloudinaryService(IConfiguration config) : IFileService
{
    private static readonly string[] AllowedExtensions =
        [".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".mov", ".avi", ".webm"];
    private static readonly string[] VideoExtensions = [".mp4", ".mov", ".avi", ".webm"];
    private const long MaxFileSizeBytes = 200L * 1024 * 1024; // 200 MB

    private Cloudinary CreateClient()
    {
        var cloudName = config["Cloudinary:CloudName"]
            ?? throw new InvalidOperationException("Cloudinary:CloudName is not configured.");
        var apiKey = config["Cloudinary:ApiKey"]
            ?? throw new InvalidOperationException("Cloudinary:ApiKey is not configured.");
        var apiSecret = config["Cloudinary:ApiSecret"]
            ?? throw new InvalidOperationException("Cloudinary:ApiSecret is not configured.");

        return new Cloudinary(new Account(cloudName, apiKey, apiSecret)) { Api = { Secure = true } };
    }

    public async Task<string> UploadAsync(IFormFile file, string subfolder)
    {
        if (file.Length > MaxFileSizeBytes)
            throw new InvalidOperationException("File size exceeds the 200 MB limit.");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            throw new InvalidOperationException($"File type '{ext}' is not allowed.");

        var cloudinary = CreateClient();
        var publicId   = $"wooden-houses-kenya/{subfolder}/{Guid.NewGuid()}";
        var isVideo    = VideoExtensions.Contains(ext);

        await using var stream = file.OpenReadStream();

        if (isVideo)
        {
            var result = await cloudinary.UploadAsync(new VideoUploadParams
            {
                File     = new FileDescription(file.FileName, stream),
                PublicId = publicId,
            });
            if (result.Error is not null)
                throw new InvalidOperationException($"Cloudinary upload failed: {result.Error.Message}");
            return result.SecureUrl.ToString();
        }
        else
        {
            // Note: Transformation and Overwrite=false are intentionally omitted.
            // SDK v1.28.0 includes boolean-false values in the string-to-sign, which
            // violates Cloudinary's spec ("false values must not be included") and
            // causes Invalid Signature errors. GUIDs guarantee uniqueness so Overwrite
            // is not needed. q_auto/f_auto can be applied at serve time via URL.
            var result = await cloudinary.UploadAsync(new ImageUploadParams
            {
                File     = new FileDescription(file.FileName, stream),
                PublicId = publicId,
            });
            if (result.Error is not null)
                throw new InvalidOperationException($"Cloudinary upload failed: {result.Error.Message}");
            return result.SecureUrl.ToString();
        }
    }

    public void Delete(string urlPath)
    {
        if (string.IsNullOrWhiteSpace(urlPath)) return;

        // Only attempt deletion for Cloudinary URLs — ignore local paths
        if (!urlPath.Contains("cloudinary.com", StringComparison.OrdinalIgnoreCase)) return;

        var publicId = ExtractPublicId(urlPath);
        if (string.IsNullOrWhiteSpace(publicId)) return;

        var cloudinary = CreateClient();
        cloudinary.Destroy(new DeletionParams(publicId));
    }

    /// <summary>
    /// Extracts the Cloudinary public_id from a full secure URL.
    /// Example:
    ///   https://res.cloudinary.com/demo/image/upload/v1234/wooden-houses-kenya/projects/abc.jpg
    ///   → wooden-houses-kenya/projects/abc
    /// </summary>
    private static string ExtractPublicId(string url)
    {
        try
        {
            var uri  = new Uri(url);
            var path = uri.AbsolutePath; // /demo/image/upload/v1234/folder/file.jpg

            var uploadMarker = "/upload/";
            var uploadIdx    = path.IndexOf(uploadMarker, StringComparison.Ordinal);
            if (uploadIdx < 0) return string.Empty;

            var afterUpload = path[(uploadIdx + uploadMarker.Length)..];

            // Strip optional version segment: v followed by digits
            if (afterUpload.StartsWith('v'))
            {
                var slash = afterUpload.IndexOf('/');
                if (slash > 0 && afterUpload[1..slash].All(char.IsDigit))
                    afterUpload = afterUpload[(slash + 1)..];
            }

            // Strip file extension
            var dot = afterUpload.LastIndexOf('.');
            return dot > 0 ? afterUpload[..dot] : afterUpload;
        }
        catch
        {
            return string.Empty;
        }
    }
}
