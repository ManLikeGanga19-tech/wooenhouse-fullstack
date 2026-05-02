using Resend;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.Models;

namespace WoodenHousesAPI.Services;

/// <summary>
/// Sends email via the Resend API (HTTPS — works from any cloud host).
/// Logs every send attempt (sent/failed) to the EmailLogs table.
///
/// Routing:
///   Contact alert (internal)       → info@      → director@
///   Contact auto-reply             → sales@     → client
///   Quote sent to client           → accounts@  → client
///   Newsletter broadcast           → info@      → subscribers
///   Newsletter welcome             → info@      → new subscriber
///   Newsletter subscription alert  → info@      → director@
/// </summary>
public class EmailService(
    ResendClient resend,
    IServiceProvider services,
    IConfiguration config,
    ILogger<EmailService> logger) : IEmailService
{
    private const string InfoAddress     = "info@woodenhouseskenya.com";
    private const string SalesAddress    = "sales@woodenhouseskenya.com";
    private const string AccountsAddress = "accounts@woodenhouseskenya.com";
    private const string DisplayName     = "Wooden Houses Kenya";
    private const string LogoUrl         = "https://woodenhouseskenya.com/woodenhouse-logo.jpg";
    private const string SiteUrl         = "https://woodenhouseskenya.com";

    // ─── Professional email layout ────────────────────────────────────────────

    private static string Layout(string innerContent) => $"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
        </head>
        <body style="margin:0;padding:0;background-color:#F5F0EB;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F5F0EB">
            <tr>
              <td align="center" style="padding:40px 16px;">

                <!-- Logo above card -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
                  <tr>
                    <td align="center" style="padding-bottom:20px;">
                      <a href="{SiteUrl}" style="text-decoration:none;">
                        <img src="{LogoUrl}" alt="Wooden Houses Kenya" width="72" height="72"
                             style="border-radius:12px;display:block;border:3px solid #C49A6C;">
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Card -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                       style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

                  <!-- Header bar -->
                  <tr>
                    <td align="center" bgcolor="#8B5E3C"
                        style="background-color:#8B5E3C;padding:24px 40px;">
                      <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.3px;">Wooden Houses Kenya</p>
                      <p style="margin:6px 0 0;color:#C49A6C;font-size:13px;">Premium Wooden Construction</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td align="center" style="padding:40px 40px 32px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr><td>{innerContent}</td></tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td bgcolor="#FAF7F4" align="center"
                        style="background-color:#FAF7F4;padding:24px 40px;border-top:1px solid #EAE0D5;">
                      <p style="margin:0 0 6px;color:#8B5E3C;font-weight:700;font-size:13px;">Wooden Houses Kenya</p>
                      <p style="margin:0 0 4px;font-size:12px;color:#999999;">Naivasha, Kenya</p>
                      <p style="margin:0 0 8px;font-size:12px;">
                        <a href="tel:+254716111187" style="color:#8B5E3C;text-decoration:none;">+254 716 111 187</a>
                        &nbsp;&middot;&nbsp;
                        <a href="mailto:info@woodenhouseskenya.com" style="color:#8B5E3C;text-decoration:none;">info@woodenhouseskenya.com</a>
                      </p>
                      <p style="margin:0;font-size:11px;">
                        <a href="{SiteUrl}" style="color:#C49A6C;text-decoration:none;">woodenhouseskenya.com</a>
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """;

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private static EmailMessage Build(
        string fromAddress, string fromDisplay,
        string toEmail, string subject, string htmlBody,
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
        {
            msg.ReplyTo = new EmailAddressList();
            msg.ReplyTo.Add(replyTo);
        }
        return msg;
    }

    private async Task SendAndLog(
        EmailMessage msg, string type, string fromAddress, string toAddress)
    {
        string status = "sent";
        string? error = null;

        try
        {
            await resend.EmailSendAsync(msg);
            logger.LogInformation("[EMAIL] {Type} sent OK → {To}", type, toAddress);
        }
        catch (Exception ex)
        {
            status = "failed";
            error  = ex.Message;
            logger.LogError(ex, "[EMAIL] FAILED {Type} → {To} | {Error}", type, toAddress, ex.Message);
        }

        try
        {
            using var scope = services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.EmailLogs.Add(new EmailLog
            {
                Type         = type,
                FromAddress  = fromAddress,
                ToAddress    = toAddress,
                Subject      = msg.Subject ?? string.Empty,
                HtmlBody     = msg.HtmlBody,
                Status       = status,
                ErrorMessage = error,
            });
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "[EMAIL] Could not persist email log for {Type} → {To}", type, toAddress);
        }
    }

    // ─── Actions ─────────────────────────────────────────────────────────────

    public async Task SendContactNotificationAsync(string fromName, string fromEmail, string? message)
    {
        var adminAddress = config["Email:AdminNotifyAddress"] ?? "director@woodenhouseskenya.com";
        logger.LogInformation("[EMAIL] Contact alert → {Admin}", adminAddress);

        var content = $"""
            <h2 style="margin:0 0 20px;color:#8B5E3C;font-size:20px;font-weight:700;text-align:center;">New Enquiry Received</h2>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                   style="border-collapse:collapse;margin-bottom:24px;">
              <tr>
                <td style="padding:11px 0;border-bottom:1px solid #F0E8DF;color:#888;font-size:13px;width:110px;">Name</td>
                <td style="padding:11px 0;border-bottom:1px solid #F0E8DF;font-weight:600;font-size:14px;">{fromName}</td>
              </tr>
              <tr>
                <td style="padding:11px 0;border-bottom:1px solid #F0E8DF;color:#888;font-size:13px;">Email</td>
                <td style="padding:11px 0;border-bottom:1px solid #F0E8DF;font-size:14px;">
                  <a href="mailto:{fromEmail}" style="color:#8B5E3C;text-decoration:none;">{fromEmail}</a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;color:#555;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
            <div style="background:#FAF7F4;border-left:4px solid #C49A6C;border-radius:0 6px 6px 0;padding:14px 18px;color:#444;font-size:14px;line-height:1.6;margin-bottom:28px;">
              {(message ?? "<em style='color:#999;'>No message provided.</em>")}
            </div>
            <div style="text-align:center;">
              <a href="https://woodenhouseskenya.com/dashboard/contacts"
                 style="background:#8B5E3C;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:600;display:inline-block;">
                View in Dashboard →
              </a>
            </div>
            """;

        await SendAndLog(
            Build(InfoAddress, DisplayName, adminAddress, $"New Enquiry: {fromName}", Layout(content)),
            "contact_alert", InfoAddress, adminAddress);
    }

    public async Task SendContactAutoReplyAsync(string toEmail, string toName)
    {
        logger.LogInformation("[EMAIL] Auto-reply → {Client}", toEmail);

        var content = $"""
            <h2 style="margin:0 0 8px;color:#8B5E3C;font-size:22px;font-weight:700;text-align:center;">Thank you, {toName}!</h2>
            <p style="margin:0 0 24px;color:#666;font-size:14px;text-align:center;">We have received your enquiry.</p>

            <div style="background:#FAF7F4;border-radius:8px;padding:24px;margin-bottom:28px;text-align:center;">
              <p style="margin:0 0 8px;color:#444;font-size:15px;line-height:1.7;">
                Our team will review your request and get back to you within
                <strong style="color:#8B5E3C;">1 business day</strong>.
              </p>
              <p style="margin:0;color:#888;font-size:13px;">
                For urgent enquiries, call us on
                <a href="tel:+254716111187" style="color:#8B5E3C;text-decoration:none;font-weight:600;">+254 716 111 187</a>
              </p>
            </div>

            <div style="text-align:center;margin-bottom:28px;">
              <a href="{SiteUrl}/projects"
                 style="background:#8B5E3C;color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:6px;font-size:15px;font-weight:600;display:inline-block;">
                View Our Projects →
              </a>
            </div>

            <p style="margin:0;color:#999;font-size:13px;text-align:center;line-height:1.6;">
              Warm regards,<br>
              <strong style="color:#8B5E3C;">Sales Team · Wooden Houses Kenya</strong>
            </p>
            """;

        await SendAndLog(
            Build(SalesAddress, $"{DisplayName} · Sales", toEmail,
                "We received your enquiry — Wooden Houses Kenya", Layout(content), replyTo: SalesAddress),
            "auto_reply", SalesAddress, toEmail);
    }

    public async Task SendQuoteToCustomerAsync(
        string toEmail, string customerName, string quoteNumber, string quoteHtml)
    {
        logger.LogInformation("[EMAIL] Quote {Quote} → {Client}", quoteNumber, toEmail);

        await SendAndLog(
            Build(AccountsAddress, $"{DisplayName} · Accounts", toEmail,
                $"Your Quote {quoteNumber} — Wooden Houses Kenya", quoteHtml, replyTo: SalesAddress),
            "quote", AccountsAddress, toEmail);
    }

    public async Task SendNewsletterAsync(
        IEnumerable<string> recipients, string subject, string htmlBody)
    {
        foreach (var recipient in recipients)
        {
            await SendAndLog(
                Build(InfoAddress, DisplayName, recipient, subject, htmlBody),
                "newsletter", InfoAddress, recipient);
        }
    }

    public async Task SendNewsletterBroadcastAsync(
        IEnumerable<string> recipients, string subject, string content)
    {
        // Convert plain text to HTML paragraphs (double newline = new paragraph)
        var paragraphs = content
            .Split(new[] { "\r\n\r\n", "\n\n" }, StringSplitOptions.RemoveEmptyEntries)
            .Select(p =>
                $"<p style=\"margin:0 0 16px;font-size:15px;color:#444;line-height:1.7;\">{p.Trim().Replace("\r\n", "<br>").Replace("\n", "<br>")}</p>");

        var innerHtml = string.Join("", paragraphs);
        var htmlBody  = Layout(innerHtml);

        foreach (var recipient in recipients)
        {
            await SendAndLog(
                Build(InfoAddress, DisplayName, recipient, subject, htmlBody),
                "newsletter", InfoAddress, recipient);
        }
    }

    public async Task SendNewsletterWelcomeAsync(string toEmail, string? name)
    {
        logger.LogInformation("[EMAIL] Newsletter welcome → {Email}", toEmail);

        var greeting = string.IsNullOrWhiteSpace(name) ? "Welcome" : $"Welcome, {name}!";

        var content = $"""
            <h2 style="margin:0 0 8px;color:#8B5E3C;font-size:22px;font-weight:700;text-align:center;">{greeting}</h2>
            <p style="margin:0 0 24px;color:#666;font-size:14px;text-align:center;">You're now part of the Wooden Houses Kenya community.</p>

            <div style="background:#FAF7F4;border-radius:8px;padding:24px;margin-bottom:28px;text-align:center;">
              <p style="margin:0 0 12px;color:#444;font-size:15px;line-height:1.7;">
                Thank you for subscribing to our newsletter. You'll be the first to know about:
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#555;">
                    ✦ &nbsp;New wooden house projects &amp; gallery updates
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#555;">
                    ✦ &nbsp;Special offers and seasonal promotions
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#555;">
                    ✦ &nbsp;Construction tips and design inspiration
                  </td>
                </tr>
              </table>
            </div>

            <div style="text-align:center;margin-bottom:28px;">
              <a href="{SiteUrl}/projects"
                 style="background:#8B5E3C;color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:6px;font-size:15px;font-weight:600;display:inline-block;">
                Explore Our Projects →
              </a>
            </div>

            <p style="margin:0;color:#999;font-size:12px;text-align:center;line-height:1.6;">
              You can unsubscribe at any time by replying to this email.
            </p>
            """;

        await SendAndLog(
            Build(InfoAddress, DisplayName, toEmail,
                "Welcome to the Wooden Houses Kenya Newsletter", Layout(content)),
            "newsletter", InfoAddress, toEmail);
    }

    public async Task SendNewsletterSubscriptionAlertAsync(string email, string? name)
    {
        var adminAddress = config["Email:AdminNotifyAddress"] ?? "director@woodenhouseskenya.com";
        logger.LogInformation("[EMAIL] Newsletter subscription alert → {Admin}", adminAddress);

        var displayName = string.IsNullOrWhiteSpace(name) ? "—" : name;

        var content = $"""
            <h2 style="margin:0 0 20px;color:#8B5E3C;font-size:20px;font-weight:700;text-align:center;">New Newsletter Subscriber</h2>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                   style="border-collapse:collapse;margin-bottom:28px;">
              <tr>
                <td style="padding:11px 0;border-bottom:1px solid #F0E8DF;color:#888;font-size:13px;width:110px;">Email</td>
                <td style="padding:11px 0;border-bottom:1px solid #F0E8DF;font-weight:600;font-size:14px;">
                  <a href="mailto:{email}" style="color:#8B5E3C;text-decoration:none;">{email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:11px 0;border-bottom:1px solid #F0E8DF;color:#888;font-size:13px;">Name</td>
                <td style="padding:11px 0;border-bottom:1px solid #F0E8DF;font-size:14px;">{displayName}</td>
              </tr>
              <tr>
                <td style="padding:11px 0;color:#888;font-size:13px;">Time</td>
                <td style="padding:11px 0;font-size:14px;">{DateTime.UtcNow:dd MMM yyyy, HH:mm} UTC</td>
              </tr>
            </table>
            <div style="text-align:center;">
              <a href="https://woodenhouseskenya.com/dashboard/newsletter"
                 style="background:#8B5E3C;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:600;display:inline-block;">
                View Subscribers →
              </a>
            </div>
            """;

        await SendAndLog(
            Build(InfoAddress, DisplayName, adminAddress,
                $"New Newsletter Subscriber: {email}", Layout(content)),
            "newsletter", InfoAddress, adminAddress);
    }

    public async Task SendAgentEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken ct = default)
    {
        logger.LogInformation("[EMAIL] Agent email → {To} | {Subject}", toEmail, subject);
        await SendAndLog(
            Build(SalesAddress, DisplayName, toEmail, subject, htmlBody),
            "agent", SalesAddress, toEmail);
    }

    public async Task ResendEmailAsync(string fromAddress, string toEmail, string subject, string htmlBody)
    {
        logger.LogInformation("[EMAIL] Resend → {To} | {Subject}", toEmail, subject);
        await SendAndLog(
            Build(fromAddress, DisplayName, toEmail, subject, htmlBody),
            "resend", fromAddress, toEmail);
    }

    public async Task SendAdminReportAsync(string toEmail, string subject, string htmlBody)
    {
        logger.LogInformation("[EMAIL] Admin report → {To}", toEmail);
        await SendAndLog(
            Build(InfoAddress, DisplayName, toEmail, subject, htmlBody),
            "agent", InfoAddress, toEmail);
    }
}
