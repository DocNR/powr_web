/**
 * Social Sharing Service
 * 
 * Pure business logic for generating social content from workout data.
 * Follows service-layer-architecture.md patterns - no NDK operations, only content generation.
 * Privacy-first: no tracking, no analytics, no external service calls.
 */

import type { CompletedWorkout } from './workoutEventGeneration';
import type { ParsedWorkoutEvent } from './dataParsingService';
import { nip19 } from 'nostr-tools';

export interface WorkoutSocialContent {
  content: string;
  hashtags: string[];
  characterCount: number;
}

export interface SingleWorkoutStats {
  duration: number;
  exerciseCount: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  averageRPE: number;
}

/**
 * Social Sharing Service
 * 
 * Pure business logic for generating social content from workout data.
 * No tracking, no analytics, no external dependencies.
 */
export class SocialSharingService {
  
  /**
   * Generate social content for a completed workout
   * Enhanced template with exercise details and strategic emojis:
   * "Workout Complete! 💪
   * 
   * [Name]
   * 
   * ⏱️ Duration: [XX:XX]
   * 
   * [Exercise 1]: [X] sets × [X] reps @ [X]kg
   * [Exercise 2]: [X] sets × [X] reps (bodyweight)
   * 
   * 📊 Total Sets: [X] | Total Reps: [X]
   * 
   * #powr #fitness"
   */
  generateSocialContent(workoutData: CompletedWorkout): string {
    const duration = this.formatDuration(workoutData.startTime, workoutData.endTime);
    const stats = this.calculateWorkoutStats(workoutData.completedSets);
    
    // Group sets by exercise for cleaner display
    const exerciseGroups = this.groupSetsByExercise(workoutData.completedSets);
    
    let content = `Workout Complete! 💪

${workoutData.title}

⏱️ Duration: ${duration}

`;
    
    // Add exercise details
    exerciseGroups.forEach(group => {
      const exerciseName = group.exerciseName;
      const setCount = group.sets.length;
      const totalReps = group.sets.reduce((sum, set) => sum + set.reps, 0);
      
      // Determine weight display
      const weights = group.sets.map(set => set.weight).filter(w => w > 0);
      const weightDisplay = weights.length > 0 
        ? `@ ${Math.max(...weights)}kg` 
        : '(bodyweight)';
      
      content += `${exerciseName}: ${setCount} sets × ${Math.round(totalReps / setCount)} reps ${weightDisplay}
`;
    });
    
    content += `
📊 Total Sets: ${stats.totalSets} | Total Reps: ${stats.totalReps}

#powr #fitness`;
    
    return content;
  }
  
  /**
   * Generate detailed exercise breakdown for social content
   * Groups sets by exercise and formats them nicely
   */
  generateExerciseDetails(workoutData: CompletedWorkout): string {
    const completedSets = workoutData.completedSets || [];
    
    if (completedSets.length === 0) {
      return 'No exercises completed';
    }
    
    // Group sets by exercise
    const exerciseGroups = new Map<string, typeof completedSets>();
    
    completedSets.forEach(set => {
      const exerciseId = set.exerciseRef.split(':')[2]; // Extract d-tag from reference
      if (!exerciseGroups.has(exerciseId)) {
        exerciseGroups.set(exerciseId, []);
      }
      exerciseGroups.get(exerciseId)!.push(set);
    });
    
    // Format each exercise group
    const exerciseLines: string[] = [];
    
    exerciseGroups.forEach((sets, exerciseId) => {
      // Convert exercise ID to readable name (capitalize and replace hyphens)
      const exerciseName = exerciseId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      const setCount = sets.length;
      const totalReps = sets.reduce((sum, set) => sum + set.reps, 0);
      
      // Check if all sets have the same weight
      const weights = sets.map(set => set.weight);
      const hasWeight = weights.some(w => w > 0);
      const sameWeight = hasWeight && weights.every(w => w === weights[0]);
      
      let exerciseLine = `${exerciseName}: ${setCount} sets × ${Math.round(totalReps / setCount)} reps`;
      
      if (hasWeight) {
        if (sameWeight) {
          exerciseLine += ` @ ${weights[0]}kg`;
        } else {
          // Show weight range if different weights
          const minWeight = Math.min(...weights.filter(w => w > 0));
          const maxWeight = Math.max(...weights);
          if (minWeight === maxWeight) {
            exerciseLine += ` @ ${minWeight}kg`;
          } else {
            exerciseLine += ` @ ${minWeight}-${maxWeight}kg`;
          }
        }
      } else {
        exerciseLine += ' (bodyweight)';
      }
      
      exerciseLines.push(exerciseLine);
    });
    
    return exerciseLines.join('\n');
  }
  
  /**
   * Generate social content for a completed workout
   * Enhanced template with exercise details:
   * "Workout Complete! 💪
   * [Name]
   * Duration: [XX:XX]
   * 
   * [Exercise 1]: [X] sets × [X] reps @ [X]kg
   * [Exercise 2]: [X] sets × [X] reps (bodyweight)
   * 
   * Total: [X] exercises, [X] sets, [X] reps
   * #POWR"
   */
  generateWorkoutSocialContent(workoutData: CompletedWorkout): string {
    const stats = this.calculateSingleWorkoutStats(workoutData);
    const formattedDuration = this.formatDuration(stats.duration);
    const exerciseDetails = this.generateExerciseDetails(workoutData);
    
    const content = `Workout Complete! 💪
${workoutData.title}
Duration: ${formattedDuration}

${exerciseDetails}

Total: ${stats.exerciseCount} exercises, ${stats.totalSets} sets, ${stats.totalReps} reps
#POWR`;
    
    return content;
  }
  
  /**
   * Generate enhanced social content with additional context
   */
  generateEnhancedSocialContent(workoutData: CompletedWorkout): WorkoutSocialContent {
    const baseContent = this.generateWorkoutSocialContent(workoutData);
    const stats = this.calculateSingleWorkoutStats(workoutData);
    
    // Add optional intensity context if RPE data is available
    let enhancedContent = baseContent;
    if (stats.averageRPE > 0) {
      const intensityEmoji = stats.averageRPE >= 8 ? '🔥' : stats.averageRPE >= 6 ? '💪' : '✨';
      enhancedContent += ` ${intensityEmoji}`;
    }
    
    const hashtags = ['powr', 'fitness', 'workout'];
    
    // Add workout type specific hashtag if available
    if (workoutData.workoutType) {
      hashtags.push(workoutData.workoutType);
    }
    
    return {
      content: enhancedContent,
      hashtags,
      characterCount: enhancedContent.length
    };
  }
  
  /**
   * Generate achievement-focused social content for milestone workouts
   */
  generateAchievementContent(workoutData: CompletedWorkout): string {
    const stats = this.calculateSingleWorkoutStats(workoutData);
    
    // Check for notable achievements
    const achievements = [];
    
    if (stats.totalSets >= 20) {
      achievements.push('High Volume');
    }
    
    if (stats.duration >= 3600000) { // 60+ minutes
      achievements.push('Endurance');
    }
    
    if (stats.averageRPE >= 8) {
      achievements.push('High Intensity');
    }
    
    if (stats.exerciseCount >= 8) {
      achievements.push('Full Body');
    }
    
    let content = this.generateWorkoutSocialContent(workoutData);
    
    if (achievements.length > 0) {
      content += ` • ${achievements.join(' • ')}`;
    }
    
    return content;
  }
  
  /**
   * Validate social content for basic requirements
   */
  validateSocialContent(content: string): {
    valid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    
    if (content.length === 0) {
      return { valid: false, warnings: ['Content cannot be empty'] };
    }
    
    if (content.length > 2000) {
      warnings.push('Content is very long - consider shortening for better readability');
    }
    
    if (!content.includes('#POWR')) {
      warnings.push('Consider including #POWR hashtag for community visibility');
    }
    
    return {
      valid: true,
      warnings
    };
  }
  
  /**
   * Clean and format user-edited content
   */
  cleanUserContent(content: string): string {
    // Basic cleanup - trim whitespace, normalize line breaks
    return content
      .trim()
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive line breaks
      .replace(/\s{2,}/g, ' '); // Normalize multiple spaces
  }

  /**
   * Format duration from start and end timestamps or milliseconds
   */
  formatDuration(startTimeOrDuration: number, endTime?: number): string {
    const durationMs = endTime ? endTime - startTimeOrDuration : startTimeOrDuration;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Calculate workout statistics from completed sets
   */
  calculateWorkoutStats(completedSets: Array<{ reps: number; weight: number; exerciseRef: string }>): { totalSets: number; totalReps: number } {
    return {
      totalSets: completedSets.length,
      totalReps: completedSets.reduce((sum, set) => sum + set.reps, 0)
    };
  }

  /**
   * Calculate comprehensive single workout statistics
   */
  calculateSingleWorkoutStats(workoutData: CompletedWorkout): SingleWorkoutStats {
    const completedSets = workoutData.completedSets || [];
    const duration = workoutData.endTime - workoutData.startTime;
    
    // Count unique exercises
    const uniqueExercises = new Set(
      completedSets.map(set => set.exerciseRef.split(':')[2])
    );
    
    const totalReps = completedSets.reduce((sum, set) => sum + set.reps, 0);
    const totalVolume = completedSets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
    
    // Calculate average RPE if available
    const rpeValues = completedSets
      .map(set => set.rpe)
      .filter((rpe): rpe is number => rpe != null && rpe > 0);
    const averageRPE = rpeValues.length > 0 
      ? rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length 
      : 0;

    return {
      duration,
      exerciseCount: uniqueExercises.size,
      totalSets: completedSets.length,
      totalReps,
      totalVolume,
      averageRPE
    };
  }

  /**
   * Group sets by exercise for display
   */
  groupSetsByExercise(completedSets: Array<{ reps: number; weight: number; exerciseRef: string }>): Array<{ exerciseName: string; sets: Array<{ reps: number; weight: number; exerciseRef: string }> }> {
    const groups = new Map<string, Array<{ reps: number; weight: number; exerciseRef: string }>>();
    
    completedSets.forEach(set => {
      const exerciseId = set.exerciseRef.split(':')[2]; // Extract d-tag
      const exerciseName = exerciseId
        .split('-')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      if (!groups.has(exerciseName)) {
        groups.set(exerciseName, []);
      }
      groups.get(exerciseName)!.push(set);
    });
    
    return Array.from(groups.entries()).map(([exerciseName, sets]) => ({
      exerciseName,
      sets
    }));
  }

  /**
   * Generate shareable URL for a workout record
   * Creates nevent encoding for public sharing
   */
  generateWorkoutRecordURL(workoutRecord: ParsedWorkoutEvent): string {
    try {
      // Generate nevent encoding for the workout record
      const nevent = nip19.neventEncode({
        id: workoutRecord.eventId,
        author: workoutRecord.authorPubkey,
        kind: 1301, // NIP-101e workout record
        relays: ['wss://nos.lol', 'wss://relay.damus.io', 'wss://relay.primal.net']
      });

      // Generate public URL
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : 'https://powr.me'; // Fallback for server-side

      return `${baseUrl}/workout/${nevent}`;
    } catch (error) {
      console.error('[SocialSharingService] Failed to generate workout URL:', error);
      return '';
    }
  }

  /**
   * Generate naddr encoding for workout record (alternative sharing format)
   * Useful for cross-client compatibility
   */
  generateWorkoutRecordNaddr(workoutRecord: ParsedWorkoutEvent): string {
    try {
      // For Kind 1301 (workout records), we use nevent instead of naddr
      // since workout records are not replaceable events
      return this.generateWorkoutRecordNevent(workoutRecord);
    } catch (error) {
      console.error('[SocialSharingService] Failed to generate workout naddr:', error);
      return '';
    }
  }

  /**
   * Generate nevent encoding for workout record
   * Pure nevent string without URL wrapper
   */
  generateWorkoutRecordNevent(workoutRecord: ParsedWorkoutEvent): string {
    try {
      return nip19.neventEncode({
        id: workoutRecord.eventId,
        author: workoutRecord.authorPubkey,
        kind: 1301,
        relays: ['wss://nos.lol', 'wss://relay.damus.io', 'wss://relay.primal.net']
      });
    } catch (error) {
      console.error('[SocialSharingService] Failed to generate nevent:', error);
      return '';
    }
  }

  /**
   * Copy workout URL to clipboard
   * Returns success/failure status
   */
  async copyWorkoutURL(workoutRecord: ParsedWorkoutEvent): Promise<{ success: boolean; error?: string }> {
    try {
      const url = this.generateWorkoutRecordURL(workoutRecord);
      
      if (!url) {
        return { success: false, error: 'Failed to generate workout URL' };
      }

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        return { success: true };
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          return { success: true };
        } else {
          return { success: false, error: 'Failed to copy to clipboard' };
        }
      }
    } catch (error) {
      console.error('[SocialSharingService] Failed to copy URL:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Share workout using native share API (mobile)
   * Falls back to clipboard copy on desktop
   */
  async shareWorkout(workoutRecord: ParsedWorkoutEvent): Promise<{ success: boolean; error?: string }> {
    try {
      const url = this.generateWorkoutRecordURL(workoutRecord);
      const title = `${workoutRecord.title} - POWR Workout`;
      const text = `Check out my workout: ${workoutRecord.title}`;

      if (navigator.share && navigator.canShare) {
        const shareData = { title, text, url };
        
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return { success: true };
        }
      }

      // Fallback to clipboard copy
      return await this.copyWorkoutURL(workoutRecord);
    } catch (error) {
      console.error('[SocialSharingService] Failed to share workout:', error);
      
      // Fallback to clipboard copy on error
      return await this.copyWorkoutURL(workoutRecord);
    }
  }

  /**
   * Generate social sharing text with workout URL
   * Combines workout content with shareable link
   */
  generateSocialShareText(workoutRecord: ParsedWorkoutEvent): string {
    const url = this.generateWorkoutRecordURL(workoutRecord);
    
    // Convert ParsedWorkoutEvent to CompletedWorkout format for content generation
    const completedWorkout: CompletedWorkout = {
      workoutId: workoutRecord.eventId,
      title: workoutRecord.title,
      workoutType: 'strength', // Default type
      startTime: workoutRecord.createdAt * 1000, // Convert to milliseconds
      endTime: (workoutRecord.createdAt + workoutRecord.duration) * 1000,
      completedSets: workoutRecord.exercises.map((exercise, index) => ({
        exerciseRef: exercise.exerciseRef,
        setNumber: index + 1, // Generate set number from index
        reps: exercise.reps,
        weight: exercise.weight,
        rpe: exercise.rpe,
        setType: exercise.setType || 'normal',
        completedAt: workoutRecord.createdAt * 1000 // Use workout creation time
      }))
    };

    const socialContent = this.generateWorkoutSocialContent(completedWorkout);
    
    if (url) {
      return `${socialContent}

🔗 View workout: ${url}`;
    }

    return socialContent;
  }

  /**
   * Validate workout record for sharing
   * Ensures all required data is present
   */
  validateWorkoutForSharing(workoutRecord: ParsedWorkoutEvent): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!workoutRecord.eventId) {
      errors.push('Missing event ID');
    }

    if (!workoutRecord.authorPubkey) {
      errors.push('Missing author pubkey');
    }

    if (!workoutRecord.title || workoutRecord.title.trim().length === 0) {
      errors.push('Missing workout title');
    }

    if (!workoutRecord.exercises || workoutRecord.exercises.length === 0) {
      errors.push('No exercises found in workout');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance following service-layer-architecture.md
export const socialSharingService = new SocialSharingService();
