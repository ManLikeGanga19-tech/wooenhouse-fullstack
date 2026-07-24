using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using Microsoft.Extensions.Options;

namespace WoodenHousesAPI.Services;

/// <summary>
/// Object storage on an S3-compatible provider (Contabo Object Storage).
/// Replaces Cloudinary — keeps media on our own infrastructure.
///
/// Uploads are public-read so the marketing site can serve images directly at
/// <c>{PublicBaseUrl}/{key}</c>. Large files use the multipart TransferUtility.
/// </summary>
public class S3Settings
{
    public string ServiceUrl    { get; set; } = string.Empty; // e.g. https://eu2.contabostorage.com
    public string Region        { get; set; } = "us-east-1";  // Contabo accepts any; used for signing
    public string Bucket        { get; set; } = string.Empty;
    public string AccessKey     { get; set; } = string.Empty;
    public string SecretKey     { get; set; } = string.Empty;
    public string PublicBaseUrl { get; set; } = string.Empty; // e.g. https://eu2.contabostorage.com/<bucket> (or a CDN domain)
}

public class S3FileService(IAmazonS3 s3, IOptions<S3Settings> options, ILogger<S3FileService> log) : IFileService
{
    private readonly S3Settings _cfg = options.Value;

    public async Task<string> UploadAsync(IFormFile file, string subfolder)
    {
        if (file is null || file.Length == 0)
            throw new InvalidOperationException("No file provided.");

        var ext = Path.GetExtension(file.FileName);
        var key = $"{subfolder.Trim('/')}/{Guid.NewGuid():N}{ext}".ToLowerInvariant();

        await using var stream = file.OpenReadStream();
        var transfer = new TransferUtility(s3);
        await transfer.UploadAsync(new TransferUtilityUploadRequest
        {
            InputStream  = stream,
            BucketName   = _cfg.Bucket,
            Key          = key,
            ContentType  = file.ContentType,
            CannedACL    = S3CannedACL.PublicRead,
        });

        var url = $"{_cfg.PublicBaseUrl.TrimEnd('/')}/{key}";
        log.LogInformation("[S3] Uploaded {Key} ({Bytes} bytes)", key, file.Length);
        return url;
    }

    public void Delete(string urlPath)
    {
        if (string.IsNullOrWhiteSpace(urlPath)) return;

        // Only handle our own object URLs; ignore anything else (e.g. legacy Cloudinary).
        var prefix = _cfg.PublicBaseUrl.TrimEnd('/') + "/";
        if (!urlPath.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)) return;

        var key = urlPath[prefix.Length..];
        _ = s3.DeleteObjectAsync(new DeleteObjectRequest { BucketName = _cfg.Bucket, Key = key })
            .ContinueWith(t => log.LogWarning(t.Exception, "[S3] Delete failed for {Key}", key),
                TaskContinuationOptions.OnlyOnFaulted);
    }
}
