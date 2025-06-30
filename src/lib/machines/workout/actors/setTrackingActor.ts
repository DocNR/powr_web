/**
 * Set Tracking Actor
 * 
 * Handles individual set completion and persistence.
 * Adapted from Noga's score persistence actors.
 */

import { fromPromise } from 'xstate';
import type { CompletedSet } from '../types/workoutTypes';

// Input for set tracking
export interface SetTrackingInput {
  setData: CompletedSet;
  workoutId: string;
  userPubkey: string;
}

// Output from set tracking
export interface SetTrackingResult {
  processed: boolean;
  setData: CompletedSet;
  timestamp: number;
}

/**
 * Actor for tracking individual set completion
 * Follows Noga's pattern for score persistence
 */
export const setTrackingActor = fromPromise<SetTrackingResult, SetTrackingInput>(async ({ input }) => {
  const { setData, workoutId, userPubkey } = input;
  
  try {
    // Log set completion (optimistic update)
    console.log(`[SetTracking] Recording set for workout ${workoutId} by ${userPubkey.slice(0, 8)}: ${setData.reps} reps @ ${setData.weight}kg (RPE ${setData.rpe})`);
    
    // In future, could persist to NDK cache here
    // For now, just validate and return success
    
    return {
      processed: true,
      setData,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('[SetTracking] Error processing set:', error);
    throw new Error(`Failed to track set: ${error}`);
  }
});
