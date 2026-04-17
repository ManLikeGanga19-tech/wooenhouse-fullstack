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
        if (db.BlogPosts.Any())
        {
            logger.LogInformation("Blog posts already exist — skipping seed.");
            return;
        }

        var posts = new List<BlogPost>
        {
            new()
            {
                Title           = "Kutoka Msitu Hadi Mlangoni: Jinsi Tulivyojenga Makao ya Wafanyakazi wa Sirikoi Lodge",
                Slug            = "sirikoi-lodge-staff-quarters-laikipia",
                Excerpt         = "Sirikoi Lodge iko moyoni mwa Laikipia, mahali ambapo fisi wanalia usiku na tembo wanakula asubuhi. Tuliambiwa: jenga kwa mbao. Hapa ndipo safari ilipoanza.",
                Category        = "Partner Stories",
                Author          = "Wooden Houses Kenya",
                Tags            = "[\"Laikipia\",\"Eco Lodge\",\"Staff Quarters\",\"Sirikoi\"]",
                ReadTimeMinutes = 6,
                Featured        = true,
                Status          = "published",
                PublishedAt     = new DateTime(2025, 3, 10, 0, 0, 0, DateTimeKind.Utc),
                Content         = """
# Kutoka Msitu Hadi Mlangoni

Sirikoi Lodge iko moyoni mwa Laikipia Plateau, mahali ambapo ardhi ni kame lakini maisha yanafurika. Ndege wa rangi nyingi, tembo wakitembea polepole asubuhi na fisi wakiimba usiku. Mazingira kama haya yanadai uangalifu — kila kitu kilichowekwa hapa lazima kiwe na maana.

Mwaka 2023, timu ya Sirikoi iliwasiliana nasi. Waliamua kupanua makao ya wafanyakazi wao na walitaka kitu kinachofanana na roho ya safari yenyewe — muundo wa mbao ulio imara, wenye joto na unaoheshimu mazingira yanayomzunguka.

## Changamoto za Kwanza

Laikipia si Nairobi. Barabara ni ngumu, nyakati za mvua zinazifanya kuwa mito. Tulibeba vifaa kutoka Naivasha, tukipanga safari za usiku ili kufikia tovuti mapema asubuhi. Timu yetu ilipiga kambi kwa wiki mbili mfululizo.

Lakini hilo ndilo zuri la kazi ya aina hii. Unajifunza kwamba mbao — kama binadamu — zinakuwa bora zaidi zinapopitia mazingira magumu.

## Muundo na Utamaduni

Sirikoi Lodge ina style yake. Mbao ya rangi ya asili, vipande vya chuma visivyo vya kisasa sana, madirisha mapana yanayokaribisha upepo wa savanna. Sisi tuliheshimu lugha hiyo katika kila jengo tulilolisimamia.

Makao manne ya wafanyakazi yalipangwa kwa mstari, kila moja na ukumbi mdogo wa mbele — mahali pa kuketi usiku baada ya kazi, kuona nyota bila vikwazo.

> "Wafanyakazi wetu walifurahi sana. Walisema makao mapya yanawafanya wahisi kama wageni wenyewe." — Meneja wa Sirikoi

## Somo Tulilojifunza

Ujenzi wa mbao katika maeneo ya mbali hauhusu tu ujuzi wa kufundi. Unahitaji uvumilivu, ubunifu na heshima kwa mazingira. Tulitumia mbao zilizosindikwa vizuri ili kuzuia mchwa na mvua za Laikipia.

Leo makao hayo yanasimama imara, yakimheshimu mazingira ya Sirikoi na yenye urembo wa asili ambao huwezi kupata mahali pengine.

Kama uko na mradi katika eneo kama hili — tunafurahi kusikia kutoka kwako.
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

That is how we approached our work with the Masai Mara Wildlife Conservancies Association. As guests.

## What They Needed

The association coordinates work across multiple conservancies — anti-poaching, community education, ecological monitoring. Their field teams needed a proper base: somewhere to debrief, store equipment, sleep safely between patrols. But any structure had to sit lightly on the land.

Concrete is heavy. It sends a message. Mbao does not. Wood comes from the earth, it breathes with the seasons, and when its time comes it returns quietly.

## The Build

We designed three connected structures — a main briefing room, a sleeping block and a covered outdoor kitchen. The main room has large shuttered windows on all four sides. During debriefs the team can open every shutter and still hear the savanna. It is not sealed away from the world it serves.

We used treated hardwood throughout and roofed with mabati painted in a muted olive green. From fifty metres away the camp almost disappears into the landscape.

Total build time: nineteen days on site. We worked around the daily game movements, pausing whenever a herd of zebra or elephant came close — which happened more often than you might expect.

## Baada ya Mwaka Mmoja

A year after completion, the lead ecologist sent us a message. He said the vervet monkeys had already started using the roof as a bridge between two fig trees. He did not sound annoyed. He sounded pleased.

That is the kind of feedback that means more to us than any certificate or award.

If your conservation work needs a structure that respects the land it stands on, we are ready to listen.
""",
            },
            new()
            {
                Title           = "Mbao na Utafiti: Muundo wa Mbao kwa Mpala Research Center, Nanyuki",
                Slug            = "mpala-research-center-nanyuki-wooden-structure",
                Excerpt         = "Mpala Research Center inafanya kazi ambayo inabadilisha jinsi tunavyoelewa Afrika. Waliituhitajika kujenga ofisi ya shamba yenye nguvu na utulivu. Tulifurahi sana.",
                Category        = "Partner Stories",
                Author          = "Wooden Houses Kenya",
                Tags            = "[\"Nanyuki\",\"Research\",\"Mpala\",\"Field Office\"]",
                ReadTimeMinutes = 5,
                Featured        = false,
                Status          = "published",
                PublishedAt     = new DateTime(2025, 1, 22, 0, 0, 0, DateTimeKind.Utc),
                Content         = """
# Mbao na Utafiti

Mpala Research Center iko pembezoni mwa Ewaso Nyiro, kaskazini mwa Kenya. Hapa watafiti kutoka mataifa mengi wanakuja kustudy — savanna, wanyama, hali ya hewa, maji ya ardhini. Ni mahali pa ujuzi mkubwa uliochanganywa na unyoofu wa asili.

Tuliitwa kusaidia na ofisi mpya ya shamba. Waliitaka muundo ambao ungehifadhi karatasi na kompyuta wakati wa mvua, ushike baridi wakati wa jua kali na usisahaulishwe na mazingira yake.

## Muundo Wetu

Tulichagua mbao nzito kwa kuta na sakafu, na paa la mabati lenye pengo la hewa chini yake ili kupunguza joto. Madirisha mapana upande wa kaskazini yanaleta mwanga lakini si joto la mchana.

Ndani, tuliweka rafu za kuhifadhi vifaa vya utafiti, meza ndefu ya kazi ya pamoja na kona ya kompyuta na nguvu ya mara kwa mara kutoka kwa jenereta na mfumo wa solar.

Moja ya mambo tuliyojifunza na Mpala: watafiti wa kweli wanaangalia kila kitu. Walipima kila ubao, walikuwa na maswali kuhusu aina ya mbao, wakiuliza kama ingetoa kemikali yoyote inayoweza kuathiri masomo yao.

Tulifurahi kujibu maswali yao kwa uaminifu. Tulitumia mbao iliyosindikwa kwa mafuta ya asili badala ya kemikali kali.

## Matokeo

Jengo lilikamilika kwa wakati uliokubalika na limesimama vizuri kwa miaka miwili sasa. Watafiti wanalifanya kazi kila siku.

> "It is the most comfortable field office I have worked in across all my African research sites." — Mtafiti mmoja (jina linahifadhiwa)

Hilo linasema kila kitu.
""",
            },
            new()
            {
                Title           = "Bei ya Nyumba ya Mbao Kenya 2025: Mwongozo Kamili wa Gharama",
                Slug            = "wooden-house-cost-kenya-2025",
                Excerpt         = "Unauliza: nyumba ya mbao Kenya inagharimu kiasi gani? Jibu halipo katika nambari moja. Hapa tunakupa mwongozo wa kweli kulingana na uzoefu wetu wa miaka mingi.",
                Category        = "Insights",
                Author          = "Wooden Houses Kenya",
                Tags            = "[\"Bei\",\"Wooden House\",\"Kenya\",\"Cost Guide\",\"2025\"]",
                ReadTimeMinutes = 7,
                Featured        = false,
                Status          = "published",
                PublishedAt     = new DateTime(2025, 4, 1, 0, 0, 0, DateTimeKind.Utc),
                Content         = """
# Bei ya Nyumba ya Mbao Kenya 2025

Swali hili tunajiulizwa kila siku: "Nyumba ya mbao inagharimu kiasi gani?" Na jibu halipo katika nambari moja rahisi — kama vile nyumba yenyewe haipo katika mpango mmoja rahisi.

Lakini tunajua unataka takwimu za kweli, si maneno ya pembejeo. Kwa hiyo hapa kuna maelezo ya wazi, kulingana na kazi tuliyoifanya kwa miaka tangu 2016.

## Mambo Yanayoathiri Bei

Kabla ya nambari, fahamu mambo haya:

**Ukubwa wa jengo** — Kadri jengo linavyokuwa kubwa, ndivyo bei inavyopanda, lakini si kwa mfumo wa moja kwa moja. Gharama za msingi (kuchimba, sakafu) zinagawanywa kwa mita nyingi zaidi.

**Aina ya mbao** — Cypress ni nafuu zaidi kuliko mvule. Mukau ni ghali zaidi ya zote lakini inadumu vizuri sana. Mbao ya kuagiza kutoka nje inaongeza gharama kwa asilimia thelathini hadi hamsini.

**Eneo la ujenzi** — Nairobi na Naivasha ni karibu sawa. Lakini ukienda Laikipia, Marsabit au pwani, gharama za usafirishaji zinaongezeka.

**Vifaa vya ndani** — Sakafu ya mbao, mabombo, umeme, choo, jiko. Hizi zinaweza kuongeza gharama kwa asilimia sitini hadi themanini.

## Mwongozo wa Bei kwa Mita za Mraba

| Aina ya Ujenzi | Bei kwa m² (KES) |
|---|---|
| Cabin ndogo (msingi) | 18,000 – 25,000 |
| Nyumba ya kawaida | 22,000 – 35,000 |
| Nyumba ya kifahari | 35,000 – 55,000+ |
| Ofisi ya mbao | 20,000 – 30,000 |

*Nambari hizi ni wastani wa 2025. Zinahusisha kazi, mbao na vifaa vya msingi.*

## Mfano wa Kweli

Nyumba ya chumba kimoja cha kulala (bedroom moja), jiko na choo — kiasi cha mita 40 za mraba — inaweza kujengwa kwa:

KES 900,000 – 1,400,000 kulingana na ubora wa mbao na kiwango cha ufundi unaohitajika.

Hii ni bei nzuri ikilinganishwa na ujenzi wa mawe ambao mara nyingi unaanza KES 1,500,000 kwa ukubwa huo huo.

## Kwa Nini Mbao ni Chaguo Zuri Kiuchumi?

Kwanza, ujenzi wa mbao ni wa haraka. Nyumba nyingi tunazozaliana zinaisha kwa wiki nne hadi tisa — si miezi kama kawaida ya mawe. Hii inamaanisha unaingia haraka na unalipa pesa kidogo kwa malazi ya muda.

Pili, matengenezo ya mbao yanaweza kuwa ya bei nafuu ikiwa yanafanywa kwa wakati. Rangi mpya kila miaka mitano, kurekebisha ubao mmoja badala ya kuvunja kuta zote.

## Hatua Inayofuata

Kama una kipande cha ardhi na wazo la nyumba, tunatoa tathmini ya awali bila malipo. Utuambie ukubwa, eneo na bajeti yako na tutakuandalia makadirio ya kweli ndani ya siku mbili za kazi.

Piga simu: +254 789 104 438 au utumie fomu ya mawasiliano kwenye tovuti hii.
""",
            },
            new()
            {
                Title           = "Kwa Nini Wakenya Wanachagua Nyumba za Mbao: Ukweli Kutoka Ardhini",
                Slug            = "why-kenyans-choosing-wooden-homes",
                Excerpt         = "Utambuzi wa nyumba za mbao unakua haraka Kenya. Si kwa sababu ya mtindo tu — kuna sababu za msingi za kiuchumi, kiafya na kimazingira ambazo Wakenya wengi sasa wanazielewa.",
                Category        = "Insights",
                Author          = "Wooden Houses Kenya",
                Tags            = "[\"Wooden Homes\",\"Kenya\",\"Sustainable\",\"Housing Trends\"]",
                ReadTimeMinutes = 6,
                Featured        = false,
                Status          = "published",
                PublishedAt     = new DateTime(2025, 3, 28, 0, 0, 0, DateTimeKind.Utc),
                Content         = """
# Kwa Nini Wakenya Wanachagua Nyumba za Mbao

Miaka kumi iliyopita, ukisema unataka kujenga nyumba ya mbao, watu wengi wangekuona kwa macho ya kushangaza. "Mbao? Kama ile ya babu?" Sasa mambo yamebadilika.

Tunashuhudia mabadiliko makubwa katika jinsi Wakenya wanavyofikiri kuhusu makao. Na mbao iko katikati ya mabadiliko haya.

## Sababu ya Kwanza: Wakati

Ujenzi wa mawe Kenya unachukua muda. Utafiti wetu unaonyesha kwamba nyumba ya wastani ya mawe inachukua miezi saba hadi kumi na moja kuisha tangu msingi. Wakati huo, unalipa panga mahali pengine, unalipa wafanyakazi wanaokaa bila kazi wakati saruji inakauka, unangoja saruji ya nguzo iwe ngumu.

Nyumba yetu ya mbao ya ukubwa huo huo inachukua wiki sita hadi tisa. Hii si kauli tu — ni kumbukumbu ya miradi yetu tangu 2016.

## Sababu ya Pili: Baridi na Joto

Mbao ni mdudu wa asili wa joto. Inahifadhi baridi asubuhi na inaupunguza joto la mchana. Watu wanaoishi katika nyumba za mbao tunazozaliana — hasa Nanyuki, Naivasha na Laikipia — wanasema hawahitaji AC wala hita za umeme mara nyingi.

Hii ni jambo la kweli la sayansi: mbao ina uwezo wa kuhifadhi joto mara tano zaidi ya mawe au tofali.

## Sababu ya Tatu: Mazingira

Kenya ina mkakati wa kupanda miti mamilioni mingi. Sekta ya mbao inayojenga vizuri — kwa mbao kutoka misitu inayosimamiwa — inakubaliana na mkakati huu, si kupingana nao.

Tunatumia mbao kutoka kwa wasambazaji wanaofuata sheria za msitu. Na mbao zilizokuwa zikioza zinaweza kusindikwa na kutumika tena badala ya kutupwa.

## Sababu ya Nne: Uzuri wa Asili

Hii ni ya mwisho katika orodha lakini si ya mwisho kwa umuhimu. Kuna kitu katika nyumba ya mbao ambacho kinagusa moyo. Harufu ya mbao mpya. Rangi ya asili ya kuni. Sauti ya mvua juu ya paa la mbao.

Watu wanaotembelea nyumba tunazozaliana mara nyingi wanasema jambo moja: "Inajisikia kama nyumbani." Na hilo ndilo tunalolenga kila wakati.

---

Kama uko tayari kuanza mazungumzo kuhusu nyumba yako ya mbao, anza hapa. Hatutakuumiza na nambari za kuogopesha — tutasikiliza kwanza, tukuambie ukweli, kisha tufanye kazi pamoja.
""",
            },
        };

        db.BlogPosts.AddRange(posts);
        await db.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} blog posts.", posts.Count);
    }
}
