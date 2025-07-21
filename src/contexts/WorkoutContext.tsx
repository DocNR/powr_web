'use client';

import { createActorContext } from '@xstate/react';
import { workoutLifecycleMachine } from '@/lib/machines/workout/workoutLifecycleMachine';
import type { ActorRefFrom, SnapshotFrom, EventFromLogic } from 'xstate';

/**
 * Enhanced TypeScript types for better developer experience
 * Provides type-safe access to workout state, send function, and actor reference
 */
export type WorkoutContextType = {
  workoutState: SnapshotFrom<typeof workoutLifecycleMachine>;
  workoutSend: (event: EventFromLogic<typeof workoutLifecycleMachine>) => void;
  workoutActorRef: ActorRefFrom<typeof workoutLifecycleMachine>;
};

/**
 * Global Workout Context using XState v5's official createActorContext pattern
 * 
 * This creates a React Context that:
 * - Creates an actor from workoutLifecycleMachine
 * - Makes the actor available through React Context
 * - Provides helper methods for accessing state and actor ref
 * - Follows official XState React integration patterns
 * 
 * Usage:
 * - Wrap app with <WorkoutContext.Provider>
 * - Access state with WorkoutContext.useSelector()
 * - Access actor ref with WorkoutContext.useActorRef()
 */
export const WorkoutContext = createActorContext(workoutLifecycleMachine);
