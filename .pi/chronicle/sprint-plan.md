# Sprint Plan — 2026-02-23

**Capacity:** 8pt total · 6pt effective (20% buffer)
**Sprint Length:** 10 days
**Total Planned:** 6pt across 3 items

---

## Sprint Goal

Establish the foundational monorepo skeleton, SharedKernel DDD primitives, and .NET Aspire orchestration layer so that every subsequent item has a stable, correctly-placed home and the walking skeleton is ready to receive the API and frontend.

---

## Sprint Items

### 1. item-001 — Scaffold monorepo folder structure and root package.json
**Type:** chore | **Size:** medium | **Points:** 2

**Description:**
As a developer, I need the top-level repo skeleton in place — folder layout, root `package.json` with pnpm workspaces, `.gitignore`, and `.nvmrc` — so that every subsequent task has a stable home and all tooling commands work from the repo root. This is the foundational walking-skeleton prerequisite; nothing else can be correctly placed until this exists.

> **Decision-001 LOCKED — Folder convention:** Use `apps/` for runnable projects and `packages/` for shared libraries (monorepo-conventional, Turborepo/Nx/pnpm style). Structure:
> - `apps/web/` — React + Vite frontend
> - `apps/Api/` — ASP.NET Core Web API
> - `apps/AppHost/` — .NET Aspire orchestration host
> - `packages/SharedKernel/` — C# DDD base types
> - `packages/ServiceDefaults/` — Aspire telemetry defaults

**Acceptance Criteria:**
- Given the repo is cloned, when a developer runs `ls` at the root, then they see at minimum: `apps/`, `packages/`, `.gitignore`, `package.json`, and `README.md` stubs — with `apps/` holding runnable projects (web, Api, AppHost) and `packages/` holding shared libraries (SharedKernel, ServiceDefaults).
- Given the root `package.json`, when inspected, then it declares `"packageManager": "pnpm@<version>"`, a `workspaces` field listing `["apps/*", "packages/*"]`, and placeholder scripts for `start`, `test`, `test:e2e`, `test:api`, `storybook`, and `build`.
- Given a developer runs `pnpm install` at the root, then pnpm resolves without errors and a `pnpm-lock.yaml` is generated.
- Given `.gitignore`, when inspected, then it excludes `node_modules/`, `dist/`, `build/`, `.env`, `.env.local`, `*.user`, and `bin/obj/` (for .NET artifacts).
- Given `.nvmrc` or `.tool-versions`, when inspected, then it pins the Node.js version used by the project.

**Dependencies:** none

---

### 2. item-002 — Create SharedKernel C# class library with base DDD building blocks
**Type:** feature | **Size:** medium | **Points:** 2

**Description:**
As a backend developer, I need a `packages/SharedKernel` C# class library that provides the reusable DDD primitives (`Entity`, `ValueObject`, `AggregateRoot`, `DomainEvent`, `IRepository<T>`, `Result<T>`, `Error`) so that every vertical slice can build on a consistent, tested foundation without duplicating boilerplate. This is the first .NET artifact and must exist before any API or slice work begins.

**Acceptance Criteria:**
- Given the SharedKernel project, when built with `dotnet build`, then it compiles with zero errors and zero warnings.
- Given the `Entity` base class, when a concrete entity inherits it, then it exposes an `Id` property and overrides `Equals`/`GetHashCode` based on identity (not reference).
- Given the `ValueObject` base class, when two instances with identical properties are compared with `==`, then they are considered equal.
- Given `Result<T>`, when a method returns `Result<T>.Success(value)` or `Result<T>.Failure(error)`, then callers can interrogate `IsSuccess`, `Value`, and `Error` without throwing exceptions.
- Given the SharedKernel project, when inspected, then it contains no external NuGet dependencies beyond the .NET BCL — `IRepository<T>` is an interface only with no EF Core or infrastructure coupling.

**Dependencies:** item-001 ✅ (in this sprint)

---

### 3. item-003 — Set up .NET Aspire AppHost and ServiceDefaults projects
**Type:** chore | **Size:** medium | **Points:** 2

**Description:**
As a developer, I need the .NET Aspire AppHost (`apps/AppHost`) and ServiceDefaults (`packages/ServiceDefaults`) projects scaffolded and wired together so that the Aspire orchestration layer is ready to register services, expose the dashboard, and propagate OpenTelemetry defaults. This gates the API project wiring and the single-command start experience.

> **Decision-005 LOCKED — Dev certificate:** The developer implementing this item **must** run `dotnet dev-certs https --trust` on their machine and verify the Aspire dashboard loads without browser security errors before marking this item done. This requirement surfaces in AC6 and must be documented in item-013 (README).

**Acceptance Criteria:**
- Given `dotnet run --project apps/AppHost`, when executed, then the Aspire dashboard starts and is reachable at its default port without errors.
- Given the ServiceDefaults project, when referenced by any .NET service project and `AddServiceDefaults()` is called, then OpenTelemetry tracing, metrics, and health check endpoints are configured automatically.
- Given the AppHost `Program.cs`, when inspected, then it contains at minimum a stub `builder.AddProject<Projects.Api>()` registration (even if the API project is a placeholder at this stage).
- Given `dotnet build` run at the solution root, then all projects (AppHost, ServiceDefaults, SharedKernel) compile successfully together.
- Given the Aspire dashboard is running, when a developer navigates to it in a browser, then they can see the registered service(s) and their health status.
- Given the developer setup instructions (item-013), when followed, then they include the prerequisite command `dotnet workload install aspire` and the note that a trusted HTTPS dev certificate (`dotnet dev-certs https --trust`) is required before the Aspire dashboard will load without browser security errors — and the developer implementing this item must verify this command works on their machine as part of marking this item done.

**Dependencies:** item-001 ✅ (in this sprint)

---

## Deferred (did not fit)

Items that were ready but didn't fit within the 6pt effective capacity:

- **item-014** — Scaffold backend xUnit test projects for SharedKernel and API (medium, 2pt) — will be first in next sprint; all dependencies (item-002, item-003) will be done at sprint end
- **item-004** — Scaffold ASP.NET Core Web API project wired to Aspire with OpenAPI (medium, 2pt) — depends on item-002 and item-003; ready once Sprint 1 closes
- **item-006** — Scaffold React Vite app with TypeScript, path aliases, ESLint, and Prettier (medium, 2pt) — depends only on item-001; ready once Sprint 1 closes

---

## Blocked (not ready)

Items that cannot be planned yet due to unresolved dependencies on non-done items:

- **item-005** — Implement Health Check vertical slice with unit and integration tests — unresolved dependency on item-004 (pending) and item-014 (pending)
- **item-007** — Configure Vitest and React Testing Library with a passing example test — unresolved dependency on item-006 (pending)
- **item-008** — Set up Storybook with a baseline Button component and story — unresolved dependency on item-006 (pending)
- **item-009** — Configure Playwright e2e suite with one smoke test — unresolved dependency on item-006 (pending)
- **item-015** — Configure CORS policy on the API for local React dev server — unresolved dependency on item-004 (pending) and item-006 (pending)
- **item-010** — Wire root orchestration scripts for single-command start and test — unresolved dependency on item-003, item-004, item-006, item-007, item-008, item-009 (all pending)
- **item-011** — Add .env.example with all required environment variables documented — unresolved dependency on item-004, item-006, item-015 (all pending)
- **item-012** — Add Docker Compose alternative local start for non-Aspire environments — unresolved dependency on item-004, item-011 (both pending)
- **item-016** — Add GitHub Actions CI pipeline running all test suites — unresolved dependency on item-010 (pending)
- **item-013** — Write README with Getting Started, prerequisites, and all dev commands — unresolved dependency on item-010, item-011, item-012, item-016 (all pending)

---

## Decision Log

All 5 pre-sprint architectural decisions have been resolved and locked into `backlog.json`:

| # | Decision | Resolution | Items Updated |
|---|----------|-----------|---------------|
| 1 | Folder convention: `apps/` vs `src/` | **`apps/`** — monorepo-conventional (Turborepo/Nx/pnpm style) | item-001, item-006, item-009 |
| 2 | OpenAPI tooling: Built-in .NET 9 vs Swashbuckle | **Built-in .NET 9 OpenAPI + Scalar UI** (`AddOpenApi()` / `MapOpenApi()`) — no Swashbuckle | item-004 |
| 3 | Playwright placement: `apps/web/e2e/` vs standalone `e2e/` | **`apps/web/e2e/`** — co-located with the React app; simpler for single frontend | item-009, item-013 |
| 4 | Docker Compose: Include or defer? | **Include** — reduces onboarding friction for non-Aspire contributors | item-012, item-013 |
| 5 | Dev cert docs: README only vs also in item-003 AC | **Option B** — AC added to item-003 AND documented in item-013 Prerequisites | item-003, item-013 |

---

## Backlog Summary After Planning

- **In-sprint:** 3 items, 6pt
- **Remaining pending:** 13 items, 25pt
- **Estimated sprints to clear backlog (at 6pt/sprint):** ~5 additional sprints (~6 total including this one)

---

## Notes for the Team

1. **item-001 gates everything** — complete it on Day 1 or Day 2 so item-002 and item-003 can run in parallel for the rest of the sprint.
2. **item-002 and item-003 are independent** once item-001 is done — assign them to different developers to run concurrently and maximise sprint throughput.
3. **item-003 has a machine prerequisite** — the implementer must have `dotnet workload install aspire` already installed (or install it as the first step). Budget ~15 minutes for workload install if not done.
4. **Dev cert reminder** — whoever implements item-003: run `dotnet dev-certs https --trust` before you start. If you skip this, the Aspire dashboard HTTPS will fail silently in the browser.
5. **Sprint 2 is fully loaded** — item-014, item-004, and item-006 (6pt total) will all be unblocked the moment this sprint closes. Prepare for a high-throughput Sprint 2.
