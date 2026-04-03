namespace WoodenHousesAPI.Tests.Integration.Helpers;

/// <summary>
/// Declares the "Integration" collection so xUnit shares ONE
/// TestWebApplicationFactory (and ONE PostgreSQL container) across all
/// integration test classes instead of spinning up a new instance per class.
///
/// Test classes opt in with [Collection("Integration")] — they must NOT
/// also implement IClassFixture&lt;TestWebApplicationFactory&gt;; the primary
/// constructor parameter is injected by the collection fixture automatically.
/// </summary>
[CollectionDefinition("Integration")]
public class IntegrationCollection : ICollectionFixture<TestWebApplicationFactory>
{
    // No members needed — xUnit discovers this class via the attributes.
}
