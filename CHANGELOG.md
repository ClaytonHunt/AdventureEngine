# Changelog

All notable changes to AdventureEngine are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions align with sprint milestones until the project reaches a public release.

---

## [Unreleased]

> Sprint 4 work begins here.

---

## [0.3.0] — Sprint 3 · Health Check VSA Slice · RTL Test Harness · Response Compression · 2026-02-25

**Sprint goal:** Establish the first full-stack test foundation — a tested API health slice proving
the VSA pattern end-to-end, a verified React component test harness, and a production-ready
response compression middleware.

**Commit:** `52ef37d`
**Items delivered:** item-005 · item-007 · item-017 (6 story points)
**Tests:** 51 passing · 0 failing (43 SharedKernel + 5 Api.Tests + 3 web)

---

### Added

#### item-005 — Health Check VSA slice (`apps/Api/Features/HealthCheck/`)

- `apps/Api/Features/HealthCheck/HealthResponse.cs` — `record HealthResponse(string Status)`;
  positional record serialized to camelCase JSON by the global `JsonNamingPolicy.CamelCase`
  policy; no `[JsonPropertyName]` attributes needed
- `apps/Api/Features/HealthCheck/HealthCheckEndpoint.cs` — `MapHealthCheckEndpoint()` static
  extension method on `WebApplication`; registers `GET /health` → `200 {"status":"healthy"}`;
  `.ExcludeFromDescription()` keeps the endpoint off the OpenAPI/Scalar spec (not a public
  API contract); `.WithName("HealthCheck")`, `.WithTags("Health")`
- `apps/Api/Program.cs` — `app.MapHealthCheckEndpoint()` called after Scalar/OpenAPI
  endpoint mapping; `public partial class Program {}` appended to enable
  `WebApplicationFactory<Program>` in integration tests
- `apps/Api.Tests/Features/HealthCheck/HealthCheckEndpointTests.cs` — 5 tests:
  1. `HealthResponse_Record_HasExpectedStatus` — unit-style: verifies record shape directly
     (no HTTP stack)
  2. `GetHealth_Returns200Ok` — integration: asserts HTTP 200
  3. `GetHealth_ReturnsJsonContentType` — integration: asserts `Content-Type: application/json`
  4. `GetHealth_ReturnsHealthyStatusInBody` — integration: deserialises body to `HealthResponse`
     and asserts `Status == "healthy"`
  5. `GetHealth_ReturnsExactCamelCaseJsonBody` — integration: asserts raw JSON wire format is
     `{"status":"healthy"}` (guards against camelCase policy regression)
- `apps/Api.Tests/AdventureEngine.Api.Tests.csproj` — `<ProjectReference>` to
  `apps/Api/AdventureEngine.Api.csproj` added; enables `WebApplicationFactory<Program>`
- `apps/Api.Tests/packages.lock.json` — regenerated after `ProjectReference` addition
  (`dotnet restore` run and committed)
- `apps/Api.Tests/PlaceholderTests.cs` — **deleted** (superseded by real integration tests)
- `WebApplicationFactory<Program>` wired via shared `IClassFixture` — no state
  side-effects on `/health`, so factory is safely shared across tests in the class

#### item-007 — Vitest + React Testing Library (`apps/web/`)

- `apps/web/src/setupTests.ts` — triple-slash jest-dom type reference +
  `import '@testing-library/jest-dom'`; no manual cleanup (RTL handles it automatically
  when `globals: true` is set)
- `apps/web/src/App.test.tsx` — 3 component tests colocated with `App.tsx`:
  1. `renders without crashing` — smoke test; a render error surfaces here immediately
  2. `displays the product name heading` — asserts `<h1>` contains `AdventureEngine`
  3. `has the expected landmark regions` — asserts `banner`, `main`, and `contentinfo`
     ARIA roles are present (structural landmark test; durable even as content changes)
- `apps/web/vitest.config.ts` — `setupFiles: ['./src/setupTests.ts']` added to `test` block;
  `coverage` block added: provider `v8`, reporters `['text', 'lcov']`,
  `reportsDirectory: './coverage'`
- `apps/web/package.json` — devDependencies added:
  `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`,
  `@vitest/coverage-v8@3.2.4`; new scripts:
  `test:watch: "vitest"` (dev watch mode),
  `test:coverage: "vitest run --coverage"` (explicit coverage run, CI-safe)
- `pnpm-lock.yaml` — updated for 4 new devDependencies

#### item-017 — Response Compression middleware (`apps/Api/Program.cs`)

- `builder.Services.AddResponseCompression()` registered before `builder.Build()`:
  - Brotli provider (`BrotliCompressionProvider`) at `CompressionLevel.Fastest`
  - Gzip provider (`GzipCompressionProvider`) at `CompressionLevel.Fastest`
  - `EnableForHttps = false` — explicit BREACH attack mitigation (see Security note below)
  - `MimeTypes` extended via `ResponseCompressionDefaults.MimeTypes.Concat(...)` (not
    replaced) with `"application/json"` and `"text/plain"`
- `app.UseResponseCompression()` placed in middleware pipeline after `UseHttpsRedirection()`,
  before `MapDefaultEndpoints()` — at the `// TODO Sprint 3` marker position
- `builder.Services.ConfigureHttpJsonOptions()` — global `JsonNamingPolicy.CamelCase`
  policy applied to all Minimal API JSON responses (no per-endpoint serializer config needed)

#### Cross-cutting

- `packages/ServiceDefaults/Extensions.cs` — OpenTelemetry trace filter updated from
  exact-path match to `!ctx.Request.Path.StartsWithSegments("/health")`;
  now covers `/health`, `/health/live`, and `/health/ready` — suppresses high-frequency
  load balancer probe noise from distributed traces
- `.gitignore` — `coverage/` output directory added to exclusions (prevents accidental
  commit of V8 coverage artefacts from `pnpm test:coverage`)

---

### Changed

- `apps/Api/Program.cs` — `// TODO Sprint 3: app.UseResponseCompression()` placeholder
  replaced with the full implementation and a BREACH mitigation comment block

---

### Fixed

- **`Api.Tests` had no `ProjectReference` to `Api`** — `WebApplicationFactory<Program>` could
  not compile; fixed by adding `<ProjectReference Include="../../apps/Api/AdventureEngine.Api.csproj" />`
  and running `dotnet restore` to regenerate `packages.lock.json`
- **`HealthResponse` JSON serialised as PascalCase** — without an explicit naming policy,
  `{"Status":"healthy"}` would have been the wire format; fixed by adding a global
  `JsonNamingPolicy.CamelCase` via `ConfigureHttpJsonOptions`; wire format is now
  `{"status":"healthy"}`, verified by a dedicated raw-body assertion test
- **OTel filter only excluded exact `/health` path** — `/health/live` and `/health/ready`
  (Aspire's liveness and readiness probes) were still generating trace entries; fixed by
  switching from exact-path equality to `StartsWithSegments("/health")`

---

### Security

- **BREACH attack mitigation (CVE-2013-3587):** Response compression + HTTPS is subject to
  the BREACH timing attack when user-controlled input is reflected alongside secrets in
  compressed responses. `EnableForHttps = false` disables compression over HTTPS.
  This setting **must be reviewed before enabling compression on authenticated endpoints**
  that reflect user input. See: https://breachattack.com/
- **Health endpoint excluded from OpenAPI spec:** `GET /health` is not a public API contract;
  `.ExcludeFromDescription()` prevents it from appearing in generated OpenAPI JSON or the
  Scalar UI

---

### Performance notes

- **Compression does not engage on `/health`:** The response body (`{"status":"healthy"}`) is
  ~20 bytes — below the ASP.NET Core default threshold of 150 bytes. The compression
  middleware evaluates the response but does not compress it. No overhead beyond a single
  stream wrapper allocation per request, which is negligible.
- **`CompressionLevel.Fastest` for both providers:** Explicitly set to prevent future SDK
  default changes from silently upgrading compression intensity. At API response sizes,
  `Fastest` produces near-identical compression ratios to higher quality levels.
- **Coverage overhead measured at 10.9%:** `pnpm test:coverage` adds ~11% over the base
  test run (well within the predicted 20–40% budget). Acceptable at current suite size.
  Coverage runs are intended for CI only — use `pnpm test:watch` in dev.

---

### Technical decisions recorded

| Decision | Choice | Rationale |
|---|---|---|
| JSON naming policy | Global `JsonNamingPolicy.CamelCase` via `ConfigureHttpJsonOptions` | Applies uniformly to all Minimal API endpoints; no per-endpoint `[JsonPropertyName]` attributes needed |
| VSA endpoint registration | Pattern B — `MapHealthCheckEndpoint()` extension method | Keeps `Program.cs` clean; each slice owns its registration; scales to many slices without bloating the composition root |
| `HealthResponse` type | `record` | Immutable, value-equality, native `System.Text.Json` serialization support; no class boilerplate |
| No `HealthCheckHandler.cs` | Endpoint IS the handler | The `/health` handler is a one-liner; a separate handler class would be over-engineering for this slice |
| Coverage provider | `@vitest/coverage-v8` | V8 native coverage is the correct choice for a jsdom-environment Vitest suite; no instrumentation overhead at the test-file level |
| `EnableForHttps` | `false` | BREACH attack mitigation; reviewed and intentional |
| OTel filter pattern | `StartsWithSegments("/health")` | Covers all current and future `/health*` sub-paths in one pattern |

---

### Known deferred items

- **`application/json` + `text/plain` are already in `ResponseCompressionDefaults.MimeTypes`:**
  The `Concat()` in `Program.cs` adds these MIME types a second time. This is harmless (the
  framework deduplicates at match time) but misleading. A comment clarifying the overlap
  can be added in Sprint 4 as a low-priority clean-up alongside the CORS work (item-015).
- **Stale comment in `Api.Tests.csproj`:** A comment noting that the `ProjectReference` was
  deferred to Sprint 3 is now outdated (the reference has been added). Low-priority clean-up.
- **Redundant Vitest globals imports in `App.test.tsx`:** `describe`, `it`, `expect` are
  imported explicitly even though `globals: true` in `vitest.config.ts` already provides
  them. Harmless; the explicit imports are defensive and clearly document intent.
- **Security response headers (Sprint 4):** `Strict-Transport-Security`, `X-Content-Type-Options`,
  `X-Frame-Options` are not yet set. Tracked for Sprint 4 alongside the CORS item (item-015).
- **Rate limiting on `/health` (pre-production sprint):** The `/health` endpoint is public and
  unauthenticated. Rate limiting should be added before any pre-production exposure.
- **`minimatch@3.1.3` transitive CVE (GHSA-3ppc-4f35-3m26)** carried from Sprint 2 —
  must be resolved (item-018) before the GitHub Actions CI pipeline (item-016) is wired.

---

## [0.2.0] — Sprint 2 · API + Frontend Scaffold · 2026-02-24

**Sprint goal:** `dotnet run --project apps/AppHost` shows a live `api` resource in the Aspire
dashboard; `GET /scalar/v1` renders the Scalar OpenAPI UI; `apps/web/` exists with TypeScript +
ESLint + Prettier all passing; `pnpm test`, `pnpm test:api`, and `pnpm build` (web) all exit 0.

**Items delivered:** item-014 · item-004 · item-006 (6 story points)
**Tests:** 44 passing · 0 failing (43 SharedKernel + 1 Api.Tests placeholder)

---

### Added

#### item-014 — Api.Tests xUnit project scaffold

- `apps/Api.Tests/AdventureEngine.Api.Tests.csproj` — xUnit 2.x + FluentAssertions + NSubstitute
  + coverlet; `<FrameworkReference Include="Microsoft.AspNetCore.App" />` for future
  `WebApplicationFactory` wiring (Sprint 3 item-005)
- `apps/Api.Tests/PlaceholderTests.cs` — single `[Fact]` verifying the test project wires
  correctly; real integration tests added when `ProjectReference → Api` lands in Sprint 3
- `apps/Api.Tests/packages.lock.json` — committed per `RestorePackagesWithLockFile=true`
- `Directory.Packages.props` — added `Microsoft.AspNetCore.Mvc.Testing=10.0.0`
- **Decision-010 (locked):** Api.Tests does NOT yet reference `apps/Api` — deferred to
  item-005 (Sprint 3) to keep the scaffold free of circular-reference risk

#### item-004 — ASP.NET Core Web API wired to Aspire with OpenAPI

- `apps/Api/AdventureEngine.Api.csproj` — `Microsoft.NET.Sdk.Web`, references SharedKernel
  + ServiceDefaults; `Scalar.AspNetCore=2.12.47` + `Microsoft.AspNetCore.OpenApi=10.0.0`
- `apps/Api/Program.cs` — Minimal API with correct middleware order:
  1. `builder.AddServiceDefaults()` — OTel, health checks, service discovery, resilience
  2. `if (IsDevelopment) builder.Services.AddOpenApi()` — dev-only DI registration
  3. `app.UseHttpsRedirection()`
  4. `app.MapDefaultEndpoints()` — `/health/live`, `/health/ready` (dev only via ServiceDefaults)
  5. `if (IsDevelopment) { app.MapOpenApi(); app.MapScalarApiReference(ScalarOptions) }`
  - ScalarOptions: `Title="AdventureEngine API"`, `Theme=ScalarTheme.Purple`,
    `DefaultHttpClient=(ScalarTarget.Http, ScalarClient.HttpClient)`
  - CORS skeleton comment in place (Sprint 4 item-015)
  - `// TODO Sprint 3: app.UseResponseCompression()` placeholder
- `apps/Api/appsettings.json` — `AllowedHosts: "localhost"`, Logging defaults
- `apps/Api/Properties/launchSettings.json` — `ASPNETCORE_ENVIRONMENT=Development` in all
  profiles; committed via `.gitignore` negation exception (matches AppHost pattern)
- `apps/Api/Features/README.md` — Vertical Slice Architecture convention, composition root
  rule, OpenAPI documentation requirement, production AllowedHosts override note
- `apps/Api/packages.lock.json` — committed
- `apps/AppHost/AdventureEngine.AppHost.csproj` — `ProjectReference` to Api added (required
  for Aspire source-generated `Projects.AdventureEngine_Api` class)
- `apps/AppHost/Program.cs` — `builder.AddProject<Projects.AdventureEngine_Api>("api")` added
- `AdventureEngine.slnx` — Api project registered
- `.gitignore` — `!apps/Api/Properties/launchSettings.json` exception added
- `Directory.Packages.props` — added `Microsoft.AspNetCore.OpenApi=10.0.0`,
  `Scalar.AspNetCore=2.12.47`

#### item-006 — React Vite app with TypeScript, path aliases, ESLint, Prettier, Vitest

- `apps/web/` — React 19 + TypeScript + Vite scaffold via `pnpm create vite`
- `apps/web/tsconfig.app.json` — `strict: true`, path alias `@/*` → `./src/*`
- `apps/web/vite.config.ts` — `resolve.alias: { '@': path.resolve(__dirname, './src') }`
  (no `vite-plugin-eslint` — ESLint runs standalone only)
- `apps/web/vitest.config.ts` — `environment: jsdom`, `resolve.alias` at root scope (not
  inside `test:{}` — confirmed fix from red team review), `globals: true`
- `apps/web/eslint.config.js` — flat config (ESLint 9), `eslint-plugin-jsx-a11y` (recommended),
  `no-restricted-imports` rule enforcing `@/` alias over relative parent imports
- `apps/web/.prettierrc` — `semi: false`, `singleQuote: true`, `tabWidth: 2`,
  `trailingComma: "es5"`, `printWidth: 100`
- `apps/web/.prettierignore` — `dist/`, `node_modules/`, `*.lock`
- `apps/web/src/App.tsx` — branded placeholder replacing Vite counter demo; uses design tokens
- `apps/web/src/styles/tokens.css` — CSS custom properties: `--color-primary: #6366f1`,
  neutrals, typography, 8pt-grid spacing, shape, elevation tokens
- `apps/web/src/styles/reset.css` — minimal CSS reset (box-sizing, margin/padding zero)
- `apps/web/src/components/index.ts` — barrel stub (`export {}`)
- `apps/web/src/{features,hooks,pages}/.gitkeep` — folder structure established
- `apps/web/index.html` — `<title>AdventureEngine</title>`
- `apps/web/package.json` — `name: "web"`, scripts: `test: vitest run --passWithNoTests`,
  `build: vite build`, `lint: eslint .`; `eslint-plugin-jsx-a11y` in devDependencies
- `pnpm-lock.yaml` — updated with all `apps/web` workspace dependencies (~3,823 lines)
- Root `package.json` — `test` script → `pnpm --filter web test --run`;
  `build` script → `pnpm --filter web build`
- `.vscode/settings.json` — `editor.formatOnSave`, Prettier as default formatter,
  ESLint validate for ts/tsx

---

### Fixed

- **AppHost startup crash on `pnpm start`**: `launchSettings.json` was excluded by a blanket
  `.gitignore` rule, preventing Aspire from injecting the required `ASPNETCORE_URLS` and
  `ASPIRE_DASHBOARD_OTLP_ENDPOINT_URL` environment variables at runtime. Fixed by creating
  `apps/AppHost/Properties/launchSettings.json` and adding a targeted `.gitignore` negation
  exception for that path only. *(Sprint 1 hotfix, carried forward.)*
- **Vitest `resolve.alias` silently ignored**: alias was nested inside `test: {}` block in
  `vitest.config.ts`. Vitest's `InlineConfig` has no `resolve` property — the alias was
  discarded at runtime, causing `@/` imports in test files to fail. Moved `resolve: { alias }`
  to root scope of `defineConfig`.
- **`pnpm-lock.yaml` missing workspace dependencies**: initial `feat(web)` commit did not
  include the updated lockfile; `pnpm install --frozen-lockfile` would fail on a fresh clone.
  Committed the full 3,823-line workspace lockfile.
- **`AllowedHosts: "*"` in base `appsettings.json`**: replaced with `"localhost"` to prevent
  host-header injection / DNS rebinding in production deployments that forget to override
  the base config.
- **`index.html` title was `"web"`**: changed to `"AdventureEngine"` (was left as the Vite
  scaffold default).

---

### Technical decisions recorded

| Decision | Choice | Rationale |
|---|---|---|
| `Scalar.AspNetCore` version | **2.12.47** | `2.5.13` does not exist on NuGet.org; 2.12.47 is latest stable 2.x at time of sprint |
| Api.Tests → Api reference | **Deferred (Decision-010)** | Scaffold-only sprint; `WebApplicationFactory` wiring added in Sprint 3 item-005 |
| `AddOpenApi()` guard | `if (IsDevelopment)` on both DI registration and endpoint mapping | Prevents production memory overhead and avoids inadvertent schema exposure |
| `launchSettings.json` for Api | Committed via `.gitignore` negation | Ensures `ASPNETCORE_ENVIRONMENT=Development` for standalone `dotnet run`; matches AppHost convention |
| ESLint in Vite | Standalone `pnpm lint` script only | `vite-plugin-eslint` adds 50–300 ms per HMR cycle; not acceptable for inner dev loop |
| Vitest config | Separate `vitest.config.ts` | Avoids inheriting HMR-specific Vite plugins into the test runner |
| `UseResponseCompression()` | Deferred to Sprint 3 | Performance review and architecture review had conflicting placement guidance; deferred cleanly with TODO comment |
| CORS policy | Skeleton comment only | No frontend-to-API calls this sprint; full policy in Sprint 4 item-015 |
| `AllowedHosts` | `"localhost"` in base config | Production deployments must override explicitly; `"*"` is too permissive as a default |

---

### Known deferred items

- `minimatch@3.1.3` transitive CVE (GHSA-3ppc-4f35-3m26) via ESLint dependency chain —
  dev-only, low exploitability, but will need resolution before Sprint 5 CI pipeline is added.
  Track in `pnpm audit` output.
- `UseResponseCompression()` middleware — deferred with a `// TODO Sprint 3` comment in
  `apps/Api/Program.cs`; see item-017 in backlog.
- `AllowedHosts` production override — currently `"localhost"` in `appsettings.json`;
  production deployment must set the real hostname via environment variable or
  `appsettings.Production.json`; documented in `apps/Api/Features/README.md`.

---

## [0.1.0] — Sprint 1 · Foundation Layer · 2026-02-24

**Sprint goal:** Any developer can clone the repo, run `pnpm install` + `dotnet restore`, and
have a fully building, fully tested .NET solution with Aspire orchestration and the complete
DDD base-type library — confirmed by `dotnet build` and `dotnet test` both exiting 0.

**Items delivered:** item-001 · item-002 · item-003 (6 story points)
**Tests:** 43 passing · 0 failing · Release mode

---

### Added

#### item-001 — Monorepo scaffold

- `apps/` and `packages/` top-level workspace directories
- Root `package.json` with pnpm workspaces (`apps/*`, `packages/*`), `"private": true`,
  `"packageManager": "pnpm@10.17.0"`, and placeholder scripts:
  `start`, `test`, `test:e2e`, `test:api`, `storybook`, `build`
- `pnpm-workspace.yaml` declaring workspace globs
- `pnpm-lock.yaml` generated and committed (replaces deleted `package-lock.json`)
- `.gitignore` covering Node (`node_modules/`, `dist/`), .NET (`bin/`, `obj/`, `*.user`),
  Aspire (`.aspire/`), secrets (`appsettings.*.json`, `.env*`, `launchSettings.json`),
  editor artefacts (`.idea/`, `.vs/`), and macOS (`.DS_Store`)
- `.nvmrc` pinned to Node 22 LTS
- `.editorconfig` with consistent indent/charset/EOL rules across all file types
- `global.json` pinning .NET SDK `10.0.103` with `"rollForward": "latestPatch"`
  (allows security patches without manual lockfile updates)
- `Directory.Build.props` applying to all projects:
  `Nullable=enable`, `ImplicitUsings=enable`, `TreatWarningsAsErrors=true`,
  `LangVersion=latest`, `RestorePackagesWithLockFile=true`,
  `ManagePackageVersionsCentrally=true`
- `Directory.Packages.props` with Central Package Management (CPM), `NuGetAudit=true`,
  `NuGetAuditLevel=moderate`, and pinned test package versions:
  xUnit 2.9.2 · `xunit.runner.visualstudio` 2.8.2 · `Microsoft.NET.Test.Sdk` 17.12.0 ·
  FluentAssertions **6.12.2** (Apache 2.0 — last permissive release) ·
  NSubstitute 5.3.0 · `coverlet.collector` 6.0.2
- `AdventureEngine.slnx` solution file (`.slnx` format, .NET 10 default) containing all
  four projects
- `README.md` placeholder

#### item-002 — SharedKernel DDD building blocks (`packages/SharedKernel/`)

- **`Entity<TId>`** — abstract base for domain entities; identity-based equality using
  both `GetType()` and `Id` to prevent cross-type hash collisions; implements
  `IEquatable<Entity<TId>>`
- **`ValueObject`** — abstract base for value objects; structural equality via
  `GetEqualityComponents()` using `HashCode.Add()` pattern
- **`AggregateRoot<TId>`** — extends `Entity<TId>`; owns and raises domain events;
  implements `IDomainEventContainer`; `DomainEvents` caches the `ReadOnlyCollection<T>`
  wrapper (`??=`) and invalidates it on `ClearDomainEvents()`
- **`IDomainEvent`** — plain marker interface (no MediatR); `Guid EventId` +
  `DateTimeOffset OccurredOn`; implementors should use `Guid.CreateVersion7()`
- **`IDomainEventContainer`** — infrastructure-facing interface giving post-save dispatchers
  type-safe access to `DomainEvents` and `ClearDomainEvents()`
- **`IRepository<T, TId>`** — generic repository interface with `GetByIdAsync`,
  `AddAsync`, `UpdateAsync`, `DeleteAsync`; intentionally has **no** `SaveChangesAsync`
- **`IUnitOfWork`** — non-generic `Task<int> SaveChangesAsync(CancellationToken)`;
  decoupled from repositories to support multi-aggregate transactions
- **`Result<T>`** — `sealed class` discriminated union; `IsSuccess` / `IsFailure` / `Value`
  / `Error`; `Match<TOut>()` (`[AggressiveInlining]`); implicit operators from `T` and `Error`
- **`Result`** — non-generic variant for void operations; same shape as `Result<T>`
- **`Error`** — `sealed record` with `Code`, `Message` (user-safe), `InternalDetail?`
  (log-only, must never reach API consumers); static factories `NotFound`, `Validation`,
  `Conflict`, `Unexpected` (defaults to `"An unexpected error occurred."`)
- **`AdventureEngine.SharedKernel.Tests`** — xUnit 2.9.2 test project with 43 tests
  covering all base types; all tests pass in Release mode

#### item-003 — Aspire AppHost + ServiceDefaults

- **`apps/AppHost/`** — `AdventureEngine.AppHost.csproj` using `Aspire.AppHost.Sdk 13.1.1`
  as a NuGet secondary SDK (.NET 10 no longer requires workload installation)
- **`packages/ServiceDefaults/`** — `AdventureEngine.ServiceDefaults.csproj` with
  `Extensions.cs` exposing: `AddServiceDefaults()`, `AddBasicServiceDefaults()`,
  `ConfigureOpenTelemetry()`, `AddDefaultHealthChecks()`, `MapDefaultEndpoints()`
- **`CONTRIBUTING.md`** — prerequisites, setup, port table, test commands, conventions

---

### Fixed

- **Entity cross-type equality bug** — fixed by including `GetType()` in both
  `Equals()` and `GetHashCode()`. Three regression tests added.

---

### Technical decisions recorded

| Decision | Choice | Rationale |
|---|---|---|
| .NET version | **10.0.103** | Only .NET 10 SDK present |
| Aspire approach | NuGet secondary SDK (`Aspire.AppHost.Sdk`) | Workload deprecated in .NET 10 |
| Aspire version | **13.1.1** | v9.x blocked by `KubernetesClient` CVE in NuGetAudit |
| Solution format | `.slnx` | .NET 10 `dotnet new sln` default |
| FluentAssertions | **6.12.2** | Last Apache 2.0 release; v7+ changed license model |
| `IRepository` | No `SaveChangesAsync` | Split to `IUnitOfWork` for multi-aggregate transactions |
| `IDomainEvent` | Plain interface, no MediatR | `DateTimeOffset OccurredOn`, `Guid EventId` |
| `Error` record | `Message` + `InternalDetail?` | Prevents information disclosure |
| `Entity` equality | `GetType()` + `Id` in hash | Prevents cross-type collisions |

---

[Unreleased]: https://github.com/your-org/adventure-engine/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/your-org/adventure-engine/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/your-org/adventure-engine/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/your-org/adventure-engine/releases/tag/v0.1.0
