using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OpenTelemetry;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;

namespace AdventureEngine.ServiceDefaults;

/// <summary>
/// Extension methods that wire up the standard cross-cutting concerns for every service:
/// OpenTelemetry (traces, metrics, logs), health checks, service discovery, and resilience.
/// <para>
/// Usage in each service's <c>Program.cs</c>:
/// <code>
/// builder.AddServiceDefaults();
/// // ...
/// app.MapDefaultEndpoints();
/// </code>
/// </para>
/// </summary>
public static class Extensions
{
    /// <summary>
    /// Adds standard service defaults: OpenTelemetry, health checks, service discovery,
    /// and HTTP client resilience handlers.
    /// </summary>
    public static IHostApplicationBuilder AddServiceDefaults(this IHostApplicationBuilder builder)
    {
        builder.AddBasicServiceDefaults();

        builder.Services.AddServiceDiscovery();

        builder.Services.ConfigureHttpClientDefaults(http =>
        {
            http.AddStandardResilienceHandler();
            http.AddServiceDiscovery();
        });

        return builder;
    }

    /// <summary>
    /// Adds health checks and OpenTelemetry without service discovery or resilience.
    /// Use this for services that do not make outbound HTTP calls.
    /// </summary>
    public static IHostApplicationBuilder AddBasicServiceDefaults(this IHostApplicationBuilder builder)
    {
        builder.AddDefaultHealthChecks();
        builder.ConfigureOpenTelemetry();
        return builder;
    }

    /// <summary>
    /// Configures OpenTelemetry for traces, metrics, and structured logs.
    /// Exports via OTLP when <c>OTEL_EXPORTER_OTLP_ENDPOINT</c> is set.
    /// </summary>
    public static IHostApplicationBuilder ConfigureOpenTelemetry(this IHostApplicationBuilder builder)
    {
        builder.Logging.AddOpenTelemetry(logging =>
        {
            logging.IncludeFormattedMessage = true;
            logging.IncludeScopes = true;
        });

        builder.Services.AddOpenTelemetry()
            .WithMetrics(metrics =>
            {
                metrics
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation()
                    .AddRuntimeInstrumentation();
            })
            .WithTracing(tracing =>
            {
                tracing
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation();
            });

        builder.AddOpenTelemetryExporters();
        return builder;
    }

    private static IHostApplicationBuilder AddOpenTelemetryExporters(this IHostApplicationBuilder builder)
    {
        var useOtlpExporter = !string.IsNullOrWhiteSpace(
            builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"]);

        if (useOtlpExporter)
        {
            builder.Services.AddOpenTelemetry().UseOtlpExporter();
        }

        return builder;
    }

    /// <summary>
    /// Registers a liveness health check tagged "live".
    /// </summary>
    public static IHostApplicationBuilder AddDefaultHealthChecks(this IHostApplicationBuilder builder)
    {
        builder.Services.AddHealthChecks()
            .AddCheck("self", () => HealthCheckResult.Healthy(), ["live"]);

        return builder;
    }

    /// <summary>
    /// Maps <c>/health/live</c> and <c>/health/ready</c> endpoints.
    /// Endpoints are only exposed in the Development environment.
    /// </summary>
    public static WebApplication MapDefaultEndpoints(this WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.MapHealthChecks("/health/live", new HealthCheckOptions
            {
                Predicate = check => check.Tags.Contains("live")
            });

            app.MapHealthChecks("/health/ready", new HealthCheckOptions
            {
                Predicate = check => check.Tags.Contains("ready")
            });
        }

        return app;
    }
}
