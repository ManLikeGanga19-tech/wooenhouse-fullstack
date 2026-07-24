using Microsoft.AspNetCore.Http;

namespace WoodenHousesAPI.Common;

/// <summary>
/// Resolves the real client IP when the app runs behind Cloudflare → Caddy.
///
/// Precedence (per the ops playbook):
///   1. CF-Connecting-IP — set by Cloudflare to the true client; cannot be spoofed
///      by traffic that actually transits the Cloudflare edge.
///   2. left-most X-Forwarded-For — the original client when CF isn't present.
///   3. the socket peer — direct connections / local dev.
///
/// Used as the rate-limiter partition key so limits are per-user, not global.
///
/// NOTE: header-based IPs are only trustworthy because the origin is reachable
/// *only* through the proxy. The deploy hardening (restrict 80/443 to Cloudflare
/// IP ranges; never publish the app container's port) is what makes spoofing
/// infeasible — see the migration runbook.
/// </summary>
public static class ClientIp
{
    public static string Get(HttpContext ctx)
    {
        var cf = ctx.Request.Headers["CF-Connecting-IP"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(cf))
            return cf.Trim();

        var xff = ctx.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(xff))
            return xff.Split(',')[0].Trim();

        return ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}
