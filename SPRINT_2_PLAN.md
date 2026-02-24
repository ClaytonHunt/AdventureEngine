# Sprint 2 Plan — AdventureEngine

> **Single source of truth for Sprint 2.** Pin this to the team board.
> Last updated: 2026-02-24 | Generated at end of Sprint 2 grooming session.

---

## 1. Sprint Header

| Field | Value |
|---|---|
| **Sprint number** | 2 |
| **Dates** | Day 1 – Day 10 (2-week sprint) |
| **Capacity (raw)** | 8 story points |
| **Capacity (effective)** | 6 story points (8 × 0.75 focus factor) |
| **Team size** | 1–2 developers |
| **Sprint status** | 🟢 Groomed — items ready for sprint planning |

---

## 2. Sprint Goal

> **Establish the backend API surface and React frontend scaffold so that both tracks have a running, tested starting point — and the Aspire dashboard shows a live, registered API service alongside the React dev server.**

At the end of Sprint 2:
- `dotnet run --project apps/AppHost` shows the `api` resource in the Aspire dashboard
- `GET /scalar/v1` renders the Scalar API reference UI
- `apps/web/` exists with TypeScript + ESLint + Prettier passing
- `pnpm test`, `pnpm test:api`, and `pnpm build` (for the web app) all exit 0

---

## 3. Key Findings from Sprint 1 Retrospective

### What changed since the original Sprint 2 plan

| Finding | Impact |
|---|---|
| **SharedKernel.Tests was fully delivered in Sprint 1** (43 tests) | item-014 scope reduced from "two test projects" to "Api.Tests only" — still 2pt (WebApplicationFactory wiring adds complexity) |
| **Target framework is net10.0** (not net9.0 as originally specced) | item-004 acceptance criteria and package references updated for .NET 10 |
| **Aspire ships via NuGet SDK** (workload deprecated in .NET 10) | `dotnet workload install aspire` is no longer required; `Aspire.AppHost.Sdk` NuGet handles it |
| **Solution format is .slnx** (not .sln) | All `dotnet test` commands use `AdventureEngine.slnx` |
| **Root package.json scripts have `echo` placeholders** for `test`, `build`, `storybook`, `test:e2e` | item-006 AC6 added: the web scaffold must also update these placeholder scripts |
| **launchSettings.json bug was fixed** (was gitignored, causing AppHost crash) | No impact on Sprint 2 scope, but documented in CONTRIBUTING.md |
| **`Microsoft.AspNetCore.Mvc.Testing` not yet in Directory.Packages.props** | item-014 implementer must add this package before writing integration tests |
| **`Microsoft.AspNetCore.OpenApi` and Scalar not yet in Directory.Packages.props** | item-004 implementer must add these packages |

---

## 4. New Decisions Locked During Grooming

| # | Decision | Resolution | Items Updated |
|---|---|---|---|
| 6 | .NET version | **net10.0** — only SDK present is 10.0.103; `global.json` pins it | item-002, item-003, item-004, item-014 |
| 7 | Aspire approach | **NuGet secondary SDK** (`Aspire.AppHost.Sdk 13.1.1`) — workload deprecated in .NET 10; no `dotnet workload install aspire` needed | item-003, item-004 |
| 8 | Solution format | **.slnx** — default for `dotnet new sln` on .NET 10; all `dotnet test` commands use `AdventureEngine.slnx` | item-001 through item-014 |
| 9 | SharedKernel.Tests placement | **packages/SharedKernel.Tests/** — delivered in Sprint 1 as part of item-002; item-014 scope reduced to Api.Tests only | item-002, item-014 |

---

## 5. Selected Items

> **Total: 3 items · 6 story points · exactly at effective capacity**

---

### item-014 — Scaffold Api.Tests xUnit project and wire to solution

| Field | Value |
|---|---|
| **Points** | 2 |
| **Priority** | 4 (highest in Sprint 2 — must be done before item-005 in Sprint 3) |
| **Status** | `in-sprint` |
| **Tags** | `backend`, `testing`, `xunit`, `dx` |
| **Dependencies** | item-002 ✅ done · item-003 ✅ done |

**Description:**
Create `apps/Api.Tests/AdventureEngine.Api.Tests.csproj` as the xUnit test project for API-layer tests. Wire FluentAssertions, NSubstitute, and `Microsoft.AspNetCore.Mvc.Testing` for `WebApplicationFactory`-based integration tests. Add to `AdventureEngine.slnx`. Confirm `dotnet test` discovers and passes a placeholder test.

**Note:** `packages/SharedKernel.Tests/` with 43 tests was delivered in Sprint 1 as part of item-002 — this item does NOT recreate that project.

**Acceptance Criteria:**
- [ ] `apps/Api.Tests/AdventureEngine.Api.Tests.csproj` exists referencing `xunit`, `FluentAssertions`, `NSubstitute`, and `Microsoft.AspNetCore.Mvc.Testing` (all via `Directory.Packages.props`).
- [ ] `Api.Tests` is added to `AdventureEngine.slnx` and `dotnet test AdventureEngine.slnx` runs it alongside `SharedKernel.Tests` (both pass, exit 0).
- [ ] A placeholder `[Fact]` in `Api.Tests` passes using FluentAssertions (e.g. `1.Should().Be(1)`).
- [ ] `Api.Tests` does NOT reference EF Core, database drivers, or infrastructure packages.
- [ ] `pnpm test:api` at the repo root invokes `dotnet test AdventureEngine.slnx` and the exit code propagates correctly.
- [ ] `Microsoft.AspNetCore.Mvc.Testing` is added to `Directory.Packages.props` before the project is created.

---

### item-004 — Scaffold ASP.NET Core Web API wired to Aspire with OpenAPI

| Field | Value |
|---|---|
| **Points** | 2 |
| **Priority** | 5 |
| **Status** | `in-sprint` |
| **Tags** | `backend`, `dotnet`, `api`, `openapi`, `aspire` |
| **Dependencies** | item-002 ✅ done · item-003 ✅ done |

**Description:**
Create `apps/Api/AdventureEngine.Api.csproj` as an ASP.NET Core Minimal API project targeting `net10.0`. Register it in `AppHost` so it appears in the Aspire dashboard. Configure ServiceDefaults (OTel, health checks), built-in .NET 10 OpenAPI (`AddOpenApi()` / `MapOpenApi()`), and Scalar UI. Add a `Features/` folder as the home for all future VSA slices.

**Acceptance Criteria:**
- [ ] `apps/Api/AdventureEngine.Api.csproj` exists targeting `net10.0`, references `SharedKernel` and `ServiceDefaults`, and is added to `AdventureEngine.slnx`.
- [ ] `apps/AppHost/Program.cs` registers the API via `builder.AddProject<Projects.AdventureEngine_Api>("api")` — the Aspire dashboard shows the `api` resource when `dotnet run --project apps/AppHost` runs.
- [ ] `apps/Api/Program.cs` calls `builder.AddServiceDefaults()`, `builder.Services.AddOpenApi()`, `app.MapOpenApi()`, and `app.MapDefaultEndpoints()`, with an inline comment referencing Decision-002.
- [ ] `GET /scalar/v1` (or configured Scalar path) renders the Scalar API reference UI in Development mode — Swashbuckle is NOT referenced.
- [ ] `dotnet build AdventureEngine.slnx` produces zero errors and zero warnings including the new Api project.
- [ ] `dotnet run --project apps/Api` starts the API independently (without Aspire) and `GET /health/live` returns HTTP 200.
- [ ] `apps/Api/Features/README.md` exists documenting the VSA slice convention.
- [ ] `Microsoft.AspNetCore.OpenApi` and the Scalar package are added to `Directory.Packages.props`.

---

### item-006 — Scaffold React Vite app with TypeScript, path aliases, ESLint, and Prettier

| Field | Value |
|---|---|
| **Points** | 2 |
| **Priority** | 6 |
| **Status** | `in-sprint` |
| **Tags** | `frontend`, `react`, `vite`, `typescript`, `dx` |
| **Dependencies** | item-001 ✅ done |

**Description:**
Bootstrap the React frontend at `apps/web/` using `pnpm create vite` with the React-TS template. Configure `@/` path aliases in both `vite.config.ts` and `tsconfig.json`. Add ESLint (react-hooks + @typescript-eslint/recommended) and Prettier. Confirm the dev server starts, TypeScript is strict, linting passes, and formatting checks pass. Update root `package.json` `test` and `build` scripts from Sprint 1 echo placeholders to real commands.

**Acceptance Criteria:**
- [ ] `apps/web/` exists with `vite.config.ts`, `tsconfig.json`, `index.html`, and `src/main.tsx`.
- [ ] `@/` path alias resolves to `src/` in both `vite.config.ts` (Vite runtime) and `tsconfig.json` (TS language server).
- [ ] `pnpm --filter web lint` exits with code 0 on the freshly scaffolded codebase.
- [ ] `pnpm --filter web build` produces a production bundle in `apps/web/dist/` with zero TS errors (`tsc --noEmit` also passes).
- [ ] `pnpm --filter web dev` starts Vite at `http://localhost:5173` and the browser shows the default Vite+React page.
- [ ] Root `package.json` `test` script is updated from `echo '...'` to `pnpm --filter web test --run` (or equivalent CI-safe Vitest command).
- [ ] Root `package.json` `build` script is updated from `echo '...'` to `pnpm --filter web build && dotnet publish apps/Api` (or equivalent).

---

## 6. Execution Order and Parallelism

```
Sprint 2 — all items unblocked from Sprint 1

[Dev A — Backend track]           [Dev B — Frontend track]
item-014  (Api.Tests scaffold)     item-006  (React Vite scaffold)
    ↓
item-004  (API + Aspire + OpenAPI)
```

**Parallelism notes:**
- item-014 and item-006 are fully independent — assign to different developers on Day 1.
- item-004 depends on item-002 and item-003 (both done), NOT on item-014. item-014 and item-004 can be parallelised too — but item-014 should start first so `Api.Tests` exists before item-004's implementation writes its `Features/README.md` (convention is ready to test against).
- item-006 is completely independent of the backend track.

**Recommended order for a single developer:**
1. item-014 first (shortest, unblocks item-005 test harness path)
2. item-004 next (API live in Aspire dashboard)
3. item-006 last (frontend scaffold)

---

## 7. Definition of Done

Applies to every item in this sprint:

**Code quality**
- [ ] Code compiles with zero errors and zero warnings (`dotnet build` / `pnpm tsc --noEmit`)
- [ ] No commented-out dead code committed to main
- [ ] All public types/functions/methods have doc comments (C#) or JSDoc (TypeScript)

**Testing**
- [ ] All acceptance criteria from the item are verifiable (manual check or automated test)
- [ ] `dotnet test AdventureEngine.slnx` passes (all 43+ tests green, no regressions)
- [ ] No regressions in existing test suite

**Review**
- [ ] Code reviewed by at least one other team member (or self-reviewed with checklist)
- [ ] PR description references the item ID (e.g. `Closes item-004`)
- [ ] Branch merged to `main` and working branch deleted

**Backlog hygiene**
- [ ] Item `status` updated to `"done"` in `.pi/chronicle/backlog.json`
- [ ] Any new decisions recorded in the item's `notes` field and in `_decisions_locked`

**Sprint goal check**
- [ ] At sprint end: `dotnet run --project apps/AppHost` shows the `api` resource in the Aspire dashboard
- [ ] At sprint end: `apps/web/` exists and `pnpm --filter web dev` starts the Vite dev server

---

## 8. Package Reference Gaps (Action Required Before Item Pickup)

The following NuGet packages are **not yet in `Directory.Packages.props`** and must be added by the implementer before their respective items can be built:

| Item | Package | Required by |
|---|---|---|
| item-014 | `Microsoft.AspNetCore.Mvc.Testing` | `WebApplicationFactory` integration tests in `Api.Tests` |
| item-004 | `Microsoft.AspNetCore.OpenApi` | Built-in .NET 10 OpenAPI support |
| item-004 | `Scalar.AspNetCore` (or `Microsoft.AspNetCore.Scalar`) | Scalar UI |

**Action:** The developer picking up item-014 should add `Microsoft.AspNetCore.Mvc.Testing` to `Directory.Packages.props` first. The developer picking up item-004 should add the OpenAPI and Scalar packages.

---

## 9. Full Backlog Roadmap

All items across projected sprints. Assignments assume **6 effective story points per sprint**.

| ID | Title | Pts | Status | Sprint |
|---|---|---|---|---|
| item-001 | Scaffold monorepo folder structure + root `package.json` | 2 | `done` | S1 ✅ |
| item-002 | Create SharedKernel C# class library with DDD building blocks | 2 | `done` | S1 ✅ |
| item-003 | Set up .NET Aspire AppHost and ServiceDefaults | 2 | `done` | S1 ✅ |
| item-014 | Scaffold Api.Tests xUnit project and wire to solution | 2 | `in-sprint` | **S2** |
| item-004 | Scaffold ASP.NET Core Web API wired to Aspire with OpenAPI | 2 | `in-sprint` | **S2** |
| item-006 | Scaffold React Vite app with TypeScript, ESLint, Prettier | 2 | `in-sprint` | **S2** |
| item-005 | Health Check vertical slice with unit + integration tests | 3 | `pending` | S3 |
| item-007 | Configure Vitest + React Testing Library with example test | 2 | `pending` | S3 |
| item-008 | Set up Storybook with baseline Button component + story | 2 | `pending` | S3 |
| item-009 | Configure Playwright e2e suite with one smoke test | 2 | `pending` | S4 |
| item-015 | Configure CORS policy for React dev server ↔ API | 1 | `pending` | S4 |
| item-010 | Wire root orchestration scripts for single-command start + test | 2 | `pending` | S4 |
| item-011 | Add `.env.example` with all environment variables documented | 1 | `pending` | S5 |
| item-012 | Add Docker Compose alternative local start | 2 | `pending` | S5 |
| item-016 | GitHub Actions CI pipeline (test + build on PR) | 2 | `pending` | S5 |
| item-013 | Write README with Getting Started + dev commands | 1 | `pending` | S5 |

**Totals:**

| Sprint | Items | Points | Notes |
|---|---|---|---|
| S1 | 3 | 6 | ✅ Done — monorepo foundation + .NET skeleton |
| **S2** | **3** | **6** | API test harness + API scaffold + React scaffold |
| S3 | 3 | 7 | First vertical slice + frontend test tooling *(7pt — consider pulling item-007 or item-008 into S2 if capacity allows)* |
| S4 | 3 | 5 | e2e, CORS, orchestration scripts |
| S5 | 4 | 6 | Env config, Docker, CI pipeline, README |
| **Total** | **16** | **30pt** | ~5 sprints at 6pt/sprint |

---

## 10. Sprint 3 Preview

Sprint 3 will be fully unblocked once Sprint 2 closes. No additional decisions required.

| Item | Title | Points | Why it's next |
|---|---|---|---|
| item-005 | Health Check vertical slice | 3 | First VSA slice; depends on item-004 ✅ (Sprint 2) and item-014 ✅ (Sprint 2) |
| item-007 | Configure Vitest + RTL | 2 | Frontend test harness; depends on item-006 ✅ (Sprint 2) |
| item-008 | Set up Storybook | 2 | Component catalogue; depends on item-006 ✅ (Sprint 2) |

**Sprint 3 goal:** Prove the full VSA round-trip (backend slice with integration test) and establish the frontend test and component toolchains.

**Note:** Sprint 3 is 7pt — slightly over the 6pt effective capacity. If velocity allows, pull item-007 or item-008 into Sprint 2 alongside item-006 (they are independent and item-006 unblocks them). Otherwise, accept the 7pt and use the buffer.

---

## 11. Risks and Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | **`Directory.Packages.props` conflict** — both item-014 and item-004 add new packages simultaneously, causing a merge conflict in the central package file | Medium | Low | Coordinate: item-014 implementer adds `Microsoft.AspNetCore.Mvc.Testing` first; item-004 implementer adds OpenAPI + Scalar packages in a separate commit/branch. Merge item-014 first to reduce window. |
| 2 | **Scalar package name uncertainty** — the exact NuGet package name for Scalar UI with .NET 10 may differ from prior versions | Low | Medium | Check NuGet.org for `Scalar.AspNetCore` before starting item-004. If unavailable, fall back to the `Microsoft.AspNetCore.Scalar` preview package. |
| 3 | **React scaffold takes longer than expected** — `pnpm create vite` + ESLint v9 flat config migration can have sharp edges | Medium | Medium | Use the `@vitejs/plugin-react` template; for ESLint, use `eslint-config-react-app` or the recommended `typescript-eslint` flat config. If flat config is too complex, use `.eslintrc.json` legacy format — note the deviation in item-006 notes. |
| 4 | **Root script placeholders break `pnpm test:api`** — the current `test:api` script works, but item-006 AC6 modifies the `test` and `build` scripts. Risk of breaking the working `test:api` script | Low | High | Treat root `package.json` modifications in item-006 as an explicit step — read the current file, update only `test` and `build` scripts, verify `test:api` is unchanged. |

---

*Sprint 2 plan generated at end of Sprint 2 grooming session — 2026-02-24.*
*Authoritative item data lives in `.pi/chronicle/backlog.json`. Keep both files in sync as items complete.*
