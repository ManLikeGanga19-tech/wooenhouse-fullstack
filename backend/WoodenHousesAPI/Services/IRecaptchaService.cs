namespace WoodenHousesAPI.Services;

/// <summary>
/// Outcome of a reCAPTCHA verification.
/// Only <see cref="Bot"/> should ever cause a submission to be flagged — every
/// other situation (not configured, missing token, Google unreachable, token
/// rejected) resolves to <see cref="Human"/> so a misconfiguration can never
/// silently bury a real lead. Bot gating still happens via the honeypot and
/// submit-timing checks.
/// </summary>
public enum RecaptchaResult
{
    /// <summary>Allow the submission (verified human, or could not be verified — fail open).</summary>
    Human,

    /// <summary>Google verified the token and scored it below the human threshold.</summary>
    Bot,
}

public interface IRecaptchaService
{
    /// <summary>
    /// Verifies a reCAPTCHA v3 token with Google.
    /// Returns <see cref="RecaptchaResult.Bot"/> ONLY when Google successfully
    /// verifies the token and returns a score below the threshold. In every
    /// other case — secret key not configured (dev / tests), token missing,
    /// Google unreachable, or the token rejected (e.g. a site-key/secret
    /// mismatch) — it fails open and returns <see cref="RecaptchaResult.Human"/>.
    /// </summary>
    Task<RecaptchaResult> VerifyAsync(string? token);
}
