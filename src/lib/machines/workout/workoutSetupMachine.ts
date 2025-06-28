/**
 * Workout Setup Machine
 * 
 * Handles template selection, loading, and workout configuration
 * for Phase 2 real NDK data flow validation.
 */

import { setup, assign, fromPromise } from 'xstate';
import { getNDKInstance } from '@/lib/ndk';
import { loadTemplateActor, type WorkoutTemplate } from './actors/loadTemplateActor';

export interface WorkoutSetupContext {
  // Template selection
  availableTemplates: WorkoutTemplate[];
  selectedTemplateId: string | null;
  
  // Template loading
  loadedTemplate: WorkoutTemplate | null;
  loadedExercises: any[];
  loadTime: number;
  
  // Error handling
  error: string | null;
  
  // User context
  userPubkey: string;
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
const loadTemplatesActor = fromPromise(async ({ input }: {
  input: { userPubkey: string }
}): Promise<WorkoutTemplate[]> => {
  console.log('[WorkoutSetupMachine] Loading available templates for user:', input.userPubkey.slice(0, 8) + '...');
  
  const ndk = getNDKInstance();
  if (!ndk) {
    throw new Error('NDK not initialized');
  }
  
  // Load all workout templates for this user
  const templateEvents = await ndk.fetchEvents({
    kinds: [33402 as any], // NIP-101e workout template
    authors: [input.userPubkey],
    '#t': ['fitness']
  });
  
  console.log('[WorkoutSetupMachine] Found template events:', templateEvents.size);
  
  // Parse templates from events
  const templates: WorkoutTemplate[] = Array.from(templateEvents).map(event => {
    const tagMap = new Map(event.tags.map(tag => [tag[0], tag]));
    
    const id = tagMap.get('d')?.[1] || 'unknown';
    const name = tagMap.get('title')?.[1] || 'Untitled Template';
    const description = event.content || 'No description';
    const difficulty = tagMap.get('difficulty')?.[1];
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
    input: { userPubkey: string };
  },
  actors: {
    loadTemplatesActor,
    loadTemplateActor
  }
}).createMachine({
  id: 'workoutSetup',
  initial: 'idle',
  
  context: ({ input }) => ({
    availableTemplates: [],
    selectedTemplateId: null,
    loadedTemplate: null,
    loadedExercises: [],
    loadTime: 0,
    error: null,
    userPubkey: input.userPubkey
  }),
  
  states: {
    idle: {
      on: {
        'LOAD_TEMPLATES': 'loadingTemplates'
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
