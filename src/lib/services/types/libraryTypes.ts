/**
 * Shared Library Service Types
 * 
 * Common interfaces used across LibraryCollectionService, LibraryOnboardingService,
 * and TemplateManagementService. Extracted from monolithic LibraryManagementService
 * to support clean architecture refactoring.
 */

// Re-export types from dependencyResolution for compatibility
export type {
  WorkoutTemplate,
  TemplateExercise,
  Exercise,
  Collection
} from '../dependencyResolution';

// Standardized POWR collection d-tags - consistent across all users
export const POWR_COLLECTION_DTAGS = {
  EXERCISE_LIBRARY: 'powr-exercise-list',
  WORKOUT_LIBRARY: 'powr-workout-list', 
  COLLECTION_SUBSCRIPTIONS: 'powr-collection-list'
} as const;

export type POWRCollectionType = keyof typeof POWR_COLLECTION_DTAGS;

// Library collection interfaces
export interface LibraryCollection {
  id: string;
  name: string;
  description: string;
  dTag: string;
  contentRefs: string[];
  authorPubkey: string;
  createdAt: number;
  eventId?: string;
  itemCount: number;
}

export interface ExerciseLibraryItem {
  exerciseRef: string;
  exercise: import('../dependencyResolution').Exercise;
  addedAt: number;
  source: 'manual' | 'collection' | 'workout';
  sourceRef?: string;
}

export interface WorkoutLibraryItem {
  templateRef: string;
  template: import('../dependencyResolution').WorkoutTemplate;
  addedAt: number;
  source: 'manual' | 'collection' | 'social';
  sourceRef?: string;
}

export interface CollectionSubscription {
  collectionRef: string;
  collection: import('../dependencyResolution').Collection;
  subscribedAt: number;
  autoUpdate: boolean;
  lastSyncAt?: number;
}

export interface LibraryState {
  exercises: ExerciseLibraryItem[];
  workouts: WorkoutLibraryItem[];
  collections: CollectionSubscription[];
  isLoading: boolean;
  isEmpty: boolean;
  lastUpdated: number;
}

export interface StarterContentValidation {
  isValid: boolean;
  validExercises: import('../dependencyResolution').Exercise[];
  validWorkouts: import('../dependencyResolution').WorkoutTemplate[];
  validCollections: import('../dependencyResolution').Collection[];
  errors: string[];
  warnings: string[];
}

export interface StarterLibraryResult {
  exerciseLibrary?: LibraryCollection;
  workoutLibrary?: LibraryCollection;
  collectionSubscriptions?: LibraryCollection;
  setupTime?: number;
}

export interface TemplateAnalysis {
  isOwner: boolean;
  hasSignificantChanges: boolean;
  modificationSummary: string;
  totalChanges: number;
  canUpdateOriginal: boolean;
  canSaveAsNew: boolean;
}

export interface TemplateStructure {
  name: string;
  type: string;
  description: string;
  exercises: Array<{
    exerciseRef: string;
    name: string;
    sets: number;
    reps: number;
    weight: number;
    rpe: number;
    setType: string;
  }>;
}

export interface TemplateChangeAnalysis {
  hasModifications: boolean;
  modificationCount: number;
  suggestedName: string;
  isOwner: boolean;
}

// Phase 1 test publisher for starter content validation
export const PHASE_1_TEST_PUBKEY = '55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21';
