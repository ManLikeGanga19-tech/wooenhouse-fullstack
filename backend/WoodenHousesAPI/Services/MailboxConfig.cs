namespace WoodenHousesAPI.Services;

public class MailboxConfig
{
    public string              ImapHost             { get; set; } = string.Empty;
    public int                 ImapPort             { get; set; } = 993;
    public int                 SyncIntervalSeconds  { get; set; } = 30;
    // Upper bound for one account's sync. The first sync of a large mailbox
    // downloads its whole history, so this must be generous; progress is saved
    // per batch and resumes on the next cycle if it is hit.
    public int                 SyncTimeoutSeconds   { get; set; } = 300;
    // Escape hatch for a mail host with a self-signed certificate. Leave off:
    // mail.woodenhouseskenya.com and sin.vivawebhost.com both serve valid certs.
    public bool                AcceptInvalidCertificates { get; set; } = false;
    public List<MailboxAccount> Accounts            { get; set; } = [];
}

public class MailboxAccount
{
    public string Email       { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Color       { get; set; } = "#8B5E3C";
    public string Password    { get; set; } = string.Empty;
}
