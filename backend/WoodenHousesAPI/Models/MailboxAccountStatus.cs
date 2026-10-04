namespace WoodenHousesAPI.Models;

/// <summary>
/// Health of the IMAP sync for one mailbox, shown on the dashboard so a
/// failing account is visible instead of silently going stale.
/// </summary>
public class MailboxAccountStatus
{
    public string    AccountEmail  { get; set; } = string.Empty;
    public DateTime? LastAttemptAt { get; set; }
    public DateTime? LastSuccessAt { get; set; }
    public string?   LastError     { get; set; }
}
