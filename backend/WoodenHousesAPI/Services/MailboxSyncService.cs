using System.Threading.Channels;
using Microsoft.Extensions.Options;

namespace WoodenHousesAPI.Services;

public class MailboxSyncService(
    IServiceProvider      services,
    IOptions<MailboxConfig> cfg,
    ILogger<MailboxSyncService> logger) : BackgroundService
{
    // "Sync now" requests from the dashboard. Handled here, on the one sync
    // loop, so a manual sync never runs concurrently with the scheduled one
    // and never borrows a request's (soon disposed) DbContext.
    private readonly Channel<string?> _requests = Channel.CreateUnbounded<string?>();

    /// <summary>Wakes the sync loop now. A null account syncs every account.</summary>
    public void RequestSync(string? account) => _requests.Writer.TryWrite(account);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Wait a bit for the app to fully start before first sync
        await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

        string? onlyAccount = null;
        while (!stoppingToken.IsCancellationRequested)
        {
            await RunSyncCycleAsync(onlyAccount, stoppingToken);

            var interval = TimeSpan.FromSeconds(cfg.Value.SyncIntervalSeconds);
            logger.LogInformation("Next mailbox sync in {Seconds}s", cfg.Value.SyncIntervalSeconds);
            onlyAccount = await WaitForNextCycleAsync(interval, stoppingToken);
        }
    }

    /// <summary>
    /// Waits out the interval or until a manual request arrives. Returns the
    /// requested account, or null for a full cycle.
    /// </summary>
    private async Task<string?> WaitForNextCycleAsync(TimeSpan interval, CancellationToken stoppingToken)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
        timeout.CancelAfter(interval);
        try
        {
            var requested = await _requests.Reader.ReadAsync(timeout.Token);
            // Collapse a burst of clicks; any request for "all" widens the cycle
            while (_requests.Reader.TryRead(out var more))
                if (more != requested) requested = null;
            return requested;
        }
        catch (OperationCanceledException) when (!stoppingToken.IsCancellationRequested)
        {
            return null;
        }
    }

    private async Task RunSyncCycleAsync(string? onlyAccount, CancellationToken ct)
    {
        var accounts = cfg.Value.Accounts
            .Where(a => onlyAccount is null || a.Email.Equals(onlyAccount, StringComparison.OrdinalIgnoreCase))
            .ToList();
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
            }
            catch (Exception ex) when (!ct.IsCancellationRequested)
            {
                logger.LogError(ex, "Mailbox sync failed for {Email}", account.Email);
            }

            // Small delay between accounts to be polite to the server
            if (accounts.Count > 1) await Task.Delay(2000, ct);
        }

        logger.LogInformation("Mailbox sync cycle complete");
    }
}
