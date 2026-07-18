using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WoodenHousesAPI.Services;

namespace WoodenHousesAPI.Controllers.Admin;

/// <summary>
/// Admin-only system/ops actions.
/// </summary>
[ApiController]
[Route("api/admin/system")]
[Authorize]
public class AdminSystemController(IEmailService email, IConfiguration config) : ControllerBase
{
    public record SystemUpdateRequest(string Subject, string Message, string[]? Recipients);

    /// <summary>
    /// Sends a branded "system update" email to the team. Recipients default to the
    /// operators (override per-request, or via "SystemUpdate:Recipients" in config).
    /// Reusable — send any future update the same way.
    /// </summary>
    [HttpPost("notify-update")]
    public async Task<IActionResult> NotifyUpdate([FromBody] SystemUpdateRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Subject) || string.IsNullOrWhiteSpace(req.Message))
            return BadRequest(new { message = "Subject and message are required." });

        var recipients =
            req.Recipients is { Length: > 0 } r ? r
            : !string.IsNullOrWhiteSpace(config["SystemUpdate:Recipients"])
                ? config["SystemUpdate:Recipients"]!.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                : ["ericabuto@gmail.com", "orwenjodaniel19@gmail.com"];

        await email.SendSystemUpdateAsync(recipients, req.Subject.Trim(), req.Message.Trim());
        return Ok(new { message = $"Update sent to {recipients.Length} recipient(s)." });
    }
}
