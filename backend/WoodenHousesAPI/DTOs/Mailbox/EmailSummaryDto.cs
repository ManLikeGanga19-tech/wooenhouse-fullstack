namespace WoodenHousesAPI.DTOs.Mailbox;

public record EmailSummaryDto(
    uint     Uid,
    string   Subject,
    string   From,
    string   FromName,
    string   To,
    DateTime Date,
    bool     IsRead,
    bool     HasAttachments,
    string?  Preview
);
