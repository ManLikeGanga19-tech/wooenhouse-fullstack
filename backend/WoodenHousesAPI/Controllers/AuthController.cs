using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.DTOs.Auth;
using WoodenHousesAPI.Services;

namespace WoodenHousesAPI.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    private const string CookieName = "wh_access_token";

    /// <summary>Admin login — sets a secure httpOnly cookie + returns user info.</summary>
    [HttpPost("login")]
    [EnableRateLimiting("strict")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await authService.LoginAsync(request);

        if (result is null)
        {
            // Generic message — never reveal whether email or password was wrong
            return Unauthorized(new { message = "Invalid credentials." });
        }

        // Set JWT in an httpOnly, Secure, SameSite=Strict cookie
        // This protects against XSS stealing the token from JavaScript
        var cookieOptions = new CookieOptions
        {
            HttpOnly  = true,
            Secure    = !HttpContext.Request.Host.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase),
            SameSite  = SameSiteMode.Strict,
            Expires   = result.ExpiresAt,
            Path      = "/",
        };

        Response.Cookies.Append(CookieName, result.Token, cookieOptions);

        // Return user info (NOT the token — it's in the cookie)
        return Ok(new
        {
            name      = result.Name,
            email     = result.Email,
            role      = result.Role,
            expiresAt = result.ExpiresAt,
        });
    }

    /// <summary>Verify the current session is valid.</summary>
    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        var name  = User.Identity?.Name ?? "";
        var email = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email)?.Value ?? "";
        var role  = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "";

        return Ok(new { name, email, role });
    }

    /// <summary>Change password — requires current password verification.</summary>
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        [FromServices] WoodenHousesAPI.Data.AppDbContext db)
    {
        var email = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email)?.Value;
        if (string.IsNullOrEmpty(email)) return Unauthorized();

        var user = await db.AdminUsers.FirstOrDefaultAsync(u => u.Email == email, HttpContext.RequestAborted);
        if (user is null) return Unauthorized();

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return BadRequest(new { message = "Current password is incorrect." });

        if (request.NewPassword.Length < 8)
            return BadRequest(new { message = "Password must be at least 8 characters." });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword, workFactor: 12);
        await db.SaveChangesAsync();

        return Ok(new { message = "Password updated successfully." });
    }

    /// <summary>Logout — clears the auth cookie.</summary>
    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        Response.Cookies.Delete(CookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure   = true,
            SameSite = SameSiteMode.Strict,
            Path     = "/",
        });

        return Ok(new { message = "Logged out." });
    }
}
