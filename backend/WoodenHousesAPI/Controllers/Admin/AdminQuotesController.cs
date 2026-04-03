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
public class AdminQuotesController(AppDbContext db, IEmailService emailService) : ControllerBase
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
        // Auto-generate quote number
        var count       = await db.Quotes.CountAsync();
        quote.Id          = Guid.NewGuid();
        quote.QuoteNumber = $"WHK-{DateTime.UtcNow.Year}-{(count + 1):D4}";
        quote.CreatedAt   = DateTime.UtcNow;
        quote.UpdatedAt   = DateTime.UtcNow;

        db.Quotes.Add(quote);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = quote.Id }, quote);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Quote updated)
    {
        var quote = await db.Quotes.Include(q => q.LineItems).FirstOrDefaultAsync(q => q.Id == id);
        if (quote is null) return NotFound();

        quote.CustomerName      = updated.CustomerName;
        quote.CustomerEmail     = updated.CustomerEmail;
        quote.CustomerPhone     = updated.CustomerPhone;
        quote.HouseType         = updated.HouseType;
        quote.HouseSize         = updated.HouseSize;
        quote.Location          = updated.Location;
        quote.BasePrice         = updated.BasePrice;
        quote.Discount          = updated.Discount;
        quote.FinalPrice        = updated.FinalPrice;
        quote.PaymentTerms      = updated.PaymentTerms;
        quote.DeliveryTimeline  = updated.DeliveryTimeline;
        quote.ValidityDays      = updated.ValidityDays;
        quote.Status            = updated.Status;
        quote.Notes             = updated.Notes;
        quote.UpdatedAt         = DateTime.UtcNow;

        // Replace line items
        db.QuoteLineItems.RemoveRange(quote.LineItems);
        quote.LineItems = updated.LineItems;

        await db.SaveChangesAsync();
        return Ok(quote);
    }

    [HttpPost("{id}/send")]
    public async Task<IActionResult> SendToCustomer(Guid id)
    {
        var quote = await db.Quotes.FindAsync(id);
        if (quote is null) return NotFound();

        var html = $"""
            <h1>Your Quote from Wooden Houses Kenya</h1>
            <p>Dear {quote.CustomerName},</p>
            <p>Please find your quote <strong>{quote.QuoteNumber}</strong> attached.</p>
            <p>Total: <strong>KES {quote.FinalPrice:N0}</strong></p>
            <p>Valid for {quote.ValidityDays} days.</p>
            <p>Contact us at info@woodenhouseskenya.com for any queries.</p>
            """;

        await emailService.SendQuoteToCustomerAsync(
            quote.CustomerEmail, quote.CustomerName, quote.QuoteNumber, html);

        quote.Status = "sent";
        quote.SentAt = DateTime.UtcNow;
        quote.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(new { message = "Quote sent successfully." });
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
