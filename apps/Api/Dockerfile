# syntax=docker/dockerfile:1.7

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and restore inputs first to maximize cache hits.
COPY Directory.Build.props ./
COPY Directory.Packages.props ./
COPY AdventureEngine.slnx ./
COPY apps/Api/AdventureEngine.Api.csproj apps/Api/
COPY packages/SharedKernel/AdventureEngine.SharedKernel.csproj packages/SharedKernel/
COPY packages/ServiceDefaults/AdventureEngine.ServiceDefaults.csproj packages/ServiceDefaults/

RUN dotnet restore apps/Api/AdventureEngine.Api.csproj --locked-mode

# Copy the rest of source after restore layer.
COPY apps/Api/ apps/Api/
COPY packages/SharedKernel/ packages/SharedKernel/
COPY packages/ServiceDefaults/ packages/ServiceDefaults/

RUN dotnet publish apps/Api/AdventureEngine.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_HTTP_PORTS=8080 \
    ASPNETCORE_ENVIRONMENT=Development

EXPOSE 8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "AdventureEngine.Api.dll"]
