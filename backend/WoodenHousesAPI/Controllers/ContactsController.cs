using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.DTOs.Contact;
using WoodenHousesAPI.Models;
using WoodenHousesAPI.Services;

namespace WoodenHousesAPI.Controllers;

/// <summary>
/// PUBLIC endpoint — called by the frontend contact form.
/// </summary>
[ApiController]
[Route("api/contact")]
public class ContactsController(
    AppDbContext db,
    IEmailService emailService,
    IRecaptchaService recaptcha,
    ISalesAgentService salesAgent,
    ILogger<ContactsController> logger) : ControllerBase
{
    [HttpPost]
    [EnableRateLimiting("strict")]
    public async Task<IActionResult> Submit([FromBody] CreateContactRequest request)
    {
        // 1. Spam detection — always save silently, never reveal detection to caller
        var (isSpam, spamReason) = SpamDetector.Check(request.Hp, request.LoadedAt);

        // 2. reCAPTCHA v3 — only check if honeypot/timing passed
        if (!isSpam)
        {
            var (rcOk, _) = await recaptcha.VerifyAsync(request.RecaptchaToken);
            if (!rcOk)
            {
                isSpam     = true;
                spamReason = "recaptcha";
            }
        }

        // 3. Save the contact entry
        var contact = new Contact
        {
            Name        = request.Name,
            Email       = request.Email,
            Phone       = request.Phone,
            ServiceType = request.ServiceType,
            Location    = request.Location,
            Budget      = request.Budget,
            Timeline    = request.Timeline,
            Message     = request.Message,
            Newsletter  = request.Newsletter,
            IsSpam      = isSpam,
            SpamReason  = spamReason,
        };

        db.Contacts.Add(contact);
        await db.SaveChangesAsync();

        // 4. Auto-subscribe to newsletter only for legitimate submissions
        if (request.Newsletter && !isSpam)
        {
            var alreadySubscribed = await db.NewsletterSubscribers
                .AnyAsync(s => s.Email == request.Email);

            if (!alreadySubscribed)
            {
                try
                {
                    db.NewsletterSubscribers.Add(new NewsletterSubscriber
                    {
                        Email  = request.Email,
                        Name   = request.Name,
                        Source = "contact-form",
                    });
                    await db.SaveChangesAsync();
                }
                catch (DbUpdateException)
                {
                    // Race condition on unique index — ignore
                }
            }
        }

        // 5. For real submissions: notify admin and fire the sales agent (fire-and-forget)
        if (!isSpam)
        {
            _ = emailService
                .SendContactNotificationAsync(request.Name, request.Email, request.Message)
                .ContinueWith(t => logger.LogError(t.Exception,
                    "[EMAIL] Notification failed for contact from {Email}", request.Email),
                    CancellationToken.None,
                    TaskContinuationOptions.OnlyOnFaulted,
                    TaskScheduler.Default);

            // Sales agent handles the personalised reply — replaces the generic auto-reply
            _ = salesAgent
                .HandleNewContactAsync(contact.Id)
                .ContinueWith(t => logger.LogError(t.Exception,
                    "[SalesAgent] Failed for contact {ContactId}", contact.Id),
                    CancellationToken.None,
                    TaskContinuationOptions.OnlyOnFaulted,
                    TaskScheduler.Default);
        }

        return Ok(new { message = "Thank you! We will be in touch soon." });
    }
}
