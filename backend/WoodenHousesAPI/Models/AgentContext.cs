namespace WoodenHousesAPI.Models;

/// <summary>
/// Key-value store of business context that feeds every agent prompt.
/// Admin edits these from the dashboard so agents always have accurate info.
/// </summary>
public class AgentContext
{
    public string   Key       { get; set; } = string.Empty;  // PK — e.g. "company_overview"
    public string   Label     { get; set; } = string.Empty;  // Human label shown in dashboard
    public string   Value     { get; set; } = string.Empty;  // The actual context text
    public string?  Hint      { get; set; }                  // Placeholder / guidance for admin
    public int      SortOrder { get; set; } = 0;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
