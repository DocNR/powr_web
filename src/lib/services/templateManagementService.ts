/**
 * Template Management Service
 * 
 * Workout template creation, modification analysis, and smart naming.
 * Extracted from LibraryManagementService following Single Responsibility Principle.
 * 
 * Responsibilities:
 * - Template modification analysis
 * - Smart template naming
 * - Template creation from workout structures
 * - Template updating (owner-only)
 * - Workout change analysis
 * 
 * Follows service-layer-architecture.md - pure business logic only, no NDK operations.
 */

import { getNDKInstance } from '@/lib/ndk';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import type {
  TemplateAnalysis,
  TemplateStructure,
  TemplateChangeAnalysis
} from './types/libraryTypes';

/**
 * Template Management Service
 * 
 * Provides workout template management with smart analysis:
 * - Analyzes template modifications with smart thresholds
 * - Generates descriptive template names based on changes
 * - Creates NIP-101e compliant template events
 * - Handles both new template creation and existing template updates
 * - Simple change analysis for save prompt logic
 */
export class TemplateManagementService {

  /**
   * Analyze template modifications to determine if save prompt should be shown
   * Implements smart thresholds: any add/remove, 2+ substitutions, 3+ reorders
   */
  analyzeTemplateModifications(
    modifications: any,
    originalTemplate: any,
    userPubkey: string
  ): TemplateAnalysis {
    const isOwner = originalTemplate.authorPubkey === userPubkey;
    
    const addedCount = modifications.exercisesAdded?.length || 0;
    const removedCount = modifications.exercisesRemoved?.length || 0;
    const substitutedCount = modifications.exercisesSubstituted?.length || 0;
    const reorderedCount = modifications.exercisesReordered?.length || 0;
    
    // Smart thresholds
    const hasSignificantChanges = (
      addedCount > 0 ||
      removedCount > 0 ||
      substitutedCount >= 2 ||
      reorderedCount >= 3
    );
    
    const totalChanges = addedCount + removedCount + substitutedCount + reorderedCount;
    
    // Generate modification summary
    const summaryParts = [];
    if (addedCount > 0) summaryParts.push(`${addedCount} exercise${addedCount > 1 ? 's' : ''} added`);
    if (removedCount > 0) summaryParts.push(`${removedCount} exercise${removedCount > 1 ? 's' : ''} removed`);
    if (substitutedCount > 0) summaryParts.push(`${substitutedCount} exercise${substitutedCount > 1 ? 's' : ''} substituted`);
    if (reorderedCount > 0) summaryParts.push(`${reorderedCount} exercise${reorderedCount > 1 ? 's' : ''} reordered`);
    
    const modificationSummary = summaryParts.length > 0 
      ? summaryParts.join(', ')
      : 'No significant changes detected';
    
    console.log(`[TemplateManagementService] Template modification analysis:`, {
      isOwner,
      hasSignificantChanges,
      totalChanges,
      modificationSummary
    });
    
    return {
      isOwner,
      hasSignificantChanges,
      modificationSummary,
      totalChanges,
      canUpdateOriginal: isOwner,
      canSaveAsNew: true
    };
  }

  /**
   * Generate smart template name based on original template and modifications
   * Creates descriptive names showing relationship to original plus changes
   */
  generateSmartTemplateName(originalTemplate: any, modifications: any): string {
    const baseName = originalTemplate.name || 'Workout Template';
    
    const addedCount = modifications.exercisesAdded?.length || 0;
    const removedCount = modifications.exercisesRemoved?.length || 0;
    const substitutedCount = modifications.exercisesSubstituted?.length || 0;
    
    // Generate descriptive suffix based on modifications
    const suffixParts = [];
    
    if (addedCount > 0) {
      // Try to identify what was added
      const addedExercises = modifications.exercisesAdded || [];
      if (addedExercises.length === 1) {
        suffixParts.push('+ Extra');
      } else {
        suffixParts.push(`+ ${addedCount} Exercises`);
      }
    }
    
    if (removedCount > 0) {
      if (removedCount === 1) {
        suffixParts.push('(Modified)');
      } else {
        suffixParts.push(`(${removedCount} Removed)`);
      }
    }
    
    if (substitutedCount > 0) {
      suffixParts.push('(Custom)');
    }
    
    // Fallback for reorders or no specific changes
    if (suffixParts.length === 0) {
      suffixParts.push('(Modified)');
    }
    
    const smartName = `${baseName} ${suffixParts.join(' ')}`;
    
    console.log(`[TemplateManagementService] Generated smart template name:`, {
      original: baseName,
      generated: smartName,
      modifications: { addedCount, removedCount, substitutedCount }
    });
    
    return smartName;
  }

  /**
   * Build template from workout structure (enhanced to handle added exercises and extra sets)
   * Uses the actual workout state including added exercises and extra sets
   */
  buildTemplateFromWorkoutStructure(workoutData: any): TemplateStructure {
    console.log('[TemplateManagementService] Building template from workout structure:', {
      workoutTitle: workoutData?.title,
      exerciseCount: workoutData?.exercises?.length || 0
    });

    // Use the actual workout exercises including added exercises and account for extra sets
    const exercises = (workoutData?.exercises || []).map((exercise: any, exerciseIndex: number) => {
      // Get the base sets from the exercise
      const baseSets = exercise.sets || 3;
      
      // Account for extra sets requested via ADD_SET
      const extraSets = workoutData?.extraSetsRequested?.[exerciseIndex] || 0;
      const totalSets = baseSets + extraSets;
      
      console.log(`[TemplateManagementService] Exercise ${exerciseIndex} (${exercise.exerciseRef}): ${baseSets} base + ${extraSets} extra = ${totalSets} total sets`);
      
      return {
        exerciseRef: exercise.exerciseRef,
        name: exercise.exerciseName || exercise.name || 'Exercise',
        sets: totalSets, // Use total sets including extra sets
        reps: exercise.reps || 10,
        weight: exercise.weight || 0,
        rpe: exercise.rpe || 7,
        setType: exercise.setType || 'normal'
      };
    });

    // Generate template name
    const baseName = workoutData?.title?.replace(/ - \d{1,2}\/\d{1,2}\/\d{4}$/, '') || 'Workout Template';
    const templateName = `${baseName} (Modified)`;

    const result: TemplateStructure = {
      name: templateName,
      type: workoutData?.workoutType || 'strength',
      description: `Modified version of ${baseName}`,
      exercises
    };

    console.log('[TemplateManagementService] ✅ Built template from workout structure:', {
      name: result.name,
      exerciseCount: result.exercises.length,
      totalSets: result.exercises.reduce((sum: number, ex: any) => sum + ex.sets, 0)
    });

    return result;
  }

  /**
   * Create new modified template with NIP-101e compliance
   * Uses workout structure as it was when user hit "Finish"
   */
  async createModifiedTemplate(workoutData: any, userPubkey: string): Promise<any> {
    try {
      console.log(`[TemplateManagementService] Creating template from workout structure:`, {
        workoutTitle: workoutData?.title,
        userPubkey: userPubkey.slice(0, 8),
        exerciseCount: workoutData?.exercises?.length || 0
      });

      const ndk = getNDKInstance();
      if (!ndk || !userPubkey) {
        throw new Error('NDK not initialized or user not authenticated');
      }

      // Build template structure from workout data
      const templateData = this.buildTemplateFromWorkoutStructure(workoutData);

      // Generate unique d-tag for new template
      const dTag = `${templateData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;

      // Create exercise tags with proper NIP-101e set numbering
      const exerciseTags: string[][] = [];
      templateData.exercises.forEach(exercise => {
        // Create multiple tags for multi-set exercises (proper NIP-101e format)
        for (let setNum = 1; setNum <= exercise.sets; setNum++) {
          exerciseTags.push([
            'exercise',
            exercise.exerciseRef,
            '', // relay-url (empty)
            exercise.weight.toString(),
            exercise.reps.toString(),
            exercise.rpe.toString(),
            exercise.setType,
            setNum.toString() // Per-exercise set numbering (1,2,3 then reset)
          ]);
        }
      });

      console.log(`[TemplateManagementService] Generated ${exerciseTags.length} exercise tags with proper set numbering`);

      // Create NIP-101e compliant template event (kind 33402)
      const templateEvent = new NDKEvent(ndk, {
        kind: 33402,
        content: templateData.description || '',
        tags: [
          ['d', dTag],
          ['title', templateData.name], // NIP-101e uses "title", not "name"
          ['type', templateData.type],
          // Add properly structured exercise tags
          ...exerciseTags,
          ['t', 'fitness']
        ],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: userPubkey
      });

      // Publish the template
      await templateEvent.publish();
      console.log(`[TemplateManagementService] ✅ Modified template published:`, templateEvent.id);

      // Return template data
      return {
        id: dTag,
        name: templateData.name,
        type: templateData.type,
        description: templateData.description,
        exercises: templateData.exercises,
        authorPubkey: userPubkey,
        createdAt: templateEvent.created_at,
        eventId: templateEvent.id
      };

    } catch (error) {
      console.error('[TemplateManagementService] Failed to create modified template:', error);
      throw error;
    }
  }

  /**
   * Update existing template (owner-only, replaceable event)
   * Updates the original template with new data
   */
  async updateExistingTemplate(templateData: any, originalTemplate: any): Promise<any> {
    try {
      console.log(`[TemplateManagementService] Updating existing template:`, originalTemplate.id);

      const ndk = getNDKInstance();
      if (!ndk) {
        throw new Error('NDK not initialized');
      }

      // Create exercise tags with proper NIP-101e set numbering
      const exerciseTags: string[][] = [];
      (templateData.exercises || []).forEach((exercise: any, exerciseIndex: number) => {
        // Create multiple tags for multi-set exercises if sets > 1
        const sets = exercise.sets || 1;
        for (let setNum = 1; setNum <= sets; setNum++) {
          exerciseTags.push([
            'exercise',
            exercise.exerciseRef || `33401:${originalTemplate.authorPubkey}:unknown`,
            '', // relay-url (empty)
            (exercise.weight || 0).toString(),
            (exercise.reps || 0).toString(),
            (exercise.rpe || 7).toString(),
            exercise.setType || 'normal',
            setNum.toString() // Per-exercise set numbering
          ]);
        }
      });

      // Create updated template event (replaceable, same d-tag)
      const updatedTemplateEvent = new NDKEvent(ndk, {
        kind: 33402,
        content: templateData.description || originalTemplate.description || '',
        tags: [
          ['d', originalTemplate.id], // Same d-tag for replacement
          ['title', templateData.name], // NIP-101e uses "title", not "name"
          ['type', templateData.type || originalTemplate.type || 'strength'],
          // Add updated exercise tags with proper set numbering
          ...exerciseTags,
          ['t', 'fitness']
        ],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: originalTemplate.authorPubkey
      });

      // Publish the updated template
      await updatedTemplateEvent.publish();
      console.log(`[TemplateManagementService] ✅ Template updated:`, updatedTemplateEvent.id);

      // Return updated template data
      return {
        ...originalTemplate,
        name: templateData.name,
        type: templateData.type || originalTemplate.type,
        description: templateData.description || originalTemplate.description,
        exercises: templateData.exercises || originalTemplate.exercises,
        eventId: updatedTemplateEvent.id
      };

    } catch (error) {
      console.error('[TemplateManagementService] Failed to update existing template:', error);
      throw error;
    }
  }

  /**
   * Simple template modification analysis for save prompt
   * Following "simple solutions first" - any modification = save prompt
   */
  analyzeWorkoutForTemplateChanges(workoutData: any): TemplateChangeAnalysis {
    const modifications = workoutData.modifications || {};
    const hasModifications = (
      (modifications.exercisesAdded?.length || 0) > 0 ||
      (modifications.exercisesRemoved?.length || 0) > 0 ||
      (modifications.exercisesSubstituted?.length || 0) > 0 ||
      (modifications.exercisesReordered?.length || 0) > 0
    );
    
    const originalTemplate = workoutData.originalTemplate;
    const isOwner = originalTemplate?.templatePubkey === workoutData.userPubkey;
    
    console.log('[TemplateManagementService] Template modification analysis:', {
      hasModifications,
      modificationCount: modifications.totalModifications || 0,
      isOwner,
      templateName: originalTemplate?.templateId || 'Unknown'
    });
    
    return {
      hasModifications,
      modificationCount: modifications.totalModifications || 0,
      suggestedName: `${originalTemplate?.templateId || 'Workout'} (Modified)`,
      isOwner
    };
  }

  /**
   * Create template from custom workout (no original template)
   * Used when user creates a workout from scratch
   */
  async createCustomTemplate(
    templateName: string,
    templateDescription: string,
    workoutData: any,
    userPubkey: string
  ): Promise<any> {
    try {
      console.log(`[TemplateManagementService] Creating custom template:`, {
        templateName,
        userPubkey: userPubkey.slice(0, 8),
        exerciseCount: workoutData?.exercises?.length || 0
      });

      const ndk = getNDKInstance();
      if (!ndk || !userPubkey) {
        throw new Error('NDK not initialized or user not authenticated');
      }

      // Build template structure from workout data
      const templateStructure = this.buildTemplateFromWorkoutStructure(workoutData);
      
      // Override with custom name and description
      templateStructure.name = templateName;
      templateStructure.description = templateDescription;

      // Generate unique d-tag for new template
      const dTag = `${templateName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;

      // Create exercise tags with proper NIP-101e set numbering
      const exerciseTags: string[][] = [];
      templateStructure.exercises.forEach(exercise => {
        // Create multiple tags for multi-set exercises (proper NIP-101e format)
        for (let setNum = 1; setNum <= exercise.sets; setNum++) {
          exerciseTags.push([
            'exercise',
            exercise.exerciseRef,
            '', // relay-url (empty)
            exercise.weight.toString(),
            exercise.reps.toString(),
            exercise.rpe.toString(),
            exercise.setType,
            setNum.toString() // Per-exercise set numbering
          ]);
        }
      });

      console.log(`[TemplateManagementService] Generated ${exerciseTags.length} exercise tags for custom template`);

      // Create NIP-101e compliant template event (kind 33402)
      const templateEvent = new NDKEvent(ndk, {
        kind: 33402,
        content: templateDescription || '',
        tags: [
          ['d', dTag],
          ['title', templateName], // NIP-101e uses "title", not "name"
          ['type', templateStructure.type],
          // Add properly structured exercise tags
          ...exerciseTags,
          ['t', 'fitness']
        ],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: userPubkey
      });

      // Publish the template
      await templateEvent.publish();
      console.log(`[TemplateManagementService] ✅ Custom template published:`, templateEvent.id);

      // Return template data
      return {
        id: dTag,
        name: templateName,
        type: templateStructure.type,
        description: templateDescription,
        exercises: templateStructure.exercises,
        authorPubkey: userPubkey,
        createdAt: templateEvent.created_at,
        eventId: templateEvent.id
      };

    } catch (error) {
      console.error('[TemplateManagementService] Failed to create custom template:', error);
      throw error;
    }
  }

  /**
   * Validate template data before creation/update
   * Ensures all required fields are present and valid
   */
  validateTemplateData(templateData: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!templateData.name || templateData.name.trim().length === 0) {
      errors.push('Template name is required');
    }

    if (!templateData.exercises || templateData.exercises.length === 0) {
      errors.push('Template must have at least one exercise');
    }

    // Validate exercises
    if (templateData.exercises) {
      templateData.exercises.forEach((exercise: any, index: number) => {
        if (!exercise.exerciseRef) {
          errors.push(`Exercise ${index + 1} is missing exercise reference`);
        }
        
        if (!exercise.name || exercise.name.trim().length === 0) {
          warnings.push(`Exercise ${index + 1} is missing name`);
        }

        if (exercise.sets <= 0) {
          errors.push(`Exercise ${index + 1} must have at least 1 set`);
        }

        if (exercise.reps <= 0) {
          errors.push(`Exercise ${index + 1} must have at least 1 rep`);
        }
      });
    }

    // Check template name length
    if (templateData.name && templateData.name.length > 100) {
      warnings.push('Template name is very long and may be truncated');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate template preview for user confirmation
   * Shows what the template will look like before saving
   */
  generateTemplatePreview(templateData: TemplateStructure): {
    name: string;
    type: string;
    description: string;
    exerciseCount: number;
    totalSets: number;
    estimatedDuration: number;
    exercises: Array<{
      name: string;
      sets: number;
      reps: number;
      weight: number;
    }>;
  } {
    const totalSets = templateData.exercises.reduce((sum, ex) => sum + ex.sets, 0);
    const estimatedDuration = Math.round((totalSets * 2.5 + templateData.exercises.length * 1.5) / 60); // Rough estimate in minutes

    return {
      name: templateData.name,
      type: templateData.type,
      description: templateData.description,
      exerciseCount: templateData.exercises.length,
      totalSets,
      estimatedDuration,
      exercises: templateData.exercises.map(ex => ({
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight
      }))
    };
  }
}

// Export singleton instance following service-layer-architecture.md
export const templateManagementService = new TemplateManagementService();
