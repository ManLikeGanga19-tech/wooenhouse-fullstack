using System.ComponentModel.DataAnnotations;

namespace WoodenHousesAPI.DTOs.Contact;

public class CreateContactRequest
{
    [Required, MinLength(2)]
    public string  Name        { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string  Email       { get; set; } = string.Empty;

    public string? Phone       { get; set; }
    public string? ServiceType { get; set; }
    public string? Location    { get; set; }
    public string? Budget      { get; set; }
    public string? Timeline    { get; set; }

    [MaxLength(2000)]
    public string? Message     { get; set; }

    public bool    Newsletter  { get; set; } = false;
}
