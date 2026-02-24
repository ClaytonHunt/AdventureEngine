---
name: conventional-commits
description: Detailed Conventional Commits specification — types, scopes, breaking changes, and tooling. Load this when writing commit messages or setting up commit tooling.
---

# Conventional Commits Specification

Reference: https://www.conventionalcommits.org/en/v1.0.0/

## Full Specification

```
<type>[optional scope][optional !]: <description>

[optional body]

[optional footer(s)]
```

## All Types

| Type | Description | Triggers version bump |
|---|---|---|
| `feat` | New feature | Minor (1.x.0) |
| `fix` | Bug fix | Patch (1.0.x) |
| `BREAKING CHANGE` | Breaking API change | Major (x.0.0) |
| `build` | Build system or external dependencies | No |
| `chore` | Maintenance tasks, no production code | No |
| `ci` | CI configuration files and scripts | No |
| `docs` | Documentation only | No |
| `perf` | Performance improvement | No |
| `refactor` | Neither bug fix nor feature | No |
| `revert` | Revert a previous commit | No |
| `style` | Formatting, missing semicolons, etc. | No |
| `test` | Adding or correcting tests | No |

## Scope Guidelines
Scope is the part of the codebase affected:
- Use component names: `feat(auth)`, `fix(dashboard)`, `refactor(api)`
- Use layer names: `feat(domain)`, `fix(infrastructure)`  
- Keep scopes consistent across the project
- Omit scope if the change is truly cross-cutting

## Breaking Changes
Two ways to mark a breaking change:

**Method 1 — `!` shorthand:**
```
feat(api)!: change endpoint response format
```

**Method 2 — footer:**
```
feat(api): change endpoint response format

BREAKING CHANGE: The /users endpoint now returns { data: User[] }
instead of User[]. Update all clients accordingly.
```

## Multi-paragraph body
```
fix(payment): retry failed transactions up to 3 times

Previously, any payment gateway timeout resulted in an immediate
failure. This caused unnecessary order cancellations during periods
of high gateway load.

The retry logic uses exponential backoff: 1s, 2s, 4s delays.
Network errors and 5xx responses trigger retries. 4xx responses
(invalid card, insufficient funds) do not retry.

Closes #234
Reviewed-by: Alice <alice@example.com>
```

## Tooling

### commitlint config (`commitlint.config.js`)
```js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor',
      'perf', 'test', 'chore', 'revert', 'ci', 'build'
    ]],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [1, 'always', 100]
  }
};
```

### CHANGELOG generation
```bash
# Using standard-version
npx standard-version

# Using release-please (GitHub Actions)
# Automatically creates release PRs based on conventional commits
```
