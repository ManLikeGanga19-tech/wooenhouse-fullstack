namespace WoodenHousesAPI.DTOs.Mailbox;

public record FolderDto(
    string Name,
    string DisplayName,
    string Icon,
    int    TotalCount,
    int    UnreadCount
);
