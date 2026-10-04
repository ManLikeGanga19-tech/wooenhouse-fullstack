using MailKit;

namespace WoodenHousesAPI.Services;

/// <summary>
/// Maps real IMAP folders onto the dashboard's five logical folders.
/// A mailbox can hold several physical folders with the same role — cPanel
/// webmail files sent mail in "INBOX.Sent" while Outlook uses "Sent Items" —
/// and every one of them is synced into the same logical folder.
/// </summary>
public static class MailboxFolders
{
    public const string Inbox  = "inbox";
    public const string Sent   = "sent";
    public const string Drafts = "drafts";
    public const string Junk   = "junk";
    public const string Trash  = "trash";

    public static readonly string[] All = [Inbox, Sent, Drafts, Junk, Trash];

    private static readonly Dictionary<string, string> NameAliases = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Sent"]             = Sent,
        ["Sent Items"]       = Sent,
        ["Sent Messages"]    = Sent,
        ["Sent Mail"]        = Sent,
        ["Drafts"]           = Drafts,
        ["Draft"]            = Drafts,
        ["Junk"]             = Junk,
        ["Junk Email"]       = Junk,
        ["Junk E-mail"]      = Junk,
        ["Spam"]             = Junk,
        ["Trash"]            = Trash,
        ["Deleted"]          = Trash,
        ["Deleted Items"]    = Trash,
        ["Deleted Messages"] = Trash,
    };

    /// <summary>
    /// Returns the logical folder for an IMAP folder, or null if it is not one
    /// the dashboard shows (custom folders, archives, non-selectable parents).
    /// </summary>
    public static string? Classify(string fullName, string name, FolderAttributes attributes)
    {
        if (attributes.HasFlag(FolderAttributes.NoSelect) || attributes.HasFlag(FolderAttributes.NonExistent))
            return null;

        if (fullName.Equals("INBOX", StringComparison.OrdinalIgnoreCase) || attributes.HasFlag(FolderAttributes.Inbox))
            return Inbox;

        // SPECIAL-USE attributes are authoritative when the server sends them
        if (attributes.HasFlag(FolderAttributes.Sent))   return Sent;
        if (attributes.HasFlag(FolderAttributes.Drafts)) return Drafts;
        if (attributes.HasFlag(FolderAttributes.Junk))   return Junk;
        if (attributes.HasFlag(FolderAttributes.Trash))  return Trash;

        // Only match by name at the top level or directly under INBOX
        // ("INBOX.Sent" on cPanel), so a user's "Projects/Sent" is left alone.
        var parentDepth = fullName.Length - name.Length;
        var isTopLevel  = parentDepth == 0 || fullName.StartsWith("INBOX", StringComparison.OrdinalIgnoreCase) && parentDepth == "INBOX".Length + 1;
        return isTopLevel && NameAliases.TryGetValue(name, out var key) ? key : null;
    }

    public static bool IsSpecialUse(FolderAttributes attributes) =>
        (attributes & (FolderAttributes.Sent | FolderAttributes.Drafts | FolderAttributes.Junk | FolderAttributes.Trash)) != 0;
}
