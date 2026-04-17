namespace WoodenHousesAPI.Services;

public interface IRecaptchaService
{
    /// <summary>
    /// Verifies a reCAPTCHA v3 token with Google.
    /// Returns (success=true, score=1.0) when secret key is not configured (dev / tests).
    /// Returns (false, 0) when the token is missing or verification fails.
    /// Score: 1.0 = definitely human, 0.0 = definitely bot. Threshold is 0.5.
    /// </summary>
    Task<(bool success, float score)> VerifyAsync(string? token);
}
