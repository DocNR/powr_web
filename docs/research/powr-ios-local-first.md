# POWR iOS Local-First Architecture & Migration Guide (v3)

> **Purpose**  
> This document defines the canonical architecture and migration strategy for a future **native SwiftUI POWR app**, updated with correct **NIP-01 replaceable / addressable semantics** for templates (kinds 33401, 33402).  
>  
> This is a **decision document**. Architectural choices here are considered locked unless explicitly revised.

---

## 1. Architectural North Star

### Core principles
1. **Local-first is canonical**
   - The app must function fully offline.
   - Users must always be able to view and edit their own workout history without relays.

2. **Reducers + Effects (TCA-style)**
   - App behavior is modeled as deterministic state transitions.
   - Side effects (DB, Nostr, timers) are isolated and cancellable.

3. **SQLite (GRDB) is the source of truth**
   - Canonical workout state lives in a local database.
   - Nostr events are *derived artifacts*, never the primary store.

4. **Nostr is a service layer**
   - Used for publishing, social discovery, templates, and optional encrypted backup.
   - Never required for core functionality.

5. **Projections are first-class**
   - A workout can have 0..N published representations (“projections”).
   - Each projection is immutable, signed, and independently visible.

---

## 2. Terminology

| Term | Meaning |
|---|---|
| **Workout Session** | Canonical local workout (`session_id`, mutable) |
| **Projection** | A derived Nostr event representing some view of a workout |
| **Template** | Addressable, replaceable Nostr object (33401 / 33402) |
| **Public Projection** | Socially visible summary / PR / milestone |
| **Private Projection** | Encrypted full workout for backup |
| **event_id** | Hash of a signed Nostr event (immutable) |
| **session_id** | Stable UUID identifying the workout forever |
| **template_addr** | `(pubkey, kind, d-tag)` identity for templates |

---

## 3. Reducer / Effects Architecture (TCA-Style)

> “TCA-style” refers to the **shape**, not a required dependency on the TCA framework.

### Reducer contract (non-negotiable)
- Reducers **must be pure**
- Reducers **may not**:
  - perform IO
  - access singletons
  - talk to Nostr directly
- Reducers:
  - mutate state
  - return Effects
- Effects:
  - perform async / impure work
  - must emit Actions back into the system

This architecture is the **native Swift equivalent** of existing XState semantics.

---

## 4. Core Reducers (iOS v0)

iOS MVP must implement **only these reducers**:

1. **WorkoutLifecycleReducer**
   - setup → active → completed
   - owns navigation boundaries

2. **ActiveWorkoutReducer** (highest priority)
   - complete/edit/uncomplete sets
   - rest timers (cancellable)
   - add/remove/reorder/substitute exercises
   - pause/resume

3. **WorkoutHistoryReducer**
   - list sessions from local DB
   - edit completed workouts (local truth)

4. **TemplateLibraryReducer**
   - manage installed exercise/workout templates (33401/33402)
   - resolve, cache, and update addressable templates

5. **ProjectionDraftReducer** (minimal)
   - Contacts-style selective sharing
   - build + publish projections

---

## 5. Persistence Strategy (SQLite + GRDB)

### Canonical workout tables
- `workout_sessions`
- `workout_private` (notes, flags)
- `workout_media` (file pointers)

### Template tables (addressable)
Templates are **parameterized replaceable events** per NIP-01.

Store templates by **address**, not event_id.

- `exercise_templates`
  - `author_pubkey`
  - `kind` (33401)
  - `d_tag`
  - `latest_event_id`
  - `created_at`
  - `content_json`
- `workout_templates`
  - `author_pubkey`
  - `kind` (33402)
  - `d_tag`
  - `latest_event_id`
  - `created_at`
  - `content_json`

**Unique constraint** on `(author_pubkey, kind, d_tag)`.

If two versions arrive with equal timestamps, retain the one with the **lowest lexical event_id**, per NIP-01.

### Nostr-related tables
- `nostr_events` (raw inbound/outbound, keyed by `event_id`)
- `projection_index`
  - `session_id`
  - `event_id`
  - `projection_type`
  - `visibility` (public / encrypted)
  - `status` (pending / sent / failed)
- `outbox`
  - pending publish attempts
  - retry metadata

---

## 6. Templates (Kinds 33401 / 33402)

### Semantics (NIP-01)
- 33401 and 33402 are **parameterized replaceable (addressable)** events.
- Canonical identity is `(pubkey, kind, d-tag)`.
- New versions replace older ones at the same address.

### Role in POWR
- **33401 (Exercise Templates)**:
  - reusable exercise definitions
  - parameters define sets, reps, load, units, etc.

- **33402 (Workout Templates)**:
  - compositions of 33401 references
  - define workout structure and defaults

### Local-first behavior
- Templates are cached locally and usable offline.
- Users may:
  - save/install templates to their library
  - organize them locally
  - start workouts from them without network access

---

## 7. Projections (Activity Layer)

### Definition
A **Projection** is a signed Nostr event derived from a **performed workout session**.

### Projection taxonomy (initial)
| Type | Visibility | Purpose |
|---|---|---|
| `public_summary` | Public | Social feed card |
| `pr_event` | Public | Milestones / PRs |
| `private_backup_encrypted` | Private | Full workout backup |
| `updated_public_summary` | Public | Re-share with different fields |

### Template integration
- Workout sessions store `template_addr` if started from a 33402.
- Projections include `template_addr`:
  - enables “View template”
  - enables “Save template”
  - enables “Start this workout”

Templates are the **recipe**; projections are the **execution**.

---

## 8. Nostr Layer (Service Boundary)

### SDK choice
- Use **`nostr-essentials`** for:
  - event creation/signing
  - NIP-44 encryption
  - relay pool + outbox routing

### POWR Nostr service contract
```swift
protocol NostrService {
  func publish(_ event: NostrEvent) async throws -> EventID
  func subscribe(_ filters: [NostrFilter]) -> AsyncStream<NostrEvent>
  func encrypt(_ payload: Data, for pubkey: PubKey) throws -> Data
  func decrypt(_ payload: Data) throws -> Data
}

Reducers never interact with this directly.

---

## 9. NIP-101e Compliance (Hard Requirements)

- Tags must be **array-based**, not comma-encoded
- Parameters must be separate array elements
- Parsing must be strict; preserve raw tags for debugging
- POWR generation rules may be stricter than POWR parsing tolerance
- POWR-generated events MUST include set_number for repeated exercise tags (templates and records), independent of library behavior, to prevent silent deduplication in downstream tooling.

---

## 10. Encrypted Backup Strategy

- Encrypted backups are **full serializations** of canonical workouts
- Encryption via **NIP-44**
- Published to user-selected private/paid relays
- Restore flow:
  1. Fetch encrypted projections
  2. Decrypt
  3. Hydrate canonical local DB

Backups are **optional**, not required for core UX.

---

## 11. Migration Phases

### Phase 1: Local-only iOS MVP
- Active workout
- History
- Notes / photos
- SQLite persistence
- Template library (local + cached)
- No Nostr required

### Phase 2: Public projections
- Build + publish `public_summary`
- Projection timeline UI
- Template references in projections

### Phase 3: Social feed
- Subscribe to public projections
- Subscribe to shared templates (33402)
- Cache feed locally

### Phase 4: Encrypted backups
- Private projections
- Restore on new device

---

## 12. Testing Strategy (Non-Optional)

### Trace tests
- Given initial state + action sequence
- Assert final state + invariants

### Contract tests
- ProjectionBuilder output must match NAK examples exactly
- Template resolution must respect addressable semantics
- Same test vectors used in:
  - web (TypeScript)
  - iOS (Swift)

These tests are the **migration harness**.

---

## 13. Non-Goals (Explicit)

- Forking a full iOS social client
- Treating Nostr as canonical storage
- Cross-device sync before MVP
- Perfect parity with every Nostr client

---

## Status
**Architecture locked.**  
Templates are addressable.  
Projections are activity artifacts.  
Local-first remains canonical.

---

## Related research
- **Web audit**: `docs/research/powr-web-template-audit.md` (template/projection parity review)
