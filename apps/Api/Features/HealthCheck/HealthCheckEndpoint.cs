using Microsoft.AspNetCore.Http.HttpResults;

namespace AdventureEngine.Api.Features.HealthCheck;

public static class HealthCheckEndpoint
{
    private static readonly Func<IResult> DefaultHandler = Handle;
    public static Func<IResult> HandlerOverride { get; set; } = DefaultHandler;

    public static void ResetHandlerOverride() => HandlerOverride = DefaultHandler;

    private static IResult SafeHandle()
    {
        try
        {
            return HandlerOverride();
        }
        catch
        {
            return TypedResults.Json(
                new HealthResponse("unhealthy"),
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    }

    public static WebApplication MapHealthCheckEndpoint(this WebApplication app)
    {
        app.MapGet("/health", SafeHandle)
           .WithName("HealthCheck")
           .WithTags("Health")
           .WithSummary("Lightweight liveness endpoint")
           .WithDescription("Returns a sanitized service health payload. No dependency checks are performed.")
           .Produces<HealthResponse>(StatusCodes.Status200OK, "application/json")
           .Produces<HealthResponse>(StatusCodes.Status503ServiceUnavailable, "application/json");

        return app;
    }

    internal static IResult Handle()
    {
        try
        {
            return TypedResults.Ok(new HealthResponse("healthy"));
        }
        catch
        {
            return TypedResults.Json(
                new HealthResponse("unhealthy"),
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    }
}
