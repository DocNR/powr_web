/**
 * Real NDK Template Loading Actor
 * 
 * Updated to use DependencyResolutionService for optimized template + exercise resolution.
 * Achieves <100ms single template resolution using proven CACHE_FIRST + batching patterns.
 */

import { fromPromise } from 'xstate';
import { dependencyResolutionService } from '@/lib/services/dependencyResolution';
import type { ResolvedTemplate } from '@/lib/services/dependencyResolution';

export interface LoadTemplateInput {
  templateReference: string;
}

// Re-export types from dependency resolution service for compatibility
export type { 
  WorkoutTemplate, 
  TemplateExercise, 
  Exercise as ExerciseTemplate,
  ResolvedTemplate as LoadTemplateOutput 
} from '@/lib/services/dependencyResolution';

/**
 * Optimized Template Loading Actor
 * 
 * Uses DependencyResolutionService for <100ms single template resolution
 * with proven CACHE_FIRST + batching optimization patterns.
 */
export const loadTemplateActor = fromPromise(async ({ input }: {
  input: LoadTemplateInput
}): Promise<ResolvedTemplate> => {
  console.log('[LoadTemplateActor] Loading template with optimized service:', {
    templateReference: input.templateReference
  });
  
  try {
    // Use the provided template reference directly (already in correct NIP-01 format)
    const templateRef = input.templateReference;
    
    console.log('[LoadTemplateActor] Using dependency resolution service for:', templateRef);
    
    // Use optimized service for single template + exercises resolution
    const result = await dependencyResolutionService.resolveSingleTemplate(templateRef);
    
    console.log('[LoadTemplateActor] ✅ Template loaded via service:', {
      templateId: result.template.id,
      templateName: result.template.name,
      exerciseCount: result.exercises.length,
      loadTime: `${result.loadTime}ms`
    });
    
    return result;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown template loading error';
    
    console.error('[LoadTemplateActor] ❌ Template loading failed:', {
      error: errorMessage,
      templateReference: input.templateReference
    });
    
    // Re-throw with context
    throw new Error(`Failed to load template ${input.templateReference}: ${errorMessage}`);
  }
});

// Removed: parseTemplateFromEvent and resolveExerciseDependencies
// These functions are now handled by DependencyResolutionService with proven optimization patterns
