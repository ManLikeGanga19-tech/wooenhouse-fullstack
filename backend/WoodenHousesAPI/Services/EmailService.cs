using Resend;

namespace WoodenHousesAPI.Services;

/// <summary>
/// Sends email via the Resend API (HTTPS — works from any cloud host).
///
/// Routing:
///   Contact alert (internal)  → info@      → director@
///   Contact auto-reply        → sales@     → client
///   Quote sent to client      → accounts@  → client
///   Newsletter                → info@      → subscribers
/// </summary>
public class EmailService(ResendClient resend, IConfiguration config, ILogger<EmailService> logger) : IEmailService
{
    private const string InfoAddress     = "info@woodenhouseskenya.com";
    private const string SalesAddress    = "sales@woodenhouseskenya.com";
    private const string AccountsAddress = "accounts@woodenhouseskenya.com";
    private const string DisplayName     = "Wooden Houses Kenya";

    private static EmailMessage Build(
        string fromAddress, string fromDisplay,
        string toEmail,
        string subject,     string htmlBody,
        string? replyTo = null)
    {
        var msg = new EmailMessage
        {
            From     = $"{fromDisplay} <{fromAddress}>",
            Subject  = subject,
            HtmlBody = htmlBody,
        };
        msg.To.Add(toEmail);
        if (replyTo is not null)
            msg.ReplyTo.Add(replyTo);
        return msg;
    }

    // ─── Actions ─────────────────────────────────────────────────────────────

    public async Task SendContactNotificationAsync(string fromName, string fromEmail, string? message)
    {
        var adminAddress = config["Email:AdminNotifyAddress"] ?? "director@woodenhouseskenya.com";
        logger.LogInformation("[EMAIL] Contact alert → {Admin}", adminAddress);

        var html = $"""
            <div style="font-family:sans-serif;max-width:600px">
              <h2 style="color:#8B5E3C">New Contact Form Submission</h2>
              <p><strong>Name:</strong> {fromName}</p>
              <p><strong>Email:</strong> <a href="mailto:{fromEmail}">{fromEmail}</a></p>
              <p><strong>Message:</strong></p>
              <blockquote style="border-left:4px solid #C49A6C;margin:0;padding:8px 16px;color:#555">
                {(message ?? "<em>No message provided.</em>")}
              </blockquote>
              <p style="margin-top:24px;font-size:12px;color:#999">Wooden Houses Kenya · Admin Alert</p>
            </div>
            """;

        try
        {
            await resend.EmailSendAsync(Build(InfoAddress, DisplayName, adminAddress, $"New Enquiry: {fromName}", html));
            logger.LogInformation("[EMAIL] Contact alert sent OK → {Admin}", adminAddress);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[EMAIL] FAILED contact alert → {Admin} | {Error}", adminAddress, ex.Message);
        }
    }

    public async Task SendContactAutoReplyAsync(string toEmail, string toName)
    {
        logger.LogInformation("[EMAIL] Auto-reply → {Client}", toEmail);

        var html = $"""
            <div style="font-family:sans-serif;max-width:600px">
              <h2 style="color:#8B5E3C">Thank you, {toName}!</h2>
              <p>We have received your enquiry and will get back to you within <strong>1 business day</strong>.</p>
              <p>
                <a href="https://woodenhouseskenya.com/projects"
                   style="background:#8B5E3C;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">
                  View Our Projects
                </a>
              </p>
              <p style="margin-top:32px;font-size:13px;color:#555">
                Warm regards,<br>
                <strong>Sales Team · Wooden Houses Kenya</strong><br>
                <a href="mailto:sales@woodenhouseskenya.com" style="color:#8B5E3C">sales@woodenhouseskenya.com</a>
              </p>
            </div>
            """;

        try
        {
            await resend.EmailSendAsync(Build(
                SalesAddress, $"{DisplayName} · Sales",
                toEmail,
                "We received your enquiry — Wooden Houses Kenya",
                html, replyTo: SalesAddress));
            logger.LogInformation("[EMAIL] Auto-reply sent OK → {Client}", toEmail);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[EMAIL] FAILED auto-reply → {Client} | {Error}", toEmail, ex.Message);
        }
    }

    public async Task SendQuoteToCustomerAsync(string toEmail, string customerName, string quoteNumber, string quoteHtml)
    {
        logger.LogInformation("[EMAIL] Quote {Quote} → {Client}", quoteNumber, toEmail);

        try
        {
            await resend.EmailSendAsync(Build(
                AccountsAddress, $"{DisplayName} · Accounts",
                toEmail,
                $"Your Quote {quoteNumber} — Wooden Houses Kenya",
                quoteHtml, replyTo: SalesAddress));
            logger.LogInformation("[EMAIL] Quote {Quote} sent OK → {Client}", quoteNumber, toEmail);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[EMAIL] FAILED quote {Quote} → {Client} | {Error}", quoteNumber, toEmail, ex.Message);
        }
    }

    public async Task SendNewsletterAsync(IEnumerable<string> recipients, string subject, string htmlBody)
    {
        foreach (var recipient in recipients)
        {
            try
            {
                await resend.EmailSendAsync(Build(InfoAddress, DisplayName, recipient, subject, htmlBody));
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "[EMAIL] FAILED newsletter → {Email} | {Error}", recipient, ex.Message);
            }
        }
    }
}
