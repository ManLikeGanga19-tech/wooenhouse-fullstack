using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using WoodenHousesAPI.Pricing;

namespace WoodenHousesAPI.Controllers;

/// <summary>
/// PUBLIC endpoint — house types, average prices, and build times for the
/// contact-page price estimator. Reads from the single <see cref="HousePricing"/>
/// source so the marketing site and the AI agents can never quote different numbers.
/// </summary>
[ApiController]
[Route("api/house-types")]
[EnableRateLimiting("standard")]
public class HouseTypesController(IConfiguration config) : ControllerBase
{
    [HttpGet]
    public IActionResult GetAll()
    {
        var usdToKes = config.GetValue<decimal?>("Pricing:UsdToKes") ?? HousePricing.DefaultUsdToKes;

        return Ok(new
        {
            currency = "USD",
            usdToKes,
            note = "Average estimate, depending on size and finishes. Final quote confirmed after a free site visit.",
            types = HousePricing.Types.Select(t => new
            {
                t.Bedrooms,
                t.Label,
                t.AveragePriceUsd,
                t.BuildTime,
            }),
        });
    }
}
