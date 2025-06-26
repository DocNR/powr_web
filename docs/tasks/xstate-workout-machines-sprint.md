---
title: XState Workout Machines Sprint - Complete Implementation Plan
description: 3-phase sprint for implementing workout machines with NDK-first architecture and service extraction
status: draft
last_updated: 2025-06-26
category: sprint
---

# XState Workout Machines Sprint - Complete Implementation Plan

## Sprint Overview
Comprehensive 3-phase implementation plan for XState workout machines using proven Noga patterns, NDK-first architecture compliance, and strategic service extraction for golf app migration.

## Sprint Goals
- **Phase 1**: Implement complex XState machines to validate NDK-first architecture
- **Phase 2**: Validate, test, and optimize the implementation
- **Phase 3**: Extract services to simplify machines and prepare for golf app migration

## Architecture Foundation

### **Proven Pattern from Noga Golf App**
```
roundLifecycleMachine (Parent)
├── setupMachine (Child - invoked)
└── activeRoundMachine (Child - spawned)
```

### **POWR Workout Adaptation**
```
workoutLifecycleMachine (Parent)
├── workoutSetupMachine (Child - invoked)
└── activeWorkoutMachine (Child - spawned)
```

### **Key Architectural Principles**
- **NDK-First Single Database**: ONLY NDK IndexedDB cache for persistence
- **XState Context Persistence**: Active workout data in XState context, not database
- **Single Event Publishing**: Complete workout published as one NIP-101e event
- **Current Auth System**: Use existing Jotai + auth hooks (no NDK Provider needed)
- **Complex Machine Justified**: XState replacing entire database layer

---

## 🚀 **Phase 1: Core Machine Implementation (Week 1)**

### **Objective**
Implement complex XState machines that validate NDK-first architecture by replacing database functionality with XState context persistence.

### **Why Complex Machines Are Necessary**
Based on Claude AI analysis, the machine complexity is **architecturally justified**:
- **Noga's Approach**: Database handles persistence + Simple XState handles state
- **Our NDK-First**: XState context handles persistence + state + recovery + offline queuing

The additional states (`setCompleted`, `publishError`, `workoutCompleted`) exist **because** we're NDK-first, not despite it.

### **Phase 1 Implementation Steps**

#### **Day 1: Types and Interfaces**
Create TypeScript interfaces following Noga patterns:

```typescript
// src/lib/machines/workout/types/workoutTypes.ts

// Lifecycle machine context - NO SERVICES
export interface WorkoutLifecycleContext {
  workoutId?: string;
  workoutData?: WorkoutData;
  templateData?: WorkoutTemplate;
  userPubkey?: string; // From auth, not service
  error?: ErrorInfo;
  // NO NDK, NO services, NO external dependencies
}

// Lifecycle events
export type WorkoutLifecycleEvent = 
  | { type: 'START_SETUP'; userPubkey: string }
  | { type: 'SETUP_COMPLETE'; workoutData: WorkoutData }
  | { type: 'START_WORKOUT' }
  | { type: 'WORKOUT_COMPLETE'; workoutData: CompletedWorkoutData }
  | { type: 'CANCEL' };

// Active workout context - ALL DATA IN MEMORY
export interface ActiveWorkoutContext {
  workoutId: string;
  workoutData: WorkoutData;
  userPubkey: string;
  currentExerciseIndex: number;
  currentSetIndex: number;
  completedSets: CompletedSet[]; // ALL set data here
  startTime: number;
  isResting: boolean;
  restTimeRemaining: number;
  // NO database, NO services - pure XState context
}
```

#### **Day 2: Workout Lifecycle Machine**
Implement parent machine following Noga's roundLifecycleMachine:

```typescript
// src/lib/machines/workout/workoutLifecycleMachine.ts

export const workoutLifecycleMachine = setup({
  types: {} as {
    context: WorkoutLifecycleContext;
    events: WorkoutLifecycleEvent;
    input: { userPubkey: string; templateId?: string };
  },
  actors: {
    // Setup machine for template selection
    workoutSetupMachine: workoutSetupMachine,
    
    // Load workout data - NO service injection
    loadWorkoutActor: fromPromise(async ({ input }: { input: { workoutId: string } }) => {
      // Create service directly, don't inject
      const ndk = getNDKInstance();
      if (!ndk) throw new Error('NDK not initialized');
      
      // Use validated dependency resolution (867-903ms)
      const workoutEvent = await ndk.fetchEvent({ ids: [input.workoutId] });
      return parseWorkoutFromEvent(workoutEvent);
    })
  },
  guards: {
    // Simple guards following .clinerules
    hasWorkoutData: ({ context }) => !!context.workoutData,
    hasTemplateSelected: ({ context }) => !!context.templateData,
    canStartWorkout: ({ context }) => !!(context.workoutData && context.userPubkey)
  }
}).createMachine({
  id: 'workoutLifecycle',
  initial: 'idle',
  context: ({ input }) => ({
    userPubkey: input.userPubkey, // From auth system
    workoutId: undefined,
    workoutData: undefined,
    templateData: undefined,
    error: undefined
  }),
  states: {
    idle: {
      on: {
        START_SETUP: 'setup'
      }
    },
    setup: {
      invoke: {
        src: 'workoutSetupMachine',
        input: ({ context }) => ({
          userPubkey: context.userPubkey,
          preselectedTemplateId: context.templateData?.id
        }),
        onDone: {
          target: 'ready',
          actions: assign({
            workoutData: ({ event }) => event.output.workoutData,
            templateData: ({ event }) => event.output.templateData
          })
        },
        onError: {
          target: 'error',
          actions: assign({
            error: ({ event }) => event.error
          })
        }
      }
    },
    ready: {
      on: {
        START_WORKOUT: 'active',
        EDIT_WORKOUT: 'setup'
      }
    },
    active: {
      entry: assign({
        activeWorkoutActor: ({ spawn, context }) => {
          return spawn(activeWorkoutMachine, {
            id: 'activeWorkout',
            input: {
              workoutId: context.workoutId!,
              workoutData: context.workoutData!,
              userPubkey: context.userPubkey!
            }
          });
        }
      }),
      on: {
        WORKOUT_COMPLETE: {
          target: 'completed',
          actions: assign({
            workoutData: ({ event }) => event.workoutData
          })
        }
      }
    },
    completed: {
      type: 'final'
    },
    error: {
      on: {
        RETRY_SETUP: 'setup',
        RESET: 'idle'
      }
    }
  }
});
```

#### **Day 3: Active Workout Machine (Complex - Database Replacement)**
Implement real-time tracking with XState context persistence:

```typescript
// src/lib/machines/workout/activeWorkoutMachine.ts

export const activeWorkoutMachine = setup({
  types: {} as {
    context: ActiveWorkoutContext;
    input: { workoutId: string; workoutData: WorkoutData; userPubkey: string };
  },
  actors: {
    // Publish complete workout - NO service injection
    publishWorkoutActor: fromPromise(async ({ input }: { 
      input: { workoutData: CompletedWorkoutData; userPubkey: string } 
    }) => {
      const ndk = getNDKInstance();
      if (!ndk || !ndk.signer) {
        throw new Error('NDK not authenticated');
      }
      
      // Generate single NIP-101e event with ALL workout data
      const eventData = {
        kind: 1301,
        content: JSON.stringify({
          exercises: input.workoutData.exercises,
          duration: input.workoutData.duration,
          completedSets: input.workoutData.completedSets
        }),
        tags: [
          ['d', input.workoutData.id],
          ['date', new Date().toISOString().split('T')[0]],
          ['duration', input.workoutData.duration.toString()],
          // Individual exercise tags for each completed set
          ...input.workoutData.completedSets.map(set => [
            'exercise',
            set.exerciseId,
            '',
            set.weight.toString(),
            set.reps.toString(),
            set.rpe?.toString() || '7',
            set.setType || 'normal'
          ])
        ],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: input.userPubkey
      };
      
      const ndkEvent = new NDKEvent(ndk, eventData);
      await ndkEvent.publish();
      
      return { success: true, eventId: ndkEvent.id };
    })
  },
  guards: {
    // Simple guards following .clinerules
    hasMoreSets: ({ context }) => {
      const currentExercise = context.workoutData.exercises[context.currentExerciseIndex];
      return currentExercise && context.currentSetIndex < currentExercise.sets.length;
    },
    hasMoreExercises: ({ context }) => {
      return context.currentExerciseIndex < context.workoutData.exercises.length - 1;
    }
  }
}).createMachine({
  id: 'activeWorkout',
  initial: 'exerciseInProgress',
  context: ({ input }) => ({
    workoutId: input.workoutId,
    workoutData: input.workoutData,
    userPubkey: input.userPubkey,
    currentExerciseIndex: 0,
    currentSetIndex: 0,
    completedSets: [], // ALL workout data in XState context
    startTime: Date.now(),
    isResting: false,
    restTimeRemaining: 0
  }),
  states: {
    exerciseInProgress: {
      on: {
        // Simple event-driven transitions (no complex always)
        COMPLETE_SET: {
          target: 'setCompleted',
          actions: assign({
            completedSets: ({ context, event }) => [
              ...context.completedSets,
              {
                exerciseId: context.workoutData.exercises[context.currentExerciseIndex].id,
                setNumber: context.currentSetIndex + 1,
                reps: event.reps,
                weight: event.weight,
                rpe: event.rpe,
                setType: event.setType || 'normal',
                completedAt: Date.now()
              }
            ]
          })
        },
        COMPLETE_WORKOUT: 'workoutCompleted'
      }
    },
    setCompleted: {
      on: {
        // Explicit events instead of complex always transitions
        NEXT_SET: {
          target: 'exerciseInProgress',
          guard: 'hasMoreSets',
          actions: assign({
            currentSetIndex: ({ context }) => context.currentSetIndex + 1
          })
        },
        NEXT_EXERCISE: {
          target: 'nextExercise',
          guard: 'hasMoreExercises'
        },
        COMPLETE_WORKOUT: 'workoutCompleted'
      }
    },
    nextExercise: {
      entry: assign({
        currentExerciseIndex: ({ context }) => context.currentExerciseIndex + 1,
        currentSetIndex: 0
      }),
      on: {
        START_EXERCISE: 'exerciseInProgress',
        COMPLETE_WORKOUT: 'workoutCompleted'
      }
    },
    workoutCompleted: {
      invoke: {
        src: 'publishWorkoutActor',
        input: ({ context }) => ({
          workoutData: {
            id: context.workoutId,
            exercises: context.workoutData.exercises,
            completedSets: context.completedSets,
            startTime: context.startTime,
            endTime: Date.now(),
            duration: Date.now() - context.startTime
          },
          userPubkey: context.userPubkey
        }),
        onDone: {
          target: 'published',
          actions: sendParent(({ context, event }) => ({
            type: 'WORKOUT_COMPLETE',
            workoutData: {
              ...context.workoutData,
              completedSets: context.completedSets,
              duration: Date.now() - context.startTime,
              eventId: event.output.eventId
            }
          }))
        },
        onError: {
          target: 'publishError',
          actions: assign({
            error: ({ event }) => event.error
          })
        }
      }
    },
    published: {
      type: 'final'
    },
    publishError: {
      on: {
        RETRY_PUBLISH: 'workoutCompleted',
        COMPLETE_OFFLINE: {
          target: 'published',
          actions: [
            // Store for offline sync using browser sessionStorage
            ({ context }) => {
              const offlineWorkout = {
                ...context.workoutData,
                completedSets: context.completedSets,
                duration: Date.now() - context.startTime,
                userPubkey: context.userPubkey
              };
              sessionStorage.setItem(`offline_workout_${context.workoutId}`, JSON.stringify(offlineWorkout));
            },
            sendParent(({ context }) => ({
              type: 'WORKOUT_COMPLETE',
              workoutData: {
                ...context.workoutData,
                completedSets: context.completedSets,
                duration: Date.now() - context.startTime
              }
            }))
          ]
        }
      }
    }
  }
});
```

#### **Day 4: React Integration**
Create components using existing auth system:

```typescript
// src/providers/WorkoutProvider.tsx

import { createActorContext } from '@xstate/react';
import { workoutLifecycleMachine } from '@/lib/machines/workout/workoutLifecycleMachine';

// Create context using XState v5 pattern
export const WorkoutLifecycleContext = createActorContext(workoutLifecycleMachine);

// Provider component accepts input
export const WorkoutProvider: React.FC<{ 
  children: React.ReactNode;
  userPubkey: string; // From auth system
}> = ({ children, userPubkey }) => {
  return (
    <WorkoutLifecycleContext.Provider input={{ userPubkey }}>
      {children}
    </WorkoutLifecycleContext.Provider>
  );
};

// Hook for accessing workout state
export const useWorkoutState = () => {
  const actor = WorkoutLifecycleContext.useActorRef();
  const state = WorkoutLifecycleContext.useSelector(state => state);
  
  return {
    state,
    send: actor.send,
    // Convenience getters
    isIdle: state.matches('idle'),
    isSetup: state.matches('setup'),
    isActive: state.matches('active'),
    isCompleted: state.matches('completed'),
    // Context data
    workoutData: state.context.workoutData,
    templateData: state.context.templateData,
    error: state.context.error
  };
};

// Component integration with existing auth
const WorkoutScreen = () => {
  // Use existing auth hooks (no NDK Provider needed)
  const account = useAccount();
  const isAuthenticated = useIsAuthenticated();
  
  if (!isAuthenticated || !account?.pubkey) {
    return <AuthenticationPrompt />;
  }
  
  return (
    <WorkoutProvider userPubkey={account.pubkey}>
      <WorkoutFlow />
    </WorkoutProvider>
  );
};
```

### **Phase 1 Success Criteria**
- ✅ **Complete Workout Flow**: Setup → Active → Complete working end-to-end
- ✅ **XState Context Persistence**: All workout data maintained in memory
- ✅ **Single Event Publishing**: Complete workout as one NIP-101e event
- ✅ **NDK-First Compliance**: Zero custom database code
- ✅ **Auth Integration**: Works with existing Jotai + auth hooks

---

## 🧪 **Phase 2: Validation and Testing (Week 2)**

### **Objective**
Thoroughly test and validate the complex machine implementation, ensuring it meets performance and reliability requirements for production use.

### **Phase 2 Implementation Steps**

#### **Day 5-6: Unit and Integration Testing**

##### **Machine Logic Testing**
```typescript
// src/lib/machines/workout/__tests__/activeWorkoutMachine.test.ts

describe('ActiveWorkoutMachine', () => {
  it('should handle set completion correctly', () => {
    const actor = createActor(activeWorkoutMachine, {
      input: {
        workoutId: 'test-workout',
        workoutData: mockWorkoutData,
        userPubkey: 'test-pubkey'
      }
    });
    
    actor.start();
    
    // Complete a set
    actor.send({
      type: 'COMPLETE_SET',
      reps: 10,
      weight: 50,
      rpe: 7
    });
    
    const state = actor.getSnapshot();
    expect(state.context.completedSets).toHaveLength(1);
    expect(state.context.completedSets[0]).toMatchObject({
      reps: 10,
      weight: 50,
      rpe: 7
    });
  });
  
  it('should publish workout on completion', async () => {
    const mockNDK = createMockNDK();
    jest.mocked(getNDKInstance).mockReturnValue(mockNDK);
    
    const actor = createActor(activeWorkoutMachine, {
      input: mockWorkoutInput
    });
    
    actor.start();
    actor.send({ type: 'COMPLETE_WORKOUT' });
    
    await waitFor(() => {
      expect(mockNDK.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 1301,
          tags: expect.arrayContaining([
            ['d', 'test-workout'],
            ['completed', 'true']
          ])
        })
      );
    });
  });
});
```

##### **React Integration Testing**
```typescript
// src/components/workout/__tests__/WorkoutFlow.test.tsx

describe('WorkoutFlow Integration', () => {
  it('should complete full workout flow', async () => {
    const mockAccount = { pubkey: 'test-pubkey' };
    
    const { getByText, getByRole } = render(
      <WorkoutProvider userPubkey={mockAccount.pubkey}>
        <WorkoutFlow />
      </WorkoutProvider>
    );
    
    // Start workout
    fireEvent.click(getByText('Start Workout'));
    
    // Complete sets
    fireEvent.click(getByText('Complete Set'));
    fireEvent.click(getByText('Next Exercise'));
    
    // Finish workout
    fireEvent.click(getByText('Finish Workout'));
    
    await waitFor(() => {
      expect(getByText('Workout completed!')).toBeInTheDocument();
    });
  });
});
```

#### **Day 7: Performance Validation and Optimization**

##### **Memory Usage Testing**
```typescript
// Performance test for long workouts
describe('Performance Tests', () => {
  it('should handle large workout context efficiently', () => {
    const largeWorkout = createLargeWorkoutData(100); // 100 exercises
    
    const actor = createActor(activeWorkoutMachine, {
      input: {
        workoutId: 'large-workout',
        workoutData: largeWorkout,
        userPubkey: 'test-pubkey'
      }
    });
    
    actor.start();
    
    // Complete many sets
    for (let i = 0; i < 500; i++) {
      actor.send({
        type: 'COMPLETE_SET',
        reps: 10,
        weight: 50,
        rpe: 7
      });
    }
    
    const state = actor.getSnapshot();
    expect(state.context.completedSets).toHaveLength(500);
    
    // Memory usage should be reasonable
    const contextSize = JSON.stringify(state.context).length;
    expect(contextSize).toBeLessThan(1024 * 1024); // Less than 1MB
  });
});
```

##### **NDK Cache Performance**
```typescript
// Validate 867-903ms dependency resolution performance
describe('NDK Cache Performance', () => {
  it('should load workout templates within performance baseline', async () => {
    const startTime = performance.now();
    
    const templates = await loadWorkoutTemplates();
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should meet validated performance baseline
    expect(duration).toBeLessThan(1000); // Under 1 second
    expect(templates.length).toBeGreaterThan(0);
  });
});
```

### **Phase 2 Success Criteria**
- ✅ **Unit Test Coverage**: 90%+ coverage for machine logic
- ✅ **Integration Tests**: End-to-end workflow testing
- ✅ **Performance Validation**: Memory usage under 1MB for large workouts
- ✅ **NDK Performance**: Template loading under 1 second
- ✅ **Error Handling**: Graceful offline and network failure handling

---

## 🔧 **Phase 3: Service Extraction and Simplification (Week 3)**

### **Objective**
Extract business logic into services to simplify machines and prepare reusable patterns for golf app migration.

### **Why Service Extraction Now**
Based on Claude AI analysis, this is the perfect evolution:
1. **Phase 1**: Complex machine validates NDK-first architecture ✅
2. **Phase 2**: Testing proves the approach works ✅
3. **Phase 3**: Services clean up implementation for reuse

### **Phase 3 Implementation Steps**

#### **Day 8-9: Service Extraction**

##### **Workout Analytics Service**
```typescript
// src/lib/services/workoutAnalytics.ts

export class WorkoutAnalyticsService {
  calculateWorkoutStats(workouts: ParsedWorkoutEvent[]): WorkoutStats {
    const totalWorkouts = workouts.length;
    const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
    const averageDuration = totalDuration / totalWorkouts;
    
    return {
      totalWorkouts,
      totalDuration,
      averageDuration,
      completionRate: this.calculateCompletionRate(workouts)
    };
  }

  validateWorkoutData(workoutData: any): ValidationResult {
    if (!workoutData.exercises || workoutData.exercises.length === 0) {
      return { valid: false, error: 'Workout must have at least one exercise' };
    }
    
    return { valid: true };
  }

  generateNIP101eEvent(workoutData: CompletedWorkout, userPubkey: string): WorkoutEventData {
    return {
      kind: 1301,
      content: `Completed ${workoutData.exercises.length} exercises`,
      tags: [
        ['d', workoutData.id],
        ['start', workoutData.startTime.toString()],
        ['end', workoutData.endTime.toString()],
        ['completed', 'true'],
        ...workoutData.completedSets.map(set => [
          'exercise',
          set.exerciseRef,
          '',
          set.weight.toString(),
          set.reps.toString(),
          set.rpe.toString(),
          set.setType || 'normal'
        ])
      ],
      created_at: Math.floor(Date.now() / 1000),
      pubkey: userPubkey
    };
  }
}

// Export singleton
export const workoutAnalyticsService = new WorkoutAnalyticsService();
```

##### **Workout Data Service**
```typescript
// src/lib/services/workoutDataService.ts

export class WorkoutDataService {
  private workoutData: WorkoutData | null = null;
  private completedSets: CompletedSet[] = [];
  
  initializeWorkout(workoutData: WorkoutData): void {
    this.workoutData = workoutData;
    this.completedSets = [];
  }
  
  completeSet(setData: CompletedSet): void {
    this.completedSets.push({
      ...setData,
      completedAt: Date.now()
    });
  }
  
  getCurrentExercise(exerciseIndex: number): ExerciseData | null {
    if (!this.workoutData || exerciseIndex >= this.workoutData.exercises.length) {
      return null;
    }
    return this.workoutData.exercises[exerciseIndex];
  }
  
  getProgress(): ProgressData {
    const totalSets = this.workoutData?.exercises.reduce((sum, ex) => sum + ex.sets, 0) || 0;
    
    return {
      completedSets: this.completedSets.length,
      totalSets,
      completionPercentage: (this.completedSets.length / totalSets) * 100,
      currentExercise: this.getCurrentExercise(0)
    };
  }
  
  getCompletedWorkout(): CompletedWorkout | null {
    if (!this.workoutData) return null;
    
    return {
      id: this.workoutData.id,
      exercises: this.workoutData.exercises,
      completedSets: this.completedSets,
      startTime: this.workoutData.startTime || Date.now(),
      endTime: Date.now(),
      duration: Date.now() - (this.workoutData.startTime || Date.now())
    };
  }
}

// Export singleton
export const workoutDataService = new WorkoutDataService();
```

#### **Day 10: Simplified Machine with Services**

##### **Simplified Active Workout Machine**
```typescript
// src/lib/machines/workout/activeWorkoutMachine.v2.ts

export const simplifiedActiveWorkoutMachine = setup({
  types: {} as {
    context: SimplifiedWorkoutContext;
    events: WorkoutEvent;
  },
  actors: {
    // Services handle complexity
    processWorkoutActor: fromPromise(async ({ input }: { 
      input: { workoutData: WorkoutData } 
    }) => {
      workoutDataService.initializeWorkout(input.workoutData);
      return { success: true };
    }),
    
    publishWorkoutActor: fromPromise(async ({ input }: {
      input: { userPubkey: string }
    }) => {
      const completedWorkout = workoutDataService.getCompletedWorkout();
      if (!completedWorkout) {
        throw new Error('No completed workout data');
      }
      
      const ndk = getNDKInstance();
      if (!ndk || !ndk.signer) {
        throw new Error('NDK not authenticated');
      }
      
      // Service generates event data
      const eventData = workoutAnalyticsService.generateNIP101eEvent(
        completedWorkout,
        input.userPubkey
      );
      
      const ndkEvent = new NDKEvent(ndk, eventData);
      await ndkEvent.publish();
      
      return { eventId: ndkEvent.id };
    })
  }
}).createMachine({
  id: 'simplifiedActiveWorkout',
  initial: 'exercising',
  
  // Much simpler context - services handle data
  context: {
    currentState: 'ready',
    error: null
  },
  
  // Much simpler states - services handle complexity
  states: {
    exercising: {
      on: {
        COMPLETE_SET: {
          actions: ({ event }) => {
            // Service handles complexity
            workoutDataService.completeSet({
              exerciseId: event.exerciseId,
              setNumber: event.setNumber,
              reps: event.reps,
              weight: event.weight,
              rpe: event.rpe,
              setType: event.setType || 'normal'
            });
          }
        },
        COMPLETE_WORKOUT: 'publishing'
      }
    },
    
    publishing: {
      invoke: {
        src: 'publishWorkoutActor',
        input: ({ context }) => ({ userPubkey: context.userPubkey }),
        onDone: 'completed',
        onError: 'publishError'
      }
    },
    
    completed: { type: 'final' },
    publishError: {
      on: {
        RETRY_PUBLISH: 'publishing'
      }
    }
  }
});
```

#### **Day 11: Golf App Migration Preparation**

##### **Golf Service Templates**
```typescript
// src/lib/services/golfAnalytics.ts (Future)

export class GolfAnalyticsService {
  // Same patterns as workout service
  calculateRoundStats(rounds: ParsedRoundEvent[]): RoundStats {
    // Similar logic to workout stats
  }
  
  generateNIP101gEvent(roundData: CompletedRound, userPubkey: string): RoundEventData {
    // Similar to workout event generation
  }
}

// src/lib/services/golfDataService.ts (Future)

export class GolfDataService {
  private roundData: RoundData | null = null;
  private completedShots: ShotData[] = [];
  
  // Same patterns as workout data service
  recordShot(shotData: ShotData): void { }
  getCurrentHole(): HoleData { }
  getProgress(): ProgressData { }
}
```

##### **Golf Machine Templates**
```typescript
// Future golf machines will use same patterns
const activeRoundMachine = setup({
  actors: {
    processRoundActor: /* same pattern as workout */,
    publishRoundActor: /* same pattern as workout */
  }
}).createMachine({
  // Same simplified structure as workout machine
  states: {
    playing: { /* same as exercising */ },
    publishing: { /* same as workout publishing */ },
    completed: { /* same as workout completed */ }
  }
});
```

### **Phase 3 Success Criteria**
- ✅ **Service Extraction**: Business logic moved to reusable services
- ✅ **Simplified Machines**: State machines focus only on state transitions
- ✅ **Golf App Ready**: Patterns established for golf app migration
- ✅ **Reusable Architecture**: Services work across multiple domains
- ✅ **Maintained Performance**: No performance regression from service extraction

---

## 🎯 **Sprint Success Metrics**

### **Technical Metrics**
- **NDK-First Compliance**: Zero custom database code
- **Performance**: Template loading under 1 second (867-903ms baseline)
- **Memory Efficiency**: Workout context under 1MB for large workouts
- **Test Coverage**: 90%+ unit test coverage
- **Error Handling**: Graceful offline and network failure recovery

### **Architecture Metrics**
- **Service Reusability**: Services work for both workout and golf domains
- **Machine Simplicity**: Simplified machines have 50% fewer states
- **Code Maintainability**: Clear separation between data, logic, and state
- **Golf App Readiness**: Proven patterns ready for migration

### **Business Metrics**
- **Complete Workout Flow**: Setup → Active → Complete working end-to-end
- **Offline Support**: Failed publishes queued for later sync
- **User Experience**: Responsive UI with instant in-memory operations
- **Data Integrity**: No workout data
