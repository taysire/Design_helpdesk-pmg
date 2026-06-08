# PMG Helpdesk Design System

Design foundations + UI kit for **PMG's internal IT helpdesk** — a ServiceNow-style ticketing system built in-house for our team.

> ⚠️ This system was bootstrapped from a single logo file and a written description of the product scope. No existing codebase, Figma, or brand guidelines were provided. Treat colors, type and tone as a **proposed** starting point — flag anything for revision and we'll iterate.

---

## 1. Context

PMG is an internal team building a help-desk / ticketing tool to replace ServiceNow. The platform handles:

| Category | Examples |
|---|---|
| **Incidents** | Application outages, system-down events, security flags |
| **Technical support** | In-house apps, day-to-day issues |
| **Hardware** | Printers, computers, scanners |
| **Infrastructure** | AVD (Azure Virtual Desktop) sessions |
| **Pharmacy systems** | Telus Health KROLL |
| **Requests** | Materials, access (apps, drives, distribution lists) |
| **People ops** | Onboarding, offboarding |

**Integrations** (target):
- **Jira** — every report creates a linked Jira ticket; bidirectional status sync.
- **Slack** — DM the reporter on status changes; channel notifications for P1/P2.

**Source materials used to bootstrap this system**
- `uploads/logo_files-1779393995889.png` — primary logo (small PNG, dark variant).

**Materials still needed from the user**
- Vector logo (SVG / AI / EPS).
- Brand colors (if defined elsewhere).
- Real font license / preferred typeface — `Hanken Grotesk` is a placeholder.
- Screenshots of any internal tools the team likes/dislikes for visual cues.
- Sample tickets / category list / SLA tiers for richer content.

---

## 2. Content fundamentals

Voice = **calm, competent, lowercase-friendly, no jargon.** Internal IT helpdesks fail when they feel bureaucratic. We write like a helpful coworker, not a service portal.

### Voice principles

- **You, not the user.** Speak to the requester directly: *"We've got your ticket"* not *"User INC0012 has been logged."*
- **We, not the system.** PMG IT is a team. *"We'll take a look this afternoon."* > *"The ticket has been assigned."*
- **Plain words.** Say "computer," not "endpoint." Say "can't log in," not "authentication failure."
- **Sentence case everywhere.** Buttons, headers, nav. Never Title Case. Never ALL CAPS except for the `.eyebrow` style and ticket prefixes (`INC-`, `REQ-`).
- **Active voice, present tense.** *"KROLL is down on the pharmacy floor"* > *"KROLL has been reported as having been down…"*
- **No filler words.** "Just," "simply," "easily" are banned — they sound condescending in IT support.
- **One emoji max, only in conversational surfaces** (Slack mirror, comments). Never in nav, buttons, status badges, or tables. Most surfaces use zero.

### Example copy

| Surface | ✅ Use | ❌ Avoid |
|---|---|---|
| New ticket CTA | `Report something` | `Submit a new incident form` |
| Empty state | `Nothing on your plate. Nice.` | `No active records found.` |
| Status: in progress | `We're on it` | `Status: IN_PROGRESS` |
| Resolution message | `Fixed. The printer's back online — sorry for the wait.` | `Issue resolved. Please confirm closure.` |
| Error toast | `Couldn't save. Try again in a sec.` | `An unexpected error has occurred.` |
| Confirm dialog | `Close this ticket?` | `Are you sure you want to perform this action?` |

### Casing & punctuation

- **Sentence case** for all UI labels and headings.
- **Title Case** only for proper nouns (Jira, Slack, KROLL, AVD).
- **No trailing periods** in buttons, badges, single-line cards, or table cells.
- **Periods** in toast bodies, dialog descriptions, and any prose >1 sentence.
- **Em-dashes** for tone shifts. **En-dashes** for ranges (`Mon–Fri`).
- **Numbers under 10** spelled out in prose (`three printers`), digits in tables and metadata.

### Ticket terminology

- A user **reports** something → it becomes a **ticket** → assigned to a **fixer** → resolved or **routed**.
- Categories: `Incident`, `Request`, `Onboarding`, `Offboarding`, `Access`, `Hardware`.
- Priorities: `P1` (down for the whole company), `P2` (down for a team or floor), `P3` (degraded), `P4` (annoyance).
- Status: `New`, `Triaged`, `In progress`, `Waiting on you`, `Resolved`, `Closed`.

---

## 3. Visual foundations

### Vibe

Calm, professional, slightly clinical. Borrows from medical-record systems (which the team uses daily) more than from consumer SaaS. **Lots of whitespace, crisp 1px borders, a single brand accent, no gradients, no big shadows.** The product should feel like a well-organized clipboard.

### Color

- **Ink** scale (50→1000, slightly warm) carries 90% of UI. Defaults: bg `--ink-50`, surface `--ink-0`, text `--fg` (`--ink-900`), borders `--ink-200`.
- **Accent — PMG blue** (`#1660CF`, `--accent-600`), a calm cobalt. Only for: primary CTAs, links, focus rings, the brand mark, selected nav. **Never** for decoration. If blue feels excessive on a surface, default to ink.
- **Semantic** colors are reserved for **status**, never theming. A "save" button is ink+blue, never green. Red is only used when something is on fire. Info-blue (`#2563EB`) is intentionally close to the accent — pair the colored dot with the badge label so meaning never depends on hue alone.
- **No gradients** anywhere except the optional 80%→0% protection gradient at the top of scrollable lists.

### Type

- **Hanken Grotesk** (sans, Google Fonts) for everything UI. Substitute for the team's real brand font when provided.
- **JetBrains Mono** for ticket IDs (`INC-2041`), code snippets, timestamps, log output.
- Default UI size: **14px**. Body prose: 14–15px. Tables: 13–14px. Caption/meta: 12px. Never below 11px.
- Headings use `letter-spacing: -0.02em`. UI text uses tracking 0.
- `.eyebrow` is the only uppercase style; tracking 0.08em, 11–12px, weight 600.

### Spacing

- 4px base scale (`--space-1` through `--space-20`).
- **Rhythm**: 8 between related elements (label↔input), 16 between groups, 24 between sections, 32+ between page regions.
- Touch targets ≥ 36px. Comfortable density on web; ServiceNow tables can drop to 32px row height for power users.

### Radii

- **6px** for buttons and inputs (the workhorse).
- **8px** for cards and panels.
- **12px** for modals and large overlays.
- **4px** for badges/chips.
- **Pills** (full radius) only for filter chips and status pills, never for buttons.

### Shadows & elevation

Almost everything is **flat with a 1px `--border` line.** We use shadow sparingly:
- `--shadow-xs` — hairline below sticky headers / toolbars.
- `--shadow-sm` — default card lift on hover.
- `--shadow-md` — dropdown menus, popovers.
- `--shadow-lg` — modals only.
- `--shadow-focus` — blue ring on focused inputs (`box-shadow: 0 0 0 3px rgba(22,96,207,0.22)`).

No drop shadows on flat content. No inner shadows.

### Borders

- Default `1px solid var(--border)`. Cards, tables, inputs all share this line.
- Strong divider: `--border-strong` for left-rail separation and sticky-table headers.
- **Focus ring**: 2px `--accent-600` outline OR the `--shadow-focus` ring; never both.
- We do **not** use the "rounded card with colored left border" pattern. Status is communicated by a small **dot** or **pill** at the top-left of the card instead.

### Backgrounds & imagery

- App background: `--ink-50` (a very pale warm gray). Surfaces: pure white.
- No background photos. No gradients. No textures.
- Empty states use a small monochrome line illustration (placeholder: a single 32×32 ink-300 line icon centered, plus a one-liner). We do not draw mascots.
- The marketing site (if one exists) would use full-bleed photography of pharmacy/office life in **cool, slightly desaturated tones** — but that's a future kit.

### Motion

- Default `200ms cubic-bezier(0.2, 0.7, 0.2, 1)` for any state change.
- Fades and 4–8px slides only. No bounces, no springs, no shimmer skeletons that scroll horizontally — use a steady opacity pulse.
- Hover: `background-color` and `border-color` cross-fade in 120ms. Never scale.
- Press: a 1px shift down for buttons (`translateY(1px)`) + background darken. No shrink-on-press.
- Toasts slide up from bottom-right in 200ms, auto-dismiss after 5s.

### Hover & press

| State | What changes |
|---|---|
| Hover (subtle row, nav item) | `background: var(--bg-hover)` only |
| Hover (button, primary) | Accent steps to `--accent-700` |
| Hover (button, secondary) | Border to `--border-strong`, no fill change |
| Press (button) | Translate down 1px, background to one step darker |
| Focus | `--shadow-focus` ring + `--border-focus` border |
| Selected (nav, row) | `--bg-selected` (accent-50) + ink-900 text |

### Transparency & blur

- Modal backdrop: `rgba(11,13,16,0.40)`, no blur (clean lift). Optional 4px backdrop-blur on the marketing site, never in-app.
- Popover and dropdown menus are fully opaque — no glass effects.
- Hover overlays on images use `rgba(11,13,16,0.06)`.

### Iconography

See § 4.

### Layout rules

- Fixed left sidebar (240px), fixed top bar (56px), fluid content area with `--content-max: 1280px` for primary lists, full-width for tables/timelines.
- One scroll region per screen. The content area scrolls; sidebar and topbar stay put.
- Page padding: 24px on desktop, 16px on tablet.

---

## 4. Iconography

We use **Lucide** (CDN) as the icon set — a clean 1.5px stroke library with broad coverage of helpdesk concepts (`alert-circle`, `printer`, `monitor`, `key-round`, `user-plus`, `inbox`, `tag`, `clock`).

- **Style**: 1.5px stroke, rounded line caps and joins, 24×24 viewBox.
- **In-app size**: 16px (inline with text), 20px (buttons), 24px (nav, empty state).
- **Color**: inherits `currentColor`. Default `--fg-secondary`; active/hover steps to `--fg`.
- **No filled icons.** Stroke-only keeps the system coherent.
- **No emoji in product UI.** Emoji are allowed in: ticket comments (user-generated), the Slack mirror surface, and onboarding messages. Never in nav, badges, statuses, or buttons.
- **No unicode chars as icons** (`×`, `▶`, `‼`) — use Lucide equivalents (`x`, `play`, `alert-octagon`) for visual consistency.

**CDN**:
```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<i data-lucide="printer"></i>
<script>lucide.createIcons()</script>
```

Substitution flag: Lucide is acting as a placeholder until PMG provides a branded icon set, if any. If KROLL/AVD-specific glyphs are needed, we'll commission them.

### Logo usage

- **Primary**: `assets/logo-pmg-dark.png` — white pmg+cross on `#0B0D10`. Use on the topbar of the app.
- **Inverted**: `assets/logo-pmg-light.png` — for use on dark surfaces (footers, login splash).
- **Mark**: `assets/logo-pmg-mark.png` — black mark on transparent, for favicons and light surfaces.
- Minimum width: **64px**. Clear-space: at least the height of the lowercase `m` on every side.
- Never recolor the wordmark. The `+` mark may be tinted accent-blue when used standalone as an app icon.

---

## 5. Index — what's where in this folder

```
README.md                 — this file
SKILL.md                  — Claude / Agent Skills front-matter
colors_and_type.css       — CSS variables for color, type, spacing, radii, shadows, motion
assets/
  logo-pmg-dark.png       — primary (white on black)
  logo-pmg-light.png      — inverted (black on white)
  logo-pmg-mark.png       — transparent mark
preview/                  — small HTML cards rendered in the Design System tab
  type-display.html
  type-body.html
  type-mono.html
  color-ink.html
  color-accent.html
  color-semantic.html
  spacing.html
  radii.html
  shadows.html
  buttons.html
  status-badges.html
  priority-pills.html
  inputs.html
  ticket-card.html
  sidebar-nav.html
  avatar-user.html
  toast.html
  brand-logo.html
  brand-icons.html
  brand-integrations.html
ui_kits/
  helpdesk/
    index.html            — interactive click-through prototype
    README.md
    *.jsx                 — modular components (Sidebar, TicketRow, NewTicketForm, …)
```

---

## 6. Caveats

- **Logo is a low-res PNG** (311×162). Get a vector before this is shipped.
- **Brand color is inferred.** PMG blue (`#1660CF`) is a placeholder cobalt — calm, clinical, distinct from ServiceNow's green and from common UI blues. If PMG already has a brand color, swap `--accent-600` and we're done.
- **Hanken Grotesk is a substitution.** It's a clean, free Google font close to what PMG probably wants. Replace if there's a real brand font.
- **Lucide is a substitution** for icons. Replace with a branded icon set if one exists.
- **No real product screenshots** were provided, so the UI kit is a plausible-but-invented click-through. Treat it as a starting point, not a spec.
