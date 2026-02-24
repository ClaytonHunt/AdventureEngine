---
name: mvp-scoping
description: MVP and incremental delivery principles — vertical slices, INVEST criteria, scope sizing, and walking skeleton methodology. Load this skill when evaluating, scoping, or breaking down work before planning begins.
---

# MVP Scoping & Incremental Delivery

## The Core Problem This Solves
Large scopes produce large plans. Large plans produce large implementations. Large implementations produce large amounts of rework when requirements shift — and they always shift. The goal of scoping is to find the **smallest deliverable unit that produces real value and real learning**, then stop there.

---

## The MVP Principle

**Minimum Viable Product** is not "the smallest thing we can ship without embarrassment." It is:

> The smallest implementation that delivers a complete, testable, valuable outcome — and allows us to learn whether we built the right thing.

### MVP is NOT
- A prototype or throwaway spike
- A feature-incomplete version of the full vision
- "Let's just do the backend first"
- Everything in the spec but done faster

### MVP IS
- A **vertical slice**: works end-to-end through all layers
- **Shippable**: production-quality code, tests, no shortcuts
- **Learnable**: reveals whether the approach is correct
- **Bounded**: one user goal, one workflow, one outcome

---

## Vertical Slices vs Horizontal Layers

### ❌ Horizontal (layer-by-layer) — avoid
```
Sprint 1: Design all database schemas
Sprint 2: Build all API endpoints
Sprint 3: Build all UI components
Sprint 4: Wire everything together
```
**Problem**: Nothing works end-to-end until the very end. Rework in sprint 1 cascades to all later sprints.

### ✅ Vertical (feature-by-feature) — prefer
```
Sprint 1: User can log in with email/password (all layers)
Sprint 2: User can reset their password (all layers)
Sprint 3: User can log in with Google OAuth (all layers)
```
**Why**: Each slice is independently shippable and testable. Rework is contained to one slice.

---

## INVEST Criteria for a Well-Scoped Increment

Each unit of work should be:

| Letter | Criterion | Question to ask |
|--------|-----------|-----------------|
| **I** | Independent | Can this be built without another piece being done first? |
| **N** | Negotiable | Can scope be adjusted without losing the core value? |
| **V** | Valuable | Does a real user or system benefit when this is done? |
| **E** | Estimable | Can we predict roughly how long this will take? |
| **S** | Small | Can this be completed in one focused session or sprint? |
| **T** | Testable | Can we write a concrete acceptance test for it? |

If any criterion is "no," the scope needs adjustment.

---

## Size Heuristics

### A scope is **too large** if it:
- Touches more than 3–4 distinct areas of the codebase
- Requires more than one new data model or schema migration
- Involves building infrastructure AND features at the same time
- Has more than 5–6 acceptance criteria
- Would take more than 2 days of focused implementation
- Requires decisions from multiple teams or stakeholders
- Contains phrases like "and also," "plus," "as well as," "while we're at it"
- Cannot be described in a single sentence ending with a concrete user outcome

### A scope is **well-sized** if it:
- Can be summarized as: "A [user] can [do one thing] by [one interaction]"
- Touches one or two logical modules
- Has 2–4 acceptance criteria
- Requires no more than one new entity or one schema change
- Could realistically be reviewed, tested, and merged in a single session

### A scope is **too small** if it:
- Doesn't produce any user-visible or system-observable outcome
- Is purely internal (e.g., "rename some variables") — unless this is a dedicated refactor session
- Cannot be tested against real behavior

---

## The Walking Skeleton

For **new features or systems**, always start with a Walking Skeleton:

> A tiny, end-to-end implementation of the system that performs a small number of the required functions. It should link together the main architectural components and prove the seams between layers work.

### Example
Feature request: "Build a notification system that emails users when their order ships"

**Walking Skeleton (first increment):**
- Hardcoded trigger (no real event system)
- One email template (no dynamic content)
- No preferences, no unsubscribe, no logging
- Just: trigger → email sent → verifiable in test

**What it proves:** The email provider is integrated, the email renders, the trigger mechanism works.
**What it defers:** Event system, preferences, unsubscribe, templates, retry logic.

---

## Scope Breakdown Patterns

### "Thin First" Pattern
Build the thinnest version of the complete feature, then fatten it:
```
Increment 1: User can submit a form and see a success message (no validation)
Increment 2: Add field validation and error display
Increment 3: Add server-side validation and error codes
Increment 4: Add rate limiting and abuse protection
```

### "Happy Path First" Pattern
Build only the success path. Defer error handling, edge cases, and unusual inputs:
```
Increment 1: User can upload an image — happy path only
Increment 2: Reject invalid file types with clear error
Increment 3: Handle oversized files, network failures, partial uploads
```

### "One Actor First" Pattern
For multi-role systems, implement for one role completely before adding others:
```
Increment 1: Admin can manage products (full CRUD)
Increment 2: Editor can view and edit (but not delete) products
Increment 3: Viewer can browse products (read only)
```

### "Core Flow First" Pattern
For complex workflows, implement the primary flow without branching:
```
Increment 1: Standard checkout — card payment, in-stock items, domestic shipping
Increment 2: Add out-of-stock handling and backorder
Increment 3: Add international shipping and tax calculation
Increment 4: Add PayPal and alternative payment methods
```

---

## What to Explicitly Defer

When defining an increment, the **deferred list is as important as the in-scope list.** Be explicit about:

- Edge cases that are real but not blocking value delivery
- Secondary user roles or access levels
- Optional UX enhancements (animations, advanced filters, sorting)
- Observability and monitoring (add after happy path works)
- Performance optimization (measure first, optimize when you have data)
- Admin tooling (add after core feature proves itself)
- Internationalization and localization
- Mobile-specific behavior (if desktop works first)

---

## Acceptance Criteria Format

Each increment must have concrete, testable acceptance criteria:

```
Given [starting condition]
When [user action or system event]
Then [observable outcome]
```

### Examples
```
Given a registered user
When they submit the login form with correct credentials
Then they are redirected to the dashboard and see their name in the header

Given a registered user
When they submit the login form with incorrect credentials
Then they see "Invalid email or password" and remain on the login page
```

Avoid vague criteria like "the login works" or "it's fast" — these cannot be tested.

---

## Scope Creep Signals

Watch for these in a requirements description and flag them:

| Signal | Example |
|--------|---------|
| "While we're at it..." | "Add the search and while we're at it, add filters" |
| "Also..." | "Build the form, also add CSV export" |
| "And eventually..." | "Users can submit feedback and eventually we'll add sentiment analysis" |
| "Make it flexible for..." | "Build the config screen, make it flexible for all future settings" |
| "Full [X]" | "Build the full notification system" |
| "Proper [X]" | "Do proper authentication" |
| "Real [X]" | "Add a real caching layer" |

Each of these is a signal to split into separate increments.

---

## Definition of Done for a Single Increment

An increment is complete when:
- [ ] All acceptance criteria pass
- [ ] Unit tests written and passing
- [ ] No regressions in existing tests
- [ ] Code reviewed (or self-reviewed against reviewer checklist)
- [ ] Deployed to at least one environment beyond local
- [ ] The next increment is defined (even if not started)
