using System.ComponentModel.DataAnnotations;

namespace WoodenHousesAPI.DTOs.Newsletter;

public class SubscribeRequest
{
    [Required, EmailAddress]
    public string  Email  { get; set; } = string.Empty;

    public string? Name   { get; set; }
    public string? Source { get; set; } = "footer";
}
