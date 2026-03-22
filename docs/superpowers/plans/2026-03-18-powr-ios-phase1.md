# POWR iOS — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully usable offline workout tracking iOS app with Strong-style UX, GRDB persistence, and crash recovery — no network required.

**Architecture:** SwiftUI + GRDB local-first app. @Observable stores for state management. Content-addressed template storage for exercise/workout templates. WorkoutLifecycleStore manages the active workout state machine. Miniplayer pattern for persistent workout access across tabs.

**Tech Stack:** SwiftUI (iOS 17+), GRDB.swift, Swift Package Manager

**Reference repos:**
- Gambit Golf (architectural template): `/Users/danielwyler/raid.golf/`
- POWR web app (UX reference): `/Users/danielwyler/powr_web/`
- Design spec: `/Users/danielwyler/powr_web/docs/superpowers/specs/2026-03-18-powr-ios-design.md`

**Phase 1 scope:** Tasks 1-10 below produce an app that can:
- Browse a bundled exercise library (~200 exercises)
- Create workout templates from exercises
- Track an active workout with Strong-style UX (sets, reps, weight, rest timer)
- View workout history
- Crash-recover an in-progress workout
- No Nostr networking (that's Phase 2)

---

## File Structure

```
powr-ios/
├── POWR/
│   ├── POWRApp.swift
│   ├── ContentView.swift
│   │
│   ├── Models/
│   │   ├── Enums.swift                      # WorkoutType, SetType, Equipment
│   │   ├── WorkoutModels.swift              # WorkoutSession, WorkoutExercise, WorkoutSet (GRDB records)
│   │   ├── TemplateModels.swift             # ExerciseTemplate, WorkoutTemplate
│   │   └── ActiveWorkoutModels.swift        # ActiveExercise, ActiveSet, HistoricalSet
│   │
│   ├── Database/
│   │   ├── Schema.swift                     # GRDB migrations + immutability triggers
│   │   ├── DatabaseSetup.swift              # DatabaseQueue factory
│   │   ├── WorkoutRepository.swift          # Sessions, exercises, sets CRUD
│   │   ├── TemplateRepository.swift         # Content-addressed template storage
│   │   ├── Canonical.swift                  # RFC 8785 JCS (copy from Gambit)
│   │   ├── Hashing.swift                    # SHA-256 (copy from Gambit)
│   │   └── Protocols.swift                  # Canonicalizing, Hashing protocols (copy from Gambit)
│   │
│   ├── Services/
│   │   ├── WorkoutLifecycleStore.swift      # Active workout state machine
│   │   ├── LibraryService.swift             # Exercise/template library + seed loading
│   │   ├── PRTracker.swift                  # Personal record detection
│   │   └── SettingsService.swift            # User preferences (@AppStorage)
│   │
│   ├── Views/
│   │   ├── Library/
│   │   │   ├── LibraryTabView.swift         # Sub-tab container
│   │   │   ├── ExerciseListView.swift       # Searchable/filterable exercise list
│   │   │   ├── ExerciseDetailView.swift     # Exercise info + history tabs
│   │   │   ├── WorkoutTemplateListView.swift
│   │   │   └── WorkoutTemplateDetailView.swift
│   │   ├── Workout/
│   │   │   ├── WorkoutTabView.swift         # Start workout screen
│   │   │   ├── ActiveWorkoutView.swift      # Full-screen active workout
│   │   │   ├── ExerciseCardView.swift       # Exercise header + set rows
│   │   │   ├── SetInputRow.swift            # Weight/reps/check input
│   │   │   ├── InlineRestTimerView.swift    # Rest timer between sets
│   │   │   ├── ExpandedRestTimerView.swift  # Full rest timer with controls
│   │   │   ├── WorkoutMiniplayerView.swift  # Floating bar above tab bar
│   │   │   ├── ExercisePickerSheet.swift    # Add/substitute exercise
│   │   │   └── WorkoutSummaryView.swift     # Post-workout summary
│   │   ├── History/
│   │   │   ├── HistoryTabView.swift         # Workout history list
│   │   │   └── HistoryDetailView.swift      # Past workout detail
│   │   └── Profile/
│   │       └── ProfileTabView.swift         # Placeholder for Phase 2
│   │
│   ├── Extensions/
│   │   └── EnvironmentKeys.swift            # Environment key definitions
│   │
│   └── Resources/
│       └── exercises_seed.json              # ~200 bundled exercises
│
└── POWRTests/
    ├── SchemaTests.swift
    ├── WorkoutRepositoryTests.swift
    ├── TemplateRepositoryTests.swift
    ├── CanonicalTests.swift
    ├── WorkoutLifecycleStoreTests.swift
    └── PRTrackerTests.swift
```

---

### Task 1: Create Xcode Project + SPM Dependencies

**Files:**
- Create: Xcode project `POWR.xcodeproj` with target `POWR` and test target `POWRTests`
- Create: `POWR/POWRApp.swift`
- Create: `POWR/ContentView.swift`

> **Note:** This task requires Xcode. Create a new iOS App project (SwiftUI, Swift, iOS 17.0 minimum).

- [ ] **Step 1: Create Xcode project**

Open Xcode → File → New → Project → iOS App
- Product Name: `POWR`
- Organization Identifier: `app.powr`
- Interface: SwiftUI
- Language: Swift
- Minimum Deployment: iOS 17.0

Save to a new `powr-ios/` directory. Initialize git: `git init && git add -A && git commit -m "Initial Xcode project"`

- [ ] **Step 2: Add GRDB dependency**

In Xcode: File → Add Package Dependencies
- URL: `https://github.com/groue/GRDB.swift.git`
- Dependency Rule: Up to Next Major Version (7.0.0)
- Add to target: POWR and POWRTests

- [ ] **Step 3: Create directory structure**

```bash
cd powr-ios/POWR
mkdir -p Models Database Services Views/Library Views/Workout Views/History Views/Profile Extensions Resources
```

- [ ] **Step 4: Create stub POWRApp.swift**

```swift
import SwiftUI

@main
struct POWRApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
```

- [ ] **Step 5: Create stub ContentView.swift**

```swift
import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            Text("Library").tabItem { Label("Library", systemImage: "books.vertical") }
            Text("Workout").tabItem { Label("Workout", systemImage: "figure.strengthtraining.traditional") }
            Text("History").tabItem { Label("History", systemImage: "clock") }
            Text("Profile").tabItem { Label("Profile", systemImage: "person.circle") }
        }
    }
}
```

- [ ] **Step 6: Build and run**

Run: Cmd+B in Xcode. Expected: builds successfully, shows 4-tab placeholder app.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add GRDB dependency and directory structure"
```

---

### Task 2: Domain Models + Enums

**Files:**
- Create: `POWR/Models/Enums.swift`
- Create: `POWR/Models/WorkoutModels.swift`
- Create: `POWR/Models/TemplateModels.swift`
- Create: `POWR/Models/ActiveWorkoutModels.swift`

- [ ] **Step 1: Create Enums.swift**

```swift
import Foundation

enum WorkoutType: String, Codable, CaseIterable {
    case strength
    case superset
    case circuit
    case emom
    case amrap
    case metcon
}

enum SetType: String, Codable, CaseIterable {
    case warmup
    case normal
    case drop
    case failure
}

enum Equipment: String, Codable, CaseIterable {
    case barbell
    case dumbbell
    case bodyweight
    case machine
    case kettlebell
    case cable
    case resistanceBand = "resistance_band"
    case cardio
}

enum Difficulty: String, Codable, CaseIterable {
    case beginner
    case intermediate
    case advanced
}

enum WeightUnit: String, Codable {
    case kg
    case lbs

    var conversionFactor: Double {
        switch self {
        case .kg: return 1.0
        case .lbs: return 2.20462
        }
    }
}

enum WorkoutSessionStatus: String, Codable {
    case active
    case paused
    case completed
    case abandoned
}
```

- [ ] **Step 2: Create WorkoutModels.swift**

GRDB record types for the authoritative tables. Read the GRDB documentation pattern from Gambit's Repository.swift (`/Users/danielwyler/raid.golf/ios/RAID/RAID/Kernel/Repository.swift`).

```swift
import Foundation
import GRDB

/// NOTE: Property names match DB column names exactly to avoid CodingKeys issues with GRDB.
/// GRDB uses Codable for column mapping — mismatched names cause runtime crashes.

struct WorkoutSession: Codable, FetchableRecord, PersistableRecord, Identifiable {
    var id: Int64?
    var session_uuid: String
    var user_pubkey: String?
    var title: String
    var workout_type: String
    var template_ref: String?
    var template_hash: String?
    var started_at: Double          // timeIntervalSinceReferenceDate
    var ended_at: Double?
    var status: String
    var notes: String?
    var created_at: Double

    static let databaseTableName = "workout_sessions"
    static let databaseColumnDecodingStrategy = ColumnDecodingStrategy.useDefaultKeys

    enum CodingKeys: String, CodingKey {
        case id = "session_id"
        case session_uuid, user_pubkey, title, workout_type
        case template_ref, template_hash
        case started_at, ended_at, status, notes, created_at
    }

    mutating func didInsert(_ inserted: InsertionSuccess) {
        id = inserted.rowID
    }

    // Convenience accessors
    var startedAtDate: Date { Date(timeIntervalSinceReferenceDate: started_at) }
    var endedAtDate: Date? { ended_at.map { Date(timeIntervalSinceReferenceDate: $0) } }
}

struct WorkoutExercise: Codable, FetchableRecord, PersistableRecord, Identifiable {
    var id: Int64?
    var session_id: Int64
    var exercise_ref: String
    var exercise_name: String
    var position_index: Int

    static let databaseTableName = "workout_exercises"

    enum CodingKeys: String, CodingKey {
        case id = "exercise_id"
        case session_id, exercise_ref, exercise_name, position_index
    }

    mutating func didInsert(_ inserted: InsertionSuccess) {
        id = inserted.rowID
    }
}

struct WorkoutSet: Codable, FetchableRecord, PersistableRecord, Identifiable {
    var id: Int64?
    var session_id: Int64
    var exercise_id: Int64
    var set_number: Int
    var reps: Int?
    var weight_kg: Double?
    var rpe: Double?
    var set_type: String
    var duration_seconds: Double?
    var distance_meters: Double?
    var recorded_at: Double         // timeIntervalSinceReferenceDate

    static let databaseTableName = "workout_sets"

    enum CodingKeys: String, CodingKey {
        case id = "set_id"
        case session_id, exercise_id, set_number
        case reps, weight_kg, rpe, set_type
        case duration_seconds, distance_meters, recorded_at
    }

    mutating func didInsert(_ inserted: InsertionSuccess) {
        id = inserted.rowID
    }
}
```

- [ ] **Step 3: Create TemplateModels.swift**

```swift
import Foundation
import GRDB

struct TemplateFact: Codable, FetchableRecord, PersistableRecord {
    var templateHash: String
    var canonicalJSON: String
    var kind: Int
    var createdAt: Date

    static let databaseTableName = "template_facts"
}

struct TemplateProvenance: Codable, FetchableRecord, PersistableRecord, Identifiable {
    var id: Int64?
    var templateHash: String
    var kind: Int
    var authorPubkey: String
    var dTag: String
    var eventId: String?
    var relayURL: String?
    var importedAt: Date

    static let databaseTableName = "template_provenance"

    mutating func didInsert(_ inserted: InsertionSuccess) {
        id = inserted.rowID
    }
}

/// Parsed exercise template (from JSON, not a GRDB record)
struct ExerciseTemplate: Codable, Identifiable {
    var id: String { dTag }
    var dTag: String
    var title: String
    var format: [String]
    var formatUnits: [String]
    var equipment: String
    var difficulty: String?
    var content: String?
    var tags: [String]

    enum CodingKeys: String, CodingKey {
        case dTag = "d_tag"
        case title, format
        case formatUnits = "format_units"
        case equipment, difficulty, content, tags
    }

    var equipmentEnum: Equipment? { Equipment(rawValue: equipment) }
    var difficultyEnum: Difficulty? { difficulty.flatMap(Difficulty.init) }
}

/// Parsed workout template (from JSON, not a GRDB record)
struct WorkoutTemplate: Codable, Identifiable {
    var id: String { dTag }
    var dTag: String
    var title: String
    var type: String
    var exercises: [PrescribedExercise]
    var rounds: Int?
    var duration: Int?
    var restBetweenSets: Int?
    var restBetweenRounds: Int?
    var difficulty: String?

    struct PrescribedExercise: Codable {
        var exerciseRef: String
        var weight: String?
        var reps: String?
        var rpe: String?
        var setType: String?
        var setNumber: Int
    }
}
```

- [ ] **Step 4: Create ActiveWorkoutModels.swift**

```swift
import Foundation

struct ActiveExercise: Identifiable {
    let id: UUID
    var exerciseRef: String
    var exerciseName: String
    var equipment: String?
    var positionIndex: Int
    var sets: [ActiveSet]
    var notes: String?
    var prescribedSets: Int
    var prescribedWeight: Double?
    var prescribedReps: Int?
    var prescribedRPE: Double?
    var previousSets: [HistoricalSet]?

    init(exerciseRef: String, exerciseName: String, equipment: String? = nil, positionIndex: Int, prescribedSets: Int = 3) {
        self.id = UUID()
        self.exerciseRef = exerciseRef
        self.exerciseName = exerciseName
        self.equipment = equipment
        self.positionIndex = positionIndex
        self.sets = (1...prescribedSets).map { ActiveSet(setNumber: $0) }
        self.prescribedSets = prescribedSets
    }
}

struct ActiveSet: Identifiable {
    let id: UUID
    var setNumber: Int
    var weight: Double = 0
    var reps: Int = 0
    var rpe: Double?
    var setType: SetType = .normal
    var isCompleted: Bool = false
    var completedAt: Date?

    init(setNumber: Int) {
        self.id = UUID()
        self.setNumber = setNumber
    }
}

struct HistoricalSet {
    let weight: Double
    let reps: Int
    let rpe: Double?
    let date: Date
}

struct WorkoutSummary {
    let sessionId: Int64
    let title: String
    let duration: TimeInterval
    let exerciseCount: Int
    let totalSets: Int
    let totalVolume: Double
    let prs: [PersonalRecord]
}

struct PersonalRecord {
    let exerciseRef: String
    let exerciseName: String
    let metric: String
    let value: Double
    let previousBest: Double?
}
```

- [ ] **Step 5: Build**

Run: Cmd+B. Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add domain models and enums"
```

---

### Task 3: Database Schema

**Files:**
- Create: `POWR/Database/Schema.swift`
- Create: `POWR/Database/DatabaseSetup.swift`
- Create: `POWRTests/SchemaTests.swift`

**Reference:** Read Gambit's Schema.swift at `/Users/danielwyler/raid.golf/ios/RAID/RAID/Kernel/Schema.swift` for the migration pattern.

- [ ] **Step 1: Write SchemaTests.swift**

```swift
import XCTest
import GRDB
@testable import POWR

final class SchemaTests: XCTestCase {

    func testSchemaCreation() throws {
        let db = try DatabaseQueue()
        try Schema.install(in: db)

        // Verify tables exist
        try db.read { db in
            XCTAssertTrue(try db.tableExists("workout_sessions"))
            XCTAssertTrue(try db.tableExists("workout_exercises"))
            XCTAssertTrue(try db.tableExists("workout_sets"))
            XCTAssertTrue(try db.tableExists("template_facts"))
            XCTAssertTrue(try db.tableExists("template_provenance"))
            XCTAssertTrue(try db.tableExists("library_items"))
        }
    }

    func testImmutabilityTriggerBlocksCompletedSessionUpdate() throws {
        let db = try DatabaseQueue()
        try Schema.install(in: db)

        // Insert a completed session
        try db.write { db in
            try db.execute(sql: """
                INSERT INTO workout_sessions (session_uuid, title, workout_type, started_at, ended_at, status, created_at)
                VALUES ('test-uuid', 'Test Workout', 'strength', 1000, 2000, 'completed', 1000)
            """)
        }

        // Attempt to update should fail
        XCTAssertThrowsError(try db.write { db in
            try db.execute(sql: """
                UPDATE workout_sessions SET title = 'Modified' WHERE session_uuid = 'test-uuid'
            """)
        })
    }

    func testImmutabilityAllowsActiveSessionUpdate() throws {
        let db = try DatabaseQueue()
        try Schema.install(in: db)

        try db.write { db in
            try db.execute(sql: """
                INSERT INTO workout_sessions (session_uuid, title, workout_type, started_at, status, created_at)
                VALUES ('test-uuid', 'Test Workout', 'strength', 1000, 'active', 1000)
            """)
        }

        // Should succeed for active sessions
        XCTAssertNoThrow(try db.write { db in
            try db.execute(sql: """
                UPDATE workout_sessions SET title = 'Modified' WHERE session_uuid = 'test-uuid'
            """)
        })
    }

    func testForeignKeyEnforcement() throws {
        let db = try DatabaseQueue()
        try Schema.install(in: db)

        // Insert exercise referencing non-existent session should fail
        XCTAssertThrowsError(try db.write { db in
            try db.execute(sql: """
                INSERT INTO workout_exercises (session_id, exercise_ref, exercise_name, position_index)
                VALUES (999, 'ref', 'name', 0)
            """)
        })
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `xcodebuild test -scheme POWR -destination 'platform=iOS Simulator,name=iPhone 16'` or Cmd+U in Xcode.
Expected: FAIL — `Schema` type not found.

- [ ] **Step 3: Create DatabaseSetup.swift**

```swift
import Foundation
import GRDB

extension DatabaseQueue {
    static func createPOWRDatabase(at path: String? = nil) throws -> DatabaseQueue {
        let dbPath: String
        if let path = path {
            dbPath = path
        } else {
            let appSupport = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
            let dbDir = appSupport.appendingPathComponent("POWR", isDirectory: true)
            try FileManager.default.createDirectory(at: dbDir, withIntermediateDirectories: true)
            dbPath = dbDir.appendingPathComponent("powr.sqlite").path
        }

        var config = Configuration()
        config.foreignKeysEnabled = true
        let dbQueue = try DatabaseQueue(path: dbPath, configuration: config)
        try Schema.install(in: dbQueue)
        return dbQueue
    }

    /// In-memory database for testing and previews
    static func inMemoryPOWRDatabase() throws -> DatabaseQueue {
        var config = Configuration()
        config.foreignKeysEnabled = true
        let dbQueue = try DatabaseQueue(configuration: config)
        try Schema.install(in: dbQueue)
        return dbQueue
    }
}
```

- [ ] **Step 4: Create Schema.swift**

Full schema with all authoritative tables from the design spec. Reference the exact SQL from the spec at `/Users/danielwyler/powr_web/docs/superpowers/specs/2026-03-18-powr-ios-design.md` lines 284-463.

```swift
import Foundation
import GRDB

enum Schema {
    static func migrator() -> DatabaseMigrator {
        var migrator = DatabaseMigrator()

        migrator.registerMigration("v1_core_tables") { db in
            // Workout sessions
            try db.execute(sql: """
                CREATE TABLE workout_sessions (
                    session_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_uuid TEXT NOT NULL UNIQUE,
                    user_pubkey TEXT,
                    title TEXT NOT NULL,
                    workout_type TEXT NOT NULL,
                    template_ref TEXT,
                    template_hash TEXT,
                    started_at REAL NOT NULL,
                    ended_at REAL,
                    status TEXT NOT NULL DEFAULT 'active',
                    notes TEXT,
                    created_at REAL NOT NULL
                )
            """)

            // Exercises within a session
            try db.execute(sql: """
                CREATE TABLE workout_exercises (
                    exercise_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id INTEGER NOT NULL REFERENCES workout_sessions(session_id),
                    exercise_ref TEXT NOT NULL,
                    exercise_name TEXT NOT NULL,
                    position_index INTEGER NOT NULL,
                    UNIQUE(session_id, position_index)
                )
            """)

            // Individual sets
            try db.execute(sql: """
                CREATE TABLE workout_sets (
                    set_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id INTEGER NOT NULL REFERENCES workout_sessions(session_id),
                    exercise_id INTEGER NOT NULL REFERENCES workout_exercises(exercise_id),
                    set_number INTEGER NOT NULL,
                    reps INTEGER,
                    weight_kg REAL,
                    rpe REAL,
                    set_type TEXT NOT NULL DEFAULT 'normal',
                    duration_seconds REAL,
                    distance_meters REAL,
                    recorded_at REAL NOT NULL,
                    UNIQUE(exercise_id, set_number)
                )
            """)

            // Content-addressed template storage
            try db.execute(sql: """
                CREATE TABLE template_facts (
                    template_hash TEXT PRIMARY KEY,
                    canonical_json TEXT NOT NULL,
                    kind INTEGER NOT NULL,
                    created_at REAL NOT NULL
                )
            """)

            // Template provenance
            try db.execute(sql: """
                CREATE TABLE template_provenance (
                    provenance_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    template_hash TEXT NOT NULL REFERENCES template_facts(template_hash),
                    kind INTEGER NOT NULL,
                    author_pubkey TEXT NOT NULL,
                    d_tag TEXT NOT NULL,
                    event_id TEXT,
                    relay_url TEXT,
                    imported_at REAL NOT NULL
                )
            """)

            // User's library
            try db.execute(sql: """
                CREATE TABLE library_items (
                    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    item_type TEXT NOT NULL,
                    item_ref TEXT NOT NULL,
                    template_hash TEXT,
                    added_at REAL NOT NULL,
                    source TEXT NOT NULL DEFAULT 'manual',
                    UNIQUE(item_type, item_ref)
                )
            """)

            // Immutability triggers
            try db.execute(sql: """
                CREATE TRIGGER prevent_completed_session_update
                BEFORE UPDATE ON workout_sessions
                WHEN OLD.status = 'completed'
                BEGIN
                    SELECT RAISE(ABORT, 'Cannot modify completed workout session');
                END
            """)

            try db.execute(sql: """
                CREATE TRIGGER prevent_completed_exercise_update
                BEFORE UPDATE ON workout_exercises
                WHEN (SELECT status FROM workout_sessions WHERE session_id = OLD.session_id) = 'completed'
                BEGIN
                    SELECT RAISE(ABORT, 'Cannot modify exercises in completed workout');
                END
            """)

            try db.execute(sql: """
                CREATE TRIGGER prevent_completed_set_update
                BEFORE UPDATE ON workout_sets
                WHEN (SELECT status FROM workout_sessions WHERE session_id = OLD.session_id) = 'completed'
                BEGIN
                    SELECT RAISE(ABORT, 'Cannot modify sets in completed workout');
                END
            """)

            // DELETE triggers — prevent deleting data from completed workouts
            try db.execute(sql: """
                CREATE TRIGGER prevent_completed_session_delete
                BEFORE DELETE ON workout_sessions
                WHEN OLD.status = 'completed'
                BEGIN
                    SELECT RAISE(ABORT, 'Cannot delete completed workout session');
                END
            """)

            try db.execute(sql: """
                CREATE TRIGGER prevent_completed_exercise_delete
                BEFORE DELETE ON workout_exercises
                WHEN (SELECT status FROM workout_sessions WHERE session_id = OLD.session_id) = 'completed'
                BEGIN
                    SELECT RAISE(ABORT, 'Cannot delete exercises from completed workout');
                END
            """)

            try db.execute(sql: """
                CREATE TRIGGER prevent_completed_set_delete
                BEFORE DELETE ON workout_sets
                WHEN (SELECT status FROM workout_sessions WHERE session_id = OLD.session_id) = 'completed'
                BEGIN
                    SELECT RAISE(ABORT, 'Cannot delete sets from completed workout');
                END
            """)
        }

        return migrator
    }

    static func install(in dbQueue: DatabaseQueue) throws {
        try migrator().migrate(dbQueue)
    }
}
```

- [ ] **Step 5: Run tests**

Run: Cmd+U. Expected: All 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add database schema with immutability triggers"
```

---

### Task 4: Canonical + Hashing (copy from Gambit)

**Files:**
- Create: `POWR/Database/Protocols.swift` — copy from `/Users/danielwyler/raid.golf/ios/RAID/RAID/Kernel/Protocols.swift`
- Create: `POWR/Database/Canonical.swift` — copy from `/Users/danielwyler/raid.golf/ios/RAID/RAID/Kernel/Canonical.swift`
- Create: `POWR/Database/Hashing.swift` — copy from `/Users/danielwyler/raid.golf/ios/RAID/RAID/Kernel/Hashing.swift`
- Create: `POWRTests/CanonicalTests.swift`

- [ ] **Step 1: Copy Protocols.swift**

Read `/Users/danielwyler/raid.golf/ios/RAID/RAID/Kernel/Protocols.swift` and copy it, renaming `RAID` references to `POWR`:
- `RAIDCanonicalizer` → `POWRCanonicalizer`
- `RAIDHasher` → `POWRHasher`

- [ ] **Step 2: Copy Canonical.swift**

Read `/Users/danielwyler/raid.golf/ios/RAID/RAID/Kernel/Canonical.swift` and copy it:
- `RAIDCanonical` → `POWRCanonical`

- [ ] **Step 3: Copy Hashing.swift**

Read `/Users/danielwyler/raid.golf/ios/RAID/RAID/Kernel/Hashing.swift` and copy it:
- `RAIDHashing` → `POWRHashing`

- [ ] **Step 4: Write CanonicalTests.swift**

```swift
import XCTest
@testable import POWR

final class CanonicalTests: XCTestCase {

    func testCanonicalizeSimpleObject() throws {
        let input: [String: Any] = ["b": 2, "a": 1]
        let result = try POWRCanonical.canonicalize(input)
        XCTAssertEqual(result, #"{"a":1,"b":2}"#)
    }

    func testHashDeterminism() throws {
        let template: [String: Any] = [
            "title": "Bench Press",
            "equipment": "barbell",
            "format": ["weight", "reps"]
        ]
        let hash1 = try POWRHashing.computeTemplateHash(template)
        let hash2 = try POWRHashing.computeTemplateHash(template)
        XCTAssertEqual(hash1, hash2)
        XCTAssertEqual(hash1.count, 64) // SHA-256 hex
    }

    func testDifferentContentProducesDifferentHash() throws {
        let t1: [String: Any] = ["title": "Bench Press"]
        let t2: [String: Any] = ["title": "Squat"]
        let h1 = try POWRHashing.computeTemplateHash(t1)
        let h2 = try POWRHashing.computeTemplateHash(t2)
        XCTAssertNotEqual(h1, h2)
    }
}
```

- [ ] **Step 5: Run tests**

Run: Cmd+U. Expected: All PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add canonical JSON and hashing (from Gambit Golf)"
```

---

### Task 5: WorkoutRepository

**Files:**
- Create: `POWR/Database/WorkoutRepository.swift`
- Create: `POWRTests/WorkoutRepositoryTests.swift`

- [ ] **Step 1: Write WorkoutRepositoryTests.swift**

```swift
import XCTest
import GRDB
@testable import POWR

final class WorkoutRepositoryTests: XCTestCase {
    var db: DatabaseQueue!
    var repo: WorkoutRepository!

    override func setUp() async throws {
        db = try DatabaseQueue.inMemoryPOWRDatabase()
        repo = WorkoutRepository(db: db)
    }

    func testStartSession() throws {
        let session = try repo.startSession(title: "Push Day", workoutType: .strength)
        XCTAssertNotNil(session.id)
        XCTAssertEqual(session.status, "active")
        XCTAssertEqual(session.title, "Push Day")
    }

    func testAddExercise() throws {
        let session = try repo.startSession(title: "Push Day", workoutType: .strength)
        let exercise = try repo.addExercise(
            sessionId: session.id!,
            exerciseRef: "33401:abc:bench-press",
            exerciseName: "Bench Press",
            positionIndex: 0
        )
        XCTAssertNotNil(exercise.id)
        XCTAssertEqual(exercise.exerciseName, "Bench Press")
    }

    func testRecordSet() throws {
        let session = try repo.startSession(title: "Push Day", workoutType: .strength)
        let exercise = try repo.addExercise(
            sessionId: session.id!, exerciseRef: "33401:abc:bench-press",
            exerciseName: "Bench Press", positionIndex: 0
        )
        let set = try repo.recordSet(
            sessionId: session.id!, exerciseId: exercise.id!,
            setNumber: 1, reps: 8, weightKg: 80, rpe: 7, setType: .normal
        )
        XCTAssertNotNil(set.id)
        XCTAssertEqual(set.reps, 8)
        XCTAssertEqual(set.weightKg, 80)
    }

    func testCompleteSession() throws {
        let session = try repo.startSession(title: "Push Day", workoutType: .strength)
        try repo.completeSession(sessionId: session.id!)

        let completed = try repo.fetchSession(id: session.id!)
        XCTAssertEqual(completed?.status, "completed")
        XCTAssertNotNil(completed?.endedAt)
    }

    func testFetchPreviousSets() throws {
        // Session 1
        let s1 = try repo.startSession(title: "Day 1", workoutType: .strength)
        let e1 = try repo.addExercise(sessionId: s1.id!, exerciseRef: "33401:abc:bench", exerciseName: "Bench", positionIndex: 0)
        try repo.recordSet(sessionId: s1.id!, exerciseId: e1.id!, setNumber: 1, reps: 8, weightKg: 80, setType: .normal)
        try repo.completeSession(sessionId: s1.id!)

        // Fetch previous sets for bench
        let previous = try repo.fetchPreviousSets(exerciseRef: "33401:abc:bench")
        XCTAssertEqual(previous.count, 1)
        XCTAssertEqual(previous.first?.weight, 80)
        XCTAssertEqual(previous.first?.reps, 8)
    }

    func testFetchActiveSessions() throws {
        let s1 = try repo.startSession(title: "Active", workoutType: .strength)
        let s2 = try repo.startSession(title: "Done", workoutType: .strength)
        try repo.completeSession(sessionId: s2.id!)

        let active = try repo.fetchActiveSessions()
        XCTAssertEqual(active.count, 1)
        XCTAssertEqual(active.first?.title, "Active")
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Expected: FAIL — `WorkoutRepository` not found.

- [ ] **Step 3: Implement WorkoutRepository.swift**

```swift
import Foundation
import GRDB

final class WorkoutRepository {
    private let db: DatabaseQueue

    init(db: DatabaseQueue) {
        self.db = db
    }

    // MARK: - Sessions

    func startSession(title: String, workoutType: WorkoutType, templateRef: String? = nil, templateHash: String? = nil) throws -> WorkoutSession {
        try db.write { db in
            var session = WorkoutSession(
                sessionUUID: UUID().uuidString,
                title: title,
                workoutType: workoutType.rawValue,
                templateRef: templateRef,
                templateHash: templateHash,
                startedAt: Date(),
                status: WorkoutSessionStatus.active.rawValue,
                createdAt: Date()
            )
            try session.insert(db)
            return session
        }
    }

    func completeSession(sessionId: Int64) throws {
        try db.write { db in
            try db.execute(
                sql: "UPDATE workout_sessions SET status = ?, ended_at = ? WHERE session_id = ?",
                arguments: [WorkoutSessionStatus.completed.rawValue, Date().timeIntervalSinceReferenceDate, sessionId]
            )
        }
    }

    func pauseSession(sessionId: Int64) throws {
        try db.write { db in
            try db.execute(
                sql: "UPDATE workout_sessions SET status = ? WHERE session_id = ?",
                arguments: [WorkoutSessionStatus.paused.rawValue, sessionId]
            )
        }
    }

    func resumeSession(sessionId: Int64) throws {
        try db.write { db in
            try db.execute(
                sql: "UPDATE workout_sessions SET status = ? WHERE session_id = ?",
                arguments: [WorkoutSessionStatus.active.rawValue, sessionId]
            )
        }
    }

    func abandonSession(sessionId: Int64) throws {
        try db.write { db in
            try db.execute(
                sql: "UPDATE workout_sessions SET status = ?, ended_at = ? WHERE session_id = ?",
                arguments: [WorkoutSessionStatus.abandoned.rawValue, Date().timeIntervalSinceReferenceDate, sessionId]
            )
        }
    }

    func fetchSession(id: Int64) throws -> WorkoutSession? {
        try db.read { db in
            try WorkoutSession.fetchOne(db, key: id)
        }
    }

    func fetchActiveSessions() throws -> [WorkoutSession] {
        try db.read { db in
            try WorkoutSession
                .filter(Column("status") == WorkoutSessionStatus.active.rawValue || Column("status") == WorkoutSessionStatus.paused.rawValue)
                .fetchAll(db)
        }
    }

    func fetchCompletedSessions(limit: Int = 50) throws -> [WorkoutSession] {
        try db.read { db in
            try WorkoutSession
                .filter(Column("status") == WorkoutSessionStatus.completed.rawValue)
                .order(Column("started_at").desc)
                .limit(limit)
                .fetchAll(db)
        }
    }

    // MARK: - Exercises

    func addExercise(sessionId: Int64, exerciseRef: String, exerciseName: String, positionIndex: Int) throws -> WorkoutExercise {
        try db.write { db in
            var exercise = WorkoutExercise(
                sessionId: sessionId,
                exerciseRef: exerciseRef,
                exerciseName: exerciseName,
                positionIndex: positionIndex
            )
            try exercise.insert(db)
            return exercise
        }
    }

    func fetchExercises(sessionId: Int64) throws -> [WorkoutExercise] {
        try db.read { db in
            try WorkoutExercise
                .filter(Column("session_id") == sessionId)
                .order(Column("position_index"))
                .fetchAll(db)
        }
    }

    func removeExercise(exerciseId: Int64) throws {
        try db.write { db in
            // Delete sets first (FK constraint)
            try db.execute(sql: "DELETE FROM workout_sets WHERE exercise_id = ?", arguments: [exerciseId])
            try db.execute(sql: "DELETE FROM workout_exercises WHERE exercise_id = ?", arguments: [exerciseId])
        }
    }

    func updateExercisePosition(exerciseId: Int64, newPosition: Int) throws {
        try db.write { db in
            try db.execute(
                sql: "UPDATE workout_exercises SET position_index = ? WHERE exercise_id = ?",
                arguments: [newPosition, exerciseId]
            )
        }
    }

    // MARK: - Sets

    @discardableResult
    func recordSet(sessionId: Int64, exerciseId: Int64, setNumber: Int, reps: Int? = nil, weightKg: Double? = nil, rpe: Double? = nil, setType: SetType = .normal, durationSeconds: Double? = nil, distanceMeters: Double? = nil) throws -> WorkoutSet {
        try db.write { db in
            var set = WorkoutSet(
                sessionId: sessionId,
                exerciseId: exerciseId,
                setNumber: setNumber,
                reps: reps,
                weightKg: weightKg,
                rpe: rpe,
                setType: setType.rawValue,
                durationSeconds: durationSeconds,
                distanceMeters: distanceMeters,
                recordedAt: Date()
            )
            try set.insert(db)
            return set
        }
    }

    func deleteSet(setId: Int64) throws {
        try db.write { db in
            try db.execute(sql: "DELETE FROM workout_sets WHERE set_id = ?", arguments: [setId])
        }
    }

    func fetchSets(sessionId: Int64) throws -> [WorkoutSet] {
        try db.read { db in
            try WorkoutSet
                .filter(Column("session_id") == sessionId)
                .order(Column("exercise_id"), Column("set_number"))
                .fetchAll(db)
        }
    }

    func fetchSets(exerciseId: Int64) throws -> [WorkoutSet] {
        try db.read { db in
            try WorkoutSet
                .filter(Column("exercise_id") == exerciseId)
                .order(Column("set_number"))
                .fetchAll(db)
        }
    }

    // MARK: - History (for Previous column)

    func fetchPreviousSets(exerciseRef: String) throws -> [HistoricalSet] {
        try db.read { db in
            // Only return sets from the MOST RECENT completed session for this exercise
            let rows = try Row.fetchAll(db, sql: """
                SELECT ws.weight_kg, ws.reps, ws.rpe, wk.started_at
                FROM workout_sets ws
                JOIN workout_exercises we ON ws.exercise_id = we.exercise_id
                JOIN workout_sessions wk ON ws.session_id = wk.session_id
                WHERE we.exercise_ref = ?
                AND wk.status = 'completed'
                AND wk.session_id = (
                    SELECT wk2.session_id FROM workout_sessions wk2
                    JOIN workout_exercises we2 ON wk2.session_id = we2.session_id
                    WHERE we2.exercise_ref = ? AND wk2.status = 'completed'
                    ORDER BY wk2.started_at DESC LIMIT 1
                )
                ORDER BY ws.set_number ASC
            """, arguments: [exerciseRef, exerciseRef])

            return rows.map { row in
                HistoricalSet(
                    weight: row["weight_kg"] ?? 0,
                    reps: row["reps"] ?? 0,
                    rpe: row["rpe"],
                    date: Date(timeIntervalSinceReferenceDate: row["started_at"] ?? 0)
                )
            }
        }
    }
}
```

- [ ] **Step 4: Run tests**

Run: Cmd+U. Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add WorkoutRepository with session/exercise/set CRUD"
```

---

### Task 6: TemplateRepository

**Files:**
- Create: `POWR/Database/TemplateRepository.swift`
- Create: `POWRTests/TemplateRepositoryTests.swift`

- [ ] **Step 1: Write TemplateRepositoryTests.swift**

```swift
import XCTest
import GRDB
@testable import POWR

final class TemplateRepositoryTests: XCTestCase {
    var db: DatabaseQueue!
    var repo: TemplateRepository!

    override func setUp() async throws {
        db = try DatabaseQueue.inMemoryPOWRDatabase()
        repo = TemplateRepository(db: db)
    }

    func testImportTemplate() throws {
        let json: [String: Any] = [
            "title": "Bench Press",
            "equipment": "barbell",
            "format": ["weight", "reps", "rpe", "set_type"],
            "format_units": ["kg", "count", "0-10", "enum"]
        ]
        let result = try repo.importTemplate(json: json, kind: 33401, authorPubkey: "abc", dTag: "bench-press")
        XCTAssertEqual(result.hash.count, 64)
    }

    func testDuplicateImportReturnsSameHash() throws {
        let json: [String: Any] = ["title": "Bench Press", "equipment": "barbell"]
        let r1 = try repo.importTemplate(json: json, kind: 33401, authorPubkey: "abc", dTag: "bench")
        let r2 = try repo.importTemplate(json: json, kind: 33401, authorPubkey: "abc", dTag: "bench")
        XCTAssertEqual(r1.hash, r2.hash)
    }

    func testFetchTemplate() throws {
        let json: [String: Any] = ["title": "Squat"]
        let imported = try repo.importTemplate(json: json, kind: 33401, authorPubkey: "abc", dTag: "squat")
        let fetched = try repo.fetchTemplate(hash: imported.hash)
        XCTAssertNotNil(fetched)
    }
}
```

- [ ] **Step 2: Run tests — expect failure**

- [ ] **Step 3: Implement TemplateRepository.swift**

Reference Gambit's Repository.swift at `/Users/danielwyler/raid.golf/ios/RAID/RAID/Kernel/Repository.swift` for the insert-path pattern (canonicalize → hash → store).

```swift
import Foundation
import GRDB

struct TemplateImportResult {
    let hash: String
    let isNew: Bool
}

final class TemplateRepository {
    private let db: DatabaseQueue
    private let canonicalizer: Canonicalizing
    private let hasher: Hashing

    init(db: DatabaseQueue, canonicalizer: Canonicalizing = POWRCanonicalizer(), hasher: Hashing = POWRHasher()) {
        self.db = db
        self.canonicalizer = canonicalizer
        self.hasher = hasher
    }

    func importTemplate(json: [String: Any], kind: Int, authorPubkey: String, dTag: String, eventId: String? = nil, relayURL: String? = nil) throws -> TemplateImportResult {
        let jsonData = try JSONSerialization.data(withJSONObject: json)
        let canonicalData = try canonicalizer.canonicalize(jsonData)
        let hash = hasher.sha256Hex(canonicalData)
        let canonicalString = String(data: canonicalData, encoding: .utf8)!

        let isNew = try db.write { db -> Bool in
            // Check if template already exists
            let exists = try TemplateFact.fetchOne(db, key: hash) != nil
            if !exists {
                let fact = TemplateFact(
                    templateHash: hash,
                    canonicalJSON: canonicalString,
                    kind: kind,
                    createdAt: Date()
                )
                try fact.insert(db)
            }

            // Always add provenance (may come from different sources)
            var provenance = TemplateProvenance(
                templateHash: hash,
                kind: kind,
                authorPubkey: authorPubkey,
                dTag: dTag,
                eventId: eventId,
                relayURL: relayURL,
                importedAt: Date()
            )
            try provenance.insert(db)

            return !exists
        }

        return TemplateImportResult(hash: hash, isNew: isNew)
    }

    func fetchTemplate(hash: String) throws -> TemplateFact? {
        try db.read { db in
            try TemplateFact.fetchOne(db, key: hash)
        }
    }

    func parseExerciseTemplate(from fact: TemplateFact) throws -> ExerciseTemplate {
        let data = fact.canonicalJSON.data(using: .utf8)!
        return try JSONDecoder().decode(ExerciseTemplate.self, from: data)
    }
}
```

- [ ] **Step 4: Run tests**

Expected: All 3 PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add TemplateRepository with content-addressed storage"
```

---

### Task 7: Exercise Seed Data + LibraryService

**Files:**
- Create: `POWR/Resources/exercises_seed.json`
- Create: `POWR/Services/LibraryService.swift`

- [ ] **Step 1: Create exercises_seed.json**

Create a JSON file with ~20 seed exercises to start (expand to ~200 later). Each exercise follows the NIP-101e exercise template format.

```json
[
  {
    "d_tag": "barbell-bench-press",
    "title": "Barbell Bench Press",
    "format": ["weight", "reps", "rpe", "set_type"],
    "format_units": ["kg", "count", "0-10", "enum"],
    "equipment": "barbell",
    "difficulty": "intermediate",
    "content": "Lie on bench, grip barbell slightly wider than shoulder width. Lower to chest, press up.",
    "tags": ["chest", "triceps", "push", "compound", "fitness"]
  },
  {
    "d_tag": "barbell-squat",
    "title": "Barbell Back Squat",
    "format": ["weight", "reps", "rpe", "set_type"],
    "format_units": ["kg", "count", "0-10", "enum"],
    "equipment": "barbell",
    "difficulty": "intermediate",
    "content": "Bar on upper back, feet shoulder width. Squat to parallel or below, drive up.",
    "tags": ["legs", "quads", "glutes", "compound", "fitness"]
  },
  {
    "d_tag": "barbell-deadlift",
    "title": "Barbell Deadlift",
    "format": ["weight", "reps", "rpe", "set_type"],
    "format_units": ["kg", "count", "0-10", "enum"],
    "equipment": "barbell",
    "difficulty": "intermediate",
    "content": "Stand with feet hip-width apart, barbell over midfoot. Hinge at hips, grip bar outside knees.",
    "tags": ["legs", "posterior", "back", "compound", "fitness"]
  },
  {
    "d_tag": "barbell-overhead-press",
    "title": "Overhead Press",
    "format": ["weight", "reps", "rpe", "set_type"],
    "format_units": ["kg", "count", "0-10", "enum"],
    "equipment": "barbell",
    "difficulty": "intermediate",
    "content": "Stand with bar at shoulders, press overhead to lockout.",
    "tags": ["shoulders", "triceps", "push", "compound", "fitness"]
  },
  {
    "d_tag": "barbell-row",
    "title": "Barbell Row",
    "format": ["weight", "reps", "rpe", "set_type"],
    "format_units": ["kg", "count", "0-10", "enum"],
    "equipment": "barbell",
    "difficulty": "intermediate",
    "content": "Hinge forward, pull barbell to lower chest/upper abdomen.",
    "tags": ["back", "biceps", "pull", "compound", "fitness"]
  },
  {
    "d_tag": "dumbbell-curl",
    "title": "Dumbbell Bicep Curl",
    "format": ["weight", "reps", "rpe", "set_type"],
    "format_units": ["kg", "count", "0-10", "enum"],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "content": "Stand with dumbbells at sides, curl up to shoulders.",
    "tags": ["biceps", "arms", "isolation", "fitness"]
  },
  {
    "d_tag": "dumbbell-lateral-raise",
    "title": "Dumbbell Lateral Raise",
    "format": ["weight", "reps", "rpe", "set_type"],
    "format_units": ["kg", "count", "0-10", "enum"],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "content": "Stand with dumbbells at sides, raise to shoulder height with slight bend in elbows.",
    "tags": ["shoulders", "isolation", "fitness"]
  },
  {
    "d_tag": "pull-up",
    "title": "Pull-Up",
    "format": ["weight", "reps", "rpe", "set_type"],
    "format_units": ["kg", "count", "0-10", "enum"],
    "equipment": "bodyweight",
    "difficulty": "intermediate",
    "content": "Hang from bar, pull chin above bar. Use 0 weight for bodyweight, negative for assisted.",
    "tags": ["back", "biceps", "pull", "compound", "fitness"]
  },
  {
    "d_tag": "push-up",
    "title": "Push-Up",
    "format": ["reps", "rpe", "set_type"],
    "format_units": ["count", "0-10", "enum"],
    "equipment": "bodyweight",
    "difficulty": "beginner",
    "content": "Hands shoulder width, lower chest to ground, push up.",
    "tags": ["chest", "triceps", "push", "compound", "fitness"]
  },
  {
    "d_tag": "plank",
    "title": "Plank",
    "format": ["duration", "rpe", "set_type"],
    "format_units": ["seconds", "0-10", "enum"],
    "equipment": "bodyweight",
    "difficulty": "beginner",
    "content": "Hold push-up position on forearms. Keep body straight.",
    "tags": ["core", "isometric", "fitness"]
  },
  {
    "d_tag": "kettlebell-swing",
    "title": "Kettlebell Swing",
    "format": ["weight", "reps", "rpe", "set_type"],
    "format_units": ["kg", "count", "0-10", "enum"],
    "equipment": "kettlebell",
    "difficulty": "intermediate",
    "content": "Hinge at hips, swing kettlebell to chest height with hip drive.",
    "tags": ["posterior", "glutes", "cardio", "compound", "fitness"]
  },
  {
    "d_tag": "kettlebell-snatch",
    "title": "Kettlebell Snatch",
    "format": ["weight", "reps", "rpe", "set_type"],
    "format_units": ["kg", "count", "0-10", "enum"],
    "equipment": "kettlebell",
    "difficulty": "advanced",
    "content": "Swing kettlebell from between legs to overhead in one motion.",
    "tags": ["full-body", "power", "compound", "fitness"]
  },
  {
    "d_tag": "kettlebell-goblet-squat",
    "title": "Goblet Squat",
    "format": ["weight", "reps", "rpe", "set_type"],
    "format_units": ["kg", "count", "0-10", "enum"],
    "equipment": "kettlebell",
    "difficulty": "beginner",
    "content": "Hold kettlebell at chest, squat to parallel or below.",
    "tags": ["legs", "quads", "compound", "fitness"]
  },
  {
    "d_tag": "cable-tricep-pushdown",
    "title": "Cable Tricep Pushdown",
    "format": ["weight", "reps", "rpe", "set_type"],
    "format_units": ["kg", "count", "0-10", "enum"],
    "equipment": "cable",
    "difficulty": "beginner",
    "content": "Stand at cable machine, push handle down to full arm extension.",
    "tags": ["triceps", "arms", "isolation", "fitness"]
  },
  {
    "d_tag": "leg-press",
    "title": "Leg Press",
    "format": ["weight", "reps", "rpe", "set_type"],
    "format_units": ["kg", "count", "0-10", "enum"],
    "equipment": "machine",
    "difficulty": "beginner",
    "content": "Sit in leg press machine, press platform away with legs.",
    "tags": ["legs", "quads", "compound", "fitness"]
  },
  {
    "d_tag": "lat-pulldown",
    "title": "Lat Pulldown",
    "format": ["weight", "reps", "rpe", "set_type"],
    "format_units": ["kg", "count", "0-10", "enum"],
    "equipment": "cable",
    "difficulty": "beginner",
    "content": "Sit at lat pulldown machine, pull bar to upper chest.",
    "tags": ["back", "lats", "pull", "compound", "fitness"]
  },
  {
    "d_tag": "dumbbell-romanian-deadlift",
    "title": "Dumbbell Romanian Deadlift",
    "format": ["weight", "reps", "rpe", "set_type"],
    "format_units": ["kg", "count", "0-10", "enum"],
    "equipment": "dumbbell",
    "difficulty": "intermediate",
    "content": "Hold dumbbells, hinge at hips keeping legs slightly bent, lower along shins.",
    "tags": ["hamstrings", "posterior", "compound", "fitness"]
  },
  {
    "d_tag": "dumbbell-chest-press",
    "title": "Dumbbell Chest Press",
    "format": ["weight", "reps", "rpe", "set_type"],
    "format_units": ["kg", "count", "0-10", "enum"],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "content": "Lie on bench with dumbbells, press up from chest level.",
    "tags": ["chest", "triceps", "push", "compound", "fitness"]
  },
  {
    "d_tag": "cable-face-pull",
    "title": "Cable Face Pull",
    "format": ["weight", "reps", "rpe", "set_type"],
    "format_units": ["kg", "count", "0-10", "enum"],
    "equipment": "cable",
    "difficulty": "beginner",
    "content": "Pull cable rope attachment to face level, externally rotating shoulders.",
    "tags": ["shoulders", "rear-delts", "pull", "fitness"]
  },
  {
    "d_tag": "hip-thrust",
    "title": "Barbell Hip Thrust",
    "format": ["weight", "reps", "rpe", "set_type"],
    "format_units": ["kg", "count", "0-10", "enum"],
    "equipment": "barbell",
    "difficulty": "intermediate",
    "content": "Upper back on bench, barbell across hips, drive hips up to full extension.",
    "tags": ["glutes", "posterior", "compound", "fitness"]
  }
]
```

- [ ] **Step 2: Create LibraryService.swift**

```swift
import Foundation
import GRDB

@Observable
final class LibraryService {
    private let db: DatabaseQueue
    private let templateRepo: TemplateRepository

    private(set) var exercises: [ExerciseTemplate] = []
    private(set) var isLoaded: Bool = false

    init(db: DatabaseQueue) {
        self.db = db
        self.templateRepo = TemplateRepository(db: db)
    }

    /// Load seed exercises from bundle on first launch
    func loadSeedIfNeeded() {
        guard !isLoaded else { return }

        // Check if exercises already loaded
        let existingCount = (try? db.read { db in
            try Int.fetchOne(db, sql: "SELECT COUNT(*) FROM library_items WHERE item_type = 'exercise'")
        }) ?? 0

        if existingCount == 0 {
            loadSeedExercises()
        }

        refreshExerciseList()
        isLoaded = true
    }

    private func loadSeedExercises() {
        guard let url = Bundle.main.url(forResource: "exercises_seed", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let exercises = try? JSONDecoder().decode([SeedExercise].self, from: data) else {
            print("[POWR] Failed to load exercise seed data")
            return
        }

        for exercise in exercises {
            do {
                // Build dictionary without nil values to ensure canonical hash consistency
                var json: [String: Any] = [
                    "d_tag": exercise.dTag,
                    "title": exercise.title,
                    "format": exercise.format,
                    "format_units": exercise.formatUnits,
                    "equipment": exercise.equipment,
                    "tags": exercise.tags
                ]
                if let difficulty = exercise.difficulty { json["difficulty"] = difficulty }
                if let content = exercise.content { json["content"] = content }

                let result = try templateRepo.importTemplate(
                    json: json, kind: 33401,
                    authorPubkey: "powr-seed", dTag: exercise.dTag
                )

                // Add to library
                try db.write { db in
                    try db.execute(sql: """
                        INSERT OR IGNORE INTO library_items (item_type, item_ref, template_hash, added_at, source)
                        VALUES ('exercise', ?, ?, ?, 'seed')
                    """, arguments: ["33401:powr-seed:\(exercise.dTag)", result.hash, Date().timeIntervalSinceReferenceDate])
                }
            } catch {
                print("[POWR] Failed to import exercise \(exercise.dTag): \(error)")
            }
        }
    }

    func refreshExerciseList() {
        do {
            exercises = try db.read { db in
                let rows = try Row.fetchAll(db, sql: """
                    SELECT tf.canonical_json, tf.template_hash
                    FROM library_items li
                    JOIN template_facts tf ON li.template_hash = tf.template_hash
                    WHERE li.item_type = 'exercise'
                    ORDER BY li.added_at
                """)

                return rows.compactMap { row -> ExerciseTemplate? in
                    guard let json = row["canonical_json"] as? String,
                          let data = json.data(using: .utf8) else { return nil }
                    return try? JSONDecoder().decode(ExerciseTemplate.self, from: data)
                }
            }
        } catch {
            print("[POWR] Failed to refresh exercise list: \(error)")
        }
    }

    func searchExercises(query: String) -> [ExerciseTemplate] {
        guard !query.isEmpty else { return exercises }
        let lowered = query.lowercased()
        return exercises.filter {
            $0.title.lowercased().contains(lowered) ||
            $0.equipment.lowercased().contains(lowered) ||
            $0.tags.contains(where: { $0.lowercased().contains(lowered) })
        }
    }

    func filterExercises(equipment: Equipment? = nil, tag: String? = nil) -> [ExerciseTemplate] {
        exercises.filter { exercise in
            if let equipment, exercise.equipment != equipment.rawValue { return false }
            if let tag, !exercise.tags.contains(tag) { return false }
            return true
        }
    }
}

// For JSON decoding of seed file
private struct SeedExercise: Codable {
    let dTag: String
    let title: String
    let format: [String]
    let formatUnits: [String]
    let equipment: String
    let difficulty: String?
    let content: String?
    let tags: [String]

    enum CodingKeys: String, CodingKey {
        case dTag = "d_tag"
        case title, format
        case formatUnits = "format_units"
        case equipment, difficulty, content, tags
    }
}
```

- [ ] **Step 3: Build**

Run: Cmd+B. Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add exercise seed data and LibraryService"
```

---

### Task 8: WorkoutLifecycleStore

**Files:**
- Create: `POWR/Services/WorkoutLifecycleStore.swift`
- Create: `POWRTests/WorkoutLifecycleStoreTests.swift`
- Create: `POWR/Services/SettingsService.swift`

**Note:** PRTracker is deferred — `WorkoutSummary.prs` will be empty in Phase 1. PRTracker requires historical data queries that depend on having real workout data. It will be added as a follow-up task.

This is the most critical service. Reference the design spec's WorkoutLifecycleStore section (lines 715-783) and the web app's active workout machine at `/Users/danielwyler/powr_web/src/lib/machines/workout/activeWorkoutMachine.ts`.

- [ ] **Step 1: Create SettingsService.swift**

NOTE: @AppStorage does not compose with @Observable. Use UserDefaults directly.

```swift
import Foundation

@Observable
final class SettingsService {
    private let defaults = UserDefaults.standard

    var weightUnit: WeightUnit {
        get { WeightUnit(rawValue: defaults.string(forKey: "weightUnit") ?? "") ?? .lbs }
        set { defaults.set(newValue.rawValue, forKey: "weightUnit") }
    }

    var defaultRestTimerSeconds: Int {
        get {
            let val = defaults.integer(forKey: "defaultRestTimer")
            return val > 0 ? val : 90
        }
        set { defaults.set(newValue, forKey: "defaultRestTimer") }
    }

    var hasCompletedOnboarding: Bool {
        get { defaults.bool(forKey: "hasCompletedOnboarding") }
        set { defaults.set(newValue, forKey: "hasCompletedOnboarding") }
    }
}
```

- [ ] **Step 2: Write WorkoutLifecycleStoreTests.swift**

```swift
import XCTest
import GRDB
@testable import POWR

final class WorkoutLifecycleStoreTests: XCTestCase {
    var db: DatabaseQueue!
    var store: WorkoutLifecycleStore!

    override func setUp() async throws {
        db = try DatabaseQueue.inMemoryPOWRDatabase()
        store = WorkoutLifecycleStore(db: db, settings: SettingsService())
    }

    func testStartFreeWorkout() async throws {
        try await store.startFreeWorkout(title: "Push Day", type: .strength)
        XCTAssertEqual(store.phase, .active)
        XCTAssertEqual(store.title, "Push Day")
        XCTAssertNotNil(store.startedAt)
    }

    func testAddExercise() async throws {
        try await store.startFreeWorkout(title: "Push Day", type: .strength)
        await store.addExercises([.init(ref: "33401:abc:bench", name: "Bench Press")])
        XCTAssertEqual(store.exercises.count, 1)
        XCTAssertEqual(store.exercises.first?.exerciseName, "Bench Press")
    }

    func testCompleteSet() async throws {
        try await store.startFreeWorkout(title: "Push Day", type: .strength)
        await store.addExercises([.init(ref: "33401:abc:bench", name: "Bench Press")])

        store.updateSet(exerciseIndex: 0, setIndex: 0, weight: 80, reps: 8)
        store.completeSet(exerciseIndex: 0, setIndex: 0)

        XCTAssertTrue(store.exercises[0].sets[0].isCompleted)

        // Verify persisted to GRDB
        let sets = try WorkoutRepository(db: db).fetchSets(sessionId: store.sessionId!)
        XCTAssertEqual(sets.count, 1)
        XCTAssertEqual(sets.first?.reps, 8)
        XCTAssertEqual(sets.first?.weightKg, 80)
    }

    func testPauseResume() async throws {
        try await store.startFreeWorkout(title: "Test", type: .strength)
        store.pauseWorkout()
        guard case .paused = store.phase else { XCTFail("Expected .paused"); return }

        store.resumeFromPause()
        XCTAssertEqual(store.phase, .active)
    }

    func testCompleteWorkout() async throws {
        try await store.startFreeWorkout(title: "Test", type: .strength)
        await store.addExercises([.init(ref: "33401:abc:bench", name: "Bench")])
        store.updateSet(exerciseIndex: 0, setIndex: 0, weight: 80, reps: 8)
        store.completeSet(exerciseIndex: 0, setIndex: 0)

        let summary = try await store.completeWorkout()
        XCTAssertEqual(summary.totalSets, 1)
        guard case .completed = store.phase else { XCTFail("Expected .completed"); return }
    }

    func testCrashRecovery() async throws {
        try await store.startFreeWorkout(title: "Crash Test", type: .strength)
        await store.addExercises([.init(ref: "33401:abc:bench", name: "Bench")])
        store.updateSet(exerciseIndex: 0, setIndex: 0, weight: 100, reps: 5)
        store.completeSet(exerciseIndex: 0, setIndex: 0)

        let sessionId = store.sessionId!

        // Simulate crash: create new store, resume
        let newStore = WorkoutLifecycleStore(db: db, settings: SettingsService())
        try await newStore.resumeWorkout(sessionId: sessionId)

        XCTAssertEqual(newStore.phase, .active)
        XCTAssertEqual(newStore.title, "Crash Test")
        XCTAssertEqual(newStore.exercises.count, 1)
        // Completed sets should be restored
        XCTAssertEqual(newStore.exercises[0].sets.filter(\.isCompleted).count, 1)
    }
}
```

- [ ] **Step 3: Run tests — expect failure**

- [ ] **Step 4: Implement WorkoutLifecycleStore.swift**

This is the largest single file. Implement the full state machine with all methods from the design spec. Key behaviors:
- Every `completeSet` writes to GRDB immediately
- `resumeWorkout` reconstructs state from GRDB
- Rest timer is a cancellable `Task`
- Phase transitions are explicit

The full implementation should follow the API defined in the spec (lines 715-783) and pass all tests above. The implementing agent should read:
- Design spec: `/Users/danielwyler/powr_web/docs/superpowers/specs/2026-03-18-powr-ios-design.md` (WorkoutLifecycleStore section)
- Web app reference: `/Users/danielwyler/powr_web/src/lib/machines/workout/activeWorkoutMachine.ts` (for behavioral reference)

Key types needed:

```swift
struct ExerciseSelection {
    let ref: String
    let name: String
    let equipment: String?
}
```

The store should be `@Observable` and `@MainActor`.

- [ ] **Step 5: Run tests**

Expected: All 6 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add WorkoutLifecycleStore with crash recovery"
```

---

### Task 9: Environment Keys + App Wiring

**Files:**
- Create: `POWR/Extensions/EnvironmentKeys.swift`
- Modify: `POWR/POWRApp.swift`

Reference Gambit's environment key pattern. Read `/Users/danielwyler/raid.golf/ios/RAID/RAID/Extensions/` for the pattern.

- [ ] **Step 1: Create EnvironmentKeys.swift**

```swift
import SwiftUI
import GRDB

// MARK: - Database
private struct DatabaseQueueKey: EnvironmentKey {
    static let defaultValue: DatabaseQueue = try! DatabaseQueue.inMemoryPOWRDatabase()
}

// MARK: - Services
private struct WorkoutStoreKey: EnvironmentKey {
    static let defaultValue = WorkoutLifecycleStore(
        db: try! DatabaseQueue.inMemoryPOWRDatabase(),
        settings: SettingsService()
    )
}

private struct LibraryServiceKey: EnvironmentKey {
    static let defaultValue = LibraryService(db: try! DatabaseQueue.inMemoryPOWRDatabase())
}

private struct SettingsServiceKey: EnvironmentKey {
    static let defaultValue = SettingsService()
}

extension EnvironmentValues {
    var database: DatabaseQueue {
        get { self[DatabaseQueueKey.self] }
        set { self[DatabaseQueueKey.self] = newValue }
    }

    var workoutStore: WorkoutLifecycleStore {
        get { self[WorkoutStoreKey.self] }
        set { self[WorkoutStoreKey.self] = newValue }
    }

    var libraryService: LibraryService {
        get { self[LibraryServiceKey.self] }
        set { self[LibraryServiceKey.self] = newValue }
    }

    var settingsService: SettingsService {
        get { self[SettingsServiceKey.self] }
        set { self[SettingsServiceKey.self] = newValue }
    }
}
```

- [ ] **Step 2: Update POWRApp.swift**

```swift
import SwiftUI
import GRDB

@main
struct POWRApp: App {
    private let dbQueue: DatabaseQueue
    @State private var workoutStore: WorkoutLifecycleStore
    @State private var libraryService: LibraryService
    @State private var settingsService = SettingsService()

    init() {
        let db = try! DatabaseQueue.createPOWRDatabase()
        self.dbQueue = db
        let settings = SettingsService()
        _workoutStore = State(initialValue: WorkoutLifecycleStore(db: db, settings: settings))
        _libraryService = State(initialValue: LibraryService(db: db))
        _settingsService = State(initialValue: settings)
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.database, dbQueue)
                .environment(\.workoutStore, workoutStore)
                .environment(\.libraryService, libraryService)
                .environment(\.settingsService, settingsService)
                .task {
                    libraryService.loadSeedIfNeeded()
                    await checkForActiveWorkout()
                }
        }
    }

    private func checkForActiveWorkout() async {
        let repo = WorkoutRepository(db: dbQueue)
        if let active = try? repo.fetchActiveSessions().first {
            try? await workoutStore.resumeWorkout(sessionId: active.id!)
        }
    }
}
```

- [ ] **Step 3: Build**

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: wire environment keys and app bootstrap"
```

---

### Task 10: ContentView + Miniplayer + Navigation Shell

**Files:**
- Modify: `POWR/ContentView.swift`
- Create: `POWR/Views/Workout/WorkoutMiniplayerView.swift`
- Create: `POWR/Views/Library/LibraryTabView.swift` (stub)
- Create: `POWR/Views/Workout/WorkoutTabView.swift` (stub)
- Create: `POWR/Views/History/HistoryTabView.swift` (stub)
- Create: `POWR/Views/Profile/ProfileTabView.swift` (stub)

This task creates the navigation shell with the miniplayer architecture.

**Phase 1 tab deviation:** The spec defines Library/Workout/Social/Profile. Phase 1 replaces Social with History (no networking yet). In Phase 2, Social will be added as a 5th tab or replace History as a sub-section of Profile. Individual tab content will be built in Tasks 11-12. Read the design spec's ContentView structure (lines 526-550) and the miniplayer mockup.

- [ ] **Step 1: Create WorkoutMiniplayerView.swift**

```swift
import SwiftUI

struct WorkoutMiniplayerView: View {
    @Environment(\.workoutStore) var workoutStore

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(workoutStore.title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .lineLimit(1)

                if let currentExercise = workoutStore.exercises.first(where: { exercise in
                    exercise.sets.contains(where: { !$0.isCompleted })
                }) {
                    Text(currentExercise.exerciseName)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            Text(formatElapsed(workoutStore.elapsedTime))
                .font(.subheadline)
                .monospacedDigit()
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(radius: 2)
        .padding(.horizontal, 8)
    }

    private func formatElapsed(_ interval: TimeInterval) -> String {
        let minutes = Int(interval) / 60
        let seconds = Int(interval) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
}
```

- [ ] **Step 2: Create tab view stubs**

Create minimal stubs for each tab:

`Views/Library/LibraryTabView.swift`:
```swift
import SwiftUI

struct LibraryTabView: View {
    var body: some View {
        NavigationStack {
            Text("Library — coming in Task 11")
                .navigationTitle("Library")
        }
    }
}
```

`Views/Workout/WorkoutTabView.swift`:
```swift
import SwiftUI

struct WorkoutTabView: View {
    var body: some View {
        NavigationStack {
            Text("Start Workout — coming in Task 12")
                .navigationTitle("Workout")
        }
    }
}
```

`Views/History/HistoryTabView.swift`:
```swift
import SwiftUI

struct HistoryTabView: View {
    var body: some View {
        NavigationStack {
            Text("History — coming later")
                .navigationTitle("History")
        }
    }
}
```

`Views/Profile/ProfileTabView.swift`:
```swift
import SwiftUI

struct ProfileTabView: View {
    var body: some View {
        NavigationStack {
            Text("Profile — Phase 2")
                .navigationTitle("Profile")
        }
    }
}
```

- [ ] **Step 3: Update ContentView.swift with miniplayer**

```swift
import SwiftUI

struct ContentView: View {
    @Environment(\.workoutStore) var workoutStore
    @State private var selectedTab: Tab = .library
    @State private var showActiveWorkout = false

    enum Tab: String {
        case library, workout, history, profile
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            TabView(selection: $selectedTab) {
                LibraryTabView()
                    .tag(Tab.library)
                    .tabItem { Label("Library", systemImage: "books.vertical") }

                WorkoutTabView()
                    .tag(Tab.workout)
                    .tabItem { Label("Workout", systemImage: "figure.strengthtraining.traditional") }

                HistoryTabView()
                    .tag(Tab.history)
                    .tabItem { Label("History", systemImage: "clock") }

                ProfileTabView()
                    .tag(Tab.profile)
                    .tabItem { Label("Profile", systemImage: "person.circle") }
            }

            // Miniplayer above tab bar
            if workoutStore.isInProgress && !showActiveWorkout {
                WorkoutMiniplayerView()
                    .onTapGesture { showActiveWorkout = true }
                    .padding(.bottom, 50) // tab bar height
                    .transition(.move(edge: .bottom))
            }
        }
        .animation(.easeInOut(duration: 0.2), value: workoutStore.isInProgress)
        .fullScreenCover(isPresented: $showActiveWorkout) {
            Text("Active Workout View — Task 12")
        }
    }
}
```

- [ ] **Step 4: Build and run**

Expected: 4-tab app with miniplayer architecture in place.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add navigation shell with miniplayer architecture"
```

---

## Phase 1 Summary

Tasks 1-10 establish:
- **Project skeleton** with GRDB dependency
- **Domain models** for workouts, exercises, sets, templates
- **Database schema** with immutability triggers and crash-safe persistence
- **Content-addressed template storage** (copied from Gambit Golf)
- **WorkoutRepository** for all CRUD operations
- **Exercise seed data** (~20 exercises, expandable to ~200)
- **WorkoutLifecycleStore** state machine with crash recovery
- **Environment-based DI** wiring
- **Navigation shell** with miniplayer architecture

**Remaining for Phase 1 (separate tasks, added after these pass):**
- Library views (exercise list, template list, search/filter)
- Active workout views (the Strong-style UX with set input, rest timer, exercise cards)
- Workout history views
- Workout summary view

These view tasks will be defined in a follow-up plan once the data layer is solid and tested.

**Phase 2 (separate plan):**
- NIP101eEventBuilder + WorkoutPublisher
- KeyManager + NostrService (copy from Gambit)
- Social feed
- Collections (NIP-51)
- NWC/zaps
- Onboarding
