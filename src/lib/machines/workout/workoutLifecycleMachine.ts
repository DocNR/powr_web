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
import { publishEvent } from '@/lib/actors/globalNDKActor';
import { workoutAnalyticsService, type CompletedWorkout } from '@/lib/services/workoutAnalytics';

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
    // Real setup machine actor using workout analytics service
    setupMachine: fromPromise(async ({ input }: { input: SetupMachineInput }): Promise<SetupMachineOutput> => {
      console.log('[WorkoutLifecycle] Setup machine starting with input:', input);
      
      try {
        // Generate workout ID using service
        const workoutId = workoutAnalyticsService.generateWorkoutId();
        
        // For now, create a simple workout setup
        // TODO: Later this will fetch templates from NDK cache and show selection UI
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
    
    // Real active workout machine actor with NDK publishing
    activeWorkoutMachine: fromPromise(async ({ input }: { input: ActiveWorkoutMachineInput }): Promise<ActiveWorkoutMachineOutput> => {
      console.log('[WorkoutLifecycle] Active workout machine starting with input:', input);
      
      try {
        // Simulate workout completion with some test data
        const completedWorkout: CompletedWorkout = {
          workoutId: input.workoutData.workoutId,
          title: input.workoutData.title,
          workoutType: input.workoutData.workoutType,
          startTime: input.workoutData.startTime,
          endTime: Date.now(),
          completedSets: [
            {
              exerciseRef: workoutAnalyticsService.createExerciseReference(input.userInfo.pubkey, 'pushup-standard'),
              setNumber: 1,
              reps: 10,
              weight: 0,
              rpe: 7,
              setType: 'normal',
              completedAt: Date.now() - 300000 // 5 minutes ago
            },
            {
              exerciseRef: workoutAnalyticsService.createExerciseReference(input.userInfo.pubkey, 'pushup-standard'),
              setNumber: 2,
              reps: 8,
              weight: 0,
              rpe: 8,
              setType: 'normal',
              completedAt: Date.now() - 150000 // 2.5 minutes ago
            }
          ],
          notes: 'Great workout! Feeling strong today.'
        };
        
        // Validate workout data using service
        const validation = workoutAnalyticsService.validateWorkoutData(completedWorkout);
        if (!validation.valid) {
          throw new Error(`Workout validation failed: ${validation.errors.join(', ')}`);
        }
        
        // Generate NIP-101e event using service
        const eventData = workoutAnalyticsService.generateNIP101eEvent(completedWorkout, input.userInfo.pubkey);
        
        // Publish workout completion event using Global NDK Actor (confirmed publishing)
        console.log('[WorkoutLifecycle] Publishing workout completion event...');
        const publishResult = await publishEvent(eventData, `workout_${completedWorkout.workoutId}`);
        
        if (!publishResult.success) {
          console.warn('[WorkoutLifecycle] Publishing failed, but workout completed locally:', publishResult.error);
          // Continue anyway - workout is completed locally
        }
        
        const totalDuration = completedWorkout.endTime - completedWorkout.startTime;
        
        console.log('[WorkoutLifecycle] Workout completed successfully:', {
          workoutId: completedWorkout.workoutId,
          duration: Math.floor(totalDuration / 1000 / 60),
          sets: completedWorkout.completedSets.length,
          published: publishResult.success,
          eventId: publishResult.eventId
        });
        
        return {
          workoutData: completedWorkout,
          publishedEventId: publishResult.eventId || 'local-only',
          totalDuration: Math.floor(totalDuration / 1000) // seconds
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
