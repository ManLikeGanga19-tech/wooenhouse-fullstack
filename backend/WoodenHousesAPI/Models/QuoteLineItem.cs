using System.ComponentModel.DataAnnotations;

namespace WoodenHousesAPI.Models;

public class QuoteLineItem
{
    public Guid    Id          { get; set; } = Guid.NewGuid();
    public Guid    QuoteId     { get; set; }

    [MaxLength(500)]
    public string  Description { get; set; } = string.Empty;

    [Range(1, 10_000)]
    public int     Quantity    { get; set; } = 1;

    [Range(0, 999_999_999)]
    public decimal UnitPrice   { get; set; }

    public decimal Total       => Quantity * UnitPrice;

    // Navigation
    public Quote? Quote { get; set; }
}
