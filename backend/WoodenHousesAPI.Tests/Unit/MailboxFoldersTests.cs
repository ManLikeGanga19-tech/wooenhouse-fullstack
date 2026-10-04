using MailKit;
using WoodenHousesAPI.Services;

namespace WoodenHousesAPI.Tests.Unit;

public class MailboxFoldersTests
{
    [Theory]
    [InlineData("INBOX",               "INBOX",            "inbox")]
    [InlineData("INBOX.Sent",          "Sent",             "sent")]
    [InlineData("INBOX.Sent Items",    "Sent Items",       "sent")]   // Outlook
    [InlineData("Sent Items",          "Sent Items",       "sent")]
    [InlineData("INBOX.Deleted Items", "Deleted Items",    "trash")]  // Outlook
    [InlineData("INBOX.Junk E-mail",   "Junk E-mail",      "junk")]
    [InlineData("INBOX.spam",          "spam",             "junk")]
    [InlineData("INBOX.Drafts",        "Drafts",           "drafts")]
    [InlineData("INBOX.Projects",      "Projects",         null)]     // custom folder
    [InlineData("INBOX.Projects.Sent", "Sent",             null)]     // nested, not the real Sent
    [InlineData("Archive",             "Archive",          null)]
    public void Classify_ByName(string fullName, string name, string? expected)
    {
        MailboxFolders.Classify(fullName, name, FolderAttributes.None).Should().Be(expected);
    }

    [Fact]
    public void Classify_PrefersSpecialUseAttributes()
    {
        MailboxFolders.Classify("INBOX.Gesendet", "Gesendet", FolderAttributes.Sent).Should().Be("sent");
        MailboxFolders.Classify("INBOX.Papierkorb", "Papierkorb", FolderAttributes.Trash).Should().Be("trash");
    }

    [Fact]
    public void Classify_SkipsNonSelectableFolders()
    {
        MailboxFolders.Classify("INBOX.Sent", "Sent", FolderAttributes.NoSelect).Should().BeNull();
    }
}
