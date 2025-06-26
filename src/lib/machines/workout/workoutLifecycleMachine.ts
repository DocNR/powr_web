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
    // Setup machine actor (to be implemented)
    setupMachine: fromPromise(async ({ input }: { input: SetupMachineInput }): Promise<SetupMachineOutput> => {
      // TODO: Implement setup machine
      console.log('[WorkoutLifecycle] Setup machine input:', input);
      
      // Mock setup completion for now
      return {
        templateSelection: {
          templateId: input.preselectedTemplateId || 'default-template',
          customTitle: 'Test Workout'
        },
        workoutData: {
          workoutId: `workout_${Date.now()}`,
          title: 'Test Workout',
          startTime: Date.now(),
          completedSets: [],
          workoutType: 'strength'
        }
      };
    }),
    
    // Active workout machine actor (to be implemented)
    activeWorkoutMachine: fromPromise(async ({ input }: { input: ActiveWorkoutMachineInput }): Promise<ActiveWorkoutMachineOutput> => {
      // TODO: Implement active workout machine
      console.log('[WorkoutLifecycle] Active workout machine input:', input);
      
      // Mock workout completion for now
      return {
        workoutData: {
          ...input.workoutData,
          endTime: Date.now(),
          completedSets: [
            {
              exerciseRef: '33401:test:pushups',
              setNumber: 1,
              reps: 10,
              weight: 0,
              setType: 'normal',
              completedAt: Date.now()
            }
          ]
        },
        publishedEventId: `event_${Date.now()}`,
        totalDuration: 1800 // 30 minutes
      };
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
            'updateTemplateSelection',
            'updateWorkoutData',
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
      type: 'final',
      entry: ['logTransition']
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
