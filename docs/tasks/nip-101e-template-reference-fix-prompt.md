# NIP-101e Template Reference Fix Kickoff Prompt

## Task Summary
Fix critical NIP-101e protocol compliance issue where workout records (Kind 1301) use incorrect template reference format `["template", "just-template-id"]` instead of required `["template", "33402:pubkey:d-tag", "relay-url"]` format. This breaks cross-client compatibility and template attribution in the Nostr ecosystem.

## Key Technical Approach
Update `src/lib/services/workoutAnalytics.ts` to capture template author pubkey during template selection and generate proper addressable event references in workout records. Primary fix is in `generateNIP101eEvent()` method.

## Key Files to Review
- `docs/tasks/nip-101e-template-reference-fix-task.md` - Complete implementation plan
- `.clinerules/nip-101e-standards.md` - NIP-101e implementation guidelines  
- `src/lib/services/workoutAnalytics.ts` - Event generation logic (PRIMARY FIX)
- `docs/nip-101e-specification.md` - Protocol specification requirements
- `.clinerules/nostr-event-verification.md` - NAK validation commands

## Starting Point
Begin with Phase 1: Update `CompletedWorkout` interface to include `templateReference` and `templatePubkey` fields, then fix `generateNIP101eEvent()` method to use correct `["template", "33402:pubkey:d-tag", "relay-url"]` format. Test with NAK commands to verify compliance.
