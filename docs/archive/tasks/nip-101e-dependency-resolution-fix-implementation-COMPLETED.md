# NIP-101e Dependency Resolution Service Fix - MVP Implementation

## Problem Analysis

### Current Issues Identified

1. **Exercise Reference Parsing**: The current service doesn't properly handle the NIP-101e exercise reference format from workout templates
2. **Missing Format/Format_Units Support**: The service doesn't resolve exercise template `format` and `format_units` tags to understand parameter meanings
3. **Incomplete Exercise Data Extraction**: Missing support for `equipment`, `hashtags`, and other NIP-101e required fields
4. **No Validation**: Service assumes all events are well-formed without checking NIP-101e compliance

### Current Service Capabilities (To Preserve)

✅ **Keep These Features**:
- Batched optimization patterns (CACHE_FIRST strategy)
- Performance optimizations (<100ms proven patterns)
- NDK IndexedDB cache integration
- Error handling and logging
- Single template resolution for XState machines
- Collection dependency resolution

❌ **Issues to Fix**:
- Exercise reference parsing from workout template tags
- Missing exercise template field extraction
- No format/format_units interpretation
- Missing NIP-101e compliance validation

## MVP Approach: Simple Validation with Clear Errors

**Philosophy**: Either an event is valid NIP-101e and works perfectly, or it fails with a clear error message explaining why it's incompatible with POWR.

**No Complex Fallbacks**: Keep the service simple and fast. Invalid events are rejected with helpful error messages.

## Implementation Plan

### Phase 1: Add Simple NIP-101e Validation (2 hours)

Update the `resolveExerciseReferences` method with strict validation:

```typescript
// Simple validation function
function validateExerciseTemplate(event: NDKEvent): ValidationResult {
  const eventRef = `${event.kind}:${event.pubkey}:${getEventDTag(event)}`;
  
  // Check required fields
  const required = ['d', 'title', 'format', 'format_units', 'equipment'];
  for (const field of required) {
    if (!hasTag(event, field)) {
      return {
        isValid: false,
        reason: `Missing required ${field} tag. POWR needs this to display exercises correctly.`,
        eventRef
      };
    }
  }
  
  // Validate format/format_units match
  const format = getTagValues(event, 'format');
  const format_units = getTagValues(event, 'format_units');
  
  if (format.length !== format_units.length) {
    return {
      isValid: false,
      reason: `Format units (${format_units.length}) don't match format parameters (${format.length}). Each parameter needs a unit.`,
      eventRef
    };
  }
  
  return { isValid: true };
}

// Updated parsing with validation
const exercises: Exercise[] = [];
const errors: string[] = [];

for (const event of exerciseEvents) {
  const validation = validateExerciseTemplate(event);
  
  if (validation.isValid) {
    exercises.push(parseValidExerciseTemplate(event));
  } else {
    errors.push(`❌ ${validation.eventRef}: ${validation.reason}`);
    console.error('[DependencyResolution] Exercise validation failed:', validation);
  }
}
```

### Phase 2: Enhanced Exercise Template Parsing (1 hour)

Extract all NIP-101e fields from validated events:

```typescript
function parseValidExerciseTemplate(event: NDKEvent): Exercise {
  const tagMap = new Map(event.tags.map(tag => [tag[0], tag]));
  
  return {
    // Basic fields (existing)
    id: tagMap.get('d')![1],
    name: tagMap.get('title')![1],
    description: event.content || '',
    
    // NEW: NIP-101e required fields
    format: tagMap.get('format')!.slice(1),
    format_units: tagMap.get('format_units')!.slice(1),
    equipment: tagMap.get('equipment')![1],
    
    // NEW: Optional fields
    difficulty: tagMap.get('difficulty')?.[1],
    hashtags: event.tags.filter(t => t[0] === 't').map(t => t[1]),
    
    // NEW: Derived fields
    muscleGroups: event.tags
      .filter(t => t[0] === 't')
      .map(t => t[1])
      .filter(tag => ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio'].includes(tag)),
    
    // Metadata
    authorPubkey: event.pubkey,
    createdAt: event.created_at || Math.floor(Date.now() / 1000),
    eventId: event.id
  };
}
```

### Phase 3: Workout Template Validation (1 hour)

Add similar validation for workout templates:

```typescript
function validateWorkoutTemplate(event: NDKEvent): ValidationResult {
  const eventRef = `${event.kind}:${event.pubkey}:${getEventDTag(event)}`;
  
  // Check kind
  if (event.kind !== 33402) {
    return {
      isValid: false,
      reason: `Invalid event kind ${event.kind}. POWR requires workout templates to use kind 33402.`,
      eventRef
    };
  }
  
  // Check required fields
  if (!hasTag(event, 'd') || !hasTag(event, 'title')) {
    return {
      isValid: false,
      reason: 'Missing required workout identifier or title.',
      eventRef
    };
  }
  
  // Check for exercises
  const exerciseTags = event.tags.filter(tag => tag[0] === 'exercise');
  if (exerciseTags.length === 0) {
    return {
      isValid: false,
      reason: 'No exercises found. POWR workout templates must include at least one exercise.',
      eventRef
    };
  }
  
  // Validate exercise reference format
  for (const exerciseTag of exerciseTags) {
    const exerciseRef = exerciseTag[1];
    if (!exerciseRef || !exerciseRef.startsWith('33401:')) {
      return {
        isValid: false,
        reason: `Invalid exercise reference: ${exerciseRef}. POWR expects format "33401:pubkey:exercise-id".`,
        eventRef
      };
    }
  }
  
  return { isValid: true };
}
```

### Phase 4: Simple Parameter Interpretation (1 hour)

Basic parameter interpretation without complex fallbacks:

```typescript
function interpretExerciseParameters(
  templateExercise: TemplateExercise, 
  exerciseTemplate: Exercise
): InterpretedExercise {
  const { format, format_units } = exerciseTemplate;
  const { parameters } = templateExercise;
  
  const interpretedParams: Record<string, any> = {};
  const paramValues = Object.values(parameters);
  
  // Simple mapping - no fallbacks
  format.forEach((paramName, index) => {
    const paramValue = paramValues[index] || '';
    const paramUnit = format_units[index];
    
    interpretedParams[paramName] = {
      value: paramValue,
      unit: paramUnit,
      raw: paramValue
    };
  });
  
  return {
    exerciseRef: templateExercise.exerciseRef,
    exerciseTemplate,
    parameters: interpretedParams,
    // Standard interpretations
    weight: interpretedParams.weight?.value || '0',
    reps: interpretedParams.reps?.value || '',
    rpe: interpretedParams.rpe?.value || '',
    setType: interpretedParams.set_type?.value || 'normal'
  };
}
```

### Phase 5: Error Reporting and UI (30 minutes)

Simple error logging and user notification:

```typescript
// In service methods
if (errors.length > 0) {
  console.error('[DependencyResolution] Some content failed validation:', errors);
  // Could emit errors for UI to display
}

// Simple UI component for incompatible content
function IncompatibleContentNotice({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-medium text-yellow-800">
        Some content is not compatible with POWR
      </h3>
      <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
        {errors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-yellow-600">
        These items follow an older format. Contact the content creator to update to NIP-101e.
      </p>
    </div>
  );
}
```

## Updated Type Definitions

```typescript
// Enhanced types for NIP-101e compliance
export interface Exercise {
  id: string;
  name: string;
  description: string;
  
  // NIP-101e required fields
  format: string[];           // e.g., ['weight', 'reps', 'rpe', 'set_type']
  format_units: string[];     // e.g., ['kg', 'count', '0-10', 'warmup|normal|drop|failure']
  equipment: string;          // e.g., 'barbell', 'dumbbell', 'bodyweight'
  
  // NIP-101e optional fields
  difficulty?: string;        // e.g., 'beginner', 'intermediate', 'advanced'
  hashtags: string[];         // All 't' tags
  
  // Derived fields
  muscleGroups: string[];     // Filtered hashtags for muscle groups
  
  // Metadata
  authorPubkey: string;
  createdAt: number;
  eventId?: string;
}

export interface TemplateExercise {
  exerciseRef: string;        // "33401:pubkey:d-tag"
  parameters: {              // Raw parameters from workout template
    param1: string;
    param2: string;
    param3: string;
    param4: string;
  };
}

export interface InterpretedExercise {
  exerciseRef: string;
  exerciseTemplate: Exercise;
  parameters: Record<string, {
    value: string;
    unit: string;
    raw: string;
  }>;
  
  // Common parameter interpretations
  weight: string;
  reps: string;
  rpe: string;
  setType: string;
}

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  eventRef?: string;
}
```

## Test Cases for MVP Approach

```typescript
// Test NIP-101e compliance validation
const testValidation = async (): Promise<TestResult> => {
  const startTime = performance.now();
  
  try {
    // Test with incomplete exercise (should fail)
    const incompleteExerciseRef = '33401:test-pubkey:incomplete-exercise';
    const exercises = await dependencyResolutionService.resolveExerciseReferences([incompleteExerciseRef]);
    
    // Should reject invalid events
    if (exercises.length > 0) {
      throw new Error('Service should reject incomplete exercises');
    }
    
    // Test with complete exercise (should succeed)
    const completeExerciseRef = '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:test-burpees';
    const validExercises = await dependencyResolutionService.resolveExerciseReferences([completeExerciseRef]);
    
    if (validExercises.length === 0) {
      throw new Error('Service should accept valid NIP-101e exercises');
    }
    
    // Validate required fields are present
    const exercise = validExercises[0];
    const requiredFields = ['format', 'format_units', 'equipment', 'hashtags'];
    const missingFields = requiredFields.filter(field => !exercise[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing fields after parsing: ${missingFields.join(', ')}`);
    }
    
    const endTime = performance.now();
    return {
      success: true,
      timing: endTime - startTime,
      data: { validExercises: validExercises.length, requiredFieldsPresent: true },
      testName: 'NIP-101e Validation Test'
    };
    
  } catch (error) {
    const endTime = performance.now();
    return {
      success: false,
      timing: endTime - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      testName: 'NIP-101e Validation Test'
    };
  }
};
```

## Implementation Checklist

### Phase 1: NIP-101e Validation
- [ ] Add `validateExerciseTemplate` function to service
- [ ] Add `validateWorkoutTemplate` function to service
- [ ] Update `resolveExerciseReferences` with validation
- [ ] Update `resolveTemplateDependencies` with validation
- [ ] Test validation with existing test content

### Phase 2: Enhanced Exercise Parsing
- [ ] Add `parseValidExerciseTemplate` function
- [ ] Extract format, format_units, equipment fields
- [ ] Extract hashtags and derive muscle groups
- [ ] Update Exercise interface with new fields
- [ ] Test parsing with valid exercise templates

### Phase 3: Parameter Interpretation
- [ ] Add `interpretExerciseParameters` method
- [ ] Create InterpretedExercise interface
- [ ] Update `resolveSingleTemplate` to use interpretation
- [ ] Test parameter interpretation with workout templates

### Phase 4: Error Handling
- [ ] Add error collection and logging
- [ ] Create IncompatibleContentNotice component
- [ ] Test error messages with invalid content
- [ ] Verify performance impact is minimal

### Phase 5: Testing & Validation
- [ ] Add NIP-101e compliance tests
- [ ] Test with both valid and invalid content
- [ ] Verify performance maintains <100ms target
- [ ] Update existing test components

## Success Criteria

1. **NIP-101e Compliance**: All valid exercise templates parse with format, format_units, equipment, hashtags
2. **Clear Error Messages**: Invalid events produce helpful error messages explaining incompatibility
3. **Performance Maintained**: Single template resolution remains under 100ms
4. **Simple Logic**: No complex fallback logic - either valid or invalid
5. **Developer Experience**: Clear console errors for debugging invalid content

## Migration Notes

- **Existing Data**: Invalid content will be rejected with clear error messages
- **API Compatibility**: Existing method signatures preserved
- **Performance**: Validation adds minimal overhead to proven performance patterns
- **User Experience**: Users see clear notices when content is incompatible

---

**Implementation Priority**: High - Required for proper NIP-101e compliance
**Estimated Effort**: 5-6 hours total (simplified from original 4-6 hours)
**Dependencies**: None - can be implemented independently
**Testing**: Comprehensive test suite included for MVP validation