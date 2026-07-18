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
    IRecaptchaService recaptcha,
    IServiceScopeFactory scopeFactory) : ControllerBase
{
    [HttpPost]
    [EnableRateLimiting("strict")]
    public async Task<IActionResult> Submit([FromBody] CreateContactRequest request)
    {
        // 1. Spam detection — always save silently, never reveal detection to caller
        var (isSpam, spamReason) = SpamDetector.Check(request.Hp, request.LoadedAt);

        // 2. reCAPTCHA v3 — only check if honeypot/timing passed. Flags spam ONLY
        //    when Google positively verifies the token as a bot; a missing or
        //    unverifiable token fails open so real leads are never lost.
        if (!isSpam)
        {
            if (await recaptcha.VerifyAsync(request.RecaptchaToken) == RecaptchaResult.Bot)
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

        // 5. For real submissions: notify admin and draft the sales-agent reply.
        //    This runs AFTER the response returns, so it MUST use its own DI scope —
        //    the request-scoped AppDbContext is disposed the moment we return, and the
        //    old code crashed here with ObjectDisposedException. We capture the values
        //    the background work needs, then resolve fresh scoped services inside Task.Run.
        if (!isSpam)
        {
            var contactId  = contact.Id;
            var name       = request.Name;
            var email      = request.Email;
            var message    = request.Message;

            _ = Task.Run(async () =>
            {
                using var scope = scopeFactory.CreateScope();
                var sp        = scope.ServiceProvider;
                var email0    = sp.GetRequiredService<IEmailService>();
                var salesAgent = sp.GetRequiredService<ISalesAgentService>();
                var log        = sp.GetRequiredService<ILogger<ContactsController>>();

                try
                {
                    await email0.SendContactNotificationAsync(name, email, message);
                }
                catch (Exception ex)
                {
                    log.LogError(ex, "[EMAIL] Notification failed for contact from {Email}", email);
                }

                try
                {
                    // Draft the personalised reply and QUEUE it for admin approval — it is
                    // no longer auto-sent, so a wrong quote can never reach a client unreviewed.
                    await salesAgent.HandleContactAsync(
                        contactId, AgentDispatchMode.QueueForApproval, "contact_form");
                }
                catch (Exception ex)
                {
                    log.LogError(ex, "[SalesAgent] Failed for contact {ContactId}", contactId);
                }
            });
        }

        return Ok(new { message = "Thank you! We will be in touch soon." });
    }
}
