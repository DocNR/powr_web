/**
 * NIP-101e Workout Event Utilities
 * 
 * Test utilities for generating valid workout events following NIP-101e specification.
 * These are for NDK cache validation only - not production-ready.
 */

import { v4 as uuidv4 } from 'uuid';
import { WORKOUT_EVENT_KINDS } from './ndk';

// Type definitions for workout events
export interface WorkoutEvent {
  kind: number;
  content: string;
  tags: string[][];
  created_at: number;
  pubkey: string;
  id?: string;
}

export interface ParsedWorkoutEvent {
  id: string;
  title: string;
  type: string;
  startTime: number;
  endTime: number;
  duration: number;
  completed: boolean;
  exercises: ParsedExercise[];
  content: string;
  eventId?: string;
  pubkey: string;
}

export interface ParsedExercise {
  reference: string;
  weight: string;
  reps: string;
  rpe: string;
  setType: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Test exercise references for validation
const TEST_EXERCISE_REFS = {
  PUSHUPS: '33401:test-pubkey:pushups',
  SQUATS: '33401:test-pubkey:squats', 
  DEADLIFTS: '33401:test-pubkey:deadlifts',
} as const;

/**
 * Generate a test workout record (kind 1301) for NDK cache validation
 */
export function generateTestWorkoutRecord(userPubkey: string) {
  const workoutId = uuidv4();
  const startTime = Math.floor(Date.now() / 1000) - 1800; // 30 minutes ago
  const endTime = Math.floor(Date.now() / 1000); // now
  
  return {
    kind: WORKOUT_EVENT_KINDS.WORKOUT_RECORD,
    content: 'Test workout for NDK cache validation. Push-ups and squats circuit.',
    tags: [
      // Required tags per NIP-101e
      ['d', workoutId],
      ['title', 'Test Circuit Workout'],
      ['type', 'circuit'],
      ['start', startTime.toString()],
      ['end', endTime.toString()],
      ['completed', 'true'],
      
      // Exercise sets - Push-ups (2 sets)
      ['exercise', TEST_EXERCISE_REFS.PUSHUPS, '', '0', '10', '7', 'normal'],
      ['exercise', TEST_EXERCISE_REFS.PUSHUPS, '', '0', '8', '8', 'normal'],
      
      // Exercise sets - Squats (2 sets)  
      ['exercise', TEST_EXERCISE_REFS.SQUATS, '', '0', '15', '6', 'normal'],
      ['exercise', TEST_EXERCISE_REFS.SQUATS, '', '0', '12', '7', 'normal'],
      
      // Optional tags
      ['t', 'fitness'],
      ['t', 'test'],
    ],
    created_at: endTime,
    pubkey: userPubkey,
  };
}

/**
 * Generate a more complex test workout with weighted exercises
 */
export function generateTestStrengthWorkout(userPubkey: string) {
  const workoutId = uuidv4();
  const startTime = Math.floor(Date.now() / 1000) - 2700; // 45 minutes ago
  const endTime = Math.floor(Date.now() / 1000); // now
  
  return {
    kind: WORKOUT_EVENT_KINDS.WORKOUT_RECORD,
    content: 'Test strength workout with weighted exercises for NDK cache validation.',
    tags: [
      // Required tags
      ['d', workoutId],
      ['title', 'Test Strength Session'],
      ['type', 'strength'],
      ['start', startTime.toString()],
      ['end', endTime.toString()],
      ['completed', 'true'],
      
      // Squats - 3 sets with progression
      ['exercise', TEST_EXERCISE_REFS.SQUATS, '', '60', '5', '7', 'normal'],
      ['exercise', TEST_EXERCISE_REFS.SQUATS, '', '70', '5', '8', 'normal'],
      ['exercise', TEST_EXERCISE_REFS.SQUATS, '', '80', '3', '9', 'normal'],
      
      // Deadlifts - 2 working sets
      ['exercise', TEST_EXERCISE_REFS.DEADLIFTS, '', '100', '5', '8', 'normal'],
      ['exercise', TEST_EXERCISE_REFS.DEADLIFTS, '', '100', '4', '9', 'normal'],
      
      // Push-ups as finisher
      ['exercise', TEST_EXERCISE_REFS.PUSHUPS, '', '0', '15', '7', 'normal'],
      
      // Tags
      ['t', 'fitness'],
      ['t', 'strength'],
      ['t', 'test'],
    ],
    created_at: endTime,
    pubkey: userPubkey,
  };
}

/**
 * Generate a failed/incomplete workout for testing edge cases
 */
export function generateTestFailedWorkout(userPubkey: string) {
  const workoutId = uuidv4();
  const startTime = Math.floor(Date.now() / 1000) - 900; // 15 minutes ago
  const endTime = Math.floor(Date.now() / 1000); // now
  
  return {
    kind: WORKOUT_EVENT_KINDS.WORKOUT_RECORD,
    content: 'Test failed workout - stopped early due to fatigue. Testing incomplete workout handling.',
    tags: [
      // Required tags
      ['d', workoutId],
      ['title', 'Test Failed Workout'],
      ['type', 'circuit'],
      ['start', startTime.toString()],
      ['end', endTime.toString()],
      ['completed', 'false'], // Failed workout
      
      // Only completed first round
      ['exercise', TEST_EXERCISE_REFS.PUSHUPS, '', '0', '10', '7', 'normal'],
      ['exercise', TEST_EXERCISE_REFS.SQUATS, '', '0', '15', '8', 'normal'],
      
      // Second round - failed on squats
      ['exercise', TEST_EXERCISE_REFS.PUSHUPS, '', '0', '8', '8', 'normal'],
      ['exercise', TEST_EXERCISE_REFS.SQUATS, '', '0', '5', '10', 'failure'],
      
      // Tags
      ['t', 'fitness'],
      ['t', 'test'],
    ],
    created_at: endTime,
    pubkey: userPubkey,
  };
}

/**
 * Validate NIP-101e workout event format
 */
export function validateWorkoutEvent(event: WorkoutEvent): ValidationResult {
  const errors: string[] = [];
  
  // Check required fields
  if (!event.kind || event.kind !== WORKOUT_EVENT_KINDS.WORKOUT_RECORD) {
    errors.push('Invalid or missing kind (must be 1301)');
  }
  
  if (!event.pubkey || typeof event.pubkey !== 'string') {
    errors.push('Missing or invalid pubkey');
  }
  
  if (!event.created_at || typeof event.created_at !== 'number') {
    errors.push('Missing or invalid created_at timestamp');
  }
  
  if (!event.content || typeof event.content !== 'string') {
    errors.push('Missing content field');
  }
  
  if (!Array.isArray(event.tags)) {
    errors.push('Missing or invalid tags array');
    return { valid: false, errors };
  }
  
  // Check required tags
  const tagMap = new Map(event.tags.map((tag: string[]) => [tag[0], tag]));
  
  const requiredTags = ['d', 'title', 'type', 'start', 'end', 'completed'];
  for (const requiredTag of requiredTags) {
    if (!tagMap.has(requiredTag)) {
      errors.push(`Missing required tag: ${requiredTag}`);
    }
  }
  
  // Validate exercise tags format
  const exerciseTags = event.tags.filter((tag: string[]) => tag[0] === 'exercise');
  if (exerciseTags.length === 0) {
    errors.push('Workout must include at least one exercise tag');
  }
  
  for (const exerciseTag of exerciseTags) {
    if (exerciseTag.length < 7) {
      errors.push(`Invalid exercise tag format: ${exerciseTag.join(',')}`);
    }
    
    // Validate exercise reference format (kind:pubkey:d-tag)
    const exerciseRef = exerciseTag[1];
    if (!exerciseRef.match(/^\d+:[a-zA-Z0-9-]+:[a-zA-Z0-9-]+$/)) {
      errors.push(`Invalid exercise reference format: ${exerciseRef}`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Parse workout event data for display
 */
export function parseWorkoutEvent(event: WorkoutEvent): ParsedWorkoutEvent {
  const tagMap = new Map(event.tags.map((tag: string[]) => [tag[0], tag]));
  
  // Extract basic info
  const id = tagMap.get('d')?.[1] || 'unknown';
  const title = tagMap.get('title')?.[1] || 'Untitled Workout';
  const type = tagMap.get('type')?.[1] || 'unknown';
  const startTime = parseInt(tagMap.get('start')?.[1] || '0');
  const endTime = parseInt(tagMap.get('end')?.[1] || '0');
  const completed = tagMap.get('completed')?.[1] === 'true';
  
  // Extract exercises
  const exerciseTags = event.tags.filter((tag: string[]) => tag[0] === 'exercise');
  const exercises = exerciseTags.map((tag: string[]) => ({
    reference: tag[1],
    weight: tag[3] || '0',
    reps: tag[4] || '0',
    rpe: tag[5] || '0',
    setType: tag[6] || 'normal',
  }));
  
  // Calculate duration
  const duration = endTime - startTime;
  
  return {
    id,
    title,
    type,
    startTime,
    endTime,
    duration,
    completed,
    exercises,
    content: event.content,
    eventId: event.id,
    pubkey: event.pubkey,
  };
}

/**
 * Get test exercise references for validation
 */
export function getTestExerciseRefs() {
  return TEST_EXERCISE_REFS;
}

/**
 * Generate multiple test workouts for bulk testing
 */
export function generateBulkTestWorkouts(userPubkey: string, count: number = 10) {
  const workouts = [];
  
  for (let i = 0; i < count; i++) {
    // Vary the workout types and timing
    const daysAgo = Math.floor(Math.random() * 30); // Random workout in last 30 days
    const baseTime = Math.floor(Date.now() / 1000) - (daysAgo * 24 * 60 * 60);
    
    const workoutId = uuidv4();
    const startTime = baseTime - 1800; // 30 min workout
    const endTime = baseTime;
    
    const workout = {
      kind: WORKOUT_EVENT_KINDS.WORKOUT_RECORD,
      content: `Bulk test workout #${i + 1} for NDK cache performance testing.`,
      tags: [
        ['d', workoutId],
        ['title', `Test Workout ${i + 1}`],
        ['type', i % 2 === 0 ? 'strength' : 'circuit'],
        ['start', startTime.toString()],
        ['end', endTime.toString()],
        ['completed', 'true'],
        
        // Random exercises
        ['exercise', TEST_EXERCISE_REFS.PUSHUPS, '', '0', (10 + Math.floor(Math.random() * 10)).toString(), '7', 'normal'],
        ['exercise', TEST_EXERCISE_REFS.SQUATS, '', (Math.floor(Math.random() * 50)).toString(), (5 + Math.floor(Math.random() * 10)).toString(), '8', 'normal'],
        
        ['t', 'fitness'],
        ['t', 'test'],
        ['t', 'bulk'],
      ],
      created_at: endTime,
      pubkey: userPubkey,
    };
    
    workouts.push(workout);
  }
  
  return workouts;
}

// ===== PHASE 1: EXERCISE TEMPLATE GENERATION =====

/**
 * Generate exercise template (kind 33401) following simplified structure
 */
export function generateExerciseTemplate(userPubkey: string, exerciseData: {
  id: string;
  name: string;
  instructions: string;
  equipment: string;
  difficulty: string;
  muscleGroups: string[];
  imageUrl?: string;
}) {
  return {
    kind: WORKOUT_EVENT_KINDS.EXERCISE_TEMPLATE,
    content: exerciseData.instructions,
    tags: [
      ['d', exerciseData.id],
      ['title', exerciseData.name],
      ['format', 'weight', 'reps', 'rpe', 'set_type'],
      ['format_units', 'kg', 'count', '0-10', 'warmup|normal|drop|failure'],
      ['equipment', exerciseData.equipment],
      ['difficulty', exerciseData.difficulty],
      ...(exerciseData.imageUrl ? [['image', exerciseData.imageUrl]] : []),
      // Muscle group tags
      ...exerciseData.muscleGroups.map(muscle => ['t', muscle]),
      ['t', 'fitness'],
    ],
    created_at: Math.floor(Date.now() / 1000),
    pubkey: userPubkey,
  };
}

/**
 * Generate all 12 bodyweight exercises for Phase 1
 */
export function generateAllBodyweightExercises(userPubkey: string) {
  const exercises = [
    // Push Category (4 exercises)
    {
      id: 'pushup-standard',
      name: 'Standard Pushup',
      instructions: 'Start in plank position. Lower body to ground. Push back up.',
      equipment: 'bodyweight',
      difficulty: 'beginner',
      muscleGroups: ['chest', 'triceps', 'push'],
      imageUrl: 'https://cdn.powr.app/exercises/pushup-standard.jpg'
    },
    {
      id: 'pike-pushup',
      name: 'Pike Pushup',
      instructions: 'Start in downward dog position. Lower head toward ground. Push back up.',
      equipment: 'bodyweight',
      difficulty: 'intermediate',
      muscleGroups: ['shoulders', 'triceps', 'push'],
      imageUrl: 'https://cdn.powr.app/exercises/pike-pushup.jpg'
    },
    {
      id: 'tricep-dips',
      name: 'Tricep Dips',
      instructions: 'Sit on chair edge. Lower body down. Push back up using triceps.',
      equipment: 'bodyweight',
      difficulty: 'beginner',
      muscleGroups: ['triceps', 'chest', 'push'],
      imageUrl: 'https://cdn.powr.app/exercises/tricep-dips.jpg'
    },
    {
      id: 'wall-handstand',
      name: 'Wall Handstand',
      instructions: 'Place hands on ground near wall. Walk feet up wall. Hold position.',
      equipment: 'bodyweight',
      difficulty: 'advanced',
      muscleGroups: ['shoulders', 'core', 'push'],
      imageUrl: 'https://cdn.powr.app/exercises/wall-handstand.jpg'
    },
    
    // Pull Category (4 exercises)
    {
      id: 'pullups',
      name: 'Pull-ups',
      instructions: 'Hang from bar. Pull body up until chin over bar. Lower down.',
      equipment: 'bodyweight',
      difficulty: 'intermediate',
      muscleGroups: ['back', 'biceps', 'pull'],
      imageUrl: 'https://cdn.powr.app/exercises/pullups.jpg'
    },
    {
      id: 'chinups',
      name: 'Chin-ups',
      instructions: 'Hang from bar with underhand grip. Pull up until chin over bar.',
      equipment: 'bodyweight',
      difficulty: 'intermediate',
      muscleGroups: ['back', 'biceps', 'pull'],
      imageUrl: 'https://cdn.powr.app/exercises/chinups.jpg'
    },
    {
      id: 'inverted-rows',
      name: 'Inverted Rows',
      instructions: 'Lie under table. Pull chest to table edge. Lower down.',
      equipment: 'bodyweight',
      difficulty: 'beginner',
      muscleGroups: ['back', 'rhomboids', 'pull'],
      imageUrl: 'https://cdn.powr.app/exercises/inverted-rows.jpg'
    },
    {
      id: 'door-pulls',
      name: 'Door Pulls',
      instructions: 'Hold door frame. Lean back. Pull body toward door.',
      equipment: 'bodyweight',
      difficulty: 'beginner',
      muscleGroups: ['back', 'biceps', 'pull'],
      imageUrl: 'https://cdn.powr.app/exercises/door-pulls.jpg'
    },
    
    // Legs Category (4 exercises)
    {
      id: 'bodyweight-squats',
      name: 'Bodyweight Squats',
      instructions: 'Stand with feet shoulder-width apart. Lower down. Stand back up.',
      equipment: 'bodyweight',
      difficulty: 'beginner',
      muscleGroups: ['legs', 'glutes', 'legs'],
      imageUrl: 'https://cdn.powr.app/exercises/bodyweight-squats.jpg'
    },
    {
      id: 'lunges',
      name: 'Lunges',
      instructions: 'Step forward into lunge position. Push back to standing.',
      equipment: 'bodyweight',
      difficulty: 'beginner',
      muscleGroups: ['legs', 'glutes', 'legs'],
      imageUrl: 'https://cdn.powr.app/exercises/lunges.jpg'
    },
    {
      id: 'single-leg-squats',
      name: 'Single-Leg Squats',
      instructions: 'Stand on one leg. Lower down on single leg. Stand back up.',
      equipment: 'bodyweight',
      difficulty: 'advanced',
      muscleGroups: ['legs', 'balance', 'legs'],
      imageUrl: 'https://cdn.powr.app/exercises/single-leg-squats.jpg'
    },
    {
      id: 'calf-raises',
      name: 'Calf Raises',
      instructions: 'Stand on toes. Raise up as high as possible. Lower down.',
      equipment: 'bodyweight',
      difficulty: 'beginner',
      muscleGroups: ['calves', 'legs'],
      imageUrl: 'https://cdn.powr.app/exercises/calf-raises.jpg'
    }
  ];

  return exercises.map(exercise => generateExerciseTemplate(userPubkey, exercise));
}

// ===== PHASE 1: WORKOUT TEMPLATE GENERATION =====

/**
 * Generate workout template (kind 33402)
 */
export function generateWorkoutTemplate(userPubkey: string, workoutData: {
  id: string;
  name: string;
  description: string;
  exercises: Array<{
    exerciseId: string;
    sets: number;
    reps: number;
    weight?: number;
  }>;
  estimatedDuration: number;
  difficulty?: string;
}) {
  return {
    kind: WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE,
    content: workoutData.description,
    tags: [
      ['d', workoutData.id],
      ['title', workoutData.name],
      // Exercise references with sets/reps
      ...workoutData.exercises.map(ex => [
        'exercise',
        `33401:${userPubkey}:${ex.exerciseId}`,
        ex.sets.toString(),
        ex.reps.toString(),
        (ex.weight || 0).toString()
      ]),
      ['duration', workoutData.estimatedDuration.toString()],
      ...(workoutData.difficulty ? [['difficulty', workoutData.difficulty]] : []),
      ['t', 'fitness'],
    ],
    created_at: Math.floor(Date.now() / 1000),
    pubkey: userPubkey,
  };
}

/**
 * Generate all 3 test workout templates for Phase 1
 */
export function generateAllWorkoutTemplates(userPubkey: string) {
  return [
    // Push Workout
    generateWorkoutTemplate(userPubkey, {
      id: 'push-workout-bodyweight',
      name: 'POWR Test Push Workout',
      description: 'Upper body push exercises for strength building',
      exercises: [
        { exerciseId: 'pushup-standard', sets: 3, reps: 10 },
        { exerciseId: 'pike-pushup', sets: 3, reps: 8 },
        { exerciseId: 'tricep-dips', sets: 3, reps: 12 },
        { exerciseId: 'wall-handstand', sets: 3, reps: 5 }
      ],
      estimatedDuration: 1800, // 30 minutes
      difficulty: 'intermediate'
    }),
    
    // Pull Workout
    generateWorkoutTemplate(userPubkey, {
      id: 'pull-workout-bodyweight',
      name: 'POWR Test Pull Workout',
      description: 'Upper body pull exercises for back and bicep strength',
      exercises: [
        { exerciseId: 'pullups', sets: 3, reps: 5 },
        { exerciseId: 'chinups', sets: 3, reps: 6 },
        { exerciseId: 'inverted-rows', sets: 3, reps: 10 },
        { exerciseId: 'door-pulls', sets: 3, reps: 12 }
      ],
      estimatedDuration: 2100, // 35 minutes
      difficulty: 'intermediate'
    }),
    
    // Legs Workout
    generateWorkoutTemplate(userPubkey, {
      id: 'legs-workout-bodyweight',
      name: 'POWR Test Legs Workout',
      description: 'Lower body exercises for leg and glute strength',
      exercises: [
        { exerciseId: 'bodyweight-squats', sets: 3, reps: 15 },
        { exerciseId: 'lunges', sets: 3, reps: 12 },
        { exerciseId: 'single-leg-squats', sets: 3, reps: 8 },
        { exerciseId: 'calf-raises', sets: 3, reps: 20 }
      ],
      estimatedDuration: 1500, // 25 minutes
      difficulty: 'beginner'
    })
  ];
}

// ===== PHASE 1: COLLECTION GENERATION =====

/**
 * Generate NIP-51 collection (kind 30003)
 */
export function generateCollection(userPubkey: string, collectionData: {
  id: string;
  name: string;
  description: string;
  contentRefs: Array<{
    kind: number;
    pubkey: string;
    dTag: string;
  }>;
}) {
  return {
    kind: 30003, // NIP-51 collection kind
    content: collectionData.description,
    tags: [
      ['d', collectionData.id],
      ['title', collectionData.name],
      // Content references using 'a' tags
      ...collectionData.contentRefs.map(ref => [
        'a',
        `${ref.kind}:${ref.pubkey}:${ref.dTag}`
      ]),
      ['t', 'fitness'],
    ],
    created_at: Math.floor(Date.now() / 1000),
    pubkey: userPubkey,
  };
}

/**
 * Generate exercise library collection
 */
export function generateExerciseLibraryCollection(userPubkey: string) {
  const exerciseIds = [
    'pushup-standard', 'pike-pushup', 'tricep-dips', 'wall-handstand',
    'pullups', 'chinups', 'inverted-rows', 'door-pulls',
    'bodyweight-squats', 'lunges', 'single-leg-squats', 'calf-raises'
  ];

  return generateCollection(userPubkey, {
    id: 'exercise-library',
    name: 'POWR Test Exercise Library',
    description: 'Complete bodyweight exercise library for strength training',
    contentRefs: exerciseIds.map(id => ({
      kind: 33401,
      pubkey: userPubkey,
      dTag: id
    }))
  });
}

/**
 * Generate workout collection
 */
export function generateWorkoutCollection(userPubkey: string) {
  return generateCollection(userPubkey, {
    id: 'strength-bodyweight',
    name: 'POWR Test Strength Bodyweight Collection',
    description: 'Complete bodyweight strength training workouts',
    contentRefs: [
      { kind: 33402, pubkey: userPubkey, dTag: 'push-workout-bodyweight' },
      { kind: 33402, pubkey: userPubkey, dTag: 'pull-workout-bodyweight' },
      { kind: 33402, pubkey: userPubkey, dTag: 'legs-workout-bodyweight' }
    ]
  });
}

// ===== VALIDATION FUNCTIONS =====

/**
 * Validate exercise template event
 */
export function validateExerciseEvent(event: WorkoutEvent): ValidationResult {
  const errors: string[] = [];
  
  if (event.kind !== WORKOUT_EVENT_KINDS.EXERCISE_TEMPLATE) {
    errors.push('Invalid kind for exercise template (must be 33401)');
  }
  
  if (!event.content || typeof event.content !== 'string') {
    errors.push('Missing exercise instructions in content');
  }
  
  const tagMap = new Map(event.tags.map((tag: string[]) => [tag[0], tag]));
  
  const requiredTags = ['d', 'title', 'equipment', 'difficulty'];
  for (const requiredTag of requiredTags) {
    if (!tagMap.has(requiredTag)) {
      errors.push(`Missing required tag: ${requiredTag}`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validate workout template event
 */
export function validateWorkoutTemplateEvent(event: WorkoutEvent): ValidationResult {
  const errors: string[] = [];
  
  if (event.kind !== WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE) {
    errors.push('Invalid kind for workout template (must be 33402)');
  }
  
  const exerciseTags = event.tags.filter((tag: string[]) => tag[0] === 'exercise');
  if (exerciseTags.length === 0) {
    errors.push('Workout template must include at least one exercise');
  }
  
  for (const exerciseTag of exerciseTags) {
    if (exerciseTag.length < 5) {
      errors.push(`Invalid exercise tag format: ${exerciseTag.join(',')}`);
    }
    
    const exerciseRef = exerciseTag[1];
    if (!exerciseRef.match(/^33401:[a-zA-Z0-9-]+:[a-zA-Z0-9-]+$/)) {
      errors.push(`Invalid exercise reference format: ${exerciseRef}`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validate collection event
 */
export function validateCollectionEvent(event: WorkoutEvent): ValidationResult {
  const errors: string[] = [];
  
  if (event.kind !== 30003) {
    errors.push('Invalid kind for collection (must be 30003)');
  }
  
  const contentTags = event.tags.filter((tag: string[]) => tag[0] === 'a');
  if (contentTags.length === 0) {
    errors.push('Collection must include at least one content reference');
  }
  
  for (const contentTag of contentTags) {
    if (contentTag.length < 2) {
      errors.push(`Invalid content reference format: ${contentTag.join(',')}`);
    }
    
    const contentRef = contentTag[1];
    if (!contentRef.match(/^\d+:[a-zA-Z0-9-]+:[a-zA-Z0-9-]+$/)) {
      errors.push(`Invalid content reference format: ${contentRef}`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Universal event validator
 */
export function validateEvent(event: WorkoutEvent): ValidationResult {
  // Basic validation
  if (!event.pubkey || typeof event.pubkey !== 'string') {
    return { valid: false, errors: ['Missing or invalid pubkey'] };
  }
  
  if (!event.created_at || typeof event.created_at !== 'number') {
    return { valid: false, errors: ['Missing or invalid created_at timestamp'] };
  }
  
  if (!Array.isArray(event.tags)) {
    return { valid: false, errors: ['Missing or invalid tags array'] };
  }
  
  // Kind-specific validation
  switch (event.kind) {
    case WORKOUT_EVENT_KINDS.EXERCISE_TEMPLATE:
      return validateExerciseEvent(event);
    case WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE:
      return validateWorkoutTemplateEvent(event);
    case WORKOUT_EVENT_KINDS.WORKOUT_RECORD:
      return validateWorkoutEvent(event);
    case 30003:
      return validateCollectionEvent(event);
    default:
      return { valid: false, errors: [`Unknown event kind: ${event.kind}`] };
  }
}
