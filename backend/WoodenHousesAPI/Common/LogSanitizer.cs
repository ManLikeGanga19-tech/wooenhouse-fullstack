using System.Text;

namespace WoodenHousesAPI.Common;

/// <summary>
/// Helpers for writing user-derived values into logs safely.
///
///   • <see cref="Clean"/>     — strips CR/LF and other control characters so a
///                               value can't forge or inject extra log lines (CWE-117).
///   • <see cref="MaskEmail"/> — redacts an email so logs don't expose PII (CWE-359),
///                               e.g. "john.doe@gmail.com" → "jo***@gm***". The result
///                               contains no control characters, so it is also
///                               injection-safe.
///
/// Use <c>MaskEmail</c> for anything that is (or may be) an email address, and
/// <c>Clean</c> for other free text that originates from a request (subjects,
/// paths, exception messages, etc.).
/// </summary>
public static class LogSanitizer
{
    public static string Clean(string? value)
    {
        if (string.IsNullOrEmpty(value)) return string.Empty;

        var sb = new StringBuilder(value.Length);
        foreach (var ch in value)
            sb.Append(char.IsControl(ch) ? ' ' : ch);
        return sb.ToString();
    }

    public static string MaskEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email)) return "(none)";

        var trimmed = email.Trim();
        var at = trimmed.IndexOf('@');
        if (at <= 0 || at == trimmed.Length - 1)
            return "***"; // not an email shape — redact entirely rather than risk a leak

        static string Mask(string part) => part.Length <= 2 ? part[..1] + "***" : part[..2] + "***";
        return $"{Mask(trimmed[..at])}@{Mask(trimmed[(at + 1)..])}";
    }
}
