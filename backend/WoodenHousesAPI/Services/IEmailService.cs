namespace WoodenHousesAPI.Services;

public interface IEmailService
{
    Task SendContactNotificationAsync(string fromName, string fromEmail, string? message);
    Task SendContactAutoReplyAsync(string toEmail, string toName);
    Task SendQuoteToCustomerAsync(string toEmail, string customerName, string quoteNumber, string quoteHtml);
    Task SendNewsletterAsync(IEnumerable<string> recipients, string subject, string htmlBody);
    Task SendNewsletterWelcomeAsync(string toEmail, string? name);
    Task SendNewsletterSubscriptionAlertAsync(string email, string? name);
    Task SendNewsletterBroadcastAsync(IEnumerable<string> recipients, string subject, string content);
}
