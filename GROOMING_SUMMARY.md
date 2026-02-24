# Backlog Grooming Summary

**Project:** AdventureEngine — Full-Stack Web Application Scaffold
**Groomed:** 2026-02-23
**Status:** ✅ Ready for Sprint Planning

---

## 1. Executive Summary

This grooming session decomposed the raw requirements for a brand-new full-stack web application into a fully prioritised, dependency-mapped backlog.

| Metric | Value |
|---|---|
| Total backlog items | **16** |
| Total story points | **~31** |
| Largest single item | 3 pts (item-005) |
| Items at or under 2 pts | 15 of 16 |
| Items status | All `ready` |
| Parallel tracks available | Yes — backend + frontend after item-001 |

Two grooming passes were completed:

1. **Ingestion pass** — 13 items written (25 pts), two parallel tracks identified (backend items 001–005, frontend items 006–009).
2. **Health-review pass** — 3 new items added (item-014 xUnit scaffold, item-015 CORS, item-016 CI pipeline); acceptance criteria tightened across 6 items; dependency graph corrected; tags normalised. Final count: 16 items, ~31 pts.

---

## 2. Backlog at a Glance

| ID | Title | Pts | Priority | Tags |
|---|---|---|---|---|
| item-001 | Scaffold monorepo folder structure + root package.json | 2 | 1 | monorepo, scaffold, chore |
| item-002 | Create SharedKernel C# class library with DDD building blocks | 2 | 2 | backend, dotnet, architecture, ddd |
| item-003 | Set up .NET Aspire AppHost and ServiceDefaults | 2 | 3 | backend, dotnet, aspire, infrastructure |
| item-014 | Scaffold backend xUnit test projects and wire to solution | 2 | 4 | backend, dotnet, testing, xunit, dx |
| item-004 | Scaffold ASP.NET Core Web API wired to Aspire with OpenAPI | 2 | 5 | backend, dotnet, api, openapi, aspire |
| item-005 | Health Check vertical slice with unit + integration tests | 3 | 6 | backend, dotnet, vsa, architecture, testing |
| item-006 | Scaffold React Vite app with TypeScript, path aliases, ESLint, Prettier | 2 | 7 | frontend, react, vite, typescript, dx |
| item-007 | Configure Vitest + React Testing Library with passing example test | 2 | 8 | frontend, testing, vitest, rtl, tdd |
| item-008 | Set up Storybook with baseline Button component + story | 2 | 9 | frontend, storybook, ux, component |
| item-009 | Configure Playwright e2e suite with one smoke test | 2 | 10 | frontend, testing, e2e, playwright |
| item-015 | Configure CORS policy for React dev server ↔ ASP.NET API | 1 | 11 | backend, dotnet, cors, dx, frontend |
| item-010 | Wire root orchestration scripts for single-command start + test | 2 | 12 | dx, scripts, monorepo, testing, devops |
| item-011 | Add .env.example with all environment variables documented | 1 | 13 | dx, config, environment |
| item-012 | Add Docker Compose alternative local start *(optional)* | 2 | 14 | devops, docker, infrastructure, optional |
| item-016 | GitHub Actions CI pipeline (test + build on PR) | 2 | 15 | ci, devops, github-actions, testing |
| item-013 | Write README with Getting Started + dev commands | 1 | 16 | documentation, dx, readme |

> **Size guide:** 1 pt = trivial/config, 2 pts = standard feature, 3 pts = multi-layer feature with tests. No item exceeds the 8-pt cap.

---

## 3. Dependency Map

```
item-001  (monorepo root — no dependencies)
│
├── BACKEND TRACK
│   ├── item-002  (SharedKernel)
│   │   └── item-014  (xUnit test projects)  ← depends on 002, 003
│   ├── item-003  (Aspire AppHost + ServiceDefaults)
│   │   └── item-004  (ASP.NET Web API)       ← depends on 002, 003
│   │       └── item-005  (HealthCheck slice) ← depends on 004, 014
│
├── FRONTEND TRACK  (parallelisable with backend after item-001)
│   └── item-006  (React + Vite scaffold)
│       ├── item-007  (Vitest + RTL)           ← depends on 006
│       ├── item-008  (Storybook)              ← depends on 006
│       └── item-009  (Playwright e2e)         ← depends on 006
│
└── CONVERGENCE  (both tracks must be complete)
    ├── item-015  (CORS)                       ← depends on 004, 006
    ├── item-010  (orchestration scripts)      ← depends on 003, 004, 006,
    │                                              007, 008, 009, 015
    │   ├── item-011  (.env.example)           ← depends on 004, 006
    │   ├── item-012  (Docker Compose) ⚐opt   ← depends on 004, 011
    │   └── item-016  (GitHub Actions CI)      ← depends on 010
    └── item-013  (README)                     ← depends on 010, 011, 012
```

> ⚐ item-012 is marked **optional** — see Pre-Sprint Decision #4.

**Parallelisation opportunity:** After item-001 is merged, one developer can take the backend track (items 002 → 003 → 014 → 004 → 005) while a second developer takes the frontend track (items 006 → 007 → 008 → 009) simultaneously.

---

## 4. Sprint Planning Suggestions

> Assumed team velocity: **6 story points per sprint** (single developer).
> Adjust sprints proportionally for a two-person team (see note below).

### Single-developer plan (6 pts / sprint)

| Sprint | Items | Points | Notes |
|---|---|---|---|
| **Sprint 1** | item-001, item-002, item-003 | 6 | Foundation — monorepo + .NET skeleton |
| **Sprint 2** | item-014, item-004, item-006 | 6 | Test harness, API, React scaffold |
| **Sprint 3** | item-005, item-007, item-008 | 7 | First slice + frontend test tooling *(consider pulling item-007 to Sprint 2 if capacity allows)* |
| **Sprint 4** | item-009, item-015, item-010 | 5 | e2e, CORS, orchestration |
| **Sprint 5** | item-011, item-012, item-016, item-013 | 6 | Env config, Docker, CI, README |

**Total: 5 sprints, ~30 working days at 2 weeks/sprint.**

### Two-developer plan (parallelised)

| Sprint | Developer A (Backend) | Developer B (Frontend) | Combined pts |
|---|---|---|---|
| **Sprint 1** | item-001 (shared) | — | 2 |
| **Sprint 2** | item-002, item-003 (4) | item-006, item-007 (4) | 8 |
| **Sprint 3** | item-014, item-004 (4) | item-008, item-009 (4) | 8 |
| **Sprint 4** | item-005 (3) | item-015 (1) | 4 |
| **Sprint 5** | item-010, item-016 (4) | item-011, item-012, item-013 (4) | 8 |

**Total: 5 sprints collapses to ~3 sprints of meaningful parallel work.**

---

## 5. Pre-Sprint Decisions Required

The following decisions **must be made before the first ticket is picked up**. Recommended defaults are provided — confirm or override before sprint planning.

### Decision 1 — Folder convention: `apps/` vs `src/`

| Option | Description | Recommendation |
|---|---|---|
| `apps/web/` | Standard monorepo convention; room for `apps/api/` later | ✅ **Recommended** |
| `src/web/` | Simpler for small projects | Only if no plans for additional apps |

**Affects:** item-001, item-006, item-009.
**Action:** Agree and note in item-001's description before pickup.

---

### Decision 2 — OpenAPI tooling: Built-in .NET 9 vs Swashbuckle

| Option | Description | Recommendation |
|---|---|---|
| Built-in .NET 9 `Microsoft.AspNetCore.OpenApi` | Zero extra packages, supported by Microsoft | ✅ **Recommended** for .NET 9+ |
| Swashbuckle.AspNetCore | Mature, widely documented, richer UI | Choose if team is familiar |

**Affects:** item-004.
**Action:** Add the chosen NuGet package reference to item-004's description before pickup.

---

### Decision 3 — Playwright e2e placement: `apps/web/e2e/` vs standalone `e2e/` workspace

| Option | Description | Recommendation |
|---|---|---|
| `apps/web/e2e/` | Co-located with the app it tests; simpler imports | ✅ **Recommended** for a single frontend app |
| `e2e/` (root workspace) | Independent package; easier to add multi-app tests later | Choose if multi-app e2e is planned |

**Affects:** item-009, item-016 (CI path configuration).
**Action:** Record decision in item-009's description before pickup.

---

### Decision 4 — Docker Compose scope: in this release or deferred?

item-012 is currently tagged `optional`. It requires a working Dockerfile and adds ~2 pts to the final sprint.

| Option | Recommendation |
|---|---|
| **Include** — ship it as a convenience for contributors without Aspire | ✅ Recommended if open-source or multi-contributor |
| **Defer** — treat Aspire as the only local dev path for now | Acceptable for small internal teams |

**Action:** Stakeholder/team lead must decide before Sprint 4 planning.

---

### Decision 5 — One-time developer machine setup

This is not a backlog item — it is an onboarding prerequisite. Ensure every new contributor runs:

```bash
dotnet dev-certs https --trust
```

> Without this, the Aspire dashboard and the API HTTPS endpoint will fail on first launch.
> This step will be documented in the README (item-013) and in the Getting Started section.

---

## 6. Definition of Ready

Every item in this backlog satisfies the following criteria before it enters a sprint:

- [x] **Title** is clear and independently understandable
- [x] **Description** explains the what and why, not the how
- [x] **Acceptance Criteria** — minimum 3 concrete, testable statements (Given/When/Then or checklist)
- [x] **Size** is estimated in story points; no item exceeds 8 pts
- [x] **Dependencies** are listed by ID; no circular dependencies
- [x] **Priority** reflects foundations-first ordering (lower number = pick up sooner)
- [x] **Status** is `ready` — the item can be started without further clarification
- [x] **Tags** categorise the item for filtering (backend, frontend, testing, devops, etc.)

---

## 7. How to Read `backlog.json`

The backlog is stored as a JSON array in `backlog.json` at the repo root. Each item conforms to this schema:

```jsonc
{
  "id": "item-NNN",           // Unique identifier — never reuse or renumber
  "title": "...",             // One-line summary
  "description": "...",       // Full context; what and why
  "acceptanceCriteria": [     // Testable checklist; minimum 3 items
    "..."
  ],
  "size": 2,                  // Story points: 1 (trivial) → 8 (max)
  "priority": 1,              // Pick-up order: 1 = pick first
  "status": "ready",          // Lifecycle: ready | in-progress | done | deferred
  "tags": ["..."],            // Filter labels (see tag taxonomy below)
  "dependencies": ["item-NNN"] // IDs that must be done first; [] = no deps
}
```

### Tag taxonomy

| Tag | Meaning |
|---|---|
| `backend` | C# / .NET work |
| `frontend` | React / TypeScript work |
| `dotnet` | .NET-specific tooling |
| `testing` | Any test code or harness setup |
| `dx` | Developer Experience improvement |
| `architecture` | Structural / pattern decisions |
| `devops` | CI, Docker, deployment |
| `monorepo` | Workspace-level concerns |
| `optional` | Item is desirable but not blocking |

### Updating the backlog

- **Starting an item:** change `"status": "ready"` → `"status": "in-progress"`.
- **Completing an item:** change to `"status": "done"` — do not delete the item.
- **Adding a new item:** append to the array; assign the next sequential `item-NNN` ID; set `priority` relative to existing items.
- **Never renumber existing IDs** — other items reference them in `dependencies`.

---

## 8. Next Steps

### Immediately (before first commit)

1. **Resolve the 5 pre-sprint decisions** (Section 5) — record each outcome in the relevant item's description inside `backlog.json`.
2. **Confirm item-012 scope** with the team lead — in or out of this release.
3. **Schedule Sprint 1 planning** — items 001, 002, and 003 are ready to assign right now.

### Sprint 1 kick-off checklist

- [ ] Pre-sprint decisions 1–5 are recorded
- [ ] GitHub repository is created and all contributors have access
- [ ] `.NET SDK` (latest LTS), `Node.js` (LTS), `pnpm`, and `Docker Desktop` are installed on all dev machines
- [ ] `dotnet dev-certs https --trust` has been run on all dev machines
- [ ] item-001 is assigned and in-progress

### After sprint planning

- Update `"status"` fields in `backlog.json` as items move through the workflow.
- Use `backlog.json` as the single source of truth — keep it in sync with any task-tracker (GitHub Issues, Linear, etc.) if one is adopted.
- Review the backlog at the end of each sprint; reprioritise or split items as needed.
- The first pull request should deliver item-001 (monorepo scaffold) and unblock parallel backend + frontend work in Sprint 2.

---

*This summary was generated at the end of the backlog grooming workflow. The authoritative item data is in `backlog.json`.*

---

## Sprint 1 Status

**Status:** ✅ Planned — sprint is locked and items are ready to execute.
**Planned:** 2026-02-23

Sprint 1 has been fully planned. All 5 pre-sprint architectural decisions have been resolved and locked into `backlog.json`. Three items are selected for Sprint 1, totalling 6 effective story points (exactly at capacity).

**Selected items:**

| ID | Title | Points |
|---|---|---|
| item-001 | Scaffold monorepo folder structure + root `package.json` | 2 |
| item-002 | Create SharedKernel C# class library with DDD building blocks | 2 |
| item-003 | Set up .NET Aspire AppHost and ServiceDefaults | 2 |
| **Total** | | **6pt** |

**Sprint goal:** Establish the foundational monorepo skeleton, SharedKernel DDD primitives, and .NET Aspire orchestration layer so that every subsequent item has a stable, correctly-placed home and the walking skeleton is ready to receive the API and React frontend.

**Execution order:** item-001 is a hard gate and must merge before item-002 and item-003 start. Once item-001 is on `main`, item-002 and item-003 can be parallelised.

→ See **[SPRINT_1_PLAN.md](./SPRINT_1_PLAN.md)** for the full execution contract, acceptance criteria checklists, machine setup prerequisites, complete backlog roadmap, and risk register.
