# Sprint 2 Grooming Summary — AdventureEngine

> **Audience:** Development team — read this before sprint planning.
> **Status:** ✅ Grooming complete — backlog is healthy and ready for sprint planning.
> **Groomed:** 2026-02-24 | Authoritative item data: `.pi/chronicle/backlog.json`

---

## 1. Sprint 2 Goal

> **Establish the backend API surface and React frontend scaffold so that both tracks have a running, tested starting point — and the Aspire dashboard shows a live, registered API service alongside the React dev server.**

**Done means:**
- `dotnet run --project apps/AppHost` shows the `api` resource in the Aspire dashboard
- `GET /scalar/v1` renders the Scalar OpenAPI UI
- `apps/web/` exists with TypeScript + ESLint + Prettier all passing
- `pnpm test`, `pnpm test:api`, and `pnpm build` (for the web app) all exit 0

---

## 2. Selected Items

**Capacity:** 6 effective story points (8 raw × 0.75 focus factor)
**Committed:** 3 items · 6 story points · exactly at capacity

| ID | Title | Pts | Priority | Dependencies |
|---|---|---|---|---|
| **item-014** | Scaffold Api.Tests xUnit project and wire to solution | 2 | Critical | item-002 ✅, item-003 ✅ |
| **item-004** | Scaffold ASP.NET Core Web API wired to Aspire with OpenAPI | 2 | High | item-002 ✅, item-003 ✅ |
| **item-006** | Scaffold React Vite app with TypeScript, ESLint, and Prettier | 2 | High | item-001 ✅ |

All three items are unblocked — Sprint 1 dependencies are fully satisfied.

---

### item-014 — Scaffold Api.Tests xUnit project and wire to solution

**What it is:** Create `apps/Api.Tests/AdventureEngine.Api.Tests.csproj`, wired with xUnit, FluentAssertions, NSubstitute, and `Microsoft.AspNetCore.Mvc.Testing`. Add to `AdventureEngine.slnx`. Confirm `dotnet test` discovers and passes a placeholder test.

> **Scope boundary (Decision-009, Decision-010):** `packages/SharedKernel.Tests/` (43 tests) was delivered in Sprint 1 and is NOT recreated here. This item also does NOT add a `ProjectReference` to `apps/Api` — that wiring belongs to item-005 (Sprint 3), once the Api project exists and is merged.

**Acceptance criteria summary:**
1. `AdventureEngine.Api.Tests.csproj` references `xunit`, `FluentAssertions`, `NSubstitute`, and `Microsoft.AspNetCore.Mvc.Testing` — all versions sourced from `Directory.Packages.props`.
2. `Microsoft.AspNetCore.Mvc.Testing` is added to `Directory.Packages.props` before the project is created.
3. Project is added to `AdventureEngine.slnx`; `dotnet test AdventureEngine.slnx` runs it alongside `SharedKernel.Tests` — both pass, exit 0.
4. A placeholder `[Fact]` passes using FluentAssertions (e.g. `(1 + 1).Should().Be(2)`).
5. `Api.Tests` has no EF Core, database drivers, or infrastructure package references.
6. `pnpm test:api` at the repo root invokes the test run and exit code propagates correctly — **note:** the live script uses `--no-build`, so `dotnet build AdventureEngine.slnx` must be run first.

---

### item-004 — Scaffold ASP.NET Core Web API wired to Aspire with OpenAPI

**What it is:** Create `apps/Api/AdventureEngine.Api.csproj` as an ASP.NET Core Minimal API targeting `net10.0`. Register it in the Aspire AppHost. Configure ServiceDefaults, built-in .NET 10 OpenAPI (`AddOpenApi()` / `MapOpenApi()`), and Scalar UI. Add a `Features/` folder with a `README.md` documenting the VSA slice convention.

> **Decision-002:** Built-in .NET 10 OpenAPI with Scalar UI — no Swashbuckle.
> **Decision-007:** Registration in AppHost via `builder.AddProject<Projects.AdventureEngine_Api>("api")` — NuGet SDK, no workload.

**Acceptance criteria summary:**
1. `apps/Api/AdventureEngine.Api.csproj` exists, targets `net10.0`, references `SharedKernel` and `ServiceDefaults`, and is added to `AdventureEngine.slnx`.
2. `apps/AppHost/Program.cs` registers the API; the Aspire dashboard shows the `api` resource.
3. `apps/Api/Program.cs` calls `AddServiceDefaults()`, `AddOpenApi()`, `MapOpenApi()`, and `MapDefaultEndpoints()`.
4. `GET /scalar/v1` renders the Scalar UI in Development mode — Swashbuckle is NOT referenced.
5. `dotnet build AdventureEngine.slnx` produces zero errors and zero warnings.
6. `dotnet run --project apps/Api` starts independently and `GET /health/live` returns HTTP 200.
7. `apps/Api/Features/README.md` exists and documents the VSA slice convention.
8. `Microsoft.AspNetCore.OpenApi` and the Scalar package are added to `Directory.Packages.props`.

> ⚠️ **Risk:** Exact Scalar package name is uncertain for .NET 10. Check NuGet.org for `Scalar.AspNetCore` before starting — fall back to `Microsoft.AspNetCore.Scalar` if unavailable.

---

### item-006 — Scaffold React Vite app with TypeScript, ESLint, and Prettier

**What it is:** Bootstrap `apps/web/` using `pnpm create vite` (React-TS template). Configure `@/` path aliases in both `vite.config.ts` and `tsconfig.json`. Add ESLint (react-hooks + @typescript-eslint/recommended) and Prettier. Update root `package.json` `test` and `build` scripts from Sprint 1 echo placeholders to real commands.

**Acceptance criteria summary:**
1. `apps/web/` exists with `vite.config.ts`, `tsconfig.json`, `index.html`, and `src/main.tsx`.
2. `@/` alias resolves to `src/` in both Vite (runtime) and TypeScript (language server).
3. `pnpm --filter web lint` exits 0 on the freshly scaffolded codebase.
4. `pnpm --filter web build` produces a production bundle with zero TypeScript errors.
5. `pnpm --filter web dev` starts Vite at `http://localhost:5173`.
6. Root `package.json` `test` script updated from `echo` placeholder to `pnpm --filter web test --run`.
7. Root `package.json` `build` script updated from `echo` placeholder to `pnpm --filter web build` — `dotnet publish apps/Api` is intentionally omitted (added in item-010 once the full pipeline exists; Api may not be merged yet).

---

### Execution Order

Both backend items and the frontend item are independent and can be parallelised:

```
Sprint 2 — all items unblocked on Day 1

[Backend track]                  [Frontend track]
item-014 (Api.Tests scaffold)    item-006 (React Vite scaffold)
     ↓
item-004 (API + Aspire + OpenAPI)
```

**Single-developer order:** item-014 → item-004 → item-006

---

## 3. Key Decisions Made During Grooming

| # | Decision | Resolution |
|---|---|---|
| **006** | .NET version | **`net10.0`** — the only SDK on the build machine is 10.0.103; `global.json` pins it with `rollForward: latestPatch`. All projects target `net10.0`. |
| **007** | Aspire approach | **NuGet secondary SDK** (`Aspire.AppHost.Sdk 13.1.1`). The Aspire workload is deprecated in .NET 10. `dotnet workload install aspire` is NOT required. |
| **008** | Solution format | **`.slnx`** — the default format for `dotnet new sln` on .NET 10. All `dotnet test` and `dotnet build` commands use `AdventureEngine.slnx`. |
| **009** | SharedKernel.Tests placement | **`packages/SharedKernel.Tests/`** delivered in Sprint 1 as part of item-002 (43 passing tests). item-014 scope reduced to `Api.Tests` only. |
| **010** | Api.Tests → Api project reference | **Deferred to Sprint 3 (item-005).** item-014 scaffolds the test project with a placeholder `[Fact]` only. The `ProjectReference` to `apps/Api` and the `WebApplicationFactory<Program>` test class are added in item-005, which depends on both item-004 and item-014. |

---

## 4. Review Pass — What Was Fixed

The following corrections were made to `.pi/chronicle/backlog.json` during the review gate:

1. **item-014 AC1 — removed premature Api project reference.** The original draft said the project "references the Api project." The Api project (item-004) may not be merged when item-014 runs; Decision-010 locked this deferral. AC1 now correctly states the project does NOT reference `apps/Api`.

2. **item-014 notes — `--no-build` risk documented.** The live `test:api` script in `package.json` uses `--no-build` for speed. Developers must run `dotnet build AdventureEngine.slnx` before executing `pnpm test:api`, or tests will run against stale binaries. This is called out explicitly in AC6.

3. **item-006 AC7 — `dotnet publish apps/Api` made conditional.** The original build script AC included `dotnet publish apps/Api` as part of the root `build` script update. Since item-004 (the Api project) may not be merged when item-006 completes, that half of the build script is deferred to item-010. The root `build` script after item-006 covers the frontend only.

4. **item-009 AC6 added — root `test:e2e` script update.** The root `test:e2e` script is an `echo` placeholder from Sprint 1. item-009 is now explicitly responsible for updating it to the real Playwright invocation, mirroring the pattern established by item-006 (test/build) and item-008 (storybook).

5. **item-008 AC6 added — root `storybook` script update.** Same pattern: root `storybook` script is an `echo` placeholder. item-008 is now explicitly responsible for updating it to `pnpm --filter web storybook`.

---

## 5. Sprint 3 Preview (Pending Backlog Queue)

Sprint 3 is fully unblocked once Sprint 2 closes. All three items below depend on Sprint 2 deliverables.

| ID | Title | Pts | Depends on |
|---|---|---|---|
| **item-005** | Health Check vertical slice with unit + integration tests | 3 | item-004 ✅ S2, item-014 ✅ S2 |
| **item-007** | Configure Vitest + React Testing Library with example test | 2 | item-006 ✅ S2 |
| **item-008** | Set up Storybook with baseline Button component + story | 2 | item-006 ✅ S2 |

**Sprint 3 total:** 7 points — slightly over the 6pt effective capacity. If Sprint 2 finishes with remaining capacity, consider pulling item-007 or item-008 into Sprint 2 (they are independent of the backend track and both unblock once item-006 is done).

**Sprint 3 goal:** Prove the full VSA round-trip — a backend slice with integration tests wired through WebApplicationFactory — and establish the frontend unit-test and component-catalogue toolchains.

### Full backlog roadmap

| Sprint | Items | Points | Focus |
|---|---|---|---|
| S1 ✅ | 3 | 6 | Monorepo foundation, .NET skeleton, Aspire scaffold |
| **S2** | **3** | **6** | API test harness, API scaffold, React scaffold |
| S3 | 3 | 7 | First VSA slice + integration tests, Vitest, Storybook |
| S4 | 3 | 5 | Playwright e2e, CORS, root orchestration scripts |
| S5 | 4 | 6 | `.env.example`, Docker Compose, GitHub Actions CI, README |
| **Total** | **16** | **30pt** | ~5 sprints at 6pt/sprint |

---

## 6. Non-Blocking Flags and Risks

### ⚠️ `project.json` references ".NET 9"
`project.json` at the repo root still describes the project as targeting .NET 9. The actual runtime is `net10.0` (Decision-006). This is a documentation inconsistency only — no code is affected. Should be corrected in a quick housekeeping commit outside the sprint items.

### ⚠️ Package gaps in `Directory.Packages.props`
Three NuGet packages are needed for Sprint 2 but not yet in the central package file:

| Package | Required for | Action |
|---|---|---|
| `Microsoft.AspNetCore.Mvc.Testing` | item-014 (Api.Tests) | Add to `Directory.Packages.props` when picking up item-014 |
| `Microsoft.AspNetCore.OpenApi` | item-004 (API project) | Add to `Directory.Packages.props` when picking up item-004 |
| `Scalar.AspNetCore` | item-004 (Scalar UI) | Verify exact name on NuGet.org first; fall back to `Microsoft.AspNetCore.Scalar` |

**Merge risk:** If item-014 and item-004 are worked in parallel branches, both branches will touch `Directory.Packages.props`. Mitigate by merging item-014 first — its package addition is a single line and reduces the conflict window.

### ⚠️ `--no-build` flag on `pnpm test:api`
The root `test:api` script runs `dotnet test AdventureEngine.slnx --no-build`. This is intentional for CI speed, but means a fresh `dotnet build AdventureEngine.slnx` must be run before calling `pnpm test:api` locally — otherwise tests execute against stale binaries. This is documented in item-014's notes and AC6.

### ℹ️ ESLint v9 flat config
If scaffolding `apps/web/` generates an ESLint v9 flat config (`eslint.config.js`), the configuration syntax differs from the legacy `.eslintrc.json` format. Both are valid — note the format used in item-006's notes so downstream contributors aren't surprised.

---

## Ready for Sprint Planning ✅

The Sprint 2 backlog is groomed, reviewed, and healthy:

- **16 items total** — 3 done, 3 in-sprint, 10 pending, 0 deferred, 0 blocked
- **All in-sprint items** have specific, testable acceptance criteria, correct size estimates, confirmed unblocked dependencies, and sufficient context for a developer to pick up immediately
- **All pending items** are correctly prioritised with no orphaned dependencies, no circular chains, and no duplicate coverage
- **5 decisions locked** during this grooming session (Decision-006 through Decision-010)
- **5 corrections applied** during the review gate

**Files:**
- `.pi/chronicle/backlog.json` — authoritative backlog (all 16 items, fully groomed)
- `SPRINT_2_PLAN.md` — Sprint 2 execution contract with detailed ACs, risks, and execution order
- `GROOMING_SUMMARY_SPRINT2.md` — this document

The team can proceed to sprint planning. The first commit of Sprint 2 should address the `Directory.Packages.props` package gaps before any project files are created.
