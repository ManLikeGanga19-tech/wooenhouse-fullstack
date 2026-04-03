namespace WoodenHousesAPI.Services;

public interface IEmailService
{
    Task SendContactNotificationAsync(string toAdmin, string fromName, string fromEmail, string? message);
    Task SendQuoteToCustomerAsync(string toEmail, string customerName, string quoteNumber, string quoteHtml);
    Task SendNewsletterAsync(IEnumerable<string> recipients, string subject, string htmlBody);
}
