/**
 * Workout Setup Machine - Refactored for Service Integration
 * 
 * REMOVED: Inline NIP-101e parsing logic
 * ADDED: Proper service delegation to dataParsingService and dependencyResolutionService
 * 
 * Manages template selection, loading, and workout configuration
 * using centralized parsing services for consistency and performance.
 */

import { setup, assign, fromPromise } from 'xstate';
import { dataParsingService } from '@/lib/services/dataParsingService';
import { getNDKInstance } from '@/lib/ndk';
import { loadTemplateActor, type WorkoutTemplate, type ExerciseTemplate } from './actors/loadTemplateActor';
import type { SetupMachineOutput } from './types/workoutLifecycleTypes';

export interface WorkoutSetupContext {
  // Template selection
  availableTemplates: WorkoutTemplate[];
  selectedTemplateId: string | null;
  
  // Template loading
  loadedTemplate: WorkoutTemplate | null;
  loadedExercises: ExerciseTemplate[];
  loadTime: number;
  
  // Error handling
  error: string | null;
  
  // User context
  userPubkey: string;
  
  // Preselected template support - unified reference format
  templateReference: string | null;
}

export type WorkoutSetupEvent =
  | { type: 'LOAD_TEMPLATES' }
  | { type: 'SELECT_TEMPLATE'; templateId: string }
  | { type: 'CONFIRM_TEMPLATE' }
  | { type: 'RETRY' }
  | { type: 'CANCEL' };

/**
 * Load available workout templates for the authenticated user
 * 
 * REFACTORED: Now uses dataParsingService instead of inline parsing
 */
export const loadTemplatesActor = fromPromise(async ({ input }: {
  input: { userPubkey: string }
}): Promise<WorkoutTemplate[]> => {
  console.log('[WorkoutSetupMachine] Loading available templates for user:', input.userPubkey.slice(0, 8) + '...');
  
  const ndk = getNDKInstance();
  if (!ndk) {
    throw new Error('NDK not initialized');
  }
  
  try {
    // Fetch template events from NDK
    const templateEvents = await ndk.fetchEvents({
      kinds: [33402 as any], // NIP-101e workout template (custom kind)
      authors: [input.userPubkey],
      '#t': ['fitness']
    });
    
    console.log('[WorkoutSetupMachine] Found template events:', templateEvents.size);
    
    // ✅ DELEGATE TO SERVICE: Use dataParsingService instead of inline parsing
    const templates = dataParsingService.parseWorkoutTemplatesBatch(
      Array.from(templateEvents)
    );
    
    console.log('[WorkoutSetupMachine] Parsed templates via service:', {
      count: templates.length,
      templates: templates.map(t => ({ 
        id: t.id, 
        name: t.name, 
        exercises: t.exercises.length 
      }))
    });
    
    return templates;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[WorkoutSetupMachine] Template loading failed:', error);
    throw new Error(`Failed to load templates: ${errorMessage}`);
  }
});

/**
 * Workout Setup Machine
 * 
 * REFACTORED: Clean state coordination, no business logic
 * All parsing delegated to services for consistency and performance
 */
export const workoutSetupMachine = setup({
  types: {} as {
    context: WorkoutSetupContext;
    events: WorkoutSetupEvent;
    input: { userPubkey: string; templateReference?: string };
    output: SetupMachineOutput;
  },
  actors: {
    loadTemplatesActor,
    loadTemplateActor // Already using dependencyResolutionService
  }
}).createMachine({
  id: 'workoutSetup',
  initial: 'checkingPreselection',
  
  context: ({ input }) => ({
    availableTemplates: [],
    selectedTemplateId: null,
    loadedTemplate: null,
    loadedExercises: [],
    loadTime: 0,
    error: null,
    userPubkey: input.userPubkey,
    templateReference: input.templateReference || null
  }),

  // XState v5 requires output at machine level for invoke to capture it
  output: ({ context }) => {
    console.log('[WorkoutSetupMachine] 🔍 OUTPUT DEBUG: Creating output from context:', {
      hasLoadedTemplate: !!context.loadedTemplate,
      hasLoadedExercises: !!context.loadedExercises?.length,
      templateId: context.loadedTemplate?.id,
      templateName: context.loadedTemplate?.name,
      exerciseCount: context.loadedExercises?.length || 0
    });
    
    // Validate we have required data for workout creation
    if (!context.loadedTemplate) {
      console.error('[WorkoutSetupMachine] ❌ OUTPUT ERROR: No loaded template!');
      throw new Error('Cannot create workout: No template loaded');
    }
    
    if (!context.loadedExercises || context.loadedExercises.length === 0) {
      console.error('[WorkoutSetupMachine] ❌ OUTPUT ERROR: No loaded exercises!');
      throw new Error('Cannot create workout: No exercises loaded for template');
    }
    
    // Generate workout ID for this session
    const workoutId = `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create template selection using parsed template data
    const templateSelection = {
      templateId: context.loadedTemplate.id,
      template: context.loadedTemplate,
      templatePubkey: context.loadedTemplate.authorPubkey,
      templateReference: context.templateReference || `33402:${context.loadedTemplate.authorPubkey}:${context.loadedTemplate.id}`
    };
    
    // Create workout data structure
    const workoutData = {
      workoutId,
      templateId: context.loadedTemplate.id,
      title: `${context.loadedTemplate.name} - ${new Date().toLocaleDateString()}`,
      startTime: Date.now(),
      completedSets: [],
      exercises: context.loadedTemplate.exercises || [],
      workoutType: 'strength' as const,
      template: context.loadedTemplate,
      extraSetsRequested: {}
    };
    
    console.log('[WorkoutSetupMachine] ✅ OUTPUT SUCCESS: Generated complete setup data:', {
      workoutId,
      templateId: templateSelection.templateId,
      exerciseCount: workoutData.exercises.length,
      estimatedDuration: context.loadedTemplate.estimatedDuration
    });
    
    return {
      templateSelection,
      workoutData,
      // ✅ CRITICAL FIX: Include resolved template and exercises in output
      resolvedTemplate: context.loadedTemplate,
      resolvedExercises: context.loadedExercises
    };
  },
  
  states: {
    checkingPreselection: {
      always: [
        {
          guard: ({ context }) => !!context.templateReference,
          target: 'loadingPreselectedTemplate'
        },
        {
          target: 'loadingTemplates'
        }
      ]
    },
    
    loadingPreselectedTemplate: {
      invoke: {
        src: 'loadTemplateActor',
        input: ({ context }) => ({
          templateReference: context.templateReference!
        }),
        onDone: {
          target: 'templateLoaded',
          actions: [
            assign({
              loadedTemplate: ({ event }) => event.output.template,
              loadedExercises: ({ event }) => event.output.exercises,
              loadTime: ({ event }) => event.output.loadTime,
              selectedTemplateId: ({ event }) => event.output.template.id
            })
          ]
        },
        onError: {
          target: 'error',
          actions: [
            assign({
              error: ({ event }) => 
                `Failed to load preselected template: ${event.error instanceof Error ? event.error.message : 'Unknown error'}`
            })
          ]
        }
      }
    },
    
    loadingTemplates: {
      invoke: {
        src: 'loadTemplatesActor',
        input: ({ context }) => ({ userPubkey: context.userPubkey }),
        onDone: {
          target: 'selectingTemplate',
          actions: [
            assign({
              availableTemplates: ({ event }) => event.output
            })
          ]
        },
        onError: {
          target: 'error',
          actions: [
            assign({
              error: ({ event }) => 
                `Failed to load templates: ${event.error instanceof Error ? event.error.message : 'Unknown error'}`
            })
          ]
        }
      }
    },
    
    selectingTemplate: {
      on: {
        SELECT_TEMPLATE: {
          target: 'loadingSelectedTemplate',
          actions: [
            assign({
              selectedTemplateId: ({ event }) => event.templateId
            })
          ]
        },
        CANCEL: 'cancelled'
      }
    },
    
    loadingSelectedTemplate: {
      invoke: {
        src: 'loadTemplateActor',
        input: ({ context }) => {
          const selectedTemplate = context.availableTemplates.find(
            t => t.id === context.selectedTemplateId
          );
          
          if (!selectedTemplate) {
            throw new Error(`Selected template not found: ${context.selectedTemplateId}`);
          }
          
          // Generate template reference in correct format
          const templateReference = `33402:${selectedTemplate.authorPubkey}:${selectedTemplate.id}`;
          console.log('[WorkoutSetupMachine] Loading selected template:', templateReference);
          
          return { templateReference };
        },
        onDone: {
          target: 'templateLoaded',
          actions: [
            assign({
              loadedTemplate: ({ event }) => event.output.template,
              loadedExercises: ({ event }) => event.output.exercises,
              loadTime: ({ event }) => event.output.loadTime
            })
          ]
        },
        onError: {
          target: 'error',
          actions: [
            assign({
              error: ({ event }) => 
                `Failed to load selected template: ${event.error instanceof Error ? event.error.message : 'Unknown error'}`
            })
          ]
        }
      }
    },
    
    templateLoaded: {
      // Auto-confirm for preselected templates, manual confirm for user-selected templates
      always: [
        {
          guard: ({ context }) => !!context.templateReference,
          target: 'confirmed'
        }
      ],
      on: {
        CONFIRM_TEMPLATE: 'confirmed',
        SELECT_TEMPLATE: {
          target: 'loadingSelectedTemplate',
          actions: [
            assign({
              selectedTemplateId: ({ event }) => event.templateId,
              // Clear previous loaded data
              loadedTemplate: null,
              loadedExercises: []
            })
          ]
        },
        CANCEL: 'cancelled'
      }
    },
    
    confirmed: {
      type: 'final'
    },
    
    cancelled: {
      type: 'final'
    },
    
    error: {
      on: {
        RETRY: 'checkingPreselection',
        CANCEL: 'cancelled'
      }
    }
  }
});

// Export types for compatibility
export type { WorkoutTemplate, ExerciseTemplate };
