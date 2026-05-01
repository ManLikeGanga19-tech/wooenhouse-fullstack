using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using WoodenHousesAPI.Tests.Integration.Helpers;

namespace WoodenHousesAPI.Tests.Integration;

[Collection("Integration")]
public class AdminMailboxControllerTests(TestWebApplicationFactory factory)
{
    private readonly HttpClient _anon = factory.CreateClient();

    // ─── Auth guard — all endpoints must reject unauthenticated requests ──────

    [Theory]
    [InlineData("GET",    "/api/admin/mailbox/accounts")]
    [InlineData("GET",    "/api/admin/mailbox/info%40woodenhouseskenya.com/folders")]
    [InlineData("GET",    "/api/admin/mailbox/info%40woodenhouseskenya.com/INBOX")]
    [InlineData("GET",    "/api/admin/mailbox/info%40woodenhouseskenya.com/INBOX/1")]
    [InlineData("POST",   "/api/admin/mailbox/send")]
    [InlineData("POST",   "/api/admin/mailbox/draft")]
    public async Task Endpoint_Unauthenticated_Returns401(string method, string url)
    {
        var request  = new HttpRequestMessage(new HttpMethod(method), url);
        if (method is "POST" or "PATCH")
            request.Content = JsonContent.Create(new { });

        var response = await _anon.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ─── GET /api/admin/mailbox/accounts ─────────────────────────────────────

    [Fact]
    public async Task GetAccounts_Authenticated_Returns200WithSixAccounts()
    {
        var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/admin/mailbox/accounts");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var accounts = await response.Content.ReadFromJsonAsync<List<AccountDto>>();
        accounts.Should().NotBeNull();
        accounts!.Count.Should().Be(6);
        accounts.Should().Contain(a => a.Address == "technical@woodenhouseskenya.com");
        accounts.Should().Contain(a => a.Address == "sales@woodenhouseskenya.com");
        accounts.Should().Contain(a => a.Address == "info@woodenhouseskenya.com");
        accounts.Should().Contain(a => a.Address == "director@woodenhouseskenya.com");
    }

    // ─── GET /api/admin/mailbox/{address}/folders ─────────────────────────────

    [Fact]
    public async Task GetFolders_KnownAccount_Returns200WithFolderList()
    {
        var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.GetAsync(
            "/api/admin/mailbox/info%40woodenhouseskenya.com/folders");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var folders = await response.Content.ReadFromJsonAsync<List<FolderDto>>();
        folders.Should().NotBeNullOrEmpty();
        folders!.Should().Contain(f => f.Name == "INBOX");
    }

    [Fact]
    public async Task GetFolders_UnknownAccount_Returns404()
    {
        var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.GetAsync(
            "/api/admin/mailbox/nobody%40woodenhouseskenya.com/folders");

        // ExceptionMiddleware maps KeyNotFoundException → 404
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ─── GET /api/admin/mailbox/{address}/{folder} ────────────────────────────

    [Fact]
    public async Task GetEmails_UnknownAccount_Returns404()
    {
        var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.GetAsync(
            "/api/admin/mailbox/nobody%40woodenhouseskenya.com/INBOX");

        // ExceptionMiddleware maps KeyNotFoundException → 404
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetEmails_KnownAccount_Returns200WithEmailList()
    {
        var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.GetAsync(
            "/api/admin/mailbox/info%40woodenhouseskenya.com/INBOX?page=1&pageSize=10");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<EmailListResponse>();
        body!.Emails.Should().NotBeNull();
        body.Total.Should().BeGreaterThan(0);
    }

    // ─── POST /api/admin/mailbox/send — validation ────────────────────────────

    [Fact]
    public async Task SendEmail_MissingRequiredFields_Returns400()
    {
        var client = await factory.CreateAuthenticatedClientAsync();

        // No AccountAddress, no To, no Subject — all [Required]
        var response = await client.PostAsJsonAsync("/api/admin/mailbox/send", new { });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task SendEmail_UnknownAccountAddress_Returns404()
    {
        var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.PostAsJsonAsync("/api/admin/mailbox/send", new
        {
            accountAddress = "nobody@woodenhouseskenya.com",
            to             = "test@example.com",
            subject        = "Test",
            textBody       = "Hello",
        });

        // ExceptionMiddleware maps KeyNotFoundException → 404
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ─── POST /api/admin/mailbox/draft — validation ───────────────────────────

    [Fact]
    public async Task SaveDraft_MissingRequiredFields_Returns400()
    {
        var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.PostAsJsonAsync("/api/admin/mailbox/draft", new { });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ─── PATCH /api/admin/mailbox/{address}/{folder}/{uid}/read ──────────────

    [Fact]
    public async Task MarkRead_UnknownAccount_Returns404()
    {
        var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.PatchAsJsonAsync(
            "/api/admin/mailbox/nobody%40woodenhouseskenya.com/INBOX/1/read",
            new { isRead = true });

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ─── POST /api/admin/mailbox/{address}/{folder}/{uid}/move ────────────────

    [Fact]
    public async Task MoveEmail_MissingTargetFolder_Returns400()
    {
        var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.PostAsJsonAsync(
            "/api/admin/mailbox/info%40woodenhouseskenya.com/INBOX/1/move",
            new { });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ─── DELETE /api/admin/mailbox/{address}/{folder}/{uid} ──────────────────

    [Fact]
    public async Task DeleteEmail_UnknownAccount_Returns404()
    {
        var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.DeleteAsync(
            "/api/admin/mailbox/nobody%40woodenhouseskenya.com/INBOX/1");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ─── Helper DTOs (match the JSON shape returned by the controller) ────────
    private record AccountDto(string Name, string Address);
    private record FolderDto(string Name, string DisplayName, string Icon, int TotalCount, int UnreadCount);
    private record EmailListResponse(List<EmailItem> Emails, int Total, int Page, int PageSize);
    private record EmailItem(long Uid, string Subject, string From, bool IsRead);
}
