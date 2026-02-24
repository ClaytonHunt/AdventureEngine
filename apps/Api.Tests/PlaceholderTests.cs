using FluentAssertions;

namespace AdventureEngine.Api.Tests;

/// <summary>
/// Placeholder test class — verifies the test project is wired correctly.
/// Real integration tests using WebApplicationFactory are added in item-005 (Sprint 3).
/// </summary>
public sealed class PlaceholderTests
{
    [Fact]
    public void TestProject_IsWiredCorrectly()
    {
        // Arrange & Act — trivial assertion to prove the pipeline works
        var result = 1 + 1;

        // Assert
        result.Should().Be(2, because: "the test project is wired correctly");
    }
}
