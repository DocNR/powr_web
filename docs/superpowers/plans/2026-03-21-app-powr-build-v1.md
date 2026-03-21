# app.powr.build v1 — Kinetic Precision + Functional Gaps

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Next.js 15 PWA production-ready for Android users by applying the Kinetic Precision design system and closing functional gaps (empty/loading/error/offline states).

**Architecture:** Hybrid CSS Variables + Tailwind v4 `@theme inline`. CSS custom properties are the single source of truth; Tailwind utility classes map to them; shadcn/ui auto-inherits. No changes to XState machines, Nostr protocol, or data layer.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 4, XState 5, NDK 2.14, Inter + Space Grotesk fonts

**Spec:** `docs/superpowers/specs/2026-03-21-app-powr-build-design.md`

**Testing note:** This project has no test infrastructure. Verification is visual — run `npm run dev`, open in browser, check against spec mockups. Each task includes verification steps.

---

## File Map

### Modified Files
| File | Responsibility |
|------|---------------|
| `src/app/globals.css` | Replace OKLCH with Kinetic Precision CSS variables + @theme inline |
| `src/app/layout.tsx` | Swap Geist → Inter + Space Grotesk font imports |
| `src/config/navigation.ts` | Already correct (3 tabs + dev-only test) — no changes needed |
| `src/components/layout/TabRouter.tsx` | Remove dead `home` and `social` route cases |
| `src/components/layout/AppLayout.tsx` | Add auth gate: render LoginWall when unauthenticated |
| `src/components/auth/LoginDialog.tsx` | Retheme to Kinetic Precision |
| `src/components/powr-ui/primitives/Button.tsx` | Update variants: primary-gradient, secondary-tinted, ghost |
| `src/components/powr-ui/primitives/Card.tsx` | Surface colors, accent bars, no-border rule |
| `src/components/powr-ui/workout/SetRow.tsx` | Space Grotesk for numeric data |
| `src/components/powr-ui/workout/ActiveWorkoutInterface.tsx` | Active set glow, exercise accent bars |
| `src/components/powr-ui/workout/WorkoutCard.tsx` | Retheme card variants |
| `src/components/powr-ui/workout/ExerciseCard.tsx` | Retheme card variants |
| `src/components/navigation/MobileBottomTabs.tsx` | Surface-card bg, no border, primary active color |
| `src/components/navigation/DesktopSidebar.tsx` | Retheme to match |
| `src/components/library/WorkoutLibrary.tsx` | Add empty + loading states |
| `src/components/library/ExerciseLibrary.tsx` | Add empty + loading states |
| `src/components/tabs/LibraryTab.tsx` | Empty library onboarding trigger |

### New Files
| File | Responsibility |
|------|---------------|
| `src/components/auth/LoginWall.tsx` | Full-page login layout for unauthenticated users |
| `src/components/powr-ui/primitives/SkeletonCard.tsx` | Reusable loading skeleton matching card layout |
| `src/components/powr-ui/primitives/EmptyState.tsx` | Reusable empty state with icon, heading, text, CTA |
| `src/components/powr-ui/primitives/OfflineBanner.tsx` | Non-blocking inline offline indicator |
| `src/hooks/useOnlineStatus.ts` | Hook for detecting online/offline state |

---

## Task 1: Clean Up Dead Routes

**Files:**
- Modify: `src/components/layout/TabRouter.tsx:16-41`

The navigation config already only shows 3 tabs in production (library, workout, log). But TabRouter has dead `home` and `social` switch cases. Remove them.

- [ ] **Step 1: Remove dead cases from TabRouter**

In `src/components/layout/TabRouter.tsx`, remove the `case 'home'` and `case 'social'` branches from the switch statement. Change the default case to render `<LibraryTab />` instead of `<HomeTab />`. Remove the `HomeTab` and `SocialTab` imports.

```typescript
// Before:
case 'home':
  return <HomeTab />;
// ...
case 'social':
  return <SocialTab />;
// ...
default:
  return <HomeTab />;

// After: remove home and social cases entirely
// Change default:
default:
  return <LibraryTab />;
```

- [ ] **Step 2: Verify**

Run: `npm run dev`
Open browser → confirm Library, Workout, Log tabs work. Confirm no errors in console.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/TabRouter.tsx
git commit -m "chore: remove dead home and social route cases from TabRouter"
```

---

## Task 2: Swap Fonts — Geist → Inter + Space Grotesk

**Files:**
- Modify: `src/app/layout.tsx:14-22`

- [ ] **Step 1: Replace font imports**

In `src/app/layout.tsx`, replace:
```typescript
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
```

With:
```typescript
import { Inter, Space_Grotesk } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});
```

- [ ] **Step 2: Update className references**

In the same file, find where `geistSans.variable` and `geistMono.variable` are applied to the `<body>` element. Replace with `inter.variable` and `spaceGrotesk.variable`.

- [ ] **Step 3: Verify**

Run: `npm run dev`
Open browser → inspect body element → confirm `--font-inter` and `--font-space-grotesk` CSS variables are present. Text should render in Inter.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: swap Geist fonts for Inter + Space Grotesk"
```

---

## Task 3: Replace Design Tokens — OKLCH → Kinetic Precision

**Files:**
- Modify: `src/app/globals.css`

This is the foundation. Replace the entire OKLCH color system with Kinetic Precision hex values and add new semantic tokens.

- [ ] **Step 1: Replace the @theme inline block**

In `src/app/globals.css`, replace the existing `@theme inline` CSS variable definitions (both light and dark mode) with the Kinetic Precision tokens. Since this is a dark-only design, consolidate into a single `:root` block:

```css
@theme inline {
  /* Kinetic Precision Design System */
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

  /* Structural tokens */
  --radius: 0.75rem;
  --accent-bar-width: 3px;
  --font-numeric: 'Space Grotesk', var(--font-space-grotesk), monospace;
  --font-body: 'Inter', var(--font-inter), system-ui, sans-serif;

  /* shadcn/ui compatibility mappings */
  --background: var(--color-surface-base);
  --foreground: var(--color-on-surface);
  --card: var(--color-surface-card);
  --card-foreground: var(--color-on-surface);
  --primary: var(--color-primary);
  --primary-foreground: #0e0e0e;
  --secondary: var(--color-surface-elevated);
  --secondary-foreground: var(--color-on-surface);
  --muted: var(--color-surface-elevated);
  --muted-foreground: var(--color-on-surface-variant);
  --accent: var(--color-surface-elevated);
  --accent-foreground: var(--color-on-surface);
  --destructive: var(--color-error);
  --border: var(--color-surface-elevated);
  --input: var(--color-surface-elevated);
  --ring: var(--color-primary);

  /* Workout-specific semantic tokens */
  --workout-success: var(--color-secondary);
  --workout-active: var(--color-primary);
  --workout-surface: var(--color-surface-card);
  --workout-text: var(--color-on-surface);
  --workout-primary: var(--color-primary);
  --workout-timer: var(--color-primary);

  /* Gradient (not a Tailwind utility — use directly in components) */
  --gradient-cta: linear-gradient(135deg, #ff9153 0%, #f06c0b 100%);
}
```

- [ ] **Step 2: Update base styles**

Replace the existing `body` / base layer styles to use the new tokens:

```css
body {
  background: var(--color-surface-base);
  color: var(--color-on-surface);
  font-family: var(--font-body);
}
```

- [ ] **Step 3: Remove light mode overrides**

Remove the light mode / `@media (prefers-color-scheme: light)` overrides and the `.light` / `.dark` theme blocks. Kinetic Precision is dark-only for v1.

- [ ] **Step 4: Keep PWA utilities intact**

Do NOT remove the PWA-specific utilities already in globals.css: safe area insets (`.pb-safe`, `.pl-safe`, `.pr-safe`), `.pwa-mobile`, `.hide-scrollbar`, zoom prevention, frosted glass utilities, dropdown animations, horizontal gallery touch handling. These are independent of the color system.

- [ ] **Step 5: Verify**

Run: `npm run dev`
Open browser → page background should be #0e0e0e. Text should be #e8e8e8. Any existing shadcn/ui components (buttons, cards, dialogs) should pick up the new colors automatically via the compatibility mappings.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: replace OKLCH color system with Kinetic Precision design tokens"
```

---

## Task 4: Update Button Variants

**Files:**
- Modify: `src/components/powr-ui/primitives/Button.tsx`

- [ ] **Step 1: Read current Button.tsx**

Read the file to understand existing variants and CVA structure.

- [ ] **Step 2: Update button variants**

Update the CVA variant definitions. Keep existing variant names where possible for backwards compatibility, but update their styles:

**Primary gradient** (map to existing `primary-gradient` or `gradient` variant):
```
background: linear-gradient(135deg, #ff9153 0%, #f06c0b 100%)
color: #0e0e0e
font-weight: 700
border-radius: var(--radius) (12px)
border: none
```

**Secondary tinted** (map to existing `secondary` or `outline` variant):
```
background: rgba(255,145,83,0.1)
color: var(--color-primary)
font-weight: 600
border-radius: var(--radius)
border: none
```

**Ghost** (keep existing `ghost` variant):
```
background: transparent
color: var(--color-on-surface-variant)
border: none
```

**Destructive:** Keep but update to use `--color-error`.

Ensure all variants use `rounded-[var(--radius)]` or the Tailwind equivalent `rounded-xl` (0.75rem ≈ 12px).

- [ ] **Step 3: Verify**

Run: `npm run dev`
Navigate to any screen with buttons → confirm gradient, tinted, and ghost styles render correctly.

- [ ] **Step 4: Commit**

```bash
git add src/components/powr-ui/primitives/Button.tsx
git commit -m "feat: update button variants to Kinetic Precision styles"
```

---

## Task 5: Update Card Component

**Files:**
- Modify: `src/components/powr-ui/primitives/Card.tsx`

- [ ] **Step 1: Read current Card.tsx**

Read the file to understand existing structure.

- [ ] **Step 2: Update card styles**

Apply Kinetic Precision to the base card:
- Background: `bg-[var(--color-surface-card)]`
- Border: remove any `border` classes (no-line rule)
- Border radius: `rounded-[var(--radius)]`
- Add optional accent bar variant: `border-l-[3px] border-l-[var(--color-primary)]`

If the Card component uses CVA variants, add an `accent` variant prop:
```typescript
accent?: boolean // adds 3pt left border in primary orange
```

If it's a simple component, add the accent bar as an optional className pattern documented in a comment.

- [ ] **Step 3: Verify**

Run: `npm run dev`
Navigate to Library → cards should show surface-card background, no borders, 12px radius.

- [ ] **Step 4: Commit**

```bash
git add src/components/powr-ui/primitives/Card.tsx
git commit -m "feat: update Card to Kinetic Precision — surface colors, no borders, accent bar"
```

---

## Task 6: Update Navigation Components

**Files:**
- Modify: `src/components/navigation/MobileBottomTabs.tsx`
- Modify: `src/components/navigation/DesktopSidebar.tsx`

- [ ] **Step 1: Read both files**

Read MobileBottomTabs.tsx and DesktopSidebar.tsx.

- [ ] **Step 2: Update MobileBottomTabs**

- Background: `bg-[var(--color-surface-card)]` (was using theme default)
- Remove any top border (no-line rule)
- Active tab text/icon: `text-[var(--color-primary)]` (orange)
- Inactive tab text/icon: `text-[var(--color-on-surface-variant)]`
- Keep safe-area padding (pb-safe)
- Keep 44x44 touch targets

- [ ] **Step 3: Update DesktopSidebar**

- Background: `bg-[var(--color-surface-card)]`
- Remove any right border
- Active item: primary orange text/icon
- Inactive item: on_surface_variant
- Footer text: on_surface_variant

- [ ] **Step 4: Verify**

Run: `npm run dev`
Check mobile viewport (375px) → bottom tabs should be dark (#131313) with orange active state.
Check desktop viewport (1280px) → sidebar should match.

- [ ] **Step 5: Commit**

```bash
git add src/components/navigation/MobileBottomTabs.tsx src/components/navigation/DesktopSidebar.tsx
git commit -m "feat: retheme navigation to Kinetic Precision — surface-card, no borders, primary active"
```

---

## Task 7: Retheme Workout Components

**Files:**
- Modify: `src/components/powr-ui/workout/SetRow.tsx`
- Modify: `src/components/powr-ui/workout/ActiveWorkoutInterface.tsx`
- Modify: `src/components/powr-ui/workout/WorkoutCard.tsx`
- Modify: `src/components/powr-ui/workout/ExerciseCard.tsx`

- [ ] **Step 1: Read all four files**

Read each file to understand current styling.

- [ ] **Step 2: Update SetRow**

- All numeric values (weight, reps, RPE, set number): `font-[var(--font-numeric)]` or `font-['Space_Grotesk',monospace]`
- Completed set row: `bg-[var(--color-surface-card)]`, set number in secondary green, checkmark in green
- Active set row: `bg-[var(--color-surface-elevated)]`, `shadow-[0_0_0_1px_rgba(255,145,83,0.3)]`, values in primary orange
- Pending set row: `bg-[var(--color-surface-card)] opacity-40`
- Input fields: `bg-[var(--color-surface-elevated)]`, no borders
- Remove any existing 1px borders

- [ ] **Step 3: Update ActiveWorkoutInterface**

- Workout header: `bg-[var(--color-surface-card)]`
- Timer display: `font-[var(--font-numeric)] text-[var(--color-primary)]`
- Exercise section: `border-l-[3px] border-l-[var(--color-primary)]` accent bar on exercise name container
- "Complete Set" button: full-width primary gradient
- "Finish" button: primary gradient (compact)
- Column headers (Set, Weight, Reps, RPE): `uppercase text-xs tracking-wide text-[var(--color-on-surface-variant)]`

- [ ] **Step 4: Update WorkoutCard**

- All variants: `bg-[var(--color-surface-card)]`, `rounded-[var(--radius)]`, `border-l-[3px] border-l-[var(--color-primary)]`
- Remove any existing borders
- Titles: Inter, semibold, on_surface
- Metadata: Inter, on_surface_variant
- Numeric data (exercise count, duration, sets): Space Grotesk

- [ ] **Step 5: Update ExerciseCard**

Same pattern as WorkoutCard — surface-card, accent bar, no borders, Space Grotesk for numbers.

- [ ] **Step 6: Verify**

Run: `npm run dev`
Login → start a workout from a template → verify:
- Set rows show Space Grotesk numbers
- Active set has orange glow
- Completed sets show green indicators
- Exercise sections have orange accent bars
- No 1px borders anywhere

- [ ] **Step 7: Commit**

```bash
git add src/components/powr-ui/workout/SetRow.tsx src/components/powr-ui/workout/ActiveWorkoutInterface.tsx src/components/powr-ui/workout/WorkoutCard.tsx src/components/powr-ui/workout/ExerciseCard.tsx
git commit -m "feat: retheme workout components to Kinetic Precision"
```

---

## Task 8: Retheme AppLayout + Remaining Components

**Files:**
- Modify: `src/components/layout/AppLayout.tsx`
- Modify: `src/components/auth/LoginDialog.tsx`

- [ ] **Step 1: Read AppLayout.tsx**

Read the file focusing on background colors, header styles, and any hardcoded colors.

- [ ] **Step 2: Update AppLayout**

- Main background: `bg-[var(--color-surface-base)]`
- Header background: `bg-[var(--color-surface-card)]`
- Remove any borders between header/content/tabs
- Sub-navigation background: `bg-[var(--color-surface-card)]`

- [ ] **Step 3: Read and update LoginDialog**

- Dialog content: `bg-[var(--color-surface-card)]` with `rounded-[var(--radius)]`
- Title: Inter, on_surface
- NIP-07 button: primary-gradient variant
- NIP-46 / Amber button: secondary variant (tinted fill)
- Ephemeral / Demo: ghost variant
- Remove smoked glass / overlay if not matching spec — or update to `bg-[var(--color-surface-elevated)]/80 backdrop-blur-[12px]`
- QR code section: surface-elevated background

- [ ] **Step 4: Verify**

Run: `npm run dev`
Open app → LoginDialog should show Kinetic Precision styling.
Login → app shell should be surface-base with surface-card header.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/AppLayout.tsx src/components/auth/LoginDialog.tsx
git commit -m "feat: retheme AppLayout and LoginDialog to Kinetic Precision"
```

---

## Task 9: Build Login Wall (Auth Gate)

**Files:**
- Create: `src/components/auth/LoginWall.tsx`
- Modify: `src/components/layout/AppLayout.tsx`

The existing LoginDialog is a modal. For unauthenticated users, we need a full-page login experience instead.

- [ ] **Step 1: Create LoginWall component**

Create `src/components/auth/LoginWall.tsx`:

```tsx
'use client';

import { LoginDialog } from './LoginDialog';

export function LoginWall() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-base)] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          POWR
        </h1>
        <p className="text-[var(--color-on-surface-variant)] mt-2">
          Track. Publish. Own your data.
        </p>
      </div>

      {/* Login card — reuse LoginDialog content but render inline, not as a modal */}
      <LoginDialog defaultOpen={true} />
    </div>
  );
}
```

**Important:** The exact implementation depends on how LoginDialog renders. If it always wraps in a Radix Dialog, you may need to either:
- (a) Extract the login form content into a shared `LoginForm` component that both LoginDialog and LoginWall use, or
- (b) Modify LoginDialog to accept a `mode="inline" | "modal"` prop

Read LoginDialog carefully and choose the cleanest approach. The goal: reuse the auth logic (NIP-07/NIP-46/ephemeral hooks, error handling, QR code generation) without duplicating it.

- [ ] **Step 2: Add auth gate to AppLayout**

In `src/components/layout/AppLayout.tsx`, add an early return for unauthenticated users:

```tsx
// Near the top of the component, after auth hooks:
const isAuthenticated = useIsAuthenticated();

if (!isAuthenticated) {
  return <LoginWall />;
}

// ... rest of existing layout
```

This renders the full-page LoginWall instead of the app shell when not authenticated.

- [ ] **Step 3: Verify**

Run: `npm run dev`
1. Open in incognito → should see full-page LoginWall with POWR logo + login card
2. Login via any method → should transition to app shell with 3 tabs
3. Logout → should return to LoginWall

- [ ] **Step 4: Commit**

```bash
git add src/components/auth/LoginWall.tsx src/components/layout/AppLayout.tsx
git commit -m "feat: add full-page LoginWall as auth gate for unauthenticated users"
```

---

## Task 10: Create Reusable Empty State Component

**Files:**
- Create: `src/components/powr-ui/primitives/EmptyState.tsx`

- [ ] **Step 1: Create EmptyState component**

```tsx
'use client';

import { Button } from './Button';

interface EmptyStateProps {
  icon: string;          // Emoji
  heading: string;
  description: string;
  actionLabel?: string;
  actionVariant?: 'gradient' | 'secondary';
  onAction?: () => void;
}

export function EmptyState({
  icon,
  heading,
  description,
  actionLabel,
  actionVariant = 'gradient',
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="text-4xl mb-4 opacity-30">{icon}</div>
      <h3 className="text-lg font-semibold text-[var(--color-on-surface)] mb-2">
        {heading}
      </h3>
      <p className="text-sm text-[var(--color-on-surface-variant)] max-w-[240px] mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          variant={actionVariant === 'gradient' ? 'primary-gradient' : 'secondary'}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/powr-ui/primitives/EmptyState.tsx
git commit -m "feat: add reusable EmptyState component"
```

---

## Task 11: Create Skeleton Card Component

**Files:**
- Create: `src/components/powr-ui/primitives/SkeletonCard.tsx`

- [ ] **Step 1: Create SkeletonCard component**

```tsx
'use client';

interface SkeletonCardProps {
  count?: number;
}

export function SkeletonCard({ count = 3 }: SkeletonCardProps) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-[var(--color-surface-card)] rounded-[var(--radius)] p-5 border-l-[3px] border-l-[var(--color-surface-elevated)]"
          style={{ opacity: 1 - i * 0.3 }}
        >
          <div className="bg-[var(--color-surface-elevated)] rounded-lg h-4 w-3/5 mb-3 animate-pulse" />
          <div className="bg-[var(--color-surface-elevated)]/50 rounded-md h-3 w-2/5" />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/powr-ui/primitives/SkeletonCard.tsx
git commit -m "feat: add reusable SkeletonCard loading component"
```

---

## Task 12: Create Offline Banner + Hook

**Files:**
- Create: `src/hooks/useOnlineStatus.ts`
- Create: `src/components/powr-ui/primitives/OfflineBanner.tsx`

- [ ] **Step 1: Create useOnlineStatus hook**

```typescript
'use client';

import { useState, useEffect } from 'react';

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

- [ ] **Step 2: Create OfflineBanner component**

```tsx
'use client';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-[rgba(255,145,83,0.1)] px-5 py-3 flex items-center gap-2">
      <span className="text-sm text-[var(--color-primary)]">
        ⚡ Offline — workouts will publish when you&apos;re back online
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Add OfflineBanner to AppLayout**

In `src/components/layout/AppLayout.tsx`, add `<OfflineBanner />` at the top of the main content area, just below the header.

- [ ] **Step 4: Verify**

Run: `npm run dev`
Open Chrome DevTools → Network tab → toggle "Offline" → banner should appear.
Toggle back online → banner should disappear.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useOnlineStatus.ts src/components/powr-ui/primitives/OfflineBanner.tsx src/components/layout/AppLayout.tsx
git commit -m "feat: add offline detection hook and inline banner"
```

---

## Task 13: Wire Empty + Loading States into Library

**Files:**
- Modify: `src/components/library/WorkoutLibrary.tsx`
- Modify: `src/components/library/ExerciseLibrary.tsx`
- Modify: `src/components/tabs/LibraryTab.tsx`

- [ ] **Step 1: Read WorkoutLibrary, ExerciseLibrary, and LibraryTab**

Read all three files to understand current rendering logic — what does it show when there's no data? What loading indicators exist?

- [ ] **Step 2: Add empty + loading states to WorkoutLibrary**

Import `EmptyState` and `SkeletonCard`. In the render:
- When loading: render `<SkeletonCard count={3} />`
- When loaded but empty: render `<EmptyState icon="📋" heading="No templates yet" description="Add starter templates to your library to get started." actionLabel="Load Starter Templates" onAction={triggerOnboarding} />`

The `triggerOnboarding` function should call the existing `libraryOnboardingService.setupStarterLibrary()` via the existing `useSimpleLibraryOnboarding` hook.

- [ ] **Step 3: Add empty + loading states to ExerciseLibrary**

Same pattern:
- Loading: `<SkeletonCard count={3} />`
- Empty: `<EmptyState icon="💪" heading="No exercises saved" description="Exercises from your workout templates will appear here." />`

- [ ] **Step 4: Verify**

Run: `npm run dev`
1. Login with a fresh ephemeral account → Library should show empty state with "Load Starter Templates" CTA
2. Click CTA → templates should load
3. Refresh page → templates should show (cached)

- [ ] **Step 5: Commit**

```bash
git add src/components/library/WorkoutLibrary.tsx src/components/library/ExerciseLibrary.tsx src/components/tabs/LibraryTab.tsx
git commit -m "feat: add empty and loading states to Library views"
```

---

## Task 14: Add Error + Queued States to Workout Completion

**Files:**
- Modify: Workout completion UI (read the workout completion/summary component — likely rendered in the `summary` or `completed` state of workoutLifecycleMachine)

- [ ] **Step 1: Identify the completion UI component**

The workoutLifecycleMachine has states: `completed` → `workoutPublished` → `templateSavePrompt` → `summary`. Find which component renders the post-workout experience. Search for components that read the lifecycle machine's `summary` or `completed` state.

- [ ] **Step 2: Add publish error state**

When the publishWorkoutActor fails (machine enters `publishError` state), show:
```
- Tinted red container: bg-[rgba(239,68,68,0.1)] rounded-[var(--radius)] p-6
- Error title: text-[var(--color-error)] font-semibold
- Message: "Your workout is saved locally."
- Retry button: primary gradient
- Dismiss button: ghost
```

- [ ] **Step 3: Add queued publish indicator**

When `useOnlineStatus()` returns false during workout completion, show:
```
- Pulsing orange dot (8x8, rounded-full, animate-pulse)
- "Queued — will publish when online" in primary orange text
- Tinted primary container: bg-[rgba(255,145,83,0.1)]
```

- [ ] **Step 4: Verify**

Run: `npm run dev`
1. Complete a workout → verify normal completion flow works
2. Toggle offline in DevTools → complete a workout → verify queued indicator shows
3. If possible, simulate publish failure → verify error state with retry

- [ ] **Step 5: Commit**

```bash
git add <modified files>
git commit -m "feat: add publish error and offline queued states to workout completion"
```

---

## Task 15: Add Empty State to Workout Log

**Files:**
- Modify: The LogTab component (find via `src/components/tabs/LogTab.tsx` or similar)

- [ ] **Step 1: Read the LogTab component**

Find and read the component that renders the Log tab.

- [ ] **Step 2: Add empty state**

When no workout history exists:
```tsx
<EmptyState
  icon="🏋️"
  heading="No workouts recorded"
  description="Complete your first workout and it'll show up here."
  actionLabel="Browse Templates"
  actionVariant="secondary"
  onAction={() => navigateToTab('library')}
/>
```

- [ ] **Step 3: Add data cluster stats**

If not already present, add the 3-column stats grid at the top of the Log tab (when data exists):
- This Week (count, primary orange, Space Grotesk)
- Total Sets (count, primary orange, Space Grotesk)
- Streak (days, secondary green, Space Grotesk)

Use `font-[var(--font-numeric)]` for all numeric values. Labels: `text-xs uppercase tracking-wide text-[var(--color-on-surface-variant)]`.

- [ ] **Step 4: Verify**

Run: `npm run dev`
1. Fresh account → Log tab shows empty state with "Browse Templates" CTA
2. After completing a workout → Log tab shows stats + workout entry

- [ ] **Step 5: Commit**

```bash
git add <modified files>
git commit -m "feat: add empty state and data cluster stats to Log tab"
```

---

## Task 16: Final Visual Audit Pass

**Files:**
- Any remaining components with hardcoded colors, wrong radius, or 1px borders

- [ ] **Step 1: Audit for hardcoded colors**

Search the codebase for any remaining hardcoded color values that should use Kinetic Precision tokens:
- Search for `oklch(` — should be zero occurrences outside of comments
- Search for `border-` classes that create 1px sectioning borders (violates no-line rule)
- Search for `rounded-` classes that aren't `rounded-[var(--radius)]` or `rounded-xl`
- Search for `font-mono` that should be `font-[var(--font-numeric)]`

- [ ] **Step 2: Fix any remaining issues**

Update hardcoded values to use CSS variables / Tailwind utilities.

- [ ] **Step 3: Full end-to-end verification**

Run: `npm run dev`

Test the complete v1 flow:
1. Open app.powr.build → LoginWall with Kinetic Precision styling
2. Login → 3-tab app shell (Library, Workout, Log)
3. Library shows starter templates (or onboarding CTA if empty)
4. Start workout from template → active workout with orange accent bars, Space Grotesk numbers, set glow
5. Complete 3 sets → complete workout → publish success (or queued if offline)
6. Check Log tab → workout appears with stats cluster
7. Toggle offline → banner appears
8. Check mobile (375px) and desktop (1280px) viewports
9. Verify: no 1px borders anywhere, 12px radius everywhere, Inter body text, Space Grotesk numbers

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: final Kinetic Precision audit — fix remaining hardcoded styles"
```

---

## Task 17: Build Verification

- [ ] **Step 1: Run production build**

```bash
npm run build
```

Verify no TypeScript errors, no build failures.

- [ ] **Step 2: Test production build locally**

```bash
npm run start
```

Open browser → run through the full v1 flow one more time on the production build.

- [ ] **Step 3: Commit any build fixes**

If the build revealed issues, fix and commit.

```bash
git commit -m "fix: resolve build issues from Kinetic Precision migration"
```
