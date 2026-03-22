# POWR iOS App — Design Spec & Revised NIP-101e

## Context

POWR is a Nostr-native exercise/workout tracking app. The existing Next.js web version (`powr_web`) has the UX patterns and NIP-101e data model but is too buggy to ship. The goal is to build a native iOS app using SwiftUI + GRDB + rust-nostr-swift, using the Gambit Golf app (`raid.golf`) as the architectural template.

This spec covers two deliverables:
1. **Revised NIP-101e specification** — cleaned up to match NIP-101g's rigor
2. **iOS app architecture** — full design for the native app

### Confirmed Requirements
- Full social app (tracker + relay discovery + social feed + zaps)
- Bundled exercise database (~200 exercises) + relay sync
- All workout types: strength, superset, circuit, EMOM, AMRAP, metcon
- Local Nostr keys only (nsec in Keychain)
- Full collections (NIP-51 kind 30003)
- NWC zaps (NIP-47)
- iOS 17+ / SwiftUI + GRDB + rust-nostr-swift
- @Observable stores (Gambit pattern, not TCA)

---

# Part 1: Revised NIP-101e Specification

## Event Kinds

| Kind | Name | Type | Purpose |
|------|------|------|---------|
| **33401** | Exercise Template | Addressable Replaceable | Reusable exercise definitions |
| **33402** | Workout Template | Addressable Replaceable | Workout plans referencing exercises |
| **1301** | Workout Record | Regular (immutable) | Permanent completed workout data |

> **Future extension:** Kinds 1300 (workout initiation with embedded template snapshot) and 31300 (live workout progress) are reserved for group workout features (CrossFit leaderboards, real-time sharing). Not in v1.
>
> **Backward compatible:** Kind 1301 remains the workout record, same as the original NIP-101e PR.

---

### Exercise Template (kind 33401)

Addressable event defining a reusable exercise. Identity: `kind + pubkey + d`. The `.content` field is optional free-text description with form instructions.

**Required tags:**

| Tag | Format | Description |
|-----|--------|-------------|
| `d` | `<slug>` | Stable, lowercase, hyphenated identifier |
| `title` | `<text>` | Exercise name |
| `format` | `<param>`, `<param>`, ... | Parameter schema (e.g. `weight`, `reps`, `rpe`, `set_type`) |
| `format_units` | `<unit>`, `<unit>`, ... | Units in same order (e.g. `kg`, `count`, `0-10`, `enum`) |
| `equipment` | `<type>` | `barbell`, `dumbbell`, `bodyweight`, `machine`, `kettlebell`, `cable`, `resistance_band`, `cardio` |

**Optional tags:**

| Tag | Format | Description |
|-----|--------|-------------|
| `difficulty` | `<level>` | `beginner`, `intermediate`, `advanced` |
| `t` | `<hashtag>` | Categorization. `fitness` recommended |
| `imeta` | (NIP-92) | Media for form demonstrations |

**Format/format_units parameter system:**

| Parameter | Valid Units | Description |
|-----------|-------------|-------------|
| `weight` | `kg`, `lbs` | Load. `0` = bodyweight, negative = assisted |
| `reps` | `count` | Repetition count |
| `rpe` | `0-10` | Rate of Perceived Exertion |
| `set_type` | `enum` | Values: `warmup`, `normal`, `drop`, `failure` |
| `duration` | `seconds`, `minutes` | Time-based parameter |
| `distance` | `meters`, `km`, `miles` | Distance-based parameter |

**Example:**
```jsonc
{
  "kind": 33401,
  "content": "Stand with feet hip-width apart, barbell over midfoot. Hinge at hips, grip bar outside knees.",
  "tags": [
    ["d", "barbell-deadlift"],
    ["title", "Barbell Deadlift"],
    ["format", "weight", "reps", "rpe", "set_type"],
    ["format_units", "kg", "count", "0-10", "enum"],
    ["equipment", "barbell"],
    ["difficulty", "intermediate"],
    ["t", "legs"], ["t", "posterior"], ["t", "compound"], ["t", "fitness"]
  ]
}
```

---

### Workout Template (kind 33402)

Addressable event defining a workout plan. Identity: `kind + pubkey + d`. The `.content` field is optional description/instructions.

**Required tags:**

| Tag | Format | Description |
|-----|--------|-------------|
| `d` | `<slug>` | Stable identifier |
| `title` | `<text>` | Workout name |
| `type` | `<workout-type>` | `strength`, `superset`, `circuit`, `emom`, `amrap`, `metcon` |
| `exercise` | See below | One tag per prescribed set |

**Optional tags:**

| Tag | Format | Description |
|-----|--------|-------------|
| `rounds` | `<integer>` | Number of rounds |
| `duration` | `<seconds>` | Total workout duration cap |
| `interval` | `<seconds>` | Duration per exercise portion |
| `rest_between_sets` | `<seconds>` | Rest between sets |
| `rest_between_rounds` | `<seconds>` | Rest between rounds |
| `difficulty` | `<level>` | `beginner`, `intermediate`, `advanced` |
| `t` | `<hashtag>` | `fitness` recommended |
| `alt` | `<text>` | Human-readable fallback |
| `client` | `<client-name>` | Publishing client |

**Exercise tag format (templates and records):**
```
["exercise", "<kind>:<pubkey>:<d-tag>", "<relay-hint>", "<param1>", "<param2>", ..., "<set_number>"]
```

Parameters follow the order from the referenced exercise's `format` tag. Final element is always `set_number` — a per-exercise integer counter (1, 2, 3...) that ensures uniqueness and prevents NDK tag deduplication. Empty strings indicate "user decides at workout time."

In superset/circuit contexts, matching `set_number` values across different exercises indicate grouping.

---

### Workout Record (kind 1301)

Regular (immutable) event for permanent completed workout data. The `.content` field is optional free-text notes about the workout (e.g., "Felt strong today. PR on bench.").

**Required tags:**

| Tag | Format | Description |
|-----|--------|-------------|
| `exercise` | Same positional format | One per completed set, actual values |
| `start` | `<unix-timestamp>` | Workout start |
| `end` | `<unix-timestamp>` | Workout end |
| `completed` | `true` \| `false` | Whether completed as planned |
| `type` | `<workout-type>` | Workout type |
| `title` | `<text>` | Workout title |

**Optional tags:**

| Tag | Format | Description |
|-----|--------|-------------|
| `a` | `33402:<pubkey>:<d-tag>`, `<relay-url>` | Template reference for discovery |
| `rounds_completed` | `<integer>` | For circuit/EMOM/AMRAP |
| `pr` | `<exercise-ref>`, `<metric>`, `<value>` | Personal record (separate elements) |
| `p` | `<pubkey>`, `<relay-hint>` | Workout partners |
| `alt` | `<text>` | Fallback |
| `t` | `<hashtag>` | `fitness` recommended |
| `client` | `<client-name>` | Publishing client |

**PR metrics:** `1rm`, `max_weight`, `max_reps`, `max_volume`

---

### Event Relationships

```
33401 (exercise) ──referenced by──▶ 33402 (template)
                                        │
                                  optional ref (a tag)
                                        ▼
                                    1301 (workout record)
```

Templates are the recipe; workout records are the execution. The 1301 record contains the actual exercises and sets performed, referencing the template via an optional `a` tag.

---

### Changes from Current NIP-101e

| Aspect | Current | Revised | Rationale |
|--------|---------|---------|-----------|
| Event kinds | 3 (33401, 33402, 1301) | 3 (same kinds, improved tags) | Backward compatible, minimal |
| Kind 1301 | Final workout record | Final workout record (unchanged) | Same meaning |
| `pr` tag | Comma-delimited | Separate array elements | Consistent with all other tags |
| `alt`/`client` tags | Not specified | Added | 101g pattern |
| `p` tag | Not specified | Added | Multi-participant support |

**Backward compatible:** Same 3 kinds as original, with improved tag structure (alt, client, p, separate PR elements).

---

# Part 2: iOS App Architecture

## Tech Stack

- **SwiftUI** (iOS 17+) — @Observable, modern navigation
- **GRDB** — SQLite, local-first source of truth
- **rust-nostr-swift** (NostrSDK) — relay pool, event building, signing
- **@Observable stores** — Gambit pattern, method-based actions
- **Environment-based DI** — EnvironmentKey injection

## Project Structure

```
ios/POWR/
├── POWRApp.swift                    # Entry point, environment setup
├── ContentView.swift                # Root TabView (4 tabs)
│
├── Models/                          # Domain types
│   ├── WorkoutModels.swift          # Session, Exercise, Set structs
│   ├── TemplateModels.swift         # Exercise/workout template types
│   ├── SocialModels.swift           # FeedItem, Profile, Reaction
│   └── Enums.swift                  # WorkoutType, SetType, Equipment
│
├── Database/                        # GRDB schema + repositories
│   ├── Schema.swift                 # Migrations + immutability triggers
│   ├── WorkoutRepository.swift      # Sessions, exercises, sets CRUD
│   ├── TemplateRepository.swift     # Content-addressed template storage
│   ├── CacheRepository.swift        # Relay-fetched cache tables
│   ├── Canonical.swift              # RFC 8785 JCS (templates only)
│   └── Hashing.swift                # SHA-256 (templates only)
│
├── Nostr/                           # Nostr integration layer
│   ├── NostrService.swift           # Core @Observable relay coordinator
│   ├── NostrService+Feed.swift      # Social feed subscriptions
│   ├── NostrService+Templates.swift # Template fetch/publish
│   ├── NostrService+Workout.swift   # Workout record publishing
│   ├── NostrService+Profile.swift   # Profile metadata
│   ├── NostrService+Discovery.swift # Community content search
│   ├── KeyManager.swift             # Keychain nsec storage
│   ├── NIP101eEventBuilder.swift    # Tag assembly for all 5 event kinds
│   └── WorkoutPublisher.swift       # Multi-step publish coordinator
│
├── Services/                        # @Observable business logic
│   ├── WorkoutLifecycleStore.swift  # Active workout state machine
│   ├── LibraryService.swift         # Exercise/template library mgmt
│   ├── SyncCoordinator.swift        # Phase A/B sync orchestration
│   ├── WalletService.swift          # NIP-47 NWC zaps
│   ├── PRTracker.swift              # Personal record detection
│   └── SettingsService.swift        # User preferences
│
├── Views/
│   ├── Library/
│   │   ├── LibraryTabView.swift             # Sub-tabs: Exercises/Templates/Collections
│   │   ├── ExerciseListView.swift
│   │   ├── ExerciseDetailView.swift
│   │   ├── WorkoutTemplateListView.swift
│   │   ├── WorkoutTemplateDetailView.swift
│   │   ├── CollectionsListView.swift
│   │   └── CollectionDetailView.swift
│   ├── Workout/
│   │   ├── WorkoutTabView.swift             # Quick start, resume, recent templates
│   │   ├── ActiveWorkoutView.swift          # Active workout container
│   │   ├── ExerciseCardView.swift           # Per-exercise card with set rows
│   │   ├── SetInputRow.swift                # Weight/reps/RPE/type input
│   │   ├── RestTimerView.swift              # Countdown overlay
│   │   ├── WorkoutSummaryView.swift         # Post-workout summary + publish
│   │   ├── ExercisePickerSheet.swift        # Add/substitute exercise
│   │   ├── WorkoutTimerView.swift           # Elapsed time
│   │   └── WorkoutMiniplayerView.swift     # Floating bar above tab bar
│   ├── Social/
│   │   ├── SocialTabView.swift              # Feed + discovery
│   │   ├── SocialFeedView.swift             # Followed users' workouts
│   │   ├── WorkoutFeedCardView.swift        # Social workout card + zap
│   │   ├── DiscoveryView.swift              # Community template search
│   │   └── UserProfileView.swift
│   ├── Profile/
│   │   ├── ProfileTabView.swift             # User profile + settings
│   │   ├── WorkoutHistoryView.swift
│   │   ├── StatsView.swift
│   │   ├── LoginView.swift                  # Key gen/import
│   │   └── SettingsView.swift
│   └── Shared/
│       ├── ExerciseSearchBar.swift
│       ├── TagChipView.swift
│       └── LoadingStateView.swift
│
├── Extensions/
└── Resources/
    ├── Assets.xcassets
    └── exercises_seed.json                  # ~200 bundled exercises
```

## Database Schema

### Authoritative tables (user's own data)

```sql
-- Workout sessions
CREATE TABLE workout_sessions (
    session_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_uuid TEXT NOT NULL UNIQUE,
    user_pubkey TEXT,
    title TEXT NOT NULL,
    workout_type TEXT NOT NULL,         -- strength|superset|circuit|emom|amrap|metcon
    template_ref TEXT,                  -- 33402:pubkey:d-tag (Nostr provenance)
    template_hash TEXT,                 -- FK to template_facts (if content-addressed)
    started_at REAL NOT NULL,
    ended_at REAL,
    status TEXT NOT NULL DEFAULT 'active',  -- active|paused|completed|abandoned
    notes TEXT,
    created_at REAL NOT NULL DEFAULT (julianday('now'))
);

-- Exercises within a session
CREATE TABLE workout_exercises (
    exercise_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES workout_sessions(session_id),
    exercise_ref TEXT NOT NULL,         -- 33401:pubkey:d-tag
    exercise_name TEXT NOT NULL,        -- snapshot at workout time
    position_index INTEGER NOT NULL,
    UNIQUE(session_id, position_index)
);

-- Individual sets
CREATE TABLE workout_sets (
    set_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES workout_sessions(session_id),
    exercise_id INTEGER NOT NULL REFERENCES workout_exercises(exercise_id),
    set_number INTEGER NOT NULL,
    reps INTEGER,                      -- NULL for duration/distance-only exercises
    weight_kg REAL,                    -- 0 for bodyweight, negative for assisted
    rpe REAL,                          -- 0-10
    set_type TEXT NOT NULL DEFAULT 'normal',
    duration_seconds REAL,             -- for timed exercises (planks, EMOM, cardio)
    distance_meters REAL,              -- for distance exercises (runs, rows)
    recorded_at REAL NOT NULL,
    UNIQUE(exercise_id, set_number)
);

-- Content-addressed template storage (immutable once inserted)
CREATE TABLE template_facts (
    template_hash TEXT PRIMARY KEY,     -- SHA-256(JCS(canonical_json))
    canonical_json TEXT NOT NULL,
    kind INTEGER NOT NULL,             -- 33401 or 33402
    created_at REAL NOT NULL
);

-- Template Nostr provenance
CREATE TABLE template_provenance (
    provenance_id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_hash TEXT NOT NULL REFERENCES template_facts(template_hash),
    kind INTEGER NOT NULL,
    author_pubkey TEXT NOT NULL,
    d_tag TEXT NOT NULL,
    event_id TEXT,
    relay_url TEXT,
    imported_at REAL NOT NULL
);

-- Publish tracking
CREATE TABLE projection_index (
    projection_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER REFERENCES workout_sessions(session_id),
    event_id TEXT,
    projection_type TEXT NOT NULL,     -- workout_record|exercise_template|workout_template
    status TEXT NOT NULL DEFAULT 'pending',
    created_at REAL NOT NULL,
    published_at REAL
);

-- Publish retry queue
CREATE TABLE outbox (
    outbox_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_json TEXT NOT NULL,
    event_kind INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at REAL NOT NULL,
    last_attempt_at REAL
);

-- NIP-51 collections (kind 30003)
CREATE TABLE collections (
    collection_id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_pubkey TEXT NOT NULL,
    d_tag TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_id TEXT,
    created_at REAL NOT NULL,
    updated_at REAL NOT NULL,
    UNIQUE(author_pubkey, d_tag)
);

CREATE TABLE collection_items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id INTEGER NOT NULL REFERENCES collections(collection_id),
    item_ref TEXT NOT NULL,            -- 33401:pubkey:d-tag or 33402:pubkey:d-tag
    item_type TEXT NOT NULL,           -- exercise|workout
    position_index INTEGER NOT NULL,
    UNIQUE(collection_id, item_ref)
);

-- User's library
CREATE TABLE library_items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_type TEXT NOT NULL,            -- exercise|workout|collection
    item_ref TEXT NOT NULL,             -- address tag reference
    template_hash TEXT,
    added_at REAL NOT NULL,
    source TEXT NOT NULL DEFAULT 'manual',
    UNIQUE(item_type, item_ref)
);
```

### Cache tables (relay-fetched, disposable)

```sql
CREATE TABLE cached_exercise_templates (
    author_pubkey TEXT NOT NULL, kind INTEGER NOT NULL DEFAULT 33401,
    d_tag TEXT NOT NULL, event_id TEXT NOT NULL, event_json TEXT NOT NULL,
    title TEXT NOT NULL, equipment TEXT, content TEXT,
    created_at REAL NOT NULL, cached_at REAL NOT NULL,
    UNIQUE(author_pubkey, kind, d_tag)
);

CREATE TABLE cached_workout_templates (
    author_pubkey TEXT NOT NULL, kind INTEGER NOT NULL DEFAULT 33402,
    d_tag TEXT NOT NULL, event_id TEXT NOT NULL, event_json TEXT NOT NULL,
    title TEXT NOT NULL, workout_type TEXT, exercise_count INTEGER,
    created_at REAL NOT NULL, cached_at REAL NOT NULL,
    UNIQUE(author_pubkey, kind, d_tag)
);

CREATE TABLE cached_feed_items (
    event_id TEXT PRIMARY KEY, author_pubkey TEXT NOT NULL,
    title TEXT, workout_type TEXT, exercise_count INTEGER,
    duration_seconds INTEGER, content TEXT, event_json TEXT NOT NULL,
    created_at REAL NOT NULL, cached_at REAL NOT NULL
);

CREATE TABLE cached_profiles (
    pubkey TEXT PRIMARY KEY, display_name TEXT, about TEXT,
    picture_url TEXT, nip05 TEXT, lud16 TEXT,
    event_json TEXT NOT NULL, cached_at REAL NOT NULL
);

CREATE TABLE cached_relay_lists (
    pubkey TEXT PRIMARY KEY, relays_json TEXT NOT NULL, cached_at REAL NOT NULL
);
```

### Immutability triggers (completed sessions and their children)

```sql
CREATE TRIGGER prevent_completed_session_update
BEFORE UPDATE ON workout_sessions
WHEN OLD.status = 'completed'
BEGIN
    SELECT RAISE(ABORT, 'Cannot modify completed workout session');
END;

CREATE TRIGGER prevent_completed_exercise_update
BEFORE UPDATE ON workout_exercises
WHEN (SELECT status FROM workout_sessions WHERE session_id = OLD.session_id) = 'completed'
BEGIN
    SELECT RAISE(ABORT, 'Cannot modify exercises in completed workout');
END;

CREATE TRIGGER prevent_completed_set_update
BEFORE UPDATE ON workout_sets
WHEN (SELECT status FROM workout_sessions WHERE session_id = OLD.session_id) = 'completed'
BEGIN
    SELECT RAISE(ABORT, 'Cannot modify sets in completed workout');
END;
```

## Service Layer

All services are `@Observable` classes injected via `.environment()`.

### NostrService
Central relay coordinator using rust-nostr-swift `Client`. Extended via domain-specific files (NostrService+Feed, +Templates, +Workout, +Profile, +Discovery). Handles relay pool lifecycle, outbox routing (NIP-65), event signing, subscriptions.

### WorkoutLifecycleStore
Active workout state machine. States: `idle → setup → active → paused → completing → publishing → completed`.

Key design:
- Every set completion immediately writes to GRDB (crash-safe)
- On app relaunch, check for `status = 'active'` sessions to resume
- Supports mid-workout CRUD: add/remove/reorder/substitute exercises
- Superset grouping via matching set_number across exercises
- Rest timer as cancellable `Task`

### LibraryService
Exercise/template library management. Handles bundled exercise seeding, library CRUD, NIP-51 collection sync (kind 30003).

### SyncCoordinator
Phase A/B sync:
- **Phase A** (instant): hydrate UI from GRDB cache tables
- **Phase B** (background): fetch from relays via TaskGroup concurrency, write to cache

### KeyManager
Keychain-backed nsec storage. Generate keypair, import nsec, sign out.

### WalletService
NIP-47 NWC. Connection URI parsing, zap request building (NIP-57), payment execution.

### PRTracker
Compare completed sets against historical bests. Detect new PRs for weight/reps/volume per exercise. Generate `pr` tags for workout records.

## Navigation

4-tab TabView:
- **Library** (books.vertical) — sub-tabs: Exercises, Templates, Collections
- **Workout** (figure.strengthtraining.traditional) — start/resume active workout
- **Social** (person.2) — feed + community discovery
- **Profile** (person.circle) — history, stats, settings

Each tab owns its own `NavigationStack`. Sheets for exercise picker, exercise detail, NWC setup, login.

### Active Workout Miniplayer

A persistent floating bar above the tab bar (Apple Music "Now Playing" pattern) that appears whenever a workout is active. This is critical to design from the start because it affects the root view hierarchy.

**Architecture:**
- `ContentView` contains `TabView` + conditional miniplayer overlay + full-screen workout cover
- `WorkoutLifecycleStore` lives at the app root (injected via `.environment`), not inside any tab
- When workout is active and user navigates away, the miniplayer appears above the tab bar
- Tapping the miniplayer expands to full-screen `ActiveWorkoutView` via `.fullScreenCover`
- Swiping down on the full workout view collapses back to miniplayer

**Miniplayer shows:**
- Current exercise name + set progress (e.g., "Bench Press — Set 2/4")
- Elapsed workout time
- Play/pause indicator

**ContentView structure:**
```swift
struct ContentView: View {
    @Environment(\.workoutStore) var workoutStore

    var body: some View {
        ZStack(alignment: .bottom) {
            TabView(selection: $selectedTab) {
                LibraryTabView().tag(Tab.library)
                WorkoutTabView().tag(Tab.workout)
                SocialTabView().tag(Tab.social)
                ProfileTabView().tag(Tab.profile)
            }

            // Miniplayer floats above tab bar when workout active + not expanded
            if workoutStore.phase.isActive && !showFullWorkout {
                WorkoutMiniplayerView()
                    .onTapGesture { showFullWorkout = true }
                    .padding(.bottom, 49) // tab bar height
            }
        }
        .fullScreenCover(isPresented: $showFullWorkout) {
            ActiveWorkoutView()
        }
    }
}
```

## Active Workout Architecture (modeled after Strong)

The active workout view is the most critical UX in the app. It must be fast, reliable, and feel native. The design follows Strong's proven patterns.

### Visual Layout (matches Strong's proven UX)

**Active Workout View (full screen):**
```
┌─────────────────────────────────────┐
│  ⏱        0:54          [Finish]   │  ← Timer icon + elapsed + green Finish btn
├─────────────────────────────────────┤
│                                     │
│  Kettlebell Snatch        🔗  ⋯    │  ← Exercise name (blue, tappable → detail)
│                                     │     🔗 = superset link, ⋯ = overflow menu
│  Set  Previous    lbs    Reps   ✓   │  ← Column headers
│  ─────────────────────────────────  │
│  1   45 lb × 5   [45]   [5]   [✓]  │  ← Completed (green bg, green checkmark)
│          ──── 2:00 ────             │  ← Rest timer INLINE between sets
│  2   45 lb × 5   [45]   [5]   [✓]  │     (shows as progress bar when active)
│          ──── 2:00 ────             │
│  3   45 lb × 5   [45]   [5]   [ ]  │  ← Current set (gray inputs, empty check)
│          ──── 2:00 ────             │
│  4   45 lb × 5   [45]   [5]   [ ]  │
│          ──── 2:00 ────             │
│  5   45 lb × 5   [45]   [5]   [ ]  │
│                                     │
│        + Add Set (2:00)             │  ← Shows rest duration in button text
│                                     │
│  Kettlebell Thruster      🔗  ⋯    │  ← Next exercise
│  Set  Previous    lbs    Reps   ✓   │
│  ...                                │
│                                     │
│       [+ Add Exercise]              │
│                                     │
└─────────────────────────────────────┘
```

**Rest Timer (expanded, slides up from bottom):**
```
┌─────────────────────────────────────┐
│  (exercise card visible above)      │
├─────────────────────────────────────┤
│         ┌───────────────┐           │
│         │   ◯ Pause ◯   │    [⌨]   │  ← Large circular pause button
│         └───────────────┘    [−][+] │  ← Increment controls
│                              [Reset]│
│            ████ 1:48 ░░░     [Skip] │  ← Progress bar + skip button
└─────────────────────────────────────┘
```

**Rest Timer Picker (sheet):**
```
┌─────────────────────────────────────┐
│  ×       Rest Timer                 │
│                                     │
│  Choose a duration below or set     │
│  your own. Custom durations are     │
│  saved for next time.               │
│                                     │
│         ┌─────────────┐             │
│         │    1:30      │             │  ← Scrollable picker wheel
│         │    0:30      │             │
│         │    1:00      │             │
│         │    2:00      │             │
│         └─────────────┘             │
│                                     │
│    [ Create Custom Timer ]          │
└─────────────────────────────────────┘
```

**Exercise Detail (sheet with tabs):**
```
┌─────────────────────────────────────┐
│  ×    Kettlebell Snatch      Edit   │
│                                     │
│  [About] [History] [Charts] [Records]│
│                                     │
│  MAY 2022                           │
│  ┌─────────────────────────────┐    │
│  │ KB 12min Burner             │    │
│  │ 16:05, Tuesday, May 10 2022│    │
│  │ Sets Performed        1RM  │    │
│  │ 1  45 lb × 5           51  │    │
│  │    [🏆1RM] [🏆VOL] [🏆WEIGHT] │    │  ← PR badges as colored chips
│  │ 2  45 lb × 5           51  │    │
│  │ 3  45 lb × 5           51  │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Miniplayer (above tab bar when workout collapsed):**
```
┌─────────────────────────────────────┐
│  KB Total Body Burner       0:20    │  ← Tap to expand
├─────────────────────────────────────┤
│  Library  History  ＋  Exercises  ⚙ │  ← Tab bar (Strong uses 5 tabs)
└─────────────────────────────────────┘
```

### Key UX Features (from Strong screenshots)

1. **Previous set column ("Previous")** — Shows "45 lb × 5" format from last session. Queried from `workout_sets` history in GRDB. Pre-populates weight/reps inputs with last session's values.

2. **Inline rest timer between sets** — NOT a separate banner. Each completed set shows the rest duration (e.g., "2:00") as a subtle line between rows. When rest is active, this becomes a **blue progress bar** showing countdown (e.g., "1:48") that fills/depletes in real time.

3. **Expanded rest timer** — Slides up from bottom with a large circular Pause button, +/- increment controls for adjusting time, Reset, Skip, and a keyboard toggle. This is the detailed timer view.

4. **Rest timer picker** — Sheet with scrollable duration wheel (presets: 0:30, 1:00, 1:30, 2:00) + "Create Custom Timer" option. Custom durations are saved.

5. **"+ Add Set (2:00)"** — The add set button shows the configured rest duration, reminding the user of their timer setting.

6. **Exercise name tappable** — Tapping the exercise name (blue text) opens exercise detail sheet with tabs: About, History, Charts, Records.

7. **PR badges** — Displayed as colored chips (1RM, VOL, WEIGHT) on historical sets where PRs were achieved. Teal/green colored.

8. **Exercise link icon (🔗)** — Indicates exercise is part of a superset. Located next to exercise name.

9. **Green checkmark + highlight** — Completed sets get a green background tint and green checkmark. Clear visual distinction from pending sets.

10. **Finish button** — Green, prominent, top-right. Not "Complete" — "Finish" (Strong's terminology, feels more natural).

### Data Model for Active Workout

```swift
struct ActiveExercise: Identifiable {
    let id: UUID
    var exerciseRef: String              // 33401:pubkey:d-tag
    var exerciseName: String             // display name
    var equipment: String?               // for icon display
    var positionIndex: Int
    var sets: [ActiveSet]
    var notes: String?

    // From template (pre-populated values)
    var prescribedSets: Int
    var prescribedWeight: Double?
    var prescribedReps: Int?
    var prescribedRPE: Double?

    // From history (previous session's values)
    var previousSets: [HistoricalSet]?   // last time this exercise was done
}

struct ActiveSet: Identifiable {
    let id: UUID
    var setNumber: Int
    var weight: Double = 0               // in kg always
    var reps: Int = 0
    var rpe: Double?
    var setType: SetType = .normal
    var isCompleted: Bool = false
    var completedAt: Date?
}

struct HistoricalSet {
    let weight: Double                   // kg
    let reps: Int
    let rpe: Double?
    let date: Date
}
```

### WorkoutLifecycleStore

```swift
@Observable final class WorkoutLifecycleStore {
    enum Phase: Equatable {
        case idle
        case setup(TemplateSelection?)
        case active
        case paused(pausedAt: Date)
        case completing
        case publishing
        case completed(summary: WorkoutSummary)
    }

    // -- Core state --
    private(set) var phase: Phase = .idle
    private(set) var sessionId: Int64?
    private(set) var title: String = ""
    private(set) var workoutType: WorkoutType = .strength
    private(set) var startedAt: Date?
    private(set) var totalPauseTime: TimeInterval = 0
    private(set) var exercises: [ActiveExercise] = []

    // -- Rest timer --
    private(set) var restTimerActive: Bool = false
    private(set) var restTimerRemaining: TimeInterval = 0
    private(set) var restTimerDuration: TimeInterval = 90  // default

    // -- Computed --
    var elapsedTime: TimeInterval { /* now - startedAt - totalPauseTime */ }
    var totalCompletedSets: Int { exercises.flatMap(\.sets).filter(\.isCompleted).count }
    var totalSets: Int { exercises.flatMap(\.sets).count }
    var isActive: Bool { if case .active = phase { return true }; return false }

    // -- Dependencies --
    private let db: DatabaseQueue
    private let prTracker: PRTracker
    private let settingsService: SettingsService

    // === Lifecycle ===
    func startWorkout(from template: ResolvedTemplate) async throws
    func startFreeWorkout(title: String, type: WorkoutType) async throws
    func resumeWorkout(sessionId: Int64) async throws  // crash recovery
    func pauseWorkout()
    func resumeFromPause()
    func cancelWorkout() async                          // confirm first
    func completeWorkout() async throws -> WorkoutSummary

    // === Set operations ===
    func updateSet(exerciseIndex: Int, setIndex: Int, weight: Double?, reps: Int?, rpe: Double?, setType: SetType?)
    func completeSet(exerciseIndex: Int, setIndex: Int)  // marks complete, writes to GRDB, starts rest timer
    func uncompleteSet(exerciseIndex: Int, setIndex: Int)
    func addSet(exerciseIndex: Int)                      // copies previous set's values as defaults
    func removeSet(exerciseIndex: Int, setIndex: Int)

    // === Exercise operations ===
    func addExercises(_ exercises: [ExerciseSelection]) async  // fetches history for PREV column
    func removeExercise(at index: Int)
    func substituteExercise(at index: Int, with: ExerciseSelection) async
    func moveExercise(from: Int, to: Int)
    func addNotes(exerciseIndex: Int, notes: String)

    // === Rest timer ===
    func startRestTimer(duration: TimeInterval? = nil)  // nil = use default
    func skipRestTimer()

    // === History lookup (for PREV column) ===
    func fetchPreviousSets(for exerciseRef: String) async -> [HistoricalSet]?
}
```

### GRDB Persistence During Active Workout

Every mutation writes immediately to GRDB for crash safety:

| Action | GRDB Operation |
|--------|---------------|
| `startWorkout` | INSERT `workout_sessions` (status=active) + INSERT `workout_exercises` for all exercises |
| `completeSet` | INSERT `workout_sets` row |
| `uncompleteSet` | DELETE `workout_sets` row |
| `addSet` | No-op (set isn't persisted until completed) |
| `removeSet` | DELETE `workout_sets` if it was completed |
| `addExercises` | INSERT `workout_exercises` rows |
| `removeExercise` | DELETE `workout_exercises` + associated `workout_sets` |
| `moveExercise` | UPDATE `workout_exercises.position_index` |
| `pauseWorkout` | UPDATE `workout_sessions.status` = 'paused' |
| `completeWorkout` | UPDATE `workout_sessions` (status=completed, ended_at) |

### Crash Recovery

On app launch:
```swift
// In POWRApp.init or ContentView.task
let activeSessions = try db.read { db in
    try WorkoutSession.filter(Column("status") == "active" || Column("status") == "paused")
        .fetchAll(db)
}
if let session = activeSessions.first {
    // Restore full state from GRDB
    await workoutStore.resumeWorkout(sessionId: session.sessionId)
    showFullWorkout = true  // present the active workout view
}
```

### View Hierarchy

```
ActiveWorkoutView (fullScreenCover, drag-to-dismiss → miniplayer)
├── VStack
│   ├── Toolbar: Timer icon + elapsed time + "Finish" button (green)
│   └── ScrollView
│       ├── ForEach exercises
│       │   └── ExerciseCardView
│       │       ├── Exercise header: name (blue, tappable) + 🔗 superset + ⋯ menu
│       │       ├── Column headers (Set | Previous | lbs/kg | Reps | ✓)
│       │       ├── ForEach sets
│       │       │   ├── SetInputRow
│       │       │   │   ├── Set number (with type indicator color)
│       │       │   │   ├── Previous label ("45 lb × 5")
│       │       │   │   ├── Weight TextField (.decimalPad)
│       │       │   │   ├── Reps TextField (.numberPad)
│       │       │   │   └── Checkmark button (green when completed)
│       │       │   └── InlineRestTimerView (between rows)
│       │       │       ├── When inactive: subtle "2:00" label
│       │       │       └── When active: blue progress bar with countdown
│       │       └── "+ Add Set (2:00)" button
│       └── "+ Add Exercise" button
├── ExpandedRestTimerView (slides up from bottom when rest active)
│   ├── Large circular Pause/Resume button
│   ├── +/- increment controls
│   ├── Reset button
│   ├── Skip button (blue)
│   └── Keyboard toggle
└── Sheets:
    ├── ExerciseDetailSheet (About | History | Charts | Records tabs)
    ├── ExercisePickerSheet
    ├── RestTimerPickerSheet (scrollable wheel + custom timer)
    └── WorkoutSummarySheet (on Finish)
```

### SetInputRow Detail

```swift
struct SetInputRow: View {
    let setNumber: Int
    let previousSet: HistoricalSet?    // shows "45 lb × 5" in Previous column
    @Binding var set: ActiveSet
    let weightUnit: WeightUnit         // for display conversion (stored in kg)
    let restDuration: TimeInterval     // for inline rest display
    let isRestActive: Bool             // is this set's rest timer running?
    let restRemaining: TimeInterval    // countdown value
    let onComplete: () -> Void
    let onSetTypeChange: (SetType) -> Void

    // Tapping checkmark:
    //   1. Validates weight > 0 and reps > 0
    //   2. Calls onComplete → store.completeSet
    //   3. Store writes to GRDB + auto-starts rest timer
    //   4. Row turns green background + green checkmark
    //   5. Inline rest timer below this row starts counting down

    // Completed rows: green tint background, inputs become read-only
    // Set type: long-press set number to change
    //   - normal: default (no indicator)
    //   - warmup: orange "W" badge
    //   - drop: blue "D" badge
    //   - failure: red "F" badge
}
```

### Exercise Detail Sheet (from Strong's History tab)

Tapping an exercise name opens a sheet with 4 tabs:

- **About**: Exercise description, equipment, form instructions, muscle groups
- **History**: Chronological list of past sessions with this exercise, showing sets performed + 1RM calculation + PR badges (1RM, VOL, WEIGHT as colored chips)
- **Charts**: Weight/volume progression over time (line chart)
- **Records**: All-time PRs for this exercise (1RM, max weight, max reps, max volume)

## POWR Relay

A dedicated relay at `wss://relay.powr.fitness` (or similar) serves as:
- Default publish/read relay for the iOS app
- Guaranteed persistence for NIP-101e events (public relays may prune)
- Fast template/exercise discovery endpoint
- Testing ground during development

**Default relay configuration:**
```swift
static let powrRelay = "wss://relay.powr.fitness"

static let defaultPublishRelays = [
    "wss://relay.powr.fitness",
    "wss://relay.damus.io",
    "wss://nos.lol",
    "wss://relay.nostr.band"
]

static let defaultReadRelays = [
    "wss://relay.powr.fitness",
    "wss://relay.damus.io",
    "wss://nos.lol",
    "wss://purplepag.es"
]
```

Relay software selection and hosting are separate infrastructure decisions (strfry, nostr-rs-relay, etc.).

## Offline-First Sync

1. **Launch**: Phase A reads GRDB cache → instant UI
2. **Background**: Phase B fetches from relays via TaskGroup → updates cache → UI reacts via GRDB ValueObservation
3. **Publish**: Workout records → outbox → relay fanout. Retry on connectivity change
4. **Conflict resolution**: Addressable events use `created_at` (newer wins), tie-break by lowest lexical `event_id`

## Dependency Injection

```swift
@main struct POWRApp: App {
    @State private var nostrService: NostrService
    @State private var workoutStore: WorkoutLifecycleStore
    @State private var libraryService: LibraryService
    // ...

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.nostrService, nostrService)
                .environment(\.workoutStore, workoutStore)
                .environment(\.libraryService, libraryService)
        }
    }
}
```

## Key Differences from Gambit Golf

| Aspect | Gambit | POWR | Reason |
|--------|--------|------|--------|
| Domain complexity | 18 holes, sequential | Variable exercises, mid-workout CRUD | Workouts are more dynamic than golf rounds |
| Template storage | Simple Kernel pattern | Content-addressed for templates only | Dedup needed for distributed templates, not for workout data |
| Active session | Simple scoring | Full state machine with supersets, rest timer, exercise CRUD | More complex UX requirements |
| Bundled content | Course database | ~200 exercise seed JSON | Instant offline value |
| Social feed | Secondary | First-class tab | Core feature requirement |
| Collections | None | NIP-51 kind 30003 | Library organization + cross-device sync |
| NWC | Separate wallet view | Integrated zap actions on feed items | Social incentive layer |

## RAID → POWR Component Mapping

| RAID Component | POWR Component | Adaptation |
|---|---|---|
| `Kernel/Schema.swift` | `Database/Schema.swift` | Workout tables instead of golf tables |
| `Kernel/Repository.swift` | `Database/WorkoutRepository.swift` | Session/exercise/set CRUD |
| `Kernel/Canonical.swift` | `Database/Canonical.swift` | Same RFC 8785, templates only |
| `Kernel/Hashing.swift` | `Database/Hashing.swift` | Same SHA-256 |
| `Nostr/KeyManager.swift` | `Nostr/KeyManager.swift` | Direct reuse |
| `Nostr/NostrService.swift` | `Nostr/NostrService.swift` | Extended for workout domain |
| `Nostr/RoundPublisher.swift` | `Nostr/WorkoutPublisher.swift` | Multi-step publish pattern |
| `Nostr/NIP101gEvent*.swift` | `Nostr/NIP101eEventBuilder.swift` | Adapted for 3 workout event kinds (33401, 33402, 1301) |

## Implementation Order

1. Create Xcode project skeleton, add SPM dependencies (GRDB, NostrSDK)
2. Database schema + repositories (workout tables + cache tables + collections)
3. Bundled exercise seed (~200 exercises) + template storage (Canonical, Hashing, TemplateRepository)
4. WorkoutLifecycleStore (active workout state, no network)
5. Library views (exercise list, template list, exercise detail) — usable offline from seed data
6. Active workout views (the critical UX)
7. NIP101eEventBuilder + WorkoutPublisher (projection builders)
8. KeyManager + NostrService core (connect, publish, subscribe)
9. Social feed (NostrService+Feed, SocialFeedView)
10. Collections (NIP-51 sync)
11. NWC/zaps (WalletService)
12. First-launch onboarding + polish

## Verification

- **Unit tests**: Schema immutability triggers, template hashing reproducibility, NIP-101e tag assembly
- **Integration tests**: Complete workout → GRDB → publish → verify event structure
- **Offline test**: Complete workout with no network → verify GRDB persistence → restore on relaunch
- **Parity tests**: Cross-check iOS projection output against web app's `workoutEventGeneration.ts` using shared test vectors
- **NIP compliance**: Validate events with NAK or other Nostr tooling
