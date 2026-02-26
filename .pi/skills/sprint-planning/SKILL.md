---
name: sprint-planning
description: Sprint planning and backlog management — story point sizing, capacity calculation, priority ordering, dependency checking, and backlog schema. Load this when grooming a backlog, planning a sprint, or evaluating whether a body of work fits within a sprint.
---

# Sprint Planning & Backlog Management

## The Backlog File

Canonical paths come from `.pi/project.json` → `chronicle.artifacts`:
- `backlog_path` (default `.pi/chronicle/backlog.json`)
- `sprint_plan_path` (default `.pi/chronicle/sprint-plan.md`)
- `reports_dir` (default `.pi/chronicle/artifacts/reports`)
- `temp_dir` (default `.pi/chronicle/artifacts/tmp`)

Every agent that creates, updates, or reads work items must use the canonical backlog path. **Always read this file before making changes.** Always write back the complete file — never partial updates.

Never create duplicate planning files in root (e.g., `backlog.json`, `sprint-plan.md`). Non-application reports/scripts/temp files must live under reports/temp directories.

### Schema

```json
{
  "_version": 1,
  "_description": "Chronicle product backlog.",
  "items": [
    {
      "id": "item-001",
      "title": "Short, action-oriented title",
      "description": "What this is, why it matters, and what user/system goal it serves",
      "type": "feature|bug|chore|spike",
      "priority": 1,
      "size": "small|medium|large|xl",
      "points": 1,
      "status": "pending|in-sprint|in-progress|done|deferred|cancelled",
      "acceptance_criteria": [
        "Given [condition] when [action] then [outcome]"
      ],
      "dependencies": ["item-002"],
      "tags": ["auth", "api"],
      "source_session": "chronicle-session-id or description",
      "created_at": "ISO-8601 timestamp",
      "notes": "Anything that doesn't fit elsewhere"
    }
  ]
}
```

### Field Rules
- `id` — sequential, format `item-NNN`. Read the file first to find the next available number.
- `title` — verb phrase, 5–10 words: "Add email validation to registration form"
- `priority` — integer, 1 = highest. Re-number all items when inserting to maintain a clean sequence.
- `size` — one of: `small`, `medium`, `large`, `xl`. **Never plan `xl` items — they must be broken down.**
- `points` — derive from size using the project point scale: small=1, medium=2, large=3, xl=5
- `status` — lifecycle: `pending` → `in-sprint` → `in-progress` → `done`
- `dependencies` — list of item IDs that must be `done` before this item can start
- `acceptance_criteria` — 2–5 Given/When/Then statements. Required. Non-negotiable.

---

## Story Point Scale

| Size | Points | What it means |
|------|--------|---------------|
| **small** | 1 | Well-understood, contained change. One layer, no new entities, clear path. |
| **medium** | 2 | Moderate complexity. Touches 1–2 layers, might add a new field or method. |
| **large** | 3 | Significant work. Multiple layers, new entity or schema change, multiple acceptance criteria. |
| **xl** | 5 | Too large to plan. Must be broken into smaller items before entering the backlog. |

**Rule:** If you're unsure between two sizes, always choose the larger.

---

## Sprint Capacity

Sprint capacity is configured in `.pi/project.json` under `sprint`:

```json
"sprint": {
  "length_days": 10,
  "capacity_points": 8,
  "buffer": 0.2,
  "point_scale": { "small": 1, "medium": 2, "large": 3, "xl": 5 }
}
```

**Effective capacity** = `capacity_points × (1 - buffer)`

With defaults: `8 × 0.8 = 6.4` → **6 points** of actual planned work per sprint.

The buffer (default 20%) absorbs:
- Unplanned bug fixes
- Code review and revision cycles
- Deployment and environment issues
- Scope discoveries during implementation

**Never fill a sprint to 100% capacity.** Teams that do consistently miss.

### Typical Sprint Compositions

| Points | Example composition |
|--------|---------------------|
| 6 pts | 6 small items |
| 6 pts | 3 medium items |
| 6 pts | 2 large items |
| 6 pts | 1 large + 2 small items |
| 6 pts | 2 medium + 2 small items |

---

## Priority Ordering

Use **WSJF (Weighted Shortest Job First)** when in doubt:

```
Priority Score = (Business Value + Time Criticality + Risk Reduction) / Job Size
```

Higher score = do sooner.

### Practical Priority Rules

1. **Blockers first** — anything that blocks other high-value work
2. **User-facing value over infrastructure** — unless infrastructure blocks user value
3. **De-risk early** — if something is uncertain, do a spike first (size: small)
4. **Dependencies before dependents** — item A must be done before item B if B depends on A
5. **Bugs before features** — unless the bug is very low severity
6. **Short items over long items at equal value** — deliver value faster, get feedback sooner

### MoSCoW for Sprint Triage

When the backlog is large, classify items before selecting:

| Label | Meaning | Sprint inclusion |
|-------|---------|-----------------|
| **Must Have** | Sprint fails without this | Always include |
| **Should Have** | High value, not critical | Include if capacity allows |
| **Could Have** | Nice to have, low risk | Only if buffer allows |
| **Won't Have** | Not this sprint | Explicitly excluded |

---

## Dependency Resolution

Before finalizing a sprint, check dependency chains:

```
For each selected item:
  if item.dependencies is non-empty:
    for each dep_id in item.dependencies:
      if backlog[dep_id].status != "done":
        the dependency must ALSO be in this sprint (if it fits)
        or the dependent item must be deferred
```

Never include an item whose dependency is unresolved outside the sprint.

---

## Breaking Down Oversized Items

When an `xl` item or a vague requirement appears, decompose it using these patterns:

### Vertical Slice Decomposition
Cut by complete user-facing flow, not by technical layer:
```
❌ "Build the data model" + "Build the API" + "Build the UI"
✅ "User can create a draft post" + "User can publish a post" + "User can delete a post"
```

### Happy Path + Edge Cases
```
Item 1: [feature] happy path only (small/medium)
Item 2: [feature] error states and validation (small)
Item 3: [feature] edge cases and limits (small)
```

### Core + Enhancement
```
Item 1: [feature] core functionality (medium)
Item 2: [enhancement] advanced options/filters (small)
Item 3: [chore] performance optimization (small)
```

### Spike Before Build
When something is unknown:
```
Item 1: [spike] Research X and produce decision doc (small, 1pt)
Item 2: [feature] Implement X based on spike findings (medium, 2pt)
```

---

## Backlog Hygiene Rules

- **No item stays `pending` for more than 3 sprints** without being re-evaluated, split, or cancelled
- **No item enters `in-sprint` without acceptance criteria**
- **No item is `xl`** — if it is, break it down before writing it to the backlog
- **Deferred items** must have a `notes` field explaining why they were deferred
- **Cancelled items** stay in the file (for history) but are excluded from all planning
- **Done items** stay in the file (for history) and count toward velocity tracking
