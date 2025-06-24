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
