# AdventureEngine

> A full-stack adventure game engine built with React, ASP.NET Core, and .NET Aspire —
> architected around Vertical Slice Architecture, Clean Architecture, and Domain-Driven Design.

**Current status:** Sprint 1 complete — monorepo foundation, DDD base types, Aspire
orchestration. Sprint 2 (API + React app) in planning.

---

## Prerequisites

Install these tools before first run:

- Node.js 22 LTS
- pnpm 10+
- .NET SDK 10
- .NET Aspire workload (`dotnet workload install aspire`) for the primary path
- Docker Desktop / Docker Engine *(optional, for Compose fallback)*

One-time HTTPS trust setup:

```bash
dotnet dev-certs https --trust
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 · TypeScript · Vite *(Sprint 2)* |
| Backend API | ASP.NET Core · .NET 10 · OpenAPI *(Sprint 2)* |
| Orchestration | .NET Aspire 13.1.1 |
| Shared library | AdventureEngine.SharedKernel (DDD primitives) |
| Package manager | pnpm 10 (workspaces) |
| Test frameworks | xUnit 2.9.2 (backend) · Vitest *(Sprint 2)* · Playwright *(Sprint 3)* |
| Observability | OpenTelemetry (traces · metrics · logs) via OTLP |

---

## Getting Started

```bash
pnpm install
pnpm start
```

Primary local path uses Aspire AppHost.

### Aspire vs Docker Compose

Use **Aspire** when you have the Aspire workload installed and want full orchestration + dashboard:

```bash
pnpm start
```

Use **Docker Compose fallback** when Aspire is unavailable (Linux/constrained environments):

```bash
pnpm run start:compose
```

Stop/repro cleanly:

```bash
pnpm run stop:compose
```

Compose maps API to `http://localhost:7001` and uses `.env.example` defaults (safe non-secret placeholders).
Run web dev server separately when using compose:

```bash
pnpm --filter web dev
```

---

## Root Commands (canonical wrappers)

Use repository root commands as the single command contract for local dev and CI:

```bash
pnpm start                 # run AppHost (Aspire path)
pnpm run start:compose     # docker compose fallback local start
pnpm run stop:compose      # docker compose teardown
pnpm test                  # web tests
pnpm test:e2e              # playwright e2e
pnpm test:api              # dotnet tests with trx logger
pnpm storybook             # storybook dev server
pnpm build                 # web production build
pnpm run ci:build          # CI build wrapper
pnpm run ci:test           # CI test wrapper (web + api)
pnpm run ci:verify         # lockfile + build + tests wrapper
```

These wrappers use fixed script mappings (no dynamic command interpolation) and are the
canonical source referenced by CI and docs to avoid drift.

---

## Project Structure

- `apps/` — runnable applications
  - `apps/AppHost/` — .NET Aspire orchestration host
  - `apps/Api/` — ASP.NET Core API
  - `apps/Api.Tests/` — API integration/unit tests
  - `apps/web/` — React app
  - `apps/web/e2e/` — Playwright tests (co-located)
- `packages/` — shared libraries
  - `packages/SharedKernel/` — DDD primitives
  - `packages/ServiceDefaults/` — Aspire/OpenTelemetry defaults
- `.github/` — CI workflows and automation

---

## Environment Variables

Copy `.env.example` to `.env.local` when needed. Template includes safe defaults and no secrets.

Key variables:

- `VITE_API_BASE_URL` (default `https://localhost:7001` for Aspire; use `http://localhost:7001` for compose)
- `ASPNETCORE_ENVIRONMENT`
- `ASPNETCORE_URLS`
- `ASPNETCORE_HTTP_PORTS`
- `AllowedOrigins__0`

---

## Troubleshooting & Safe Logging

When sharing logs in issues/PRs:

- Redact tokens, API keys, connection strings, cookies, and authorization headers.
- Do not paste `.env.local`, user-secrets, or full Aspire dashboard URLs with session tokens.
- Prefer sanitized snippets that include only the failing command + error summary.

Common local checks:

```bash
pnpm run ci:verify
dotnet test AdventureEngine.slnx --no-build -c Release --logger trx --results-directory ./TestResults
curl http://localhost:7001/health
```

---

## Definition of Done (Contributor Summary)

A change is done when:

- Root wrapper commands run successfully and match CI/docs contract.
- Tests pass (`pnpm test`, `pnpm test:api`, and relevant e2e/unit scope).
- Build passes (`pnpm build` and/or affected .NET build/publish).
- No secrets are committed; `.env.example` remains placeholders/safe defaults only.
- Docs are updated for changed developer workflows.
