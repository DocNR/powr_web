/**
 * Workout Setup Machine
 * 
 * Handles template selection, loading, and workout configuration
 * for Phase 2 real NDK data flow validation.
 */

import { setup, assign, fromPromise } from 'xstate';
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
  
  // Preselected template support
  preselectedTemplateId: string | null;
  templateAuthorPubkey: string | null;
}

export type WorkoutSetupEvent =
  | { type: 'LOAD_TEMPLATES' }
  | { type: 'SELECT_TEMPLATE'; templateId: string }
  | { type: 'CONFIRM_TEMPLATE' }
  | { type: 'RETRY' }
  | { type: 'CANCEL' };

/**
 * Load available workout templates for the authenticated user
 */
export const loadTemplatesActor = fromPromise(async ({ input }: {
  input: { userPubkey: string }
}): Promise<WorkoutTemplate[]> => {
  console.log('[WorkoutSetupMachine] Loading available templates for user:', input.userPubkey.slice(0, 8) + '...');
  
  const ndk = getNDKInstance();
  if (!ndk) {
    throw new Error('NDK not initialized');
  }
  
  // Load all workout templates for this user
  const templateEvents = await ndk.fetchEvents({
    kinds: [33402], // NIP-101e workout template
    authors: [input.userPubkey],
    '#t': ['fitness']
  } as any);
  
  console.log('[WorkoutSetupMachine] Found template events:', templateEvents.size);
  
  // Parse templates from events
  const templates: WorkoutTemplate[] = Array.from(templateEvents).map(event => {
    const tagMap = new Map(event.tags.map(tag => [tag[0], tag]));
    
    const id = tagMap.get('d')?.[1] || 'unknown';
    const name = tagMap.get('title')?.[1] || 'Untitled Template';
    const description = event.content || 'No description';
    const difficultyValue = tagMap.get('difficulty')?.[1];
    const difficulty = (difficultyValue === 'beginner' || difficultyValue === 'intermediate' || difficultyValue === 'advanced') 
      ? difficultyValue 
      : undefined;
    const estimatedDuration = tagMap.get('duration')?.[1] ? parseInt(tagMap.get('duration')![1]) : undefined;
    
    // Extract exercise references
    const exerciseTags = event.tags.filter(tag => tag[0] === 'exercise');
    const exercises = exerciseTags.map(tag => ({
      exerciseRef: tag[1],
      sets: parseInt(tag[2]) || 3,
      reps: parseInt(tag[3]) || 10,
      weight: tag[4] ? parseInt(tag[4]) : undefined,
      restTime: 60
    }));
    
    return {
      id,
      name,
      description,
      exercises,
      estimatedDuration,
      difficulty,
      authorPubkey: event.pubkey,
      createdAt: event.created_at || Math.floor(Date.now() / 1000)
    };
  });
  
  console.log('[WorkoutSetupMachine] Parsed templates:', {
    count: templates.length,
    templates: templates.map(t => ({ id: t.id, name: t.name, exercises: t.exercises.length }))
  });
  
  return templates;
});

/**
 * Workout Setup Machine
 * 
 * Manages the template selection and loading workflow for Phase 2 validation.
 */
export const workoutSetupMachine = setup({
  types: {} as {
    context: WorkoutSetupContext;
    events: WorkoutSetupEvent;
    input: { userPubkey: string; preselectedTemplateId?: string; templateAuthorPubkey?: string };
    output: SetupMachineOutput;
  },
  actors: {
    loadTemplatesActor,
    loadTemplateActor
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
    preselectedTemplateId: input.preselectedTemplateId || null,
    templateAuthorPubkey: input.templateAuthorPubkey || null
  }),

  // XState v5 requires output at machine level for invoke to capture it
  output: ({ context }) => {
    console.log('[WorkoutSetupMachine] Creating output from context:', {
      hasLoadedTemplate: !!context.loadedTemplate,
      hasLoadedExercises: !!context.loadedExercises,
      loadedTemplate: context.loadedTemplate,
      loadedExercises: context.loadedExercises?.length
    });
    
    // The loadedTemplate comes from loadTemplateActor which uses dependency resolution service
    const template = context.loadedTemplate;
    const exercises = context.loadedExercises;
    
    // Ensure we always have valid data - create fallback if needed
    const templateId = template?.id || context.selectedTemplateId || context.preselectedTemplateId || 'default-template';
    const templatePubkey = template?.authorPubkey || context.templateAuthorPubkey || context.userPubkey;
    const templateName = template?.name || 'Custom Workout';
    
    // Create template selection from loaded template
    const templateSelection = {
      templateId,
      templatePubkey,
      templateReference: `33402:${templatePubkey}:${templateId}`,
      templateRelayUrl: ''
    };
    
    // Convert template exercises to workout exercises using real template data
    const workoutExercises = context.loadedTemplate?.exercises?.map((templateExercise) => {
      // Find the corresponding exercise details for the name
      const exerciseDetails = exercises?.find(ex => 
        templateExercise.exerciseRef.includes(ex.id)
      );
      
      return {
        // Display fields for modal:
        name: exerciseDetails?.name || 'Unknown Exercise',
        sets: templateExercise.sets,        // From template (could be undefined)
        reps: templateExercise.reps,        // From template (could be undefined)  
        weight: templateExercise.weight,    // From template (could be undefined)
        description: templateExercise.sets && templateExercise.reps 
          ? `${templateExercise.sets} sets × ${templateExercise.reps} reps`
          : 'Sets and reps to be determined',
        
        // Technical fields for business logic:
        exerciseRef: templateExercise.exerciseRef,
        restTime: templateExercise.restTime || 60  // Default rest time if not specified
      };
    }) || [];

    // Create workout data from loaded template
    const workoutId = `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const workoutData = {
      workoutId,
      title: templateName,
      startTime: Date.now(),
      completedSets: [],
      workoutType: 'strength' as const,
      exercises: workoutExercises
    };
    
    console.log('[WorkoutSetupMachine] Generated output:', {
      templateSelection,
      workoutData: {
        ...workoutData,
        exercises: workoutData.exercises.length
      }
    });
    
    // Always return valid output - never undefined
    return {
      templateSelection,
      workoutData
    };
  },
  
  states: {
    checkingPreselection: {
      always: [
        {
          target: 'loadingPreselectedTemplate',
          guard: ({ context }) => !!context.preselectedTemplateId,
          actions: assign({
            selectedTemplateId: ({ context }) => context.preselectedTemplateId
          })
        },
        {
          target: 'idle'
        }
      ]
    },

    idle: {
      on: {
        'LOAD_TEMPLATES': 'loadingTemplates'
      }
    },

    loadingPreselectedTemplate: {
      invoke: {
        src: 'loadTemplateActor',
        input: ({ context }) => ({
          templateId: context.selectedTemplateId!,
          userPubkey: context.templateAuthorPubkey || context.userPubkey
        }),
        onDone: {
          target: 'completed',
          actions: assign({
            loadedTemplate: ({ event }) => event.output.template,
            loadedExercises: ({ event }) => event.output.exercises,
            loadTime: ({ event }) => event.output.loadTime,
            error: null
          })
        },
        onError: {
          target: 'error',
          actions: assign({
            error: ({ event }) => `Failed to load preselected template: ${event.error}`
          })
        }
      }
    },
    
    loadingTemplates: {
      invoke: {
        src: 'loadTemplatesActor',
        input: ({ context }) => ({ userPubkey: context.userPubkey }),
        onDone: {
          target: 'templateSelection',
          actions: assign({
            availableTemplates: ({ event }) => event.output,
            error: null
          })
        },
        onError: {
          target: 'error',
          actions: assign({
            error: ({ event }) => `Failed to load templates: ${event.error}`
          })
        }
      }
    },
    
    templateSelection: {
      on: {
        'SELECT_TEMPLATE': {
          target: 'loadingTemplate',
          actions: assign({
            selectedTemplateId: ({ event }) => event.templateId,
            error: null
          })
        },
        'CANCEL': 'idle'
      }
    },
    
    loadingTemplate: {
      invoke: {
        src: 'loadTemplateActor',
        input: ({ context }) => ({
          templateId: context.selectedTemplateId!,
          userPubkey: context.userPubkey
        }),
        onDone: {
          target: 'templateLoaded',
          actions: assign({
            loadedTemplate: ({ event }) => event.output.template,
            loadedExercises: ({ event }) => event.output.exercises,
            loadTime: ({ event }) => event.output.loadTime,
            error: null
          })
        },
        onError: {
          target: 'error',
          actions: assign({
            error: ({ event }) => `Failed to load template: ${event.error}`
          })
        }
      }
    },
    
    templateLoaded: {
      on: {
        'CONFIRM_TEMPLATE': {
          target: 'completed'
        },
        'SELECT_TEMPLATE': {
          target: 'loadingTemplate',
          actions: assign({
            selectedTemplateId: ({ event }) => event.templateId,
            error: null
          })
        },
        'CANCEL': 'templateSelection'
      }
    },
    
    completed: {
      type: 'final'
    },
    
    error: {
      on: {
        'RETRY': 'loadingTemplates',
        'CANCEL': 'idle'
      }
    }
  }
});

export type WorkoutSetupMachine = typeof workoutSetupMachine;
