using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.DTOs.Auth;
using WoodenHousesAPI.Models;
using WoodenHousesAPI.Services;

namespace WoodenHousesAPI.Tests.Unit;

public class AuthServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly AuthService  _sut;

    private const string ValidEmail    = "admin@test.com";
    private const string ValidPassword = "SecurePass@123";

    public AuthServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _db = new AppDbContext(options);

        // Seed one admin user
        _db.AdminUsers.Add(new AdminUser
        {
            Email        = ValidEmail,
            Name         = "Test Admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(ValidPassword, workFactor: 4),
            Role         = "admin",
        });
        _db.SaveChanges();

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"]         = "super-secret-key-that-is-at-least-64-characters-long-for-test-purposes!",
                ["Jwt:Issuer"]      = "woodenhouseskenya.com",
                ["Jwt:Audience"]    = "woodenhouseskenya.com",
                ["Jwt:ExpiryHours"] = "8",
            })
            .Build();

        _sut = new AuthService(_db, config);
    }

    public void Dispose() => _db.Dispose();

    // ─── Login ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsToken()
    {
        var result = await _sut.LoginAsync(new LoginRequest
        {
            Email    = ValidEmail,
            Password = ValidPassword,
        });

        result.Should().NotBeNull();
        result!.Token.Should().NotBeNullOrWhiteSpace();
        result.Email.Should().Be(ValidEmail);
        result.Role.Should().Be("admin");
        result.ExpiresAt.Should().BeAfter(DateTime.UtcNow);
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsNull()
    {
        var result = await _sut.LoginAsync(new LoginRequest
        {
            Email    = ValidEmail,
            Password = "WrongPassword!",
        });

        result.Should().BeNull();
    }

    [Fact]
    public async Task Login_WithNonExistentEmail_ReturnsNull()
    {
        var result = await _sut.LoginAsync(new LoginRequest
        {
            Email    = "nobody@nowhere.com",
            Password = ValidPassword,
        });

        result.Should().BeNull();
    }

    [Fact]
    public async Task Login_IsCaseInsensitiveOnEmail()
    {
        var result = await _sut.LoginAsync(new LoginRequest
        {
            Email    = ValidEmail.ToUpperInvariant(),
            Password = ValidPassword,
        });

        result.Should().NotBeNull();
        result!.Token.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Login_TokenContainsCorrectClaims()
    {
        var result = await _sut.LoginAsync(new LoginRequest
        {
            Email    = ValidEmail,
            Password = ValidPassword,
        });

        result.Should().NotBeNull();

        // Parse the JWT and inspect claims
        var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var jwt     = handler.ReadJwtToken(result!.Token);

        jwt.Claims.Should().Contain(c =>
            c.Type == System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email &&
            c.Value == ValidEmail);

        jwt.Claims.Should().Contain(c =>
            c.Type == System.Security.Claims.ClaimTypes.Role &&
            c.Value == "admin");
    }

    [Fact]
    public async Task Login_TwoCallsProduceDifferentTokens()
    {
        // Each JWT has a unique jti claim — two logins = two different tokens
        var r1 = await _sut.LoginAsync(new LoginRequest { Email = ValidEmail, Password = ValidPassword });
        var r2 = await _sut.LoginAsync(new LoginRequest { Email = ValidEmail, Password = ValidPassword });

        r1!.Token.Should().NotBe(r2!.Token);
    }
}
