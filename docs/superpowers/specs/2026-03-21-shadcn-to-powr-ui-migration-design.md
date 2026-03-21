# shadcn/ui → powr-ui Migration Design

**Date:** 2026-03-21
**Status:** Approved
**Approach:** Build-Then-Sweep (Approach A)

## Problem

24 files in `src/` import from `@/components/ui/` (legacy shadcn/ui). 52+ files already import from `@/components/powr-ui/` (the POWR design system). This split causes:

1. **Maintenance burden** — Two parallel component libraries with overlapping primitives.
2. **Inconsistent patterns** — Developers must remember which import path to use.
3. **API drift** — The shadcn Dialog has gained a `showCloseButton` prop that the powr-ui Dialog lacks, creating a compatibility gap that grows over time.

## Scope

### In Scope
- **14 production files** — update imports from `@/components/ui/*` to `@/components/powr-ui/primitives/*`
- **2 new primitives** — Alert, DropdownMenu (port from shadcn with minimal changes)
- **1 component relocation** — Logo moves from `ui/` to `powr-ui/primitives/`
- **1 deletion** — `dashboard-header-DEPRECATED.tsx`
- **1 Dialog enhancement** — Add `showCloseButton` prop to powr-ui Dialog (6 consumers need it)

### Out of Scope
- **9 test/dev files** — 8 files in `src/components/test/*` plus `src/components/tabs/TestTab.tsx` remain on shadcn
- **shadcn files still referenced by test code** — button.tsx, card.tsx, badge.tsx, alert.tsx, separator.tsx stay in `ui/`
- **API changes** — This is a path migration, not a component refactor
- **globals.css compatibility layer** — Still needed for test files using shadcn semantic colors

## Font Note

The `globals.css` already applies `font-family: var(--font-body)` to `html, body` (line 71). If font inconsistencies persist after this migration, the root cause is elsewhere (CSS specificity, loading order, or component-level overrides) — not a missing body font-family declaration.

## Gap Analysis

### Already Built in powr-ui/primitives/

| shadcn component | powr-ui equivalent | API compatible |
|---|---|---|
| button.tsx | Button.tsx | Yes (same props + extra variants) |
| card.tsx | Card.tsx | Yes (same compound components + accent prop) |
| input.tsx | Input.tsx | Yes |
| label.tsx | Label.tsx | Yes |
| dialog.tsx | Dialog.tsx | Partial — same 10 exports but powr-ui lacks `showCloseButton` prop (see Dialog Enhancement below) |
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
- **Exports:** All 15 sub-components: `DropdownMenu`, `DropdownMenuPortal`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuGroup`, `DropdownMenuLabel`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`
- **Dependencies:** `@radix-ui/react-dropdown-menu`, `lucide-react`, `@/lib/utils`
- **Style approach:** Keep shadcn semantic class names — compatibility layer handles token mapping
- **Consumer usage:** Both consumers use 5 sub-components: DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger

### Logo.tsx

- **Source:** Move `src/components/ui/logo.tsx` as-is (no code changes)
- **Exports:** `Logo`
- **Dependencies:** `next/image`, `next-themes`, `@/lib/utils`

## Implementation Phases

### Phase 1: Build Primitives & Enhance Dialog

1. **Enhance powr-ui Dialog** — Add `showCloseButton` prop (default `true`) to `DialogContent` in `src/components/powr-ui/primitives/Dialog.tsx`. Port the pattern from the shadcn Dialog: wrap the close button in `{showCloseButton && (...)}`. This is required because 6 of 8 Dialog consumers pass `showCloseButton={false}`:
   - `WorkoutHistoryDetailModal.tsx`
   - `WorkoutDetailModal.tsx`
   - `WorkoutSummaryModal.tsx`
   - `ActiveWorkoutInterface.tsx`
   - `ExerciseDetailModal.tsx`
   - `GlobalWorkoutSearch.tsx`
2. Create `src/components/powr-ui/primitives/Alert.tsx` — port from shadcn
3. Create `src/components/powr-ui/primitives/DropdownMenu.tsx` — port from shadcn
4. Move `src/components/ui/logo.tsx` → `src/components/powr-ui/primitives/Logo.tsx`
5. Update barrel exports in `src/components/powr-ui/index.ts`:
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
2. Grep for `@/components/ui/` excluding `src/components/test/*` and `src/components/tabs/TestTab.tsx` — should return zero
3. Verify remaining `ui/` files are only imported by the 9 excluded test/dev files

## Risk Assessment

**Low risk:**
- All powr-ui primitives have identical export APIs to their shadcn counterparts
- Import path changes are mechanical — no logic changes
- New primitives are direct ports with minimal modifications
- Compatibility layer in globals.css ensures color tokens work identically

**Watch for:**
- The powr-ui Dialog has `bg-black/80` overlay vs shadcn's `bg-black/50`. This is an intentional design choice, not a bug.
- After the `showCloseButton` enhancement, verify TypeScript compilation passes — the prop type must be added to the DialogContent type signature.

## Success Criteria

1. Zero `@/components/ui/` imports in production code (test files excluded)
2. `next build` succeeds with no errors
3. Fonts continue rendering as Inter (body) / Space Grotesk (numeric) — no regression from migration
4. No visual regressions in workout modals, dashboard cards, dropdowns, or auth flows
