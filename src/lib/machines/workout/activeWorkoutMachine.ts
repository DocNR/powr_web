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
import { normalizeTemplateReference } from '@/lib/utils/templateReference';


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
        
        // Normalize the template reference to fix any corruption
        const templateReference = normalizeTemplateReference(rawTemplateReference);
        console.log('[ActiveWorkoutMachine] 🧹 NORMALIZED template reference:', {
          original: rawTemplateReference,
          cleaned: templateReference
        });
        
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
    
    // Save completed workout (like Noga's saveCompletedRound)
    saveCompletedWorkout: fromPromise<{ eventId: string }, { workoutData: unknown; userPubkey: string }>(async ({ input }) => {
      try {
        console.log('[ActiveWorkoutMachine] Publishing completed workout for user:', input.userPubkey);
        
        // Import required modules for real publishing
        const { publishWorkoutActor } = await import('./actors/publishWorkoutActor');
        const { createActor } = await import('xstate');
        
        // Convert workoutData to CompletedWorkout format expected by publishWorkoutActor
        const workoutData = input.workoutData as {
          workoutId?: string;
          title?: string;
          workoutType?: 'strength' | 'circuit' | 'emom' | 'amrap';
          startTime?: number;
          completedSets?: Array<{
            exerciseRef: string;
            setNumber: number;
            reps: number;
            weight: number;
            rpe?: number;
            setType: 'warmup' | 'normal' | 'drop' | 'failure';
            completedAt: number;
          }>;
          notes?: string;
          templateId?: string;
        };
        const completedWorkout = {
          workoutId: workoutData.workoutId || `workout_${Date.now()}`,
          title: workoutData.title || 'Completed Workout',
          workoutType: (workoutData.workoutType || 'strength') as 'strength' | 'circuit' | 'emom' | 'amrap',
          startTime: workoutData.startTime || Date.now() - 3600000, // 1 hour ago fallback
          endTime: Date.now(),
          completedSets: workoutData.completedSets || [],
          notes: workoutData.notes,
          templateId: workoutData.templateId
        };
        
        // Use real publishWorkoutActor
        const publishResult = await new Promise<{ success: boolean; eventId?: string; error?: string }>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Publishing timeout after 30 seconds'));
          }, 30000);
          
          const actor = createActor(publishWorkoutActor, {
            input: {
              workoutData: completedWorkout,
              userPubkey: input.userPubkey
            }
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
        
        if (publishResult.success && publishResult.eventId) {
          console.log('[ActiveWorkoutMachine] ✅ Real workout published with event ID:', publishResult.eventId);
          return { eventId: publishResult.eventId };
        } else {
          console.log('[ActiveWorkoutMachine] ⚠️ Workout queued for later publishing:', publishResult.error);
          // Return success even if queued - NDK will handle retry
          return { eventId: `queued_${Date.now()}` };
        }
      } catch (error) {
        console.error('[ActiveWorkoutMachine] ❌ Publishing failed:', error);
        throw new Error(`Failed to publish workout: ${error}`);
      }
    }),
    
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
  /** @xstate-layout N4IgpgJg5mDOIC5QEMDGAXAlgNzAdQHsAnAawIFd0A6AGwOQkwDsoAVMAWwAcbl0wAxBAJMwVZtgIkxaLLkKkK1Og2ZtOPPmAQSCqPphEBtAAwBdU2cSguBWJiwjrIAB6IATAE4AzFQAc7n4mPt5eAGwALCYA7ACsADQgAJ6IfgCMVBGe2Z5+fmHeWdHuEQC+pYmyOPjEZJS09Iws7Ny8-AJgRETEVJroAGbEHFRV8rVKDarNGm3auvqOTJaWzrb2i85uCF6+AUEh4VFxiSnb0RlhsWHu3iZhfp7FJmne5ZUY1Qp1yo1qLX2CABKAFFWICAJoAfQA8gAFYGAgCCrAAktCAHIrJAgNYOQxMTaITzBKjZMLBNLuaKeKn5E6INJpTxUMJpc5BbyxNJ+aIRMJvECjGqKepgFydVCYewsATo4EADVYkIVCIAwiiAMrArE2Ox4pzYraPekIPxZfzE2LUiKxYKPfkVQUfMYi6hiiVStQCDUAaRRsOV8rVmu15lWeo2hqJ0RNcV83kpfJe1qir0dQq+E3dREl0qgAlhIIAamiAKoawPBrU6nER-GEhDG5KIS5hKjRQqd27RPKBAUZ8ai8U5z0y2GI8vAyF4aGAn3Q0usGu4yOgLaMtKxTJpVNciJRTd+WPRExURmxWJBdyBdw7-vO4XfKjZ3Ne1XQgCysIAMqCpzO5wXJcw2xFd6yjBANy3CIdxMTkdwPS8TTCDsqFibxeWuTcwlbB13jkR8s2HV8WF6TpBiIDg1A1MB0AEd8v1-Vgpy1YCrFAusDTXRBii3GIgnySJ0k3GNmwQHDokyaJLmvTd3BMCJomie8CMzIcPTzKgiDgdBYU6QwICEEQxF0aQRgfNS3WI0coC0nS9KIAydCYSQFnxZYQN1dZwO4hAT3cFlgm8IIoh8GCjzE6SIioExYj5KJr28clYhUz5BysjS1Ds2BdP0ghDOBdEABFIRBDUlXhQE0SK5dOIJCD-MCnwQqC8KTWEtC4oKbwesTHDUpdJ8XxsqgACNaIAdzAMAmGBazYDgb1WERQElRVQF1WrTza28rjXB4kwAvJZqFNa7l2uuGKuu7C8lMeAbCPqLhkHIBbDLK0sP3-Wd50XWrdvq3zrhNNJDt8FDPAKM18iUgoHss3oXre2VERLABxZEp1YaFKw2kN-v1QH9sg2JbxZCI-G8SHIlih4TU8G1ydi1kYM5YL4fSxHXsgejPx-P9px+oCCdXYnNwTNDsO5Hs8itTwQZMRWWTZuJYp7EoynTCzOee7nDNVRF0VVYFv0FwC-u2sC9vXdCMi5K5pbyPw5YV9CzxVncHn3NkOddKhUAIVpaJ5kWfOJ+S3YU+5uTC7I2Xphn-Gd4Koh5EpL19p8uHIUaaClAALL1hFEcQXKkGRtb97Pc4LtRnNcgxjHMUPrcQHq-FJY6YmkzwL28EHeqodwrTiS5Lx69mtdUnWc7z2BC5lTpuiIXo2go4YByr2fa5Yeu9EbpZm8tuqG3bzvgm7sJe-QkHSYyVnckps0LxQzOJmruf8+BLpiAEEEwShLCUsAAhb8moAASLciZbDPpDC+sNr79zEjuEo-hOQ8jgpSHIaZ8JpT9vPAgE1qLkA4BwZARAkgCCKpqD8moKwak+h+Fa4IoENiUluKmZoXjPEtHSZBnIArUmjopG4VNchv1FD-Igf9QQQhhJVZEaJMTHwBg2HY-hAhBVCJDI4CRkFxBij2Rk7hWTpGuD2CRbopEyIAfIhEiiMRGDSOxLyhM2GXQCIdWGOEmT7hNCY6KVpAjSVuEyGk7hyiOiYPlOAzhN7fHDKoiCABaNIJpkl4SdNPP2KgmjqFaFoRJbiIKKRBgYxk5wlKwyOPdKeeChrzTUEU0WWwsgmiuMyG4ERCj7n3MFK4ljnyNNIlwciQxqK0WaWHI0JiqDBSpI-e4itYjyzEukAKxI+RUxMWIqkgzhqaW0jlByBkpmtwQLaSSexKR5GKI8XIsYMJXXioEbIDxrz7OGbZca6ApozTmhpWJHEkm+S5L4BSoMTE4RiDSNJazLoXiTDuW4l57iDN1m9M50CGSaOefcR4GFbiXAVopIe3IIYU1tL3TWuDBoTADkHfgEAsUNiZNedsWRciHWdt0uFpxsi7B5c8YeuzPDou3vPJpwLimgtEqcHcjJ-C8myFES4lLxU13nt-ZeLKIJqrPM8OKglHg8j0fK9CVyr4dgZomOWgyCFEJYBqEhZCKG6tBTSUk6ETCePJJTDsA83bhEplESlPhBn6CYKgMANAaCQHdWLa1Gi4IJlvHBOmyDYoBX6UlRWgQ7x1LpfUfozBkA0ATUafImQcj7hQj2aSgaApRw5CY+SuQaVZPqVmKRFaWyoVTbaC8VwrgJn8XkM8jIeT5E5cPNIkTShAA */
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
              
              return template.exercises.map((exercise, index) => {
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
              target: 'restPeriod',
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
                    const templateExercise = context.templateExercises.find(te => te.exerciseRef === currentExercise.exerciseRef);
                    
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
        
        // Workout control (like Noga's round control)
        PAUSE_WORKOUT: {
          target: 'paused',
          actions: assign({
            workoutSession: ({ context }) => ({
              ...context.workoutSession,
              isPaused: true
            }),
            timingInfo: ({ context }) => ({
              ...context.timingInfo,
              pauseTime: Date.now()
            })
          })
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
     * Completed state - workout finished, now save to NDK
     * Like Noga's completed state
     */
    completed: {
      // Automatically transition to publishing state
      always: { target: 'publishing' }
    },
    
    /**
     * Publishing state - persist workout data to NDK
     * Like Noga's saving state
     */
    publishing: {
      entry: assign({
        publishingStatus: ({ context }) => ({
          ...context.publishingStatus,
          isPublishing: true,
          publishAttempts: context.publishingStatus.publishAttempts + 1
        })
      }),
      
      invoke: {
        src: 'saveCompletedWorkout',
        input: ({ context }) => ({
          workoutData: {
            ...context.workoutData,
            // Ensure we use the machine's accumulated completedSets
            completedSets: context.workoutData.completedSets,
            // Add template ID for proper d-tag generation
            templateId: context.workoutData.template?.id,
            // Add proper workout metadata
            workoutId: context.workoutData.workoutId || `workout_${context.timingInfo.startTime}`,
            title: context.workoutData.template?.name || 'Completed Workout',
            workoutType: 'strength' as const,
            startTime: context.timingInfo.startTime,
            endTime: Date.now()
          },
          userPubkey: context.userInfo.pubkey
        }),
        onDone: {
          target: 'showingSummary',
          actions: assign({
            publishingStatus: ({ context, event }) => ({
              ...context.publishingStatus,
              isPublishing: false,
              eventId: event.output.eventId
            })
          })
        },
        onError: {
          target: 'publishError',
          actions: assign({
            publishingStatus: ({ context }) => ({
              ...context.publishingStatus,
              isPublishing: false
            }),
            error: ({ event }) => createErrorInfo(
              'PUBLISH_ERROR',
              event.error instanceof Error ? event.error.message : 'Failed to publish workout',
              true,
              event.error
            )
          })
        }
      }
    },
    
    /**
     * Publish error state - allow retry
     * Like Noga's saveError
     */
    publishError: {
      on: {
        RETRY_PUBLISH: {
          guard: 'canRetryPublish',
          target: 'publishing',
          actions: assign({ error: undefined })
        }
      }
    },
    
    /**
     * Showing summary state - display workout summary after save
     * Like Noga's showingSummary
     */
    showingSummary: {
      on: {
        DISMISS_SUMMARY: {
          target: 'final'
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
     * Final state - truly done
     * Like Noga's final state
     */
    final: {
      type: 'final',
      output: ({ context }) => ({
        workoutData: context.workoutData,
        publishedEventId: context.publishingStatus.eventId,
        totalDuration: Date.now() - context.timingInfo.startTime
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
