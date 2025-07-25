/**
 * Workout Validation Service
 * 
 * Pure business logic for validating workout data before processing.
 * Follows service-layer-architecture.md patterns - no NDK operations, only validation logic.
 */

import type { ValidationResult, CompletedSet } from '@/lib/machines/workout/types/workoutTypes';
import type { CompletedWorkout } from './workoutEventGeneration';

/**
 * Workout Validation Service
 * 
 * Pure validation logic - no external dependencies or NDK operations.
 * Services are called directly from XState actors and components.
 */
export class WorkoutValidationService {
  
  /**
   * Validate workout data before event generation
   */
  validateWorkoutData(workoutData: CompletedWorkout): ValidationResult {
    const errors: string[] = [];
    
    // Check required fields
    if (!workoutData.workoutId) {
      errors.push('Missing workout ID');
    }
    
    if (!workoutData.title || workoutData.title.trim().length === 0) {
      errors.push('Missing workout title');
    }
    
    if (!workoutData.startTime || workoutData.startTime <= 0) {
      errors.push('Invalid start time');
    }
    
    if (!workoutData.endTime || workoutData.endTime <= workoutData.startTime) {
      errors.push('Invalid end time (must be after start time)');
    }
    
    if (!workoutData.completedSets || workoutData.completedSets.length === 0) {
      errors.push('Workout must include at least one completed set');
    }
    
    // Validate workout type
    const validTypes = ['strength', 'circuit', 'emom', 'amrap'];
    if (!validTypes.includes(workoutData.workoutType)) {
      errors.push(`Invalid workout type: ${workoutData.workoutType}`);
    }
    
    // Validate template reference format if provided
    if (workoutData.templateReference) {
      const templateValidation = this.validateTemplateReference(workoutData.templateReference);
      if (!templateValidation.valid) {
        errors.push(templateValidation.error!);
      }
    }
    
    // Validate template pubkey format if provided
    if (workoutData.templatePubkey) {
      const pubkeyValidation = this.validatePubkeyFormat(workoutData.templatePubkey);
      if (!pubkeyValidation.valid) {
        errors.push(`Invalid template pubkey format: ${workoutData.templatePubkey}. ${pubkeyValidation.error}`);
      }
    }
    
    // Validate completed sets
    workoutData.completedSets?.forEach((set, index) => {
      const setValidation = this.validateCompletedSet(set, index);
      if (!setValidation.valid) {
        errors.push(setValidation.error!);
      }
    });
    
    return {
      valid: errors.length === 0,
      error: errors.length > 0 ? errors.join('; ') : undefined
    };
  }
  
  /**
   * Validate template reference format
   */
  validateTemplateReference(templateReference: string): ValidationResult {
    if (!templateReference || templateReference.trim().length === 0) {
      return { 
        valid: false, 
        error: 'Template reference cannot be empty' 
      };
    }
    
    const templateRefPattern = /^33402:[a-f0-9]{64}:[a-zA-Z0-9\-_]+$/;
    if (!templateRefPattern.test(templateReference)) {
      return { 
        valid: false, 
        error: `Invalid template reference format: ${templateReference}. Must be "33402:pubkey:d-tag"` 
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Validate exercise reference format
   */
  validateExerciseReference(exerciseRef: string): ValidationResult {
    if (!exerciseRef || exerciseRef.trim().length === 0) {
      return { 
        valid: false, 
        error: 'Exercise reference cannot be empty' 
      };
    }
    
    if (!exerciseRef.match(/^\d+:[a-zA-Z0-9-]+:[a-zA-Z0-9-]+$/)) {
      return { 
        valid: false, 
        error: `Invalid exercise reference format: ${exerciseRef}. Must be "kind:pubkey:d-tag"` 
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Validate pubkey format (64-character hex string)
   */
  validatePubkeyFormat(pubkey: string): ValidationResult {
    if (!pubkey || pubkey.trim().length === 0) {
      return { 
        valid: false, 
        error: 'Pubkey cannot be empty' 
      };
    }
    
    const pubkeyPattern = /^[a-f0-9]{64}$/;
    if (!pubkeyPattern.test(pubkey)) {
      return { 
        valid: false, 
        error: 'Must be 64-character hex string' 
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Validate a single completed set
   */
  validateCompletedSet(set: CompletedSet, index: number): ValidationResult {
    const errors: string[] = [];
    
    // Validate exercise reference
    const exerciseRefValidation = this.validateExerciseReference(set.exerciseRef);
    if (!exerciseRefValidation.valid) {
      errors.push(`Invalid exercise reference in set ${index + 1}: ${set.exerciseRef}`);
    }
    
    // Validate reps
    if (!set.reps || set.reps <= 0) {
      errors.push(`Invalid reps in set ${index + 1}: ${set.reps}`);
    }
    
    // Validate weight
    if (set.weight < 0) {
      errors.push(`Invalid weight in set ${index + 1}: ${set.weight}`);
    }
    
    // Validate RPE if provided
    if (set.rpe && (set.rpe < 1 || set.rpe > 10)) {
      errors.push(`Invalid RPE in set ${index + 1}: ${set.rpe} (must be 1-10)`);
    }
    
    // Validate set type
    const validSetTypes = ['warmup', 'normal', 'drop', 'failure'];
    if (!validSetTypes.includes(set.setType)) {
      errors.push(`Invalid set type in set ${index + 1}: ${set.setType}`);
    }
    
    // Validate set number
    if (!set.setNumber || set.setNumber <= 0) {
      errors.push(`Invalid set number in set ${index + 1}: ${set.setNumber}`);
    }
    
    // Validate completed timestamp
    if (!set.completedAt || set.completedAt <= 0) {
      errors.push(`Invalid completion timestamp in set ${index + 1}: ${set.completedAt}`);
    }
    
    return {
      valid: errors.length === 0,
      error: errors.length > 0 ? errors.join('; ') : undefined
    };
  }
  
  /**
   * Validate workout duration is reasonable
   */
  validateWorkoutDuration(startTime: number, endTime: number): ValidationResult {
    const duration = endTime - startTime;
    const durationMinutes = duration / (1000 * 60);
    
    // Check for unreasonably short workouts (less than 1 minute)
    if (durationMinutes < 1) {
      return {
        valid: false,
        error: `Workout duration too short: ${durationMinutes.toFixed(1)} minutes`
      };
    }
    
    // Check for unreasonably long workouts (more than 8 hours)
    if (durationMinutes > 480) {
      return {
        valid: false,
        error: `Workout duration too long: ${durationMinutes.toFixed(1)} minutes`
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Validate workout has reasonable set count
   */
  validateSetCount(setCount: number): ValidationResult {
    if (setCount <= 0) {
      return {
        valid: false,
        error: 'Workout must have at least one set'
      };
    }
    
    // Warn about very high set counts (more than 100 sets)
    if (setCount > 100) {
      return {
        valid: true,
        warnings: [`High set count: ${setCount} sets`]
      };
    }
    
    return { valid: true };
  }
}

// Export singleton instance following service-layer-architecture.md
export const workoutValidationService = new WorkoutValidationService();
