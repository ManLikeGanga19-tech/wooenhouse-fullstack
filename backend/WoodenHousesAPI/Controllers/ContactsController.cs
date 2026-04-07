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
    IConfiguration config) : ControllerBase
{
    [HttpPost]
    [EnableRateLimiting("strict")]
    public async Task<IActionResult> Submit([FromBody] CreateContactRequest request)
    {
        // 1. Save the contact entry
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
        };

        db.Contacts.Add(contact);
        await db.SaveChangesAsync();

        // 2. Auto-subscribe to newsletter if opted in — separate save so a
        //    duplicate-email constraint never rolls back the contact entry.
        if (request.Newsletter)
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
                    // Another request beat us to it (race condition on unique index).
                    // Ignore — the contact was already saved successfully above.
                }
            }
        }

        // 3. Notify admin via email (fire-and-forget)
        var adminEmail = config["Email:FromAddress"] ?? "info@woodenhouseskenya.com";
        _ = emailService.SendContactNotificationAsync(
            adminEmail, request.Name, request.Email, request.Message);

        return Ok(new { message = "Thank you! We will be in touch soon." });
    }
}
