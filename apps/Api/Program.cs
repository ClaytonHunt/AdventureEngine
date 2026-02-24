using AdventureEngine.ServiceDefaults;
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

// TODO item-015 (Sprint 4): Add CORS policy here.
// NEVER use AllowAnyOrigin() in production.
// builder.Services.AddCors(options =>
//     options.AddPolicy("ReactDevServer", policy =>
//         policy.WithOrigins("http://localhost:5173")
//               .AllowAnyMethod()
//               .AllowAnyHeader()));

var app = builder.Build();

// Redirect HTTP → HTTPS before any response is generated.
app.UseHttpsRedirection();

// TODO Sprint 3: app.UseResponseCompression(); — add here, before endpoint mapping.

// Health check endpoints: /health/live and /health/ready
// Guarded by IsDevelopment() inside ServiceDefaults.MapDefaultEndpoints().
app.MapDefaultEndpoints();

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
