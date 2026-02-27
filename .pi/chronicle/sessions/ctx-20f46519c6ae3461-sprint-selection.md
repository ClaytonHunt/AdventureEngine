
## Workflow: Sprint Planning — State: Sprint Selection
**Role:** Select highest-priority items up to effective sprint capacity, resolve dependencies, update item statuses to in-sprint, and write the sprint plan to .pi/chronicle/sprint-plan.md

## Workflow History
### State: Backlog Review [Backlog Manager] (21s)
**Task:** Plan the next sprint now. Review canonical backlog at `.pi/chronicle/backlog.json` with dependency-first lens and current context from grooming: items 006/008/009 should be done, and recommended next candidates were 010/016/011/013. Please validate backlog health (missing acceptance criteria, oversized items, stale items), confirm dependency ordering safety (especially 018 before 019), and provide final groomed recommendation for sprint selection within effective capacity (~6.4 points). No duplicate artifacts outside canonical paths.
**Summary:** User requested sprint planning; initiating backlog-review to validate latest backlog health and dependency-first readiness.

## Key Findings (carried from previous states)
- Backlog review found no missing acceptance criteria, no XL items, and no stale items.
- Item statuses confirm 006/008/009 are done.
- Dependency-safe next sprint recommendation remains: item-010 + item-016 + item-011 + item-013 (6 points).
- Item-019 must not be selected until item-018 is complete/verified.

## Pending Tasks (handed over from previous states)
- Run sprint-selection to finalize selected items within capacity, update statuses to in-sprint, and write `.pi/chronicle/sprint-plan.md`.
- Then run done state to present sprint goal and summary to user.

## Your Task
Create the sprint plan now from canonical backlog `.pi/chronicle/backlog.json` using dependency-first selection and effective capacity ~6.4 points. Context from backlog review: recommended set is item-010 (2), item-016 (2), item-011 (1), item-013 (1) = 6 points; item-019 must be deferred until item-018 completes. Please validate dependency constraints, select items up to capacity, update selected items to `in-sprint` in canonical backlog, and write `.pi/chronicle/sprint-plan.md` with sprint goal, selected items with rationale, sequence, deferred items/reasons, and capacity math.

## When You Are Done
End your response with a clear summary of:
- What you accomplished
- Key findings or decisions made
- Files created or modified (if any)
- Recommendations or blockers for the next step