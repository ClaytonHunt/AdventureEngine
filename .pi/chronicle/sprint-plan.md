# Sprint Plan — 2026-02-26

**Capacity:** 8pt total · 6.4pt effective (20% buffer)
**Sprint Length:** 10 days
**Total Planned:** 6pt across 3 items

---

## Sprint Goal
Unblock the frontend-to-CI dependency chain by delivering the foundational web scaffold, Storybook baseline, and Playwright smoke coverage required for root orchestration and downstream CI/performance work.

## Sprint Items

### 1. item-006 — Scaffold React Vite app with TypeScript, path aliases, ESLint, and Prettier
**Type:** chore | **Size:** medium | **Points:** 2
**Description:** As a frontend developer, establish the `apps/web` React+Vite TypeScript foundation with aliasing and lint/format standards so all downstream frontend and automation work can proceed.

**Acceptance Criteria:**
- Given `pnpm --filter web dev` (or `pnpm start` at the root), when executed, then the Vite dev server starts and `http://localhost:5173` (or configured port) serves the React app without errors.
- Given a TypeScript file that uses the `@/` path alias, when Vite builds and TS language server resolves it, then imports resolve in both `vite.config.ts` and `tsconfig.json`.
- Given `pnpm --filter web lint`, when run, then ESLint reports zero errors on fresh scaffold.
- Given Prettier config exists, when running `prettier --check .`, then files pass formatting checks.
- Given `pnpm --filter web build`, when run, then production bundle is produced with zero TS compilation errors.

**Dependencies:** item-001 (already in-sprint, prerequisite available)

---

### 2. item-008 — Set up Storybook with a baseline Button component and story
**Type:** chore | **Size:** medium | **Points:** 2
**Description:** Configure Storybook in `apps/web` with baseline component stories to establish component-catalog workflow and enable downstream root script wiring/perf instrumentation.

**Acceptance Criteria:**
- Given `pnpm --filter web storybook` (or `pnpm storybook`), when run, then Storybook starts at default port 6006.
- Given `Button` and `Button.stories.tsx`, when viewed, then at least `Default` and `Disabled` stories render without console errors.
- Given story files, when inspected, then stories are co-located and use CSF3 syntax.
- Given `pnpm --filter web build-storybook`, when run, then static build completes to `storybook-static/` with exit code 0.
- Given Storybook config, when inspected, then Vite builder and `@/` alias resolution are configured.

**Dependencies:** item-006 (selected in this sprint; dependency resolved in-sequence)

---

### 3. item-009 — Configure Playwright e2e suite with one smoke test
**Type:** chore | **Size:** medium | **Points:** 2
**Description:** Add co-located Playwright e2e smoke coverage for the web app to validate rendering pipeline and unlock root command orchestration + CI follow-on work.

**Acceptance Criteria:**
- Given `pnpm test:e2e`, when run against running app, then smoke test executes and exits 0.
- Given smoke test execution, when page loads, then visible `<h1>` heading assertion passes using locator-based wait.
- Given Playwright config, when inspected, then `baseURL` is env-driven with default `http://localhost:5173`.
- Given CI headless environment, when tests run, then Chromium headless project executes without browser install prompts.
- Given test failure, when reported, then screenshot + trace are saved under `apps/web/test-results/`.

**Dependencies:** item-006 (selected in this sprint; dependency resolved in-sequence)

---

## Dependency Sequence (execution workflow)
1. **item-006** → establish `apps/web` foundation and alias/tooling.
2. **item-008** + **item-009** (parallelizable after item-006 completes) → unblock **item-010** root orchestration scripts.
3. Next-sprint chain enabled by this sprint: **item-010** → **item-016** → (**item-017**, **item-018**) → **item-019**.

## Deferred (did not fit)
Ready items not planned due to effective capacity limit:
- item-010 Wire root orchestration scripts for single-command start and test (medium, 2pt) — blocked from fit after selecting highest-priority unblock trio; first candidate next sprint.
- item-011 Add .env.example with all required environment variables documented (small, 1pt) — fits only if 1pt slack existed; queued after item-010 because orchestration dependencies dominate.
- item-012 Add Docker Compose alternative local start for non-Aspire environments (medium, 2pt) — lower dependency leverage than orchestration chain in this sprint.
- item-013 Write README with Getting Started, prerequisites, and all dev commands (small, 1pt) — documentation should follow completed implementation items.

## Blocked (not ready)
Items not plannable this sprint due to unresolved dependency chain (not readiness quality issues):
- item-017 Spike and define strict CI performance budgets — unresolved dependency on item-010 and item-016.
- item-018 Instrument startup and Storybook timing checks for CI — unresolved dependency on item-010 and item-017 (and item-008 completion).
- item-016 Add GitHub Actions CI pipeline running all test suites — unresolved dependency on item-010.
- item-019 Enforce hard CI perf gates for startup, pipeline, and Storybook — unresolved dependency on item-016, item-017, and item-018.

## Backlog Summary After Planning
- In-sprint: 8 items, 15pt (including previously in-sprint items)
- Remaining pending: 7 items, 12pt
- Estimated sprints to clear pending backlog at 6.4pt effective: ~2
