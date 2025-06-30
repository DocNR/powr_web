/**
 * Active Workout Guards
 * 
 * This file contains guard functions that determine transitions 
 * in the Active Workout Machine.
 * 
 * Following Noga's activeRoundGuards.ts patterns exactly,
 * adapted from golf domain (holes, scores) to workout domain (exercises, sets).
 */

import type { ActiveWorkoutContext } from '../types/activeWorkoutTypes';

export const activeWorkoutGuards = {
  /**
   * Check if the machine can navigate to the next exercise
   * Adapted from Noga's canGoToNextHole
   */
  canGoToNextExercise: ({ context }: { context: ActiveWorkoutContext }) => {
    const { currentExerciseIndex, totalExercises } = context.exerciseProgression;
    const workoutType = context.workoutData.workoutType;
    
    // Basic check: not at last exercise
    if (currentExerciseIndex >= totalExercises - 1) {
      return false;
    }
    
    // Workout-specific navigation rules
    switch (workoutType) {
      case 'circuit':
        // In circuits, can always move to next exercise
        return true;
        
      case 'emom':
        // In EMOM, movement is time-based, not user-controlled
        return false;
        
      case 'amrap':
        // In AMRAP, can move freely but typically stay in sequence
        return true;
        
      case 'strength':
      default:
        // Standard strength training: can move freely between exercises
        return true;
    }
  },

  /**
   * Check if the machine can navigate to the previous exercise
   * Adapted from Noga's canGoToPreviousHole
   */
  canGoToPreviousExercise: ({ context }: { context: ActiveWorkoutContext }) => {
    const { currentExerciseIndex } = context.exerciseProgression;
    return currentExerciseIndex > 0;
  },

  /**
   * Check if the requested exercise index is valid
   * Adapted from Noga's isValidHoleNumber
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isValidExerciseIndex: ({ context, event }: { context: ActiveWorkoutContext, event: any }) => {
    if (!('exerciseIndex' in event)) return false;
    const exerciseIndex = event.exerciseIndex;
    const { totalExercises } = context.exerciseProgression;
    return exerciseIndex >= 0 && exerciseIndex < totalExercises;
  },

  /**
   * Check if current exercise has more sets to complete
   * Adapted from Noga's score validation patterns
   */
  hasMoreSets: ({ context }: { context: ActiveWorkoutContext }) => {
    const { currentSetNumber } = context.exerciseProgression;
    const currentExercise = context.workoutData.template?.exercises?.[context.exerciseProgression.currentExerciseIndex];
    const plannedSets = currentExercise?.sets || 3;
    return currentSetNumber < plannedSets;
  },

  /**
   * Check if a set can be completed (has valid set data)
   * Adapted from Noga's score validation
   */
  canCompleteSet: ({ context }: { context: ActiveWorkoutContext }) => {
    return !!context.currentSetData;
  },

  /**
   * Check if this is the last set for current exercise
   * New for workout domain
   */
  isLastSet: ({ context }: { context: ActiveWorkoutContext }) => {
    const { currentSetNumber } = context.exerciseProgression;
    const plannedSets = context.currentSetData?.plannedReps || 0;
    return currentSetNumber >= plannedSets;
  },

  /**
   * Check if this is the last exercise in the workout
   * Adapted from Noga's round completion logic
   */
  isLastExercise: ({ context }: { context: ActiveWorkoutContext }) => {
    const { currentExerciseIndex, totalExercises } = context.exerciseProgression;
    return currentExerciseIndex >= totalExercises - 1;
  },

  /**
   * Check if all required sets have been completed
   * Adapted from Noga's hasAllRequiredScores
   */
  hasAllRequiredSets: ({ context }: { context: ActiveWorkoutContext }) => {
    // For now, check if we have any completed sets
    // In future, could validate minimum sets per exercise
    return context.workoutData.completedSets.length > 0;
  },

  /**
   * Check if the workout can be completed
   * Adapted from Noga's round completion validation
   */
  canCompleteWorkout: ({ context }: { context: ActiveWorkoutContext }) => {
    // Must have completed at least one set and not be currently publishing
    return context.workoutData.completedSets.length > 0 && 
           !context.publishingStatus.isPublishing;
  },

  /**
   * Check if workout can be published
   * New for workout domain
   */
  canPublish: ({ context }: { context: ActiveWorkoutContext }) => {
    return context.workoutData.completedSets.length > 0 && 
           !context.publishingStatus.isPublishing;
  },

  /**
   * Check if publishing can be retried
   * Adapted from Noga's retry logic
   */
  canRetryPublish: ({ context }: { context: ActiveWorkoutContext }) => {
    return !!context.error && 
           context.publishingStatus.publishAttempts < 3;
  },

  /**
   * Check if the error is related to loading template data
   * Adapted from Noga's isCourseDataError
   */
  isTemplateDataError: ({ context }: { context: ActiveWorkoutContext }) => {
    if (!context.error) return false;
    
    return context.error.code === 'TEMPLATE_DATA_ERROR';
  }
};
