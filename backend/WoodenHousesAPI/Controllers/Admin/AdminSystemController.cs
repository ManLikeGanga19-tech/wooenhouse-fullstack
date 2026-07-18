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
    /// <summary>
    /// Sends the branded "system update" notification email to the operators.
    /// Recipients default to the team addresses; override via "SystemUpdate:Recipients"
    /// (comma-separated) in configuration.
    /// </summary>
    [HttpPost("notify-update")]
    public async Task<IActionResult> NotifyUpdate()
    {
        var configured = config["SystemUpdate:Recipients"];
        var recipients = string.IsNullOrWhiteSpace(configured)
            ? new[] { "ericabuto@gmail.com", "orwenjodaniel19@gmail.com" }
            : configured.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        await email.SendSystemUpdateAsync(recipients);
        return Ok(new { message = $"System-update email sent to {recipients.Length} recipient(s)." });
    }
}
