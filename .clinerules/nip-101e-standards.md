# NIP-101e Standards Rule

## Brief overview
This rule establishes comprehensive standards for NIP-101e event generation, parsing, and validation in the POWR Workout PWA, ensuring strict compliance with Nostr conventions and preventing malformed events.

## NIP-101e Event Generation Standards

### Core Principles
- **Strict Compliance**: All generated events MUST follow NIP-101e specification exactly
- **No Workarounds**: Never generate malformed events and fix them later
- **Validation First**: Validate all data before event creation
- **Forward Compatibility**: Design for extensibility without breaking changes

### Tag Formatting Requirements

#### ✅ REQUIRED Patterns
```typescript
// Exercise references - Follow NIP-01 addressable event format
["exercise", "33401:pubkey:exercise-d-tag", "relay-url", "weight", "reps", "rpe", "set_type", "set_number"]

// Template references - Follow NIP-01 addressable event format  
["template", "33402:pubkey:template-d-tag", "relay-url"] // ✅ Correct format (pubkey, not eventId)

// Workout Record (Kind 1301) Required Tags
["d", "workout-uuid"]                       // ✅ Unique workout identifier
["title", "Morning Strength"]               // ✅ Workout name
["type", "strength"]                        // ✅ strength|circuit|emom|amrap
["start", "1706454000"]                     // ✅ Unix timestamp
["end", "1706455800"]                       // ✅ Unix timestamp  
["completed", "true"]                       // ✅ true|false

// Exercise sets - Each set is a separate exercise tag with unique set numbers
["exercise", "33401:pubkey:pushups", "", "0", "10", "7", "normal", "1"]     // ✅ Bodyweight exercise set 1
["exercise", "33401:pubkey:squats", "", "60", "5", "8", "normal", "1"]      // ✅ Weighted exercise set 1
["exercise", "33401:pubkey:squats", "", "60", "5", "8", "normal", "2"]      // ✅ Second set same exercise

// Standard parameters (weight, reps, rpe, set_type, set_number)
// weight: kg (empty string for bodyweight, negative for assisted)
// reps: count
// rpe: 0-10 (Rate of Perceived Exertion)
// set_type: warmup|normal|drop|failure
// set_number: per-exercise set counter (1, 2, 3...) - prevents NDK deduplication

// Standard Nostr hashtags
["t", "fitness"]                            // ✅ Correct
["t", "strength"]                           // ✅ Correct
```

#### ❌ FORBIDDEN Patterns
```typescript
// Wrong tag names (NIP-101e uses 'exercise', not 'set')
["set", "Push ups", "1", "10", "0"]         // ❌ FORBIDDEN - Use 'exercise' tag
["name", "Push ups"]                        // ❌ FORBIDDEN - Exercise names in templates only

// Malformed exercise references
["exercise", "exercise-id-only"]            // ❌ Missing kind and pubkey
["exercise", "33401:eventId:d-tag"]         // ❌ Wrong - eventId not pubkey (violates NIP-01)
["exercise", "33401:pubkey"]                // ❌ Missing d-tag
["exercise", "33401::local:d-tag"]          // ❌ Double colon, "local" not pubkey

// Malformed template references
["template", "33402::local:d-tag"]          // ❌ Double colon, "local" not pubkey
["template", "template-id-only"]            // ❌ Missing kind and pubkey
["template", "33402:pubkey"]                // ❌ Missing d-tag

// Invalid parameter counts
["exercise", "33401:pubkey:d-tag", ""]      // ❌ Missing weight, reps, rpe, set_type
["exercise", "33401:pubkey:d-tag", "", "10"] // ❌ Missing rpe, set_type

// Invalid date formats (use Unix timestamps)
["date", "06/21/2025"]                      // ❌ Wrong format - use start/end timestamps
["date", "June 21, 2025"]                   // ❌ Wrong format - use start/end timestamps
```

### Event Generation Workflow

#### Kind 33401 (Exercise Template) Generation
```typescript
// 1. Validate all input data
function validateExerciseData(exerciseData: ExerciseInput): ValidationResult {
  // Check required fields
  if (!exerciseData.name || !exerciseData.muscleGroups) {
    return { valid: false, error: 'Missing required fields' };
  }
  
  // Validate exercise names (no underscores)
  if (exerciseData.name.includes('_') || exerciseData.name.includes('-')) {
    return { 
      valid: false, 
      error: `Invalid exercise name: ${exerciseData.name}. Use spaces only.` 
    };
  }
  
  // Validate muscle groups
  const validMuscleGroups = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio'];
  for (const muscle of exerciseData.muscleGroups) {
    if (!validMuscleGroups.includes(muscle)) {
      return { 
        valid: false, 
        error: `Invalid muscle group: ${muscle}` 
      };
    }
  }
  
  return { valid: true };
}

// 2. Generate tags in correct order
function generateExerciseTags(exerciseData: ValidatedExerciseData): string[][] {
  const tags: string[][] = [];
  
  // Required tags first
  tags.push(['d', exerciseData.id]);
  tags.push(['name', exerciseData.name]);
  
  // Muscle group tags
  exerciseData.muscleGroups.forEach(muscle => {
    tags.push(['muscle', muscle]);
  });
  
  // Equipment tag (if specified)
  if (exerciseData.equipment) {
    tags.push(['equipment', exerciseData.equipment]);
  }
  
  // Difficulty tag
  if (exerciseData.difficulty) {
    tags.push(['difficulty', exerciseData.difficulty]);
  }
  
  // Optional topic tag
  tags.push(['t', 'fitness']);
  
  return tags;
}
```

#### Kind 33402 (Workout Template) Generation
```typescript
// 1. Validate workout template data
function validateWorkoutTemplateData(templateData: WorkoutTemplateInput): ValidationResult {
  // Validate template name (no underscores)
  if (templateData.name.includes('_') || templateData.name.includes('-')) {
    return { 
      valid: false, 
      error: `Invalid template name: ${templateData.name}. Use spaces only.` 
    };
  }
  
  // Validate exercises exist
  if (!templateData.exercises || templateData.exercises.length === 0) {
    return { 
      valid: false, 
      error: 'Template must include at least one exercise' 
    };
  }
  
  // Validate exercise references
  for (const exercise of templateData.exercises) {
    if (!exercise.exerciseId || !exercise.sets || !exercise.reps) {
      return { 
        valid: false, 
        error: 'Each exercise must have exerciseId, sets, and reps' 
      };
    }
  }
  
  return { valid: true };
}

// 2. Generate workout template tags
function generateWorkoutTemplateTags(templateData: ValidatedWorkoutTemplateData): string[][] {
  const tags: string[][] = [];
  
  // Required tags
  tags.push(['d', templateData.id]);
  tags.push(['name', templateData.name]);
  
  // Exercise references (in order)
  templateData.exercises.forEach((exercise, index) => {
    tags.push([
      'exercise', 
      exercise.exerciseId, 
      exercise.sets.toString(), 
      exercise.reps.toString(),
      exercise.weight?.toString() || '0'
    ]);
  });
  
  // Duration estimate (if provided)
  if (templateData.estimatedDuration) {
    tags.push(['duration', templateData.estimatedDuration.toString()]);
  }
  
  // Difficulty level
  if (templateData.difficulty) {
    tags.push(['difficulty', templateData.difficulty]);
  }
  
  // Topic tag
  tags.push(['t', 'fitness']);
  
  return tags;
}
```

#### Kind 1301 (Workout Record) Generation
```typescript
// 1. Validate workout record data
function validateWorkoutData(workoutData: WorkoutInput, templateData?: WorkoutTemplate): ValidationResult {
  // Validate template reference format (33402:pubkey:d-tag per NIP-01)
  if (workoutData.templateId) {
    const templateRefPattern = /^33402:[a-f0-9]{64}:[a-zA-Z0-9\-]+$/;
    const templateReference = `33402:${workoutData.templatePubkey}:${workoutData.templateId}`;
    if (!templateRefPattern.test(templateReference)) {
      return { 
        valid: false, 
        error: 'Invalid template reference format' 
      };
    }
  }
  
  // Validate date format (ISO-8601)
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(workoutData.date)) {
    return { 
      valid: false, 
      error: 'Date must be in YYYY-MM-DD format' 
    };
  }
  
  // Validate exercises have sets
  if (!workoutData.exercises || workoutData.exercises.length === 0) {
    return { 
      valid: false, 
      error: 'Workout must include at least one exercise' 
    };
  }
  
  // Validate exercise names (no underscores)
  for (const exercise of workoutData.exercises) {
    if (exercise.name.includes('_')) {
      return { 
        valid: false, 
        error: `Exercise name contains underscore: ${exercise.name}` 
      };
    }
  }
  
  return { valid: true };
}

// 2. Generate workout record tags
function generateWorkoutTags(workoutData: ValidatedWorkoutData): string[][] {
  const tags: string[][] = [];
  
  // Required tags
  tags.push(['d', workoutData.id]);
  tags.push(['date', workoutData.date]);
  
  // Template reference (if used)
  if (workoutData.templateId && workoutData.templatePubkey) {
    tags.push(['template', `33402:${workoutData.templatePubkey}:${workoutData.templateId}`]);
  }
  
  // Individual exercise set tags (in workout order)
  workoutData.exercises.forEach(exercise => {
    exercise.sets.forEach((set, setIndex) => {
      tags.push([
        'exercise', 
        `33401:${exercise.authorPubkey}:${exercise.dTag}`,
        '', // relay-url
        set.weight.toString(), 
        set.reps.toString(),
        set.rpe?.toString() || '7',
        set.setType || 'normal'
      ]);
    });
  });
  
  // Total duration
  if (workoutData.duration) {
    tags.push(['duration', workoutData.duration.toString()]);
  }
  
  // Standard Nostr user tags
  workoutData.participants?.forEach(pubkey => {
    tags.push(['p', pubkey]);
  });
  
  return tags;
}
```

### Parsing Standards

#### Strict Parsing Requirements
```typescript
// ❌ FORBIDDEN: Cleanup/workaround logic
function parseExerciseName_WRONG(tagValue: string): string {
  // DON'T DO THIS - fixes malformed data instead of rejecting it
  return tagValue.replace('_', ' ');
}

// ✅ REQUIRED: Strict validation
function parseExerciseName_CORRECT(tagValue: string): string {
  // Reject malformed data
  if (tagValue.includes('_') || tagValue.includes('-')) {
    throw new Error(`Invalid exercise name format: ${tagValue}. Must use spaces only.`);
  }
  return tagValue;
}

// ✅ REQUIRED: Comprehensive event validation
function validateNIP101eEvent(event: NDKEvent): ValidationResult {
  const tags = event.tags;
  
  // Check event kind
  if (![33401, 33402, 1301].includes(event.kind)) {
    return { valid: false, error: 'Invalid event kind for NIP-101e' };
  }
  
  // Validate required tags based on kind
  if (event.kind === 33401) {
    return validateExerciseEvent(tags);
  } else if (event.kind === 33402) {
    return validateWorkoutTemplateEvent(tags);
  } else if (event.kind === 1301) {
    return validateWorkoutRecordEvent(tags);
  }
  
  return { valid: false, error: 'Unknown event kind' };
}
```

#### Error Handling Standards
```typescript
// ✅ REQUIRED: Clear error messages for debugging
class NIP101eValidationError extends Error {
  constructor(
    message: string,
    public eventKind: number,
    public tagName?: string,
    public tagValue?: string
  ) {
    super(`NIP-101e Validation Error: ${message}`);
    this.name = 'NIP101eValidationError';
  }
}

// ✅ REQUIRED: Log rejected events for debugging
function parseNIP101eEvent(event: NDKEvent): ParsedEvent | null {
  try {
    const validation = validateNIP101eEvent(event);
    if (!validation.valid) {
      console.warn(`[NIP-101e] Rejected malformed event ${event.id}: ${validation.error}`);
      return null;
    }
    
    return parseValidEvent(event);
  } catch (error) {
    console.error(`[NIP-101e] Parsing error for event ${event.id}:`, error);
    return null;
  }
}
```

### NDK Cache Integration Standards

#### Field Mapping Requirements
```typescript
// ✅ REQUIRED: Store original Nostr data for debugging
interface ExerciseRecord {
  // Parsed fields
  id: string;
  name: string;
  muscleGroups: string[];
  
  // Original Nostr data (for debugging and future parsing)
  nostrTagsData: string; // JSON.stringify(event.tags)
  eventId: string;
  
  // Validation metadata
  parsedAt: number;
  parsingVersion: string; // Track parsing logic version
}

// ✅ REQUIRED: Validation before NDK cache storage
async function storeExerciseFromNostr(event: NDKEvent): Promise<Exercise | null> {
  // 1. Validate event
  const validation = validateNIP101eEvent(event);
  if (!validation.valid) {
    console.warn(`[ExerciseCache] Rejected invalid exercise event: ${validation.error}`);
    return null;
  }
  
  // 2. Parse with strict validation
  const exerciseData = parseValidExerciseEvent(event);
  
  // 3. Store with metadata (NDK cache handles this automatically)
  return {
    ...exerciseData,
    nostrTagsData: JSON.stringify(event.tags),
    eventId: event.id,
    parsedAt: Date.now(),
    parsingVersion: '1.0.0'
  };
}
```

### Testing Standards

#### Required Test Cases
```typescript
describe('NIP-101e Event Generation', () => {
  it('should reject exercise names with underscores', () => {
    const exerciseData = {
      name: 'Push_ups',
      muscleGroups: ['chest']
    };
    
    expect(() => generateExerciseEvent(exerciseData))
      .toThrow('Invalid exercise name: Push_ups. Use spaces only.');
  });
  
  it('should generate valid template reference format', () => {
    const workoutData = {
      templateId: 'test-template',
      templatePubkey: 'abc123...',
      // ... other data
    };
    
    const event = generateWorkoutEvent(workoutData);
    const templateTag = event.tags.find(t => t[0] === 'template');
    
    expect(templateTag[1]).toMatch(/^33402:[a-f0-9]{64}:[a-zA-Z0-9\-]+$/);
  });
  
  it('should include all required exercise data', () => {
    const workoutData = {
      exercises: [{
        authorPubkey: 'test-pubkey',
        dTag: 'pushups',
        sets: [
          { reps: 10, weight: 0, rpe: 7, setType: 'normal' },
          { reps: 8, weight: 0, rpe: 8, setType: 'normal' }
        ]
      }]
    };
    
    const event = generateWorkoutEvent(workoutData);
    const exerciseTags = event.tags.filter(t => t[0] === 'exercise');
    
    expect(exerciseTags).toHaveLength(2);
    expect(exerciseTags[0]).toEqual(['exercise', '33401:test-pubkey:pushups', '', '0', '10', '7', 'normal']);
    expect(exerciseTags[1]).toEqual(['exercise', '33401:test-pubkey:pushups', '', '0', '8', '8', 'normal']);
  });
});

describe('NIP-101e Event Parsing', () => {
  it('should reject malformed exercise names', () => {
    const malformedEvent = {
      kind: 33401,
      tags: [
        ['d', 'test-exercise'],
        ['name', 'Push_ups'], // Malformed
        ['muscle', 'chest']
      ]
    };
    
    expect(parseNIP101eEvent(malformedEvent)).toBeNull();
  });
  
  it('should parse valid events correctly', () => {
    const validEvent = {
      kind: 33401,
      tags: [
        ['d', 'test-exercise'],
        ['name', 'Push ups'], // Correct format
        ['muscle', 'chest']
      ]
    };
    
    const parsed = parseNIP101eEvent(validEvent);
    expect(parsed).toBeTruthy();
    expect(parsed.name).toBe('Push ups');
    expect(parsed.muscleGroups).toContain('chest');
  });
});
```

### Code Review Checklist

#### Before Committing NIP-101e Code
- [ ] All exercise names use spaces (no underscores, hyphens, or special characters)
- [ ] Template references follow `33402:pubkey:d-tag` format exactly
- [ ] Dates are in ISO-8601 format (YYYY-MM-DD)
- [ ] All exercise sets include name, set number, reps, and weight
- [ ] Validation rejects malformed events (no cleanup logic)
- [ ] Error messages are clear and helpful for debugging
- [ ] Original Nostr data is preserved for future parsing
- [ ] Test cases cover both valid and invalid inputs

#### Red Flags in Code Review
- ❌ Any `.replace()` or cleanup logic in parsing functions
- ❌ Hardcoded event data or test keys
- ❌ Missing validation for required fields
- ❌ Inconsistent tag ordering
- ❌ Missing error handling for malformed events

### Migration and Compatibility

#### Handling Legacy Events
```typescript
// ✅ REQUIRED: Version-aware parsing
function parseExerciseTags(tags: string[][], parsingVersion: string = '1.0.0'): ExerciseData {
  if (parsingVersion === '0.9.0') {
    // Legacy parsing with cleanup (for existing data only)
    return parseLegacyExerciseEvent(tags);
  }
  
  // Current strict parsing
  return parseStrictExerciseEvent(tags);
}

// ✅ REQUIRED: Migration utilities
async function migrateLegacyExercises(): Promise<void> {
  // NDK cache handles this automatically when events are re-parsed
  console.log('Legacy exercise migration handled by NDK cache re-parsing');
}
```

## When to Apply This Rule

### Always Apply For
- Any NIP-101e event generation or parsing
- Exercise and workout data validation
- NDK cache storage of Nostr fitness events
- Testing of workout-related Nostr functionality

### Especially Important When
- Creating new exercise templates
- Publishing workout records
- Parsing events from external sources
- Migrating or updating existing workout data
- Code reviews involving Nostr fitness events

### Success Metrics
- Zero malformed events generated by the app
- All parsing functions reject invalid events cleanly
- Clear error messages for debugging malformed external events
- Consistent tag formatting across all generated events
- Forward compatibility maintained for future extensions

This rule ensures that the POWR Workout PWA maintains the highest standards for NIP-101e compliance while providing clear guidelines for developers and robust error handling for users.

---

**Last Updated**: 2025-06-21
**Project**: POWR Workout PWA
**Environment**: Web Browser
