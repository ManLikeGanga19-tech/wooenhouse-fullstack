namespace WoodenHousesAPI.DTOs.Mailbox;

public record MarkReadRequest
{
    public bool IsRead { get; init; } = true;
}
