using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace WoodenHousesAPI.Services;

public class EmailService(IConfiguration config, ILogger<EmailService> logger) : IEmailService
{
    private MimeMessage BuildMessage(string toEmail, string toName, string subject, string htmlBody)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(
            config["Email:FromName"]    ?? "Wooden Houses Kenya",
            config["Email:FromAddress"] ?? "info@woodenhouseskenya.com"
        ));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = subject;
        message.Body    = new TextPart("html") { Text = htmlBody };
        return message;
    }

    private async Task SendAsync(MimeMessage message)
    {
        using var client = new SmtpClient();
        await client.ConnectAsync(
            config["Email:Host"]!,
            int.Parse(config["Email:Port"] ?? "587"),
            SecureSocketOptions.StartTls
        );
        await client.AuthenticateAsync(
            config["Email:Username"]!,
            config["Email:Password"]!
        );
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }

    public async Task SendContactNotificationAsync(
        string toAdmin, string fromName, string fromEmail, string? message)
    {
        var html = $"""
            <h2>New Contact from {fromName}</h2>
            <p><strong>Email:</strong> {fromEmail}</p>
            <p><strong>Message:</strong> {message ?? "No message provided."}</p>
            """;

        var email = BuildMessage(toAdmin, "Admin", $"New Contact: {fromName}", html);
        try   { await SendAsync(email); }
        catch (Exception ex) { logger.LogError(ex, "Failed to send contact notification"); }
    }

    public async Task SendQuoteToCustomerAsync(
        string toEmail, string customerName, string quoteNumber, string quoteHtml)
    {
        var email = BuildMessage(toEmail, customerName, $"Your Quote {quoteNumber} - Wooden Houses Kenya", quoteHtml);
        try   { await SendAsync(email); }
        catch (Exception ex) { logger.LogError(ex, "Failed to send quote email to {Email}", toEmail); }
    }

    public async Task SendNewsletterAsync(
        IEnumerable<string> recipients, string subject, string htmlBody)
    {
        foreach (var recipient in recipients)
        {
            var email = BuildMessage(recipient, "", subject, htmlBody);
            try   { await SendAsync(email); }
            catch (Exception ex) { logger.LogError(ex, "Failed to send newsletter to {Email}", recipient); }
        }
    }
}
