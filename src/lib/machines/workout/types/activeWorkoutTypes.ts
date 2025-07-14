/**
 * Active Workout Machine Types
 * 
 * Following Noga activeRoundMachine patterns
 * Complex child machine that handles workout execution and data persistence
 */

import type { 
  BaseMachineContext, 
  UserInfo, 
  ErrorInfo, 
  WorkoutData,
  CompletedSet,
  WorkoutExercise,
  TemplateSelection,
  ExerciseProgression,
  WorkoutSession,
  PublishingStatus,
  TimingInfo
} from './workoutTypes';

// Active workout context - complex like Noga's active machine
export interface ActiveWorkoutContext extends BaseMachineContext {
  // User information
  userInfo: UserInfo;
  
  // Core workout data (XState context as database)
  workoutData: WorkoutData;
  templateSelection: TemplateSelection;
  
  // Exercise progression tracking
  exerciseProgression: ExerciseProgression;
  
  // Session state
  workoutSession: WorkoutSession;
  
  // Timing information
  timingInfo: TimingInfo;
  
  // Publishing state
  publishingStatus: PublishingStatus;
  
  // Current exercise being performed
  currentExercise?: WorkoutExercise;
  
  // Set tracking
  currentSetData?: {
    exerciseRef: string;
    setNumber: number;
    plannedReps: number;
    plannedWeight: number;
  };
  
  // Per-exercise set counters for NDK deduplication fix
  exerciseSetCounters: Map<string, number>;
  
  // NEW: Parsed template exercises with prescribed parameters
  templateExercises: Array<{
    exerciseRef: string;
    prescribedWeight?: number;    // Optional - may not be in template
    prescribedReps?: number;      // Optional - may not be in template
    prescribedRPE?: number;       // Optional - may not be in template
    prescribedSetType?: 'warmup' | 'normal' | 'drop' | 'failure'; // Optional
    plannedSets: number;          // Required - defaults to 3 if not specified
  }>;
  
  // Error handling
  error?: ErrorInfo;
  
  // Activity tracking
  lastUpdated: number;
  lastActivityAt: number;
}

// Active workout events
export type ActiveWorkoutEvent =
  // Lifecycle events
  | { type: 'START_WORKOUT' }
  | { type: 'PAUSE_WORKOUT' }
  | { type: 'RESUME_WORKOUT' }
  | { type: 'COMPLETE_WORKOUT' }
  | { type: 'CANCEL_WORKOUT' }
  
  // Exercise navigation events
  | { type: 'START_EXERCISE'; exerciseIndex: number }
  | { type: 'NEXT_EXERCISE' }
  | { type: 'PREVIOUS_EXERCISE' }
  | { type: 'SKIP_EXERCISE' }
  | { type: 'SKIP_EXERCISE' }
  | { type: 'NAVIGATE_TO_EXERCISE'; exerciseIndex: number }
  | { type: 'ADD_SET'; exerciseRef: string }

  // Set completion events
  | { type: 'START_SET'; setNumber: number }
  | { type: 'COMPLETE_SET'; setData?: Partial<CompletedSet> } // Optional - machine auto-generates
  | { type: 'SKIP_SET' }
  | { type: 'REDO_SET'; setNumber: number }
  | { type: 'END_REST_PERIOD' }
  
  // Publishing events
  | { type: 'PUBLISH_WORKOUT' }
  | { type: 'PUBLISH_SUCCESS'; eventId: string }
  | { type: 'PUBLISH_FAILED'; error: ErrorInfo }
  | { type: 'RETRY_PUBLISH' }
  
  // Error events
  | { type: 'ERROR_OCCURRED'; error: ErrorInfo }
  | { type: 'DISMISS_ERROR' }
  | { type: 'RETRY_OPERATION' }
  
  // Summary events
  | { type: 'DISMISS_SUMMARY' }
  
  // Activity events
  | { type: 'UPDATE_ACTIVITY' }
  | { type: 'HEARTBEAT' };

// Active workout state values
export type ActiveWorkoutState = 
  | 'initializing'
  | 'exercising'
  | 'resting'
  | 'paused'
  | 'completing'
  | 'publishing'
  | 'completed'
  | 'cancelled'
  | 'error';

// Guards for active workout machine
export interface ActiveWorkoutGuards {
  hasMoreExercises: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => boolean;
  hasPreviousExercise: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => boolean;
  hasMoreSets: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => boolean;
  canPublish: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => boolean;
  hasCompletedSets: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => boolean;
  isLastExercise: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => boolean;
  isLastSet: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => boolean;
  canRetryPublish: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => boolean;
}

// Actions for active workout machine
export interface ActiveWorkoutActions {
  // Initialization actions
  initializeWorkout: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => void;
  setupFirstExercise: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => void;
  
  // Exercise progression actions
  moveToNextExercise: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => void;
  moveToPreviousExercise: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => void;
  updateExerciseProgression: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => void;
  
  // Set management actions
  startNewSet: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => void;
  recordCompletedSet: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => void;
  updateSetProgression: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => void;
  
  // Session management actions
  pauseWorkout: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => void;
  resumeWorkout: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => void;
  updateTimingInfo: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => void;
  
  // Publishing actions
  prepareWorkoutEvent: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => void;
  publishWorkoutEvent: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => void;
  handlePublishSuccess: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => void;
  handlePublishError: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => void;
  
  // Error handling actions
  setError: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => void;
  clearError: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => void;
  
  // Activity tracking actions
  updateLastActivity: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => void;
  logWorkoutActivity: (context: ActiveWorkoutContext, event: ActiveWorkoutEvent) => void;
}

// Services for active workout machine
export interface ActiveWorkoutServices {
  publishWorkoutService: (context: ActiveWorkoutContext) => Promise<{ eventId: string }>;
  validateWorkoutData: (context: ActiveWorkoutContext) => Promise<{ valid: boolean; error?: string }>;
  calculateWorkoutStats: (context: ActiveWorkoutContext) => Promise<{ duration: number; totalSets: number }>;
}

// Default context for active workout machine
export const defaultActiveWorkoutContext: Omit<ActiveWorkoutContext, 'userInfo' | 'workoutData' | 'templateSelection'> = {
  exerciseProgression: {
    currentExerciseIndex: 0,
    totalExercises: 0,
    currentSetNumber: 1,
    isLastSet: false,
    isLastExercise: false
  },
  workoutSession: {
    isActive: false,
    isPaused: false,
    totalPauseTime: 0,
    lastActivityAt: Date.now()
  },
  timingInfo: {
    startTime: Date.now(),
    pauseTime: 0
  },
  publishingStatus: {
    isPublishing: false,
    publishAttempts: 0
  },
  exerciseSetCounters: new Map<string, number>(),
  templateExercises: [],
  lastUpdated: Date.now(),
  lastActivityAt: Date.now()
};

// Input for active workout machine
export interface ActiveWorkoutMachineInput {
  userInfo: UserInfo;
  workoutData: WorkoutData;
  templateSelection: TemplateSelection;
}

// Output from active workout machine
export interface ActiveWorkoutMachineOutput {
  workoutData: WorkoutData;
  publishedEventId?: string;
  totalDuration: number;
}
