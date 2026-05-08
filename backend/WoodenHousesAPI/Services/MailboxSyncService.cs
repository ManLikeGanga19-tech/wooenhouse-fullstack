using Microsoft.Extensions.Options;

namespace WoodenHousesAPI.Services;

public class MailboxSyncService(
    IServiceProvider      services,
    IOptions<MailboxConfig> cfg,
    ILogger<MailboxSyncService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Wait a bit for the app to fully start before first sync
        await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            await RunSyncCycleAsync(stoppingToken);

            var interval = TimeSpan.FromMinutes(cfg.Value.SyncIntervalMinutes);
            logger.LogInformation("Next mailbox sync in {Minutes} min", cfg.Value.SyncIntervalMinutes);
            await Task.Delay(interval, stoppingToken);
        }
    }

    private async Task RunSyncCycleAsync(CancellationToken ct)
    {
        var accounts = cfg.Value.Accounts;
        if (accounts.Count == 0) return;

        logger.LogInformation("Starting mailbox sync for {Count} accounts", accounts.Count);

        // Sync accounts sequentially to avoid hammering the IMAP server
        foreach (var account in accounts)
        {
            if (ct.IsCancellationRequested) break;

            try
            {
                using var scope = services.CreateScope();
                var imap = scope.ServiceProvider.GetRequiredService<IImapService>();
                await imap.SyncAccountAsync(account, ct);
                logger.LogInformation("Synced {Email}", account.Email);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Mailbox sync failed for {Email}", account.Email);
            }

            // Small delay between accounts to be polite to the server
            await Task.Delay(2000, ct);
        }

        logger.LogInformation("Mailbox sync cycle complete");
    }
}
