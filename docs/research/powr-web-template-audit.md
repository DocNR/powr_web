---
title: POWR Web Template + Projection Contract Audit
description: Audit of 33401/33402 template handling and projection provenance in the POWR web app
status: draft
last_updated: 2026-01-27
last_verified: 2026-01-27
related_code:
  - /src/lib/services/workoutEventGeneration.ts
  - /src/lib/services/templateManagementService.ts
  - /src/lib/services/dependencyResolution.ts
  - /src/lib/services/dataParsingService.ts
  - /src/providers/WorkoutDataProvider.tsx
  - /src/lib/machines/workout/workoutLifecycleMachine.ts
  - /src/lib/machines/workout/workoutSetupMachine.ts
category: research
formatting_rules:
  - "Document findings with specific file/function references"
  - "Call out deviations from addressable semantics explicitly"
  - "End with actionable refactor recommendations"
---

# POWR Web Template + Projection Contract Audit

## Scope
- Audit web code paths that **create, resolve, cache, or update** templates:
  - Exercise templates (kind **33401**)
  - Workout templates (kind **33402**)
- Audit **projection / workout record** generation (kind **1301**)
- Verify **addressable semantics** handling (d-tag usage, replacement logic, tie-break rules)
- Identify how workout records store **template provenance**
- Identify how **projections** reference templates today
- Propose a unified **TemplateResolver + ProjectionBuilder** contract for iOS parity

---

## Findings

### 1) Template creation/update paths (33402)
- **`src/lib/services/templateManagementService.ts`**
  - `createModifiedTemplate()` → publishes a new **33402** with a **new d-tag**, sets `['title']`, `['type']`, and `['exercise']` tags with **set_number** included (8th param).
  - `updateExistingTemplate()` → publishes **same d-tag** to replace existing template.
  - `createCustomTemplate()` → publishes a new **33402** with a **new d-tag**.
  - **Addressable behavior**: uses correct *address identity* (kind + pubkey + d-tag) when updating, but **does not implement tie-break selection** (created_at + lexical event_id) when multiple versions exist.

- **`src/lib/machines/workout/actors/saveTemplateActor.ts`**
  - Calls `libraryManagementService.createModifiedTemplate()` → generates a new **33402** and publishes it.
  - Adds template to library collection via `libraryManagementService.addToLibraryCollection()`.
  - **Template reference format**: `33402:${pubkey}:${dTag}`.

### 2) Workout record generation (1301 projections)
- **`src/lib/services/workoutEventGeneration.ts`**
  - `generateWorkoutRecord()` constructs **1301** event.
  - Injects **template provenance** via `['template', templateReference, relayUrl]` when available.
  - Adds **set_number** to each `exercise` tag (8th parameter) to prevent NDK tag deduplication.

- **`src/lib/machines/workout/actors/publishWorkoutActor.ts`**
  - Uses `workoutEventGenerationService.generateWorkoutRecord()`.
  - Publishes via `publishEvent()` (Global NDK Actor).
  - Uses full `templateReference` from lifecycle context (already `33402:pubkey:d-tag`).

### 3) Template resolution + caching
- **`src/lib/services/dependencyResolution.ts`**
  - `resolveTemplateDependencies()` → batched `kinds=[33402]`, `authors`, `#d` filters (cache-first).
  - `resolveSingleTemplate()` → resolves a single template + its exercise references.
  - `resolveExerciseReferences()` → batched `kinds=[33401]` by pubkey and d-tag.
  - **Caching** uses `universalNDKCacheService` (CACHE_FIRST / ONLY_CACHE / PARALLEL).
  - **Addressable semantics**: relies on NDK fetch results; no explicit tie-break selection when multiple versions for same address arrive.

- **`src/lib/machines/workout/actors/loadTemplateActor.ts`**
  - Calls `dependencyResolutionService.resolveSingleTemplate()` for `templateReference`.

- **`src/lib/machines/workout/workoutSetupMachine.ts`**
  - Uses `loadTemplateActor` for preselected template and selected template.
  - Constructs `templateReference` from selected template via `33402:${pubkey}:${dTag}`.

### 4) Parsing / projection provenance
- **`src/lib/services/dataParsingService.ts`**
  - `parseWorkoutEvent()` extracts `templateReference` from `['template']` tag and sets `templatePubkey` from split.
  - `parseWorkoutTemplate()` parses 33402 templates; counts `exercise` tags into sets.
  - **Assumption**: template `exercise` tags do not include set_number in parse; `parseWorkoutTemplate()` ignores 8th param (set_number). If present, it does **not break**, but it is not consumed.

### 5) Social feed + discovery behavior (projection consumption)
- **`src/providers/WorkoutDataProvider.tsx`**
  - Social feed is built from **1301 records**; extracts `templateReference` from `['template']` tag.
  - Fetches corresponding **33402** via cache-first and uses it to populate “social workout” card.
  - Discovery feed pulls **33402** directly.
  - **Template reference** is reused in `WorkoutsTab` to start a workout.

- **`src/components/tabs/WorkoutsTab.tsx`**
  - Starts lifecycle machine with `templateReference` resolved from social or discovery items.
  - Uses resolved template data for modal display and for starting workout.

### 6) Exercise template parsing (33401)
- **`src/lib/services/dataParsingService.ts`**
  - `parseExerciseTemplate()` requires `d`, `title`, `format`, `format_units`, `equipment`.
  - Preserves **raw tags** (NIP‑92 support).
  - **Addressable semantics**: relies on event-level fetch; no explicit tie-break selection for identical address.

---

## Deviations / Risks vs Addressable Semantics

1. **Missing explicit tie-break selection**
   - NIP‑01 requires: **newer `created_at` wins**, and **if equal** choose **lexicographically lowest `event_id`**.
   - Current code relies on `NDK.fetchEvents` order without a deterministic tie-break in:
     - `dependencyResolutionService.resolveTemplateDependencies()`
     - `resolveExerciseReferences()`
     - `WorkoutDataProvider.fetchTemplateForSocialWorkout()`
     - `workoutSetupMachine.loadTemplatesActor()`

2. **33402 parsing ignores set_number**
   - Templates are now published with **set_number** to prevent NDK dedupe; parser ignores index 7.
   - **Current behavior is tolerant**, but the parser should explicitly accept set_number to prevent future mismatches.

3. **Dynamic import in WorkoutDataProvider**
   - `fetchTemplateForSocialWorkout()` uses `import('@/lib/services/ndkCacheService')` inline.
   - This can cause **module context inconsistencies** (per `xstate-anti-pattern-prevention.md`).

4. **Addressable identity present but not normalized**
   - Template references are consistently `33402:${pubkey}:${dTag}`, but no central resolver ensures normalization or validates `pubkey`/`dTag`.

---

## How workouts store template provenance today

- **Workout record (1301)** includes:
  - `['template', '33402:pubkey:d-tag', relay-url]` (optional relay URL)
- `parseWorkoutEvent()` stores:
  - `templateReference` (full string)
  - `templatePubkey` (parsed from reference)

This aligns with **iOS requirement** to store `template_addr` on workout sessions, but it lacks a standardized “template address” object for downstream projection building.

---

## How projections reference templates (or should)

- **Current**: 1301 uses `['template', templateReference, relay-url]`.
- **Recommended**: projections should always carry **addressable identity** (kind+pubkey+d-tag) and optionally a `relay` component.
- **Needed**: a single contract (see below) to generate projection tags and to validate addressable refs.

---

## Proposed Unified Contract (iOS parity)

### TemplateResolver Contract
**Goal**: consistent, deterministic addressable behavior in both web and iOS.

```typescript
interface TemplateAddress {
  kind: 33401 | 33402;
  pubkey: string;
  dTag: string;
  relay?: string;
}

interface TemplateResolver {
  resolveTemplates(addresses: TemplateAddress[]): Promise<ResolvedTemplate[]>;
  resolveExercises(addresses: TemplateAddress[]): Promise<ResolvedExercise[]>;
  resolveTemplate(address: TemplateAddress): Promise<ResolvedTemplate | null>;
  selectLatest(events: NDKEvent[]): NDKEvent | null;
}
```

**Required behaviors:**
- **Normalize** input references into `TemplateAddress`.
- **Select latest** version by `created_at`, tie‑break by **lexical event_id**.
- **Cache-first** strategy with offline support.
- Always return **raw tags** for media (NIP‑92) and debug.

### ProjectionBuilder Contract
**Goal**: deterministic 1301 projection output compatible with NIP-101e + iOS requirements.

```typescript
interface ProjectionInput {
  sessionId: string;
  templateAddress?: TemplateAddress;
  completedSets: CompletedSet[];
  startTime: number;
  endTime: number;
  title: string;
  workoutType: 'strength' | 'circuit' | 'emom' | 'amrap';
  notes?: string;
}

interface ProjectionBuilder {
  buildWorkoutRecord(input: ProjectionInput): NostrEvent; // kind 1301
  ensureSetNumber(tags: string[][]): string[][];
  validate(input: ProjectionInput): ValidationResult;
}
```

**Required behaviors:**
- Always write `['template', '33402:pubkey:d-tag', relay]` if templateAddress exists.
- Always include **set_number** for repeated `exercise` tags.
- Maintain ordering rules from `format`/`format_units` in 33401.

---

## Refactors Needed for Web + iOS Alignment

1. **Centralize addressable selection**
   - Add `TemplateResolver.selectLatest()` and use in:
     - `dependencyResolutionService.resolveTemplateDependencies()`
     - `resolveExerciseReferences()`
     - `WorkoutDataProvider.fetchTemplateForSocialWorkout()`
     - `workoutSetupMachine.loadTemplatesActor()`

2. **Parse set_number in 33402 templates**
   - Update `dataParsingService.parseWorkoutTemplate()` to read index 7 when present (optional).

3. **Replace dynamic import in WorkoutDataProvider**
   - Move template fetch logic into a resolver service (static import) to avoid module-context drift.

4. **Standardize TemplateAddress**
   - Create a single `TemplateAddress` helper and validation method used across web/iOS.

---

## Summary
- Web app already uses correct **template reference format** and injects **set_number** into 33402/1301.
- **Addressable tie‑break** is not enforced; selection relies on NDK ordering.
- A shared resolver + projection builder contract will align web and iOS.

**Next**: implement the resolver/contract above and update parsing to explicitly tolerate `set_number` in 33402 exercise tags.