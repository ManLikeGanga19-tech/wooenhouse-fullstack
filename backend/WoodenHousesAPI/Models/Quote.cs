namespace WoodenHousesAPI.Models;

public class Quote
{
    public Guid      Id               { get; set; } = Guid.NewGuid();
    public string    QuoteNumber      { get; set; } = string.Empty; // e.g. WHK-2024-001

    // Customer info (denormalised so quotes survive contact deletion)
    public Guid?     ContactId        { get; set; }
    public string    CustomerName     { get; set; } = string.Empty;
    public string    CustomerEmail    { get; set; } = string.Empty;
    public string?   CustomerPhone    { get; set; }

    // Project details
    public string?   HouseType        { get; set; }
    public string?   HouseSize        { get; set; }
    public string?   Location         { get; set; }
    public string?   PlaceOfSupply    { get; set; }
    public string?   CountryOfSupply  { get; set; }

    // Pricing
    public decimal   BasePrice        { get; set; }
    public decimal   Discount         { get; set; } = 0;
    public decimal   FinalPrice       { get; set; }

    // Terms
    public string?   PaymentTerms     { get; set; }
    public string?   DeliveryTimeline { get; set; }
    public int       ValidityDays     { get; set; } = 30;

    // Status: draft | sent | viewed | accepted | rejected | expired
    public string    Status           { get; set; } = "draft";
    public string?   Notes            { get; set; }

    // Public access token — generated when the quote is sent; used for /quote/{token}
    public string?   PublicToken      { get; set; }

    public DateTime  CreatedAt        { get; set; } = DateTime.UtcNow;
    public DateTime  UpdatedAt        { get; set; } = DateTime.UtcNow;
    public DateTime? SentAt           { get; set; }
    public DateTime? ViewedAt         { get; set; }
    public DateTime? AcceptedAt       { get; set; }

    // Navigation
    public Contact?                  Contact   { get; set; }
    public ICollection<QuoteLineItem> LineItems { get; set; } = [];
}
