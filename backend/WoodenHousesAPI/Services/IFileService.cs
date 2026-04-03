namespace WoodenHousesAPI.Services;

public interface IFileService
{
    /// <summary>Upload a file and return its public URL path.</summary>
    Task<string> UploadAsync(IFormFile file, string subfolder);

    /// <summary>Delete a file by its public URL path.</summary>
    void Delete(string urlPath);
}
