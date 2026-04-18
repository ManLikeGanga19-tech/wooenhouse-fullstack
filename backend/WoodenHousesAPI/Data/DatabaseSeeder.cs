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
        await SeedProjectsAsync(db, logger);
        await SeedBlogPostsAsync(db, logger);
    }

    // ─── Admin User ──────────────────────────────────────────────────────────
    private static async Task SeedAdminUserAsync(
        AppDbContext db, IConfiguration config, ILogger logger)
    {
        var email    = config["Seed:AdminEmail"]    ?? "director@woodenhouseskenya.com";
        var name     = config["Seed:AdminName"]     ?? "Eric Abuto";
        var password = config["Seed:AdminPassword"] ?? throw new InvalidOperationException(
            "Seed:AdminPassword must be set in configuration.");

        var hash     = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);
        var existing = db.AdminUsers.FirstOrDefault();

        if (existing is not null)
        {
            // Always sync email, name and password from config so a redeploy updates credentials
            existing.Email        = email;
            existing.Name         = name;
            existing.PasswordHash = hash;
            await db.SaveChangesAsync();
            logger.LogInformation("Admin user updated: {Email}", email);
            return;
        }

        db.AdminUsers.Add(new AdminUser
        {
            Email        = email,
            Name         = name,
            PasswordHash = hash,
            Role         = "superadmin",
        });
        await db.SaveChangesAsync();
        logger.LogInformation("Admin user seeded: {Email}", email);
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

    // ─── Projects (portfolio seed) ────────────────────────────────────────────
    private static async Task SeedProjectsAsync(AppDbContext db, ILogger logger)
    {
        if (db.Projects.Any())
        {
            logger.LogInformation("Projects already exist — skipping seed.");
            return;
        }

        var projects = new List<Project>
        {
            new()
            {
                Title       = "Off-the-Grid Cottage in Nanyuki",
                Slug        = "off-the-grid-cottage-nanyuki",
                Description = "A fully off-grid wooden cottage nestled in the foothills of Mt. Kenya. Solar-powered, rainwater harvesting, and built entirely from sustainably sourced timber.",
                Location    = "Nanyuki, Kenya",
                Category    = "Wooden Houses",
                CoverImage  = "/projects/off-nanyuki.jpg",
                Images      = "[\"/projects/off-nanyuki.jpg\"]",
                Featured    = true,
                Status      = "published",
                CompletedAt = new DateTime(2024, 8, 15, 0, 0, 0, DateTimeKind.Utc),
            },
            new()
            {
                Title       = "Holiday Home, Naivasha",
                Slug        = "holiday-home-naivasha",
                Description = "A lakeside holiday retreat featuring open-plan living, wraparound decking, and panoramic views of Lake Naivasha.",
                Location    = "Naivasha, Kenya",
                Category    = "Wooden Houses",
                CoverImage  = "/projects/holiday.jpg",
                Images      = "[\"/projects/holiday.jpg\"]",
                Featured    = true,
                Status      = "published",
                CompletedAt = new DateTime(2024, 5, 20, 0, 0, 0, DateTimeKind.Utc),
            },
            new()
            {
                Title       = "Staff Meeting Room, Taita",
                Slug        = "staff-meeting-room-taita",
                Description = "A purpose-built commercial meeting room for a hospitality group. Accommodates 30 people with full AV integration and natural ventilation.",
                Location    = "Taita Taveta, Kenya",
                Category    = "Commercial Buildings",
                CoverImage  = "/projects/staff.jpg",
                Images      = "[\"/projects/staff.jpg\"]",
                Featured    = false,
                Status      = "published",
                CompletedAt = new DateTime(2023, 11, 10, 0, 0, 0, DateTimeKind.Utc),
            },
            new()
            {
                Title       = "Custom Kitchen Fittings",
                Slug        = "custom-kitchen-fittings",
                Description = "Bespoke hardwood kitchen cabinetry and worktops for a residential property in Nairobi. Crafted from locally sourced mvule and cypress.",
                Location    = "Nairobi, Kenya",
                Category    = "Furniture & Carpentry",
                CoverImage  = "/projects/kitchen.jpg",
                Images      = "[\"/projects/kitchen.jpg\"]",
                Featured    = false,
                Status      = "published",
                CompletedAt = new DateTime(2024, 2, 28, 0, 0, 0, DateTimeKind.Utc),
            },
            new()
            {
                Title       = "Foldable Garden Chairs",
                Slug        = "foldable-garden-chairs",
                Description = "A production run of 50 foldable hardwood garden chairs for an eco-resort. Lightweight, weather-treated, and stackable for easy storage.",
                Location    = "Nairobi, Kenya",
                Category    = "Furniture & Carpentry",
                CoverImage  = "/projects/fold-chair.jpg",
                Images      = "[\"/projects/fold-chair.jpg\"]",
                Featured    = false,
                Status      = "published",
                CompletedAt = new DateTime(2024, 4, 5, 0, 0, 0, DateTimeKind.Utc),
            },
            new()
            {
                Title       = "Garden Benches Collection",
                Slug        = "garden-benches-collection",
                Description = "A series of handcrafted outdoor garden benches installed along walking paths at a private estate in Karen. Treated for UV and moisture resistance.",
                Location    = "Karen, Nairobi",
                Category    = "Outdoor Structures",
                CoverImage  = "/projects/garden.jpg",
                Images      = "[\"/projects/garden.jpg\"]",
                Featured    = false,
                Status      = "published",
                CompletedAt = new DateTime(2023, 9, 18, 0, 0, 0, DateTimeKind.Utc),
            },
        };

        db.Projects.AddRange(projects);
        await db.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} projects.", projects.Count);
    }

    // ─── Blog Posts ───────────────────────────────────────────────────────────
    private static async Task SeedBlogPostsAsync(AppDbContext db, ILogger logger)
    {
        // Upsert by slug so content updates are applied on redeploy
        var seedPosts = new List<BlogPost>
        {
            new()
            {
                Title           = "From the Forest to the Front Door: Building Staff Quarters for Sirikoi Lodge",
                Slug            = "sirikoi-lodge-staff-quarters-laikipia",
                Excerpt         = "Sirikoi Lodge sits at the heart of Laikipia, where hyenas call at night and elephants move through in the morning. They asked us to build with timber. Here is how that story went.",
                Category        = "Partner Stories",
                Author          = "Wooden Houses Kenya",
                Tags            = "[\"Laikipia\",\"Eco Lodge\",\"Staff Quarters\",\"Sirikoi\"]",
                ReadTimeMinutes = 6,
                Featured        = true,
                Status          = "published",
                PublishedAt     = new DateTime(2025, 3, 10, 0, 0, 0, DateTimeKind.Utc),
                Content         = """
# From the Forest to the Front Door

Sirikoi Lodge sits at the heart of the Laikipia Plateau, where the land is dry but full of life. Colourful birds, elephants moving slowly through the morning and the sounds of the bush at night. A place like this demands care. Everything placed here needs to belong here.

In 2023, the Sirikoi team came to us. They wanted to expand staff accommodation and they wanted it to feel like the spirit of the lodge itself — strong, warm timber that respected the landscape around it.

## The First Challenge

Laikipia is not Nairobi. The roads are rough and turn into rivers when it rains. We transported materials from Naivasha, planning night drives to reach the site before sunrise. Our crew camped on site for two weeks straight.

But that is what we value about this kind of work. You learn that timber, like people, becomes stronger when it goes through difficult conditions.

## Design and Character

Sirikoi Lodge has its own visual language. Natural timber tones, simple metal details, wide windows that invite the savanna breeze in. We respected that language in every structure we built.

Four staff quarters were arranged in a gentle row, each with a small covered veranda at the front — a place to sit in the evening after a long day and look up at the stars without anything in the way.

> "Our staff were so pleased. They said the new quarters made them feel like guests themselves." — Sirikoi Lodge Manager

## What We Took Away

Building with timber in remote locations is not just about craft skills. It demands patience, creativity and genuine respect for the environment. We used properly treated timber to resist termites and the heavy Laikipia rains.

Those quarters stand firm today, sitting comfortably within the Sirikoi landscape with a natural beauty that cannot be manufactured anywhere else.

If you have a project in a setting like this, we would love to hear from you.
""",
            },
            new()
            {
                Title           = "Building Where the Wild Things Are: Masai Mara Conservancy Field Camp",
                Slug            = "masai-mara-wildlife-conservancies-build",
                Excerpt         = "The Masai Mara Wildlife Conservancies Association needed a field camp that could host researchers, guides and conservancy officers without disturbing the landscape. Wood was the only real answer.",
                Category        = "Partner Stories",
                Author          = "Wooden Houses Kenya",
                Tags            = "[\"Masai Mara\",\"Conservation\",\"Field Camp\",\"Wildlife\"]",
                ReadTimeMinutes = 5,
                Featured        = true,
                Status          = "published",
                PublishedAt     = new DateTime(2025, 2, 14, 0, 0, 0, DateTimeKind.Utc),
                Content         = """
# Building Where the Wild Things Are

There is a particular kind of quiet that settles over the Mara in the early morning. The grass is still silver with dew, a lion has just finished calling somewhere to the west and the light is the colour of warm honey. It is the kind of place that reminds you, quickly and firmly, that you are a guest.

That is how we approached our work with the Masai Mara Wildlife Conservancies Association.

## What They Needed

The association coordinates work across multiple conservancies — anti-poaching, community education, ecological monitoring. Their field teams needed a proper base: somewhere to debrief, store equipment and sleep safely between patrols. But any structure had to sit lightly on the land.

Concrete is heavy. It sends a message. Timber does not. Wood comes from the earth, it breathes with the seasons, and when its time comes it returns quietly.

## The Build

We designed three connected structures: a main briefing room, a sleeping block and a covered outdoor kitchen. The main room has large shuttered windows on all four sides. During debriefs the team can open every shutter and still hear the savanna. It is not sealed away from the world it serves.

We used treated hardwood throughout and roofed with corrugated iron painted in a muted olive green. From fifty metres away the camp almost disappears into the landscape.

Total build time was nineteen days on site. We worked around the daily game movements, pausing whenever a herd of zebra or elephant came close — which happened more often than you might expect.

## A Year Later

A year after completion, the lead ecologist sent us a message. He said the vervet monkeys had already started using the roof as a bridge between two fig trees. He did not sound annoyed. He sounded pleased.

That is the kind of feedback that means more to us than any certificate or award.

If your conservation work needs a structure that respects the land it stands on, we are ready to listen.
""",
            },
            new()
            {
                Title           = "Timber and Research: Building a Field Office for Mpala Research Center, Nanyuki",
                Slug            = "mpala-research-center-nanyuki-wooden-structure",
                Excerpt         = "Mpala Research Center does work that changes how we understand Africa. They needed a field office that was strong, calm and completely honest about the materials it was made from.",
                Category        = "Partner Stories",
                Author          = "Wooden Houses Kenya",
                Tags            = "[\"Nanyuki\",\"Research\",\"Mpala\",\"Field Office\"]",
                ReadTimeMinutes = 5,
                Featured        = false,
                Status          = "published",
                PublishedAt     = new DateTime(2025, 1, 22, 0, 0, 0, DateTimeKind.Utc),
                Content         = """
# Timber and Research

Mpala Research Center sits beside the Ewaso Nyiro river in northern Kenya. Researchers from many countries come here to study savanna ecology, wildlife behaviour, hydrology and climate patterns. It is a place of serious knowledge surrounded by raw, unapologetic nature.

We were asked to help with a new field office. They wanted a structure that would protect papers and equipment during rain, stay cool in the highland heat and never feel out of place in its surroundings.

## Our Approach

We chose heavy-section timber for the walls and floor, with an iron roof raised on a ventilation gap underneath to reduce heat gain. Wide north-facing windows bring in steady light without the afternoon glare.

Inside, we fitted storage shelving for research equipment, a long communal work table and a computing corner with reliable power drawn from both generator and solar.

One of the things we learned working with Mpala: proper scientists look at everything carefully. They measured every plank. They asked about timber species and treatment methods, wanting to know whether any chemicals could affect their field studies.

We were glad to answer honestly. We used timber treated with natural oils rather than harsh chemical preservatives.

## The Outcome

The building was completed on schedule and has been in daily use for over two years.

> "It is the most comfortable field office I have worked in across all my African research sites." — Senior Researcher (name withheld)

That says everything.
""",
            },
            new()
            {
                Title           = "How Much Does a Wooden House Cost in Kenya? A Straight Answer for 2025",
                Slug            = "wooden-house-cost-kenya-2025",
                Excerpt         = "The question we hear every day: how much does a wooden house cost in Kenya? There is no single number. But here is a clear, honest guide based on our experience building across the country since 2016.",
                Category        = "Insights",
                Author          = "Wooden Houses Kenya",
                Tags            = "[\"Cost Guide\",\"Wooden House\",\"Kenya\",\"Pricing\",\"2025\"]",
                ReadTimeMinutes = 7,
                Featured        = false,
                Status          = "published",
                PublishedAt     = new DateTime(2025, 4, 1, 0, 0, 0, DateTimeKind.Utc),
                Content         = """
# How Much Does a Wooden House Cost in Kenya?

We get asked this every day. And every day we give the same honest answer: there is no single number, because there is no single house. But here is a clear breakdown based on real projects we have completed since 2016.

## What Drives the Cost

Before the numbers, understand what actually moves the price:

**Size** — As the building gets larger, the cost per square metre tends to come down slightly. Foundation work, roofing and connection costs spread across more floor area.

**Timber species** — Cypress is more affordable than mvule. Mukau is the most expensive but the most durable. Imported timber adds 30 to 50 percent to the material cost.

**Location** — Nairobi and Naivasha are roughly similar in access. Remote sites like Laikipia, the coast or Marsabit add transport costs that can be significant.

**Interior finishes** — Wooden floors, plumbing, electrical, kitchen fittings and bathroom tiling. These can add 60 to 80 percent on top of the shell cost.

## Cost Guide by Build Type

| Build Type | Cost per m² (KES) |
|---|---|
| Basic cabin or starter structure | 18,000 – 25,000 |
| Standard family home | 22,000 – 35,000 |
| High-finish residential | 35,000 – 55,000+ |
| Garden office or studio | 20,000 – 30,000 |

*These are 2025 averages. They include labour, timber and basic materials.*

## A Real Example

A one-bedroom home with a small kitchen and bathroom — roughly 40 square metres — currently costs:

**KES 900,000 to KES 1,400,000** depending on timber quality and finish level.

For comparison, a brick and mortar structure of the same size typically starts at KES 1,500,000 and takes much longer to complete.

## Why Timber Makes Financial Sense

First, speed. Most of our projects finish in 4 to 9 weeks. That means you move in sooner and pay less in temporary accommodation during construction.

Second, maintenance costs are low when the building is done right. A coat of exterior treatment every 5 to 7 years and prompt repair of any minor issues will keep a well-built timber structure standing for 40 to 60 years.

## Get a Real Quote

If you have land and a concept, we offer a no-cost initial assessment. Tell us the size, location and your budget and we will come back with an honest estimate within two working days.

Call us: +254 789 104 438 or use the contact form on this site.
""",
            },
            new()
            {
                Title           = "Why More Kenyans Are Choosing Wooden Homes: What We See From the Ground",
                Slug            = "why-kenyans-choosing-wooden-homes",
                Excerpt         = "Wooden homes are growing fast in Kenya. Not because of trends, but because of real reasons: time, comfort, cost and a connection to the land. Here is what we see after building across the country since 2016.",
                Category        = "Insights",
                Author          = "Wooden Houses Kenya",
                Tags            = "[\"Wooden Homes\",\"Kenya\",\"Sustainable\",\"Housing Trends\"]",
                ReadTimeMinutes = 6,
                Featured        = false,
                Status          = "published",
                PublishedAt     = new DateTime(2025, 3, 28, 0, 0, 0, DateTimeKind.Utc),
                Content         = """
# Why More Kenyans Are Choosing Wooden Homes

Ten years ago, if you said you wanted to build a wooden house, people would raise an eyebrow. "Timber? Like the old days?" Today that reaction has almost disappeared. Something real has changed.

We see it in the volume of enquiries we receive, in the conversations at building sites, and in the way our completed homes are talked about by the people who live in them.

## Reason One: Speed

Brick and mortar construction in Kenya takes time. A standard family home can take 7 to 11 months from the first brick to handover. During that whole period, you are paying rent somewhere else, managing a workforce that has slow periods when concrete cures and waiting on materials that take weeks to arrive.

Our timber builds typically finish in 4 to 9 weeks for the same size of home. That is not a sales pitch — it is what our project records show going back to 2016.

## Reason Two: Natural Temperature Control

Timber is one of the best natural insulators available. It holds the cool of the morning and moderates the afternoon heat. People living in our homes in Nanyuki, Naivasha and Laikipia consistently tell us they rarely need electric heating or air conditioning.

This is established science. Timber has roughly five times the thermal mass of brick or concrete block for the same wall thickness.

## Reason Three: Environmental Responsibility

Kenya has a national tree-planting programme. A timber construction sector that sources from well-managed forests works alongside that goal rather than against it.

We source from suppliers who follow forestry regulations. And timber offcuts can be repurposed or composted rather than sent to landfill.

## Reason Four: A Different Kind of Beauty

This one is harder to measure but impossible to ignore. There is something about a timber home that touches people. The smell of fresh wood. The warmth of natural grain. The sound of rain on a timber-framed roof.

When people visit completed homes, they almost always say the same thing: it feels like home. That is what we are trying to build every time.

---

If you are ready to start thinking about your own wooden home, start a conversation with us. We will not overwhelm you with numbers before we understand what you need. We listen first.
""",
            },
        };

        int added = 0, updated = 0;
        foreach (var seed in seedPosts)
        {
            var existing = db.BlogPosts.FirstOrDefault(b => b.Slug == seed.Slug);
            if (existing is null)
            {
                db.BlogPosts.Add(seed);
                added++;
            }
            else
            {
                existing.Title           = seed.Title;
                existing.Excerpt         = seed.Excerpt;
                existing.Content         = seed.Content;
                existing.Category        = seed.Category;
                existing.Tags            = seed.Tags;
                existing.ReadTimeMinutes = seed.ReadTimeMinutes;
                existing.Featured        = seed.Featured;
                existing.Status          = seed.Status;
                existing.PublishedAt     = seed.PublishedAt;
                existing.UpdatedAt       = DateTime.UtcNow;
                updated++;
            }
        }

        await db.SaveChangesAsync();
        logger.LogInformation("Blog posts seeded: {Added} added, {Updated} updated.", added, updated);
    }
}
