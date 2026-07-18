using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.Data;
using WoodenHousesAPI.Services;

namespace WoodenHousesAPI.Tests.Unit;

/// <summary>
/// The agents were sending wrong quotes because the system prompt had no grounding
/// rules and no authoritative pricing. These tests lock in that every prompt the
/// agents receive (a) forbids inventing prices and (b) carries the boss's exact
/// figures, so a regression that drops either is caught immediately.
/// </summary>
public class AgentContextServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly AgentContextService _sut;

    public AgentContextServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _db  = new AppDbContext(options);
        _sut = new AgentContextService(_db);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task BuildSystemPrompt_IncludesGroundingRules()
    {
        var prompt = await _sut.BuildSystemPromptAsync("Trigger: Contact inquiry");

        prompt.Should().Contain("NEVER invent");
        prompt.Should().Contain("NEVER QUOTE BELOW");
        prompt.Should().Contain("site visit");
    }

    [Fact]
    public async Task BuildSystemPrompt_IncludesExactPricingForEveryHouseType()
    {
        var prompt = await _sut.BuildSystemPromptAsync("");

        // The boss's exact averages must be present verbatim so the agent quotes them.
        prompt.Should().Contain("1 Bedroom");
        prompt.Should().Contain("19,500");
        prompt.Should().Contain("2 Bedroom");
        prompt.Should().Contain("27,000");
        prompt.Should().Contain("3 Bedroom");
        prompt.Should().Contain("50,000");
        prompt.Should().Contain("4 Bedroom");
        prompt.Should().Contain("77,000");
        prompt.Should().Contain("5 Bedroom");
        prompt.Should().Contain("100,000");
    }

    [Fact]
    public async Task BuildSystemPrompt_IncludesTermiteAndLifespanFacts()
    {
        var prompt = await _sut.BuildSystemPromptAsync("");

        prompt.Should().Contain("termite");
        prompt.Should().Contain("70 and 100 years");
    }

    [Fact]
    public async Task BuildSystemPrompt_RulesComeBeforePricing()
    {
        var prompt = await _sut.BuildSystemPromptAsync("");

        // Grounding must frame the facts — rules first, then the numbers.
        prompt.IndexOf("# RULES", StringComparison.Ordinal)
            .Should().BeLessThan(prompt.IndexOf("19,500", StringComparison.Ordinal));
    }
}
