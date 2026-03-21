# shadcn/ui → powr-ui Migration Design

**Date:** 2026-03-21
**Status:** Approved
**Approach:** Build-Then-Sweep (Approach A)

## Problem

24 files in `src/` import from `@/components/ui/` (legacy shadcn/ui). 52+ files already import from `@/components/powr-ui/` (the POWR design system). This split causes:

1. **Font inconsistency** — The `<body>` element sets CSS custom properties (`--font-inter`, `--font-space-grotesk`) but never applies them as `font-family`. All components (both systems) inherit the browser's default sans-serif instead of Inter/Space Grotesk.
2. **Maintenance burden** — Two parallel component libraries with overlapping primitives.
3. **Inconsistent patterns** — Developers must remember which import path to use.

## Scope

### In Scope
- **14 production files** — update imports from `@/components/ui/*` to `@/components/powr-ui/primitives/*`
- **2 new primitives** — Alert, DropdownMenu (port from shadcn with minimal changes)
- **1 component relocation** — Logo moves from `ui/` to `powr-ui/primitives/`
- **1 deletion** — `dashboard-header-DEPRECATED.tsx`
- **1 font fix** — Apply `font-[var(--font-body)]` to `<body>` in layout.tsx

### Out of Scope
- **10 test/dev files** — `src/components/test/*` and `src/components/tabs/TestTab.tsx` remain on shadcn
- **shadcn files still referenced by test code** — button.tsx, card.tsx, badge.tsx, alert.tsx, separator.tsx stay in `ui/`
- **API changes** — This is a path migration, not a component refactor
- **globals.css compatibility layer** — Still needed for test files using shadcn semantic colors

## Font Root Cause Analysis

The body element in `src/app/layout.tsx`:
```tsx
<body className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}>
```

This sets CSS custom properties but does **not** apply font-family. The `globals.css` defines:
```css
--font-body: 'Inter', var(--font-inter), system-ui, sans-serif;
```

But this token is never applied to the body. Neither shadcn nor powr-ui components explicitly set fonts — they inherit from the body.

**Fix:** Add `font-[var(--font-body)]` to the body className. This ensures all components inherit Inter regardless of import path.

## Gap Analysis

### Already Built in powr-ui/primitives/

| shadcn component | powr-ui equivalent | API compatible |
|---|---|---|
| button.tsx | Button.tsx | Yes (same props + extra variants) |
| card.tsx | Card.tsx | Yes (same compound components + accent prop) |
| input.tsx | Input.tsx | Yes |
| label.tsx | Label.tsx | Yes |
| dialog.tsx | Dialog.tsx | Yes (same 10 exports, minor style diffs) |
| badge.tsx | Badge.tsx | Yes (same variants + success) |
| tabs.tsx | Tabs.tsx | Yes |
| sheet.tsx | Sheet.tsx | Yes |

### Needs Building

| Component | Reason | Consumer count |
|---|---|---|
| Alert.tsx | Not in powr-ui | 1 production file (LoginDialog) |
| DropdownMenu.tsx | Not in powr-ui | 2 production files (ExerciseMenuDropdown, WorkoutMenuDropdown) |

### Needs Relocation

| Component | From | To |
|---|---|---|
| Logo.tsx | `ui/logo.tsx` | `powr-ui/primitives/Logo.tsx` |

## New Primitive Specifications

### Alert.tsx

- **Source:** Port from `src/components/ui/alert.tsx` with minimal changes
- **Exports:** `Alert`, `AlertTitle`, `AlertDescription`
- **Variants:** `default`, `destructive` (CVA-based)
- **Dependencies:** `class-variance-authority`, `@/lib/utils`
- **Style approach:** Keep shadcn semantic class names (`bg-card`, `text-destructive`) — these already map to POWR tokens via the compatibility layer in globals.css
- **Consumer usage:** LoginDialog uses `Alert` + `AlertDescription` only

### DropdownMenu.tsx

- **Source:** Port from `src/components/ui/dropdown-menu.tsx` with minimal changes
- **Exports:** All 15 sub-components (DropdownMenu, Portal, Trigger, Content, Group, Label, Item, CheckboxItem, RadioGroup, RadioItem, Separator, Shortcut, Sub, SubTrigger, SubContent)
- **Dependencies:** `@radix-ui/react-dropdown-menu`, `lucide-react`, `@/lib/utils`
- **Style approach:** Keep shadcn semantic class names — compatibility layer handles token mapping
- **Consumer usage:** Both consumers use 5 sub-components: DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger

### Logo.tsx

- **Source:** Move `src/components/ui/logo.tsx` as-is (no code changes)
- **Exports:** `Logo`
- **Dependencies:** `next/image`, `next-themes`, `@/lib/utils`

## Implementation Phases

### Phase 0: Font Fix

**File:** `src/app/layout.tsx`

Add `font-[var(--font-body)]` to the body className:
```tsx
<body className={`${inter.variable} ${spaceGrotesk.variable} font-[var(--font-body)] antialiased`}>
```

### Phase 1: Build Primitives

1. Create `src/components/powr-ui/primitives/Alert.tsx` — port from shadcn
2. Create `src/components/powr-ui/primitives/DropdownMenu.tsx` — port from shadcn
3. Move `src/components/ui/logo.tsx` → `src/components/powr-ui/primitives/Logo.tsx`
4. Update barrel exports in `src/components/powr-ui/index.ts`:
   - Add Alert, AlertTitle, AlertDescription
   - Add all DropdownMenu sub-components
   - Add Logo

### Phase 2: Sweep Imports (14 files)

Each file changes `from '@/components/ui/X'` → `from '@/components/powr-ui/primitives/X'` with appropriate casing adjustment (e.g., `ui/dialog` → `primitives/Dialog`).

**Dialog consumers (8 files):**
1. `src/components/powr-ui/workout/WorkoutHistoryDetailModal.tsx`
2. `src/components/powr-ui/workout/WorkoutSummaryModal.tsx`
3. `src/components/powr-ui/workout/ActiveWorkoutInterface.tsx`
4. `src/components/powr-ui/workout/WorkoutDetailModal.tsx`
5. `src/components/powr-ui/workout/SupersetGroup.tsx`
6. `src/components/auth/LoginDialog.tsx` (also imports Alert)
7. `src/components/library/ExerciseDetailModal.tsx`
8. `src/components/search/GlobalWorkoutSearch.tsx`

**Card + Button consumers (3 files):**
9. `src/components/dashboard/recent-workouts.tsx`
10. `src/components/dashboard/quick-actions.tsx`
11. `src/app/auth/callback/[...result]/page.tsx`

**DropdownMenu consumers (2 files):**
12. `src/components/powr-ui/workout/ExerciseMenuDropdown.tsx`
13. `src/components/powr-ui/workout/WorkoutMenuDropdown.tsx`

**Logo consumer (1 file):**
14. `src/components/navigation/DesktopSidebar.tsx`

### Phase 3: Cleanup

1. Delete `src/components/deprecated/dashboard-header-DEPRECATED.tsx`
2. Identify orphaned shadcn files — delete only those with zero remaining imports:
   - `ui/dialog.tsx` — safe to delete (no test imports)
   - `ui/dropdown-menu.tsx` — safe to delete (no test imports)
   - `ui/sheet.tsx` — safe to delete (no test imports)
   - `ui/tabs.tsx` — safe to delete (no test imports)
   - `ui/input.tsx` — safe to delete (no test imports)
   - `ui/label.tsx` — safe to delete (no test imports)
   - `ui/logo.tsx` — safe to delete after relocation
   - **Keep:** `ui/button.tsx`, `ui/card.tsx`, `ui/badge.tsx`, `ui/alert.tsx`, `ui/separator.tsx` (still imported by test files)

### Phase 4: Verify

1. Run `next build` — confirm no build errors
2. Grep for `@/components/ui/` in non-test production files — should return zero
3. Verify remaining `ui/` files are only imported by test files

## Risk Assessment

**Low risk:**
- All powr-ui primitives have identical export APIs to their shadcn counterparts
- Import path changes are mechanical — no logic changes
- New primitives are direct ports with minimal modifications
- Compatibility layer in globals.css ensures color tokens work identically

**Watch for:**
- The shadcn Dialog's `showCloseButton` prop (added in newer shadcn) is not present in the powr-ui Dialog. If any consumer passes `showCloseButton={false}`, it will need handling. (Quick check: none of the 8 Dialog consumers use this prop.)
- The powr-ui Dialog has `bg-black/80` overlay vs shadcn's `bg-black/50`. This is an intentional design choice, not a bug.

## Success Criteria

1. Zero `@/components/ui/` imports in production code (test files excluded)
2. `next build` succeeds with no errors
3. All fonts render as Inter (body text) / Space Grotesk (numeric) across the app
4. No visual regressions in workout modals, dashboard cards, dropdowns, or auth flows
