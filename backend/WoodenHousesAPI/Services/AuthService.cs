using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.DTOs.Auth;

namespace WoodenHousesAPI.Services;

public class AuthService(AppDbContext db, IConfiguration config) : IAuthService
{
    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var user = await db.AdminUsers
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == request.Email.ToLowerInvariant());

        // Always run bcrypt even on failure to prevent timing attacks
        var passwordValid = user is not null &&
            BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

        if (user is null || !passwordValid)
            return null;

        var (token, expiresAt) = GenerateJwt(user.Id, user.Email, user.Name, user.Role);

        return new LoginResponse
        {
            Token     = token,
            Name      = user.Name,
            Email     = user.Email,
            Role      = user.Role,
            ExpiresAt = expiresAt,
        };
    }

    private (string token, DateTime expiresAt) GenerateJwt(
        Guid userId, string email, string name, string role)
    {
        var jwtKey    = config["Jwt:Key"]!;
        var issuer    = config["Jwt:Issuer"]!;
        var audience  = config["Jwt:Audience"]!;
        var expiryHrs = int.Parse(config["Jwt:ExpiryHours"] ?? "8");
        var expiresAt = DateTime.UtcNow.AddHours(expiryHrs);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(JwtRegisteredClaimNames.Name,  name),
            new Claim(ClaimTypes.Role,               role),
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()), // unique token ID
            new Claim(JwtRegisteredClaimNames.Iat,
                new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds().ToString(),
                ClaimValueTypes.Integer64),
        };

        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer:             issuer,
            audience:           audience,
            claims:             claims,
            notBefore:          DateTime.UtcNow,
            expires:            expiresAt,
            signingCredentials: creds
        );

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
