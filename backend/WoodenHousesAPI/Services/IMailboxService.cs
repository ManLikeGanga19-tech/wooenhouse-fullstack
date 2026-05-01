using WoodenHousesAPI.DTOs.Mailbox;

namespace WoodenHousesAPI.Services;

public record MailboxAccountInfo(string Name, string Address);

public interface IMailboxService
{
    IReadOnlyList<MailboxAccountInfo> GetAccounts();

    Task<List<FolderDto>> GetFoldersAsync(string address, CancellationToken ct = default);

    Task<(List<EmailSummaryDto> Emails, int Total)> GetEmailsAsync(
        string address, string folder, int page, int pageSize, string? search,
        CancellationToken ct = default);

    Task<EmailDetailDto?> GetEmailAsync(
        string address, string folder, uint uid, CancellationToken ct = default);

    Task MarkReadAsync(string address, string folder, uint uid, bool isRead,
        CancellationToken ct = default);

    Task MoveEmailAsync(string address, string folder, uint uid, string targetFolder,
        CancellationToken ct = default);

    Task DeleteEmailAsync(string address, string folder, uint uid,
        CancellationToken ct = default);

    Task SendEmailAsync(SendEmailRequest request, CancellationToken ct = default);

    Task SaveDraftAsync(SendEmailRequest request, CancellationToken ct = default);

    Task<(byte[] Data, string ContentType, string FileName)> GetAttachmentAsync(
        string address, string folder, uint uid, string partSpecifier,
        CancellationToken ct = default);
}
