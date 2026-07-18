using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.Pricing;

namespace WoodenHousesAPI.Services;

public interface IAgentContextService
{
    Task<string> BuildSystemPromptAsync(string taskSpecificContext, CancellationToken ct = default);
}

public class AgentContextService(AppDbContext db) : IAgentContextService
{
    public async Task<string> BuildSystemPromptAsync(string taskSpecificContext, CancellationToken ct = default)
    {
        // Layer 1: Business context from DB (admin-editable key-value pairs)
        var contextRows = await db.AgentContexts
            .OrderBy(c => c.SortOrder)
            .ToListAsync(ct);

        // Layer 2: Live system data
        var services = await db.Services
            .Where(s => s.Status == "published")
            .OrderBy(s => s.SortOrder)
            .Select(s => new { s.Title, s.Description })
            .ToListAsync(ct);

        var recentProjects = await db.Projects
            .Where(p => p.Status == "published")
            .OrderByDescending(p => p.CompletedAt ?? p.CreatedAt)
            .Take(5)
            .Select(p => new { p.Title, p.Location, p.Category, p.CompletedAt })
            .ToListAsync(ct);

        var sb = new System.Text.StringBuilder();

        // ── Layer 0: Role & grounding rules ─────────────────────────────────
        // These rules are what stop the model inventing prices and sending wrong
        // quotes. They MUST come first so they frame everything below.
        sb.AppendLine("# ROLE");
        sb.AppendLine();
        sb.AppendLine("You are the customer assistant for Wooden Houses Kenya, a company that");
        sb.AppendLine("designs and builds high-quality wooden houses. You write warm, professional");
        sb.AppendLine("emails to prospective and existing clients.");
        sb.AppendLine();
        sb.AppendLine("# RULES — READ CAREFULLY");
        sb.AppendLine();
        sb.AppendLine("1. GROUND EVERY FACT. Only state prices, dimensions, build times, or other");
        sb.AppendLine("   specifics that appear in this prompt. NEVER invent, estimate, guess, or");
        sb.AppendLine("   interpolate a number. If the information is not here, do not make it up.");
        sb.AppendLine("2. PRICES ARE AVERAGE ESTIMATES depending on size and finishes — never present");
        sb.AppendLine("   them as a firm or final quote. Say \"from\" / \"starting around\", and note the");
        sb.AppendLine("   final price is confirmed after a free site visit.");
        sb.AppendLine("3. NEVER QUOTE BELOW the average prices listed below. When unsure, quote the");
        sb.AppendLine("   higher figure and invite a consultation.");
        sb.AppendLine("4. If a client asks about something not covered here (custom sizes, special");
        sb.AppendLine("   finishes, locations, anything unlisted), do NOT improvise — say you'll have");
        sb.AppendLine("   the team follow up with details, and propose a site visit or call.");
        sb.AppendLine("5. Prices below are in US Dollars (USD).");
        sb.AppendLine();

        // ── Layer 0b: Authoritative pricing & specifications ────────────────
        sb.AppendLine("# PRICING & SPECIFICATIONS (AUTHORITATIVE)");
        sb.AppendLine();
        sb.AppendLine("Average price by house type (USD, depending on size and finishes) and build time:");
        sb.AppendLine();
        foreach (var t in HousePricing.Types)
            sb.AppendLine($"- {t.Label}: from USD {t.AveragePriceUsd:N0} — builds in {t.BuildTime}.");
        sb.AppendLine();
        sb.AppendLine($"- Termites: {HousePricing.TermiteTreatment}");
        sb.AppendLine($"- Lifespan: {HousePricing.Lifespan}");
        sb.AppendLine();

        // ── Layer 1: Business context ───────────────────────────────────────
        if (contextRows.Count > 0)
        {
            sb.AppendLine("# BUSINESS CONTEXT");
            sb.AppendLine();
            foreach (var row in contextRows)
            {
                if (!string.IsNullOrWhiteSpace(row.Value))
                {
                    sb.AppendLine($"## {row.Label}");
                    sb.AppendLine(row.Value);
                    sb.AppendLine();
                }
            }
        }

        // ── Layer 2a: Services ──────────────────────────────────────────────
        if (services.Count > 0)
        {
            sb.AppendLine("# SERVICES WE OFFER");
            sb.AppendLine();
            foreach (var svc in services)
            {
                sb.Append($"- **{svc.Title}**");
                if (!string.IsNullOrWhiteSpace(svc.Description))
                    sb.Append($": {svc.Description}");
                sb.AppendLine();
            }
            sb.AppendLine();
        }

        // ── Layer 2b: Recent projects ───────────────────────────────────────
        if (recentProjects.Count > 0)
        {
            sb.AppendLine("# RECENT COMPLETED PROJECTS");
            sb.AppendLine();
            foreach (var p in recentProjects)
            {
                var parts = new List<string> { p.Title };
                if (!string.IsNullOrWhiteSpace(p.Location)) parts.Add(p.Location);
                if (!string.IsNullOrWhiteSpace(p.Category)) parts.Add(p.Category);
                if (p.CompletedAt.HasValue) parts.Add(p.CompletedAt.Value.ToString("MMM yyyy"));
                sb.AppendLine($"- {string.Join(" | ", parts)}");
            }
            sb.AppendLine();
        }

        // ── Layer 3: Task-specific context ─────────────────────────────────
        if (!string.IsNullOrWhiteSpace(taskSpecificContext))
        {
            sb.AppendLine("# CURRENT TASK");
            sb.AppendLine();
            sb.AppendLine(taskSpecificContext);
        }

        return sb.ToString().Trim();
    }
}
