// AdventureEngine AppHost — local development orchestrator.
//
// Prerequisites (run once per developer machine):
//   dotnet dev-certs https --trust

using Aspire.Hosting;

var builder = DistributedApplication.CreateBuilder(args);

// Sprint 2 (item-004): API service registered for Aspire orchestration.
// The api resource appears in the Aspire dashboard at http://localhost:15128
// (see Properties/launchSettings.json for the dashboard port).
var api = builder.AddProject<Projects.AdventureEngine_Api>("api");

builder.Build().Run();
