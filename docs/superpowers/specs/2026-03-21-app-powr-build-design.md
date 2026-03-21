# app.powr.build — Production-Ready Design Spec

## Context

POWR has two web properties: `powr.build` (Go+templ, discovery/profiles/SEO) and `app.powr.build` (Next.js 15 PWA, authenticated workout tracking). The PWA serves as the Android/web companion to the canonical POWR iOS app. Both speak Nostr natively (kinds 1301, 33401, 33402).

The PWA has solid XState v5 machine architecture, NDK authentication, and component scaffolding, but isn't production-ready. This spec covers the two things needed to ship v1: applying the "Kinetic Precision" design system and closing functional gaps (empty states, loading, errors, offline).

**V1 litmus test:** Can a real Android user open app.powr.build, log in, start a workout from a template, track sets, and publish it to Nostr?

## Scope

### In scope
- Kinetic Precision design token system (colors, typography, radius, structural rules)
- Retheme all components to consume new tokens
- 3-tab bottom navigation: Library, Workout, Log
- Profile drawer (already exists, retheme only)
- Login wall with 3 auth methods (NIP-07, NIP-46, ephemeral)
- Functional gap states: empty, loading, error, offline
- Graceful offline degradation (app works if loaded, publishes queue with message)

### Out of scope
- Social tab, Progress tab (post-v1)
- Full offline caching / service worker overhaul
- New workout interaction patterns (keep existing SetRow inline editing)
- powr-ios changes
- Merging with Go+templ powr.build site

## Design System: Kinetic Precision

### Architecture

**Hybrid: CSS Variables + Tailwind Utilities**

CSS custom properties are the single source of truth. Tailwind v4 `@theme inline` maps them to utility classes. shadcn/ui components inherit via CSS variables automatically.

```
globals.css (CSS variables)  →  @theme inline (Tailwind mapping)  →  Components (utility classes)
                             →  shadcn/ui (auto-inherits via CSS vars)
```

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#ff9153` | CTAs, accent bars, active states |
| `--color-primary-dark` | `#ff7a23` | Gradient endpoint, hover states |
| `--color-secondary` | `#419092` | Success, PRs, "Go" signals, completed sets |
| `--color-surface-base` | `#0e0e0e` | Page background |
| `--color-surface-card` | `#131313` | Card backgrounds, bottom tabs |
| `--color-surface-elevated` | `#262626` | Inputs, elevated surfaces, overlays |
| `--color-on-surface` | `#e8e8e8` | Primary text (not pure white — reserve #fff for bold display moments only) |
| `--color-on-surface-variant` | `#a0a0a0` | Secondary text, labels |
| `--color-error` | `#ef4444` | Error states |

Semantic aliases:
- `--color-success` → `var(--color-secondary)`
- `--color-accent` → `var(--color-primary)`
- `--gradient-cta` → `linear-gradient(135deg, #ff9153 0%, #f06c0b 100%)`

### Typography

| Role | Font | Usage |
|------|------|-------|
| Body / Display | Inter | All text, headings, labels |
| Numeric Data | Space Grotesk | Weight, reps, RPE, timers, stats, set numbers |

Data clusters pattern: Space Grotesk `label-sm` (on_surface_variant) + `title-lg` value (primary).

### Structural Rules

1. **No-Line Rule:** Zero 1px borders for sectioning. Use tonal shifting (base → card → elevated) + structural spacing + accent anchoring.
2. **3pt Accent Bars:** Every major content section gets a `border-l-[3px] border-l-primary` left vertical bar in primary orange.
3. **12px Radius:** `--radius: 0.75rem` applied to all cards, buttons, inputs, modals, sheets. No exceptions.
4. **Smoked Glass Overlays:** `#262626` + `backdrop-blur(12px)` + `80% opacity` for modals/sheets.

### Button Hierarchy

| Type | Style | Usage |
|------|-------|-------|
| Primary | Gradient fill (`--gradient-cta`), 12px radius, dark text | Main CTAs: "Complete Set", "Browser Extension" |
| Secondary | Tinted fill (`rgba(255,145,83,0.1)`), orange text, no border | Secondary actions: "Remote Signer", "Browse Templates" |
| Ghost | No background, muted text | Tertiary: "Try Demo Mode", "Dismiss" |

### CSS Variable Map

```css
/* globals.css — @theme inline */
--color-primary: #ff9153;
--color-primary-dark: #ff7a23;
--color-secondary: #419092;
--color-surface-base: #0e0e0e;
--color-surface-card: #131313;
--color-surface-elevated: #262626;
--color-on-surface: #e8e8e8;
--color-on-surface-variant: #a0a0a0;
--color-error: #ef4444;
--color-success: var(--color-secondary);
--color-accent: var(--color-primary);
--gradient-cta: linear-gradient(135deg, #ff9153 0%, #f06c0b 100%);
--radius: 0.75rem;
--accent-bar-width: 3px;
--font-numeric: 'Space Grotesk', monospace;

/* Tailwind utilities generated: */
/* bg-surface-base, bg-surface-card, bg-surface-elevated */
/* text-primary, text-secondary, text-on-surface, text-on-surface-variant */
/* border-primary, border-accent */
```

## Navigation

### V1 Tabs (Mobile Bottom)
3 bottom tabs on `bg-surface-card`, no top border (no-line rule):
1. **Library** — Browse/search workout templates and exercises
2. **Workout** — Active workout session or start new
3. **Log** — Workout history

Active tab: primary orange text. Inactive: on_surface_variant.

### Profile
Side drawer/sheet (already implemented). Retheme to Kinetic Precision. Contains: Nostr identity, settings, logout.

### Desktop
Sidebar navigation with same 3 items + profile. Already implemented, retheme only.

## Screen Designs

### Login Wall
- Centered on `surface-base`
- POWR logo + tagline "Track. Publish. Own your data."
- Login card on `surface-card` with 3pt left accent bar
- 3 auth buttons in hierarchy:
  - **NIP-07 (Browser Extension):** Primary gradient button
  - **NIP-46 (Remote Signer / Amber):** Secondary tinted button
  - **Ephemeral (Demo):** Ghost button
- Existing `LoginDialog` component rethemed, shown as full-page for unauthenticated users

### Library Tab
- Header: "Library" title + Workouts/Exercises tab switcher (active tab on `surface-elevated`)
- Search input on `surface-elevated`, 12px radius
- Template cards: `surface-card`, 12px radius, 3pt left accent bar
  - Title (Inter, semibold, on_surface)
  - Subtitle (Inter, on_surface_variant)
  - Exercise count (Space Grotesk, on_surface_variant)
  - Tags on `surface-elevated` with rounded corners

### Active Workout
- Header on `surface-card`: workout title + elapsed timer (Space Grotesk, primary) + Finish button (primary gradient)
- Exercise section with 3pt accent bar: exercise name + progress ("3 of 5 exercises")
- Set tracking grid:
  - Column headers: Set, Weight, Reps, RPE (uppercase label, on_surface_variant)
  - Completed sets: `surface-card`, green set number + checkmark, Space Grotesk values
  - Active set: `surface-elevated`, orange glow outline (`box-shadow: 0 0 0 1px rgba(255,145,83,0.3)`), primary-colored values
  - Pending sets: `surface-card` at 40% opacity, muted values
- "Complete Set" CTA: full-width primary gradient button

### Log Tab
- Header: "Workout Log" title
- Data cluster: 3-column grid on `surface-card`
  - Labels: Space Grotesk, uppercase, on_surface_variant
  - Values: Space Grotesk, title-lg, primary (or secondary for streak)
  - Metrics: This Week, Total Sets, Streak
- Workout entries: `surface-card`, 12px radius, 3pt accent bar
  - Title + metadata ("Today · 12 sets · 45 min")
  - Publish status (Space Grotesk, secondary green, "Published ✓")

## Functional Gap States

### Empty States
- **Empty Library (new user):** Icon (muted), "No templates yet" heading, explanatory text, "Load Starter Templates" primary gradient CTA (triggers existing `libraryOnboardingService.setupStarterLibrary()`)
- **Empty Log:** Icon (muted), "No workouts recorded" heading, "Browse Templates" secondary tinted CTA

### Loading States
- **Skeleton cards:** Match card layout structure. `surface-card` with `surface-elevated` skeleton bars. Accent bar in `surface-elevated` (not orange — reserved for loaded state). Pulsing animation. Descending opacity (1.0, 0.7, 0.4) for depth.

### Error States
- **Publish failed:** Centered card with tinted red background (`rgba(239,68,68,0.1)`). Error title in red. Reassurance text: "Your workout is saved locally." Retry (primary gradient) + Dismiss (ghost) actions.
- **Generic errors:** Same pattern adapted — tinted red container, clear message, actionable buttons.

### Offline States
- **Inline banner:** Non-blocking bar at top of content. Tinted primary background (`rgba(255,145,83,0.1)`). "⚡ Offline — workouts will publish when you're back online." App continues working normally with cached data.
- **Queued publish:** On workout completion while offline, show completion screen with pulsing orange dot + "Queued — will publish when online" indicator.

## Implementation Strategy

### Phase 1: Navigation Trim
Remove Social, Progress, Home, Debug tabs from v1 first — reduces the surface area for retheme. Reduce to Library, Workout, Log.

**Key files:**
- `src/components/navigation/MobileBottomTabs.tsx` — 3 tabs only
- `src/components/navigation/DesktopSidebar.tsx` — 3 items + profile
- `src/components/tabs/TabRouter.tsx` — Remove unused tab routes

### Phase 2: Design Tokens
Replace OKLCH color system in `globals.css` with Kinetic Precision CSS variables. Update `@theme inline` block for Tailwind utility mapping. Swap Geist Sans/Mono for Inter + Space Grotesk. Set `--radius: 0.75rem`.

**Key files:**
- `src/app/globals.css` — CSS variables + @theme inline
- `src/app/layout.tsx` — Font imports (Inter + Space Grotesk)
- `src/components/ui/*.tsx` — shadcn/ui auto-inherits, verify no hardcoded colors

### Phase 3: Component Retheme
Update all components to consume new tokens. Apply no-border rule, accent bars, button hierarchy, Space Grotesk for numeric data.

**Key files:**
- `src/components/powr-ui/primitives/Button.tsx` — Button variants (primary gradient, secondary tinted, ghost)
- `src/components/powr-ui/primitives/Card.tsx` — Accent bars, surface colors
- `src/components/powr-ui/workout/SetRow.tsx` — Space Grotesk for numbers
- `src/components/powr-ui/workout/ActiveWorkoutInterface.tsx` — Active set glow, exercise sections
- `src/components/powr-ui/workout/WorkoutCard.tsx` — Card variants
- `src/components/powr-ui/workout/ExerciseCard.tsx` — Card variants
- `src/components/navigation/MobileBottomTabs.tsx` — 3 tabs, no border, active orange
- `src/components/navigation/DesktopSidebar.tsx` — Retheme
- `src/components/layout/AppLayout.tsx` — Surface-base background

### Phase 3b: Login Wall
The existing `LoginDialog` is a modal — converting it to a full-page login wall is more than a retheme. This requires either a new route (`src/app/(auth)/page.tsx`) with a redirect guard, or a conditional wrapper in `AppLayout.tsx` that renders the full-page login layout when unauthenticated. The auth logic itself is unchanged — only the presentation layer.

**Key files:**
- `src/components/auth/LoginDialog.tsx` — Retheme + extract login card content
- `src/components/layout/AppLayout.tsx` — Auth gate: render login wall vs app shell
- Possibly new: `src/components/auth/LoginWall.tsx` — Full-page login layout wrapping the login card

### Phase 4: Functional Gap States
Add empty, loading, error, and offline states to complete the user journey.

**Key files:**
- `src/components/library/WorkoutLibrary.tsx` — Empty + loading states
- `src/components/library/ExerciseLibrary.tsx` — Empty + loading states
- `src/components/tabs/LibraryTab.tsx` — Empty library trigger for onboarding
- Workout completion flow — Error + queued publish states
- New: Offline detection hook + banner component
- New: Skeleton card component (reusable)

## Verification

1. **Visual:** Open app.powr.build on Android Chrome. Verify Kinetic Precision palette, fonts, radius, accent bars, no borders.
2. **End-to-end flow:** Login (NIP-07 or NIP-46) → Library shows starter templates → Start workout from template → Track 3 sets of an exercise → Complete workout → Verify kind 1301 event published to relay.
3. **Empty states:** Fresh account with no data → verify empty Library triggers onboarding → verify empty Log shows call-to-action.
4. **Loading states:** Slow connection → verify skeleton cards appear during template load.
5. **Offline:** Toggle airplane mode mid-workout → verify offline banner appears → complete workout → verify "queued" indicator → reconnect → verify publish fires.
6. **Responsive:** Test on mobile viewport (375px), tablet (768px), desktop (1280px).

## Existing Code to Reuse

- `src/lib/services/libraryOnboardingService.ts` — Starter template seeding (already built)
- `src/hooks/useSimpleLibraryOnboarding.ts` — Onboarding hook (already built)
- `src/components/library/SimpleLibraryOnboarding.tsx` — Onboarding UI (already built, retheme)
- `src/lib/machines/workout/` — All XState machines (untouched, just retheme consuming components)
- `src/lib/actors/globalNDKActor.ts` — Publishing with offline queue (NDK built-in)
- `src/components/auth/LoginDialog.tsx` — Auth flow (retheme, reposition as login wall)
- `src/providers/` — All 8 providers (untouched)

## Non-Goals

- No new XState machines or state management changes
- No new Nostr event kinds or protocol changes
- No backend/API changes
- No test infrastructure (post-v1)
- No accessibility audit (post-v1, though maintain existing ARIA labels)
- No analytics or SEO meta
