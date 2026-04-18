namespace WoodenHousesAPI.Services;

public interface IEmailService
{
    Task SendContactNotificationAsync(string fromName, string fromEmail, string? message);
    Task SendContactAutoReplyAsync(string toEmail, string toName);
    Task SendQuoteToCustomerAsync(string toEmail, string customerName, string quoteNumber, string quoteHtml);
    Task SendNewsletterAsync(IEnumerable<string> recipients, string subject, string htmlBody);
}
