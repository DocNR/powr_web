/**
 * Active Workout Machine - Refactored for Parent-Child Data Flow
 * 
 * This state machine handles workout execution during an active workout,
 * following the XState parent-child data flow patterns from .clinerules/xstate-parent-child-data-flow.md
 * 
 * KEY CHANGES:
 * - Removed duplicate data resolution (trusts parent-provided data)
 * - Added comprehensive input validation with clear error messages
 * - Simplified to focus only on workout execution logic
 * - Follows "Parent Resolves, Child Trusts" pattern
 */

import {
  assign,
  fromPromise,
  sendParent,
  setup
} from 'xstate';
import { activeWorkoutGuards } from './guards/activeWorkoutGuards';
import { setTrackingActor } from './actors/setTrackingActor';
import type { 
  ActiveWorkoutContext, 
  ActiveWorkoutEvent, 
  ActiveWorkoutMachineInput
} from './types/activeWorkoutTypes';
import { workoutTimingService } from '@/lib/services/workoutTiming';

/**
 * Comprehensive input validation following parent-child data flow patterns
 */
const validateActiveWorkoutInput = (input: ActiveWorkoutMachineInput): input is ActiveWorkoutMachineInput => {
  console.log('[ActiveWorkoutMachine] 🔍 INPUT VALIDATION: Received input:', {
    hasUserInfo: !!input.userInfo,
    hasWorkoutData: !!input.workoutData,
    hasTemplateSelection: !!input.templateSelection,
    hasResolvedTemplate: !!input.resolvedTemplate,
    hasResolvedExercises: !!input.resolvedExercises,
    exerciseCount: input.workoutData?.exercises?.length || 0
  });
  
  // Validate required input fields
  const missingFields = [];
  if (!input.userInfo) missingFields.push('userInfo');
  if (!input.workoutData) missingFields.push('workoutData');
  if (!input.templateSelection) missingFields.push('templateSelection');
  if (!input.resolvedTemplate) missingFields.push('resolvedTemplate');
  if (!input.resolvedExercises) missingFields.push('resolvedExercises');
  
  if (missingFields.length > 0) {
    throw new Error(
      `Active workout machine missing required input: ${missingFields.join(', ')}. ` +
      `Parent lifecycle machine should resolve these before spawning active machine.`
    );
  }
  
  // Validate workout data structure
  if (!input.workoutData.exercises || input.workoutData.exercises.length === 0) {
    throw new Error('Workout data must include at least one exercise');
  }
  
  // Validate resolved data consistency
  if (!Array.isArray(input.resolvedExercises) || input.resolvedExercises.length === 0) {
    throw new Error('resolvedExercises must be a non-empty array');
  }
  
  console.log('[ActiveWorkoutMachine] ✅ INPUT VALIDATION: All required data present');
  return true;
};

/**
 * Active Workout Machine - Simplified for Parent-Child Data Flow
 */
export const activeWorkoutMachine = setup({
  types: {
    context: {} as ActiveWorkoutContext,
    events: {} as ActiveWorkoutEvent,
    input: {} as ActiveWorkoutMachineInput
  },
  
  guards: activeWorkoutGuards,
  
  // ✅ SIMPLIFIED: Only workout execution actors, no data resolution
  actors: {
    // Track individual sets
    trackCompletedSet: setTrackingActor,
    
    // Rest timer using WorkoutTimingService
    restTimer: fromPromise<void, { exerciseRef: string; rpe?: number; setType?: 'warmup' | 'normal' | 'drop' | 'failure' }>(async ({ input }) => {
      const { exerciseRef, rpe, setType = 'normal' } = input;
      
      const restResult = workoutTimingService.getRestTime(exerciseRef, rpe, setType);
      const restDurationMs = restResult.restTime * 1000;
      
      console.log(`[ActiveWorkoutMachine] Starting rest timer for ${restDurationMs}ms (${exerciseRef}, RPE: ${rpe}, type: ${setType})`);
      
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log('[ActiveWorkoutMachine] Rest period completed');
          resolve();
        }, restDurationMs);
      });
    })
  }
}).createMachine({
  id: 'activeWorkout',
  
  // ✅ CRITICAL: Validate input and trust parent-provided data
  context: ({ input }) => {
    // Validate input immediately
    validateActiveWorkoutInput(input);
    
    console.log('[ActiveWorkoutMachine] ✅ READY: Starting with resolved data from parent', {
      templateName: input.resolvedTemplate!.name,
      exerciseCount: input.resolvedExercises!.length,
      workoutExerciseCount: input.workoutData.exercises!.length
    });
    
    return {
      // Use resolved data directly from parent
      userInfo: input.userInfo,
      // ✅ CRITICAL FIX: Merge resolved exercise names into workout data
      workoutData: {
        ...input.workoutData,
        exercises: input.workoutData.exercises?.map(workoutExercise => {
          const resolvedExercise = input.resolvedExercises?.find(
            re => workoutExercise.exerciseRef === `33401:${re.authorPubkey}:${re.id}`
          );
          return {
            ...workoutExercise,
            exerciseName: resolvedExercise?.name || 'Unknown Exercise' // Add human-readable name
          };
        }) || []
      },
      templateSelection: input.templateSelection,
      
      // Initialize exercise progression
      exerciseProgression: {
        currentExerciseIndex: 0,
        totalExercises: input.workoutData.exercises?.length || 0,
        currentSetNumber: 1,
        isLastSet: false,
        isLastExercise: false
      },
      
      // Initialize timing
      timingInfo: {
        startTime: Date.now(),
        pauseTime: 0
      },
      
      // Initialize exercise set counters for NDK deduplication fix
      exerciseSetCounters: new Map<string, number>(),
      
      // Initialize all required context fields
      workoutSession: {
        isActive: true,
        isPaused: false,
        totalPauseTime: 0,
        lastActivityAt: Date.now()
      },
      
      publishingStatus: {
        isPublishing: false,
        publishAttempts: 0
      },
      
      // ✅ CRITICAL FIX: Use resolved exercises with merged names from parent
      templateExercises: input.resolvedExercises?.map(exercise => {
        // Find corresponding template exercise for prescribed values
        const templateExercise = input.resolvedTemplate?.exercises?.find(
          te => te.exerciseRef === `33401:${exercise.authorPubkey}:${exercise.id}`
        );
        
        return {
          exerciseRef: `33401:${exercise.authorPubkey}:${exercise.id}`,
          exerciseName: exercise.name, // ✅ ADD: Human-readable exercise name
          prescribedReps: templateExercise?.reps || 10,
          prescribedWeight: templateExercise?.weight || 0,
          prescribedRPE: 7, // Default RPE
          prescribedSetType: 'normal' as const,
          plannedSets: templateExercise?.sets || 3 // Required by ActiveWorkoutContext
        };
      }) || [],
      
      lastUpdated: Date.now(),
      lastActivityAt: Date.now(),
      currentSetData: undefined,
      error: undefined
    };
  },
  
  // ✅ SIMPLIFIED: Start exercising immediately, no initialization needed
  initial: 'exercising',
  
  states: {
    /**
     * Ready state - active workout ready to start
     * ✅ SIMPLIFIED: No data resolution needed, trust parent data
     */
    ready: {
      entry: ({ context }) => {
        console.log('[ActiveWorkoutMachine] 🏃 READY: Starting workout execution', {
          exerciseCount: context.workoutData.exercises?.length || 0,
          templateName: context.templateSelection?.templateId || 'Unknown',
          hasExerciseNames: context.workoutData.exercises?.every(ex => !!ex.exerciseRef) || false
        });
      },
      
      on: {
        START_WORKOUT: 'exercising'
      }
    },
    
    /**
     * Exercising state - active workout execution
     * ✅ SIMPLIFIED: Focus only on workout execution logic
     */
    exercising: {
      initial: 'performingSet',
      
      states: {
        performingSet: {
          entry: assign({
            // Update current set data when entering
            currentSetData: ({ context }) => {
              const currentExercise = context.workoutData.exercises?.[context.exerciseProgression.currentExerciseIndex];
              if (!currentExercise) return undefined;
              
              return {
                exerciseRef: currentExercise.exerciseRef,
                setNumber: context.exerciseProgression.currentSetNumber,
                plannedReps: currentExercise.reps,
                plannedWeight: currentExercise.weight || 0
              };
            }
          }),
          
          on: {
            // Set completion (like Noga's RECORD_SCORE)
            // FIX: Auto-generate set data from machine context instead of requiring UI to provide it
            COMPLETE_SET: {
              target: 'performingSet',
              actions: [
                // Record the completed set with auto-generated data and per-exercise set tracking
                // REMOVED: 'navigateToNextIncompleteSet' - user controls navigation manually
                assign({
                  workoutData: ({ context, event }) => {
                    // Auto-generate set data from current machine context
                    const currentExercise = context.workoutData.template?.exercises?.[context.exerciseProgression.currentExerciseIndex];
                    
                    if (!currentExercise) {
                      console.warn('[ActiveWorkoutMachine] No current exercise found for set completion');
                      return context.workoutData;
                    }
                    
                    // 🔧 NDK DEDUPLICATION FIX: Track per-exercise set numbers
                    // Get current set number for this specific exercise
                    const exerciseRef = currentExercise.exerciseRef;
                    const currentExerciseSetNumber = (context.exerciseSetCounters.get(exerciseRef) || 0) + 1;
                    
                    console.log(`[ActiveWorkoutMachine] 🔢 NDK Deduplication Fix: Exercise ${exerciseRef} set number ${currentExerciseSetNumber}`);
                    
                    // NEW: Use parsed template prescribed values as defaults, allow user overrides via event.setData
                    const templateExercise = context.templateExercises.find((te) => te.exerciseRef === currentExercise.exerciseRef);
                    
                    const autoGeneratedSetData = {
                      exerciseRef: currentExercise.exerciseRef,
                      setNumber: currentExerciseSetNumber, // Use per-exercise set number for NDK deduplication fix
                      reps: event.setData?.reps ?? templateExercise?.prescribedReps ?? currentExercise.reps ?? 10,
                      weight: event.setData?.weight ?? templateExercise?.prescribedWeight ?? currentExercise.weight ?? 0,
                      rpe: event.setData?.rpe ?? templateExercise?.prescribedRPE ?? 7, // Use template RPE or default
                      setType: (event.setData?.setType ?? templateExercise?.prescribedSetType ?? 'normal') as 'warmup' | 'normal' | 'drop' | 'failure',
                      completedAt: Date.now()
                    };
                    
                    console.log(`[ActiveWorkoutMachine] ✅ Auto-generated set data with NDK fix:`, autoGeneratedSetData);
                    
                    return {
                      ...context.workoutData,
                      completedSets: [
                        ...context.workoutData.completedSets,
                        autoGeneratedSetData
                      ]
                    };
                  },
                  
                  // Update per-exercise set counters for NDK deduplication fix
                  exerciseSetCounters: ({ context }) => {
                    const currentExercise = context.workoutData.template?.exercises?.[context.exerciseProgression.currentExerciseIndex];
                    if (!currentExercise) return context.exerciseSetCounters;
                    
                    const exerciseRef = currentExercise.exerciseRef;
                    const currentCount = context.exerciseSetCounters.get(exerciseRef) || 0;
                    const newCount = currentCount + 1;
                    
                    // Create new Map with updated count
                    const updatedCounters = new Map(context.exerciseSetCounters);
                    updatedCounters.set(exerciseRef, newCount);
                    
                    console.log(`[ActiveWorkoutMachine] 🔢 Updated set counter for ${exerciseRef}: ${newCount}`);
                    
                    return updatedCounters;
                  },
                  
                  // Update progression
                  exerciseProgression: ({ context }) => {
                    const currentExercise = context.workoutData.template?.exercises?.[context.exerciseProgression.currentExerciseIndex];
                    const plannedSets = currentExercise?.sets || 3;
                    const newSetNumber = context.exerciseProgression.currentSetNumber + 1;
                    
                    return {
                      ...context.exerciseProgression,
                      currentSetNumber: newSetNumber,
                      isLastSet: newSetNumber >= plannedSets
                    };
                  },
                  
                  // Update activity
                  lastActivityAt: Date.now()
                })
              ]
            },
            
            // ADD_SET event handler - Fixed to use event.exerciseRef
            ADD_SET: {
              actions: assign({
                workoutData: ({ context, event }) => {
                  const exerciseRef = event.exerciseRef;
                  console.log(`[ActiveWorkoutMachine] ➕ ADD_SET: User requested extra set for ${exerciseRef}`);
                  
                  if (!exerciseRef) {
                    console.warn('[ActiveWorkoutMachine] ADD_SET called without exerciseRef');
                    return context.workoutData;
                  }
                  
                  const currentExtra = context.workoutData.extraSetsRequested?.[exerciseRef] || 0;
                  const newExtraCount = currentExtra + 1;
                  
                  console.log(`[ActiveWorkoutMachine] ✅ Adding extra set #${newExtraCount} for ${exerciseRef}`);
                  
                  return {
                    ...context.workoutData,
                    extraSetsRequested: {
                      ...context.workoutData.extraSetsRequested,
                      [exerciseRef]: newExtraCount
                    }
                  };
                },
                lastActivityAt: Date.now()
              })
            },
            
            // NEW: Flexible set interaction handlers - SIMPLIFIED
            COMPLETE_SPECIFIC_SET: {
              actions: assign({
                workoutData: ({ context, event }) => {
                  console.log(`[ActiveWorkoutMachine] ✅ COMPLETE_SPECIFIC_SET: ${event.exerciseRef} set ${event.setNumber}`);
                  
                  // Simple: Use logical set number directly (no technical IDs needed)
                  const setData = {
                    exerciseRef: event.exerciseRef,
                    setNumber: event.setNumber, // Simple logical set number (1, 2, 3...)
                    reps: event.setData?.reps || 0,
                    weight: event.setData?.weight || 0,
                    rpe: event.setData?.rpe || 7,
                    setType: event.setData?.setType || 'normal',
                    completedAt: Date.now()
                  };
                  
                  return {
                    ...context.workoutData,
                    completedSets: [...context.workoutData.completedSets, setData]
                  };
                },
                lastActivityAt: Date.now()
              })
            },
            
            // NEW: UNCOMPLETE_SET handler for simplified uncomplete functionality
            UNCOMPLETE_SET: {
              actions: assign({
                workoutData: ({ context, event }) => {
                  console.log(`[ActiveWorkoutMachine] ❌ UNCOMPLETE_SET: ${event.exerciseRef} set ${event.setNumber}`);
                  
                  return {
                    ...context.workoutData,
                    completedSets: context.workoutData.completedSets.filter(
                      set => !(set.exerciseRef === event.exerciseRef && set.setNumber === event.setNumber)
                    )
                  };
                },
                lastActivityAt: Date.now()
              })
            },
            
            EDIT_COMPLETED_SET: {
              actions: assign({
                workoutData: ({ context, event }) => {
                  console.log(`[ActiveWorkoutMachine] ✏️ EDIT_COMPLETED_SET: ${event.exerciseRef} set ${event.setNumber} ${event.field}=${event.value}`);
                  
                  return {
                    ...context.workoutData,
                    completedSets: context.workoutData.completedSets.map(set =>
                      set.exerciseRef === event.exerciseRef && set.setNumber === event.setNumber
                        ? { ...set, [event.field]: event.value }
                        : set
                    )
                  };
                },
                lastActivityAt: Date.now()
              })
            },
            
            SELECT_SET: {
              actions: assign({
                exerciseProgression: ({ context, event }) => {
                  // Find the exercise index by exerciseRef
                  const exerciseIndex = context.workoutData.template?.exercises?.findIndex(
                    (ex: { exerciseRef: string }) => ex.exerciseRef === event.exerciseRef
                  );
                  
                  if (exerciseIndex === -1 || exerciseIndex === undefined) {
                    console.warn(`[ActiveWorkoutMachine] SELECT_SET: Exercise ${event.exerciseRef} not found in template`);
                    return context.exerciseProgression;
                  }
                  
                  console.log(`[ActiveWorkoutMachine] 🎯 SELECT_SET: Exercise ${event.exerciseRef} (index ${exerciseIndex}), Set ${event.setNumber}`);
                  
                  return {
                    ...context.exerciseProgression,
                    currentExerciseIndex: exerciseIndex,  // Exercise follows selection
                    currentSetNumber: event.setNumber     // Set follows selection (already 1-based)
                  };
                },
                lastActivityAt: Date.now()
              })
            }
          }
        },
        
        restPeriod: {
          invoke: {
            src: 'restTimer',
            input: ({ context }) => {
              const currentExercise = context.workoutData.template?.exercises?.[context.exerciseProgression.currentExerciseIndex];
              const lastCompletedSet = context.workoutData.completedSets[context.workoutData.completedSets.length - 1];
              
              return {
                exerciseRef: currentExercise?.exerciseRef || 'unknown',
                rpe: lastCompletedSet?.rpe,
                setType: lastCompletedSet?.setType || 'normal'
              };
            },
            onDone: {
              target: 'performingSet'
            }
          },
          
          on: {
            // Allow skipping rest
            END_REST_PERIOD: {
              target: 'performingSet'
            }
          }
        },
        
        betweenExercises: {
          on: {
            START_EXERCISE: {
              target: 'performingSet'
            }
          }
        }
      },
      
      on: {
        // Exercise navigation (available from any exercising sub-state)
        NEXT_EXERCISE: {
          guard: 'canGoToNextExercise',
          target: '.betweenExercises',
          actions: assign({
            exerciseProgression: ({ context }) => {
              const nextExerciseIndex = context.exerciseProgression.currentExerciseIndex + 1;
              
              // Calculate correct set number based on completed sets for the next exercise
              const currentExercise = context.workoutData.template?.exercises?.[nextExerciseIndex];
              if (!currentExercise) {
                return {
                  ...context.exerciseProgression,
                  currentExerciseIndex: nextExerciseIndex,
                  currentSetNumber: 1,
                  isLastExercise: nextExerciseIndex >= context.exerciseProgression.totalExercises - 1
                };
              }
              
              // Count completed sets for this exercise
              const completedSetsForExercise = context.workoutData.completedSets.filter((set: { exerciseRef: string }) => 
                set.exerciseRef === currentExercise.exerciseRef
              ).length;
              
              // Next set number = completed sets + 1, but don't exceed planned sets
              const plannedSets = currentExercise.sets || 3;
              const nextSetNumber = Math.min(completedSetsForExercise + 1, plannedSets);
              
              console.log(`[ActiveWorkoutMachine] 🔄 NEXT_EXERCISE: Moving to exercise ${nextExerciseIndex}, completed sets: ${completedSetsForExercise}, next set: ${nextSetNumber}`);
              
              return {
                ...context.exerciseProgression,
                currentExerciseIndex: nextExerciseIndex,
                currentSetNumber: nextSetNumber,
                isLastExercise: nextExerciseIndex >= context.exerciseProgression.totalExercises - 1
              };
            }
          })
        },
        
        // Skip exercise - allows users to skip without completing sets
        SKIP_EXERCISE: {
          guard: 'canGoToNextExercise',
          target: '.betweenExercises',
          actions: assign({
            exerciseProgression: ({ context }) => {
              const nextExerciseIndex = context.exerciseProgression.currentExerciseIndex + 1;
              
              console.log(`[ActiveWorkoutMachine] ⏭️ SKIP_EXERCISE: Skipping exercise ${context.exerciseProgression.currentExerciseIndex}, moving to ${nextExerciseIndex}`);
              
              return {
                ...context.exerciseProgression,
                currentExerciseIndex: nextExerciseIndex,
                currentSetNumber: 1, // Start fresh on next exercise
                isLastExercise: nextExerciseIndex >= context.exerciseProgression.totalExercises - 1
              };
            }
          })
        },
        
        PREVIOUS_EXERCISE: {
          guard: 'canGoToPreviousExercise',
          target: '.betweenExercises',
          actions: assign({
            exerciseProgression: ({ context }) => {
              const prevExerciseIndex = context.exerciseProgression.currentExerciseIndex - 1;
              
              // Calculate correct set number based on completed sets for the previous exercise
              const currentExercise = context.workoutData.template?.exercises?.[prevExerciseIndex];
              if (!currentExercise) {
                return {
                  ...context.exerciseProgression,
                  currentExerciseIndex: prevExerciseIndex,
                  currentSetNumber: 1,
                  isLastExercise: false
                };
              }
              
              // Count completed sets for this exercise
              const completedSetsForExercise = context.workoutData.completedSets.filter((set: { exerciseRef: string }) => 
                set.exerciseRef === currentExercise.exerciseRef
              ).length;
              
              // Next set number = completed sets + 1, but don't exceed planned sets
              const plannedSets = currentExercise.sets || 3;
              const nextSetNumber = Math.min(completedSetsForExercise + 1, plannedSets);
              
              console.log(`[ActiveWorkoutMachine] 🔄 PREVIOUS_EXERCISE: Moving to exercise ${prevExerciseIndex}, completed sets: ${completedSetsForExercise}, next set: ${nextSetNumber}`);
              
              return {
                ...context.exerciseProgression,
                currentExerciseIndex: prevExerciseIndex,
                currentSetNumber: nextSetNumber,
                isLastExercise: false
              };
            }
          })
        },
        
        // NEW: Direct exercise navigation for supersets and free exercise switching
        NAVIGATE_TO_EXERCISE: {
          guard: 'isValidExerciseIndex',
          target: '.performingSet',
          actions: assign({
            exerciseProgression: ({ context, event }) => {
              const targetExerciseIndex = event.exerciseIndex;
              
              // Calculate correct set number based on completed sets for the target exercise
              const targetExercise = context.workoutData.template?.exercises?.[targetExerciseIndex];
              if (!targetExercise) {
                console.warn(`[ActiveWorkoutMachine] Invalid exercise index: ${targetExerciseIndex}`);
                return context.exerciseProgression;
              }
              
              // Count completed sets for this exercise
              const completedSetsForExercise = context.workoutData.completedSets.filter((set: { exerciseRef: string }) => 
                set.exerciseRef === targetExercise.exerciseRef
              ).length;
              
              // Next set number = completed sets + 1, but don't exceed planned sets
              const plannedSets = targetExercise.sets || 3;
              const nextSetNumber = Math.min(completedSetsForExercise + 1, plannedSets);
              
              console.log(`[ActiveWorkoutMachine] 🎯 NAVIGATE_TO_EXERCISE: Moving to exercise ${targetExerciseIndex} (${targetExercise.exerciseRef}), completed sets: ${completedSetsForExercise}, next set: ${nextSetNumber}`);
              
              return {
                ...context.exerciseProgression,
                currentExerciseIndex: targetExerciseIndex,
                currentSetNumber: nextSetNumber,
                isLastExercise: targetExerciseIndex >= context.exerciseProgression.totalExercises - 1
              };
            }
          })
        },
        
        // Workout control (like Noga's round control)
        // PAUSE_WORKOUT: No-op - pause functionality removed for simpler UX
        PAUSE_WORKOUT: {
          // No-op: Do nothing, stay in current state
        },
        
        COMPLETE_WORKOUT: {
          guard: 'canCompleteWorkout',
          target: 'completed',
          actions: assign({
            workoutSession: ({ context }) => ({
              ...context.workoutSession,
              isActive: false
            })
          })
        }
      }
    },
    
    /**
     * Paused state - workout temporarily halted
     * Like Noga's paused state
     */
    paused: {
      on: {
        RESUME_WORKOUT: {
          target: 'exercising',
          actions: assign({
            workoutSession: ({ context }) => ({
              ...context.workoutSession,
              isPaused: false,
              totalPauseTime: context.workoutSession.totalPauseTime + (Date.now() - context.timingInfo.pauseTime)
            }),
            timingInfo: ({ context }) => ({
              ...context.timingInfo,
              pauseTime: 0
            })
          })
        },
        
        // Allow navigation while paused
        NAVIGATE_TO_EXERCISE: {
          guard: 'isValidExerciseIndex',
          actions: assign({
            exerciseProgression: ({ context, event }) => ({
              ...context.exerciseProgression,
              currentExerciseIndex: event.exerciseIndex,
              currentSetNumber: 1
            })
          })
        },
        
        // Allow completion while paused
        COMPLETE_WORKOUT: {
          guard: 'canCompleteWorkout',
          target: 'completed'
        },
        
        // Allow cancellation while paused
        CANCEL_WORKOUT: {
          target: 'cancelled'
        }
      }
    },
    
    /**
     * Completed state - workout finished, return real data to parent
     * ✅ FIXED: No longer publishes itself, just returns data to lifecycle machine
     */
    completed: {
      type: 'final',
      entry: sendParent(({ context }) => ({
        type: 'WORKOUT_COMPLETED',
        workoutData: {
          ...context.workoutData,
          completedSets: context.workoutData?.completedSets || [],
          templateId: context.workoutData?.template?.id || 'unknown-template',
          endTime: Date.now(),
          extraSetsRequested: context.workoutData?.extraSetsRequested || {}
        },
        totalDuration: Date.now() - (context.timingInfo?.startTime || Date.now()),
        completed: true
      })),
      output: ({ context }) => {
        try {
          const workoutData = {
            ...context.workoutData,
            // Ensure we include all the real completed sets with extra sets
            completedSets: context.workoutData?.completedSets || [],
            // Add metadata for proper publishing
            templateId: context.workoutData?.template?.id || 'unknown-template',
            endTime: Date.now(),
            // Include extra sets information for UI display
            extraSetsRequested: context.workoutData?.extraSetsRequested || {}
          };
          
          const startTime = context.timingInfo?.startTime || Date.now();
          const totalDuration = Date.now() - startTime;
          
          const finalOutput = {
            workoutData,
            totalDuration,
            completed: true
          };
          
          console.log('[ActiveWorkoutMachine] ✅ Workout completed successfully with', workoutData.completedSets.length, 'sets');
          
          return finalOutput;
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('[ActiveWorkoutMachine] ❌ Error creating output:', error);
          
          // Return a minimal but valid output to prevent undefined
          const fallbackOutput = {
            workoutData: {
              ...context.workoutData,
              completedSets: context.workoutData?.completedSets || [],
              templateId: 'error-fallback',
              endTime: Date.now(),
              extraSetsRequested: {}
            },
            totalDuration: 0,
            completed: true,
            error: errorMessage
          };
          
          console.warn('[ActiveWorkoutMachine] Using fallback output due to error');
          return fallbackOutput;
        }
      }
    },
    
    /**
     * Cancelled state - user cancelled workout
     * New for workout domain
     */
    cancelled: {
      type: 'final',
      output: ({ context }) => ({
        workoutData: context.workoutData,
        totalDuration: Date.now() - context.timingInfo.startTime,
        cancelled: true
      })
    },
    
    /**
     * Error state - something went wrong
     * Like Noga's error state
     */
    error: {
      on: {
        RETRY_OPERATION: {
          // Default retry goes back to exercising
          target: 'exercising',
          actions: assign({ error: undefined })
        }
      }
    }
  }
});

/**
 * Export for backward compatibility
 */
export const activeWorkoutActors = {
  // Actors are now inline, but export for any existing usage
};
