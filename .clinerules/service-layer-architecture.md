# Service Layer Architecture Rule (NDK-First)

## Brief overview
This rule establishes patterns for creating and using service layers in NDK-first applications, enabling clean separation of business logic from XState machines and React components while leveraging NDK's built-in cache and subscription optimizations.

## Service Layer Principles for NDK-First Architecture

### Core Concepts
- **Business Logic Only**: Services handle calculations, transformations, and validations - NOT data fetching
- **NDK Cache First**: Let NDK handle all data operations through components and hooks
- **Zero Database Complexity**: No custom persistence logic in services
- **Singleton Pattern**: Simple service modules without dependency injection complexity
- **XState Integration**: Services called directly in actors, not injected as dependencies

### When to Create Services
- **Complex Calculations**: Analytics, statistics, performance metrics
- **Data Transformation**: Converting between Nostr events and display models
- **Business Logic**: Workout validation, progression algorithms, form calculations
- **Reusable Operations**: Logic used across multiple machines and components
- **NOT for Data Fetching**: NDK cache handles all persistence and retrieval

## NDK-First Service Architecture Patterns

### Pattern 1: Pure Business Logic Service (Recommended)
```typescript
// ✅ CORRECT: Pure business logic - no NDK operations
export class WorkoutAnalyticsService {
  calculateWorkoutStats(workouts: ParsedWorkoutEvent[]): WorkoutStats {
    const totalWorkouts = workouts.length;
    const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
    const averageDuration = totalDuration / totalWorkouts;
    
    const exerciseFrequency = new Map<string, number>();
    workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        const exerciseId = exercise.reference.split(':')[2]; // Extract d-tag
        const count = exerciseFrequency.get(exerciseId) || 0;
        exerciseFrequency.set(exerciseId, count + 1);
      });
    });

    return {
      totalWorkouts,
      totalDuration,
      averageDuration,
      mostFrequentExercises: Array.from(exerciseFrequency.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([exerciseId, count]) => ({ exerciseId, count }))
    };
  }

  validateWorkoutData(workoutData: any): ValidationResult {
    if (!workoutData.exercises || workoutData.exercises.length === 0) {
      return { valid: false, error: 'Workout must have at least one exercise' };
    }
    
    if (workoutData.exercises.some((ex: any) => !ex.reference)) {
      return { valid: false, error: 'All exercises must have valid references' };
    }
    
    return { valid: true };
  }

  generateNIP101eEvent(workoutData: CompletedWorkout, userPubkey: string): WorkoutEventData {
    return {
      kind: 1301,
      content: `Completed ${workoutData.exercises.length} exercises`,
      tags: [
        ['d', workoutData.id],
        ['title', workoutData.title],
        ['start', workoutData.startTime.toString()],
        ['end', workoutData.endTime.toString()],
        ['completed', 'true'],
        // All completed sets as exercise tags
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

// Export singleton instance
export const workoutAnalyticsService = new WorkoutAnalyticsService();
```

### Pattern 2: NDK Operations in Components (Data Layer)
```typescript
// ✅ CORRECT: Components handle NDK, services handle logic
import { useSubscribe } from '@nostr-dev-kit/ndk-react';
import { workoutAnalyticsService } from '@/lib/services/workoutAnalytics';

const WorkoutDashboard = () => {
  const { user } = useNDKSession();
  
  // NDK handles data fetching and caching automatically
  const { events: workoutEvents } = useSubscribe({
    filters: [{ kinds: [1301], authors: [user.pubkey], limit: 50 }],
    opts: { cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST }
  });
  
  // Parse events to application models
  const workouts = useMemo(() => 
    workoutEvents.map(parseWorkoutEvent), 
    [workoutEvents]
  );
  
  // Service handles business logic only
  const stats = useMemo(() => 
    workoutAnalyticsService.calculateWorkoutStats(workouts),
    [workouts]
  );
  
  return (
    <div>
      <h2>Workout Statistics</h2>
      <p>Total Workouts: {stats.totalWorkouts}</p>
      <p>Average Duration: {Math.round(stats.averageDuration / 60)} minutes</p>
      <WorkoutFrequencyChart exercises={stats.mostFrequentExercises} />
    </div>
  );
};

// Multiple components can subscribe to same data - NDK optimizes automatically
const WorkoutHistory = () => {
  const { user } = useNDKSession();
  
  // Same filter = NDK shares subscription and cache
  const { events: workoutEvents } = useSubscribe({
    filters: [{ kinds: [1301], authors: [user.pubkey], limit: 50 }],
    opts: { cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST }
  });
  
  const workouts = useMemo(() => 
    workoutEvents.map(parseWorkoutEvent),
    [workoutEvents]
  );
  
  return (
    <div>
      {workouts.map(workout => {
        const summary = workoutAnalyticsService.generateWorkoutSummary(workout);
        return (
          <WorkoutCard 
            key={workout.id} 
            workout={workout} 
            summary={summary} 
          />
        );
      })}
    </div>
  );
};
```

### Pattern 3: XState + Service Integration (No Injection)
```typescript
// ✅ CORRECT: XState calls services directly - no injection complexity
import { fromPromise } from 'xstate';
import { workoutAnalyticsService } from '@/lib/services/workoutAnalytics';
import { getNDKInstance } from '@/lib/ndk';

const workoutCompletionMachine = setup({
  types: {
    context: {} as {
      workoutData: CompletedWorkout;
      userPubkey: string;
      validationResult: ValidationResult | null;
      eventId?: string;
    },
    events: {} as 
      | { type: 'VALIDATE_WORKOUT' }
      | { type: 'PUBLISH_WORKOUT' }
  },
  actors: {
    // Service handles business logic only
    validateWorkoutActor: fromPromise(async ({ input }: { 
      input: { workoutData: CompletedWorkout } 
    }) => {
      // Direct service call - no injection needed
      return workoutAnalyticsService.validateWorkoutData(input.workoutData);
    }),

    // Direct NDK operations in actors
    publishWorkoutActor: fromPromise(async ({ input }: {
      input: { workoutData: CompletedWorkout; userPubkey: string }
    }) => {
      const ndk = getNDKInstance();
      if (!ndk || !ndk.signer) {
        throw new Error('NDK not authenticated');
      }
      
      // Service generates event data
      const eventData = workoutAnalyticsService.generateNIP101eEvent(
        input.workoutData, 
        input.userPubkey
      );
      
      // NDK handles publishing
      const event = new NDKEvent(ndk, eventData);
      await event.publish();
      
      return { eventId: event.id };
    })
  }
}).createMachine({
  id: 'workoutCompletion',
  initial: 'validating',
  
  context: ({ input }) => ({
    workoutData: input.workoutData,
    userPubkey: input.userPubkey,
    validationResult: null
  }),
  
  states: {
    validating: {
      invoke: {
        src: 'validateWorkoutActor',
        input: ({ context }) => ({ workoutData: context.workoutData }),
        onDone: {
          target: 'validated',
          actions: assign({
            validationResult: ({ event }) => event.output
          })
        },
        onError: 'validationError'
      }
    },
    
    validated: {
      on: { PUBLISH_WORKOUT: 'publishing' }
    },
    
    publishing: {
      invoke: {
        src: 'publishWorkoutActor',
        input: ({ context }) => ({ 
          workoutData: context.workoutData,
          userPubkey: context.userPubkey 
        }),
        onDone: {
          target: 'published',
          actions: assign({
            eventId: ({ event }) => event.output.eventId
          })
        },
        onError: 'publishError'
      }
    },
    
    published: { type: 'final' },
    validationError: {},
    publishError: {}
  }
});
```

## Service Organization for NDK-First

### Pattern 1: Domain-Specific Services
```typescript
// src/lib/services/workoutAnalytics.ts
export class WorkoutAnalyticsService {
  calculateStats(workouts: ParsedWorkoutEvent[]): WorkoutStats { }
  validateWorkout(data: any): ValidationResult { }
  generateSummary(workout: ParsedWorkoutEvent): WorkoutSummary { }
}

// src/lib/services/exerciseAnalytics.ts  
export class ExerciseAnalyticsService {
  analyzePerformance(sets: CompletedSet[]): PerformanceMetrics { }
  calculateProgression(historical: CompletedSet[]): ProgressionData { }
  suggestWeight(history: CompletedSet[], rpe: number): number { }
}

// src/lib/services/workoutGeneration.ts
export class WorkoutGenerationService {
  generateFromTemplate(template: WorkoutTemplate): WorkoutPlan { }
  adaptForUser(plan: WorkoutPlan, userLevel: string): WorkoutPlan { }
  calculateRestTimes(intensity: number): number { }
}

// Export singletons
export const workoutAnalyticsService = new WorkoutAnalyticsService();
export const exerciseAnalyticsService = new ExerciseAnalyticsService();
export const workoutGenerationService = new WorkoutGenerationService();
```

### Pattern 2: Service Composition
```typescript
// src/lib/services/index.ts - Barrel exports
export { workoutAnalyticsService } from './workoutAnalytics';
export { exerciseAnalyticsService } from './exerciseAnalytics';
export { workoutGenerationService } from './workoutGeneration';

// Usage in components
import { 
  workoutAnalyticsService, 
  exerciseAnalyticsService 
} from '@/lib/services';

const analytics = workoutAnalyticsService.calculateStats(workouts);
const performance = exerciseAnalyticsService.analyzePerformance(sets);
```

## NDK-Specific Optimizations

### Pattern 1: Leverage NDK Cache Automatically
```typescript
// ✅ CORRECT: Let NDK handle caching and optimization
const ExerciseLibrary = () => {
  // NDK automatically:
  // - Caches in IndexedDB
  // - Deduplicates subscriptions
  // - Optimizes network requests
  const { events: exerciseEvents } = useSubscribe({
    filters: [{ kinds: [33401], '#t': ['fitness'] }],
    opts: { cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST }
  });
  
  const exercises = useMemo(() => 
    exerciseEvents.map(parseExerciseTemplate),
    [exerciseEvents]
  );
  
  // Service handles business logic only
  const categorized = exerciseAnalyticsService.categorizeExercises(exercises);
  
  return <ExerciseGrid exercises={categorized} />;
};
```

### Pattern 2: Offline-First with NDK
```typescript
// ✅ CORRECT: NDK handles offline publishing automatically
const useWorkoutPublishing = () => {
  const { ndk } = useNDK();
  
  const publishWorkout = useCallback(async (workoutData: CompletedWorkout) => {
    if (!ndk || !ndk.signer) {
      throw new Error('Not authenticated');
    }
    
    // Service generates event data
    const eventData = workoutAnalyticsService.generateNIP101eEvent(
      workoutData, 
      ndk.signer.user.pubkey
    );
    
    // NDK handles:
    // - Event publishing
    // - Offline queuing
    // - Retry logic
    // - Cache updates
    const event = new NDKEvent(ndk, eventData);
    await event.publish();
    
    return event.id;
  }, [ndk]);
  
  return { publishWorkout };
};
```

## Service Testing for NDK-First

### Pattern 1: Pure Service Testing
```typescript
// ✅ CORRECT: Test services without NDK complexity
describe('WorkoutAnalyticsService', () => {
  let service: WorkoutAnalyticsService;

  beforeEach(() => {
    service = new WorkoutAnalyticsService();
  });

  it('should calculate workout stats correctly', () => {
    const workouts = createMockWorkouts();
    const stats = service.calculateWorkoutStats(workouts);
    
    expect(stats.totalWorkouts).toBe(2);
    expect(stats.averageDuration).toBe(2100);
  });

  it('should validate workout data', () => {
    const invalidWorkout = { exercises: [] };
    const result = service.validateWorkoutData(invalidWorkout);
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at least one exercise');
  });
});
```

### Pattern 2: Component Testing with NDK Mocks
```typescript
// ✅ CORRECT: Mock NDK hooks for component testing
import { renderWithNDK } from '@/test/utils';

describe('WorkoutDashboard', () => {
  it('should display workout statistics', () => {
    const mockWorkouts = createMockWorkoutEvents();
    
    const { getByText } = renderWithNDK(<WorkoutDashboard />, {
      mockSubscriptions: {
        '[{"kinds":[1301]}]': mockWorkouts
      }
    });
    
    expect(getByText('Total Workouts: 3')).toBeInTheDocument();
  });
});
```

## Anti-Patterns to Avoid

### ❌ FORBIDDEN Patterns
```typescript
// DON'T: Data fetching in services
class WorkoutService {
  async getWorkouts(): Promise<Workout[]> {
    const ndk = getNDKInstance(); // ❌ Services shouldn't access NDK
    return await ndk.fetchEvents([...]);
  }
}

// DON'T: Service injection in XState context
interface Context {
  workoutService: WorkoutService; // ❌ No services in context
}

// DON'T: Complex service provider patterns
const ServiceProvider = ({ children }) => {
  const services = {
    workoutService: new WorkoutService(ndk), // ❌ Complex injection
  };
  return <ServiceContext.Provider value={services}>{children}</ServiceContext.Provider>;
};
```

### ✅ CORRECT Alternatives
```typescript
// DO: NDK operations in components
const { events: workouts } = useSubscribe([...]); // Component handles NDK

// DO: Pure business logic in services
const stats = workoutAnalyticsService.calculateStats(workouts); // Service handles logic

// DO: Direct service calls in XState
const result = await workoutAnalyticsService.processWorkout(data); // Direct call
```

## Migration Strategy from Database-Heavy Services

### Phase 1: Identify Service Types
```typescript
// ❌ DATABASE-HEAVY (needs refactoring)
class OldWorkoutService {
  async getWorkouts(): Promise<Workout[]> { /* Database fetch */ }
  async saveWorkout(workout: Workout): Promise<void> { /* Database save */ }
  calculateStats(workoutIds: string[]): Promise<Stats> { /* Database joins */ }
}

// ✅ NDK-FIRST (business logic only)
class NewWorkoutAnalyticsService {
  calculateStats(workouts: ParsedWorkoutEvent[]): WorkoutStats { /* Pure logic */ }
  validateWorkout(data: any): ValidationResult { /* Pure validation */ }
  generateEvent(data: CompletedWorkout): EventData { /* Pure transformation */ }
}
```

### Phase 2: Extract Business Logic
1. Move calculations, validations, and transformations to services
2. Remove all database/persistence code
3. Convert to pure functions where possible
4. Export as singletons

### Phase 3: Update Components and Machines
1. Replace service calls with NDK hooks in components
2. Use direct service calls in XState actors
3. Remove service injection complexity
4. Leverage NDK's built-in optimizations

## When to Apply This Rule

### Always Create Services For:
- Complex calculations (statistics, analytics, progression)
- Data validation and transformation
- Business rule implementation
- Event generation (NIP-101e, NIP-51)
- Reusable algorithms

### Never Create Services For:
- Data fetching (use NDK hooks)
- Caching (NDK handles automatically)
- Persistence (NDK handles automatically)
- Subscription management (NDK optimizes)

### Success Metrics:
- Services contain zero NDK operations
- Business logic is reusable and testable
- Components use NDK hooks for data
- XState machines call services directly
- No complex dependency injection needed

## XState v5 Compliance Validation

### ✅ **Official XState Patterns Confirmed**
Based on XState documentation research, our service patterns align perfectly with official recommendations:

**✅ `setup({ actors })` Pattern**: Our `fromPromise` actors in setup blocks follow exact XState v5 patterns
**✅ Direct Service Calls**: XState docs show direct function calls in actors, not dependency injection
**✅ Input-Based Architecture**: Services receive data via `input` parameter, matching XState actor patterns
**✅ No Context Injection**: XState v5 discourages external services in context - use input instead

### ✅ **XState Documentation References**
- **Actor Logic Creators**: `fromPromise(async ({ input }) => ...)` - matches our service integration
- **Setup API**: `setup({ actors: { serviceName: fromPromise(...) } })` - our exact pattern
- **Input Patterns**: Services receive data via input, not context injection
- **Provider Pattern**: Use `.provide({ actors })` for runtime actor logic, not service injection

## Golf App Migration Context

### **Parallel Service Structures**
```typescript
// Workout services (current)
export const workoutAnalyticsService = new WorkoutAnalyticsService();
export const exerciseAnalyticsService = new ExerciseAnalyticsService();

// Golf services (same patterns)
export const golfAnalyticsService = new GolfAnalyticsService();
export const courseAnalyticsService = new CourseAnalyticsService();
export const shotAnalyticsService = new ShotAnalyticsService();

// Both use identical XState integration patterns
const golfRoundMachine = setup({
  actors: {
    analyzeRound: fromPromise(async ({ input }) => {
      return golfAnalyticsService.calculateRoundStats(input.shots);
    })
  }
});
```

### **Cross-Domain Pattern Reuse**
- **Same Service Architecture**: Pure business logic, no data fetching
- **Same XState Integration**: Direct calls in `fromPromise` actors
- **Same NDK Patterns**: Components handle data, services handle logic
- **Same Testing Approach**: Pure service testing + mocked component testing

## Performance Benefits

### **NDK Automatic Optimizations**
- **Subscription Deduplication**: Multiple components with same filter = single subscription
- **IndexedDB Cache**: Automatic caching with configurable size limits
- **Network Optimization**: Intelligent relay connection management
- **Offline Queue**: Automatic retry logic for failed publishes

### **Service Layer Performance**
- **CPU-Bound Operations**: Services focus on calculations while NDK handles I/O
- **Memory Efficiency**: No duplicate data storage - NDK cache is single source
- **Predictable Performance**: Pure functions have consistent execution time
- **Scalable Architecture**: Services can be moved to web workers if needed

## Enhanced Error Handling Patterns

### **Result-Based Error Handling**
```typescript
// ✅ CORRECT: Return results instead of throwing
interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

export class WorkoutAnalyticsService {
  validateWorkoutData(data: any): ValidationResult {
    if (!data.exercises?.length) {
      return { 
        valid: false, 
        error: 'Workout must include at least one exercise' 
      };
    }
    
    const warnings: string[] = [];
    if (data.exercises.length > 20) {
      warnings.push('Large workout may impact performance');
    }
    
    return { valid: true, warnings };
  }

  calculateStats(workouts: ParsedWorkoutEvent[]): AnalyticsResult {
    if (workouts.length === 0) {
      return {
        success: false,
        error: 'No workout data available for analysis'
      };
    }
    
    try {
      const stats = this.performCalculations(workouts);
      return { success: true, data: stats };
    } catch (error) {
      return {
        success: false,
        error: `Calculation failed: ${error.message}`
      };
    }
  }
}

// XState integration with result handling
const analyticsActor = fromPromise(async ({ input }) => {
  const result = workoutAnalyticsService.calculateStats(input.workouts);
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return result.data;
});
```

### **Graceful Degradation**
```typescript
export class ExerciseAnalyticsService {
  analyzePerformance(sets: CompletedSet[]): PerformanceResult {
    // Always return usable data, even with insufficient input
    if (sets.length < 2) {
      return {
        trend: 'insufficient_data',
        confidence: 0,
        recommendation: 'Complete more sets for analysis',
        basicStats: this.calculateBasicStats(sets)
      };
    }
    
    return {
      trend: this.calculateTrend(sets),
      confidence: this.calculateConfidence(sets),
      recommendation: this.generateRecommendation(sets),
      basicStats: this.calculateBasicStats(sets)
    };
  }
}
```

## Advanced Service Patterns

### **Service Composition**
```typescript
// Compose multiple services for complex operations
export class WorkoutPlanningService {
  constructor(
    private analytics = workoutAnalyticsService,
    private exercise = exerciseAnalyticsService,
    private generation = workoutGenerationService
  ) {}

  createPersonalizedPlan(userHistory: ParsedWorkoutEvent[]): WorkoutPlan {
    // Analyze user's performance patterns
    const userStats = this.analytics.calculateUserProfile(userHistory);
    
    // Identify strengths and weaknesses
    const performance = this.exercise.analyzeUserPerformance(userHistory);
    
    // Generate targeted plan
    return this.generation.createPlan({
      userLevel: userStats.level,
      weaknesses: performance.weakAreas,
      preferences: userStats.preferredExercises,
      timeConstraints: userStats.averageWorkoutDuration
    });
  }
}

export const workoutPlanningService = new WorkoutPlanningService();
```

### **Service Middleware Pattern**
```typescript
// Add cross-cutting concerns without complexity
export function withLogging<T extends (...args: any[]) => any>(
  service: T,
  methodName: string
): T {
  return ((...args: any[]) => {
    console.log(`[${service.constructor.name}] ${methodName} called`);
    const result = service(...args);
    console.log(`[${service.constructor.name}] ${methodName} completed`);
    return result;
  }) as T;
}

// Usage
export const workoutAnalyticsService = new WorkoutAnalyticsService();
workoutAnalyticsService.calculateStats = withLogging(
  workoutAnalyticsService.calculateStats.bind(workoutAnalyticsService),
  'calculateStats'
);
```

This NDK-first service architecture eliminates database complexity while maintaining clean separation of concerns and excellent testability. The patterns are fully validated against XState v5 official documentation and provide a solid foundation for both workout and golf app development.

---

**Last Updated**: 2025-06-26
**Project**: POWR Workout PWA / NDK-First Architecture
**Environment**: Web Browser + React Native Ready
**XState Compliance**: Validated against official XState v5 documentation
