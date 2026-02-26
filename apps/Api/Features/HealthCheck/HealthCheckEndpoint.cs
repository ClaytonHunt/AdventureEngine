using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Net.Http.Headers;

namespace AdventureEngine.Api.Features.HealthCheck;

public interface IHealthHandler
{
    IResult Handle();
}

internal sealed class DefaultHealthHandler : IHealthHandler
{
    public IResult Handle()
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

public static class HealthCheckEndpoint
{
    private static IResult SafeHandle(IHealthHandler handler)
    {
        try
        {
            return handler.Handle();
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
        app.Services.GetRequiredService<IHealthHandler>();

        app.MapGet("/health", (IHealthHandler handler) => SafeHandle(handler))
           .WithName("HealthCheck")
           .WithTags("Health")
           .WithSummary("Lightweight liveness endpoint")
           .WithDescription("Returns a sanitized service health payload. No dependency checks are performed.")
           .Produces<HealthResponse>(StatusCodes.Status200OK, "application/json")
           .Produces<HealthResponse>(StatusCodes.Status503ServiceUnavailable, "application/json")
           .AddEndpointFilter(async (context, next) =>
           {
               var result = await next(context);
               var headers = context.HttpContext.Response.Headers;
               headers[HeaderNames.CacheControl] = "no-store, no-cache, max-age=0";
               headers[HeaderNames.Pragma] = "no-cache";
               headers[HeaderNames.Expires] = "0";
               return result;
           });

        return app;
    }
}
