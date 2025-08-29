# Exercise Modal Data Resolution Rule

## Brief overview
This rule establishes patterns for resolving exercise data for ExerciseDetailModal display, ensuring NIP-92 media attachments (YouTube thumbnails, video demonstrations) are preserved across all data pathways through a unified facade service.

## Core Problem Solved
**Service Layer Fragmentation**: Multiple pathways to ExerciseDetailModal used different parsing services with inconsistent NIP-92 tag preservation, causing repeated "fix one pathway, break another" cycles.

## The Unified Solution: ExerciseModalResolutionService Facade

### Architecture Pattern
```typescript
// ✅ CORRECT: Single facade service for all ExerciseDetailModal data resolution
import { exerciseModalResolutionService } from '@/lib/services/exerciseModalResolution';

// All pathways use the same service
const exerciseData = await exerciseModalResolutionService.resolveForModal(exerciseRef);
```

### ✅ REQUIRED: All ExerciseDetailModal Pathways Must Use Facade

#### Pathway 1: Exercise Library → ExerciseDetailModal
```typescript
// src/components/library/ExerciseLibrary.tsx
const handleExerciseClick = async (exercise: Exercise) => {
  const modalData = await exerciseModalResolutionService.resolveFromLibraryExercise(exercise);
  setSelectedExercise(modalData);
};
```

#### Pathway 2: GlobalWorkoutSearch → ExerciseDetailModal  
```typescript
// src/components/search/GlobalWorkoutSearch.tsx
const handleExerciseSelect = async (naddr: string) => {
  const modalData = await exerciseModalResolutionService.resolveFromNaddr(naddr);
  setSelectedExercise(modalData);
};
```

#### Pathway 3: WorkoutDetailModal → ExpandableExerciseCard → ExerciseDetailModal
```typescript
// src/components/powr-ui/workout/ExpandableExerciseCard.tsx
const handleExerciseNameClick = async (exerciseRef: string) => {
  const modalData = await exerciseModalResolutionService.resolveFromReference(exerciseRef);
  setSelectedExercise(modalData);
};
```

#### Pathway 4: ActiveWorkoutInterface → ExerciseDetailModal
```typescript
// src/components/powr-ui/workout/ActiveWorkoutInterface.tsx
const handleExerciseNameClick = async (exerciseRef: string) => {
  const modalData = await exerciseModalResolutionService.resolveFromReference(exerciseRef);
  setSelectedExercise(modalData);
};
```

## Service Implementation Requirements

### ✅ REQUIRED: Facade Pattern Following .clinerules/service-layer-architecture.md
```typescript
// src/lib/services/exerciseModalResolution.ts
export class ExerciseModalResolutionService {
  // Delegate to proven services while ensuring NIP-92 preservation
  
  async resolveFromLibraryExercise(exercise: Exercise): Promise<DirectExerciseData> {
    // Use existing Exercise data (already has tags preserved)
    return prepareExerciseForModal({ exercise });
  }
  
  async resolveFromNaddr(naddr: string): Promise<DirectExerciseData> {
    // Use NDK naddr resolution (proven working)
    const event = await ndkNaddrResolution.resolve(naddr);
    const exercise = dataParsingService.parseExerciseTemplate(event);
    return prepareExerciseForModal({ exercise });
  }
  
  async resolveFromReference(exerciseRef: string): Promise<DirectExerciseData> {
    // Use dependencyResolutionService but ensure tags preservation
    const exercises = await dependencyResolutionService.resolveExerciseReferences([exerciseRef]);
    const exercise = exercises[0];
    return prepareExerciseForModal({ exercise });
  }
}
```

### ✅ REQUIRED: NIP-92 Tag Preservation Validation
```typescript
// All facade methods must validate NIP-92 tags are preserved
private validateNIP92Preservation(exercise: Exercise): void {
  if (!exercise.tags || exercise.tags.length === 0) {
    console.warn(`[ExerciseModalResolutionService] ❌ NIP-92 tags missing for exercise: ${exercise.id}`);
    console.warn('This will cause missing YouTube thumbnails and video demonstrations');
  }
  
  const imetaTags = exercise.tags?.filter(tag => tag[0] === 'imeta') || [];
  if (imetaTags.length === 0) {
    console.warn(`[ExerciseModalResolutionService] ⚠️ No imeta tags found for exercise: ${exercise.id}`);
  } else {
    console.log(`[ExerciseModalResolutionService] ✅ Found ${imetaTags.length} imeta tags for exercise: ${exercise.id}`);
  }
}
```

## Integration Requirements

### ✅ REQUIRED: Update All Components
All components that open ExerciseDetailModal must be updated to use the facade service:

1. **ExerciseLibrary.tsx** - Update handleExerciseClick
2. **GlobalWorkoutSearch.tsx** - Update handleExerciseSelect  
3. **ExpandableExerciseCard.tsx** - Update handleExerciseNameClick
4. **ActiveWorkoutInterface.tsx** - Update handleExerciseNameClick

### ✅ REQUIRED: Backward Compatibility
The facade service must maintain compatibility with existing `prepareExerciseForModal` utility:

```typescript
// src/lib/utils/exerciseModalData.ts compatibility maintained
export interface DirectExerciseData {
  exercise: Exercise;
  eventTags?: string[][]; // Backward compatibility
  tags?: string[][];      // New standard
}

// Facade service output must match this interface
const modalData = await exerciseModalResolutionService.resolveFromReference(exerciseRef);
// modalData.exercise.tags contains NIP-92 imeta tags
// modalData.eventTags || modalData.tags provides compatibility
```

## Testing Requirements

### ✅ REQUIRED: NIP-92 Media Verification Tests
```typescript
describe('ExerciseModalResolutionService NIP-92 Preservation', () => {
  it('should preserve imeta tags from library pathway', async () => {
    const exercise = createExerciseWithImeta();
    const modalData = await exerciseModalResolutionService.resolveFromLibraryExercise(exercise);
    
    expect(modalData.exercise.tags).toBeDefined();
    expect(modalData.exercise.tags?.filter(tag => tag[0] === 'imeta')).toHaveLength(2);
  });
  
  it('should preserve imeta tags from reference pathway', async () => {
    const exerciseRef = '33401:pubkey:pushup-standard';
    const modalData = await exerciseModalResolutionService.resolveFromReference(exerciseRef);
    
    expect(modalData.exercise.tags).toBeDefined();
    expect(modalData.exercise.tags?.filter(tag => tag[0] === 'imeta')).toHaveLength(2);
  });
  
  it('should preserve imeta tags from naddr pathway', async () => {
    const naddr = 'naddr1...';
    const modalData = await exerciseModalResolutionService.resolveFromNaddr(naddr);
    
    expect(modalData.exercise.tags).toBeDefined();
    expect(modalData.exercise.tags?.filter(tag => tag[0] === 'imeta')).toHaveLength(2);
  });
});
```

### ✅ REQUIRED: All Pathway Integration Tests
```typescript
describe('ExerciseDetailModal Pathway Integration', () => {
  it('should display YouTube thumbnails from library pathway', async () => {
    // Test complete flow: ExerciseLibrary → ExerciseDetailModal → WorkoutImageHandler
  });
  
  it('should display video demonstrations from active workout pathway', async () => {
    // Test complete flow: ActiveWorkoutInterface → ExerciseDetailModal → extractVideoUrls
  });
  
  it('should display media from search pathway', async () => {
    // Test complete flow: GlobalWorkoutSearch → ExerciseDetailModal → NIP-92 media
  });
  
  it('should display media from workout detail pathway', async () => {
    // Test complete flow: WorkoutDetailModal → ExpandableExerciseCard → ExerciseDetailModal
  });
});
```

## Error Prevention Patterns

### ✅ REQUIRED: Service Layer Validation
```typescript
// Prevent future service fragmentation
export class ExerciseModalResolutionService {
  // ❌ FORBIDDEN: Direct service calls bypassing facade
  // Components should NEVER call these directly:
  // - dependencyResolutionService.resolveExerciseReferences()
  // - dataParsingService.parseExerciseTemplate()
  // - Custom parsing logic in components
  
  // ✅ REQUIRED: All resolution goes through facade methods
  async resolveFromReference(exerciseRef: string): Promise<DirectExerciseData> {
    // Centralized resolution with guaranteed NIP-92 preservation
  }
}
```

### ✅ REQUIRED: Component Import Restrictions
```typescript
// ❌ FORBIDDEN: Direct service imports in components opening ExerciseDetailModal
import { dependencyResolutionService } from '@/lib/services/dependencyResolution'; // ❌ WRONG
import { dataParsingService } from '@/lib/services/dataParsingService'; // ❌ WRONG

// ✅ REQUIRED: Only facade service import allowed
import { exerciseModalResolutionService } from '@/lib/services/exerciseModalResolution'; // ✅ CORRECT
```

## Success Metrics

### ✅ REQUIRED: NIP-92 Media Display Verification
- **100% Media Display**: All 4 pathways show YouTube thumbnails and video demonstrations
- **Zero Tag Loss**: All exercise data includes `tags: string[][]` with imeta tags
- **Consistent Behavior**: Same exercise shows same media regardless of access pathway
- **Performance Maintained**: No regression in loading times

### ✅ REQUIRED: Architecture Quality Indicators
- **Single Source of Truth**: All pathways use exerciseModalResolutionService facade
- **Service Layer Compliance**: Follows .clinerules/service-layer-architecture.md patterns
- **Backward Compatibility**: Existing prepareExerciseForModal utility still works
- **Future-Proof**: New pathways automatically get NIP-92 preservation

## When to Apply This Rule

### Always Apply For
- Any component that opens ExerciseDetailModal
- Any service that resolves exercise data for modal display
- Any new pathway to ExerciseDetailModal
- Any refactoring of exercise data resolution

### Especially Important When
- Adding new exercise display pathways
- Modifying existing exercise resolution logic
- Debugging missing NIP-92 media attachments
- Code reviews involving ExerciseDetailModal

### Red Flags That Indicate Rule Violation
- Components directly calling dependencyResolutionService or dataParsingService
- Missing NIP-92 media in ExerciseDetailModal
- Different behavior between ExerciseDetailModal access pathways
- Console logs showing `eventTagsCount: 0` or `Found videos: Array []`

## Migration Strategy

### Phase 1: Create Facade Service
1. Create ExerciseModalResolutionService following facade pattern
2. Implement all resolution methods with NIP-92 preservation
3. Add comprehensive tests for all pathways

### Phase 2: Update Components
1. Update ExerciseLibrary.tsx to use facade
2. Update GlobalWorkoutSearch.tsx to use facade
3. Update ExpandableExerciseCard.tsx to use facade
4. Update ActiveWorkoutInterface.tsx to use facade

### Phase 3: Validation
1. Test all 4 pathways show NIP-92 media correctly
2. Verify no performance regression
3. Confirm backward compatibility maintained

This rule prevents the "fix one pathway, break another" cycle by ensuring all ExerciseDetailModal data resolution goes through a single, well-tested facade service that guarantees NIP-92 media preservation.

---

**Last Updated**: 2025-08-29
**Project**: POWR Workout PWA
**Environment**: Web Browser
**Pattern**: Facade Service for Data Resolution Consistency
