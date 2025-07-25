/**
 * Real NDK Publishing Actor for Workout Completion
 * 
 * Replaces mock publishing with actual NDK event publishing
 * following Global NDK Actor patterns and service layer architecture.
 */

import { fromPromise } from 'xstate';
import { publishEvent } from '@/lib/actors/globalNDKActor';
import { workoutValidationService } from '@/lib/services/workoutValidation';
import { workoutEventGenerationService, type CompletedWorkout } from '@/lib/services/workoutEventGeneration';

export interface PublishWorkoutInput {
  workoutData: CompletedWorkout;
  userPubkey: string;
}

export interface PublishWorkoutOutput {
  success: boolean;
  eventId?: string;
  requestId: string;
  error?: string;
}

/**
 * Real NDK Publishing Actor
 * 
 * Uses optimized Global NDK Actor for reliable event publishing
 * with proper error handling and offline queue support.
 */
export const publishWorkoutActor = fromPromise(async ({ input }: {
  input: PublishWorkoutInput
}): Promise<PublishWorkoutOutput> => {
  console.log('[PublishWorkoutActor] Starting workout publishing:', {
    workoutId: input.workoutData.workoutId,
    userPubkey: input.userPubkey.slice(0, 8) + '...',
    sets: input.workoutData.completedSets.length
  });
  
  try {
    // Validate workout data using service
    const validation = workoutValidationService.validateWorkoutData(input.workoutData);
    if (!validation.valid) {
      const errorMessage = `Workout validation failed: ${validation.error || 'Unknown validation error'}`;
      console.error('[PublishWorkoutActor] Validation failed:', validation.error);
      throw new Error(errorMessage);
    }
    
    // Generate workout record event using service
    const eventData = workoutEventGenerationService.generateWorkoutRecord(
      input.workoutData,
      input.userPubkey
    );
    
    console.log('[PublishWorkoutActor] Generated NIP-101e event:', {
      kind: eventData.kind,
      tags: eventData.tags.length,
      contentLength: eventData.content.length,
      exerciseTags: eventData.tags.filter(t => t[0] === 'exercise').length
    });
    
    // Publish via optimized Global NDK Actor
    const requestId = `workout_${input.workoutData.workoutId}_${Date.now()}`;
    const publishResult = await publishEvent(eventData, requestId);
    
    if (publishResult.success) {
      console.log('[PublishWorkoutActor] Publishing successful:', {
        eventId: publishResult.eventId,
        requestId,
        workoutId: input.workoutData.workoutId
      });
      
      return {
        success: true,
        eventId: publishResult.eventId,
        requestId
      };
    } else {
      console.warn('[PublishWorkoutActor] Publishing failed but queued:', {
        error: publishResult.error,
        requestId,
        workoutId: input.workoutData.workoutId
      });
      
      // Return success even if queued - NDK will handle retry
      return {
        success: true, // Consider queued as success
        requestId,
        error: publishResult.error
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown publishing error';
    console.error('[PublishWorkoutActor] Publishing failed:', {
      error: errorMessage,
      workoutId: input.workoutData.workoutId
    });
    
    return {
      success: false,
      requestId: `failed_${input.workoutData.workoutId}_${Date.now()}`,
      error: errorMessage
    };
  }
});
