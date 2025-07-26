/**
 * Workout Lifecycle Machine Types
 * 
 * Following Noga roundLifecycleMachine patterns
 * Parent machine that manages overall workout flow
 */

import type { 
  BaseMachineContext, 
  UserInfo, 
  ErrorInfo, 
  WorkoutData,
  TemplateSelection
} from './workoutTypes';

// Workout lifecycle context - minimal like Noga's parent machine
export interface WorkoutLifecycleContext extends BaseMachineContext {
  // User information
  userInfo: UserInfo;
  
  // Current workout reference
  workoutData?: WorkoutData;
  
  // Template selection
  templateSelection: TemplateSelection;
  
  // Active workout actor reference
  activeWorkoutActor?: unknown; // XState actor reference
  
  // Error handling
  error?: ErrorInfo;
  
  // Lifecycle tracking
  lastUpdated: number;
  lifecycleStartTime: number;
  
  // Template reference from START_SETUP event
  templateReference?: string;
  
  // NEW: Resolved template and exercises from dependency resolution
  resolvedTemplate?: unknown; // WorkoutTemplate from dependency resolution
  resolvedExercises?: unknown[]; // Exercise[] from dependency resolution
}

// Active state context - guarantees workoutData is present
export interface ActiveWorkoutLifecycleContext extends WorkoutLifecycleContext {
  workoutData: WorkoutData; // Required in active state
}

// Workout lifecycle events
export type WorkoutLifecycleEvent =
  | { type: 'START_SETUP'; templateReference?: string }
  | { type: 'SETUP_COMPLETE'; templateSelection: TemplateSelection }
  | { type: 'CANCEL_SETUP' }
  | { type: 'START_WORKOUT'; workoutData: WorkoutData }
  | { type: 'WORKOUT_ACTIVE'; workoutData: WorkoutData }
  | { type: 'WORKOUT_PAUSED' }
  | { type: 'WORKOUT_RESUMED' }
  | { type: 'WORKOUT_COMPLETED'; workoutData: WorkoutData }
  | { type: 'WORKOUT_CANCELLED' }
  | { type: 'MINIMIZE_INTERFACE' }
  | { type: 'EXPAND_INTERFACE' }
  | { type: 'RESET_LIFECYCLE' }
  | { type: 'ERROR_OCCURRED'; error: ErrorInfo }
  | { type: 'RETRY_OPERATION' }
  | { type: 'DISMISS_ERROR' };

// Setup machine input (for invoked setup machine)
export interface SetupMachineInput {
  userPubkey: string;
  templateReference?: string;
}

// Setup machine output
export interface SetupMachineOutput {
  templateSelection: TemplateSelection;
  workoutData: WorkoutData;
  // NEW: Resolved template and exercises from dependency resolution
  resolvedTemplate?: unknown; // WorkoutTemplate from dependency resolution
  resolvedExercises?: unknown[]; // Exercise[] from dependency resolution
}

// Active workout machine input (for spawned active machine)
export interface ActiveWorkoutMachineInput {
  userInfo: UserInfo;
  workoutData: WorkoutData;
  templateSelection: TemplateSelection;
}

// Active workout machine output
export interface ActiveWorkoutMachineOutput {
  workoutData: WorkoutData;
  publishedEventId?: string;
  totalDuration: number;
}

// Lifecycle state values
export type WorkoutLifecycleState = 
  | 'idle'
  | 'setup'
  | 'active'
  | 'completed'
  | 'error';

// Guards for lifecycle machine
export interface WorkoutLifecycleGuards {
  hasPreselectedTemplate: (context: WorkoutLifecycleContext, event: WorkoutLifecycleEvent) => boolean;
  hasValidWorkoutData: (context: WorkoutLifecycleContext, event: WorkoutLifecycleEvent) => boolean;
  canRetryOperation: (context: WorkoutLifecycleContext, event: WorkoutLifecycleEvent) => boolean;
}

// Actions for lifecycle machine
export interface WorkoutLifecycleActions {
  logTransition: (context: WorkoutLifecycleContext, event: WorkoutLifecycleEvent) => void;
  updateLastActivity: (context: WorkoutLifecycleContext, event: WorkoutLifecycleEvent) => void;
  setError: (context: WorkoutLifecycleContext, event: WorkoutLifecycleEvent) => void;
  clearError: (context: WorkoutLifecycleContext, event: WorkoutLifecycleEvent) => void;
  updateWorkoutData: (context: WorkoutLifecycleContext, event: WorkoutLifecycleEvent) => void;
  updateTemplateSelection: (context: WorkoutLifecycleContext, event: WorkoutLifecycleEvent) => void;
  spawnActiveWorkout: (context: WorkoutLifecycleContext, event: WorkoutLifecycleEvent) => void;
  cleanupActiveWorkout: (context: WorkoutLifecycleContext, event: WorkoutLifecycleEvent) => void;
}

// Default context for lifecycle machine
export const defaultWorkoutLifecycleContext: Omit<WorkoutLifecycleContext, 'userInfo'> = {
  templateSelection: {},
  lastUpdated: Date.now(),
  lifecycleStartTime: Date.now()
};
