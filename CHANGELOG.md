# Changelog

All notable changes to AdventureEngine are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions align with sprint milestones until the project reaches a public release.

---

## [Unreleased]

> Sprint 3 work begins here.

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
  rule, OpenAPI documentation requirement
- `apps/Api/packages.lock.json` — committed
- `apps/AppHost/AdventureEngine.AppHost.csproj` — `ProjectReference` to Api added (required
  for Aspire source-generated `Projects.AdventureEngine_Api` class)
- `apps/AppHost/Program.cs` — `builder.AddProject<Projects.AdventureEngine_Api>("api")` added
- `AdventureEngine.slnx` — Api project registered
- `.gitignore` — `!apps/Api/Properties/launchSettings.json` exception added
- `Directory.Packages.props` — added `Microsoft.AspNetCore.OpenApi=10.0.0`,
  `Scalar.AspNetCore=2.12.47`

#### item-006 — React Vite app with TypeScript, path aliases, ESLint, Prettier, Vitest

- `apps/web/` — React 19 + TypeScript + Vite 6 scaffold via `pnpm create vite`
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
| `AllowedHosts` | `"localhost"` in base config | Production deployments must override explicitly; `"*"` is too p
ermissive as a default |

---

### Known deferred items

- `minimatch@3.1.3` transitive CVE (GHSA-3ppc-4f35-3m26) via ESLint dependency chain --
  dev-only, low exploitability, but will need resolution before Sprint 5 CI pipeline is added.
  Track in `pnpm audit` output.

---

## [0.1.0] -- Sprint 1 . Foundation Layer . 2026-02-24

**Sprint goal:** Any developer can clone the repo, run `pnpm install` + `dotnet restore`, and
have a fully building, fully tested .NET solution with Aspire orchestration and the complete
DDD base-type library -- confirmed by `dotnet build` and `dotnet test` both exiting 0.

**Items delivered:** item-001 . item-002 . item-003 (6 story points)
**Tests:** 43 passing . 0 failing . Release mode

---

### Added

#### item-001 -- Monorepo scaffold

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
  xUnit 2.9.2 . `xunit.runner.visualstudio` 2.8.2 . `Microsoft.NET.Test.Sdk` 17.12.0 .
  FluentAssertions **6.12.2** (Apache 2.0 -- last permissive release) .
  NSubstitute 5.3.0 . `coverlet.collector` 6.0.2
- `AdventureEngine.slnx` solution file (`.slnx` format, .NET 10 default) containing all
  four projects
- `README.md` placeholder

#### item-002 -- SharedKernel DDD building blocks (`packages/SharedKernel/`)

- **`Entity<TId>`** -- abstract base for domain entities; identity-based equality using
  both `GetType()` and `Id` to prevent cross-type hash collisions; implements
  `IEquatable<Entity<TId>>`
- **`ValueObject`** -- abstract base for value objects; structural equality via
  `GetEqualityComponents()` using `HashCode.Add()` pattern
- **`AggregateRoot<TId>`** -- extends `Entity<TId>`; owns and raises domain events;
  implements `IDomainEventContainer`; `DomainEvents` caches the `ReadOnlyCollection<T>`
  wrapper (`??=`) and invalidates it on `ClearDomainEvents()`
- **`IDomainEvent`** -- plain marker interface (no MediatR); `Guid EventId` +
  `DateTimeOffset OccurredOn`; implementors should use `Guid.CreateVersion7()`
- **`IDomainEventContainer`** -- infrastructure-facing interface giving post-save dispatchers
  type-safe access to `DomainEvents` and `ClearDomainEvents()`
- **`IRepository<T, TId>`** -- generic repository interface with `GetByIdAsync`,
  `AddAsync`, `UpdateAsync`, `DeleteAsync`; intentionally has **no** `SaveChangesAsync`
- **`IUnitOfWork`** -- non-generic `Task<int> SaveChangesAsync(CancellationToken)`;
  decoupled from repositories to support multi-aggregate transactions
- **`Result<T>`** -- `sealed class` discriminated union; `IsSuccess` / `IsFailure` / `Value`
  / `Error`; `Match<TOut>()` (`[AggressiveInlining]`); implicit operators from `T` and `Error`
- **`Result`** -- non-generic variant for void operations; same shape as `Result<T>`
- **`Error`** -- `sealed record` with `Code`, `Message` (user-safe), `InternalDetail?`
  (log-only, must never reach API consumers); static factories `NotFound`, `Validation`,
  `Conflict`, `Unexpected` (defaults to `"An unexpected error occurred."`)
- **`AdventureEngine.SharedKernel.Tests`** -- xUnit 2.9.2 test project with 43 tests
  covering all base types; all tests pass in Release mode

#### item-003 -- Aspire AppHost + ServiceDefaults

- **`apps/AppHost/`** -- `AdventureEngine.AppHost.csproj` using `Aspire.AppHost.Sdk 13.1.1`
  as a NuGet secondary SDK (.NET 10 no longer requires workload installation)
- **`packages/ServiceDefaults/`** -- `AdventureEngine.ServiceDefaults.csproj` with
  `Extensions.cs` exposing: `AddServiceDefaults()`, `AddBasicServiceDefaults()`,
  `ConfigureOpenTelemetry()`, `AddDefaultHealthChecks()`, `MapDefaultEndpoints()`
- **`CONTRIBUTING.md`** -- prerequisites, setup, port table, test commands, conventions

---

### Fixed

- **Entity cross-type equality bug** -- fixed by including `GetType()` in both
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

[Unreleased]: https://github.com/your-org/adventure-engine/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/your-org/adventure-engine/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/your-org/adventure-engine/releases/tag/v0.1.0
