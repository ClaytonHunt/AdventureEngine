using System.IO.Compression;
using System.Text.Json;
using AdventureEngine.Api.Features.Cors;
using AdventureEngine.Api.Features.HealthCheck;
using AdventureEngine.ServiceDefaults;
using Microsoft.AspNetCore.ResponseCompression;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Wire Aspire service defaults: OpenTelemetry, health checks, service discovery, resilience.
// Decision-007: Uses AddServiceDefaults() (not AddBasicServiceDefaults()) because the API
// will make outbound service-to-service calls via Aspire service discovery.
builder.AddServiceDefaults();

// Register OpenAPI document generation (dev-only — avoids production memory overhead).
// Decision-002: Built-in .NET 10 OpenAPI with Scalar UI. No Swashbuckle.
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddOpenApi();
}

builder.Services.AddFrontendCors(builder.Configuration, builder.Environment);

builder.Services.ConfigureHttpJsonOptions(opts =>
    opts.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase);

builder.Services.AddProblemDetails();
builder.Services.AddSingleton<IHealthHandler, DefaultHealthHandler>();

builder.Services.AddResponseCompression(opts =>
{
    opts.EnableForHttps = false; // SECURITY: BREACH attack mitigation (CVE-2013-3587)
    opts.Providers.Add<BrotliCompressionProvider>();
    opts.Providers.Add<GzipCompressionProvider>();
    opts.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(
        ["application/json", "text/plain"]);
});

builder.Services.Configure<BrotliCompressionProviderOptions>(opts =>
    opts.Level = CompressionLevel.Fastest);

builder.Services.Configure<GzipCompressionProviderOptions>(opts =>
    opts.Level = CompressionLevel.Fastest);

var app = builder.Build();

app.Services.GetRequiredService<ICorsStartupValidator>()
    .Validate(app.Logger);

// Redirect HTTP → HTTPS before any response is generated.
app.UseHttpsRedirection();

// item-015: Apply CORS policy before response compression to ensure CORS headers
// are present on all responses, including compressed ones.
app.UseCors("FrontendOrigins");

// SECURITY NOTE: Response compression + HTTPS is subject to the BREACH attack (CVE-2013-3587)
// when secrets are reflected in compressed responses alongside user-controlled input.
// EnableForHttps is false — compression is disabled over HTTPS to mitigate this risk.
// Review before enabling compression on authenticated endpoints.
// See: https://breachattack.com/
app.UseResponseCompression();

// Health check endpoints: /health/live and /health/ready
// Guarded by IsDevelopment() inside ServiceDefaults.MapDefaultEndpoints().
app.MapDefaultEndpoints();
app.MapHealthCheckEndpoint();

// Test-only endpoint used to assert CORS behavior remains independent from authorization.
// Do not expose outside non-production environments.
if (!app.Environment.IsProduction())
{
    app.MapGet("/secure-test", () => Results.Unauthorized())
        .WithName("SecureTest");
}

if (app.Environment.IsDevelopment())
{
    // OpenAPI document:  GET /openapi/v1.json
    app.MapOpenApi();

    // Scalar API reference UI:  GET /scalar/v1
    app.MapScalarApiReference(options =>
    {
        options.Title = "AdventureEngine API";
        options.Theme = ScalarTheme.Purple;
        options.DefaultHttpClient = new(ScalarTarget.Http, ScalarClient.HttpClient);
    });
}

app.Run();

// Required for WebApplicationFactory<Program> in integration tests
public partial class Program { }
