namespace WoodenHousesAPI.Pricing;

/// <summary>
/// THE single source of truth for wooden-house pricing and specifications.
///
/// Consumed by BOTH:
///   • the public price estimator (HouseTypesController → contact page), and
///   • the AI agents (AgentContextService → system prompt).
/// Update the numbers HERE and both the marketing site and the agents stay in sync.
///
/// Prices are the business owner's stated AVERAGE prices in USD, "depending on size
/// and finishes". They are NOT firm quotes — the calculator presents them as "from"
/// estimates and routes to a free site visit for the final figure. Never under-quote.
/// </summary>
public static class HousePricing
{
    /// <summary>
    /// Indicative USD→KES rate, used ONLY to show an approximate KES figure alongside
    /// the authoritative USD price. Override in configuration via "Pricing:UsdToKes".
    /// </summary>
    public const decimal DefaultUsdToKes = 130m;

    public const string Lifespan =
        "A properly built wooden house lasts between 70 and 100 years.";

    public const string TermiteTreatment =
        "All timber is treated against termites, with a secondary ground treatment applied before house assembly.";

    public static readonly IReadOnlyList<HouseType> Types =
    [
        new(Bedrooms: 1, Label: "1 Bedroom", AveragePriceUsd:  19_500, BuildTime: "2 weeks"),
        new(Bedrooms: 2, Label: "2 Bedroom", AveragePriceUsd:  27_000, BuildTime: "1 month"),
        new(Bedrooms: 3, Label: "3 Bedroom", AveragePriceUsd:  50_000, BuildTime: "2 months"),
        new(Bedrooms: 4, Label: "4 Bedroom", AveragePriceUsd:  77_000, BuildTime: "10 weeks"),
        new(Bedrooms: 5, Label: "5 Bedroom", AveragePriceUsd: 100_000, BuildTime: "3 months"),
    ];
}

/// <param name="Bedrooms">Number of bedrooms (the calculator's input key).</param>
/// <param name="Label">Human-readable label, e.g. "3 Bedroom".</param>
/// <param name="AveragePriceUsd">Average price in USD, depending on size and finishes.</param>
/// <param name="BuildTime">Typical time to build.</param>
public record HouseType(int Bedrooms, string Label, int AveragePriceUsd, string BuildTime);
