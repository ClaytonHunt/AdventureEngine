# Contributing to AdventureEngine

## Prerequisites

Before starting development, ensure the following are installed and configured on your machine.

### Required Tools

| Tool | Version | Install |
|------|---------|---------|
| .NET SDK | 10.0 (latestPatch) | https://dot.net |
| Node.js | 22 LTS | https://nodejs.org or `nvm install 22` |
| pnpm | 10+ | `npm install -g pnpm` or `corepack enable && corepack prepare pnpm@latest --activate` |
| Docker Desktop | latest | https://docker.com *(required from Sprint 5 — item-012)* |

> **Note:** The .NET Aspire workload is **not required** on .NET 10+. Aspire ships via NuGet
> packages directly (`Aspire.AppHost.Sdk`, `Aspire.Hosting.AppHost`). No workload install needed.

### One-Time Machine Setup

#### 1. HTTPS Dev Certificate (required for .NET Aspire dashboard)

```bash
dotnet dev-certs https --trust
```

> ⚠️ **Why is this needed?** The .NET Aspire dashboard runs on HTTPS by default. Without a
> trusted local certificate, the browser will show a security error and block the dashboard.
> Run this command **once per machine**.
>
> ⚠️ **Corporate / managed machines:** If you do not have admin rights to trust the certificate,
> use [mkcert](https://github.com/FiloSottile/mkcert) as an alternative, or ask your IT team
> to trust the .NET development root certificate.

#### 2. Install dependencies

```bash
# From repo root — installs Node workspace packages and generates pnpm-lock.yaml
pnpm install

# Restore NuGet packages for all .NET projects
dotnet restore
```

---

## Local Development Ports

| Service | Port | Protocol | Notes |
|---------|------|----------|-------|
| .NET Aspire Dashboard | 15888 | **HTTPS** | Protected by browser session token (dev only — never expose externally) |
| API (HTTP) | 5000 | HTTP | Available from Sprint 2 (item-004) |
| API (HTTPS) | 5001 | HTTPS | Available from Sprint 2 (item-004) |
| Vite Dev Server | 5173 | HTTP | Available from Sprint 2 (item-006) |
| Storybook | 6006 | HTTP | Available from Sprint 3 (item-008) |

> **Security note:** The Aspire dashboard is **development-only** and is automatically protected
> by a browser session token generated at startup. It must **never** be bound to a non-loopback
> network interface. Do not use `--urls 0.0.0.0:15888`.

---

## Running the Application

```bash
# Start the .NET Aspire AppHost (Sprint 1 — dashboard only, no services registered yet)
dotnet run --project apps/AppHost

# Full stack start (available from Sprint 2 — item-010):
pnpm start
```

---

## Running Tests

```bash
# All backend tests (build + test)
dotnet test AdventureEngine.slnx

# Backend tests — CI mode (TRX output for test reporting, requires prior build)
dotnet test AdventureEngine.slnx --no-build -c Release \
  --logger trx \
  --results-directory ./TestResults

# Via pnpm (alias for the dotnet test command above):
pnpm test:api

# Frontend unit + component tests (available from Sprint 2 — item-007):
pnpm test

# E2E tests (available from Sprint 3 — item-009):
pnpm test:e2e
```

---

## Component File Structure (Frontend — Sprint 2+)

When adding UI components in `apps/web/src/components/`, follow this structure:

```
src/components/
  Button/
    Button.tsx          ← component implementation
    Button.test.tsx     ← Vitest + React Testing Library unit test
    Button.stories.tsx  ← Storybook story
    index.ts            ← re-export: export { Button } from './Button'
```

---

## Security Notes

- **Never commit** `appsettings.*.json` (except the base `appsettings.json`)
- **Never commit** `.env`, `.env.local`, or any `.env.*` files
- **Never commit** `launchSettings.json`
- **Never commit** user secrets (`~/.microsoft/usersecrets/` or `%APPDATA%\Microsoft\UserSecrets\`)
- **Never expose** the Aspire dashboard on a non-loopback network interface
- Run `dotnet list package --vulnerable` periodically to check for CVEs in NuGet dependencies
- Run `pnpm audit` periodically to check for CVEs in npm dependencies
