using System.ComponentModel.DataAnnotations;

namespace WoodenHousesAPI.Models;

public class Quote
{
    public Guid      Id               { get; set; } = Guid.NewGuid();

    [MaxLength(30)]
    public string    QuoteNumber      { get; set; } = string.Empty; // e.g. WHK-2024-001

    // Customer info (denormalised so quotes survive contact deletion)
    public Guid?     ContactId        { get; set; }

    [MaxLength(200)]
    public string    CustomerName     { get; set; } = string.Empty;

    [MaxLength(255)]
    public string    CustomerEmail    { get; set; } = string.Empty;

    [MaxLength(30)]
    public string?   CustomerPhone    { get; set; }

    // Project details
    [MaxLength(200)]
    public string?   HouseType        { get; set; }

    [MaxLength(100)]
    public string?   HouseSize        { get; set; }

    [MaxLength(200)]
    public string?   Location         { get; set; }

    [MaxLength(200)]
    public string?   PlaceOfSupply    { get; set; }

    [MaxLength(100)]
    public string?   CountryOfSupply  { get; set; }

    // Pricing
    [Range(0, 999_999_999)]
    public decimal   BasePrice        { get; set; }

    [Range(0, 999_999_999)]
    public decimal   Discount         { get; set; } = 0;

    [Range(0, 999_999_999)]
    public decimal   FinalPrice       { get; set; }

    // Terms
    [MaxLength(500)]
    public string?   PaymentTerms     { get; set; }

    [MaxLength(200)]
    public string?   DeliveryTimeline { get; set; }

    [Range(1, 365)]
    public int       ValidityDays     { get; set; } = 30;

    // Status: draft | sent | viewed | accepted | rejected | expired
    [MaxLength(20)]
    public string    Status           { get; set; } = "draft";

    [MaxLength(2000)]
    public string?   Notes            { get; set; }

    // Public access token — generated when the quote is sent; used for /quote/{token}
    [MaxLength(64)]
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
