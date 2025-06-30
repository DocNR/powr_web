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
 * 🧪 PROGRESSIVE SET TESTING: Generate realistic workout progressions
 * 
 * This function creates unique set data to test if NDK's mergeTags() deduplication
 * can be bypassed with realistic workout progressions instead of identical sets.
 * 
 * Based on research findings from docs/research/ndk-tag-deduplication-research-findings.md
 */
const generateProgressiveSet = (
  exercise: { reps: number; weight?: number; sets: number },
  setNumber: number,
  totalSets: number
) => {
  // Calculate progression factor (0.0 to 1.0)
  const progressionFactor = totalSets > 1 ? (setNumber - 1) / (totalSets - 1) : 0;
  
  // Base values from exercise template
  const baseReps = exercise.reps || 10;
  const baseWeight = exercise.weight || 0;
  
  // Progressive patterns based on research scenarios
  const progressiveReps = Math.max(1, Math.round(baseReps - (progressionFactor * 4))); // Decreasing reps (fatigue)
  const progressiveWeight = baseWeight + Math.floor(progressionFactor * 10); // Increasing weight (if applicable)
  const progressiveRPE = Math.min(10, Math.max(1, Math.round(6 + (progressionFactor * 4)))); // Increasing RPE (6→10)
  
  // Set type progression: warmup → normal → failure
  let setType: 'warmup' | 'normal' | 'drop' | 'failure';
  if (setNumber === 1) {
    setType = 'warmup';
  } else if (setNumber === totalSets && totalSets > 2) {
    setType = 'failure';
  } else {
    setType = 'normal';
  }
  
  console.log(`[generateProgressiveSet] Set ${setNumber}/${totalSets}: reps=${progressiveReps}, weight=${progressiveWeight}, rpe=${progressiveRPE}, type=${setType}`);
  
  return {
    reps: progressiveReps,
    weight: progressiveWeight,
    rpe: progressiveRPE,
    setType
  };
};

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
    loadTemplateData: fromPromise<WorkoutTemplate, { templateId: string; userPubkey: string }>(async ({ input }) => {
      const { templateId, userPubkey } = input;
      
      try {
        console.log('[ActiveWorkoutMachine] Loading template data for:', templateId);
        
        // Import required modules
        const { loadTemplateActor } = await import('./actors/loadTemplateActor');
        const { workoutSetupMachine } = await import('./workoutSetupMachine');
        const { createActor } = await import('xstate');
        
        // Helper function to try loading a specific template
        const tryLoadTemplate = async (targetTemplateId: string): Promise<LoadTemplateOutput> => {
          return new Promise((resolve, reject) => {
            // Set timeout to prevent infinite hangs
            const timeoutId = setTimeout(() => {
              reject(new Error(`Template loading timeout after 10 seconds for: ${targetTemplateId}`));
            }, 10000);
            
            const actor = createActor(loadTemplateActor, {
              input: { templateId: targetTemplateId, userPubkey }
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
        };
        
        // Strategy 1: Try the selected template first (if provided and not empty)
        if (templateId && templateId.trim() !== '' && templateId !== 'default-template' && templateId !== '') {
          try {
            const templateResult = await tryLoadTemplate(templateId);
            const loadedTemplate = templateResult.template;
            console.log('[ActiveWorkoutMachine] ✅ Loaded selected template:', loadedTemplate.name, 'with', loadedTemplate.exercises.length, 'exercises');
            return loadedTemplate;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn('[ActiveWorkoutMachine] ⚠️ Selected template failed to load:', templateId, errorMessage);
            // Continue to fallback strategy
          }
        }
        
        // Strategy 2: Fallback - Get first available template from user's templates
        console.log('[ActiveWorkoutMachine] 🔄 Attempting fallback: loading first available template...');
        
        try {
          // Use workoutSetupMachine to get available templates
          const setupResult = await new Promise<Array<{ id: string; name: string }>>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              reject(new Error('Setup machine timeout after 10 seconds'));
            }, 10000);
            
            const setupActor = createActor(workoutSetupMachine, {
              input: { userPubkey }
            });
            
            setupActor.subscribe((snapshot) => {
              if (snapshot.matches('templateSelection') && snapshot.context.availableTemplates.length > 0) {
                clearTimeout(timeoutId);
                resolve(snapshot.context.availableTemplates);
              } else if (snapshot.matches('error')) {
                clearTimeout(timeoutId);
                reject(new Error(snapshot.context.error || 'Setup machine failed'));
              }
            });
            
            setupActor.start();
            setupActor.send({ type: 'LOAD_TEMPLATES' });
          });
          
          if (setupResult && setupResult.length > 0) {
            const fallbackTemplateId = setupResult[0].id;
            console.log('[ActiveWorkoutMachine] 🎯 Found fallback template:', fallbackTemplateId);
            
            const templateResult = await tryLoadTemplate(fallbackTemplateId);
            const loadedTemplate = templateResult.template;
            console.log('[ActiveWorkoutMachine] ✅ Loaded fallback template:', loadedTemplate.name, 'with', loadedTemplate.exercises.length, 'exercises');
            return loadedTemplate;
          }
        } catch (fallbackError) {
          const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
          console.warn('[ActiveWorkoutMachine] ⚠️ Fallback template loading failed:', fallbackErrorMessage);
        }
        
        // Strategy 3: Last resort - Create minimal template for testing
        console.log('[ActiveWorkoutMachine] 🆘 Creating minimal template as last resort...');
        const minimalTemplate: WorkoutTemplate = {
          id: 'minimal-template',
          name: 'Basic Workout',
          description: 'Minimal template for testing',
          exercises: [
            {
              exerciseRef: '33401:test:pushups',
              sets: 3,
              reps: 10,
              weight: 0,
              restTime: 60
            },
            {
              exerciseRef: '33401:test:squats',
              sets: 3,
              reps: 15,
              weight: 0,
              restTime: 60
            }
          ],
          estimatedDuration: 900, // 15 minutes
          difficulty: 'beginner',
          authorPubkey: userPubkey,
          createdAt: Math.floor(Date.now() / 1000)
        };
        
        console.log('[ActiveWorkoutMachine] ✅ Created minimal template with', minimalTemplate.exercises.length, 'exercises');
        return minimalTemplate;
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('[ActiveWorkoutMachine] ❌ All template loading strategies failed:', error);
        throw new Error(`Failed to load any template: ${errorMessage}`);
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
  id: 'activeWorkout',
  
  // Initial context from input
  context: ({ input }) => ({
    // Spread default context
    ...defaultActiveWorkoutContext,
    
    // Override with input data
    userInfo: input.userInfo,
    workoutData: input.workoutData,
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
    exerciseSetCounters: new Map<string, number>()
  }),
  
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
          templateId: context.templateSelection.templateId || 'default-template',
          userPubkey: context.userInfo.pubkey
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
            })
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
                    
                    // 🧪 PROGRESSIVE SET TESTING: Generate realistic workout progressions
                    // This tests if NDK's mergeTags() deduplication can be bypassed with unique tag content
                    
                    // Calculate total planned sets for this exercise
                    const totalSets = currentExercise.sets || 3;
                    
                    // Generate progressive set data based on research findings
                    const progressiveSetData = generateProgressiveSet(
                      currentExercise, 
                      currentExerciseSetNumber, 
                      totalSets
                    );
                    
                    const autoGeneratedSetData = {
                      exerciseRef: currentExercise.exerciseRef,
                      setNumber: currentExerciseSetNumber, // Use per-exercise set number for NDK deduplication fix
                      reps: event.setData?.reps || progressiveSetData.reps,
                      weight: event.setData?.weight ?? progressiveSetData.weight,
                      rpe: event.setData?.rpe || progressiveSetData.rpe,
                      setType: (event.setData?.setType || progressiveSetData.setType) as 'warmup' | 'normal' | 'drop' | 'failure',
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
