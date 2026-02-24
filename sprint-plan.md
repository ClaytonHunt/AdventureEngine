# Sprint Plan — Sprint 2 · 2026-02-24

**Capacity:** 8pt total · 6pt effective (20% buffer · `8 × 0.8 = 6.4` → 6pt)
**Sprint Length:** 10 days
**Total Planned:** 6pt across 3 items

---

## Sprint Goal

> Establish the backend API surface and React frontend scaffold so that both tracks have a running, tested starting point — and the Aspire dashboard shows a live, registered API service alongside the React dev server.

**Sprint 2 is complete when:**
- `dotnet run --project apps/AppHost` shows the `api` resource in the Aspire dashboard ✅
- `GET /scalar/v1` renders the Scalar API reference UI ✅
- `apps/web/` exists with TypeScript + ESLint + Prettier all passing ✅
- `dotnet test AdventureEngine.slnx` discovers and passes both `SharedKernel.Tests` (43 tests, carried from Sprint 1) and the new `Api.Tests` placeholder ✅
- `pnpm test`, `pnpm test:api`, and `pnpm build` (web-only) all exit 0 ✅

---

## Sprint 2 Context

### What Sprint 1 delivered (all `done`)
| Item | Deliverable |
|---|---|
| item-001 | Monorepo skeleton — `apps/`, `packages/`, `package.json`, `.gitignore`, `.nvmrc`, `.editorconfig`, `global.json`, `Directory.Build.props`, `Directory.Packages.props`, `AdventureEngine.slnx`, `README.md` placeholder |
| item-002 | `packages/SharedKernel` — DDD primitives (Entity, ValueObject, AggregateRoot, IDomainEvent, IRepository, Result<T>, Error) + `packages/SharedKernel.Tests` with **43 passing xUnit tests** |
| item-003 | `apps/AppHost` (Aspire.AppHost.Sdk 13.1.1) + `packages/ServiceDefaults` (AddServiceDefaults, OTel, health checks) + `CONTRIBUTING.md` |

### Key decisions locked during Sprint 2 grooming
| ID | Decision | Resolution |
|---|---|---|
| D-006 | .NET version | `net10.0` — SDK 10.0.103 pinned in `global.json` with `rollForward: latestPatch` |
| D-007 | Aspire approach | NuGet secondary SDK (`Aspire.AppHost.Sdk 13.1.1`) — workload deprecated in .NET 10; no `dotnet workload install aspire` needed |
| D-008 | Solution format | `.slnx` — default for `dotnet new sln` on .NET 10; all `dotnet test`/`dotnet build` commands use `AdventureEngine.slnx` |
| D-009 | SharedKernel.Tests | Delivered in Sprint 1 as part of item-002; item-014 scope = **Api.Tests only** |
| D-010 | Api.Tests → Api ref | Deferred to Sprint 3 (item-005) — item-014 scaffolds `Api.Tests` with placeholder `[Fact]` only; no `ProjectReference` to `apps/Api` until item-005 |

---

## Execution Order and Parallelism

```
All three items are unblocked on Day 1 (all Sprint 1 deps are done).

[Backend track]                      [Frontend track]
────────────────────────────         ─────────────────────────────
item-014  (Api.Tests scaffold)       item-006  (React Vite scaffold)
     ↓
item-004  (API + Aspire + OpenAPI)
```

**Two-developer split:** Assign item-014 + item-004 to Dev A (backend), item-006 to Dev B (frontend). Both tracks are fully independent.

**Single-developer order:** item-014 → item-004 → item-006

> ⚠️ **Directory.Packages.props merge risk:** Both item-014 and item-004 add new NuGet packages to the central package file. Merge item-014 first to reduce the conflict window. See Risk #1 below.

---

## Sprint Items

### Item 1 of 3 — item-014: Scaffold Api.Tests xUnit project and wire to solution

| Field | Value |
|---|---|
| **Type** | chore |
| **Size** | medium |
| **Points** | 2 |
| **Priority** | 4 (highest in sprint — unblocks item-005 test harness in Sprint 3) |
| **Status** | `in-sprint` |
| **Dependencies** | item-002 ✅ done · item-003 ✅ done |
| **Tags** | `backend`, `testing`, `xunit`, `dx` |

**Description:**
Create `apps/Api.Tests/AdventureEngine.Api.Tests.csproj` as the xUnit test project for the API layer. Wire it with `FluentAssertions`, `NSubstitute`, and `Microsoft.AspNetCore.Mvc.Testing` (for future `WebApplicationFactory`-based integration tests in Sprint 3). Add the project to `AdventureEngine.slnx`. Confirm `dotnet test` discovers and passes a placeholder assertion.

> **Scope boundary (D-009 + D-010):**
> - `packages/SharedKernel.Tests/` (43 tests) was fully delivered in Sprint 1 — do NOT recreate it.
> - This item does **not** add a `ProjectReference` to `apps/Api`. The Api project (item-004) may not be merged when this item runs. The `ProjectReference` and `WebApplicationFactory<Program>` wiring are added in item-005 (Sprint 3), which explicitly depends on both item-004 and item-014.

**Acceptance Criteria:**

- **AC1 — Project file:** Given `apps/Api.Tests/AdventureEngine.Api.Tests.csproj`, when inspected, then it references `xunit`, `FluentAssertions`, `NSubstitute`, and `Microsoft.AspNetCore.Mvc.Testing` via NuGet (all versions sourced from `Directory.Packages.props`) — it does **NOT** yet reference the `Api` project (that wiring happens in item-005).

- **AC2 — Central package version management:** Given `Microsoft.AspNetCore.Mvc.Testing` is added to `Directory.Packages.props` before the project is created, when `dotnet restore` runs, then the package resolves at the correct version and no manual version pin exists in the `.csproj`.

- **AC3 — Solution discovery:** Given the `Api.Tests` project is added to `AdventureEngine.slnx`, when `dotnet test AdventureEngine.slnx` is run, then `Api.Tests` is discovered alongside `SharedKernel.Tests` and all tests pass (exit code 0).

- **AC4 — Placeholder test:** Given a placeholder `[Fact]` in `Api.Tests` (e.g., `(1 + 1).Should().Be(2)` using FluentAssertions), when `dotnet test` runs, then it passes — proving the test pipeline is wired end to end.

- **AC5 — Infrastructure-free:** Given the `Api.Tests` project, when inspected, then it does **not** reference EF Core, database drivers, or any infrastructure package.

- **AC6 — Root test:api script:** Given `pnpm test:api` at the repo root, when run after first executing `dotnet build AdventureEngine.slnx` (the live script uses `--no-build`), then it invokes the test run and the exit code propagates correctly (0 on pass, non-zero on failure).

**Implementation notes:**
1. Add `Microsoft.AspNetCore.Mvc.Testing` to `Directory.Packages.props` first (before creating the project).
2. Use `dotnet new xunit -n AdventureEngine.Api.Tests -o apps/Api.Tests --framework net10.0`.
3. Add to solution: `dotnet sln AdventureEngine.slnx add apps/Api.Tests/AdventureEngine.Api.Tests.csproj`.
4. Add NuGet refs: `dotnet add apps/Api.Tests package xunit`, `FluentAssertions`, `NSubstitute`, `Microsoft.AspNetCore.Mvc.Testing` (no version flags — versions come from `Directory.Packages.props`).
5. Replace the default `UnitTest1.cs` with a clearly named placeholder, e.g. `PlaceholderTests.cs`.

---

### Item 2 of 3 — item-004: Scaffold ASP.NET Core Web API wired to Aspire with OpenAPI

| Field | Value |
|---|---|
| **Type** | chore |
| **Size** | medium |
| **Points** | 2 |
| **Priority** | 5 |
| **Status** | `in-sprint` |
| **Dependencies** | item-002 ✅ done · item-003 ✅ done |
| **Tags** | `backend`, `dotnet`, `api`, `openapi`, `aspire` |

**Description:**
Create `apps/Api/AdventureEngine.Api.csproj` as an ASP.NET Core Minimal API project targeting `net10.0`. Reference `SharedKernel` and `ServiceDefaults`. Register the API in the Aspire `AppHost` so it appears in the dashboard. Configure built-in .NET 10 OpenAPI (`AddOpenApi()` / `MapOpenApi()`) and Scalar UI. Add a `Features/` folder with a `README.md` documenting the VSA slice convention. Wire the project into `AdventureEngine.slnx`.

> **D-002:** Built-in .NET 10 OpenAPI + Scalar UI only. No Swashbuckle — not referenced anywhere.
> **D-006:** Target `net10.0`.
> **D-007:** Register in AppHost via `builder.AddProject<Projects.AdventureEngine_Api>("api")`.

**Acceptance Criteria:**

- **AC1 — Project compiles:** Given `dotnet build AdventureEngine.slnx`, when run after this item, then the Api project compiles with zero errors and zero warnings, and all project references (SharedKernel, ServiceDefaults) resolve correctly.

- **AC2 — Aspire dashboard:** Given `dotnet run --project apps/AppHost`, when the Aspire host starts, then the `api` resource appears in the Aspire dashboard and `GET /health/live` returns HTTP 200 (via ServiceDefaults `MapDefaultEndpoints()`).

- **AC3 — Program.cs wiring:** Given `apps/Api/Program.cs`, when inspected, then it calls `builder.AddServiceDefaults()`, `builder.Services.AddOpenApi()`, `app.MapOpenApi()`, and `app.MapDefaultEndpoints()`, with an inline comment referencing Decision-002.

- **AC4 — Scalar UI:** Given the API starts in Development mode, when a developer navigates to `/scalar/v1` (or the configured Scalar UI path), then the Scalar API reference UI renders listing all registered endpoints — Swashbuckle is **not** referenced anywhere in the project.

- **AC5 — Standalone run:** Given `dotnet run --project apps/Api`, when run without Aspire, then the API starts on a configurable port and `GET /health/live` returns HTTP 200.

- **AC6 — VSA Features folder:** Given `apps/Api/Features/`, when inspected, then the folder exists with a `README.md` describing the vertical slice convention and naming rules for new slices.

- **AC7 — NuGet packages:** Given `Microsoft.AspNetCore.OpenApi` and the Scalar package (verify exact name: `Scalar.AspNetCore` on NuGet.org; fallback `Microsoft.AspNetCore.Scalar`) are added to `Directory.Packages.props`, when `dotnet restore` runs, then both packages resolve without errors.

**Implementation notes:**
1. ⚠️ **Before writing code** — verify the exact Scalar package name at [nuget.org](https://www.nuget.org). Search `Scalar.AspNetCore`. If that package exists, use it. If not, search `Microsoft.AspNetCore.Scalar`. Record the confirmed name in the item's notes field in `backlog.json`.
2. Use `dotnet new webapi --minimal -n AdventureEngine.Api -o apps/Api --framework net10.0`.
3. Add solution: `dotnet sln AdventureEngine.slnx add apps/Api/AdventureEngine.Api.csproj`.
4. Add project refs: `dotnet add apps/Api reference packages/SharedKernel packages/ServiceDefaults`.
5. Register in AppHost: open `apps/AppHost/Program.cs` and add `var api = builder.AddProject<Projects.AdventureEngine_Api>("api");`.
6. Create `apps/Api/Features/README.md` documenting the VSA convention (feature folder → endpoint class → response DTO, no MediatR).

---

### Item 3 of 3 — item-006: Scaffold React Vite app with TypeScript, path aliases, ESLint, and Prettier

| Field | Value |
|---|---|
| **Type** | chore |
| **Size** | medium |
| **Points** | 2 |
| **Priority** | 6 |
| **Status** | `in-sprint` |
| **Dependencies** | item-001 ✅ done |
| **Tags** | `frontend`, `react`, `vite`, `typescript`, `dx`, `scaffold` |

**Description:**
Bootstrap the React frontend at `apps/web/` using `pnpm create vite` with the React-TS template. Configure `@/` path aliases in both `vite.config.ts` (Vite runtime) and `tsconfig.json` (TypeScript language server). Add ESLint (react-hooks + @typescript-eslint/recommended rules) and Prettier. Confirm the dev server starts, TypeScript strict mode passes, linting is clean, and the production build succeeds. Update the root `package.json` `test` and `build` scripts from their Sprint 1 `echo` placeholders to real commands.

> **D-001:** React Vite project lives at `apps/web/`.

**Acceptance Criteria:**

- **AC1 — Dev server:** Given `pnpm --filter web dev` (or `pnpm dev` from `apps/web/`), when executed, then the Vite dev server starts and `http://localhost:5173` serves the React app without errors.

- **AC2 — Path alias:** Given a TypeScript file using `import { foo } from '@/utils/foo'`, when Vite builds and the TypeScript language server resolves it, then the import resolves correctly in both `vite.config.ts` (runtime) and `tsconfig.json` (type-checking) with no errors.

- **AC3 — Linting:** Given `pnpm --filter web lint`, when run, then ESLint reports zero errors on the freshly scaffolded codebase (react-hooks and @typescript-eslint/recommended rules active).

- **AC4 — Formatting:** Given a `.prettierrc` at `apps/web/` (or repo root), when `prettier --check .` is run from `apps/web/`, then all files pass formatting checks.

- **AC5 — Production build:** Given `pnpm --filter web build`, when run, then Vite produces a production bundle in `apps/web/dist/` with zero TypeScript errors (`tsc --noEmit` also passes).

- **AC6 — Root `test` script:** Given the root `package.json` `test` script, when this item is delivered, then it is updated from the `echo` placeholder to `pnpm --filter web test --run` (CI-safe, non-watch Vitest command).

- **AC7 — Root `build` script:** Given the root `package.json` `build` script, when this item is delivered, then it is updated from the `echo` placeholder to `pnpm --filter web build` — the `dotnet publish apps/Api` half is intentionally omitted here and added in item-010, since the Api project (item-004) may not be merged yet.

**Implementation notes:**
1. Scaffold: `pnpm create vite apps/web --template react-ts` from the repo root (or `cd apps && pnpm create vite web --template react-ts`).
2. Path alias in `vite.config.ts`: add `resolve: { alias: { '@': path.resolve(__dirname, 'src') } }`.
3. Path alias in `tsconfig.json`: add `"paths": { "@/*": ["./src/*"] }` under `compilerOptions`.
4. ⚠️ **ESLint v9 note:** `pnpm create vite` may generate an ESLint v9 flat config (`eslint.config.js`). Both flat config and legacy `.eslintrc.json` are acceptable — document which format was used in the item's `notes` in `backlog.json` so downstream contributors aren't surprised.
5. Do not include `dotnet publish apps/Api` in the root `build` script — defer that to item-010.
6. Verify `test:api` in root `package.json` is **unchanged** after modifying `test` and `build` scripts.

---

## Definition of Done

Every item in this sprint must satisfy all of the following before its status is changed to `done` in `backlog.json`:

### Code Quality
- [ ] Code compiles with zero errors and zero warnings (`dotnet build AdventureEngine.slnx` / `pnpm --filter web build` + `tsc --noEmit`)
- [ ] No commented-out dead code committed to `main`
- [ ] All public C# types/methods have XML doc comments; all exported TypeScript types/functions have JSDoc

### Testing
- [ ] All acceptance criteria listed above are verifiably satisfied
- [ ] `dotnet test AdventureEngine.slnx` exits 0 — **all 43+ tests green, zero regressions**
- [ ] No new TypeScript or C# compiler warnings introduced

### Review
- [ ] Code reviewed (self-review with checklist is acceptable for solo developer)
- [ ] Commit message references the item ID using Conventional Commits format: `feat(api): scaffold Api project (item-004)`
- [ ] Branch merged to `main` and working branch deleted

### Backlog Hygiene
- [ ] Item `status` updated to `"done"` in `.pi/chronicle/backlog.json`
- [ ] Any new decisions or findings recorded in the item's `notes` field
- [ ] If a new locked decision was made, it is added to `_decisions_locked` in `backlog.json`

### Sprint Goal Check (run at sprint end — not per item)
- [ ] `dotnet run --project apps/AppHost` → `api` resource visible in Aspire dashboard
- [ ] `GET /scalar/v1` → Scalar API reference UI renders in browser
- [ ] `pnpm --filter web dev` → Vite dev server starts at `http://localhost:5173`
- [ ] `dotnet test AdventureEngine.slnx` → all tests pass (including new `Api.Tests` placeholder)
- [ ] `pnpm test --run` (or `pnpm test` root script) → exits 0
- [ ] `pnpm build` (root) → `pnpm --filter web build` completes successfully

---

## Risks and Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | **`Directory.Packages.props` merge conflict** — item-014 and item-004 both add NuGet packages to the central package file simultaneously | Medium | Low | Merge item-014 first (single package addition, small diff). item-004 then adds its packages to an already-updated file. If working in parallel branches, cherry-pick the package-props commit onto item-004's branch before merging. |
| 2 | **Scalar package name uncertainty** — exact NuGet package name for Scalar UI with .NET 10 may differ | Low | Medium | **First step of item-004:** go to nuget.org and confirm `Scalar.AspNetCore`. If that doesn't exist, search for `Microsoft.AspNetCore.Scalar`. Record the confirmed name in item-004's `notes` before writing any code. |
| 3 | **ESLint v9 flat config complexity** — `pnpm create vite` (React-TS template) may generate the new `eslint.config.js` flat config format, which has different syntax from the legacy `.eslintrc.json` | Medium | Medium | Both formats are valid — accept whichever format the scaffold generates. Document the chosen format in item-006 `notes`. Do not invest time in migrating between formats during this sprint. |
| 4 | **Root `package.json` script collision** — item-006 modifies `test` and `build` scripts; risk of accidentally overwriting the working `test:api` script | Low | High | When editing root `package.json`, read the current file first, update **only** the `test` and `build` keys, and verify `test:api`, `test:e2e`, `storybook`, and `start` are unchanged afterward. |
| 5 | **Aspire dashboard HTTPS error after Api registration** — adding a new project to the AppHost may trigger a new HTTPS binding that requires a fresh dev cert | Low | Medium | If the Aspire dashboard shows a cert error after item-004 is wired, run `dotnet dev-certs https --trust` again and restart. This is documented in `CONTRIBUTING.md` (from Sprint 1 item-003). |

---

## Deferred (did not fit)

No ready item was left out — effective capacity is exactly 6pt and planned work is exactly 6pt.

The next-highest-priority pending item is:

- **item-005** — Implement Health Check vertical slice with unit and integration tests (large, 3pt) — **not ready for this sprint** because it depends on item-004 and item-014, which are themselves in-sprint and not yet done. Will be Sprint 3's anchor item.

---

## Blocked (not ready)

Items excluded from planning because their dependencies are not yet resolved:

| Item | Reason |
|---|---|
| item-005 | Depends on item-004 (in-sprint) and item-014 (in-sprint) |
| item-007 | Depends on item-006 (in-sprint) |
| item-008 | Depends on item-006 (in-sprint) |
| item-009 | Depends on item-006 (in-sprint) |
| item-015 | Depends on item-004 (in-sprint) and item-006 (in-sprint) |
| item-010 | Depends on item-003 ✅, item-004 (in-sprint), item-006 (in-sprint), item-007, item-008, item-009 |
| item-011 | Depends on item-004 (in-sprint), item-006 (in-sprint), item-015 |
| item-012 | Depends on item-004 (in-sprint), item-011 |
| item-016 | Depends on item-010 |
| item-013 | Depends on item-010, item-011, item-012, item-016 |

---

## Sprint 3 Preview

Sprint 3 is fully unblocked the moment Sprint 2 closes. No new decisions are required.

| Item | Title | Points | Unblocked by |
|---|---|---|---|
| **item-005** | Health Check vertical slice with unit + integration tests | 3 | item-004 ✅ S2 + item-014 ✅ S2 |
| **item-007** | Configure Vitest + React Testing Library with example test | 2 | item-006 ✅ S2 |
| **item-008** | Set up Storybook with baseline Button + story | 2 | item-006 ✅ S2 |

**Sprint 3 total:** 7pt — one point over the 6pt effective capacity. Options:
1. Accept 7pt (use the buffer intentionally — all three items are well-groomed and sized).
2. Defer item-008 (2pt) to Sprint 4 and keep Sprint 3 at 5pt with room for unplanned work.

**Sprint 3 goal (draft):** Prove the full VSA round-trip — a backend health-check slice with WebApplicationFactory integration tests — and establish the React unit-test and component-catalogue toolchains.

---

## Backlog Summary After Sprint 2 Planning

| State | Items | Points |
|---|---|---|
| ✅ Done (Sprint 1) | 3 | 6pt |
| 🏃 In-sprint (Sprint 2) | 3 | 6pt |
| ⏳ Pending | 10 | 18pt |
| **Total** | **16** | **30pt** |

**Estimated sprints to clear backlog:** ~5 total (3 remaining at 6pt/sprint for pending work)

### Full Roadmap

| Sprint | Items | Points | Focus |
|---|---|---|---|
| S1 ✅ | 3 | 6 | Monorepo foundation · .NET skeleton · Aspire scaffold |
| **S2 ← you are here** | **3** | **6** | API test harness · ASP.NET Core API · React scaffold |
| S3 | 3 | 7* | First VSA slice + integration tests · Vitest · Storybook |
| S4 | 3 | 5 | Playwright e2e · CORS · Root orchestration scripts |
| S5 | 4 | 6 | `.env.example` · Docker Compose · GitHub Actions CI · README |

*Sprint 3 is 7pt — one point over effective capacity. Re-evaluate at Sprint 3 planning.

---

*Sprint 2 plan finalised: 2026-02-24*
*Authoritative item data: `.pi/chronicle/backlog.json`*
*Grooming artefacts: `SPRINT_2_PLAN.md` · `GROOMING_SUMMARY_SPRINT2.md`*
