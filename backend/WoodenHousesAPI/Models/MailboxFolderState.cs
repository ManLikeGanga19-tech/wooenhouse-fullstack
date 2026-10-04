namespace WoodenHousesAPI.Models;

/// <summary>
/// Remembers the IMAP UIDVALIDITY of each synced folder. When the server
/// reports a different value, every stored UID for that folder is meaningless
/// and the folder is re-synced from scratch.
/// </summary>
public class MailboxFolderState
{
    public string   AccountEmail { get; set; } = string.Empty;
    public string   FolderPath   { get; set; } = string.Empty;
    public long     UidValidity  { get; set; }
    public DateTime LastSyncedAt { get; set; } = DateTime.UtcNow;
}
