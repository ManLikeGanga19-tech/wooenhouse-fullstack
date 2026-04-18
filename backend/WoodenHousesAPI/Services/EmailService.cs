using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace WoodenHousesAPI.Services;

/// <summary>
/// Routes outgoing emails through the correct company address depending on the action.
///
/// Routing:
///   Contact alert (internal)  → info@      → director@
///   Contact auto-reply        → sales@     → client
///   Quote sent to client      → accounts@  → client
///   Newsletter                → info@      → subscribers
///
/// All company emails share one SMTP password (set in Email:Password config).
/// The from-address is also the SMTP username for each connection.
/// </summary>
public class EmailService(IConfiguration config, ILogger<EmailService> logger) : IEmailService
{
    // ─── Email profiles ───────────────────────────────────────────────────────

    private const string InfoAddress        = "info@woodenhouseskenya.com";
    private const string SalesAddress       = "sales@woodenhouseskenya.com";
    private const string AccountsAddress    = "accounts@woodenhouseskenya.com";
    private const string TechnicalAddress   = "technical@woodenhouseskenya.com";

    private const string DisplayName        = "Wooden Houses Kenya";

    // ─── Core send logic ─────────────────────────────────────────────────────

    private MimeMessage BuildMessage(
        string fromAddress, string fromDisplay,
        string toEmail,     string toName,
        string subject,     string htmlBody,
        string? replyTo = null)
    {
        var msg = new MimeMessage();
        msg.From.Add(new MailboxAddress(fromDisplay, fromAddress));
        msg.To.Add(new MailboxAddress(toName, toEmail));
        if (replyTo is not null)
            msg.ReplyTo.Add(new MailboxAddress(fromDisplay, replyTo));
        msg.Subject = subject;
        msg.Body    = new TextPart("html") { Text = htmlBody };
        return msg;
    }

    private async Task SendAsync(MimeMessage message)
    {
        var fromAddress = ((MailboxAddress)message.From[0]).Address;
        var password    = config["Email:Password"]
            ?? throw new InvalidOperationException("Email:Password is not configured.");

        using var client = new SmtpClient();
        await client.ConnectAsync(
            config["Email:Host"] ?? "mail.woodenhouseskenya.com",
            int.Parse(config["Email:Port"] ?? "465"),
            SecureSocketOptions.SslOnConnect   // port 465 = SSL, not STARTTLS
        );
        await client.AuthenticateAsync(fromAddress, password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }

    // ─── Action methods ───────────────────────────────────────────────────────

    /// <summary>Internal alert to director when a new contact form is submitted.</summary>
    public async Task SendContactNotificationAsync(string fromName, string fromEmail, string? message)
    {
        var adminAddress = config["Email:AdminNotifyAddress"] ?? "director@woodenhouseskenya.com";
        logger.LogInformation("[EMAIL] Sending contact alert → {Admin} via {Host}:{Port}",
            adminAddress, config["Email:Host"], config["Email:Port"]);

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

        var email = BuildMessage(InfoAddress, DisplayName, adminAddress, "Admin", $"New Enquiry: {fromName}", html);
        try
        {
            await SendAsync(email);
            logger.LogInformation("[EMAIL] Contact alert sent OK → {Admin}", adminAddress);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[EMAIL] FAILED contact alert → {Admin} | {Error}", adminAddress, ex.Message);
        }
    }

    /// <summary>Auto-reply to the client immediately after they submit the contact form.</summary>
    public async Task SendContactAutoReplyAsync(string toEmail, string toName)
    {
        logger.LogInformation("[EMAIL] Sending auto-reply → {Client}", toEmail);

        var html = $"""
            <div style="font-family:sans-serif;max-width:600px">
              <h2 style="color:#8B5E3C">Thank you, {toName}!</h2>
              <p>We have received your enquiry and will get back to you within <strong>1 business day</strong>.</p>
              <p>In the meantime, feel free to browse our work:</p>
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

        var email = BuildMessage(
            SalesAddress, $"{DisplayName} · Sales",
            toEmail, toName,
            "We received your enquiry — Wooden Houses Kenya",
            html, replyTo: SalesAddress);

        try
        {
            await SendAsync(email);
            logger.LogInformation("[EMAIL] Auto-reply sent OK → {Client}", toEmail);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[EMAIL] FAILED auto-reply → {Client} | {Error}", toEmail, ex.Message);
        }
    }

    /// <summary>Sends a quote PDF/HTML to the client. Comes from accounts@.</summary>
    public async Task SendQuoteToCustomerAsync(
        string toEmail, string customerName, string quoteNumber, string quoteHtml)
    {
        logger.LogInformation("[EMAIL] Sending quote {Quote} → {Client}", quoteNumber, toEmail);

        var email = BuildMessage(
            AccountsAddress, $"{DisplayName} · Accounts",
            toEmail, customerName,
            $"Your Quote {quoteNumber} — Wooden Houses Kenya",
            quoteHtml, replyTo: SalesAddress);

        try
        {
            await SendAsync(email);
            logger.LogInformation("[EMAIL] Quote {Quote} sent OK → {Client}", quoteNumber, toEmail);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[EMAIL] FAILED quote {Quote} → {Client} | {Error}", quoteNumber, toEmail, ex.Message);
        }
    }

    /// <summary>Bulk newsletter. Comes from info@.</summary>
    public async Task SendNewsletterAsync(
        IEnumerable<string> recipients, string subject, string htmlBody)
    {
        foreach (var recipient in recipients)
        {
            var email = BuildMessage(InfoAddress, DisplayName, recipient, "", subject, htmlBody);
            try   { await SendAsync(email); }
            catch (Exception ex) { logger.LogError(ex, "[EMAIL] FAILED newsletter → {Email} | {Error}", recipient, ex.Message); }
        }
    }
}
