# Sprint Plan — 2026-02-27

**Capacity:** 8pt total · 6.4pt effective (20% buffer)
**Sprint Length:** 10 days
**Total Planned:** 6pt across 4 items

---

## Sprint Goal
Establish reliable root-level developer/CI workflow orchestration and baseline onboarding documentation while keeping dependency flow unblocked for subsequent CI performance enforcement work.

## Sprint Items

### 1. item-010 — Wire root orchestration scripts for single-command start and test
**Type:** chore | **Size:** medium | **Points:** 2
**Description:** As a developer, implement root `package.json` scripts (`start`, `test`, `test:e2e`, `test:api`, `storybook`, `build`) so all key workflows run from repo root.

**Acceptance Criteria:**
- Given `pnpm start` at the repo root, when run, then the .NET Aspire AppHost and the React Vite dev server both start concurrently, each logging to the terminal with a distinguishable prefix, and a Ctrl+C stops both.
- Given `pnpm test` at the repo root, when run in CI (no watch mode, `--ci` flag passed to Vitest), then Vitest runs all frontend unit and component tests and exits with the correct code (0 on pass, non-zero on failure).
- Given `pnpm test:e2e` at the repo root, when run, then Playwright executes e2e tests and exits with the correct code.
- Given `pnpm test:api` at the repo root, when run, then `dotnet test` is invoked for all .NET test projects and exits with the correct code.
- Given `pnpm storybook` at the repo root, when run, then Storybook starts at port 6006 without errors.
- Given `pnpm build` at the repo root, when run, then both the Vite frontend production build and the .NET API `dotnet publish` complete successfully and exit 0.

**Dependencies:** item-003, item-004, item-006, item-007, item-008, item-009 (all resolved)

---

### 2. item-016 — Add GitHub Actions CI pipeline running all test suites
**Type:** chore | **Size:** medium | **Points:** 2
**Description:** Add `.github/workflows/ci.yml` for push/PR to `main`, running install, test, API test, and build.

**Acceptance Criteria:**
- Given a push or pull request to the `main` branch, when the GitHub Actions workflow runs, then it executes `pnpm install`, `pnpm test` (Vitest), and `pnpm test:api` (dotnet test) in sequence and fails the build if any step exits non-zero.
- Given the workflow file, when inspected, then it sets up both the Node.js runtime (matching `.nvmrc`) and the .NET SDK (matching the project's target framework) before running any commands.
- Given the CI run, when `pnpm test:api` executes, then the `dotnet test` command includes `--no-restore` and `--logger trx` to avoid redundant restores and produce a parseable test results file.
- Given the CI run, when all steps pass, then `pnpm build` (Vite production build) is also executed to verify the frontend compiles cleanly.
- Given the workflow, when inspected, then it caches the `pnpm store` and the `.nuget/packages` directories to reduce CI run time on subsequent runs.

**Dependencies:** item-010 (resolved in-sprint sequence)

---

### 3. item-011 — Add .env.example with all required environment variables documented
**Type:** chore | **Size:** small | **Points:** 1
**Description:** Add root `.env.example` documenting required env vars with safe defaults for successful local startup.

**Acceptance Criteria:**
- Given `.env.example` at the repo root, when inspected, then every environment variable consumed by any app in the monorepo is listed with an inline comment describing its purpose.
- Given `.env.example`, when a developer copies it to `.env` without changing any values, then `pnpm start` runs without crashing due to missing environment variables (i.e., all required vars have safe defaults).
- Given `.gitignore`, when inspected, then `.env` and `.env.local` are excluded but `.env.example` is tracked.
- Given the `.env.example` file, when inspected, then it includes at minimum: `VITE_API_BASE_URL`, `ASPNETCORE_ENVIRONMENT`, `ASPNETCORE_URLS`, `ASPNETCORE_HTTP_PORTS`, and `AllowedOrigins` (from item-015 CORS configuration).

**Dependencies:** item-004, item-006, item-015 (all resolved)

---

### 4. item-013 — Write README with Getting Started, prerequisites, and all dev commands
**Type:** chore | **Size:** small | **Points:** 1
**Description:** Author comprehensive root README for prerequisites, startup paths, scripts, and contributor onboarding.

**Acceptance Criteria:**
- Given the README, when read by a developer unfamiliar with the project, then the Prerequisites section lists all required tools with minimum versions: Node.js, pnpm, .NET SDK, .NET Aspire workload, Docker (optional), and includes the `dotnet dev-certs https --trust` command as a required one-time setup step.
- Given the README Getting Started section, when followed step-by-step from a fresh clone, then the developer can run `pnpm install && pnpm start` and have the app running within the documented steps.
- Given the README, when inspected, then it documents every root `package.json` script (`start`, `test`, `test:e2e`, `test:api`, `storybook`, `build`) with a one-line description of what each does.
- Given the README, when inspected, then it includes a project structure section showing the top-level folder layout and explaining the purpose of each major directory (`apps/`, `packages/`, `.github/`) — note: Playwright tests are co-located at `apps/web/e2e/`, not a top-level `e2e/` directory.
- Given the README, when inspected, then it has a dedicated section explaining when to use Aspire (`pnpm start`) vs Docker Compose (`docker compose up --build`) for local development.
- Given the README, when inspected, then it includes a link to or inline copy of the project Definition of Done for contributing developers.

**Dependencies:** item-010, item-011, item-012, item-016 (item-010/011/016 resolved in-sprint sequence; item-012 pending and makes this dependency unresolved for completion)

---

## Deferred (did not fit)
Items that were ready but didn't fit in capacity:
- None (selected ready items totaled 6pt within 6.4pt effective capacity)

## Blocked (not ready)
Items that cannot be planned yet:
- item-019 Enforce hard CI perf gates for startup, pipeline, and Storybook — reason: unresolved dependency on item-018 (and item-016/item-017 chain)
- item-012 Add Docker Compose alternative local start for non-Aspire environments — reason: not selected this sprint; dependency chain impact on item-013 completion

## Backlog Summary After Planning
- In-sprint: 9 items, 15pt
- Remaining pending: 3 items, 5pt
- Estimated sprints to clear backlog: ~1
