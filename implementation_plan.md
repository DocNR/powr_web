# Implementation Plan

[Overview]
Migrate POWR from a Next.js PWA to a fully native, local-first SwiftUI iOS app with immutable local facts and Nostr projections for sharing templates and workout records.

This implementation will replace the current browser-first runtime model (NDK + IndexedDB + React/XState state machines) with a native iOS architecture that mirrors raid.golf’s proven pattern: authoritative local storage in SQLite (via GRDB), deterministic domain logic in pure Swift services, and Nostr as a projection/sync/share layer rather than the primary source of truth for live workout execution.

The migration is needed because workout tracking is latency-sensitive, interruption-prone, and often offline in gym environments. The current PWA succeeds as a protocol prototype, but the product requirement is now native iOS reliability, durable local session state, and deterministic replayable event generation. The migrated system will preserve NIP-101e compatibility for external sharing while introducing explicit local kernel boundaries (authoritative vs derived/projection), append-only semantics for workout facts, and deterministic publishing pipelines modeled after raid.golf iOS.

The high-level approach is a staged strangler migration: define native kernel contracts first, implement local repositories + domain services, port workout lifecycle logic from web XState machines into Swift state orchestration, then add Nostr projection builders and publishing/read clients. Existing web implementation remains a reference implementation and regression oracle during parity testing, but new feature velocity shifts to iOS once native core parity is achieved.

Canonical identity requirement: template import and storage MUST use RFC 8785 JSON Canonicalization Scheme (JCS) before hashing, with `template_hash = SHA-256(UTF8(JCS(template_json)))`. This mirrors raid.golf’s proof model and ensures cross-client reproducibility.

[Types]
Introduce a native Swift domain model where local authoritative facts are explicit and projection payloads are separate, disposable representations.

Authoritative fact types (Swift structs, persisted in SQLite):
- `WorkoutSessionFact`
  - `sessionId: Int64` (PK, auto-increment)
  - `sessionUUID: String` (globally unique, UUID v4)
  - `userPubkey: String?` (nullable for anonymous/local mode)
  - `title: String`
  - `workoutType: WorkoutType`
  - `startedAt: Date`
  - `endedAt: Date?`
  - `status: WorkoutSessionStatus` (`active`, `completed`, `abandoned`)
  - Validation: `title` non-empty, `endedAt >= startedAt` when present.

- `WorkoutExerciseFact`
  - `exerciseFactId: Int64` (PK)
  - `sessionId: Int64` (FK → `workout_sessions`)
  - `exerciseRef: String` (`33401:pubkey:d-tag`)
  - `exerciseNameSnapshot: String` (local snapshot for deterministic history display)
  - `positionIndex: Int`
  - Validation: `positionIndex >= 0`, valid NIP-101e exercise reference format.

- `WorkoutSetFact`
  - `setFactId: Int64` (PK)
  - `sessionId: Int64` (FK)
  - `exerciseFactId: Int64` (FK)
  - `exerciseIndex: Int`
  - `setNumber: Int`
  - `reps: Int`
  - `weightKg: Double`
  - `rpe: Double?`
  - `setType: SetType` (`warmup`, `normal`, `drop`, `failure`)
  - `recordedAt: Date`
  - Validation: `setNumber >= 1`, `reps >= 0`, `weightKg >= 0`, `rpe in 0...10` when present.

- `WorkoutTemplateFact` (locally saved templates, immutable per hash)
  - `templateHash: String` (SHA-256 over canonical representation)
  - `templateDTag: String`
  - `authorPubkey: String`
  - `canonicalJSON: String`
  - `createdAt: Date`
  - Validation: hash length 64 hex chars, `d` present.

- `TemplateProvenance`
  - `kind: Int` (33401/33402)
  - `authorPubkey: String`
  - `dTag: String`
  - `eventId: String?`
  - `relayURL: String?`
  - `importedAt: Date`
  - Purpose: preserve Nostr origin while local `template_hash` remains canonical identity.

Projection/publish types (not authoritative):
- `NIP101eExerciseTemplateProjection` (kind 33401)
- `NIP101eWorkoutTemplateProjection` (kind 33402)
- `NIP101eWorkoutRecordProjection` (kind 1301)
- `PublishEnvelope`
  - `eventBuilderKind: Int`
  - `serializedEventJSON: String`
  - `eventId: String?`
  - `publishedAt: Date?`
  - `relayResults: [RelayPublishResult]`

Enums and supporting types:
- `WorkoutType: String` (`strength`, `superset`, `circuit`, `emom`, `amrap`, `metcon`)
- `SetType: String` (`warmup`, `normal`, `drop`, `failure`, `working` compatibility bridge)
- `WorkoutSessionStatus: String` (`active`, `completed`, `abandoned`)
- `SyncState: String` (`pending`, `published`, `failed`)

Migration compatibility bridge types:
- `WebWorkoutTemplateAdapter` to parse existing NIP-101e payload assumptions from TS services.
- `WebWorkoutRecordAdapter` to validate parity against current `workoutEventGeneration.ts` behavior.

[Files]
Create a new native iOS app surface inside `powr_web` and add migration documents + parity fixtures.

New files to create:
- `../powr_web/ios/README.md` — native app setup and architecture entrypoint.
- `../powr_web/ios/POWR/POWRApp.swift` — app entry and bootstrap.
- `../powr_web/ios/POWR/Kernel/Schema.swift` — GRDB migrations + immutability triggers.
- `../powr_web/ios/POWR/Kernel/Repository.swift` — fact repositories (sessions/exercises/sets/templates).
- `../powr_web/ios/POWR/Kernel/Canonical.swift` — deterministic canonicalization for content-addressed template storage.
- `../powr_web/ios/POWR/Kernel/Hashing.swift` — SHA-256 helpers.
- `../powr_web/ios/POWR/Domain/WorkoutModels.swift` — domain entities/enums.
- `../powr_web/ios/POWR/Domain/WorkoutLifecycleStore.swift` — workout execution state coordinator.
- `../powr_web/ios/POWR/Domain/WorkoutRecordProjectionBuilder.swift` — kind 1301 projection generation.
- `../powr_web/ios/POWR/Domain/WorkoutTemplateProjectionBuilder.swift` — kind 33402 projection generation.
- `../powr_web/ios/POWR/Domain/ExerciseTemplateProjectionBuilder.swift` — kind 33401 projection generation.
- `../powr_web/ios/POWR/Nostr/KeyManager.swift` — keychain identity manager.
- `../powr_web/ios/POWR/Nostr/NostrClient.swift` — publish + read operations.
- `../powr_web/ios/POWR/Nostr/NIP101eEvent.swift` — event content/tag structures.
- `../powr_web/ios/POWR/Views/Workouts/WorkoutListView.swift`
- `../powr_web/ios/POWR/Views/Workouts/WorkoutDetailView.swift`
- `../powr_web/ios/POWR/Views/Workouts/ActiveWorkoutView.swift`
- `../powr_web/ios/POWR/Views/History/WorkoutHistoryView.swift`
- `../powr_web/ios/POWR/Views/Social/PublicWorkoutView.swift`
- `../powr_web/ios/POWRTests/KernelTests.swift`
- `../powr_web/ios/POWRTests/WorkoutLifecycleTests.swift`
- `../powr_web/ios/POWRTests/NIP101eProjectionTests.swift`
- `../powr_web/ios/POWRTests/NostrClientTests.swift`
- `../powr_web/docs/private/ios-native-migration-plan.md` — architecture and milestone tracker.
- `../powr_web/tests/vectors/nip101e/` fixtures for projection parity.

Existing files to modify:
- `../powr_web/README.md` — reposition web app as legacy/reference and document native-first direction.
- `../powr_web/CHANGELOG.md` — add migration milestone entries.
- `../powr_web/docs/nip-101e-specification.md` — clarify local-first authoritative vs projection model and dedup guarantees.
- `../powr_web/package.json` — optional scripts for parity fixture generation/export only (if kept).

Files to deprecate (not delete immediately):
- `../powr_web/src/lib/machines/workout/*` — mark as legacy runtime logic once iOS parity achieved.
- `../powr_web/src/lib/services/workout*` — retain for reference and fixtures until cutoff milestone.

Configuration updates:
- Add Swift Package Manager dependencies in the new Xcode project.
- Add iOS test bundle resources for NIP-101e vectors.

[Functions]
Implement native repository + projection + orchestration functions that mirror current behavior but enforce local-first semantics.

New functions:
- `Schema.migrator() -> DatabaseMigrator` (`ios/POWR/Kernel/Schema.swift`) — register authoritative tables/triggers.
- `DatabaseQueue.createPOWRDatabase(at:) -> DatabaseQueue` (`ios/POWR/Kernel/Repository.swift`) — DB bootstrap with FK enforcement.
- `WorkoutSessionRepository.startSession(...) throws -> WorkoutSessionFact` (`ios/POWR/Kernel/Repository.swift`).
- `WorkoutSessionRepository.completeSession(sessionId:endedAt:) throws`.
- `WorkoutSetRepository.insertSet(_:) throws`.
- `WorkoutSetRepository.fetchSets(forSession:) throws -> [WorkoutSetFact]`.
- `WorkoutLifecycleStore.send(_ event: WorkoutLifecycleEvent)` (`ios/POWR/Domain/WorkoutLifecycleStore.swift`).
- `WorkoutRecordProjectionBuilder.build(from session: WorkoutSessionFact, exercises:[WorkoutExerciseFact], sets:[WorkoutSetFact]) throws -> NIP101eWorkoutRecordProjection`.
- `WorkoutTemplateProjectionBuilder.build(...) throws -> NIP101eWorkoutTemplateProjection`.
- `TemplateCanonicalizer.canonicalizeRFC8785(_ jsonData: Data) throws -> Data`.
- `TemplateHasher.computeTemplateHash(canonicalData: Data) -> String`.
- `TemplateImportService.importFromNostrEvent(_ event: NostrEvent) throws -> TemplateImportResult` (parse → RFC8785 canonicalize → hash → validate → insert-or-ignore).
- `NostrClient.publish(eventBuilder:) async throws -> String` (`ios/POWR/Nostr/NostrClient.swift`).
- `NostrClient.fetchWorkoutTemplates(pubkeys:[String]) async throws -> [NIP101eWorkoutTemplateProjection]`.

Modified functions (web side, transitional):
- `workoutEventGenerationService.generateWorkoutRecord(...)` (`src/lib/services/workoutEventGeneration.ts`) — used as parity oracle only; document frozen behavior.
- `dependencyResolutionService.resolveSingleTemplate(...)` (`src/lib/services/dependencyResolution.ts`) — align outputs with iOS fixture generation where needed.

Removed functions (post-cutover milestone):
- Web-only active session mutation entrypoints in `activeWorkoutMachine.ts` and related actors once native app is production source.
- Migration strategy: keep web event generation as fixture generator until full iOS parity sign-off, then archive under `legacy/`.

[Classes]
Add native classes/services modeled after raid.golf architecture and explicitly separate authoritative storage from projection publishing.

New classes:
- `WorkoutSessionRepository` (`ios/POWR/Kernel/Repository.swift`) — immutable append-only inserts for session lifecycle.
- `WorkoutTemplateRepository` (`ios/POWR/Kernel/Repository.swift`) — content-addressed template storage.
- `WorkoutLifecycleStore` (`ios/POWR/Domain/WorkoutLifecycleStore.swift`) — state transitions for setup/active/completed flows.
- `NIP101eEventBuilder` (`ios/POWR/Nostr/NIP101eEvent.swift`) — deterministic tag assembly.
- `KeyManager` (`ios/POWR/Nostr/KeyManager.swift`) — key generation/load from Keychain.
- `NostrClient` (`ios/POWR/Nostr/NostrClient.swift`) — relay operations.

Modified classes:
- None in raid.golf iOS codebase; this plan does not change existing raid.golf implementation, only references its architecture patterns.

Removed classes:
- No immediate removals; web React/XState classes/modules enter “reference-only” status first.

[Dependencies]
Adopt a minimal native dependency set centered on deterministic storage and Nostr interoperability.

New dependencies (Swift Package Manager):
- `GRDB.swift` (SQLite migrations/repositories).
- `NostrSDK` / `rust-nostr-swift` (event signing/publishing/relay reads).

Optional dependency (if CSV import migration is included in scope later):
- `SwiftCSV` or equivalent parser for structured import pipelines.

Versioning requirements:
- Pin major versions and align with raid.golf iOS package versions where possible for reduced divergence.

[Testing]
Establish parity-first native tests with deterministic fixtures and explicit invariants for immutability, event correctness, and offline behavior.

Test file requirements:
- `KernelTests.swift`: immutability triggers, FK constraints, append-only semantics.
- `WorkoutLifecycleTests.swift`: active workout transitions, duplicate set prevention, add/substitute/remove behavior.
- `NIP101eProjectionTests.swift`: exact tag layout and serialization parity for 33401/33402/1301.
- `NostrClientTests.swift`: publish/read behavior, relay failure handling.

Existing test modifications:
- Add fixture generation scripts in web for expected projection outputs consumed by iOS tests.
- Freeze critical TS service behavior with snapshot tests to prevent parity drift during migration.

Validation strategies:
- Golden vector tests for template/workout record projections.
- Cross-implementation parity checks (web-generated fixture vs iOS-generated output).
- Offline-first integration tests: complete workout with no network, publish when connectivity restored.
- RFC 8785 conformance vectors for canonicalization (including numeric normalization edge cases).
- Hash reproducibility tests proving identical template JSON from relay imports yields identical `template_hash` across runs/devices.

[Lessons Learned Intake from RAID]
POWR implementation is gated by validated learnings from ongoing RAID Nostr projection tooling work, especially around canonicalization correctness and relay behavior.

Readiness gates before POWR implementation starts:
1. RFC 8785 canonicalization behavior in RAID is validated against agreed vector suite (including numeric/string edge cases).
2. Hash parity is reproducible across toolchains/devices for canonicalized payloads.
3. Nostr publish pipeline has defined reliability policy (relay fanout, timeout, retry, idempotent re-publish semantics).
4. Projection boundary is stable: authoritative local facts remain separate from relay-facing derived/projection data.
5. Golden vector workflow is in place to allow POWR to reuse the same parity harness patterns.

POWR adoption rule:
- POWR will inherit RAID patterns for canonicalization, hashing, projection build/publish flow, and conformance testing, minimizing divergence and rework.
- Any unresolved RAID issue in RFC 8785 compliance or publish determinism is treated as a blocker for equivalent POWR components.

[RAID → POWR Component Mapping]
Reuse concrete RAID iOS components as direct implementation references to reduce architecture drift and speed onboarding.

| RAID reference component | POWR target component | Reuse / adaptation guidance |
|---|---|---|
| `ios/RAID/RAID/Kernel/Canonical.swift` | `../powr_web/ios/POWR/Kernel/Canonical.swift` | Port canonicalization scaffolding; enforce RFC 8785 behavior for NIP-101e template/workout payloads. |
| `ios/RAID/RAID/Kernel/Hashing.swift` | `../powr_web/ios/POWR/Kernel/Hashing.swift` | Reuse SHA-256 utilities and test style; ensure hash input is canonical UTF-8 bytes only. |
| `ios/RAID/RAID/Kernel/Schema.swift` | `../powr_web/ios/POWR/Kernel/Schema.swift` | Mirror migration organization + immutability triggers; adapt tables to workout sessions/exercises/sets/templates. |
| `ios/RAID/RAID/Kernel/Repository.swift` | `../powr_web/ios/POWR/Kernel/Repository.swift` | Reuse repository patterns and transaction boundaries; enforce append-only authoritative rows. |
| `ios/RAID/RAID/Nostr/KeyManager.swift` | `../powr_web/ios/POWR/Nostr/KeyManager.swift` | Reuse Keychain lifecycle and export safeguards for Nostr keys. |
| `ios/RAID/RAID/Nostr/NostrClient.swift` | `../powr_web/ios/POWR/Nostr/NostrClient.swift` | Reuse relay connect/publish/read skeleton, timeout handling, and error surfacing patterns. |
| `ios/RAID/RAID/Nostr/NIP101gEvent.swift` | `../powr_web/ios/POWR/Nostr/NIP101eEvent.swift` | Use structure approach for strongly typed event content/tags; adapt to 33401/33402/1301 semantics. |
| `ios/RAID/RAIDTests/KernelTests.swift` | `../powr_web/ios/POWRTests/KernelTests.swift` | Mirror invariant coverage: FK integrity, immutability rejections, deterministic selection/read behavior. |
| `ios/RAID/RAIDTests/NIP101gEventBuilderTests.swift` | `../powr_web/ios/POWRTests/NIP101eProjectionTests.swift` | Reuse event builder test style with golden vectors for strict serialization/tag parity. |
| `ios/RAID/RAIDTests/NostrClientTests.swift` | `../powr_web/ios/POWRTests/NostrClientTests.swift` | Reuse relay failure simulation and publish/read resilience tests. |

Mapping usage rule:
- POWR implementation should start each core component by cloning the RAID structural pattern, then apply domain-specific adaptation.
- Deviations from mapped RAID patterns must be explicitly documented in `docs/private/ios-native-migration-plan.md` with rationale.

[Template Distribution and Local Import Flow]
Templates are distributed over Nostr but become authoritative only after deterministic local import into SQLite.

Import pipeline (all channels: feed sync, direct `naddr`, relay search):
1. Fetch event (33401 or 33402) and validate NIP-101e required tags.
2. Transform event into internal template payload.
3. Canonicalize payload with RFC 8785 JCS.
4. Compute `template_hash = SHA-256(UTF8(JCS(payload)))`.
5. Insert into local template table with UNIQUE(`template_hash`) and append provenance row (`kind`,`pubkey`,`d_tag`,`event_id`,`relay`).
6. If hash already exists, skip duplicate insert and optionally merge provenance metadata.

Selection/execution rule:
- Active workout execution always reads from local template row by `template_hash`.
- Published workout records reference both `template_hash` (proof) and Nostr address tags (interoperability/provenance).

Version/update rule:
- Same (`pubkey`,`d_tag`) with different content produces new canonical bytes and therefore new `template_hash`.
- Historical workout records remain bound to the exact hash used at execution time.

[Implementation Order]
Execute the migration in kernel-first phases that lock invariants before UI and network complexity.

1. Complete RAID lessons-learned readiness gates (RFC 8785 parity, publish reliability policy, projection boundary validation).
2. Create iOS project skeleton (`ios/POWR`) and add Swift package dependencies.
3. Implement kernel schema + repositories (sessions/exercises/sets/templates) with immutability triggers.
4. Add canonicalization + hashing utilities and content-addressed template insert path.
5. Implement workout lifecycle state store and local execution flows (no network dependency).
6. Implement NIP-101e projection builders for exercise templates, workout templates, and workout records.
7. Build Nostr key management and publish/read client wrappers.
8. Add unit + integration tests for kernel invariants and projection parity.
9. Create first functional SwiftUI screens (workout list/detail/active/history) backed by repositories.
10. Integrate sharing flows (publish projections to relays) and public workout display.
11. Run migration hardening: parity sign-off, update docs/changelog, deprecate web runtime paths to reference-only.