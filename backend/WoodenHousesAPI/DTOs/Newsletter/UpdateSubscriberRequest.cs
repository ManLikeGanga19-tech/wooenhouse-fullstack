namespace WoodenHousesAPI.DTOs.Newsletter;

public record UpdateSubscriberRequest
{
    public bool? IsSpam { get; init; }
}
