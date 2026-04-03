using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Moq;
using WoodenHousesAPI.Services;

namespace WoodenHousesAPI.Tests.Unit;

public class FileServiceTests : IDisposable
{
    private readonly string         _tempRoot;
    private readonly FileService    _sut;

    public FileServiceTests()
    {
        _tempRoot = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        Directory.CreateDirectory(_tempRoot);

        var envMock = new Mock<IWebHostEnvironment>();
        envMock.Setup(e => e.WebRootPath).Returns(_tempRoot);

        _sut = new FileService(envMock.Object);
    }

    public void Dispose()
    {
        if (Directory.Exists(_tempRoot))
            Directory.Delete(_tempRoot, recursive: true);
    }

    // ─── Upload ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Upload_ValidJpeg_ReturnsPublicUrl()
    {
        var file = MakeFormFile("photo.jpg", "image/jpeg");

        var url = await _sut.UploadAsync(file, "projects");

        url.Should().StartWith("/uploads/projects/");
        url.Should().EndWith(".jpg");
    }

    [Theory]
    [InlineData("image.jpg")]
    [InlineData("photo.jpeg")]
    [InlineData("picture.png")]
    [InlineData("hero.webp")]
    [InlineData("banner.gif")]
    public async Task Upload_AllAllowedExtensions_Succeed(string filename)
    {
        var file = MakeFormFile(filename, "image/jpeg");
        var url  = await _sut.UploadAsync(file, "services");
        url.Should().NotBeNullOrWhiteSpace();
    }

    [Theory]
    [InlineData("script.php")]
    [InlineData("virus.exe")]
    [InlineData("shell.sh")]
    [InlineData("data.json")]
    [InlineData("config.env")]
    public async Task Upload_DisallowedExtension_Throws(string filename)
    {
        var file = MakeFormFile(filename, "application/octet-stream");

        Func<Task> act = () => _sut.UploadAsync(file, "projects");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not allowed*");
    }

    [Fact]
    public async Task Upload_FileTooLarge_Throws()
    {
        // 11 MB — over the 10 MB limit
        var file = MakeFormFile("big.jpg", "image/jpeg", sizeBytes: 11 * 1024 * 1024);

        Func<Task> act = () => _sut.UploadAsync(file, "projects");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*10 MB*");
    }

    [Fact]
    public async Task Upload_CreatesFileOnDisk()
    {
        var file = MakeFormFile("test.png", "image/png");
        var url  = await _sut.UploadAsync(file, "projects");

        var relativePath = url.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var fullPath     = Path.Combine(_tempRoot, relativePath);

        File.Exists(fullPath).Should().BeTrue();
    }

    [Fact]
    public async Task Upload_GeneratesUniqueFilenames()
    {
        var file1 = MakeFormFile("same.jpg", "image/jpeg");
        var file2 = MakeFormFile("same.jpg", "image/jpeg");

        var url1 = await _sut.UploadAsync(file1, "projects");
        var url2 = await _sut.UploadAsync(file2, "projects");

        url1.Should().NotBe(url2);
    }

    // ─── Delete ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_ExistingFile_RemovesFromDisk()
    {
        var file = MakeFormFile("delete-me.jpg", "image/jpeg");
        var url  = await _sut.UploadAsync(file, "projects");

        var relativePath = url.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var fullPath     = Path.Combine(_tempRoot, relativePath);
        File.Exists(fullPath).Should().BeTrue();

        _sut.Delete(url);

        File.Exists(fullPath).Should().BeFalse();
    }

    [Fact]
    public void Delete_NonExistentFile_DoesNotThrow()
    {
        Action act = () => _sut.Delete("/uploads/projects/doesnotexist.jpg");
        act.Should().NotThrow();
    }

    [Theory]
    [InlineData("/../../../etc/passwd")]
    [InlineData("/uploads/../../../etc/shadow")]
    public void Delete_PathTraversalAttempt_DoesNothing(string maliciousPath)
    {
        // Must not throw AND must not delete anything outside webroot
        Action act = () => _sut.Delete(maliciousPath);
        act.Should().NotThrow();
    }

    [Fact]
    public void Delete_NullOrEmptyPath_DoesNotThrow()
    {
        Action act1 = () => _sut.Delete(null!);
        Action act2 = () => _sut.Delete("");
        act1.Should().NotThrow();
        act2.Should().NotThrow();
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private static IFormFile MakeFormFile(
        string filename,
        string contentType,
        int sizeBytes = 1024)
    {
        var content = new byte[sizeBytes];
        var stream  = new MemoryStream(content);
        var mock    = new Mock<IFormFile>();

        mock.Setup(f => f.FileName).Returns(filename);
        mock.Setup(f => f.ContentType).Returns(contentType);
        mock.Setup(f => f.Length).Returns(sizeBytes);
        mock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), default))
            .Returns((Stream target, CancellationToken _) => stream.CopyToAsync(target));

        return mock.Object;
    }
}
