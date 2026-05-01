using System.ComponentModel.DataAnnotations;

namespace WoodenHousesAPI.DTOs.Mailbox;

public record MoveEmailRequest
{
    [Required] public string TargetFolder { get; init; } = string.Empty;
}
