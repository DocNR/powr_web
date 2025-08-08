/**
 * Save Template Actor for Modified Workout Templates
 * 
 * Creates new 33402 template from modified workout and adds to user's library
 * following service layer architecture and LibraryManagementService patterns.
 */

import { fromPromise } from 'xstate';
import { libraryManagementService } from '@/lib/services/libraryManagement';
import type { WorkoutData } from '../types/workoutTypes';

export interface SaveTemplateInput {
  workoutData: WorkoutData;
  userPubkey: string;
  templateName?: string;
}

export interface SaveTemplateOutput {
  success: boolean;
  templateId?: string;
  templateRef?: string;
  error?: string;
}

/**
 * Save Template Actor
 * 
 * Creates modified template (kind 33402) and adds to user's workout library
 * which automatically republishes the powr-workout-list collection (kind 30003).
 */
export const saveTemplateActor = fromPromise(async ({ input }: {
  input: SaveTemplateInput
}): Promise<SaveTemplateOutput> => {
  console.log('[SaveTemplateActor] Starting template save:', {
    workoutId: input.workoutData.workoutId,
    exerciseCount: input.workoutData.exercises?.length || 0,
    customName: input.templateName
  });
  
  try {
    // 1. Create the modified template (kind 33402)
    const newTemplate = await libraryManagementService.createModifiedTemplate(
      input.workoutData,
      input.userPubkey
    );
    
    console.log('[SaveTemplateActor] ✅ Template created:', {
      templateId: newTemplate.id,
      templateName: newTemplate.name,
      exerciseCount: newTemplate.exercises?.length || 0
    });
    
    // 2. Add to user's workout library (automatically republishes powr-workout-list)
    const templateRef = `33402:${input.userPubkey}:${newTemplate.id}`;
    
    await libraryManagementService.addToLibraryCollection(
      input.userPubkey,
      'WORKOUT_LIBRARY',
      templateRef
    );
    
    console.log('[SaveTemplateActor] ✅ Template added to library successfully');
    
    // Dispatch template save completion event for UI refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('powr-template-saved', {
        detail: {
          templateId: newTemplate.id,
          templateRef,
          timestamp: Date.now()
        }
      }));
    }
    
    return {
      success: true,
      templateId: newTemplate.id,
      templateRef
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown template save error';
    console.error('[SaveTemplateActor] ❌ Template save failed:', {
      error: errorMessage,
      workoutId: input.workoutData.workoutId
    });
    
    return {
      success: false,
      error: errorMessage
    };
  }
});
