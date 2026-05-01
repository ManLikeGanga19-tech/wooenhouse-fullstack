using System.Collections.Concurrent;
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

        _log.LogInformation("[IMAP] Connecting {Address}", address);

        if (entry.Client.IsConnected)
        {
            try { await entry.Client.DisconnectAsync(true, ct); } catch { /* swallow */ }
        }

        entry.Client.Dispose();
        entry.Client = new ImapClient();

        await entry.Client.ConnectAsync(host, port, SecureSocketOptions.SslOnConnect, ct);
        await entry.Client.AuthenticateAsync(address, password, ct);

        _log.LogInformation("[IMAP] Authenticated {Address}", address);
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
