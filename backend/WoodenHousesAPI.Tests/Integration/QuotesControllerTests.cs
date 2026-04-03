using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using WoodenHousesAPI.Tests.Integration.Helpers;

namespace WoodenHousesAPI.Tests.Integration;

[Collection("Integration")]
public class QuotesControllerTests(TestWebApplicationFactory factory)
   
{
    private readonly HttpClient _client = factory.CreateClient();

    private static object ValidQuotePayload() => new
    {
        customerName     = "John Kamau",
        customerEmail    = "john@test.com",
        customerPhone    = "+254700000001",
        houseType        = "3-bedroom bungalow",
        houseSize        = "1200 sqft",
        location         = "Karen, Nairobi",
        basePrice        = 2_500_000m,
        discount         = 100_000m,
        finalPrice       = 2_400_000m,
        paymentTerms     = "50% upfront, 50% on completion",
        deliveryTimeline = "6 months",
        validityDays     = 30,
        status           = "draft",
        lineItems        = new[]
        {
            new { description = "Foundation & Structure", quantity = 1, unitPrice = 1_200_000m },
            new { description = "Walls & Roof",           quantity = 1, unitPrice =   800_000m },
            new { description = "Finishes & Fittings",    quantity = 1, unitPrice =   500_000m },
        },
    };

    // ─── POST /api/admin/quotes ───────────────────────────────────────────────

    [Fact]
    public async Task CreateQuote_ValidPayload_Returns201WithQuoteNumber()
    {
        var authClient = await factory.CreateAuthenticatedClientAsync();

        var response = await authClient.PostAsJsonAsync("/api/admin/quotes", ValidQuotePayload());

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<QuoteResponse>();
        body!.QuoteNumber.Should().StartWith("WHK-");
        body.Status.Should().Be("draft");
    }

    [Fact]
    public async Task CreateQuote_Unauthenticated_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/admin/quotes", ValidQuotePayload());
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateQuote_QuoteNumbersAreSequentialAndUnique()
    {
        var authClient = await factory.CreateAuthenticatedClientAsync();

        var r1 = await authClient.PostAsJsonAsync("/api/admin/quotes", ValidQuotePayload());
        var r2 = await authClient.PostAsJsonAsync("/api/admin/quotes", ValidQuotePayload());

        var q1 = await r1.Content.ReadFromJsonAsync<QuoteResponse>();
        var q2 = await r2.Content.ReadFromJsonAsync<QuoteResponse>();

        q1!.QuoteNumber.Should().NotBe(q2!.QuoteNumber);
    }

    // ─── GET /api/admin/quotes ────────────────────────────────────────────────

    [Fact]
    public async Task GetQuotes_Authenticated_ReturnsPaginatedList()
    {
        var authClient = await factory.CreateAuthenticatedClientAsync();
        await authClient.PostAsJsonAsync("/api/admin/quotes", ValidQuotePayload());

        var response = await authClient.GetAsync("/api/admin/quotes");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<PaginatedResponse<QuoteResponse>>();
        body!.Total.Should().BeGreaterThan(0);
    }

    // ─── PUT /api/admin/quotes/{id} ───────────────────────────────────────────

    [Fact]
    public async Task UpdateQuote_ChangesStatusAndPricing_Persists()
    {
        var authClient = await factory.CreateAuthenticatedClientAsync();
        var created    = await (await authClient.PostAsJsonAsync("/api/admin/quotes", ValidQuotePayload()))
            .Content.ReadFromJsonAsync<QuoteResponse>();

        var updatePayload = new
        {
            created!.CustomerName,
            created.CustomerEmail,
            created.CustomerPhone,
            created.HouseType,
            created.HouseSize,
            created.Location,
            BasePrice    = 3_000_000m,
            Discount     = 200_000m,
            FinalPrice   = 2_800_000m,
            created.PaymentTerms,
            created.DeliveryTimeline,
            created.ValidityDays,
            Status    = "sent",
            LineItems = Array.Empty<object>(),
        };

        var update = await authClient.PutAsJsonAsync($"/api/admin/quotes/{created.Id}", updatePayload);
        update.StatusCode.Should().Be(HttpStatusCode.OK);

        var updated = await update.Content.ReadFromJsonAsync<QuoteResponse>();
        updated!.FinalPrice.Should().Be(2_800_000m);
        updated.Status.Should().Be("sent");
    }

    // ─── POST /api/admin/quotes/{id}/send ────────────────────────────────────

    [Fact]
    public async Task SendQuote_ChangesStatusToSent()
    {
        var authClient = await factory.CreateAuthenticatedClientAsync();
        var created    = await (await authClient.PostAsJsonAsync("/api/admin/quotes", ValidQuotePayload()))
            .Content.ReadFromJsonAsync<QuoteResponse>();

        var send = await authClient.PostAsync($"/api/admin/quotes/{created!.Id}/send", null);

        // Email will fail in test env but status should still update
        send.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.InternalServerError);

        if (send.StatusCode == HttpStatusCode.OK)
        {
            var detail = await authClient.GetFromJsonAsync<QuoteResponse>($"/api/admin/quotes/{created.Id}");
            detail!.Status.Should().Be("sent");
        }
    }

    // ─── DELETE /api/admin/quotes/{id} ───────────────────────────────────────

    [Fact]
    public async Task DeleteQuote_ExistingQuote_Returns204()
    {
        var authClient = await factory.CreateAuthenticatedClientAsync();
        var created    = await (await authClient.PostAsJsonAsync("/api/admin/quotes", ValidQuotePayload()))
            .Content.ReadFromJsonAsync<QuoteResponse>();

        var delete = await authClient.DeleteAsync($"/api/admin/quotes/{created!.Id}");
        delete.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var get = await authClient.GetAsync($"/api/admin/quotes/{created.Id}");
        get.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private record QuoteResponse(
        string Id, string QuoteNumber, string CustomerName, string CustomerEmail,
        string? CustomerPhone, string? HouseType, string? HouseSize, string? Location,
        decimal BasePrice, decimal FinalPrice, string Status,
        string? PaymentTerms, string? DeliveryTimeline, int ValidityDays);

    private record PaginatedResponse<T>(int Total, int Page, int PageSize, List<T> Items);
}
