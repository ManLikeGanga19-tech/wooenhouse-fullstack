using FluentAssertions;
using WoodenHousesAPI.Common;

namespace WoodenHousesAPI.Tests.Unit;

/// <summary>
/// Locks in the two guarantees the log-sanitizer provides:
///   • Clean strips CR/LF and control chars → no forged log lines (CWE-117).
///   • MaskEmail never emits a full address or a control char → no PII leak (CWE-359).
/// </summary>
public class LogSanitizerTests
{
    [Theory]
    [InlineData("normal text", "normal text")]
    [InlineData("line1\r\nINJECTED admin logged in", "line1  INJECTED admin logged in")]
    [InlineData("tab\ttab", "tab tab")]
    [InlineData("", "")]
    public void Clean_RemovesControlCharacters(string input, string expected)
    {
        LogSanitizer.Clean(input).Should().Be(expected);
    }

    [Fact]
    public void Clean_StripsEveryControlChar()
    {
        var result = LogSanitizer.Clean("a\r\n\t\v\f\0b");
        result.Should().NotContainAny("\r", "\n", "\t", "\v", "\f", "\0");
    }

    [Theory]
    [InlineData("john.doe@gmail.com")]
    [InlineData("a@b.com")]
    [InlineData("director@woodenhouseskenya.com")]
    public void MaskEmail_NeverReturnsTheFullAddress(string email)
    {
        var masked = LogSanitizer.MaskEmail(email);

        masked.Should().NotBe(email);
        masked.Should().Contain("***");
        masked.Should().NotContain("\n").And.NotContain("\r");
    }

    [Fact]
    public void MaskEmail_KeepsShapeButHidesIdentity()
    {
        LogSanitizer.MaskEmail("john.doe@gmail.com").Should().Be("jo***@gm***");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void MaskEmail_HandlesEmpty(string? email)
    {
        LogSanitizer.MaskEmail(email).Should().Be("(none)");
    }

    [Theory]
    [InlineData("not-an-email")]
    [InlineData("@nolocal.com")]
    [InlineData("noat@")]
    public void MaskEmail_RedactsNonEmailShapes(string value)
    {
        LogSanitizer.MaskEmail(value).Should().Be("***");
    }
}
