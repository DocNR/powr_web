/**
 * Workout Event Generation Service
 * 
 * Pure business logic for generating NIP-101e workout record events (Kind 1301).
 * Follows service-layer-architecture.md patterns - no NDK operations, only event data generation.
 */

import { WORKOUT_EVENT_KINDS } from '@/lib/ndk';

// Re-export types for backward compatibility
export interface CompletedWorkout {
  workoutId: string;
  title: string;
  workoutType: 'strength' | 'circuit' | 'emom' | 'amrap';
  startTime: number;
  endTime: number;
  completedSets: CompletedSet[];
  notes?: string;
  templateId?: string;           // Keep for backward compatibility
  templateReference?: string;    // NEW: Full "33402:pubkey:d-tag" format
  templatePubkey?: string;       // NEW: Template author's pubkey
  templateRelayUrl?: string;     // NEW: Optional relay URL
}

export interface CompletedSet {
  exerciseRef: string;  // Format: "33401:pubkey:exercise-d-tag"
  setNumber: number;
  reps: number;
  weight: number;      // kg, 0 for bodyweight
  rpe?: number;        // 1-10 Rate of Perceived Exertion
  setType: 'warmup' | 'normal' | 'drop' | 'failure';
  completedAt: number; // timestamp
}

export interface WorkoutEventData {
  kind: number;
  content: string;
  tags: string[][];
  created_at: number;
  pubkey: string;
}

/**
 * Workout Event Generation Service
 * 
 * Pure business logic for generating NIP-101e workout record events.
 * No NDK operations - only event data structure generation.
 */
export class WorkoutEventGenerationService {
  
  /**
   * Generate workout record event (Kind 1301) - RENAMED for clarity
   * 
   * Core business logic for converting completed workout data into
   * valid NIP-101e workout record event structure.
   */
  generateWorkoutRecord(workoutData: CompletedWorkout, userPubkey: string): WorkoutEventData {
    const duration = workoutData.endTime - workoutData.startTime;
    
    // Generate template-based d-tag for proper identification
    const dTag = workoutData.templateId 
      ? `${workoutData.templateId}-${workoutData.startTime}`
      : workoutData.workoutId;
    
    // Build tags following NIP-101e specification
    const tags: string[][] = [
      // Required tags - use template-based d-tag
      ['d', dTag],
      ['title', workoutData.title],
      ['type', workoutData.workoutType],
      ['start', workoutData.startTime.toString()],
      ['end', workoutData.endTime.toString()],
      ['completed', 'true'],
      
      // Duration in seconds
      ['duration', Math.floor(duration / 1000).toString()],
    ];
    
    // Template reference if used - CORRECTED FORMAT per NIP-101e specification
    if (workoutData.templateReference) {
      // Use full "33402:pubkey:d-tag" format with optional relay URL
      tags.push(['template', workoutData.templateReference, workoutData.templateRelayUrl || '']);
    } else if (workoutData.templateId && workoutData.templatePubkey) {
      // Fallback: construct reference from parts for backward compatibility
      const templateRef = `33402:${workoutData.templatePubkey}:${workoutData.templateId}`;
      tags.push(['template', templateRef, workoutData.templateRelayUrl || '']);
    }
    
    // Exercise sets - each completed set as separate exercise tag
    console.log('[WorkoutEventGeneration] Processing completed sets for tags:', {
      totalSets: workoutData.completedSets.length,
      sets: workoutData.completedSets.map(set => ({
        exerciseRef: set.exerciseRef,
        setNumber: set.setNumber,
        reps: set.reps,
        weight: set.weight
      }))
    });
    
    workoutData.completedSets.forEach((set, index) => {
      const exerciseTag = [
        'exercise',
        set.exerciseRef,
        '', // relay-url (empty for now)
        set.weight.toString(),
        set.reps.toString(),
        (set.rpe || 7).toString(),
        set.setType,
        set.setNumber.toString() // NEW: 8th parameter for NDK deduplication fix
      ];
      
      console.log(`[WorkoutEventGeneration] Adding exercise tag ${index + 1} with set number ${set.setNumber}:`, exerciseTag);
      tags.push(exerciseTag);
    });
    
    console.log('[WorkoutEventGeneration] Total exercise tags added:', tags.filter(t => t[0] === 'exercise').length);
    
    // Standard Nostr hashtags
    tags.push(['t', 'fitness']);
    tags.push(['t', workoutData.workoutType]);
    tags.push(['client', 'POWR']);
    
    // Build content with workout summary - delegate to utility service
    const content = this.generateWorkoutSummary(workoutData);
    
    console.log('[WorkoutEventGeneration] Final event data before return:', {
      kind: WORKOUT_EVENT_KINDS.WORKOUT_RECORD,
      totalTags: tags.length,
      exerciseTagsCount: tags.filter(t => t[0] === 'exercise').length,
      allTags: tags.map((tag, i) => `${i}: [${tag.join(', ')}]`)
    });
    
    return {
      kind: WORKOUT_EVENT_KINDS.WORKOUT_RECORD,
      content,
      tags,
      created_at: Math.floor(workoutData.endTime / 1000),
      pubkey: userPubkey
    };
  }
  
  /**
   * Generate human-readable workout summary for event content
   * 
   * NOTE: This will be moved to WorkoutUtilityService in a future refactor
   * but kept here temporarily to avoid breaking changes.
   */
  private generateWorkoutSummary(workoutData: CompletedWorkout): string {
    const durationSeconds = Math.floor((workoutData.endTime - workoutData.startTime) / 1000);
    const totalSets = workoutData.completedSets.length;
    const totalReps = workoutData.completedSets.reduce((sum, set) => sum + set.reps, 0);
    
    // Format duration properly - show seconds for short workouts, minutes for longer ones
    let durationText: string;
    if (durationSeconds < 60) {
      durationText = `${durationSeconds} seconds`;
    } else if (durationSeconds < 3600) {
      const minutes = Math.floor(durationSeconds / 60);
      const remainingSeconds = durationSeconds % 60;
      if (remainingSeconds === 0) {
        durationText = `${minutes} minutes`;
      } else {
        durationText = `${minutes}m ${remainingSeconds}s`;
      }
    } else {
      const hours = Math.floor(durationSeconds / 3600);
      const minutes = Math.floor((durationSeconds % 3600) / 60);
      durationText = `${hours}h ${minutes}m`;
    }
    
    // Group sets by exercise
    const exerciseGroups = new Map<string, CompletedSet[]>();
    workoutData.completedSets.forEach(set => {
      const exerciseId = set.exerciseRef.split(':')[2]; // Extract d-tag
      if (!exerciseGroups.has(exerciseId)) {
        exerciseGroups.set(exerciseId, []);
      }
      exerciseGroups.get(exerciseId)!.push(set);
    });
    
    const exerciseSummaries = Array.from(exerciseGroups.entries()).map(([exerciseId, sets]) => {
      const setCount = sets.length;
      const repRange = sets.length > 1 
        ? `${Math.min(...sets.map(s => s.reps))}-${Math.max(...sets.map(s => s.reps))}`
        : sets[0].reps.toString();
      
      const hasWeight = sets.some(s => s.weight > 0);
      if (hasWeight) {
        const weightRange = sets.length > 1
          ? `${Math.min(...sets.map(s => s.weight))}-${Math.max(...sets.map(s => s.weight))}kg`
          : `${sets[0].weight}kg`;
        return `${exerciseId}: ${setCount}x${repRange} @ ${weightRange}`;
      } else {
        return `${exerciseId}: ${setCount}x${repRange}`;
      }
    });
    
    let summary = `Completed ${workoutData.title} in ${durationText}. `;
    summary += `${totalSets} sets, ${totalReps} total reps. `;
    summary += `Exercises: ${exerciseSummaries.join(', ')}.`;
    
    if (workoutData.notes) {
      summary += ` Notes: ${workoutData.notes}`;
    }
    
    return summary;
  }
}

// Export singleton instance following service-layer-architecture.md
export const workoutEventGenerationService = new WorkoutEventGenerationService();
