namespace WoodenHousesAPI.DTOs.Mailbox;

public record EmailDetailDto(
    uint               Uid,
    string             Subject,
    string             From,
    string             FromName,
    string             To,
    string?            Cc,
    string?            Bcc,
    DateTime           Date,
    bool               IsRead,
    string?            HtmlBody,
    string?            TextBody,
    string?            MessageId,
    string?            InReplyTo,
    string?            References,
    List<AttachmentDto> Attachments
);

public record AttachmentDto(
    string PartSpecifier,
    string FileName,
    string ContentType,
    long   Size
);
