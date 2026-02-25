namespace AdventureEngine.Api.Features.HealthCheck;

public static class HealthCheckEndpoint
{
    public static WebApplication MapHealthCheckEndpoint(this WebApplication app)
    {
        app.MapGet("/health", () => Results.Ok(new HealthResponse("healthy")))
           .WithName("HealthCheck")
           .WithTags("Health")
           .ExcludeFromDescription(); // Keep off OpenAPI/Scalar spec — not a public API contract
        return app;
    }
}
