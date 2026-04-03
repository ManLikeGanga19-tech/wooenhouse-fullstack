namespace WoodenHousesAPI.Models;

public class AdminUser
{
    public Guid     Id           { get; set; } = Guid.NewGuid();
    public string   Email        { get; set; } = string.Empty;
    public string   Name         { get; set; } = string.Empty;
    public string   PasswordHash { get; set; } = string.Empty;
    public string   Role         { get; set; } = "admin"; // admin | superadmin
    public string?  AvatarUrl    { get; set; }
    public DateTime CreatedAt    { get; set; } = DateTime.UtcNow;
}
