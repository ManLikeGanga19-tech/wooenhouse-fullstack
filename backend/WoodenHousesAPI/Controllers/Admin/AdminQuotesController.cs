using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.Models;
using WoodenHousesAPI.Services;

namespace WoodenHousesAPI.Controllers.Admin;

[ApiController]
[Route("api/admin/quotes")]
[Authorize]
public class AdminQuotesController(AppDbContext db, IEmailService emailService, IConfiguration config) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = db.Quotes.Include(q => q.LineItems).AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(q => q.Status == status);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(q => q.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var quote = await db.Quotes
            .Include(q => q.LineItems)
            .Include(q => q.Contact)
            .FirstOrDefaultAsync(q => q.Id == id);

        if (quote is null) return NotFound();
        return Ok(quote);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Quote quote)
    {
        var count         = await db.Quotes.CountAsync();
        quote.Id          = Guid.NewGuid();
        quote.QuoteNumber = $"WHK-{DateTime.UtcNow.Year}-{(count + 1):D4}";
        quote.CreatedAt   = DateTime.UtcNow;
        quote.UpdatedAt   = DateTime.UtcNow;

        // Backend owns all price computation
        quote.FinalPrice = ComputeFinalPrice(quote);

        db.Quotes.Add(quote);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = quote.Id }, quote);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Quote updated)
    {
        var quote = await db.Quotes.Include(q => q.LineItems).FirstOrDefaultAsync(q => q.Id == id);
        if (quote is null) return NotFound();

        quote.CustomerName     = updated.CustomerName;
        quote.CustomerEmail    = updated.CustomerEmail;
        quote.CustomerPhone    = updated.CustomerPhone;
        quote.HouseType        = updated.HouseType;
        quote.HouseSize        = updated.HouseSize;
        quote.Location         = updated.Location;
        quote.PlaceOfSupply    = updated.PlaceOfSupply;
        quote.CountryOfSupply  = updated.CountryOfSupply;
        quote.BasePrice        = updated.BasePrice;
        quote.Discount         = updated.Discount;
        quote.PaymentTerms     = updated.PaymentTerms;
        quote.DeliveryTimeline = updated.DeliveryTimeline;
        quote.ValidityDays     = updated.ValidityDays;
        quote.Status           = updated.Status;
        quote.Notes            = updated.Notes;
        quote.UpdatedAt        = DateTime.UtcNow;

        // Replace line items, then recompute price server-side
        db.QuoteLineItems.RemoveRange(quote.LineItems);
        quote.LineItems  = updated.LineItems;
        quote.FinalPrice = ComputeFinalPrice(quote);

        await db.SaveChangesAsync();
        return Ok(quote);
    }

    // ─── Price computation lives here — never trust the client ───────────────
    private static decimal ComputeFinalPrice(Quote q)
    {
        var subtotal = q.LineItems.Any()
            ? q.LineItems.Sum(li => li.Quantity * li.UnitPrice)
            : q.BasePrice;

        return Math.Max(0, subtotal - q.Discount);
    }

    [HttpPost("{id}/send")]
    public async Task<IActionResult> SendToCustomer(Guid id)
    {
        var quote = await db.Quotes.Include(q => q.LineItems).FirstOrDefaultAsync(q => q.Id == id);
        if (quote is null) return NotFound();

        // Generate a public token if this is the first time sending
        if (string.IsNullOrEmpty(quote.PublicToken))
            quote.PublicToken = Guid.NewGuid().ToString("N");

        var frontendUrl  = config["Frontend:Url"] ?? "https://woodenhouseskenya.com";
        var publicLink   = $"{frontendUrl}/quote/{quote.PublicToken}";
        var validUntil   = quote.CreatedAt.AddDays(quote.ValidityDays).ToString("MMMM dd, yyyy");
        var projectRow   = string.IsNullOrEmpty(quote.HouseType) ? "" :
            $"<tr><td style='padding:5px 0;color:#6b7280;'>Project</td><td style='padding:5px 0;text-align:right;'>{quote.HouseType}{(string.IsNullOrEmpty(quote.HouseSize) ? "" : $" — {quote.HouseSize}")}</td></tr>";
        var domainLabel  = frontendUrl.Replace("https://", "").Replace("http://", "");

        var html =
            "<!DOCTYPE html><html><head><meta charset='utf-8'></head><body style='margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#1a1a1a;'>" +
            "<div style='max-width:600px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);'>" +
              "<div style='background:#8B5E3C;padding:28px 32px;text-align:center;'>" +
                "<h1 style='color:#fff;margin:0;font-size:22px;'>Wooden Houses Kenya</h1>" +
                "<p style='color:#e8d5c4;margin:6px 0 0;font-size:13px;'>Your Quotation is Ready</p>" +
              "</div>" +
              "<div style='padding:28px 32px;'>" +
                $"<p style='font-size:15px;'>Dear <strong>{quote.CustomerName}</strong>,</p>" +
                "<p>Thank you for your interest. Please find your quotation details below.</p>" +
                "<table style='width:100%;background:#faf8f5;border:1px solid #e8d5c4;border-radius:6px;padding:16px 20px;border-collapse:collapse;margin-bottom:20px;'>" +
                  "<tbody>" +
                    $"<tr><td style='padding:5px 0;color:#6b7280;'>Quotation #</td><td style='padding:5px 0;text-align:right;'><strong>{quote.QuoteNumber}</strong></td></tr>" +
                    projectRow +
                    $"<tr><td style='padding:5px 0;color:#6b7280;'>Valid Until</td><td style='padding:5px 0;text-align:right;'>{validUntil}</td></tr>" +
                    $"<tr><td style='padding:10px 0 5px;font-weight:700;font-size:16px;border-top:1px solid #e8d5c4;color:#8B5E3C;'>Total</td><td style='padding:10px 0 5px;text-align:right;font-weight:700;font-size:16px;border-top:1px solid #e8d5c4;color:#8B5E3C;'>KES {quote.FinalPrice:N0}</td></tr>" +
                  "</tbody>" +
                "</table>" +
                "<div style='text-align:center;margin:24px 0;'>" +
                  $"<a href='{publicLink}' style='background:#8B5E3C;color:#fff;text-decoration:none;padding:13px 28px;border-radius:6px;font-size:15px;font-weight:600;display:inline-block;'>View Full Quotation &rarr;</a>" +
                "</div>" +
                $"<p style='font-size:13px;color:#6b7280;'>If the button doesn't work, copy this link:<br><a href='{publicLink}' style='color:#8B5E3C;'>{publicLink}</a></p>" +
              "</div>" +
              "<div style='background:#f5f0eb;padding:16px 32px;text-align:center;font-size:12px;color:#6b7280;'>" +
                "<p>Questions? Email <a href='mailto:info@woodenhouseskenya.com' style='color:#8B5E3C;'>info@woodenhouseskenya.com</a> or call <a href='tel:+254716111187' style='color:#8B5E3C;'>+254 716 111 187</a></p>" +
                $"<p style='margin-top:8px;'>Wooden Houses Kenya &middot; Naivasha, Kenya &middot; <a href='{frontendUrl}' style='color:#8B5E3C;'>{domainLabel}</a></p>" +
              "</div>" +
            "</div>" +
            "</body></html>";

        await emailService.SendQuoteToCustomerAsync(
            quote.CustomerEmail, quote.CustomerName, quote.QuoteNumber, html);

        quote.Status    = "sent";
        quote.SentAt    = DateTime.UtcNow;
        quote.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(new { message = "Quote sent successfully.", publicLink });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var quote = await db.Quotes.FindAsync(id);
        if (quote is null) return NotFound();

        db.Quotes.Remove(quote);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
