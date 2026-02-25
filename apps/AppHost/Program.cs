// AdventureEngine AppHost — local development orchestrator.
//
// Prerequisites (run once per developer machine):
//   dotnet dev-certs https --trust

using Aspire.Hosting;
using Microsoft.Extensions.Hosting;

var builder = DistributedApplication.CreateBuilder(args);

// Sprint 2 (item-004): API service registered for Aspire orchestration.
// The api resource appears in the Aspire dashboard at http://localhost:15128
// (see Properties/launchSettings.json for the dashboard port).
var api = builder.AddProject<Projects.AdventureEngine_Api>("api");

// item-019: Register the React/Vite web app for local development only.
// In production the web app is served from a CDN or static host — not via Aspire.
// AddViteApp uses Aspire.Hosting.JavaScript 13.1.1 (the .NET 10-era replacement for
// the deprecated Aspire.Hosting.NodeJs package).
if (builder.Environment.IsDevelopment())
{
    builder.AddViteApp("web", "../../apps/web")
           .WithPnpm()
           .WithReference(api)
           .WaitFor(api)
           .WithExternalHttpEndpoints();
}

builder.Build().Run();
