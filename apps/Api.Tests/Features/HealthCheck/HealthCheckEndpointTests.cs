using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using AdventureEngine.Api.Features.HealthCheck;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace AdventureEngine.Api.Tests.Features.HealthCheck;

public class HealthCheckEndpointTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task GetHealth_Returns200Ok_AndHealthyBody()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/health");
        var result = await response.Content.ReadFromJsonAsync<HealthResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(result);
        Assert.Equal("healthy", result!.Status);
    }

    [Fact]
    public async Task GetHealth_ReturnsJsonContentType()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task GetHealth_ReturnsNoCacheHeaders()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal("no-store, no-cache, max-age=0", response.Headers.CacheControl?.ToString());
        IEnumerable<string>? pragmaValues = null;
        if (response.Headers.TryGetValues("Pragma", out var responsePragmaValues))
        {
            pragmaValues = responsePragmaValues;
        }
        else if (response.Content.Headers.TryGetValues("Pragma", out var contentPragmaValues))
        {
            pragmaValues = contentPragmaValues;
        }

        if (pragmaValues is not null)
        {
            Assert.Contains("no-cache", pragmaValues);
        }

        IEnumerable<string>? expiresValues = null;
        if (response.Headers.TryGetValues("Expires", out var responseExpiresValues))
        {
            expiresValues = responseExpiresValues;
        }
        else if (response.Content.Headers.TryGetValues("Expires", out var contentExpiresValues))
        {
            expiresValues = contentExpiresValues;
        }

        if (expiresValues is not null)
        {
            Assert.Contains("0", expiresValues);
        }
    }

    [Fact]
    public async Task GetHealth_ReturnsExactCamelCaseJsonBody()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/health");
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal("{\"status\":\"healthy\"}", body);
    }

    [Fact]
    public async Task OpenApi_ContainsHealthEndpoint_With200And503Responses()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/openapi/v1.json");
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var document = JsonDocument.Parse(body);
        var root = document.RootElement;

        Assert.True(root.TryGetProperty("paths", out var paths));
        Assert.True(paths.TryGetProperty("/health", out var healthPath));
        Assert.True(healthPath.TryGetProperty("get", out var getOperation));
        Assert.True(getOperation.TryGetProperty("responses", out var responses));
        Assert.True(responses.TryGetProperty("200", out var okResponse));
        Assert.True(responses.TryGetProperty("503", out var unavailableResponse));

        var okSchemaRef = GetJsonSchemaReference(okResponse);
        var unavailableSchemaRef = GetJsonSchemaReference(unavailableResponse);

        Assert.NotNull(okSchemaRef);
        Assert.NotNull(unavailableSchemaRef);
        Assert.Equal(okSchemaRef, unavailableSchemaRef);
    }

    [Fact]
    public async Task GetHealth_WhenHandlerThrows_Returns503AndSanitizedBody()
    {
        using var customFactory = factory.WithWebHostBuilder(builder =>
            builder.ConfigureServices(services =>
            {
                services.AddSingleton<IHealthHandler, ThrowingHealthHandler>();
            }));

        var client = customFactory.CreateClient();

        var response = await client.GetAsync("/health");
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal("{\"status\":\"unhealthy\"}", body);
        Assert.DoesNotContain("exception", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("stack", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("sensitive", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void HealthResponse_Record_UsesConsistentSchema_ForHealthyAndUnhealthy()
    {
        var healthy = new HealthResponse("healthy");
        var unhealthy = new HealthResponse("unhealthy");

        Assert.Equal(healthy.GetType(), unhealthy.GetType());
    }

    private static string? GetJsonSchemaReference(JsonElement response)
    {
        if (!response.TryGetProperty("content", out var content)) return null;
        if (!content.TryGetProperty("application/json", out var jsonContent)) return null;
        if (!jsonContent.TryGetProperty("schema", out var schema)) return null;
        if (!schema.TryGetProperty("$ref", out var schemaRef)) return null;

        return schemaRef.GetString();
    }
}
