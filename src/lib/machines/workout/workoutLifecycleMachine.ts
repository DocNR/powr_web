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
import { publishWorkoutActor } from './actors/publishWorkoutActor';
import { publishSocialNoteActor } from './actors/publishSocialNoteActor';
import { loadTemplateActor } from './actors/loadTemplateActor';
import { workoutSetupMachine, loadTemplatesActor } from './workoutSetupMachine';
import { activeWorkoutMachine } from './activeWorkoutMachine';

// Workout lifecycle machine following Noga patterns
export const workoutLifecycleMachine = setup({
  types: {
    context: {} as WorkoutLifecycleContext,
    events: {} as WorkoutLifecycleEvent,
    input: {} as { userInfo: UserInfo; templateReference?: string }
  },
  
  guards: {
    hasPreselectedTemplate: ({ context, event }) => {
      if (event.type === 'START_SETUP') {
        return !!event.templateReference;
      }
      return !!context.templateReference;
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
        console.log('[WorkoutLifecycleMachine] 🚀 SPAWN DEBUG: Starting spawn process...');
        console.log('[WorkoutLifecycleMachine] 🚀 SPAWN DEBUG: Context templateSelection:', JSON.stringify(context.templateSelection, null, 2));
        console.log('[WorkoutLifecycleMachine] 🚀 SPAWN DEBUG: Context workoutData:', context.workoutData);
        
        // Verify we have required data before proceeding
        if (!context.workoutData) {
          console.error('[WorkoutLifecycleMachine] ❌ Cannot spawn active workout: workoutData is missing');
          self.send({ type: 'ERROR_OCCURRED', error: { message: 'Cannot start workout: missing workout data', code: 'MISSING_DATA', timestamp: Date.now() } });
          return undefined;
        }
        
        // Use template reference directly (corruption fixed at source)
        const templateReference = context.templateSelection.templateReference;
        
        console.log('[WorkoutLifecycleMachine] 🔍 CRITICAL DEBUG: templateReference before spawn:', templateReference);
        console.log('[WorkoutLifecycleMachine] 🔍 CRITICAL DEBUG: templateReference type:', typeof templateReference);
        console.log('[WorkoutLifecycleMachine] 🔍 CRITICAL DEBUG: templateReference length:', templateReference?.length);
        
        if (!templateReference) {
          console.error('[WorkoutLifecycleMachine] ❌ Cannot spawn active workout: template reference is missing');
          self.send({ type: 'ERROR_OCCURRED', error: { message: 'Cannot start workout: invalid template reference', code: 'INVALID_TEMPLATE', timestamp: Date.now() } });
          return undefined;
        }
        
        const parts = templateReference.split(':');
        console.log('[WorkoutLifecycleMachine] 🔍 CRITICAL DEBUG: templateReference parts:', parts);
        console.log('[WorkoutLifecycleMachine] 🔍 CRITICAL DEBUG: parts length:', parts.length);
        
        if (parts.length !== 3) {
          console.error('[WorkoutLifecycleMachine] ❌ CORRUPTION DETECTED IN LIFECYCLE MACHINE:', {
            templateReference: templateReference,
            parts,
            partsLength: parts.length,
            expectedFormat: 'kind:pubkey:d-tag'
          });
          self.send({ type: 'ERROR_OCCURRED', error: { message: 'Cannot start workout: corrupted template reference', code: 'CORRUPTED_REFERENCE', timestamp: Date.now() } });
          return undefined;
        }
        
        console.log('[WorkoutLifecycleMachine] ✅ Template reference format is valid in lifecycle machine');
        
        // Use template selection as-is
        const cleanTemplateSelection = context.templateSelection;
        
        const input = {
          userInfo: context.userInfo,
          workoutData: context.workoutData as WorkoutData, // Safe assertion since we've already checked it exists
          templateSelection: cleanTemplateSelection,
          // ✅ ADD: Pass resolved data from setup machine to eliminate duplicate service calls
          resolvedTemplate: context.resolvedTemplate as {
            id: string;
            name: string;
            exercises: Array<{
              exerciseRef: string;
              weight?: number;
              reps?: number;
              sets?: number;
            }>;
          } | undefined,
          resolvedExercises: context.resolvedExercises as Array<{
            id: string;
            name: string;
            authorPubkey: string;
            equipment?: string;
            muscleGroups?: string[];
          }> | undefined
        };
        
        console.log('[WorkoutLifecycleMachine] 🚀 SPAWN DEBUG: Final spawn input:', JSON.stringify(input, null, 2));
        console.log('[WorkoutLifecycleMachine] 🚀 SPAWN DEBUG: activeWorkoutMachine:', activeWorkoutMachine);
        
        try {
          const activeWorkoutActor = spawn('activeWorkoutMachine', {
            id: 'activeWorkout',
            input
          });
          
          console.log('[WorkoutLifecycleMachine] 🚀 SPAWN DEBUG: Spawned actor successfully:', activeWorkoutActor);
          
          // Subscribe to actor state changes to detect completion
          activeWorkoutActor.subscribe((snapshot) => {
            console.log('[WorkoutLifecycleMachine] 🔄 Active workout actor state changed:', {
              state: snapshot.value,
              status: snapshot.status,
              hasOutput: !!snapshot.output
            });
            
            // When the activeWorkout reaches final state, complete the lifecycle
            if (snapshot.status === 'done') {
              console.log('[WorkoutLifecycleMachine] ✅ Active workout completed successfully');
              
              // Note: The activeWorkoutMachine sends workout data via sendParent mechanism
              // We don't need to access output here - the WORKOUT_COMPLETED event 
              // will be sent automatically by the activeWorkoutMachine with the real data
              console.log('[WorkoutLifecycleMachine] 📤 Waiting for WORKOUT_COMPLETED event from activeWorkoutMachine...');
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
    publishSocialNoteActor,
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
    userInfo: input?.userInfo || { pubkey: '', displayName: 'Unknown User' },
    lifecycleStartTime: Date.now(),
    // Add activeWorkoutActor to context (following NOGA pattern)
    activeWorkoutActor: undefined,
    // Add templateReference from input
    templateReference: input?.templateReference
  }),
  
  states: {
    idle: {
      on: {
        START_SETUP: {
          target: 'setup',
          actions: [
            assign({
              templateReference: ({ event }) => event.templateReference
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
          templateReference: context.templateReference
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
              },
              // ✅ CRITICAL FIX: Store resolved template and exercises from setup machine output
              resolvedTemplate: ({ event }) => {
                const output = event.output as SetupMachineOutput;
                console.log('[WorkoutLifecycle] ASSIGN ACTION - resolvedTemplate:', output?.resolvedTemplate);
                
                if (!output?.resolvedTemplate) {
                  console.warn('[WorkoutLifecycle] ASSIGN ACTION - No resolvedTemplate in output!');
                  return undefined;
                }
                
                return output.resolvedTemplate;
              },
              resolvedExercises: ({ event }) => {
                const output = event.output as SetupMachineOutput;
                console.log('[WorkoutLifecycle] ASSIGN ACTION - resolvedExercises:', output?.resolvedExercises);
                
                if (!output?.resolvedExercises) {
                  console.warn('[WorkoutLifecycle] ASSIGN ACTION - No resolvedExercises in output!');
                  return undefined;
                }
                
                return output.resolvedExercises;
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
          guard: 'hasValidWorkoutData',
          actions: [
            'spawnActiveWorkout',
            'logTransition'
          ]
        },
        START_SETUP: {
          target: 'setup',
          actions: [
            assign({
              templateReference: ({ event }) => event.templateReference
            }),
            'logTransition', 
            'updateLastActivity'
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
      initial: 'expanded',
      states: {
        expanded: {
          on: {
            MINIMIZE_INTERFACE: {
              target: 'minimized',
              actions: ['logTransition']
            }
          }
        },
        minimized: {
          on: {
            EXPAND_INTERFACE: {
              target: 'expanded',
              actions: ['logTransition']
            }
          }
        }
      },
      on: {
        // Handle WORKOUT_COMPLETED event from sendParent in activeWorkoutMachine
        WORKOUT_COMPLETED: {
          target: 'completed',
          actions: [
            assign({
              // Store the complete workout data from activeWorkoutMachine
              workoutData: ({ event, context }) => {
                console.log('[WorkoutLifecycle] 🔄 WORKOUT_COMPLETED event received via sendParent');
                console.log('[WorkoutLifecycle] 🔍 Event workoutData:', {
                  hasEventData: !!event.workoutData,
                  completedSets: event.workoutData?.completedSets?.length || 0,
                  extraSetsRequested: Object.keys(event.workoutData?.extraSetsRequested || {}).length,
                  workoutId: event.workoutData?.workoutId
                });
                
                if (event.workoutData) {
                  console.log('[WorkoutLifecycle] ✅ Using real workout data from activeWorkoutMachine sendParent');
                  // Ensure we have all the required fields for publishing
                  const completeWorkoutData = {
                    ...event.workoutData,
                    // Ensure endTime is set if not already
                    endTime: event.workoutData.endTime || Date.now(),
                    // Preserve all completed sets and extra sets data
                    completedSets: event.workoutData.completedSets || [],
                    extraSetsRequested: event.workoutData.extraSetsRequested || {}
                  };
                  
                  console.log('[WorkoutLifecycle] 📊 Final workout data for publishing:', {
                    workoutId: completeWorkoutData.workoutId,
                    completedSetsCount: completeWorkoutData.completedSets.length,
                    extraSetsCount: Object.keys(completeWorkoutData.extraSetsRequested).length,
                    hasEndTime: !!completeWorkoutData.endTime
                  });
                  
                  return completeWorkoutData;
                }
                
                // Fallback to context data (should not happen in normal flow)
                if (context.workoutData) {
                  console.warn('[WorkoutLifecycle] ⚠️ Using context workout data as fallback');
                  return {
                    ...context.workoutData,
                    endTime: Date.now(),
                    completedSets: context.workoutData.completedSets || [],
                    extraSetsRequested: context.workoutData.extraSetsRequested || {}
                  };
                }
                
                // This should never happen in normal operation
                console.warn('[WorkoutLifecycle] ⚠️ No workout data available - using minimal fallback');
                return {
                  workoutId: `fallback_${Date.now()}`,
                  title: 'Fallback Workout Record',
                  startTime: Date.now() - 1800000, // 30 minutes ago
                  endTime: Date.now(),
                  completedSets: [],
                  workoutType: 'strength' as const,
                  exercises: [],
                  extraSetsRequested: {}
                };
              }
            }),
            'logTransition'
          ]
        },
        START_SETUP: {
          target: 'setup',
          actions: [
            assign({
              templateReference: ({ event }) => event.templateReference
            }),
            'logTransition', 
            'updateLastActivity'
          ]
        },
        WORKOUT_CANCELLED: {
          target: 'idle',
          actions: ['logTransition']
        }
      }
    },
    
    completed: {
      entry: [
        'logTransition',
        // Spawn publishing actor for optimistic background publishing
        assign({
          publishingActor: ({ spawn, context }: { spawn: (src: string, options: { input: { workoutData: any; userPubkey: string } }) => any; context: WorkoutLifecycleContext }) => {
            console.log('[WorkoutLifecycle] 📤 PUBLISHING PHASE: Starting optimistic background publishing');
            console.log('[WorkoutLifecycle] 📊 Context workout data analysis:', {
              hasWorkoutData: !!context.workoutData,
              workoutId: context.workoutData?.workoutId,
              completedSetsCount: context.workoutData?.completedSets?.length || 0,
              extraSetsCount: Object.keys(context.workoutData?.extraSetsRequested || {}).length,
              hasEndTime: !!context.workoutData?.endTime,
              templateId: context.templateSelection?.templateId
            });

            // ✅ CRITICAL FIX: Ensure we're using the updated workout data from WORKOUT_COMPLETED event
            if (!context.workoutData || !context.workoutData.completedSets) {
              console.error('[WorkoutLifecycle] ❌ PUBLISHING ERROR: No completed sets data available!');
              console.error('[WorkoutLifecycle] 📊 Available context:', {
                hasWorkoutData: !!context.workoutData,
                workoutDataKeys: context.workoutData ? Object.keys(context.workoutData) : [],
                templateSelection: context.templateSelection
              });
            }

            // Create completed workout data using the REAL data from activeWorkoutMachine
            const completedWorkout = {
              workoutId: context.workoutData?.workoutId || `workout_${Date.now()}`,
              title: context.workoutData?.title || 'Completed Workout',
              workoutType: (context.workoutData?.workoutType || 'strength') as 'strength' | 'circuit' | 'emom' | 'amrap',
              startTime: context.workoutData?.startTime || Date.now(),
              endTime: context.workoutData?.endTime || Date.now(),
              // ✅ CRITICAL FIX: Use the real completed sets from activeWorkoutMachine
              completedSets: context.workoutData?.completedSets || [],
              notes: context.workoutData?.notes,
              // Template information for NIP-101e compliance
              templateId: context.templateSelection?.templateId,
              templatePubkey: context.templateSelection?.templatePubkey || context.userInfo.pubkey,
              templateReference: context.templateSelection?.templateReference,
              templateRelayUrl: context.templateSelection?.templateRelayUrl || '',
              // Include extra sets information for debugging
              extraSetsRequested: context.workoutData?.extraSetsRequested || {}
            };
            
            console.log('[WorkoutLifecycle] 📤 FINAL PUBLISHING DATA:', {
              workoutId: completedWorkout.workoutId,
              title: completedWorkout.title,
              completedSetsCount: completedWorkout.completedSets.length,
              extraSetsCount: Object.keys(completedWorkout.extraSetsRequested).length,
              templateId: completedWorkout.templateId,
              templateReference: completedWorkout.templateReference,
              hasValidData: completedWorkout.completedSets.length > 0
            });
            
            // ✅ VALIDATION: Ensure we have actual workout data to publish
            if (completedWorkout.completedSets.length === 0) {
              console.warn('[WorkoutLifecycle] ⚠️ WARNING: Publishing workout with 0 completed sets!');
            }
            
            // Spawn the publishing actor (fire-and-forget)
            return spawn('publishWorkoutActor', {
              input: {
                workoutData: completedWorkout,
                userPubkey: context.userInfo.pubkey
              }
            });
          }
        })
      ],
      // Immediate transition to summary - no waiting for publishing
      always: {
        target: 'summary'
      },
      on: {
        START_SETUP: {
          target: 'setup',
          actions: [
            assign({
              templateReference: ({ event }) => event.templateReference
            }),
            'logTransition', 
            'updateLastActivity'
          ]
        }
      }
    },
    
    summary: {
      entry: ['logTransition'],
      on: {
        SHARE_WORKOUT: {
          target: 'sharing',
          actions: ['logTransition']
        },
        SKIP_SHARING: {
          target: 'idle',
          actions: ['logTransition']
        },
        CLOSE_SUMMARY: {
          target: 'idle',
          actions: ['logTransition']
        },
        START_SETUP: {
          target: 'setup',
          actions: [
            assign({
              templateReference: ({ event }) => event.templateReference
            }),
            'logTransition', 
            'updateLastActivity'
          ]
        }
      }
    },
    
    sharing: {
      entry: ['logTransition'],
      invoke: {
        src: 'publishSocialNoteActor',
        input: ({ context, event }) => {
          console.log('[WorkoutLifecycle] 📱 SOCIAL SHARING: Preparing social note for publishing');
          
          if (event.type !== 'SHARE_WORKOUT') {
            console.error('[WorkoutLifecycle] ❌ SHARING ERROR: Invalid event type for sharing state');
            return {
              content: 'Workout Complete! 💪 #powr',
              userPubkey: context.userInfo.pubkey,
              workoutId: context.workoutData?.workoutId
            };
          }
          
          return {
            content: event.content,
            userPubkey: context.userInfo.pubkey,
            workoutId: context.workoutData?.workoutId
          };
        },
        onDone: {
          target: 'idle',
          actions: ['logTransition']
        },
        onError: {
          // Silent failure - return to idle without showing error to user
          target: 'idle',
          actions: ['logTransition']
        }
      },
      // Auto-timeout for optimistic UX
      after: {
        1000: 'idle' // Return to idle after 1 second regardless of publishing status
      }
    },
    
    publishError: {
      on: {
        DISMISS_ERROR: {
          target: 'summary',
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
