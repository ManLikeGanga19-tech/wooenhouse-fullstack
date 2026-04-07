using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.Data;

namespace WoodenHousesAPI.Controllers;

/// <summary>
/// Public endpoint — lets customers view their quote via the token link in their email.
/// No auth required. Only safe fields are exposed.
/// </summary>
[ApiController]
[Route("api/quotes/public")]
public class PublicQuotesController(AppDbContext db) : ControllerBase
{
    [HttpGet("{token}")]
    public async Task<IActionResult> GetByToken(string token)
    {
        var quote = await db.Quotes
            .Include(q => q.LineItems)
            .FirstOrDefaultAsync(q => q.PublicToken == token);

        if (quote is null) return NotFound(new { message = "Quote not found." });

        // Mark as viewed on first access after being sent
        if (quote.Status == "sent")
        {
            quote.Status    = "viewed";
            quote.ViewedAt  = DateTime.UtcNow;
            quote.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
        }

        // Return only fields the customer should see — no internal notes
        return Ok(new
        {
            quoteNumber      = quote.QuoteNumber,
            customerName     = quote.CustomerName,
            customerEmail    = quote.CustomerEmail,
            customerPhone    = quote.CustomerPhone,
            houseType        = quote.HouseType,
            houseSize        = quote.HouseSize,
            location         = quote.Location,
            placeOfSupply    = quote.PlaceOfSupply,
            countryOfSupply  = quote.CountryOfSupply,
            lineItems        = quote.LineItems.Select(li => new
            {
                li.Description,
                li.Quantity,
                li.UnitPrice,
                Total = li.Quantity * li.UnitPrice,
            }),
            basePrice        = quote.BasePrice,
            discount         = quote.Discount,
            finalPrice       = quote.FinalPrice,
            paymentTerms     = quote.PaymentTerms,
            deliveryTimeline = quote.DeliveryTimeline,
            validityDays     = quote.ValidityDays,
            status           = quote.Status,
            createdAt        = quote.CreatedAt,
        });
    }
}
