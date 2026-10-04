namespace WoodenHousesAPI.Models;

public class InboxEmail
{
    public Guid     Id            { get; set; } = Guid.NewGuid();
    public string   AccountEmail  { get; set; } = string.Empty; // which mailbox account owns this
    public string   Folder        { get; set; } = "inbox";      // inbox | sent | drafts | junk | trash
    public string   FolderPath    { get; set; } = string.Empty; // real IMAP folder, e.g. "INBOX.Sent" or "Sent Items"
    public long?    Uid           { get; set; }                 // IMAP UID within FolderPath; null = not on the server yet
    public string   MessageId     { get; set; } = string.Empty; // RFC 2822 Message-ID header
    public string   Subject       { get; set; } = string.Empty;
    public string   FromAddress   { get; set; } = string.Empty;
    public string   FromName      { get; set; } = string.Empty;
    public string   ToAddresses   { get; set; } = string.Empty; // semicolon-separated
    public string?  CcAddresses   { get; set; }
    public string?  TextBody      { get; set; }
    public string?  HtmlBody      { get; set; }
    public bool     IsRead        { get; set; } = false;
    public bool     IsStarred     { get; set; } = false;
    public bool     HasAttachment { get; set; } = false;
    public DateTime ReceivedAt    { get; set; } = DateTime.UtcNow;
    public DateTime SyncedAt      { get; set; } = DateTime.UtcNow;
}
