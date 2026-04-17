using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.DTOs.Newsletter;
using WoodenHousesAPI.Models;
using WoodenHousesAPI.Services;

namespace WoodenHousesAPI.Controllers;

/// <summary>
/// PUBLIC endpoint — newsletter subscribe/unsubscribe.
/// </summary>
[ApiController]
[Route("api/newsletter")]
public class NewsletterController(AppDbContext db, IRecaptchaService recaptcha) : ControllerBase
{
    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe([FromBody] SubscribeRequest request)
    {
        var existing = await db.NewsletterSubscribers
            .FirstOrDefaultAsync(s => s.Email == request.Email);

        if (existing is not null)
        {
            if (existing.Status == "active")
                return Ok(new { message = "You are already subscribed." });

            existing.Status         = "active";
            existing.UnsubscribedAt = null;
            await db.SaveChangesAsync();
            return Ok(new { message = "Welcome back! You have been re-subscribed." });
        }

        var (isSpam, spamReason) = SpamDetector.Check(request.Hp, request.LoadedAt);

        // reCAPTCHA v3 — only check if honeypot/timing passed
        if (!isSpam)
        {
            var (rcOk, _) = await recaptcha.VerifyAsync(request.RecaptchaToken);
            if (!rcOk)
            {
                isSpam     = true;
                spamReason = "recaptcha";
            }
        }

        db.NewsletterSubscribers.Add(new NewsletterSubscriber
        {
            Email      = request.Email,
            Name       = request.Name,
            Source     = request.Source ?? "footer",
            IsSpam     = isSpam,
            SpamReason = spamReason,
        });

        await db.SaveChangesAsync();
        return Ok(new { message = "Thank you for subscribing!" });
    }

    [HttpPost("unsubscribe")]
    public async Task<IActionResult> Unsubscribe([FromBody] SubscribeRequest request)
    {
        var subscriber = await db.NewsletterSubscribers
            .FirstOrDefaultAsync(s => s.Email == request.Email);

        if (subscriber is null)
            return NotFound(new { message = "Email not found." });

        subscriber.Status         = "unsubscribed";
        subscriber.UnsubscribedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(new { message = "You have been unsubscribed." });
    }
}
