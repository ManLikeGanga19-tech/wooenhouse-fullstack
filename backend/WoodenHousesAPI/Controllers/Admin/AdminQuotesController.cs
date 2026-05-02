using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.Models;
using WoodenHousesAPI.Services;

namespace WoodenHousesAPI.Controllers.Admin;

[ApiController]
[Route("api/admin/quotes")]
[Authorize]
[EnableRateLimiting("standard")]
public class AdminQuotesController(AppDbContext db, IEmailService emailService, IConfiguration config, IAuditService audit) : ControllerBase
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
        await audit.LogAsync("quote.created", "Quote", quote.Id.ToString(),
            $"number={quote.QuoteNumber} customer={quote.CustomerEmail} total={quote.FinalPrice}");
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
        await audit.LogAsync("quote.updated", "Quote", id.ToString(),
            $"number={quote.QuoteNumber} status={quote.Status} total={quote.FinalPrice}");
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

        var frontendUrl   = config["Frontend:Url"] ?? "https://woodenhouseskenya.com";
        var publicLink    = $"{frontendUrl}/quote/{quote.PublicToken}";
        var validUntil    = quote.CreatedAt.AddDays(quote.ValidityDays).ToString("MMMM dd, yyyy");
        var safeName      = System.Net.WebUtility.HtmlEncode(quote.CustomerName);
        var safeNumber    = System.Net.WebUtility.HtmlEncode(quote.QuoteNumber);
        var safeHouseType = System.Net.WebUtility.HtmlEncode(quote.HouseType ?? "");
        var safeHouseSize = System.Net.WebUtility.HtmlEncode(quote.HouseSize ?? "");
        var projectRow    = string.IsNullOrEmpty(quote.HouseType) ? "" :
            $"<tr><td style='padding:10px 0;border-bottom:1px solid #F0E8DF;color:#888;font-size:13px;'>Project</td><td style='padding:10px 0;border-bottom:1px solid #F0E8DF;font-size:14px;text-align:right;'>{safeHouseType}{(string.IsNullOrEmpty(quote.HouseSize) ? "" : $" — {safeHouseSize}")}</td></tr>";

        var quoteContent = $"""
            <h2 style="margin:0 0 8px;color:#8B5E3C;font-size:22px;font-weight:700;text-align:center;">Your Quotation is Ready</h2>
            <p style="margin:0 0 24px;color:#666;font-size:14px;text-align:center;">Reference: <strong>{safeNumber}</strong></p>

            <p style="margin:0 0 16px;font-size:15px;color:#333;">Dear <strong>{safeName}</strong>,</p>
            <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">
              Thank you for your interest in Wooden Houses Kenya. Please find your personalised quotation details below.
            </p>

            <!-- Quote summary table -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                   style="border-collapse:collapse;background:#FAF7F4;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:12px 16px;border-bottom:1px solid #EAE0D5;color:#888;font-size:13px;width:140px;">Quotation #</td>
                <td style="padding:12px 16px;border-bottom:1px solid #EAE0D5;font-weight:700;font-size:14px;text-align:right;">{safeNumber}</td>
              </tr>
              {projectRow}
              <tr>
                <td style="padding:10px 16px;border-bottom:1px solid #EAE0D5;color:#888;font-size:13px;">Valid Until</td>
                <td style="padding:10px 16px;border-bottom:1px solid #EAE0D5;font-size:14px;text-align:right;">{validUntil}</td>
              </tr>
              <tr>
                <td style="padding:14px 16px;color:#8B5E3C;font-size:16px;font-weight:700;">Total</td>
                <td style="padding:14px 16px;color:#8B5E3C;font-size:18px;font-weight:700;text-align:right;">KES {quote.FinalPrice:N0}</td>
              </tr>
            </table>

            <div style="text-align:center;margin-bottom:24px;">
              <a href="{publicLink}"
                 style="background:#8B5E3C;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:6px;font-size:15px;font-weight:600;display:inline-block;">
                View Full Quotation →
              </a>
            </div>

            <p style="margin:0 0 28px;font-size:12px;color:#aaa;text-align:center;">
              If the button doesn't work, copy this link:<br>
              <a href="{publicLink}" style="color:#8B5E3C;word-break:break-all;">{publicLink}</a>
            </p>

            <p style="margin:0;color:#999;font-size:13px;text-align:center;line-height:1.6;">
              Questions? We're happy to help.<br>
              <strong style="color:#8B5E3C;">Accounts Team · Wooden Houses Kenya</strong>
            </p>
            """;

        var html = QuoteEmailLayout(quoteContent, frontendUrl);

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
        await audit.LogAsync("quote.deleted", "Quote", id.ToString());
        return NoContent();
    }

    private static string QuoteEmailLayout(string content, string siteUrl)
    {
        const string LogoUrl = "https://woodenhouseskenya.com/woodenhouse-logo.jpg";
        return $"""
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background-color:#F5F0EB;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F5F0EB">
                <tr>
                  <td align="center" style="padding:40px 16px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
                      <tr>
                        <td align="center" style="padding-bottom:20px;">
                          <a href="{siteUrl}" style="text-decoration:none;">
                            <img src="{LogoUrl}" alt="Wooden Houses Kenya" width="72" height="72"
                                 style="border-radius:12px;display:block;border:3px solid #C49A6C;">
                          </a>
                        </td>
                      </tr>
                    </table>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                           style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
                      <tr>
                        <td align="center" bgcolor="#8B5E3C" style="background-color:#8B5E3C;padding:24px 40px;">
                          <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Wooden Houses Kenya</p>
                          <p style="margin:6px 0 0;color:#C49A6C;font-size:13px;">Premium Wooden Construction</p>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding:40px 40px 32px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr><td>{content}</td></tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td bgcolor="#FAF7F4" align="center" style="background-color:#FAF7F4;padding:24px 40px;border-top:1px solid #EAE0D5;">
                          <p style="margin:0 0 6px;color:#8B5E3C;font-weight:700;font-size:13px;">Wooden Houses Kenya</p>
                          <p style="margin:0 0 4px;font-size:12px;color:#999999;">Naivasha, Kenya</p>
                          <p style="margin:0 0 8px;font-size:12px;">
                            <a href="tel:+254716111187" style="color:#8B5E3C;text-decoration:none;">+254 716 111 187</a>
                            &nbsp;&middot;&nbsp;
                            <a href="mailto:info@woodenhouseskenya.com" style="color:#8B5E3C;text-decoration:none;">info@woodenhouseskenya.com</a>
                          </p>
                          <p style="margin:0;font-size:11px;">
                            <a href="{siteUrl}" style="color:#C49A6C;text-decoration:none;">woodenhouseskenya.com</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;
    }
}
