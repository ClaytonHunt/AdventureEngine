# AdventureEngine

> A full-stack adventure game engine built with React, ASP.NET Core, and .NET Aspire —
> architected around Vertical Slice Architecture, Clean Architecture, and Domain-Driven Design.

**Current status:** Sprint 1 complete — monorepo foundation, DDD base types, Aspire
orchestration. Sprint 2 (API + React app) in planning.

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

## Root Commands (canonical wrappers)

Use repository root commands as the single command contract for local dev and CI:

```bash
pnpm start         # run AppHost
pnpm run ci:build  # web build wrapper
pnpm run ci:test   # web + api tests wrapper
pnpm run ci:verify # lockfile + build + tests wrapper
```

These wrappers use fixed script mappings (no dynamic command interpolation) and are the
canonical source referenced by CI and docs to avoid drift.

---

## Architecture

AdventureEngine uses **Vertical Slice Architecture** as its primary organising principle,
wrapping **Clean Architecture** layer boundaries and **DDD** tactical patterns.

## Troubleshooting & Safe Logging

When sharing logs in issues/PRs:

- Redact tokens, API keys, connection strings, cookies, and authorization headers.
- Do not paste `.env.local`, user-secrets, or full Aspire dashboard URLs with session tokens.
- Prefer sanitized snippets that include only the failing command + error summary.

---

## Docker / Compose (dependency-gated)

> **Status:** Partial documentation only. Full Docker Compose guidance depends on **item-012**.
> Until item-012 is complete, treat Compose setup as unavailable/incomplete.

Use native local tooling for now (`pnpm`, `dotnet`, Aspire AppHost).
A full Compose workflow section will be added once item-012 lands.
