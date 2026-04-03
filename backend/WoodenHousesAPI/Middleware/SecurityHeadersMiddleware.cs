namespace WoodenHousesAPI.Middleware;

/// <summary>
/// Adds production security headers to every response.
/// Equivalent of helmet.js for Node — critical for production.
/// </summary>
public class SecurityHeadersMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var headers = context.Response.Headers;

        // Prevent MIME-type sniffing
        headers["X-Content-Type-Options"] = "nosniff";

        // Clickjacking protection
        headers["X-Frame-Options"] = "DENY";

        // XSS protection (legacy browsers)
        headers["X-XSS-Protection"] = "1; mode=block";

        // Only send referrer on same origin
        headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

        // Disable browser features we don't need
        headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";

        // HSTS — browsers will only use HTTPS for 1 year
        headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";

        // Content Security Policy
        headers["Content-Security-Policy"] =
            "default-src 'self'; " +
            "script-src 'self'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "font-src 'self'; " +
            "frame-src https://www.google.com https://maps.google.com; " +
            "frame-ancestors 'none'; " +
            "form-action 'self';";

        // Remove server identification header
        context.Response.Headers.Remove("Server");
        context.Response.Headers.Remove("X-Powered-By");

        await next(context);
    }
}
