using System.ComponentModel.DataAnnotations;

namespace WoodenHousesAPI.DTOs.Auth;

public class LoginRequest
{
    [Required, EmailAddress]
    public string Email    { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;
}
