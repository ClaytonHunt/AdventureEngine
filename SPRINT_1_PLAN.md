# Sprint 1 Plan — AdventureEngine

> **Single source of truth for Sprint 1.** Pin this to the team board.
> Last updated: 2026-02-23 | Generated at end of sprint planning session.

---

## 1. Sprint Header

| Field | Value |
|---|---|
| **Sprint number** | 1 |
| **Dates** | Day 1 – Day 10 (2-week sprint) |
| **Capacity (raw)** | 8 story points |
| **Capacity (effective)** | 6 story points (8 × 0.75 focus factor) |
| **Team size** | 1–2 developers |
| **Sprint status** | 🟢 Planned — items locked and ready |

---

## 2. Sprint Goal

> **Establish the foundational monorepo skeleton, SharedKernel DDD primitives, and .NET Aspire orchestration layer so that every subsequent item has a stable, correctly-placed home and the walking skeleton is ready to receive the API and React frontend.**

At the end of Sprint 1, a developer can clone the repository, run `pnpm install`, and launch the Aspire dashboard — confirming the toolchain is wired and the project structure is locked in place.

---

## 3. Decision Log

All 5 architectural decisions were resolved and locked into `backlog.json` during the pre-sprint backlog review. No open decisions remain.

| # | Question | Decision | Rationale | Items Updated |
|---|---|---|---|---|
| 1 | Folder convention: `apps/` vs `src/` | **`apps/`** | Monorepo-conventional (pnpm workspaces, Turborepo/Nx style). `apps/` = runnable projects; `packages/` = shared libraries. Avoids tooling confusion when workspace scanning. | item-001, item-006, item-009 |
| 2 | OpenAPI tooling: Built-in .NET 9 vs Swashbuckle | **Built-in .NET 9 OpenAPI + Scalar UI** | Zero extra packages; `AddOpenApi()` / `MapOpenApi()` / `MapScalarApiReference()` is the idiomatic .NET 9 pattern. Microsoft's own templates no longer include Swashbuckle for .NET 9+. | item-004 |
| 3 | Playwright placement: `apps/web/e2e/` vs standalone `e2e/` | **`apps/web/e2e/`** | Co-located with the app it tests; single `playwright.config.ts` scoped to the web app; simplest setup for a single frontend. Can be extracted to a standalone workspace package later if multi-app e2e is needed. | item-009, item-013 |
| 4 | Docker Compose scope: Include or defer? | **Include** | Reduces onboarding friction for contributors who cannot or prefer not to install the Aspire workload. Valuable for an open-source or multi-contributor project. Adds ~2pt to a later sprint — acceptable. | item-012, item-013 |
| 5 | Dev cert documentation: README only vs item-003 AC + README | **Option B — both** | Adding the `dotnet dev-certs https --trust` requirement as an explicit AC in item-003 ensures the developer implementing Aspire verifies it works on their machine. The README prerequisite (item-013) then picks it up automatically. | item-003, item-013 |

---

## 4. Selected Items

> **Total: 3 items · 6 story points · exactly at effective capacity**

---

### item-001 — Scaffold monorepo folder structure + root `package.json`

| Field | Value |
|---|---|
| **Points** | 2 |
| **Priority** | 1 (highest — must be done first) |
| **Status** | `in-sprint` |
| **Tags** | `monorepo`, `scaffold`, `chore` |
| **Dependencies** | None |

**Description:**
Create the top-level monorepo skeleton: root `package.json` with pnpm workspaces, workspace scripts (`start`, `test`, `test:e2e`, `test:api`, `storybook`, `build`), `.gitignore`, `.nvmrc` / `.node-version`, and the agreed top-level directory structure.

**Folder structure (Decision 1 locked):**
```
apps/
  web/          ← React + Vite frontend
  Api/          ← ASP.NET Core Web API
  AppHost/      ← .NET Aspire orchestration host
packages/
  SharedKernel/ ← C# DDD base types
  ServiceDefaults/ ← Aspire telemetry defaults
```

**Acceptance Criteria:**
- [ ] Root `package.json` exists with `"name"`, `"private": true`, `"packageManager": "pnpm@<version>"`, a `"workspaces"` field listing `["apps/*", "packages/*"]`, and placeholder scripts: `start`, `test`, `test:e2e`, `test:api`, `storybook`, `build`.
- [ ] `pnpm-workspace.yaml` lists all workspace globs (e.g. `apps/*`, `packages/*`).
- [ ] `.gitignore` covers `node_modules/`, `dist/`, `build/`, `.env`, `.env.local`, `bin/obj/`, `.aspire/`, `.playwright/`.
- [ ] Running `pnpm install` at the repo root completes without errors and generates `pnpm-lock.yaml`.
- [ ] Top-level directory tree matches the agreed `apps/` convention with `apps/` for runnable projects and `packages/` for shared libraries.
- [ ] A `CONTRIBUTING.md` stub or inline comment in the root `package.json` documents the chosen folder convention.

---

### item-002 — Create SharedKernel C# class library with DDD building blocks

| Field | Value |
|---|---|
| **Points** | 2 |
| **Priority** | 2 |
| **Status** | `in-sprint` |
| **Tags** | `backend`, `dotnet`, `architecture`, `ddd` |
| **Dependencies** | item-001 ✅ (in this sprint) |

**Description:**
Add a `SharedKernel` C# class library project under `packages/SharedKernel/`. Implement the abstract base classes and interfaces used across all vertical slices: `Entity<TId>`, `ValueObject`, `AggregateRoot<TId>`, `DomainEvent`, `IRepository<T, TId>`, `Result<T>`, and `Error`. No business logic — only structural contracts and DDD building blocks.

**Acceptance Criteria:**
- [ ] `SharedKernel.csproj` exists as a class library targeting the same TFM as the API project (e.g. `net9.0`).
- [ ] The following types exist and compile: `Entity<TId>` (identity-based equality), `ValueObject` (equality by components), `AggregateRoot<TId>` (extends `Entity`, holds `IReadOnlyList<DomainEvent>`), `DomainEvent` (abstract record), `IRepository<T, TId>` (Find, Add, Update, Remove), `Result<T>` (success/failure union with `IsSuccess`, `Value`, `Error`), `Error` (record with `Code` + `Message`).
- [ ] All types have XML doc comments summarising their intent.
- [ ] `dotnet build` on the SharedKernel project produces zero warnings and zero errors.
- [ ] SharedKernel has no dependencies on any other project in the solution — no EF Core, no HTTP clients.
- [ ] At least one xUnit unit test validates `Result<T>` success/failure behaviour (can live in item-014's test project, written when that item is picked up).

---

### item-003 — Set up .NET Aspire AppHost and ServiceDefaults

| Field | Value |
|---|---|
| **Points** | 2 |
| **Priority** | 3 |
| **Status** | `in-sprint` |
| **Tags** | `backend`, `dotnet`, `aspire`, `infrastructure` |
| **Dependencies** | item-001 ✅ (in this sprint) |

**Description:**
Add the .NET Aspire `AppHost` project (`apps/AppHost/`) and the `ServiceDefaults` project (`packages/ServiceDefaults/`) to the solution. `ServiceDefaults` adds OpenTelemetry, health check endpoints, and resilience defaults via extension methods. `AppHost` references the API project stub and wires up local dev orchestration.

> ⚠️ **Dev certificate prerequisite (Decision 5 locked):** The developer implementing this item **must** run `dotnet dev-certs https --trust` on their machine and confirm the Aspire dashboard loads without browser HTTPS errors before marking this item done.

**Acceptance Criteria:**
- [ ] `AppHost.csproj` and `ServiceDefaults.csproj` exist and are added to the `.sln` file.
- [ ] Running `dotnet run --project apps/AppHost` launches the Aspire dashboard (default `http://localhost:15888`) without errors.
- [ ] `ServiceDefaults` project exposes `AddServiceDefaults()` and `MapDefaultEndpoints()` extension methods that configure OpenTelemetry tracing, metrics, and health checks.
- [ ] `AppHost` references the API project via `AddProject<>()` (the API does not need to be fully implemented — a placeholder `Program.cs` is acceptable).
- [ ] `dotnet build` on the full solution produces zero errors.
- [ ] README note (or inline comment in the AppHost `Program.cs`) documents the `dotnet dev-certs https --trust` prerequisite — and the developer implementing this item verifies the command works on their machine as part of completing this item.

---

## 5. Execution Order and Parallelism

```
Day 1–2
└── [Both devs] item-001 — Scaffold monorepo root
        ↓ MERGE — this is a hard gate; nothing else starts until this is on main

Day 2–10  (run in parallel once item-001 is merged)
├── [Dev A] item-002 — SharedKernel DDD building blocks
└── [Dev B] item-003 — Aspire AppHost + ServiceDefaults
```

> **Rule:** item-001 must be merged to `main` before item-002 or item-003 branches are cut. Attempting to parallelise item-001 alongside item-002/003 risks structural merge conflicts in the `.sln` file and root configuration files.

**Why this ordering works:**
- item-002 and item-003 both depend on item-001, but they are independent of each other.
- After item-001 merges, both items can be worked simultaneously with no risk of cross-conflict (item-002 touches `packages/SharedKernel/`; item-003 touches `apps/AppHost/` and `packages/ServiceDefaults/`).
- Both items complete before Day 10, leaving Sprint 2 fully unblocked.

---

## 6. Definition of Done

The following checklist applies to **every item** in this sprint. An item is not done until all boxes are checked.

**Code quality**
- [ ] Code compiles with zero errors and zero warnings (`dotnet build` / `pnpm tsc --noEmit`)
- [ ] No commented-out dead code committed to main
- [ ] All public types/functions/methods have doc comments

**Testing**
- [ ] All acceptance criteria from the item are verifiable (manual check or automated test)
- [ ] No regressions in the existing test suite

**Review**
- [ ] Code has been reviewed by at least one other team member (or self-reviewed with a checklist for solo developers)
- [ ] PR description references the item ID (e.g. `Closes item-003`)
- [ ] Branch is merged to `main` and the working branch is deleted

**Backlog hygiene**
- [ ] Item `status` is updated to `"done"` in `backlog.json`
- [ ] Any new decisions or deviations are recorded in the item's description

**Sprint goal**
- [ ] At sprint end: a developer can clone the repo, run `pnpm install`, and launch the .NET Aspire dashboard without error

---

## 7. Prerequisites — Machine Setup

Every developer must have completed the following **before Sprint 1 Day 1**. These are one-time setup steps, not part of any backlog item.

```bash
# 1. Node.js — install the LTS version pinned in .nvmrc
#    Recommended: use nvm (macOS/Linux) or nvm-windows
nvm install --lts
nvm use --lts

# 2. pnpm — fast, disk-efficient package manager required by this monorepo
npm install -g pnpm

# 3. .NET 9 SDK
#    Download from: https://dotnet.microsoft.com/download/dotnet/9.0

# 4. .NET Aspire workload — required for item-003
dotnet workload install aspire

# 5. Trust the local HTTPS dev certificate — required for Aspire dashboard
#    Run ONCE per machine. Skip this and the Aspire dashboard will fail on HTTPS.
dotnet dev-certs https --trust

# 6. Docker Desktop (optional — required for item-012 in a later sprint)
#    Download from: https://www.docker.com/products/docker-desktop
```

> **Why `dotnet dev-certs https --trust`?** .NET Aspire uses HTTPS by default. Without a trusted local certificate, the browser will reject the Aspire dashboard and all API HTTPS calls. This is a one-time operation per developer machine.

---

## 8. Full Backlog Roadmap

All 16 items across projected sprints. Sprint assignments assume **6 effective story points per sprint** (single developer baseline; parallelise for a two-developer team).

| ID | Title | Pts | Status | Tags | Sprint |
|---|---|---|---|---|---|
| item-001 | Scaffold monorepo folder structure + root `package.json` | 2 | `in-sprint` | monorepo, scaffold | **S1** |
| item-002 | Create SharedKernel C# class library with DDD building blocks | 2 | `in-sprint` | backend, dotnet, ddd | **S1** |
| item-003 | Set up .NET Aspire AppHost and ServiceDefaults | 2 | `in-sprint` | backend, dotnet, aspire | **S1** |
| item-014 | Scaffold backend xUnit test projects and wire to solution | 2 | `pending` | backend, testing, xunit | **S2** |
| item-004 | Scaffold ASP.NET Core Web API wired to Aspire with OpenAPI | 2 | `pending` | backend, api, openapi | **S2** |
| item-006 | Scaffold React Vite app with TypeScript, ESLint, Prettier | 2 | `pending` | frontend, react, vite | **S2** |
| item-005 | Health Check vertical slice with unit + integration tests | 3 | `pending` | backend, vsa, testing | **S3** |
| item-007 | Configure Vitest + React Testing Library with example test | 2 | `pending` | frontend, testing, vitest | **S3** |
| item-008 | Set up Storybook with baseline Button component + story | 2 | `pending` | frontend, storybook, ux | **S3** |
| item-009 | Configure Playwright e2e suite with one smoke test | 2 | `pending` | frontend, e2e, playwright | **S4** |
| item-015 | Configure CORS policy for React dev server ↔ ASP.NET API | 1 | `pending` | backend, cors, frontend | **S4** |
| item-010 | Wire root orchestration scripts for single-command start + test | 2 | `pending` | dx, scripts, monorepo | **S4** |
| item-011 | Add `.env.example` with all environment variables documented | 1 | `pending` | dx, config, environment | **S5** |
| item-012 | Add Docker Compose alternative local start | 2 | `pending` | devops, docker, optional | **S5** |
| item-016 | GitHub Actions CI pipeline (test + build on PR) | 2 | `pending` | ci, devops, github-actions | **S5** |
| item-013 | Write README with Getting Started + dev commands | 1 | `pending` | documentation, dx, readme | **S5** |

**Totals:**

| Sprint | Items | Points | Notes |
|---|---|---|---|
| S1 | 3 | 6 | Monorepo foundation + .NET skeleton |
| S2 | 3 | 6 | Test harness, API scaffold, React scaffold |
| S3 | 3 | 7 | First vertical slice + frontend test tooling *(7pt — consider splitting if needed)* |
| S4 | 3 | 5 | e2e, CORS, orchestration scripts |
| S5 | 4 | 6 | Env config, Docker, CI pipeline, README |
| **Total** | **16** | **30pt** | ~5 sprints at 6pt/sprint |

---

## 9. Sprint 2 Preview

Sprint 2 is **fully unblocked** the moment Sprint 1 closes. No additional decisions or prerequisites are required.

| Item | Title | Points | Why it's next |
|---|---|---|---|
| item-014 | Scaffold backend xUnit test projects | 2 | Unlocked by item-002 + item-003; sets up the test harness before any real feature work |
| item-004 | Scaffold ASP.NET Core Web API with Aspire + OpenAPI | 2 | Unlocked by item-002 + item-003; uses built-in .NET 9 OpenAPI + Scalar UI (Decision 2) |
| item-006 | Scaffold React Vite app with TypeScript + ESLint + Prettier | 2 | Unlocked by item-001; lives at `apps/web/` (Decision 1); independent of backend track |

**Sprint 2 goal (preview):** Wire the backend test harness, stand up the API with a live OpenAPI document, and create the React app scaffold — so that both tracks have runnable, testable starting points for feature work.

**Execution note for Sprint 2:** item-014 and item-004 share dependencies (item-002, item-003) but are otherwise independent. item-006 depends only on item-001 and is fully independent of the backend track. All three can be parallelised across two developers after item-014 is started.

---

## 10. Risks and Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | **item-001 takes longer than Day 2**, blocking item-002 and item-003 from starting and compressing the remaining sprint | Medium | High | Timebox item-001 strictly to Day 1–2. The scaffold is intentionally minimal — no actual code, only configuration files and empty directories. If it's not done by end of Day 2, descope to the bare minimum needed to unblock the other two items (root `package.json` + folder structure). |
| 2 | **Aspire workload not installed** on the developer machine taking item-003, causing a 15–30 minute unplanned setup delay mid-sprint | Medium | Medium | Enforce the machine setup checklist (Section 7) before Day 1. The developer taking item-003 should run `dotnet workload install aspire` and `dotnet dev-certs https --trust` the day before the sprint starts and confirm success. |
| 3 | **`.sln` merge conflict** if item-002 and item-003 are both adding projects to the solution file simultaneously | Low | Medium | item-001 should create the `.sln` stub. item-002 and item-003 add their projects to it via separate PRs. If both PRs are open simultaneously, the second PR to merge must rebase and re-add its project reference after the first merges. Use short-lived branches and merge item-002 before item-003 (or vice versa) to minimise conflict window. |

---

*Sprint plan generated at end of sprint planning session — 2026-02-23.*
*Authoritative item data lives in `backlog.json`. Keep both files in sync as items complete.*
