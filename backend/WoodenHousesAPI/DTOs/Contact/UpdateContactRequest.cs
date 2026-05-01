using System.ComponentModel.DataAnnotations;

namespace WoodenHousesAPI.DTOs.Contact;

public record UpdateContactRequest
{
    [StringLength(50)]
    public string? Status { get; init; }

    [StringLength(50)]
    public string? Priority { get; init; }

    [StringLength(5000)]
    public string? Notes { get; init; }

    public DateTime? ContactedAt { get; init; }

    public bool? IsSpam { get; init; }
}
