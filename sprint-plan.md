# Sprint Plan — Sprint 3 · 2026-02-25

## Sprint 3 Outcome — COMPLETE ✅

**Committed:** `52ef37d feat(api+web): Sprint 3 — health check VSA slice, RTL test harness, response compression`
**Tests:** 48 .NET (43 SharedKernel + 5 Api.Tests) · 3 frontend · **51 total · 0 failing**
**All 3 items delivered. All acceptance criteria met.**

| ID | Title | Points | Status |
|---|---|---|---|
| item-005 | Health Check VSA slice with unit + integration tests | 3 | ✅ done |
| item-007 | Configure Vitest + React Testing Library with passing component test | 2 | ✅ done |
| item-017 | Add `UseResponseCompression()` to API middleware pipeline | 1 | ✅ done |

**Notable decisions made in-sprint:**
- Global `JsonNamingPolicy.CamelCase` via `ConfigureHttpJsonOptions` (not per-property attributes)
- OTel filter upgraded to `StartsWithSegments("/health")` — covers `/health/live` + `/health/ready`
- `EnableForHttps = false` on compression — explicit BREACH attack mitigation

**Deferred to Sprint 4 (first pick: item-008):**
- `application/json`/`text/plain` duplicate in `ResponseCompressionDefaults.MimeTypes.Concat()` — low-priority comment clean-up
- Stale ProjectReference deferral comment in `Api.Tests.csproj` — low-priority comment clean-up
- Security response headers (`HSTS`, `X-Content-Type-Options`, `X-Frame-Options`) — tracked alongside item-015 CORS

---

**Capacity:** 8pt raw · 6pt effective (20% buffer · `8 × 0.8 = 6.4` → 6pt)
**Sprint Length:** 10 days
**Total Planned:** 6pt across 3 items

---

## Sprint Goal

> Establish the first full-stack test foundation — a tested API health slice proving the VSA pattern end-to-end, a verified React component test harness, and a production-ready response compression middleware.

**Sprint 3 is complete when:**
- `GET /health` returns HTTP 200 `{ "status": "healthy" }` from a self-contained `Features/HealthCheck/` slice ✅
- A `WebApplicationFactory<Program>` integration test and a pure unit test both pass via `dotnet test` ✅
- `pnpm --filter web test --run` renders a real RTL component test green via Vitest ✅
- `app.UseResponseCompression()` is wired in the API middleware pipeline with Brotli + Gzip ✅
- `dotnet test AdventureEngine.slnx` exits 0 — all tests green, zero regressions ✅

---

## Selected Items

| ID | Title | Size | Points | Priority | AC Summary | First Workflow |
|---|---|---|---|---|---|---|
| **item-005** | Health Check VSA slice with unit + integration tests | large | 3 | 7 | `GET /health` → 200 `{ "status": "healthy" }`; slice self-contained under `Features/HealthCheck/`; unit test (no server) + integration test via `WebApplicationFactory<Program>`; serves as documented VSA template | TDD red → green → refactor |
| **item-007** | Configure Vitest + React Testing Library with passing component test | medium | 2 | 8 | RTL packages added; `setupTests.ts` wires `@testing-library/jest-dom`; real component test with `toBeInTheDocument()`; coverage report generates clean | Add packages → write failing test → pass |
| **item-017** | Add `UseResponseCompression()` to API middleware pipeline | small | 1 | 10 | `UseResponseCompression()` called after `UseHttpsRedirection()`; Brotli + Gzip providers + `application/json` MIME type; `Accept-Encoding: gzip` response includes `Content-Encoding: gzip`; all existing tests still pass | Locate TODO comment → implement → verify |

**Total: 6pt / 6pt effective capacity**

---

## Recommended First Workflow

**Start with item-005 (Health Check VSA slice).**

Rationale:
1. **It is the sprint anchor** — 3 of the 6 points live here. Getting it green early de-risks the sprint.
2. **It unblocks the VSA template** — item-005's `Features/HealthCheck/` folder becomes the canonical reference for all future slices. The sooner it is written and reviewed, the sooner patterns are locked.
3. **It completes a lingering wiring task** — item-005 is where `Api.Tests` finally gets its `ProjectReference` to `apps/Api` and the `WebApplicationFactory<Program>` harness is configured (per Decision-010). Both item-004 and item-014 are done, so there are zero blockers.
4. **item-007 and item-017 are independent** — either can be picked up in parallel by a second developer, or sequentially after item-005 ships.

**Recommended execution order (single developer):** item-005 → item-007 → item-017

**Recommended execution order (two developers):** item-005 (Dev A) in parallel with item-007 + item-017 (Dev B)

---

## Item Detail

### item-005 — Health Check VSA slice with unit + integration tests

| Field | Value |
|---|---|
| **Type** | feature |
| **Size** | large |
| **Points** | 3 |
| **Priority** | 7 (sprint anchor) |
| **Status** | ✅ `done` |
| **Dependencies** | item-004 ✅ done · item-014 ✅ done |
| **Tags** | `backend`, `dotnet`, `vertical-slice`, `health-check`, `testing`, `template`, `architecture` |

**Description:**
Implement `Features/HealthCheck/` as the first full VSA vertical slice. The slice adds a dedicated `GET /health` endpoint (separate from the ServiceDefaults `/health/live` and `/health/ready` endpoints already present — this one demonstrates the VSA file layout). It includes the endpoint registration, a `HealthResponse` DTO, and a handler. This item also completes the `Api.Tests` ↔ `Api` wiring: add the `ProjectReference` to `apps/Api` and set up `WebApplicationFactory<Program>` for integration tests.

> **Key decisions in scope:**
> - **Decision-010 LOCKED:** The `ProjectReference` from `Api.Tests` → `Api` is added *in this item* — not item-014.
> - No MediatR. Endpoint calls handler directly. This is the canonical VSA template for all future slices.
> - A comment or `README.md` update in the slice folder explains the file layout convention.

**Acceptance Criteria:**

1. `GET /health` returns HTTP 200 with body `{ "status": "healthy" }` and `Content-Type: application/json`.
2. `Features/HealthCheck/` folder contains at minimum: endpoint registration, `HealthResponse` DTO, and co-located test(s) — no references to other feature folders.
3. A unit test verifies the handler returns the correct result without starting a web server.
4. An integration test uses `WebApplicationFactory<Program>` to call `GET /health` and asserts HTTP 200 + correct JSON body.
5. All tests pass via `dotnet test AdventureEngine.slnx` (exit code 0, zero regressions against the 44 existing tests).
6. `apps/Api.Tests/AdventureEngine.Api.Tests.csproj` now contains a `ProjectReference` to `apps/Api/AdventureEngine.Api.csproj`.

**Implementation notes:**
1. Add `<ProjectReference Include="..\..\apps\Api\AdventureEngine.Api.csproj" />` to `Api.Tests.csproj`.
2. Create `apps/Api/Features/HealthCheck/HealthCheckEndpoint.cs` — minimal endpoint with `app.MapGet("/health", ...)`.
3. Create `apps/Api/Features/HealthCheck/HealthResponse.cs` — simple record: `record HealthResponse(string Status)`.
4. Write `apps/Api.Tests/Features/HealthCheck/HealthCheckTests.cs` with both unit and integration test classes.
5. Use `WebApplicationFactory<Program>` — ensure `Program.cs` is accessible (add `public partial class Program {}` at end of `Program.cs` if needed).

---

### item-007 — Configure Vitest + React Testing Library with a passing component test

| Field | Value |
|---|---|
| **Type** | chore |
| **Size** | medium |
| **Points** | 2 |
| **Priority** | 8 |
| **Status** | ✅ `done` |
| **Dependencies** | item-006 ✅ done |
| **Tags** | `frontend`, `testing`, `vitest`, `react-testing-library`, `dx` |

**Description:**
Add `@testing-library/react` and `@testing-library/jest-dom` to `apps/web`, wire a `src/setupTests.ts` into `vitest.config.ts`, and write the first real component test. Vitest itself and `vitest.config.ts` (with `environment: jsdom` and root-level `resolve.alias` — Decision-012) were delivered by item-006. This item adds the RTL layer and proves the full render pipeline.

> **Prerequisite observation:** `@testing-library/react` and `@testing-library/jest-dom` are NOT yet in `apps/web/package.json` — they must be added as part of this item.
> **Decision-012 LOCKED:** `resolve.alias` must remain at the root level of `defineConfig`, not nested inside the `test:{}` block — nesting silently breaks `@/` imports in test files.

**Acceptance Criteria:**

1. `pnpm --filter web test --run` passes and exits 0.
2. `vitest.config.ts` is updated to include a `setupFiles` entry pointing to `src/setupTests.ts` (alongside existing `environment: 'jsdom'` and root-level `resolve.alias`).
3. `src/setupTests.ts` imports `@testing-library/jest-dom` to extend `expect` with DOM matchers.
4. The component test uses `render` and `screen` from `@testing-library/react` and asserts at least one `.toBeInTheDocument()` — not a trivial arithmetic assertion.
5. `@testing-library/react` and `@testing-library/jest-dom` are added to `apps/web/package.json` devDependencies and `pnpm-lock.yaml` is updated.
6. `pnpm --filter web test --coverage` generates a coverage report and exits 0.

**Implementation notes:**
1. `pnpm --filter web add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event`.
2. Create `apps/web/src/setupTests.ts` with `import '@testing-library/jest-dom'`.
3. Update `vitest.config.ts`: add `setupFiles: ['./src/setupTests.ts']` to the `test:{}` block.
4. Write `apps/web/src/App.test.tsx` — render `<App />` and assert the heading is visible (e.g. `screen.getByRole('heading')`).
5. Do NOT move `resolve.alias` inside `test:{}` — keep it at root scope (Decision-012).

---

### item-017 — Add `UseResponseCompression()` to API middleware pipeline

| Field | Value |
|---|---|
| **Type** | chore |
| **Size** | small |
| **Points** | 1 |
| **Priority** | 10 |
| **Status** | ✅ `done` |
| **Dependencies** | item-004 ✅ done |
| **Tags** | `backend`, `dotnet`, `performance`, `middleware` |

**Description:**
Wire `UseResponseCompression()` into the ASP.NET Core middleware pipeline in `apps/Api/Program.cs`. A `// TODO Sprint 3` comment already marks the exact insertion point (after `UseHttpsRedirection()`). Register `AddResponseCompression()` in the DI container with explicit Brotli + Gzip providers and `application/json` MIME type support.

> **Decision-013 LOCKED:** Deferred from Sprint 2 — the TODO comment in `Program.cs` is the canonical insertion point. Do not search for another location.

**Acceptance Criteria:**

1. `app.UseResponseCompression()` is called after `app.UseHttpsRedirection()` and before `app.MapDefaultEndpoints()`.
2. `builder.Services.AddResponseCompression()` is registered before `builder.Build()` with explicit Brotli and Gzip providers and `application/json` in the MIME type list.
3. A request with `Accept-Encoding: gzip` receives `Content-Encoding: gzip` in the response.
4. `dotnet build AdventureEngine.slnx` exits 0 with zero errors and zero warnings.
5. `dotnet test AdventureEngine.slnx` exits 0 — all existing tests pass, zero regressions.

**Implementation notes:**
1. Locate the `// TODO Sprint 3` comment in `apps/Api/Program.cs`.
2. Add `builder.Services.AddResponseCompression(options => { options.Providers.Add<BrotliCompressionProvider>(); options.Providers.Add<GzipCompressionProvider>(); options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(new[] { "application/json" }); });` before `var app = builder.Build();`.
3. Add `app.UseResponseCompression();` at the marked position (after `UseHttpsRedirection()`).
4. No new NuGet packages required — `Microsoft.AspNetCore.ResponseCompression` is included in the ASP.NET Core shared framework.

---

## Deferred Items

### item-008 — Set up Storybook with baseline Button component + story (2pt)

| Field | Value |
|---|---|
| **Size** | medium |
| **Points** | 2 |
| **Dependencies** | item-006 ✅ done |
| **Reason deferred** | Would put Sprint 3 at 8pt — one over the 6pt effective capacity cap. Fully sprint-ready; first pick for Sprint 4. |

**Sprint 4 note:** item-008 is the first item to pull into Sprint 4. It requires no re-grooming and has no outstanding blockers. The root `package.json` `storybook` script is currently an `echo` placeholder — item-008 is responsible for updating it to `pnpm --filter web storybook`.

---

## Sprint Horizon

### Sprint 4 (6pt) — Component catalogue + frontend integration

| ID | Title | Points | Unblocked by |
|---|---|---|---|
| item-008 | Set up Storybook with baseline Button + story | 2 | item-006 ✅ |
| item-009 | Configure Playwright e2e suite with one smoke test | 2 | item-006 ✅ |
| item-015 | Configure CORS policy for React dev server ↔ ASP.NET API | 1 | item-004 ✅ · item-006 ✅ |
| item-018 | Resolve minimatch@3.1.3 transitive CVE in ESLint dep chain | 1 | item-006 ✅ |

**Sprint 4 goal (draft):** Establish the component catalogue and e2e pipeline — Storybook live, Playwright smoke test green, CORS unblocking frontend↔API integration, and the audit-blocking CVE resolved.

---

### Sprint 5 (6pt) — Orchestration, CI, and docs

| ID | Title | Points | Unblocked by |
|---|---|---|---|
| item-010 | Wire root orchestration scripts for single-command start + test | 2 | item-007 ✅ S3 · item-008 S4 · item-009 S4 |
| item-011 | Add .env.example with all environment variables documented | 1 | item-004 ✅ · item-015 S4 |
| item-012 | Add Docker Compose alternative local start | 2 | item-004 ✅ · item-011 S5 |
| item-013 | Write README with Getting Started + dev commands | 1 | item-010 S5 · item-011 S5 · item-012 S5 · item-016 |

**Sprint 5 goal (draft):** Complete the developer experience — single-command start, documented environment variables, Docker Compose alternative, and the full README.

> **Note on item-016 (GitHub Actions CI, 2pt):** item-016 depends on item-010 and item-018 (both resolved by end of Sprint 4/5). It may slot into Sprint 5 or form the anchor of a Sprint 6. Evaluate at Sprint 5 planning.

---

## Definition of Done

Every item in this sprint must satisfy all of the following before status is changed to `done` in `.pi/chronicle/backlog.json`:

### Code Quality
- [x] Code compiles with zero errors and zero warnings (`dotnet build AdventureEngine.slnx` / `pnpm --filter web build` + `tsc --noEmit`)
- [x] No commented-out dead code committed to `main`
- [x] All public C# types/methods have XML doc comments; all exported TypeScript functions have JSDoc

### Testing
- [x] All acceptance criteria listed above are verifiably satisfied
- [x] `dotnet test AdventureEngine.slnx` exits 0 — all 44+ tests green, zero regressions
- [x] No new TypeScript or C# compiler warnings introduced

### Review
- [x] Code reviewed (self-review with checklist is acceptable for solo developer)
- [x] Commit message references item ID using Conventional Commits format (e.g. `feat(api): implement health check VSA slice (item-005)`)
- [x] Branch merged to `main` and working branch deleted

### Backlog Hygiene
- [x] Item `status` updated to `"done"` in `.pi/chronicle/backlog.json`
- [x] Any new decisions or findings recorded in the item's `notes` field
- [x] If a new locked decision was made, it is added to `_decisions_locked` in `.pi/chronicle/backlog.json`

### Sprint Goal Check (run at sprint end — not per item)
- [x] `GET /health` → HTTP 200 `{ "status": "healthy" }` with `Content-Type: application/json`
- [x] `dotnet test AdventureEngine.slnx` → all tests pass (44+ green)
- [x] `pnpm --filter web test --run` → RTL component test passes, exits 0
- [x] `pnpm --filter web test --coverage` → coverage report generates, exits 0
- [x] `dotnet build AdventureEngine.slnx` → zero errors, zero warnings
- [x] A request with `Accept-Encoding: gzip` to the API → response contains `Content-Encoding: gzip`

---

## Risks and Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | **`WebApplicationFactory<Program>` accessibility** — `Program` class may be `internal` or inaccessible in the test project | Low | High | Add `public partial class Program {}` at the bottom of `apps/Api/Program.cs` if `WebApplicationFactory<Program>` fails to compile. This is the standard .NET Minimal API workaround. |
| 2 | **`UseResponseCompression` ordering regression** — middleware order in ASP.NET Core is significant; inserting at wrong position could suppress compression or break existing health check assertions | Low | Medium | Insert *exactly* at the `// TODO Sprint 3` marker (after `UseHttpsRedirection()`, before `MapDefaultEndpoints()`). Run `dotnet test` immediately after — AC5 guards against regressions. |
| 3 | **RTL `@testing-library/jest-dom` type mismatch** — if `tsconfig.json` does not include the jest-dom type declarations, `toBeInTheDocument()` may fail TypeScript compilation even though the test runs | Low | Medium | Ensure `apps/web/tsconfig.app.json` includes `"@testing-library/jest-dom"` in `compilerOptions.types` or that `setupTests.ts` import is picked up via `include`. If types fail, add `/// <reference types="@testing-library/jest-dom" />` to `setupTests.ts`. |
| 4 | **Response compression breaks OpenAPI/Scalar UI** — in rare cases, compression middleware positioned before OpenAPI map handlers can cause issues with the Scalar UI static assets | Low | Low | If Scalar UI stops rendering after item-017, temporarily disable compression for the `/openapi/*` and `/scalar/*` routes using `options.ExcludedMimeTypes` or a custom predicate. This does not affect the sprint goal. |

---

## Backlog Summary After Sprint 3 Planning

| State | Items | Points |
|---|---|---|
| ✅ Done (Sprints 1–3) | 9 | 19pt |
| ⏳ Pending | 9 | 16pt |
| **Total** | **18** | **35pt** |

**Estimated sprints to clear backlog:** ~3 remaining after Sprint 3 (at 6pt/sprint for pending work)

### Full Roadmap

| Sprint | Items | Points | Focus |
|---|---|---|---|
| S1 ✅ | 3 | 6 | Monorepo foundation · SharedKernel DDD primitives · Aspire scaffold |
| S2 ✅ | 3 | 6 | Api.Tests scaffold · ASP.NET Core API + OpenAPI · React Vite scaffold |
| **S3 ✅** | **3** | **6** | **Health Check VSA slice + integration tests · Vitest + RTL · Response compression** |
| S4 | 4 | 6 | Storybook · Playwright e2e · CORS · CVE fix |
| S5 | 4 | 6 | Orchestration scripts · .env.example · Docker Compose · README |
| S6* | 1–2 | 2–3 | GitHub Actions CI + any overflow |

*Sprint 6 is provisional — item-016 (GitHub Actions CI, 2pt) may fold into Sprint 5 depending on velocity.

---

*Sprint 3 plan finalised: 2026-02-25*
*Sprint 3 completed: 2026-02-25*
*Authoritative item data: `.pi/chronicle/backlog.json`*
*Grooming artefacts: `SPRINT_PLANNING_HANDOFF.md`*
