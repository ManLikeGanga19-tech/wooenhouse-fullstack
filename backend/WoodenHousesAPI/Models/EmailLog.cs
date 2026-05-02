namespace WoodenHousesAPI.Models;

public class EmailLog
{
    public Guid     Id           { get; set; } = Guid.NewGuid();
    public string   Type         { get; set; } = string.Empty; // contact_alert | auto_reply | quote | newsletter | agent
    public string   FromAddress  { get; set; } = string.Empty;
    public string   ToAddress    { get; set; } = string.Empty;
    public string   Subject      { get; set; } = string.Empty;
    public string?  HtmlBody     { get; set; }                 // stored for resend / preview
    public string   Status       { get; set; } = "sent";       // sent | failed
    public string?  ErrorMessage { get; set; }
    public DateTime SentAt       { get; set; } = DateTime.UtcNow;
}
