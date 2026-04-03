using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
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

        // Auto-subscribe to newsletter if opted in
        if (request.Newsletter)
        {
            var existing = db.NewsletterSubscribers
                .Any(s => s.Email == request.Email);

            if (!existing)
            {
                db.NewsletterSubscribers.Add(new NewsletterSubscriber
                {
                    Email  = request.Email,
                    Name   = request.Name,
                    Source = "contact-form",
                });
            }
        }

        await db.SaveChangesAsync();

        // Notify admin via email (fire-and-forget)
        var adminEmail = config["Email:FromAddress"] ?? "info@woodenhouseskenya.com";
        _ = emailService.SendContactNotificationAsync(
            adminEmail, request.Name, request.Email, request.Message);

        return Ok(new { message = "Thank you! We will be in touch soon." });
    }
}
