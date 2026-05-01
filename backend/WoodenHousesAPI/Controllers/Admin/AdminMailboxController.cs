using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using WoodenHousesAPI.DTOs.Mailbox;
using WoodenHousesAPI.Services;

namespace WoodenHousesAPI.Controllers.Admin;

[ApiController]
[Route("api/admin/mailbox")]
[Authorize]
[EnableRateLimiting("standard")]
public class AdminMailboxController(
    IMailboxService mailbox,
    ILogger<AdminMailboxController> logger) : ControllerBase
{
    // GET /api/admin/mailbox/accounts
    [HttpGet("accounts")]
    public IActionResult GetAccounts() => Ok(mailbox.GetAccounts());

    // GET /api/admin/mailbox/{address}/folders
    [HttpGet("{address}/folders")]
    public async Task<IActionResult> GetFolders(string address, CancellationToken ct)
    {
        logger.LogInformation("[Mailbox] GetFolders request for {Address}", address);
        try
        {
            var folders = await mailbox.GetFoldersAsync(address, ct);
            return Ok(folders);
        }
        catch (KeyNotFoundException) { throw; }
        catch (TimeoutException ex)
        {
            logger.LogError("[Mailbox] GetFolders timeout for {Address}: {Msg}", address, ex.Message);
            return StatusCode(500, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[Mailbox] GetFolders error for {Address}", address);
            return StatusCode(500, new { message = $"[{ex.GetType().Name}] {ex.Message}" });
        }
    }

    // GET /api/admin/mailbox/{address}/{folder}?page=1&pageSize=25&search=
    [HttpGet("{address}/{folder}")]
    public async Task<IActionResult> GetEmails(
        string address, string folder,
        [FromQuery] int    page     = 1,
        [FromQuery] int    pageSize = 25,
        [FromQuery] string? search  = null,
        CancellationToken ct = default)
    {
        logger.LogInformation("[Mailbox] GetEmails request for {Address}/{Folder}", address, folder);
        try
        {
            var (emails, total) = await mailbox.GetEmailsAsync(address, folder, page, pageSize, search, ct);
            return Ok(new { emails, total, page, pageSize });
        }
        catch (KeyNotFoundException) { throw; }
        catch (TimeoutException ex)
        {
            logger.LogError("[Mailbox] GetEmails timeout for {Address}/{Folder}: {Msg}", address, folder, ex.Message);
            return StatusCode(500, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[Mailbox] GetEmails error for {Address}/{Folder}", address, folder);
            return StatusCode(500, new { message = $"[{ex.GetType().Name}] {ex.Message}" });
        }
    }

    // GET /api/admin/mailbox/{address}/{folder}/{uid}
    [HttpGet("{address}/{folder}/{uid:long}")]
    public async Task<IActionResult> GetEmail(
        string address, string folder, uint uid, CancellationToken ct)
    {
        try
        {
            var detail = await mailbox.GetEmailAsync(address, folder, uid, ct);
            if (detail is null) return NotFound();
            return Ok(detail);
        }
        catch (KeyNotFoundException) { throw; }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"[{ex.GetType().Name}] {ex.Message}" });
        }
    }

    // PATCH /api/admin/mailbox/{address}/{folder}/{uid}/read
    [HttpPatch("{address}/{folder}/{uid:long}/read")]
    public async Task<IActionResult> MarkRead(
        string address, string folder, uint uid,
        [FromBody] MarkReadRequest req,
        CancellationToken ct)
    {
        try
        {
            await mailbox.MarkReadAsync(address, folder, uid, req.IsRead, ct);
            return NoContent();
        }
        catch (KeyNotFoundException) { throw; }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"[{ex.GetType().Name}] {ex.Message}" });
        }
    }

    // POST /api/admin/mailbox/{address}/{folder}/{uid}/move
    [HttpPost("{address}/{folder}/{uid:long}/move")]
    public async Task<IActionResult> MoveEmail(
        string address, string folder, uint uid,
        [FromBody] MoveEmailRequest req,
        CancellationToken ct)
    {
        try
        {
            await mailbox.MoveEmailAsync(address, folder, uid, req.TargetFolder, ct);
            return NoContent();
        }
        catch (KeyNotFoundException) { throw; }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"[{ex.GetType().Name}] {ex.Message}" });
        }
    }

    // DELETE /api/admin/mailbox/{address}/{folder}/{uid}
    [HttpDelete("{address}/{folder}/{uid:long}")]
    public async Task<IActionResult> DeleteEmail(
        string address, string folder, uint uid, CancellationToken ct)
    {
        try
        {
            await mailbox.DeleteEmailAsync(address, folder, uid, ct);
            return NoContent();
        }
        catch (KeyNotFoundException) { throw; }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"[{ex.GetType().Name}] {ex.Message}" });
        }
    }

    // POST /api/admin/mailbox/send
    [HttpPost("send")]
    public async Task<IActionResult> SendEmail(
        [FromBody] SendEmailRequest req, CancellationToken ct)
    {
        try
        {
            await mailbox.SendEmailAsync(req, ct);
            return Ok(new { message = "Email sent." });
        }
        catch (KeyNotFoundException) { throw; }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"[{ex.GetType().Name}] {ex.Message}" });
        }
    }

    // POST /api/admin/mailbox/draft
    [HttpPost("draft")]
    public async Task<IActionResult> SaveDraft(
        [FromBody] SendEmailRequest req, CancellationToken ct)
    {
        try
        {
            await mailbox.SaveDraftAsync(req, ct);
            return Ok(new { message = "Draft saved." });
        }
        catch (KeyNotFoundException) { throw; }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"[{ex.GetType().Name}] {ex.Message}" });
        }
    }

    // GET /api/admin/mailbox/{address}/{folder}/{uid}/attachment/{partSpecifier}
    [HttpGet("{address}/{folder}/{uid:long}/attachment/{partSpecifier}")]
    public async Task<IActionResult> GetAttachment(
        string address, string folder, uint uid, string partSpecifier, CancellationToken ct)
    {
        try
        {
            var (data, contentType, fileName) = await mailbox.GetAttachmentAsync(address, folder, uid, partSpecifier, ct);
            return File(data, contentType, fileName);
        }
        catch (KeyNotFoundException) { throw; }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"[{ex.GetType().Name}] {ex.Message}" });
        }
    }
}
