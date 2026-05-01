using System.ComponentModel.DataAnnotations;

namespace WoodenHousesAPI.DTOs.Mailbox;

public record SendEmailRequest
{
    [Required] public string  AccountAddress { get; init; } = string.Empty;
    [Required] public string  To             { get; init; } = string.Empty;
    public            string? Cc             { get; init; }
    public            string? Bcc            { get; init; }
    [Required] public string  Subject        { get; init; } = string.Empty;
    public            string? HtmlBody       { get; init; }
    public            string? TextBody       { get; init; }
    public            string? InReplyTo      { get; init; }
    public            string? References     { get; init; }
}
