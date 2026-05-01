using System.Collections.Concurrent;
using System.Net.Security;
using MailKit.Net.Imap;
using MailKit.Security;

namespace WoodenHousesAPI.Services;

/// <summary>
/// Singleton — maintains one authenticated ImapClient per mailbox account.
/// Reconnects automatically when a connection is dropped by the server.
/// Each acquisition acquires a per-account SemaphoreSlim so only one
/// concurrent IMAP operation runs per account at a time.
/// </summary>
public sealed class MailboxConnectionPool : IAsyncDisposable
{
    private sealed class PoolEntry
    {
        public ImapClient     Client { get; set; } = new();
        public SemaphoreSlim  Lock   { get; }      = new(1, 1);
    }

    private readonly ConcurrentDictionary<string, PoolEntry> _pool = new();
    private readonly ILogger<MailboxConnectionPool>           _log;

    public MailboxConnectionPool(ILogger<MailboxConnectionPool> log) => _log = log;

    /// <summary>
    /// Acquires an authenticated ImapClient for the given account.
    /// Caller MUST dispose the returned <see cref="MailboxSession"/> to release the lock.
    /// </summary>
    public async Task<MailboxSession> AcquireAsync(
        string address, string password, string host, int port,
        CancellationToken ct = default)
    {
        var entry = _pool.GetOrAdd(address, _ => new PoolEntry());
        await entry.Lock.WaitAsync(ct);

        try
        {
            await EnsureConnectedAsync(entry, address, password, host, port, ct);
        }
        catch
        {
            entry.Lock.Release();
            throw;
        }

        return new MailboxSession(entry.Client, entry.Lock);
    }

    private async Task EnsureConnectedAsync(
        PoolEntry entry, string address, string password,
        string host, int port, CancellationToken ct)
    {
        if (entry.Client.IsConnected && entry.Client.IsAuthenticated)
            return;

        if (entry.Client.IsConnected)
        {
            try { await entry.Client.DisconnectAsync(true, ct); } catch { /* swallow */ }
        }

        entry.Client.Dispose();
        entry.Client = new ImapClient
        {
            // 30 s per socket read/write; STARTTLS on port 143 sends the IMAP banner
            // in plain text before TLS upgrade, bypassing the SSL-layer stall that
            // Hostinger applies to cloud/datacenter IPs on port 993.
            Timeout = 30_000,
            ServerCertificateValidationCallback = (_, certificate, _, sslPolicyErrors) =>
            {
                if (sslPolicyErrors != SslPolicyErrors.None)
                    _log.LogWarning("[IMAP] SSL cert issue for {Address}: {Errors} | Subject={Subject}",
                        address, sslPolicyErrors, certificate?.Subject);
                return true;
            },
        };

        _log.LogInformation("[IMAP] Connecting to {Host}:{Port} for {Address}", host, port, address);

        // Hard 45-second deadline — must complete before the 60-second axios timeout.
        using var connectCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        connectCts.CancelAfter(TimeSpan.FromSeconds(45));

        try
        {
            // Use STARTTLS (port 143) so the plain-text IMAP banner arrives before
            // TLS negotiation starts — this sidesteps Hostinger's TLS-level IP checks.
            await entry.Client.ConnectAsync(host, port, SecureSocketOptions.StartTls, connectCts.Token);
            _log.LogInformation("[IMAP] TCP+STARTTLS connected for {Address}, authenticating…", address);

            await entry.Client.AuthenticateAsync(address, password, connectCts.Token);
            _log.LogInformation("[IMAP] Authenticated {Address}", address);
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            throw new TimeoutException(
                $"IMAP connection to {host}:{port} for {address} timed out after 45 s (TCP/STARTTLS or AUTH).");
        }
    }

    public async ValueTask DisposeAsync()
    {
        foreach (var (_, entry) in _pool)
        {
            try
            {
                if (entry.Client.IsConnected)
                    await entry.Client.DisconnectAsync(true);
                entry.Client.Dispose();
            }
            catch { /* best-effort */ }
        }
    }
}

/// <summary>
/// RAII handle — releases the account lock on Dispose.
/// </summary>
public sealed class MailboxSession(ImapClient client, SemaphoreSlim @lock) : IDisposable
{
    public ImapClient Client { get; } = client;
    public void Dispose() => @lock.Release();
}
