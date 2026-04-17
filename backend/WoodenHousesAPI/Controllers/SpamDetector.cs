namespace WoodenHousesAPI.Controllers;

/// <summary>
/// Lightweight server-side spam detection.
/// Works in tandem with the frontend honeypot field and load-time tracking.
///
/// Layers:
///   1. Honeypot  — hidden field named "hp"; legitimate users never touch it,
///                  bots fill every field they find.
///   2. Fast-submit — if the form was submitted in under 1.5 s the client never
///                  had time to read it (bot behaviour).
///
/// Never reject submissions outright — always save and flag silently so:
///   a) Spammers get no feedback that they were caught.
///   b) False-positives can be reviewed and cleared by an admin.
/// </summary>
internal static class SpamDetector
{
    private const int MinSubmitMs = 1_500; // anything faster = suspicious

    public static (bool isSpam, string? reason) Check(string? honeypot, long? loadedAtMs)
    {
        // Layer 1 — honeypot filled
        if (!string.IsNullOrWhiteSpace(honeypot))
            return (true, "honeypot");

        // Layer 2 — submitted impossibly fast
        if (loadedAtMs.HasValue)
        {
            var elapsedMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - loadedAtMs.Value;
            if (elapsedMs < MinSubmitMs)
                return (true, "fast-submit");
        }

        return (false, null);
    }
}
