namespace WoodenHousesAPI.Services;

/// <summary>Runs the follow-up agent daily at 08:00 EAT (05:00 UTC).</summary>
public class FollowupSchedulerService(
    IServiceScopeFactory              scopeFactory,
    ILogger<FollowupSchedulerService> log) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        log.LogInformation("[FollowupScheduler] Started — fires daily at 08:00 EAT (05:00 UTC)");

        while (!stoppingToken.IsCancellationRequested)
        {
            var delay = GetDelayUntilUtc(hour: 5, minute: 0);
            log.LogInformation("[FollowupScheduler] Next run in {Hours:F1} hours", delay.TotalHours);

            await Task.Delay(delay, stoppingToken);

            if (stoppingToken.IsCancellationRequested) break;

            using var scope = scopeFactory.CreateScope();
            var agent = scope.ServiceProvider.GetRequiredService<IFollowupAgentService>();
            try
            {
                var result = await agent.RunScheduledFollowupsAsync(stoppingToken);
                log.LogInformation("[FollowupScheduler] Done — queued={Q} failed={F} skipped={S}",
                    result.Queued, result.Failed, result.Skipped);
            }
            catch (Exception ex)
            {
                log.LogError(ex, "[FollowupScheduler] Run failed");
            }
        }
    }

    private static TimeSpan GetDelayUntilUtc(int hour, int minute)
    {
        var now     = DateTime.UtcNow;
        var nextRun = new DateTime(now.Year, now.Month, now.Day, hour, minute, 0, DateTimeKind.Utc);
        if (nextRun <= now) nextRun = nextRun.AddDays(1);
        var delay = nextRun - now;
        // Guard against sub-second values to avoid tight loops
        return delay < TimeSpan.FromSeconds(1) ? TimeSpan.FromHours(24) : delay;
    }
}

/// <summary>Runs the accounts agent every Monday at 09:00 EAT (06:00 UTC).</summary>
public class AccountsSchedulerService(
    IServiceScopeFactory               scopeFactory,
    ILogger<AccountsSchedulerService>  log) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        log.LogInformation("[AccountsScheduler] Started — fires every Monday at 09:00 EAT (06:00 UTC)");

        while (!stoppingToken.IsCancellationRequested)
        {
            var delay = GetDelayUntilNextMonday(hour: 6, minute: 0);
            log.LogInformation("[AccountsScheduler] Next run in {Hours:F1} hours", delay.TotalHours);

            await Task.Delay(delay, stoppingToken);

            if (stoppingToken.IsCancellationRequested) break;

            using var scope = scopeFactory.CreateScope();
            var agent = scope.ServiceProvider.GetRequiredService<IAccountsAgentService>();
            try
            {
                var result = await agent.RunWeeklyAsync(stoppingToken);
                log.LogInformation("[AccountsScheduler] Done — remindersQueued={R} reportSent={S}",
                    result.PaymentRemindersQueued, result.ReportSent);
            }
            catch (Exception ex)
            {
                log.LogError(ex, "[AccountsScheduler] Run failed");
            }
        }
    }

    private static TimeSpan GetDelayUntilNextMonday(int hour, int minute)
    {
        var now            = DateTime.UtcNow;
        var daysUntilMon   = ((int)DayOfWeek.Monday - (int)now.DayOfWeek + 7) % 7;
        var todayRun       = new DateTime(now.Year, now.Month, now.Day, hour, minute, 0, DateTimeKind.Utc);

        // If today is Monday and the run time hasn't passed yet, run today
        if (daysUntilMon == 0 && now < todayRun)
        {
            var delay = todayRun - now;
            return delay < TimeSpan.FromSeconds(1) ? TimeSpan.FromDays(7) : delay;
        }

        // Otherwise wait until next Monday
        if (daysUntilMon == 0) daysUntilMon = 7;
        var nextRun = todayRun.AddDays(daysUntilMon);
        return nextRun - now;
    }
}
