# Health Check Endpoint Runbook

## Endpoint contract
- Route: `GET /health`
- Purpose: lightweight **liveness** signal for API process reachability.
- Behavior:
  - `200 OK` with `{ "status": "healthy" }`
  - `503 Service Unavailable` with `{ "status": "unhealthy" }`
- Response schema is fixed/sanitized and must not expose exception details, stack traces, hostnames, versions, or dependency diagnostics.

## Ownership and throttling
- **Decision:** `/health` throttling is owned by **ingress/gateway** in this sprint.
- Application code intentionally does **not** add `/health`-specific rate limiting middleware to avoid dual ownership.
- Staging verification evidence required before release:
  1. Ingress config snippet showing explicit `/health` throttle rule.
  2. Probe/load check demonstrating throttle enforcement at ingress.

## Operational notes
- Keep `/health` O(1): no DB calls, no network calls, no file I/O.
- Successful probes should remain low-noise in logs.
- Failures should be logged in a sanitized form only.
