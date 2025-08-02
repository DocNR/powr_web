# Deprecated Library Components

This directory contains library components that have been deprecated and replaced with simpler, more reliable implementations.

## Deprecated Files

### `LibraryOnboarding.tsx` (Deprecated 2025-08-01)
**Replaced by:** `../SimpleLibraryOnboarding.tsx`

**Reason for Deprecation:**
- Complex state management causing modal closure issues
- Missing success state display
- Tightly coupled to deprecated `useLibraryOnboarding` hook
- Over-engineered solution violating "simple solutions first" principle

**Issues Fixed in Replacement:**
- ✅ Simple, predictable modal state management
- ✅ Success state with actual onboarding results
- ✅ Clean separation of concerns
- ✅ Proper error handling and user feedback
- ✅ Works with simple `useSimpleLibraryOnboarding` hook

**Migration:**
Replace imports:
```typescript
// OLD (deprecated)
import { LibraryOnboarding } from '@/components/library/LibraryOnboarding';

// NEW (recommended)
import { SimpleLibraryOnboarding } from '@/components/library/SimpleLibraryOnboarding';
```

The new component requires a `result` prop for displaying success state:
```typescript
<SimpleLibraryOnboarding 
  open={isModalOpen} 
  onOpenChange={setIsModalOpen}
  onComplete={runOnboarding}
  onSkip={skipOnboarding}
  isLoading={isOnboarding}
  error={onboardingError}
  result={onboardingResult} // NEW: Required for success state
/>
```

## Do Not Use These Files

These files are kept for reference only and should not be used in new code. They will be removed in a future cleanup.
