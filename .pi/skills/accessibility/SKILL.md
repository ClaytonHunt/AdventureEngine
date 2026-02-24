---
name: accessibility
description: Web accessibility rules and WCAG 2.1 AA compliance guide. Load this skill when designing or reviewing UI components, forms, or user flows for accessibility compliance.
---

# Accessibility (WCAG 2.1 AA)

## The Four Principles (POUR)

1. **Perceivable** — Information must be presentable in ways users can perceive
2. **Operable** — UI components must be operable by all users
3. **Understandable** — Information and operation must be understandable
4. **Robust** — Content must be robust enough for assistive technologies

---

## Critical Requirements (AA)

### Color & Contrast
- Text contrast ratio: **4.5:1** minimum (3:1 for large text ≥18px or 14px bold)
- UI component contrast: **3:1** against adjacent colors
- Never use color as the **only** means of conveying information
- Provide pattern, icon, or text alongside color indicators

### Keyboard Navigation
- All interactive elements must be reachable and operable via keyboard
- Focus order must be logical (matches visual order)
- Visible focus indicator required (min 3:1 contrast, 2px offset)
- No keyboard traps (except intentional modal dialogs)
- Shortcut keys: provide a way to turn off or remap

### Images & Media
- Decorative images: `alt=""` (empty string, not missing)
- Informative images: descriptive `alt` text (describe the content, not "image of...")
- Complex images (charts, graphs): long description via `aria-describedby` or adjacent text
- Video: captions required; audio descriptions for visual-only content
- Auto-playing media: provide pause/stop control

### Forms
- Every input has a programmatically associated `<label>` (not just placeholder)
- Error messages: identify the field AND describe how to fix it
- Required fields: mark with `aria-required="true"` AND visible indicator
- Group related inputs: `<fieldset>` + `<legend>`
- Timeout warnings: give at least 20 seconds warning with option to extend

### Navigation & Structure
- Skip navigation link ("Skip to main content") as first focusable element
- Page `<title>` must be descriptive and unique per page
- Headings must be hierarchical (h1 → h2 → h3, no skipping)
- Landmark regions: `<header>`, `<main>`, `<nav>`, `<footer>`, `<aside>`
- Multiple `<nav>` elements must have distinct `aria-label`

### Dynamic Content
- Status messages must be announced without focus: `role="status"` or `aria-live`
- Loading states: announce via `aria-live="polite"` or `role="status"`
- Error messages: announce via `aria-live="assertive"` or `role="alert"`
- Page changes (SPA): update `<title>` and move focus to new content

---

## ARIA Usage Rules

### The ARIA First Aid Kit
```html
<!-- Button that looks like a link -->
<button type="button" class="link-style">Click me</button>

<!-- Icon button -->
<button aria-label="Close dialog">
  <svg aria-hidden="true">...</svg>
</button>

<!-- Toggle button -->
<button aria-pressed="false">Mute</button>

<!-- Expandable section -->
<button aria-expanded="false" aria-controls="panel-id">Show details</button>
<div id="panel-id" hidden>...</div>

<!-- Loading indicator -->
<div role="status" aria-live="polite">
  <span class="sr-only">Loading...</span>
</div>

<!-- Error message -->
<div role="alert" aria-live="assertive">
  Error: Please enter a valid email address.
</div>

<!-- Required input -->
<label for="email">Email <span aria-hidden="true">*</span></label>
<input id="email" type="email" aria-required="true" aria-describedby="email-error">
<span id="email-error" role="alert">Email is required</span>
```

### ARIA Rules
1. Use native HTML elements over ARIA when possible
2. Don't change native semantics unless necessary
3. All interactive ARIA controls must be keyboard operable
4. Don't use `role="presentation"` or `aria-hidden="true"` on focusable elements
5. Interactive elements must have accessible names

---

## Component Accessibility Checklist

### Modal Dialog
- [ ] `role="dialog"` with `aria-modal="true"`
- [ ] `aria-labelledby` pointing to dialog title
- [ ] Focus moves to dialog on open (first focusable element or dialog itself)
- [ ] Focus is trapped inside dialog
- [ ] Escape key closes dialog
- [ ] Focus returns to trigger on close

### Dropdown / Select
- [ ] Toggle button has `aria-expanded` and `aria-haspopup`
- [ ] List has `role="listbox"` or `role="menu"`
- [ ] Items have `role="option"` or `role="menuitem"`
- [ ] Arrow keys navigate options
- [ ] Enter/Space selects
- [ ] Escape closes and returns focus to trigger
- [ ] Selected item has `aria-selected="true"`

### Data Table
- [ ] `<table>` with `<caption>` or `aria-label`
- [ ] Column headers: `<th scope="col">`
- [ ] Row headers (if any): `<th scope="row">`
- [ ] Sortable columns: `aria-sort="ascending|descending|none"`
- [ ] Complex headers: `headers` attribute linking cells

### Tabs
- [ ] Tab list: `role="tablist"`
- [ ] Tabs: `role="tab"` with `aria-selected` and `aria-controls`
- [ ] Panels: `role="tabpanel"` with `aria-labelledby`
- [ ] Arrow keys navigate tabs (not Tab key)
- [ ] Tab key moves focus to panel content

---

## Testing Approach

### Automated (catches ~30% of issues)
- axe-core / @axe-core/react
- Lighthouse accessibility audit
- eslint-plugin-jsx-a11y

### Manual
1. **Keyboard-only test**: unplug mouse, navigate entire flow
2. **Screen reader test**: NVDA+Firefox (Windows), VoiceOver+Safari (Mac)
3. **Zoom test**: 200% browser zoom — no horizontal scroll, no content loss
4. **High contrast test**: Windows High Contrast mode
5. **Reduced motion test**: `prefers-reduced-motion: reduce`

---

## Screen Reader Quick Reference

| Action | NVDA (Windows) | VoiceOver (Mac) |
|---|---|---|
| Start/Stop | Ctrl+Alt+N | Cmd+F5 |
| Read all | Insert+Down | VO+A |
| Navigate headings | H | VO+Cmd+H |
| Navigate landmarks | D | VO+Cmd+L |
| Navigate links | K | VO+Cmd+L |
| Forms mode | Enter | VO+Shift+Down |
