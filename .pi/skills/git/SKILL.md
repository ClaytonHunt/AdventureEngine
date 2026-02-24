---
name: git
description: Project git conventions — commit format, branching strategy, what to stage, and PR guidelines. Load this skill whenever you write, modify, or commit code.
---

# Git Conventions

## When to Commit
- Commit after each **logical unit of work** — one fix, one feature, one refactor
- Never commit broken code (tests must pass, linter must be clean)
- Never commit secrets, API keys, `.env` files, or generated build artifacts
- Stage only intentional changes — review `git diff --staged` before committing

## Commit Message Format

This project uses **Conventional Commits** (https://www.conventionalcommits.org).

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

### Types
| Type | When to use |
|---|---|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `docs` | Documentation only changes |
| `chore` | Build process, dependency updates, tooling |
| `style` | Formatting, whitespace (no logic change) |
| `perf` | Performance improvement |
| `ci` | CI/CD configuration changes |
| `revert` | Revert a previous commit |

### Rules
- Summary line: max 72 characters, imperative mood ("add" not "added")
- Scope is optional but encouraged: `feat(auth): add OAuth2 support`
- Breaking changes: add `!` after type and `BREAKING CHANGE:` in footer
- Reference issues: `Closes #123` or `Fixes #456` in footer

### Examples
```
feat(auth): add OAuth2 login with Google

Implements the OAuth2 authorization code flow for Google sign-in.
Users can now click "Sign in with Google" on the login page.

Closes #89
```

```
fix(api): handle null response from payment gateway

The payment gateway occasionally returns null for declined cards.
Previously this caused an unhandled exception; now returns 402.

Fixes #112
```

```
refactor(users): extract user validation into separate module
```

```
feat!: change API response format to JSON:API spec

BREAKING CHANGE: All API responses now follow JSON:API format.
Clients must update their response parsing logic.
```

---

## Branching Strategy

### Trunk-Based Development (default)
- All development happens on `main` (or short-lived feature branches)
- Feature branches: `feature/<ticket>-short-description`
- Bug fix branches: `fix/<ticket>-short-description`
- Branches should be short-lived (1-3 days max)
- Merge via PR with at least one approval

### Branch Naming
```
feature/123-user-authentication
fix/456-null-pointer-in-payment
chore/update-dependencies
docs/api-reference-update
```

---

## What NOT to Commit
```gitignore
# Never commit these
.env
.env.local
*.env.*
node_modules/
dist/
build/
*.log
.DS_Store
coverage/
*.key
*.pem
```

---

## Git Operations Reference

```bash
# Check status
git status
git diff --staged

# Stage selectively
git add src/specific-file.ts
git add -p  # interactive staging

# Commit
git commit -m "feat(scope): summary"

# Amend last commit (before push)
git commit --amend --no-edit

# Create and switch branch
git checkout -b feature/123-my-feature

# Update from main
git fetch origin
git rebase origin/main

# Push
git push origin HEAD
git push --force-with-lease  # after rebase (safer than --force)
```
