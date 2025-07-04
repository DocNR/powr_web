/**
 * Workout Lifecycle Machine
 * 
 * Following Noga roundLifecycleMachine patterns
 * Parent machine that manages overall workout flow: Setup → Active → Complete
 */

import { setup, assign } from 'xstate';
import type {
  WorkoutLifecycleContext,
  WorkoutLifecycleEvent,
  SetupMachineOutput
} from './types/workoutLifecycleTypes';
import { defaultWorkoutLifecycleContext } from './types/workoutLifecycleTypes';
import type { UserInfo, WorkoutData } from './types/workoutTypes';
import { workoutAnalyticsService } from '@/lib/services/workoutAnalytics';
import { publishWorkoutActor } from './actors/publishWorkoutActor';
import { loadTemplateActor } from './actors/loadTemplateActor';
import { workoutSetupMachine, loadTemplatesActor } from './workoutSetupMachine';
import { activeWorkoutMachine } from './activeWorkoutMachine';

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
    
    
    updateTemplateSelection: assign({
      templateSelection: ({ event }) => {
        if (event.type === 'SETUP_COMPLETE') {
          return event.templateSelection;
        }
        return {};
      }
    }),
    
    // Spawn active workout actor (following NOGA pattern exactly)
    spawnActiveWorkout: assign({
      activeWorkoutActor: ({ spawn, context, self }) => {
        console.log('[WorkoutLifecycleMachine] Spawning active workout actor...');
        console.log('[WorkoutLifecycleMachine] Context workoutData:', context.workoutData);
        
        if (!context.workoutData) {
          console.error('[WorkoutLifecycleMachine] No workout data available for spawning');
          self.send({ type: 'ERROR_OCCURRED', error: { message: 'No workout data available for spawning', timestamp: Date.now() } });
          return undefined;
        }
        
        // Type-safe context - we know workoutData is present after the check
        const input = {
          userInfo: context.userInfo,
          workoutData: context.workoutData as WorkoutData, // Type assertion needed for spawn
          templateSelection: context.templateSelection
        };
        
        console.log('[WorkoutLifecycleMachine] Spawn input:', input);
        console.log('[WorkoutLifecycleMachine] activeWorkoutMachine:', activeWorkoutMachine);
        
        try {
          const activeWorkoutActor = spawn('activeWorkoutMachine', {
            id: 'activeWorkout',
            input
          });
          
          console.log('[WorkoutLifecycleMachine] Spawned actor:', activeWorkoutActor);
          
          // Subscribe to actor state changes to detect completion
          activeWorkoutActor.subscribe((snapshot) => {
            console.log('[WorkoutLifecycleMachine] Active workout actor state changed:', snapshot.value, 'status:', snapshot.status);
            
            // When the activeWorkout reaches final state, complete the lifecycle
            if (snapshot.status === 'done' || snapshot.value === 'final') {
              console.log('[WorkoutLifecycleMachine] Active workout completed, sending COMPLETE event');
              self.send({ type: 'WORKOUT_COMPLETED', workoutData: (snapshot.output as { workoutData?: WorkoutData })?.workoutData });
            }
          });
          
          console.log('[WorkoutLifecycleMachine] Active workout actor spawned successfully');
          return activeWorkoutActor;
        } catch (spawnError) {
          console.error('[WorkoutLifecycleMachine] Error spawning actor:', spawnError);
          return undefined;
        }
      }
    }),

    // Stop and cleanup active workout actor
    stopActiveWorkout: () => {
      console.log('[WorkoutLifecycleMachine] Stopping active workout actor...');
      // The stopChild will be handled by the exit action in the state
    },

    // Clear active workout actor from context
    clearActiveWorkoutActor: assign({
      activeWorkoutActor: undefined
    })
  },
  
  actors: {
    // Include the imported actors for use in invoke
    loadTemplateActor,
    publishWorkoutActor,
    loadTemplatesActor,
    
    // Use direct reference to real setup machine (following NOGA pattern)
    setupMachine: workoutSetupMachine,
    
    // Register activeWorkoutMachine for spawning
    activeWorkoutMachine: activeWorkoutMachine
  }
}).createMachine({
  id: 'workoutLifecycle',
  initial: 'idle',
  
  context: ({ input }) => ({
    ...defaultWorkoutLifecycleContext,
    userInfo: input.userInfo,
    lifecycleStartTime: Date.now(),
    // Add activeWorkoutActor to context (following NOGA pattern)
    activeWorkoutActor: undefined,
    // Add preselectedTemplateId from input
    preselectedTemplateId: input.preselectedTemplateId
  }),
  
  states: {
    idle: {
      on: {
        START_SETUP: {
          target: 'setup',
          actions: [
            assign({
              preselectedTemplateId: ({ event }) => event.preselectedTemplateId,
              // Store templateAuthorPubkey from the event for passing to setup machine
              templateSelection: ({ event, context }) => ({
                ...context.templateSelection,
                templatePubkey: event.templateAuthorPubkey
              })
            }),
            'logTransition', 
            'updateLastActivity'
          ]
        }
      }
    },
    
    setup: {
      // ✅ NOGA PATTERN: Direct invoke of real setupMachine
      invoke: {
        src: 'setupMachine',
        input: ({ context }) => ({
          userPubkey: context.userInfo.pubkey,
          preselectedTemplateId: context.preselectedTemplateId,
          templateAuthorPubkey: context.templateSelection.templatePubkey
        }),
        onDone: {
          target: 'setupComplete',
          actions: [
            assign({
              templateSelection: ({ event }) => {
                console.log('[WorkoutLifecycle] ASSIGN ACTION - Raw event:', event);
                console.log('[WorkoutLifecycle] ASSIGN ACTION - Event output:', event.output);
                console.log('[WorkoutLifecycle] ASSIGN ACTION - Event output type:', typeof event.output);
                
                const output = event.output as SetupMachineOutput;
                console.log('[WorkoutLifecycle] ASSIGN ACTION - Parsed output:', output);
                console.log('[WorkoutLifecycle] ASSIGN ACTION - templateSelection:', output?.templateSelection);
                
                if (!output?.templateSelection) {
                  console.error('[WorkoutLifecycle] ASSIGN ACTION - No templateSelection in output!');
                  return {};
                }
                
                return output.templateSelection;
              },
              workoutData: ({ event }) => {
                const output = event.output as SetupMachineOutput;
                console.log('[WorkoutLifecycle] ASSIGN ACTION - workoutData:', output?.workoutData);
                
                if (!output?.workoutData) {
                  console.error('[WorkoutLifecycle] ASSIGN ACTION - No workoutData in output!');
                  // Return a fallback WorkoutData instead of undefined
                  return {
                    workoutId: 'fallback',
                    title: 'Fallback Workout',
                    startTime: Date.now(),
                    completedSets: [],
                    workoutType: 'strength' as const,
                    exercises: []
                  };
                }
                
                return output.workoutData;
              }
            }),
            'logTransition'
          ]
        },
        onError: {
          target: 'error',
          actions: ['setError', 'logTransition']
        }
      }
    },
    
    setupComplete: {
      entry: ['logTransition'],
      on: {
        START_WORKOUT: {
          target: 'active',
          actions: [
            'spawnActiveWorkout',
            'logTransition'
          ]
        },
        CANCEL_SETUP: {
          target: 'idle',
          actions: ['logTransition']
        }
      }
    },
    
    active: {
      // Spawn action already called in setup onDone (following NOGA pattern)
      entry: ['logTransition'],
      // Add exit action for cleanup
      exit: ['stopActiveWorkout', 'clearActiveWorkoutActor'],
      on: {
        WORKOUT_COMPLETED: {
          target: 'completed',
          actions: [
            assign({
              workoutData: ({ event, context }) => {
                if (event.workoutData) {
                  return event.workoutData;
                }
                if (context.workoutData) {
                  return context.workoutData;
                }
                // Fallback - should never happen in normal flow
                return {
                  workoutId: 'unknown',
                  title: 'Unknown Workout',
                  startTime: Date.now(),
                  completedSets: [],
                  workoutType: 'strength' as const,
                  exercises: []
                };
              }
            }),
            'logTransition'
          ]
        },
        WORKOUT_CANCELLED: {
          target: 'idle',
          actions: ['logTransition']
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
