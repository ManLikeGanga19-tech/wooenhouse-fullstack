namespace WoodenHousesAPI.Services;

public class FileService(IWebHostEnvironment env) : IFileService
{
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    public async Task<string> UploadAsync(IFormFile file, string subfolder)
    {
        // Validate size
        if (file.Length > MaxFileSizeBytes)
            throw new InvalidOperationException($"File size exceeds the 10 MB limit.");

        // Validate extension (never trust Content-Type header alone)
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            throw new InvalidOperationException($"File type '{ext}' is not allowed.");

        // Build storage path under wwwroot/uploads/{subfolder}/
        var uploadsRoot = Path.Combine(env.WebRootPath ?? "wwwroot", "uploads", subfolder);
        Directory.CreateDirectory(uploadsRoot);

        // Use a GUID filename to avoid path traversal and name collisions
        var fileName  = $"{Guid.NewGuid()}{ext}";
        var filePath  = Path.Combine(uploadsRoot, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        // Return the public URL path
        return $"/uploads/{subfolder}/{fileName}";
    }

    public void Delete(string urlPath)
    {
        if (string.IsNullOrWhiteSpace(urlPath)) return;

        // Sanitize: ensure path stays within wwwroot
        var relativePath = urlPath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var fullPath     = Path.Combine(env.WebRootPath ?? "wwwroot", relativePath);
        var webRootFull  = Path.GetFullPath(env.WebRootPath ?? "wwwroot");

        // Path traversal guard
        if (!Path.GetFullPath(fullPath).StartsWith(webRootFull, StringComparison.OrdinalIgnoreCase))
            return;

        if (File.Exists(fullPath))
            File.Delete(fullPath);
    }
}
