using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.Data;

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
