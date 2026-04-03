namespace WoodenHousesAPI.Models;

public class QuoteLineItem
{
    public Guid    Id          { get; set; } = Guid.NewGuid();
    public Guid    QuoteId     { get; set; }
    public string  Description { get; set; } = string.Empty;
    public int     Quantity    { get; set; } = 1;
    public decimal UnitPrice   { get; set; }
    public decimal Total       => Quantity * UnitPrice;

    // Navigation
    public Quote? Quote { get; set; }
}
