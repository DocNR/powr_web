# Service Layer Architecture Rule

## Brief overview
This rule establishes patterns for creating and using service layers in the POWR Workout PWA, enabling clean separation of business logic from XState machines and React components while maintaining web-specific optimizations.

## Service Layer Principles for Web

### Core Concepts
- **Business Logic Separation**: Extract complex operations from XState machines and React components
- **Reusability**: Services can be used across multiple machines and components
- **Testability**: Isolated business logic is easier to unit test
- **Web Optimization**: Services designed for browser environments and NDK cache integration
- **Type Safety**: Full TypeScript support with proper interfaces

### When to Create Services
- **Complex Business Logic**: Operations that involve multiple steps or calculations
- **NDK Cache Operations**: Workout data retrieval, exercise template management
- **Data Transformation**: Converting between Nostr events and application models
- **External API Integration**: Fitness APIs, social features, analytics
- **Reusable Operations**: Logic used by multiple machines or components

## Service Architecture Patterns

### Pattern 1: Business Logic Service (No Data Fetching)
```typescript
// ✅ CORRECT: Pure business logic service - no data fetching
export interface WorkoutAnalyticsService {
  calculateWorkoutStats(workouts: WorkoutEvent[]): WorkoutStats;
  generateWorkoutSummary(workout: WorkoutEvent): WorkoutSummary;
  validateWorkoutData(workoutData: any): ValidationResult;
  transformWorkoutForDisplay(workout: WorkoutEvent): DisplayWorkout;
}

export class WorkoutAnalyticsService implements WorkoutAnalyticsService {
  calculateWorkoutStats(workouts: WorkoutEvent[]): WorkoutStats {
    const totalWorkouts = workouts.length;
    const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
    const averageDuration = totalDuration / totalWorkouts;
    
    const exerciseFrequency = new Map<string, number>();
    workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        const count = exerciseFrequency.get(exercise.name) || 0;
        exerciseFrequency.set(exercise.name, count + 1);
      });
    });

    return {
      totalWorkouts,
      totalDuration,
      averageDuration,
      mostFrequentExercises: Array.from(exerciseFrequency.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }))
    };
  }

  generateWorkoutSummary(workout: WorkoutEvent): WorkoutSummary {
    const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const totalReps = workout.exercises.reduce((sum, ex) => 
      sum + ex.sets.reduce((setSum, set) => setSum + set.reps, 0), 0);
    const totalWeight = workout.exercises.reduce((sum, ex) =>
      sum + ex.sets.reduce((setSum, set) => setSum + (set.weight * set.reps), 0), 0);

    return {
      duration: workout.duration,
      totalSets,
      totalReps,
      totalWeight,
      exerciseCount: workout.exercises.length,
      muscleGroups: [...new Set(workout.exercises.flatMap(ex => ex.muscleGroups))]
    };
  }

  validateWorkoutData(workoutData: any): ValidationResult {
    // Pure validation logic - no external dependencies
    if (!workoutData.exercises || workoutData.exercises.length === 0) {
      return { valid: false, error: 'Workout must have at least one exercise' };
    }
    
    return { valid: true };
  }

  transformWorkoutForDisplay(workout: WorkoutEvent): DisplayWorkout {
    // Pure transformation logic
    return {
      id: workout.tagId(),
      title: workout.title || 'Untitled Workout',
      date: new Date(workout.created_at * 1000).toLocaleDateString(),
      duration: this.formatDuration(workout.duration),
      exercises: workout.exercises.map(ex => ({
        name: ex.name,
        setCount: ex.sets.length,
        totalReps: ex.sets.reduce((sum, set) => sum + set.reps, 0)
      }))
    };
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }
}
```

### Pattern 2: Component + Service Integration
```typescript
// ✅ CORRECT: Component handles data, service handles logic
import { useSubscribe } from '@nostr-dev-kit/ndk-hooks';
import { WorkoutAnalyticsService } from '@/lib/services/workoutAnalyticsService';

const WorkoutDashboard = () => {
  // Component-level subscription (NDK optimizes automatically)
  const { events: workouts } = useSubscribe<WorkoutEvent>([
    { kinds: [1301], authors: [userPubkey], limit: 50 }
  ]);
  
  // Service handles business logic only
  const analyticsService = new WorkoutAnalyticsService();
  const stats = analyticsService.calculateWorkoutStats(workouts);
  
  return (
    <div>
      <h2>Workout Statistics</h2>
      <p>Total Workouts: {stats.totalWorkouts}</p>
      <p>Average Duration: {stats.averageDuration} minutes</p>
      <div>
        <h3>Most Frequent Exercises:</h3>
        {stats.mostFrequentExercises.map(({ name, count }) => (
          <div key={name}>{name}: {count} times</div>
        ))}
      </div>
    </div>
  );
};

// Multiple components can subscribe to same data - NDK merges efficiently
const WorkoutList = () => {
  const { events: workouts } = useSubscribe<WorkoutEvent>([
    { kinds: [1301], authors: [userPubkey], limit: 50 }
  ]);
  
  const analyticsService = new WorkoutAnalyticsService();
  
  return (
    <div>
      {workouts.map(workout => {
        const summary = analyticsService.generateWorkoutSummary(workout);
        return (
          <WorkoutCard 
            key={workout.tagId()} 
            workout={workout} 
            summary={summary} 
          />
        );
      })}
    </div>
  );
};
```

### Pattern 3: XState + Service Integration (Business Logic Only)
```typescript
// ✅ CORRECT: XState machines use services for business logic, not data fetching
import { fromPromise } from 'xstate';
import { WorkoutAnalyticsService } from '@/lib/services/workoutAnalyticsService';
import { publishEvent } from '@/lib/actors/globalNDKActor';

const workoutCompletionMachine = setup({
  types: {
    context: {} as {
      workoutData: WorkoutData;
      validationResult: ValidationResult | null;
      summary: WorkoutSummary | null;
    },
    events: {} as 
      | { type: 'VALIDATE_WORKOUT' }
      | { type: 'COMPLETE_WORKOUT' }
      | { type: 'PUBLISH_WORKOUT' }
  },
  actors: {
    validateWorkoutActor: fromPromise(async ({ input }: { 
      input: { workoutData: WorkoutData } 
    }) => {
      // Service handles pure business logic
      const analyticsService = new WorkoutAnalyticsService();
      return analyticsService.validateWorkoutData(input.workoutData);
    }),

    publishWorkoutActor: fromPromise(async ({ input }: {
      input: { workoutData: WorkoutData; userPubkey: string }
    }) => {
      // Global NDK Actor handles publishing
      const eventData = {
        kind: 1301,
        content: JSON.stringify(input.workoutData),
        tags: [
          ['d', `workout_${input.workoutData.id}`],
          ['date', input.workoutData.date],
          ['duration', input.workoutData.duration.toString()]
        ],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: input.userPubkey
      };
      
      publishEvent(eventData, `workout_${input.workoutData.id}`);
      return { success: true };
    })
  }
}).createMachine({
  id: 'workoutCompletion',
  initial: 'validating',
  context: {
    workoutData: null as any,
    validationResult: null,
    summary: null
  },
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
      entry: assign({
        summary: ({ context }) => {
          const analyticsService = new WorkoutAnalyticsService();
          return analyticsService.generateWorkoutSummary(context.workoutData);
        }
      }),
      on: {
        PUBLISH_WORKOUT: 'publishing'
      }
    },
    publishing: {
      invoke: {
        src: 'publishWorkoutActor',
        input: ({ context }) => ({ 
          workoutData: context.workoutData,
          userPubkey: context.userPubkey 
        }),
        onDone: 'published',
        onError: 'publishError'
      }
    },
    published: {
      type: 'final'
    },
    validationError: {},
    publishError: {}
  }
});
```

## Service Dependency Injection for Web

### Pattern 1: Service Provider Pattern
```typescript
// ✅ CORRECT: Service provider for React context
import React, { createContext, useContext, ReactNode } from 'react';
import { useNDK } from '@/providers/NDKProvider';

interface ServiceContainer {
  workoutCacheService: WorkoutCacheService;
  analyticsService: WorkoutAnalyticsService;
  exerciseLibraryService: ExerciseLibraryService;
}

const ServiceContext = createContext<ServiceContainer | null>(null);

export const ServiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { ndk } = useNDK();
  
  const services = useMemo(() => {
    if (!ndk) return null;
    
    return {
      workoutCacheService: new NDKWorkoutCacheService(ndk),
      analyticsService: new WorkoutAnalyticsService(),
      exerciseLibraryService: new ExerciseLibraryService(ndk)
    };
  }, [ndk]);

  if (!services) {
    return <div>Loading services...</div>;
  }

  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
};

export const useServices = (): ServiceContainer => {
  const services = useContext(ServiceContext);
  if (!services) {
    throw new Error('useServices must be used within ServiceProvider');
  }
  return services;
};
```

### Pattern 2: Service Injection in Components
```typescript
// ✅ CORRECT: Using services in React components
import { useServices } from '@/providers/ServiceProvider';

const WorkoutTemplateSelector: React.FC = () => {
  const { workoutCacheService } = useServices();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templates = await workoutCacheService.getWorkoutTemplates();
        setTemplates(templates);
      } catch (error) {
        console.error('Failed to load templates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [workoutCacheService]);

  if (loading) return <div>Loading templates...</div>;

  return (
    <div>
      {templates.map(template => (
        <div key={template.id}>
          <h3>{template.name}</h3>
          <p>{template.exercises.length} exercises</p>
        </div>
      ))}
    </div>
  );
};
```

## Web-Specific Service Optimizations

### Pattern 1: Browser Cache Integration
```typescript
// ✅ CORRECT: Service with browser cache optimization
export class OptimizedWorkoutCacheService implements WorkoutCacheService {
  private memoryCache = new Map<string, any>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private ndk: NDK) {}

  async getWorkoutTemplates(): Promise<WorkoutTemplate[]> {
    const cacheKey = 'workout-templates';
    
    // Check memory cache first
    if (this.isValidCache(cacheKey)) {
      return this.memoryCache.get(cacheKey);
    }

    // Fetch from NDK cache (IndexedDB)
    const templates = await this.fetchTemplatesFromNDK();
    
    // Update memory cache
    this.memoryCache.set(cacheKey, templates);
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);
    
    return templates;
  }

  private isValidCache(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private async fetchTemplatesFromNDK(): Promise<WorkoutTemplate[]> {
    // Implementation using NDK cache
    const filter = { kinds: [33402], '#t': ['fitness'] };
    const events = await this.ndk.fetchEvents(filter);
    return Array.from(events).map(parseWorkoutTemplate).filter(Boolean);
  }
}
```

### Pattern 2: Offline-First Service
```typescript
// ✅ CORRECT: Service with offline support
export class OfflineWorkoutService implements WorkoutCacheService {
  constructor(
    private ndk: NDK,
    private localStorageKey = 'offline-workouts'
  ) {}

  async saveWorkout(workout: Workout): Promise<void> {
    try {
      // Try to publish to Nostr first
      const event = generateWorkoutEvent(workout);
      await event.publish();
      
      // Remove from offline queue if successful
      this.removeFromOfflineQueue(workout.id);
      
    } catch (error) {
      console.warn('Failed to publish workout, saving offline:', error);
      
      // Save to offline queue
      this.addToOfflineQueue(workout);
    }
  }

  private addToOfflineQueue(workout: Workout): void {
    const queue = this.getOfflineQueue();
    queue.push({
      workout,
      timestamp: Date.now(),
      retryCount: 0
    });
    localStorage.setItem(this.localStorageKey, JSON.stringify(queue));
  }

  private removeFromOfflineQueue(workoutId: string): void {
    const queue = this.getOfflineQueue();
    const filtered = queue.filter(item => item.workout.id !== workoutId);
    localStorage.setItem(this.localStorageKey, JSON.stringify(filtered));
  }

  private getOfflineQueue(): OfflineWorkoutItem[] {
    const stored = localStorage.getItem(this.localStorageKey);
    return stored ? JSON.parse(stored) : [];
  }

  async syncOfflineWorkouts(): Promise<void> {
    const queue = this.getOfflineQueue();
    const successful: string[] = [];

    for (const item of queue) {
      try {
        await this.saveWorkout(item.workout);
        successful.push(item.workout.id);
      } catch (error) {
        console.warn(`Failed to sync workout ${item.workout.id}:`, error);
      }
    }

    // Remove successfully synced workouts
    successful.forEach(id => this.removeFromOfflineQueue(id));
  }
}
```

## Service Testing Patterns

### Pattern 1: Service Unit Testing
```typescript
// ✅ CORRECT: Unit testing services
describe('WorkoutAnalyticsService', () => {
  let service: WorkoutAnalyticsService;

  beforeEach(() => {
    service = new WorkoutAnalyticsService();
  });

  it('should calculate workout stats correctly', () => {
    const workouts: Workout[] = [
      {
        id: '1',
        duration: 1800,
        exercises: [
          {
            name: 'Push ups',
            sets: [{ reps: 10, weight: 0 }],
            muscleGroups: ['chest']
          }
        ]
      },
      {
        id: '2',
        duration: 2400,
        exercises: [
          {
            name: 'Squats',
            sets: [{ reps: 15, weight: 0 }],
            muscleGroups: ['legs']
          }
        ]
      }
    ];

    const stats = service.calculateWorkoutStats(workouts);

    expect(stats.totalWorkouts).toBe(2);
    expect(stats.totalDuration).toBe(4200);
    expect(stats.averageDuration).toBe(2100);
    expect(stats.mostFrequentExercises).toHaveLength(2);
  });
});
```

### Pattern 2: Service Integration Testing
```typescript
// ✅ CORRECT: Integration testing with mocked NDK
describe('NDKWorkoutCacheService', () => {
  let service: NDKWorkoutCacheService;
  let mockNDK: jest.Mocked<NDK>;

  beforeEach(() => {
    mockNDK = {
      fetchEvents: jest.fn(),
      fetchEvent: jest.fn()
    } as any;
    
    service = new NDKWorkoutCacheService(mockNDK);
  });

  it('should fetch workout templates from NDK', async () => {
    const mockEvents = new Set([
      createMockWorkoutTemplateEvent('template1'),
      createMockWorkoutTemplateEvent('template2')
    ]);
    
    mockNDK.fetchEvents.mockResolvedValue(mockEvents);

    const templates = await service.getWorkoutTemplates();

    expect(templates).toHaveLength(2);
    expect(mockNDK.fetchEvents).toHaveBeenCalledWith({
      kinds: [33402],
      '#t': ['fitness']
    });
  });
});
```

## Service Error Handling

### Pattern 1: Graceful Degradation
```typescript
// ✅ CORRECT: Service with graceful error handling
export class RobustWorkoutCacheService implements WorkoutCacheService {
  constructor(
    private ndk: NDK,
    private fallbackService: LocalWorkoutService
  ) {}

  async getWorkoutTemplates(): Promise<WorkoutTemplate[]> {
    try {
      // Try NDK cache first
      return await this.fetchFromNDK();
    } catch (error) {
      console.warn('NDK fetch failed, using fallback:', error);
      
      try {
        // Fallback to local storage
        return await this.fallbackService.getWorkoutTemplates();
      } catch (fallbackError) {
        console.error('All services failed:', fallbackError);
        
        // Return empty array rather than throwing
        return [];
      }
    }
  }

  private async fetchFromNDK(): Promise<WorkoutTemplate[]> {
    const filter = { kinds: [33402], '#t': ['fitness'] };
    const events = await this.ndk.fetchEvents(filter);
    return Array.from(events).map(parseWorkoutTemplate).filter(Boolean);
  }
}
```

## When to Apply This Rule

### Always Create Services For:
- NDK cache operations and data persistence
- Complex business logic calculations
- Data transformation between formats
- External API integrations
- Operations used by multiple components/machines

### Service Design Guidelines:
- Keep services focused on single responsibilities
- Use dependency injection for testability
- Implement proper error handling and fallbacks
- Optimize for web browser performance
- Maintain type safety with TypeScript interfaces

### Success Metrics:
- Business logic is reusable across components
- Services are easily unit testable
- Clear separation between UI and business logic
- Consistent error handling patterns
- Optimized performance for web browsers

This rule ensures that the POWR Workout PWA maintains clean architecture with well-designed service layers that are optimized for web browser environments and NDK integration.

---

**Last Updated**: 2025-06-21
**Project**: POWR Workout PWA
**Environment**: Web Browser
