---
name: design-system
description: Project design system rules — tokens, components, spacing, typography, and naming conventions. Load this skill when working on UI design or component specifications.
---

# Design System

## Design Tokens

### Color Palette
```
Primary:     #6366F1  (indigo-500)
Primary Dark:#4F46E5  (indigo-600)
Secondary:   #8B5CF6  (violet-500)
Success:     #10B981  (emerald-500)
Warning:     #F59E0B  (amber-500)
Error:       #EF4444  (red-500)
Info:        #3B82F6  (blue-500)

Surface:     #FFFFFF
Surface Alt: #F9FAFB  (gray-50)
Border:      #E5E7EB  (gray-200)
Text:        #111827  (gray-900)
Text Muted:  #6B7280  (gray-500)
Text Subtle: #9CA3AF  (gray-400)
```

### Spacing Scale (4px base)
```
xs:   4px   (0.25rem)
sm:   8px   (0.5rem)
md:   16px  (1rem)
lg:   24px  (1.5rem)
xl:   32px  (2rem)
2xl:  48px  (3rem)
3xl:  64px  (4rem)
```

### Typography
```
Font Family: Inter, system-ui, sans-serif
Code Font:   JetBrains Mono, monospace

Scale:
  xs:   12px / 1.4  — captions, labels
  sm:   14px / 1.5  — body small, helper text
  base: 16px / 1.6  — body default
  lg:   18px / 1.5  — body large, lead text
  xl:   20px / 1.4  — h4
  2xl:  24px / 1.3  — h3
  3xl:  30px / 1.2  — h2
  4xl:  36px / 1.1  — h1
  5xl:  48px / 1.0  — display

Weight: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
```

### Border Radius
```
sm:   4px   — inputs, small elements
md:   8px   — cards, buttons
lg:   12px  — panels, modals
xl:   16px  — large cards
full: 9999px — badges, pills, avatars
```

### Shadows
```
sm:  0 1px 2px rgba(0,0,0,0.05)
md:  0 4px 6px rgba(0,0,0,0.07)
lg:  0 10px 15px rgba(0,0,0,0.10)
xl:  0 20px 25px rgba(0,0,0,0.15)
```

---

## Core Components

### Button
States: default, hover, active, disabled, loading
Variants: primary, secondary, ghost, danger
Sizes: sm (h-8), md (h-10, default), lg (h-12)

Rules:
- Always show loading state when an async action is in progress
- Disabled buttons must have `aria-disabled="true"` AND `tabindex="-1"`
- Icon-only buttons require `aria-label`
- Destructive actions use the `danger` variant and require confirmation

### Input / Textarea
States: default, focus, error, disabled, read-only
Always include:
- Visible `<label>` (never placeholder-only)
- Error message with `role="alert"` and `aria-live="polite"`
- Helper text linked via `aria-describedby`
- `autocomplete` attribute where applicable

### Card
Use for: grouping related content, list items, data display
- Header (optional): title + optional action
- Body: main content
- Footer (optional): actions or metadata
- Never nest interactive cards inside interactive cards

### Modal / Dialog
- Trap focus inside when open
- Close on Escape key
- Return focus to trigger element on close
- Backdrop click closes non-critical dialogs
- Use `aria-modal="true"` and `role="dialog"` with `aria-labelledby`

### Toast / Notification
- Auto-dismiss after 5s (success/info) or persist (error/warning)
- Always provide manual dismiss
- Maximum 3 toasts visible at once (queue the rest)
- Position: top-right on desktop, top-center on mobile

---

## Layout Patterns

### Page Layout
```
Header (fixed, h-16)
  └─ Sidebar (w-64, collapsible on mobile)
  └─ Main content area (flex-1, min-w-0)
        └─ Page header (title + breadcrumbs + actions)
        └─ Content (p-6)
  └─ Optional right panel (w-80, for details/inspector)
```

### Grid System
- 12-column grid, 16px gutters
- Breakpoints: sm(640), md(768), lg(1024), xl(1280), 2xl(1536)
- Full-bleed sections use negative margins on mobile

---

## Naming Conventions

### Component Names
- PascalCase for components: `UserProfile`, `DataTable`, `SearchBar`
- Prefix with domain when ambiguous: `AuthLoginForm`, `BillingInvoiceList`

### CSS / Class Names
- BEM-inspired: `.component__element--modifier`
- Or Tailwind utility classes (project standard)

### File Structure
```
src/components/
  Button/
    Button.tsx
    Button.test.tsx
    Button.stories.tsx
    index.ts          ← re-exports Button
```

---

## Do Not
- Use color alone to convey meaning (pair with icon or text)
- Hardcode colors — always use design tokens
- Create new components without checking if one already exists
- Skip loading/error/empty states in component specs
- Use `<div>` for interactive elements — use semantic HTML
