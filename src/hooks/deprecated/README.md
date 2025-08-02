# Deprecated Hooks

This directory contains hooks that have been deprecated and replaced with simpler, more reliable implementations.

## Deprecated Files

### `useLibraryOnboarding.ts` (Deprecated 2025-08-01)
**Replaced by:** `../useSimpleLibraryOnboarding.ts`

**Reason for Deprecation:**
- Complex state synchronization causing race conditions
- Modal state bugs (`needsOnboarding: false` but `showOnboarding: true`)
- Data loss risk for users with existing collections
- Over-engineered solution violating "simple solutions first" principle

**Issues Fixed in Replacement:**
- ✅ Simple localStorage-based completion tracking
- ✅ Direct modal state management (no complex sync)
- ✅ Proper library empty check before showing modal
- ✅ Clean success state with actual result data
- ✅ No race conditions or stuck modal states

**Migration:**
Replace imports:
```typescript
// OLD (deprecated)
import { useLibraryOnboarding } from '@/hooks/useLibraryOnboarding';

// NEW (recommended)
import { useSimpleLibraryOnboarding } from '@/hooks/useSimpleLibraryOnboarding';
```

The new hook has the same interface but with additional `result` property for success state.

## Do Not Use These Files

These files are kept for reference only and should not be used in new code. They will be removed in a future cleanup.
