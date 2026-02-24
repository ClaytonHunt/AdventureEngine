// AdventureEngine AppHost — local development orchestrator.
//
// Sprint 1: No services registered yet.
// Sprint 2 (item-004): Add the API project here:
//   builder.AddProject<Projects.AdventureEngine_Api>("api");
//
// Prerequisites (run once per developer machine):
//   dotnet dev-certs https --trust

using Aspire.Hosting;

var builder = DistributedApplication.CreateBuilder(args);

builder.Build().Run();
