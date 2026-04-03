namespace WoodenHousesAPI.Models;

public class NewsletterSubscriber
{
    public Guid      Id               { get; set; } = Guid.NewGuid();
    public string    Email            { get; set; } = string.Empty;
    public string?   Name             { get; set; }
    public string    Status           { get; set; } = "active"; // active | unsubscribed
    public string?   Source           { get; set; }             // contact-form | footer | manual
    public DateTime  SubscribedAt     { get; set; } = DateTime.UtcNow;
    public DateTime? UnsubscribedAt   { get; set; }
}
