namespace WoodenHousesAPI.Models;

public class AgentTask
{
    public Guid     Id            { get; set; } = Guid.NewGuid();

    // Which agent produced this task and what triggered it
    public string   AgentType     { get; set; } = string.Empty; // sales | quote | followup | accounts
    public string   TriggerType   { get; set; } = string.Empty; // contact_form | scheduled | manual

    // Lifecycle status
    public string   Status        { get; set; } = "pending_approval";
    // pending_approval | auto_sent | approved | rejected | failed

    // Links to business entities this task relates to
    public Guid?    ContactId     { get; set; }
    public Guid?    QuoteId       { get; set; }

    // What the agent received as input
    public string   InputSummary  { get; set; } = string.Empty;

    // What Claude drafted
    public string   DraftSubject  { get; set; } = string.Empty;
    public string   DraftBody     { get; set; } = string.Empty;

    // What was finally sent (may differ if admin edited before approving)
    public string?  FinalSubject  { get; set; }
    public string?  FinalBody     { get; set; }

    // Recipient
    public string?  ToAddress     { get; set; }

    // Outcome metadata
    public string?  ErrorMessage  { get; set; }
    public string?  ApprovedBy    { get; set; } // admin email or "auto"
    public string?  RejectedBy    { get; set; }
    public string?  RejectionNote { get; set; }

    // Token usage captured from Anthropic API response
    public int       InputTokens  { get; set; } = 0;
    public int       OutputTokens { get; set; } = 0;

    public DateTime  CreatedAt    { get; set; } = DateTime.UtcNow;
    public DateTime? ExecutedAt   { get; set; }

    // Navigation
    public Contact? Contact       { get; set; }
    public Quote?   Quote         { get; set; }
}
