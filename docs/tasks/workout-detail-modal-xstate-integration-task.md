---
title: WorkoutDetailModal with XState Integration Implementation
description: Build WorkoutDetailModal that opens on card click with XState machine handling dependency resolution and data loading
status: ready_for_implementation
start_date: 2025-07-02
category: task
priority: high
estimated_duration: 4-6 hours
sprint_day: 3
parent_sprint: ui-sprint-plan.md
lead: Developer + Claude
dependencies:
  - ui-sprint-day-2-workoutcard-calendar-task.md (COMPLETED)
success_criteria_threshold: 80%
---

# WorkoutDetailModal with XState Integration Implementation (SIMPLIFIED)

## 🎯 Objective

Build a beautiful WorkoutDetailModal that opens when users click workout cards, using the EXISTING workoutLifecycleMachine and loadTemplateActor that already work perfectly. Focus on UI and integration, not rebuilding working XState patterns.

## 🔍 **CRITICAL DISCOVERY: Everything Already Works!**

After reviewing the existing code:
- ✅ **workoutLifecycleMachine**: Complete lifecycle management (setup → active → completed → published)
- ✅ **loadTemplateActor**: 272ms template loading with exercise dependency resolution
- ✅ **WorkflowValidationTest**: Proven end-to-end workflow working
- ✅ **workoutAnalyticsService**: Full NIP-101e event generation
- ✅ **NDK Integration**: Real Nostr publishing and verification

**We just need to build the modal UI and connect it to the existing, working machine!**

## 🏗️ Simplified Architecture

### **Actual User Flow (Using Existing Machine)**
```
User clicks WorkoutCard in gallery
    ↓
Start existing workoutLifecycleMachine
send({ type: 'START_SETUP', preselectedTemplateId })
    ↓
Modal opens showing machine state
- state.matches('setup') → Loading spinner
- state.matches('active') → Template details with "Start Workout" button
- state.context has all resolved data from loadTemplateActor
    ↓
"Start Workout" button sends existing event
send({ type: 'WORKOUT_ACTIVE', workoutData })
    ↓
Navigate to ActiveTab (existing activeWorkoutMachine takes over)
```

### **XState Machine Cleanup Answer**
**Q: What happens if user closes modal without starting workout?**

**A: Simple event-driven cleanup:**
```typescript
const handleCloseModal = () => {
  // Send cancel event to machine
  send({ type: 'WORKOUT_CANCELLED' });
  // Machine transitions to 'idle' state and cleans up
  // No memory leaks, no hanging state
};
```

The existing workoutLifecycleMachine already handles this perfectly:
- `WORKOUT_CANCELLED` → transitions to 'idle'
- `cleanupActiveWorkout` action runs automatically
- Machine resets to initial state
- No manual cleanup needed!

### **Key Benefits**
- **Proven Architecture**: Using battle-tested XState patterns from WorkflowValidationTest
- **272ms Performance**: loadTemplateActor already achieves benchmark
- **Complete Lifecycle**: Setup → Active → Publishing all working
- **Automatic Cleanup**: XState handles all state management
- **Real NDK Integration**: No mocking, real Nostr events

## 📋 Implementation Steps

### **Phase 1: Enhanced Setup Machine for Dependency Resolution (2 hours)**

#### **Step 1: Update workoutLifecycleMachine Types**

**File**: `src/lib/machines/workout/types/workoutLifecycleTypes.ts`

```typescript
// Add to existing types
export interface ResolvedExercise {
  reference: string; // "33401:pubkey:exercise-d-tag"
  sets: number;
  reps: number;
  weight: number;
  // Resolved exercise details from Nostr
  name: string;
  description: string;
  equipment: string;
  muscleGroups: string[];
  instructions: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface ResolvedTemplate {
  id: string;
  title: string;
  description: string;
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  methodology?: string;
  equipment: string[];
  muscleGroups: string[];
  tags: string[];
  author: {
    pubkey: string;
    name?: string;
  };
  event: any; // Original NDK event
}

// Update WorkoutLifecycleContext
export interface WorkoutLifecycleContext {
  // ... existing fields
  
  // NEW: Resolved data for modal
  resolvedTemplate?: ResolvedTemplate;
  resolvedExercises?: ResolvedExercise[];
  
  // Enhanced setup input
  setupInput?: {
    preselectedTemplateId: string;
    templatePubkey: string;
    templateReference: string;
  };
}

// Update events
export type WorkoutLifecycleEvent = 
  // ... existing events
  | {
      type: 'START_SETUP';
      preselectedTemplateId: string;
      templatePubkey: string;
      templateReference: string;
    }
  | { type: 'BEGIN_WORKOUT' }
  | { type: 'CANCEL_SETUP' }
  | { type: 'RETRY_SETUP' };
```

#### **Step 2: Enhanced Setup Machine Actor**

**File**: `src/lib/machines/workout/actors/loadTemplateActor.ts`

```typescript
// Update existing loadTemplateActor to include exercise resolution
import { fromPromise } from 'xstate';
import { getNDKInstance } from '@/lib/ndk';
import { workoutAnalyticsService } from '@/lib/services/workoutAnalytics';
import type { ResolvedTemplate, ResolvedExercise } from '../types/workoutLifecycleTypes';

interface SetupMachineInput {
  preselectedTemplateId: string;
  templatePubkey: string;
  templateReference: string;
}

interface SetupMachineOutput {
  templateSelection: {
    templateId: string;
    templatePubkey: string;
    templateReference: string;
  };
  resolvedTemplate: ResolvedTemplate;
  resolvedExercises: ResolvedExercise[];
  workoutData: {
    workoutId: string;
    title: string;
    startTime: number;
    completedSets: any[];
    workoutType: 'strength';
  };
}

export const enhancedSetupMachine = fromPromise(async ({ 
  input 
}: { 
  input: SetupMachineInput 
}): Promise<SetupMachineOutput> => {
  console.log('[WorkoutLifecycle] Enhanced setup machine starting with input:', input);
  
  try {
    const ndk = getNDKInstance();
    if (!ndk) {
      throw new Error('NDK not available');
    }

    // 1. Load template data
    console.log('[Setup] Loading template:', input.preselectedTemplateId);
    const templateEvent = await ndk.fetchEvent({
      kinds: [33402],
      authors: [input.templatePubkey],
      '#d': [input.preselectedTemplateId]
    });

    if (!templateEvent) {
      throw new Error(`Template not found: ${input.preselectedTemplateId}`);
    }

    // 2. Parse template data
    const resolvedTemplate: ResolvedTemplate = {
      id: input.preselectedTemplateId,
      title: templateEvent.tags.find(t => t[0] === 'title')?.[1] || 'Untitled Workout',
      description: templateEvent.content || '',
      estimatedDuration: parseInt(templateEvent.tags.find(t => t[0] === 'duration')?.[1] || '1800'),
      difficulty: (templateEvent.tags.find(t => t[0] === 'difficulty')?.[1] as any) || 'intermediate',
      methodology: templateEvent.tags.find(t => t[0] === 'methodology')?.[1],
      equipment: templateEvent.tags.filter(t => t[0] === 'equipment').map(t => t[1]),
      muscleGroups: templateEvent.tags.filter(t => t[0] === 'muscle').map(t => t[1]),
      tags: templateEvent.tags.filter(t => t[0] === 'type').map(t => t[1]),
      author: {
        pubkey: templateEvent.pubkey,
        name: 'Workout Creator' // TODO: Resolve from profile
      },
      event: templateEvent
    };

    // 3. Resolve exercise dependencies
    console.log('[Setup] Resolving exercise dependencies...');
    const exerciseTags = templateEvent.tags.filter(tag => tag[0] === 'exercise');
    console.log('[Setup] Found exercise tags:', exerciseTags.length);

    const resolvedExercises: ResolvedExercise[] = await Promise.all(
      exerciseTags.map(async (exerciseTag, index) => {
        try {
          const [, exerciseRef, sets, reps, weight] = exerciseTag;
          console.log(`[Setup] Resolving exercise ${index + 1}:`, exerciseRef);
          
          // Parse exercise reference: "33401:pubkey:d-tag"
          const [kind, pubkey, dTag] = exerciseRef.split(':');
          
          if (kind !== '33401') {
            console.warn(`[Setup] Invalid exercise kind: ${kind}, expected 33401`);
            throw new Error(`Invalid exercise reference: ${exerciseRef}`);
          }

          // Fetch exercise details from Nostr
          const exerciseEvent = await ndk.fetchEvent({
            kinds: [33401],
            authors: [pubkey],
            '#d': [dTag]
          });

          if (!exerciseEvent) {
            console.warn(`[Setup] Exercise not found: ${exerciseRef}`);
            // Return placeholder data for missing exercises
            return {
              reference: exerciseRef,
              sets: parseInt(sets) || 3,
              reps: parseInt(reps) || 12,
              weight: parseInt(weight) || 0,
              name: dTag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              description: 'Exercise details not available',
              equipment: 'none',
              muscleGroups: ['unknown'],
              instructions: ['Exercise instructions not available'],
              difficulty: 'intermediate' as const
            };
          }

          // Parse exercise content for instructions
          let instructions: string[] = [];
          try {
            const content = JSON.parse(exerciseEvent.content || '{}');
            instructions = content.instructions || [];
          } catch {
            instructions = [exerciseEvent.content || 'No instructions available'];
          }

          return {
            reference: exerciseRef,
            sets: parseInt(sets) || 3,
            reps: parseInt(reps) || 12,
            weight: parseInt(weight) || 0,
            // Resolved exercise details
            name: exerciseEvent.tags.find(t => t[0] === 'name')?.[1] || dTag,
            description: exerciseEvent.content || '',
            equipment: exerciseEvent.tags.find(t => t[0] === 'equipment')?.[1] || 'none',
            muscleGroups: exerciseEvent.tags.filter(t => t[0] === 'muscle').map(t => t[1]),
            instructions,
            difficulty: (exerciseEvent.tags.find(t => t[0] === 'difficulty')?.[1] as any) || 'intermediate'
          };
        } catch (error) {
          console.error(`[Setup] Failed to resolve exercise ${index + 1}:`, error);
          // Return error placeholder
          return {
            reference: exerciseTag[1] || 'unknown',
            sets: parseInt(exerciseTag[2]) || 3,
            reps: parseInt(exerciseTag[3]) || 12,
            weight: parseInt(exerciseTag[4]) || 0,
            name: 'Exercise Unavailable',
            description: 'Failed to load exercise details',
            equipment: 'unknown',
            muscleGroups: ['unknown'],
            instructions: ['Exercise could not be loaded'],
            difficulty: 'intermediate' as const
          };
        }
      })
    );

    console.log('[Setup] Resolved exercises:', resolvedExercises.length);

    // 4. Generate workout data
    const workoutData = {
      workoutId: workoutAnalyticsService.generateWorkoutId(),
      title: resolvedTemplate.title,
      startTime: Date.now(),
      completedSets: [],
      workoutType: 'strength' as const
    };

    console.log('[Setup] Setup complete, returning data');

    return {
      templateSelection: {
        templateId: input.preselectedTemplateId,
        templatePubkey: input.templatePubkey,
        templateReference: input.templateReference
      },
      resolvedTemplate,
      resolvedExercises,
      workoutData
    };

  } catch (error) {
    console.error('[WorkoutLifecycle] Enhanced setup failed:', error);
    throw error;
  }
});
```

#### **Step 3: Update workoutLifecycleMachine**

**File**: `src/lib/machines/workout/workoutLifecycleMachine.ts`

```typescript
// Update the machine to use enhanced setup and handle modal states
import { setup, assign } from 'xstate';
import { enhancedSetupMachine } from './actors/loadTemplateActor';
// ... other imports

export const workoutLifecycleMachine = setup({
  types: {
    context: {} as WorkoutLifecycleContext,
    events: {} as WorkoutLifecycleEvent,
  },
  actors: {
    enhancedSetupMachine,
    // ... other actors
  },
  guards: {
    // ... existing guards
  },
}).createMachine({
  id: 'workoutLifecycle',
  initial: 'idle',
  context: ({ input }) => ({
    userInfo: input.userInfo,
    workoutData: null,
    error: null,
    // NEW: Modal-related context
    resolvedTemplate: undefined,
    resolvedExercises: undefined,
    setupInput: undefined,
  }),
  states: {
    idle: {
      on: {
        START_SETUP: {
          target: 'setup',
          actions: assign({
            setupInput: ({ event }) => ({
              preselectedTemplateId: event.preselectedTemplateId,
              templatePubkey: event.templatePubkey,
              templateReference: event.templateReference,
            }),
            error: null,
          }),
        },
      },
    },
    setup: {
      initial: 'loading',
      states: {
        loading: {
          invoke: {
            src: 'enhancedSetupMachine',
            input: ({ context }) => context.setupInput!,
            onDone: {
              target: 'ready',
              actions: assign({
                resolvedTemplate: ({ event }) => event.output.resolvedTemplate,
                resolvedExercises: ({ event }) => event.output.resolvedExercises,
                workoutData: ({ event }) => event.output.workoutData,
              }),
            },
            onError: {
              target: 'error',
              actions: assign({
                error: ({ event }) => event.error,
              }),
            },
          },
        },
        ready: {
          on: {
            BEGIN_WORKOUT: {
              target: '#workoutLifecycle.active',
            },
          },
        },
        error: {
          on: {
            RETRY_SETUP: {
              target: 'loading',
              actions: assign({
                error: null,
              }),
            },
          },
        },
      },
      on: {
        CANCEL_SETUP: {
          target: 'idle',
          actions: assign({
            setupInput: undefined,
            resolvedTemplate: undefined,
            resolvedExercises: undefined,
            error: null,
          }),
        },
      },
    },
    active: {
      // ... existing active workout states
    },
    // ... other states
  },
});
```

### **Phase 2: WorkoutDetailModal Component (2 hours)**

#### **Step 4: Create Modal Component**

**File**: `src/components/powr-ui/workout/WorkoutDetailModal.tsx`

```typescript
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Dumbbell, Users, Target, AlertCircle } from 'lucide-react';
import { WorkoutImageHandler } from './WorkoutImageHandler';
import type { ResolvedTemplate, ResolvedExercise } from '@/lib/machines/workout/types/workoutLifecycleTypes';

interface WorkoutDetailModalProps {
  isOpen: boolean;
  isLoading: boolean;
  templateData?: ResolvedTemplate;
  exercises?: ResolvedExercise[];
  error?: string;
  onClose: () => void;
  onStartWorkout: () => void;
  onRetry?: () => void;
}

export const WorkoutDetailModal = ({
  isOpen,
  isLoading,
  templateData,
  exercises = [],
  error,
  onClose,
  onStartWorkout,
  onRetry,
}: WorkoutDetailModalProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Loading state
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Loading workout details...</h3>
            <p className="text-muted-foreground">Resolving exercises and dependencies</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Error state
  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load workout</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {onRetry && (
                <Button onClick={onRetry}>
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // No data state
  if (!templateData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="p-6 text-center">
            <p className="text-muted-foreground">No workout data available</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const totalExercises = exercises.length;
  const estimatedDuration = Math.floor(templateData.estimatedDuration / 60);
  const uniqueEquipment = [...new Set(exercises.map(e => e.equipment).filter(e => e !== 'none'))];
  const uniqueMuscleGroups = [...new Set(exercises.flatMap(e => e.muscleGroups))];

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        {/* Hero Section */}
        <div className="relative">
          <WorkoutImageHandler
            event={templateData.event}
            alt={templateData.title}
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={difficultyColors[templateData.difficulty]}>
                {templateData.difficulty}
              </Badge>
              {templateData.tags.map(tag => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">{templateData.title}</h1>
            <div className="flex items-center gap-4 text-white/90 text-sm">
              <div className="flex items-center gap-1">
                <Dumbbell className="h-4 w-4" />
                <span>{totalExercises} exercises</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{estimatedDuration} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>{uniqueMuscleGroups.join(', ')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="exercises">Exercises</TabsTrigger>
              <TabsTrigger value="equipment">Equipment</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">
                  {templateData.description || 'No description available'}
                </p>
              </div>

              {templateData.methodology && (
                <div>
                  <h3 className="font-semibold mb-2">Methodology</h3>
                  <p className="text-muted-foreground">{templateData.methodology}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Muscle Groups</h3>
                <div className="flex flex-wrap gap-2">
                  {uniqueMuscleGroups.map(muscle => (
                    <Badge key={muscle} variant="outline">
                      {muscle}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Workout Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="text-2xl font-bold">{totalExercises}</div>
                    <div className="text-sm text-muted-foreground">Exercises</div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="text-2xl font-bold">{estimatedDuration}</div>
                    <div className="text-sm text-muted-foreground">Minutes</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="exercises" className="mt-6">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {exercises.map((exercise, index) => (
                  <div key={exercise.reference} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{exercise.name}</h4>
                      <Badge variant="outline">
                        {exercise.sets} × {exercise.reps}
                        {exercise.weight > 0 && ` @ ${exercise.weight}kg`}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {exercise.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Equipment: {exercise.equipment}</span>
                      <span>Difficulty: {exercise.difficulty}</span>
                    </div>
                    {exercise.instructions.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-sm font-medium cursor-pointer">
                          Instructions
                        </summary>
                        <ol className="mt-2 text-sm text-muted-foreground list-decimal list-inside space-y-1">
                          {exercise.instructions.map((instruction, i) => (
                            <li key={i}>{instruction}</li>
                          ))}
                        </ol>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="equipment" className="mt-6">
              <div>
                <h3 className="font-semibold mb-4">Required Equipment</h3>
                {uniqueEquipment.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {uniqueEquipment.map(equipment => (
                      <div key={equipment} className="flex items-center gap-2 p-2 border rounded">
                        <Dumbbell className="h-4 w-4" />
                        <span className="capitalize">{equipment}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No equipment required - bodyweight only!</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Created by {templateData.author.name || 'Anonymous'}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-8"
                onClick={onStartWorkout}
              >
                Start Workout
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

#### **Step 5: Add Missing UI Components**

**File**: `src/components/ui/tabs.tsx` (if not exists)

```typescript
"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
```

**Install required dependencies:**
```bash
npm install @radix-ui/react-tabs
```

### **Phase 3: WorkoutsTab Integration (1-2 hours)**

#### **Step 6: Update WorkoutsTab with XState Integration**

**File**: `src/components/tabs/WorkoutsTab.tsx`

```typescript
import { useMachine } from '@xstate/react';
import { workoutLifecycleMachine } from '@/lib/machines/workout/workoutLifecycleMachine';
import { WorkoutDetailModal } from '@/components/powr-ui/workout/WorkoutDetailModal';
import { useAuth } from '@/lib/auth/hooks';
// ... other existing imports

export default function WorkoutsTab() {
  const { currentUser } = useAuth();
  
  // XState machine for workout lifecycle
  const [state, send] = useMachine(workoutLifecycleMachine, {
    input: {
      userInfo: {
        pubkey: currentUser?.pubkey || '',
        displayName: currentUser?.displayName || 'Anonymous'
      }
    }
  });

  // ... existing NDK subscriptions and data processing

  const handleWorkoutSelect = (workoutId: string) => {
    console.log('[WorkoutsTab] Workout selected:', workoutId);
    
    const eventData = rawEventData.get(workoutId);
    if (!eventData) {
      console.error('[WorkoutsTab] No event data found for workout:', workoutId);
      return;
    }

    console.log('[WorkoutsTab] Starting setup with event data:', eventData);
    
    // Start XState machine immediately
    send({
      type: 'START_SETUP',
      preselectedTemplateId: workoutId,
      templatePubkey: eventData.pubkey,
      templateReference: eventData.naddr || `33402:${eventData.pubkey}:${workoutId}`
    });
  };

  const handleCloseModal = () => {
    console.log('[WorkoutsTab] Closing modal');
    send({ type: 'CANCEL_SETUP' });
  };

  const handleStartWorkout = () => {
    console.log('[WorkoutsTab] Starting workout');
    send({ type: 'WORKOUT_ACTIVE', workoutData: state.context.workoutData });
    // Navigate to ActiveTab - existing navigation logic
  };

  const handleRetrySetup = () => {
    console.log('[WorkoutsTab] Retrying setup');
    send({ type: 'RETRY_SETUP' });
  };

  // ... existing component JSX with modal integration

  return (
    <div>
      {/* Existing WorkoutsTab content */}
      
      {/* Add WorkoutDetailModal */}
      <WorkoutDetailModal
        isOpen={state.matches('setup') || state.matches('active')}
        isLoading={state.matches('setup')}
        templateData={state.context.resolvedTemplate}
        exercises={state.context.resolvedExercises}
        error={state.context.error?.message}
        onClose={handleCloseModal}
        onStartWorkout={handleStartWorkout}
        onRetry={handleRetrySetup}
      />
    </div>
  );
}
```

## ✅ Success Criteria (80% Minimum Threshold)

### **Modal Component Implementation:**
- [ ] Beautiful modal design with hero image, tabs, and orange gradient buttons
- [ ] Loading state with spinner while loadTemplateActor runs
- [ ] Error state with retry functionality
- [ ] Three tabs: Overview, Exercises, Equipment
- [ ] Responsive design optimized for mobile gym environments

### **XState Integration:**
- [ ] Modal opens when workoutLifecycleMachine enters 'setup' state
- [ ] Modal displays resolved template and exercise data from machine context
- [ ] "Start Workout" button triggers existing WORKOUT_ACTIVE event
- [ ] Modal closes properly with WORKOUT_CANCELLED event (automatic cleanup)
- [ ] Error handling with retry functionality

### **Performance & Reliability:**
- [ ] 272ms template loading benchmark maintained (using existing loadTemplateActor)
- [ ] Zero TypeScript errors
- [ ] All existing WorkflowValidationTest functionality preserved
- [ ] Proper XState machine cleanup on modal close
- [ ] Real NDK integration with Phase 1 content

### **UI/UX Quality:**
- [ ] Touch targets 44px+ for gym environments
- [ ] Orange gradient styling matching design specifications
- [ ] Smooth animations and transitions
- [ ] Proper loading and error states
- [ ] Mobile-optimized layout and typography

## 🔧 Technical Implementation Notes

### **Existing Architecture Reuse:**
- **workoutLifecycleMachine**: Already handles complete lifecycle (setup → active → completed → published)
- **loadTemplateActor**: Already achieves 272ms performance with exercise dependency resolution
- **workoutAnalyticsService**: Already generates NIP-101e compliant events
- **WorkflowValidationTest**: Proves end-to-end workflow works perfectly

### **XState Machine Cleanup (SOLVED):**
The existing workoutLifecycleMachine already handles cleanup perfectly:

```typescript
// User closes modal
const handleCloseModal = () => {
  send({ type: 'WORKOUT_CANCELLED' });
  // Machine automatically:
  // 1. Transitions to 'idle' state
  // 2. Runs 'cleanupActiveWorkout' action
  // 3. Resets all context data
  // 4. No memory leaks or hanging state
};
```

### **Integration Points:**
- **WorkoutsTab**: Add modal state management and connect to existing XState machine
- **Navigation**: Use existing navigation patterns to switch to ActiveTab
- **Data Flow**: Use existing NDK subscriptions and template data from WorkoutsTab
- **Error Handling**: Leverage existing error patterns from workoutLifecycleMachine

### **Dependencies:**
```bash
npm install @radix-ui/react-tabs
```

### **Files to Create/Modify:**
1. **NEW**: `src/components/powr-ui/workout/WorkoutDetailModal.tsx` - Main modal component
2. **NEW**: `src/components/ui/tabs.tsx` - Radix UI tabs component (if not exists)
3. **MODIFY**: `src/components/tabs/WorkoutsTab.tsx` - Add modal integration
4. **MODIFY**: `src/lib/machines/workout/types/workoutLifecycleTypes.ts` - Add modal types
5. **MODIFY**: `src/lib/machines/workout/workoutLifecycleMachine.ts` - Add modal events

## 🎯 Implementation Strategy

### **Phase 1: Modal Component (2-3 hours)**
Focus on building the beautiful modal UI component with all the visual design requirements. Use mock data initially to get the design perfect.

### **Phase 2: XState Integration (1-2 hours)**
Connect the modal to the existing workoutLifecycleMachine. This should be straightforward since the machine already has all the necessary states and data.

### **Phase 3: Testing & Polish (1 hour)**
Test with real Phase 1 content, ensure 272ms performance is maintained, and verify proper cleanup behavior.

## 🚀 Confidence Level: HIGH

**Why this will work:**
- ✅ **Proven Architecture**: WorkflowValidationTest shows everything works end-to-end
- ✅ **Existing Performance**: 272ms benchmark already achieved
- ✅ **Simple Integration**: Just connecting UI to working XState machine
- ✅ **Automatic Cleanup**: XState handles all state management
- ✅ **Real Data**: Phase 1 content already published and verified

**Risk Mitigation:**
- **Fallback Plan**: If modal complexity becomes an issue, start with simpler modal design
- **Performance Safety**: Using existing loadTemplateActor ensures 272ms benchmark
- **State Management**: XState patterns already proven in WorkflowValidationTest
- **Data Availability**: Phase 1 content provides real test data

---

**Next Steps**: Ready for implementation! The architecture is proven, the data is available, and the XState patterns are working. This is primarily a UI task with straightforward integration.
