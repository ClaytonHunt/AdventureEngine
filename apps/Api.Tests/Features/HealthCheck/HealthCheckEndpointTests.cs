using System.Net;
using System.Net.Http.Json;
using AdventureEngine.Api.Features.HealthCheck;
using Microsoft.AspNetCore.Mvc.Testing;

namespace AdventureEngine.Api.Tests.Features.HealthCheck;

public class HealthCheckEndpointTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    // ── Unit-style test: exercise the handler delegate directly ──────────────

    [Fact]
    public void HealthResponse_Record_HasExpectedStatus()
    {
        // Act — construct the response record directly, no HTTP stack
        var response = new HealthResponse("healthy");

        // Assert
        Assert.Equal("healthy", response.Status);
    }

    // ── Integration tests: full HTTP pipeline via WebApplicationFactory ──────

    [Fact]
    public async Task GetHealth_Returns200Ok()
    {
        // Arrange
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/health");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetHealth_ReturnsJsonContentType()
    {
        // Arrange
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/health");

        // Assert
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task GetHealth_ReturnsHealthyStatusInBody()
    {
        // Arrange
        var client = factory.CreateClient();

        // Act
        var result = await client.GetFromJsonAsync<HealthResponse>("/health");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("healthy", result.Status);
    }

    [Fact]
    public async Task GetHealth_ReturnsExactCamelCaseJsonBody()
    {
        // Arrange
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/health");
        var body = await response.Content.ReadAsStringAsync();

        // Assert — verifies global JsonNamingPolicy.CamelCase is in effect
        Assert.Equal("{\"status\":\"healthy\"}", body);
    }
}
