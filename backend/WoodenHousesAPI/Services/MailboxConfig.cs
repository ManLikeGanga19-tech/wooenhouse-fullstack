namespace WoodenHousesAPI.Services;

public class MailboxConfig
{
    public string              ImapHost             { get; set; } = string.Empty;
    public int                 ImapPort             { get; set; } = 993;
    public int                 SyncIntervalSeconds  { get; set; } = 30;
    public List<MailboxAccount> Accounts            { get; set; } = [];
}

public class MailboxAccount
{
    public string Email       { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Color       { get; set; } = "#8B5E3C";
    public string Password    { get; set; } = string.Empty;
}
