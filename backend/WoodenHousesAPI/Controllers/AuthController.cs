using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
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
