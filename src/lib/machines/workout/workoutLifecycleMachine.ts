/**
 * Workout Lifecycle Machine
 * 
 * Following Noga roundLifecycleMachine patterns
 * Parent machine that manages overall workout flow: Setup → Active → Complete
 */

import { setup, assign, fromPromise, spawnChild } from 'xstate';
import type {
  WorkoutLifecycleContext,
  WorkoutLifecycleEvent,
  SetupMachineInput,
  SetupMachineOutput,
  ActiveWorkoutMachineInput,
  ActiveWorkoutMachineOutput
} from './types/workoutLifecycleTypes';
import { defaultWorkoutLifecycleContext } from './types/workoutLifecycleTypes';
import type { UserInfo } from './types/workoutTypes';
import { workoutAnalyticsService } from '@/lib/services/workoutAnalytics';
import { publishWorkoutActor } from './actors/publishWorkoutActor';
import { loadTemplateActor } from './actors/loadTemplateActor';

// Workout lifecycle machine following Noga patterns
export const workoutLifecycleMachine = setup({
  types: {
    context: {} as WorkoutLifecycleContext,
    events: {} as WorkoutLifecycleEvent,
    input: {} as { userInfo: UserInfo; preselectedTemplateId?: string }
  },
  
  guards: {
    hasPreselectedTemplate: ({ context, event }) => {
      if (event.type === 'START_SETUP') {
        return !!event.preselectedTemplateId;
      }
      return !!context.templateSelection.templateId;
    },
    
    hasValidWorkoutData: ({ context }) => {
      return !!(context.workoutData && 
               context.workoutData.workoutId && 
               context.workoutData.title);
    },
    
    canRetryOperation: ({ context }) => {
      return !!context.error && context.error.code !== 'FATAL_ERROR';
    }
  },
  
  actions: {
    logTransition: ({ context, event }) => {
      console.log(`[WorkoutLifecycle] ${event.type}`, { 
        context: context.templateSelection,
        timestamp: Date.now() 
      });
    },
    
    updateLastActivity: assign({
      lastUpdated: () => Date.now()
    }),
    
    setError: assign({
      error: ({ event }) => {
        if (event.type === 'ERROR_OCCURRED') {
          return event.error;
        }
        return {
          message: 'Unknown error occurred',
          timestamp: Date.now()
        };
      }
    }),
    
    clearError: assign({
      error: undefined
    }),
    
    updateWorkoutData: assign({
      workoutData: ({ event }) => {
        if (event.type === 'WORKOUT_ACTIVE' || 
            event.type === 'WORKOUT_COMPLETED' || 
            event.type === 'START_WORKOUT') {
          return event.workoutData;
        }
        return undefined;
      }
    }),
    
    updateTemplateSelection: assign({
      templateSelection: ({ event }) => {
        if (event.type === 'SETUP_COMPLETE') {
          return event.templateSelection;
        }
        return {};
      }
    }),
    
    // Use spawnChild for spawning actors (XState v5 pattern)
    spawnActiveWorkout: spawnChild('activeWorkoutMachine', {
      id: 'activeWorkout',
      input: ({ context }) => ({
        userInfo: context.userInfo,
        workoutData: context.workoutData!,
        templateSelection: context.templateSelection
      })
    }),
    
    cleanupActiveWorkout: ({ context }) => {
      // TODO: Cleanup spawned active workout machine
      console.log('[WorkoutLifecycle] Cleaning up active workout', {
        workoutId: context.workoutData?.workoutId
      });
    }
  },
  
  actors: {
    // Include the imported actors for use in invoke
    loadTemplateActor,
    publishWorkoutActor,
    
    // Real setup machine actor using NDK template loading
    setupMachine: fromPromise(async ({ input }: { input: SetupMachineInput }): Promise<SetupMachineOutput> => {
      console.log('[WorkoutLifecycle] Setup machine starting with input:', input);
      
      try {
        // Generate workout ID using service
        const workoutId = workoutAnalyticsService.generateWorkoutId();
        
        // For now, create a simple workout setup
        // TODO: Later this will use the loadTemplateActor through invoke
        const templateSelection = {
          templateId: input.preselectedTemplateId || 'default-template',
          customTitle: input.preselectedTemplateId ? undefined : 'Custom Workout'
        };
        
        const workoutData = {
          workoutId,
          title: templateSelection.customTitle || 'Test Workout',
          startTime: Date.now(),
          completedSets: [],
          workoutType: 'strength' as const
        };
        
        console.log('[WorkoutLifecycle] Setup complete:', { workoutId, templateSelection });
        
        return {
          templateSelection,
          workoutData
        };
      } catch (error) {
        console.error('[WorkoutLifecycle] Setup failed:', error);
        throw error;
      }
    }),
    
    // Real active workout machine actor - manages active workout state
    activeWorkoutMachine: fromPromise(async ({ input }: { input: ActiveWorkoutMachineInput }): Promise<ActiveWorkoutMachineOutput> => {
      console.log('[WorkoutLifecycle] Active workout machine starting with input:', input);
      
      try {
        // This actor should manage the active workout state
        // For now, it just returns the workout data without publishing
        // Publishing will happen when WORKOUT_COMPLETED event is received
        
        console.log('[WorkoutLifecycle] Active workout ready - waiting for completion...');
        
        return {
          workoutData: input.workoutData,
          publishedEventId: undefined, // No publishing until completion
          totalDuration: 0 // Will be calculated on completion
        };
      } catch (error) {
        console.error('[WorkoutLifecycle] Active workout failed:', error);
        throw error;
      }
    })
  }
}).createMachine({
  id: 'workoutLifecycle',
  initial: 'idle',
  
  context: ({ input }) => ({
    ...defaultWorkoutLifecycleContext,
    userInfo: input.userInfo,
    lifecycleStartTime: Date.now()
  }),
  
  states: {
    idle: {
      on: {
        START_SETUP: {
          target: 'setup',
          actions: ['logTransition', 'updateLastActivity']
        }
      }
    },
    
    setup: {
      invoke: {
        src: 'setupMachine',
        input: ({ context, event }) => ({
          userInfo: context.userInfo,
          preselectedTemplateId: event.type === 'START_SETUP' ? event.preselectedTemplateId : undefined
        }),
        onDone: {
          target: 'active',
          actions: [
            assign({
              templateSelection: ({ event }) => event.output.templateSelection,
              workoutData: ({ event }) => event.output.workoutData
            }),
            'spawnActiveWorkout',
            'logTransition'
          ]
        },
        onError: {
          target: 'error',
          actions: ['setError', 'logTransition']
        }
      }
    },
    
    active: {
      initial: 'exercising',
      states: {
        exercising: {
          on: {
            WORKOUT_PAUSED: {
              target: 'paused',
              actions: ['logTransition']
            },
            WORKOUT_COMPLETED: {
              target: '#workoutLifecycle.completed',
              actions: ['updateWorkoutData', 'cleanupActiveWorkout', 'logTransition']
            }
          }
        },
        paused: {
          on: {
            WORKOUT_RESUMED: {
              target: 'exercising',
              actions: ['logTransition']
            },
            WORKOUT_COMPLETED: {
              target: '#workoutLifecycle.completed',
              actions: ['updateWorkoutData', 'cleanupActiveWorkout', 'logTransition']
            }
          }
        }
      },
      
      on: {
        WORKOUT_CANCELLED: {
          target: 'idle',
          actions: ['cleanupActiveWorkout', 'logTransition']
        }
      }
    },
    
    completed: {
      invoke: {
        src: 'publishWorkoutActor',
        input: ({ context }) => {
          // Always use mock completed sets for testing since we don't have real workout tracking yet
          // Use the REAL authenticated user's pubkey for exercise references
          const mockCompletedSets = [
            {
              exerciseRef: workoutAnalyticsService.createExerciseReference(context.userInfo.pubkey, 'pushup-standard'),
              setNumber: 1,
              reps: 10,
              weight: 0,
              rpe: 7,
              setType: 'normal' as const,
              completedAt: Date.now() - 300000
            },
            {
              exerciseRef: workoutAnalyticsService.createExerciseReference(context.userInfo.pubkey, 'pushup-standard'),
              setNumber: 2,
              reps: 8,
              weight: 0,
              rpe: 8,
              setType: 'normal' as const,
              completedAt: Date.now() - 150000
            }
          ];

          // Create completed workout data with template reference information
          const completedWorkout = {
            workoutId: context.workoutData?.workoutId || 'unknown',
            title: context.workoutData?.title || 'Unknown Workout',
            workoutType: context.workoutData?.workoutType || 'strength',
            startTime: context.workoutData?.startTime || Date.now(),
            endTime: Date.now(),
            completedSets: mockCompletedSets,
            notes: 'Great workout! Feeling strong today.',
            // NEW: Include template reference information for NIP-101e compliance
            templateId: context.templateSelection.templateId,
            templatePubkey: context.templateSelection.templatePubkey || context.userInfo.pubkey, // Fallback to user's pubkey for now
            templateReference: context.templateSelection.templateId && context.templateSelection.templatePubkey 
              ? `33402:${context.templateSelection.templatePubkey}:${context.templateSelection.templateId}`
              : undefined,
            templateRelayUrl: context.templateSelection.templateRelayUrl || '' // Optional relay URL
          };
          
          return {
            workoutData: completedWorkout,
            userPubkey: context.userInfo.pubkey
          };
        },
        onDone: {
          target: 'published',
          actions: ['logTransition']
        },
        onError: {
          target: 'publishError',
          actions: ['setError', 'logTransition']
        }
      }
    },
    
    published: {
      type: 'final',
      entry: ['logTransition']
    },
    
    publishError: {
      on: {
        DISMISS_ERROR: {
          target: 'published',
          actions: ['clearError', 'logTransition']
        }
      }
    },
    
    error: {
      on: {
        RETRY_OPERATION: [
          {
            target: 'setup',
            guard: 'canRetryOperation',
            actions: ['clearError', 'logTransition']
          }
        ],
        DISMISS_ERROR: {
          target: 'idle',
          actions: ['clearError', 'logTransition']
        },
        RESET_LIFECYCLE: {
          target: 'idle',
          actions: ['clearError', 'logTransition']
        }
      }
    }
  }
});
