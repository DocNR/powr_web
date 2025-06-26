/**
 * Core Workout Types for XState Machines
 * 
 * Following Noga patterns adapted for workout domain
 * NDK-first architecture - events as data model
 */

// Core workout data types
export interface CompletedSet {
  exerciseRef: string; // 33401:pubkey:exercise-d-tag format
  setNumber: number;
  reps: number;
  weight: number; // kg, 0 for bodyweight
  rpe?: number; // Rate of Perceived Exertion (1-10)
  setType: 'warmup' | 'normal' | 'drop' | 'failure';
  completedAt: number; // Unix timestamp
  notes?: string;
}

export interface WorkoutExercise {
  exerciseRef: string; // Reference to exercise template
  plannedSets: number;
  plannedReps: number;
  plannedWeight: number;
  restTime?: number; // seconds
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  exercises: WorkoutExercise[];
  estimatedDuration?: number; // minutes
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  author: string; // pubkey
}

export interface WorkoutData {
  workoutId: string;
  templateId?: string;
  title: string;
  startTime: number;
  endTime?: number;
  completedSets: CompletedSet[];
  notes?: string;
  workoutType: 'strength' | 'cardio' | 'flexibility' | 'mixed';
}

// User and authentication types
export interface UserInfo {
  pubkey: string;
  npub?: string;
  displayName?: string;
}

// Error handling types
export interface ErrorInfo {
  message: string;
  code?: string;
  timestamp: number;
  context?: Record<string, unknown>;
}

// Validation types
export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

// NIP-101e event generation types
export interface WorkoutEventData {
  kind: 1301;
  content: string;
  tags: string[][];
  created_at: number;
  pubkey: string;
}

// Publishing status types
export interface PublishingStatus {
  isPublishing: boolean;
  publishError?: ErrorInfo;
  publishedEventId?: string;
  publishAttempts: number;
}

// Template selection types
export interface TemplateSelection {
  templateId?: string;
  template?: WorkoutTemplate;
  customTitle?: string;
}

// Exercise progression types
export interface ExerciseProgression {
  currentExerciseIndex: number;
  totalExercises: number;
  currentSetNumber: number;
  isLastSet: boolean;
  isLastExercise: boolean;
}

// Workout session state
export interface WorkoutSession {
  isActive: boolean;
  isPaused: boolean;
  pausedAt?: number;
  totalPauseTime: number; // milliseconds
  lastActivityAt: number;
}

// Common utility types
export type WorkoutStatus = 'setup' | 'active' | 'paused' | 'completing' | 'completed' | 'cancelled';

export interface TimingInfo {
  startTime: number;
  endTime?: number;
  duration?: number; // calculated duration in seconds
  pauseTime: number; // total pause time in seconds
}

// Event types for machine communication
export interface MachineEvents {
  // Lifecycle events
  START_WORKOUT: { templateId?: string; customTitle?: string };
  PAUSE_WORKOUT: Record<string, never>;
  RESUME_WORKOUT: Record<string, never>;
  COMPLETE_WORKOUT: Record<string, never>;
  CANCEL_WORKOUT: Record<string, never>;
  
  // Exercise events
  COMPLETE_SET: { 
    exerciseRef: string;
    reps: number;
    weight: number;
    rpe?: number;
    setType?: CompletedSet['setType'];
    notes?: string;
  };
  NEXT_EXERCISE: Record<string, never>;
  PREVIOUS_EXERCISE: Record<string, never>;
  
  // Template events
  SELECT_TEMPLATE: { templateId: string };
  CLEAR_TEMPLATE: Record<string, never>;
  
  // Error events
  RETRY_PUBLISH: Record<string, never>;
  DISMISS_ERROR: Record<string, never>;
}

// Machine context base interface
export interface BaseMachineContext {
  userInfo: UserInfo;
  error?: ErrorInfo;
  lastUpdated: number;
}

// Re-export for convenience
export type { NDKEvent } from '@nostr-dev-kit/ndk';
