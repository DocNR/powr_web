/**
 * Active Workout Machine
 * 
 * This state machine handles the workout execution during an active workout,
 * including set tracking, exercise navigation, and persistence.
 * It's designed to be a child machine of the Workout Lifecycle Machine.
 * 
 * Following Noga's activeRoundMachine.ts patterns exactly,
 * adapted from golf domain (holes, scores) to workout domain (exercises, sets).
 * 
 * Uses XState v5 patterns with correct generic types, inline actors,
 * and compound state pattern for child actor compatibility.
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
import { defaultActiveWorkoutContext } from './types/activeWorkoutTypes';
import type { 
  ErrorInfo 
} from './types/workoutTypes';
import type { LoadTemplateOutput, WorkoutTemplate } from './actors/loadTemplateActor';

/**
 * Helper function to create error info
 * Following Noga's error handling patterns
 */
const createErrorInfo = (
  code: string, 
  message: string, 
  retryable: boolean = true, 
  originalError?: unknown
): ErrorInfo => ({
  code,
  message,
  retryable,
  timestamp: Date.now(),
  originalError
});


/**
 * Define the Active Workout Machine following Noga's structure
 * 
 * This follows the XState v5 pattern for invokable machines
 */
export const activeWorkoutMachine = setup({
  // Type definitions
  types: {
    context: {} as ActiveWorkoutContext,
    events: {} as ActiveWorkoutEvent,
    input: {} as ActiveWorkoutMachineInput
  },
  
  // Register guards
  guards: activeWorkoutGuards,
  
  // Inline actors following XState v5 patterns
  actors: {
    // Load template data with fallback strategy (like Noga's loadCourseData)
    loadTemplateData: fromPromise<WorkoutTemplate, { templateReference: string }>(async ({ input }) => {
      // Get the raw template reference from input
      const rawTemplateReference = input.templateReference;
      
      try {
        console.log('[ActiveWorkoutMachine] 🔍 DEBUG: Raw input templateReference:', rawTemplateReference);
        console.log('[ActiveWorkoutMachine] 🔍 DEBUG: templateReference type:', typeof rawTemplateReference);
        console.log('[ActiveWorkoutMachine] 🔍 DEBUG: templateReference length:', rawTemplateReference?.length);
        
        // Use the raw template reference directly since corruption is fixed at source
        const templateReference = rawTemplateReference;
        console.log('[ActiveWorkoutMachine] ✅ Using template reference directly (corruption fixed at source):', templateReference);
        
        // Basic validation after normalization
        if (!templateReference || templateReference.trim() === '') {
          throw new Error('Template reference is empty or undefined after normalization');
        }
        
        // Check for corruption pattern and FAIL if normalization didn't fix it
        const parts = templateReference.split(':');
        if (parts.length !== 3) {
          console.error('[ActiveWorkoutMachine] ❌ CORRUPTION DETECTED AFTER NORMALIZATION:', {
            originalReference: rawTemplateReference,
            normalizedReference: templateReference,
            parts,
            partsLength: parts.length,
            expectedFormat: 'kind:pubkey:d-tag'
          });
          throw new Error(`Template reference corruption detected: ${templateReference}. Expected format: kind:pubkey:d-tag but got ${parts.length} parts`);
        }
        
        console.log('[ActiveWorkoutMachine] ✅ Template reference format is valid:', templateReference);
        console.log('[ActiveWorkoutMachine] Loading template data for:', templateReference);
        
        // Import required modules
        const { loadTemplateActor } = await import('./actors/loadTemplateActor');
        const { createActor } = await import('xstate');
        
        // Check if we have a valid template reference
        if (!templateReference || templateReference.trim() === '' || templateReference === 'default-template') {
          console.error('[ActiveWorkoutMachine] ❌ No template selected - user must choose template');
          throw new Error('No template selected. Please select a workout template to continue.');
        }
        
        // Use the loadTemplateActor with the normalized template reference
        const templateResult = await new Promise<LoadTemplateOutput>((resolve, reject) => {
          // Set timeout to prevent infinite hangs
          const timeoutId = setTimeout(() => {
            reject(new Error(`Template loading timeout after 10 seconds for: ${templateReference}`));
          }, 10000);
          
          const actor = createActor(loadTemplateActor, {
            input: { templateReference: templateReference }
          });
          
          actor.subscribe((snapshot) => {
            if (snapshot.status === 'done') {
              clearTimeout(timeoutId);
              resolve(snapshot.output);
            } else if (snapshot.status === 'error') {
              clearTimeout(timeoutId);
              reject(snapshot.error);
            }
          });
          
          actor.start();
        });
        
        const loadedTemplate = templateResult.template;
        console.log('[ActiveWorkoutMachine] ✅ Loaded template:', loadedTemplate.name, 'with', loadedTemplate.exercises.length, 'exercises');
        return loadedTemplate;
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('[ActiveWorkoutMachine] ❌ Template loading failed:', error);
        throw new Error(`Failed to load template: ${errorMessage}`);
      }
    }),

    // Track individual sets (like Noga's processPendingScores)
    trackCompletedSet: setTrackingActor,
    
    // Rest timer (new for workout domain)
    restTimer: fromPromise<void, { duration: number }>(async ({ input }) => {
      const { duration } = input;
      console.log(`[ActiveWorkoutMachine] Starting rest timer for ${duration}ms`);
      
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log('[ActiveWorkoutMachine] Rest period completed');
          resolve();
        }, duration);
      });
    })
  }
}).createMachine({
  id: 'activeWorkout',
  
  // Initial context from input
  context: ({ input }) => {
    // 🔍 ROOT CAUSE INVESTIGATION: Log the exact input we receive
    console.log('[ActiveWorkoutMachine] 🔍 CONTEXT INIT: Raw input received:', {
      templateReference: input.templateSelection.templateReference,
      templateReferenceType: typeof input.templateSelection.templateReference,
      templateReferenceLength: input.templateSelection.templateReference?.length,
      fullTemplateSelection: input.templateSelection
    });
    
    return {
      // Spread default context
      ...defaultActiveWorkoutContext,
      
      // Override with input data - NO MODIFICATION, use exactly what we receive
      userInfo: input.userInfo,
      workoutData: input.workoutData,
      templateSelection: input.templateSelection, // Use original, unmodified
      
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
      exerciseSetCounters: new Map<string, number>()
    };
  },
  
  // Initial state
  initial: 'loadingTemplate',
  
  states: {
    /**
     * Loading template state - initial state to load exercise data
     * Like Noga's loadingCourseData
     */
    loadingTemplate: {
      invoke: {
        src: 'loadTemplateData',
        input: ({ context }) => ({
          templateReference: context.templateSelection.templateReference || 'default-template'
        }),
        onDone: {
          target: 'exercising',
          actions: assign({
            // Store loaded template data
            workoutData: ({ context, event }) => ({
              ...context.workoutData,
              template: event.output
            }),
            // FIX: Update exercise progression with correct total from template
            exerciseProgression: ({ context, event }) => ({
              ...context.exerciseProgression,
              totalExercises: event.output.exercises.length
            }),
            // NEW: Parse template exercises to extract prescribed parameters
            templateExercises: ({ event }) => {
              const template = event.output;
              console.log('[ActiveWorkoutMachine] 📋 Parsing template exercises for prescribed parameters');
              
                return template.exercises.map((exercise: { exerciseRef: string; weight?: number; reps?: number; sets?: number }, index: number) => {
                // Extract prescribed parameters from template exercise
                const prescribedWeight = exercise.weight || 0;
                const prescribedReps = exercise.reps || 10;
                // Note: Current template structure doesn't have rpe/setType, use defaults
                const prescribedRPE = 7; // Default RPE since not in current template structure
                const prescribedSetType = 'normal' as const; // Default set type
                const plannedSets = exercise.sets || 3; // Default to 3 sets
                
                console.log(`[ActiveWorkoutMachine] 📋 Exercise ${index + 1}: ${exercise.exerciseRef}`, {
                  prescribedWeight,
                  prescribedReps,
                  prescribedRPE,
                  prescribedSetType,
                  plannedSets
                });
                
                return {
                  exerciseRef: exercise.exerciseRef,
                  prescribedWeight,
                  prescribedReps,
                  prescribedRPE,
                  prescribedSetType,
                  plannedSets
                };
              });
            }
          })
        },
        onError: {
          target: 'error',
          actions: assign({
            error: ({ event }) => createErrorInfo(
              'TEMPLATE_DATA_ERROR',
              `Error loading template data: ${event.error}`,
              true,
              event.error
            )
          })
        }
      },
      on: {
        // Allow retry if loading fails
        RETRY_OPERATION: {
          target: 'loadingTemplate'
        }
      }
    },
    
    /**
     * Exercising state - active workout execution
     * Like Noga's playing state
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
                    reps: event.setData.reps || 0,
                    weight: event.setData.weight || 0,
                    rpe: event.setData.rpe || 7,
                    setType: event.setData.setType || 'normal',
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
            
            UNCOMPLETE_SPECIFIC_SET: {
              actions: assign({
                workoutData: ({ context, event }) => {
                  console.log(`[ActiveWorkoutMachine] ❌ UNCOMPLETE_SPECIFIC_SET: ${event.exerciseRef} set ${event.setNumber}`);
                  
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
                  console.log(`[ActiveWorkoutMachine] 🎯 SELECT_SET: Exercise ${event.exerciseIndex}, Set ${event.setIndex}`);
                  
                  return {
                    ...context.exerciseProgression,
                    currentExerciseIndex: event.exerciseIndex,  // Exercise follows selection
                    currentSetNumber: event.setIndex + 1        // Set follows selection (convert to 1-based)
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
            input: { duration: 60000 }, // 1 minute rest
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
        RETRY_OPERATION: [
          {
            // Retry template data loading
            guard: 'isTemplateDataError',
            target: 'loadingTemplate',
            actions: assign({ error: undefined })
          },
          {
            // Default retry goes back to exercising
            target: 'exercising',
            actions: assign({ error: undefined })
          }
        ]
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
