using WoodenHousesAPI.Models;

namespace WoodenHousesAPI.Data;

/// <summary>
/// Runs once at startup. Safe to run multiple times (idempotent).
/// Seeds: default admin user, initial services, initial site settings.
/// </summary>
public static class DatabaseSeeder
{
    public static async Task SeedAsync(
        AppDbContext db,
        IConfiguration config,
        ILogger logger)
    {
        await SeedAdminUserAsync(db, config, logger);
        await SeedSiteSettingsAsync(db, logger);
        await SeedServicesAsync(db, logger);
    }

    // ─── Admin User ──────────────────────────────────────────────────────────
    private static async Task SeedAdminUserAsync(
        AppDbContext db, IConfiguration config, ILogger logger)
    {
        if (db.AdminUsers.Any())
        {
            logger.LogInformation("Admin users already exist — skipping seed.");
            return;
        }

        var email    = config["Seed:AdminEmail"]    ?? "admin@woodenhouseskenya.com";
        var name     = config["Seed:AdminName"]     ?? "Site Administrator";
        var password = config["Seed:AdminPassword"] ?? throw new InvalidOperationException(
            "Seed:AdminPassword must be set in configuration. " +
            "Add it to appsettings.json or environment variables.");

        // Use bcrypt cost factor 12 — good balance of security vs speed in 2024
        var hash = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);

        db.AdminUsers.Add(new AdminUser
        {
            Email        = email,
            Name         = name,
            PasswordHash = hash,
            Role         = "superadmin",
        });

        await db.SaveChangesAsync();
        logger.LogInformation("Seeded admin user: {Email}", email);
    }

    // ─── Site Settings ────────────────────────────────────────────────────────
    private static async Task SeedSiteSettingsAsync(AppDbContext db, ILogger logger)
    {
        var defaults = new Dictionary<string, string>
        {
            ["site.name"]           = "Wooden Houses Kenya",
            ["site.tagline"]        = "Building Dreams in Wood",
            ["site.phone"]          = "+254 700 000 000",
            ["site.email"]          = "info@woodenhouseskenya.com",
            ["site.address"]        = "Nairobi, Kenya",
            ["site.facebook"]       = "",
            ["site.instagram"]      = "",
            ["site.twitter"]        = "",
            ["site.youtube"]        = "",
            ["quote.validityDays"]  = "30",
            ["quote.currencyCode"]  = "KES",
        };

        foreach (var (key, value) in defaults)
        {
            if (!db.SiteSettings.Any(s => s.Key == key))
            {
                db.SiteSettings.Add(new SiteSetting { Key = key, Value = value });
            }
        }

        await db.SaveChangesAsync();
        logger.LogInformation("Seeded site settings.");
    }

    // ─── Services (CMS seed) ──────────────────────────────────────────────────
    private static async Task SeedServicesAsync(AppDbContext db, ILogger logger)
    {
        if (db.Services.Any())
        {
            logger.LogInformation("Services already exist — skipping seed.");
            return;
        }

        var services = new List<Models.Service>
        {
            new()
            {
                Title       = "Custom Wooden Houses",
                Slug        = "custom-wooden-houses",
                Description = "We design and build fully custom wooden houses tailored to your vision, budget, and site.",
                Icon        = "Home",
                SortOrder   = 1,
                Features    = "[\"Bespoke architectural design\",\"Foundation to roof construction\",\"Electrical & plumbing integration\",\"Interior finishing\"]",
            },
            new()
            {
                Title       = "Wooden Cabins & Cottages",
                Slug        = "wooden-cabins-cottages",
                Description = "Compact, durable wooden cabins — ideal for holiday retreats, staff quarters, and eco-lodges.",
                Icon        = "TreePine",
                SortOrder   = 2,
                Features    = "[\"Quick construction timeline\",\"Eco-friendly materials\",\"Off-grid ready\",\"Custom sizing\"]",
            },
            new()
            {
                Title       = "Garden Studios & Offices",
                Slug        = "garden-studios-offices",
                Description = "Transform your garden into a productive workspace or creative studio with our bespoke wooden structures.",
                Icon        = "Briefcase",
                SortOrder   = 3,
                Features    = "[\"Insulated walls & roof\",\"High-speed internet ready\",\"Natural lighting design\",\"Secure access\"]",
            },
            new()
            {
                Title       = "Renovations & Extensions",
                Slug        = "renovations-extensions",
                Description = "Extend your existing home with seamlessly integrated wooden extensions and renovations.",
                Icon        = "Hammer",
                SortOrder   = 4,
                Features    = "[\"Structural assessment\",\"Matching existing aesthetics\",\"Minimal disruption\",\"Full project management\"]",
            },
        };

        db.Services.AddRange(services);
        await db.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} services.", services.Count);
    }
}
