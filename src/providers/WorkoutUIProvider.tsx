'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWorkoutContext } from '@/hooks/useWorkoutContext';
import { WorkoutMiniBar } from '@/components/powr-ui/workout/WorkoutMiniBar';
import { ActiveWorkoutInterface } from '@/components/powr-ui/workout/ActiveWorkoutInterface';

interface WorkoutUIContextType {
  isMinimized: boolean;
  expandWorkout: () => void;
}

const WorkoutUIContext = createContext<WorkoutUIContextType | null>(null);

export const useWorkoutUI = () => {
  const context = useContext(WorkoutUIContext);
  if (!context) {
    throw new Error('useWorkoutUI must be used within WorkoutUIProvider');
  }
  return context;
};

interface WorkoutUIProviderProps {
  children: React.ReactNode;
}

export const WorkoutUIProvider: React.FC<WorkoutUIProviderProps> = ({ children }) => {
  const { workoutState, workoutSend } = useWorkoutContext();
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side for portal rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Determine workout UI state
  const isWorkoutActive = workoutState?.matches('active') || false;
  const isWorkoutExpanded = workoutState?.matches({ active: 'expanded' }) || false;
  const isMinimized = workoutState?.matches({ active: 'minimized' }) || false;

  // Debug logging for state detection
  useEffect(() => {
    console.log('[WorkoutUIProvider] State detection debug:', {
      workoutStateValue: workoutState?.value,
      isWorkoutActive,
      isWorkoutExpanded,
      isMinimized,
      hasActiveActor: !!workoutState?.context?.activeWorkoutActor,
      isClient
    });
  }, [workoutState?.value, isWorkoutActive, isWorkoutExpanded, isMinimized, workoutState?.context?.activeWorkoutActor, isClient]);

  // Function to expand workout back to full interface
  const expandWorkout = () => {
    if (workoutSend && isMinimized) {
      console.log('[WorkoutUIProvider] Expanding workout interface');
      workoutSend({ type: 'EXPAND_INTERFACE' });
    }
  };

  // Context value
  const contextValue: WorkoutUIContextType = {
    isMinimized,
    expandWorkout
  };

  return (
    <>
      <WorkoutUIContext.Provider value={contextValue}>
        {children}
      </WorkoutUIContext.Provider>
      
      {/* Render WorkoutMiniBar as portal when workout is minimized */}
      {isClient && isMinimized && isWorkoutActive && 
        createPortal(
          <WorkoutMiniBar
            workoutTitle="Active Workout"
            elapsedTime={0}
            isPaused={false}
            onTogglePause={() => {
              console.log('[WorkoutUIProvider] Toggle pause from mini bar');
              // TODO: Implement pause/resume functionality
            }}
            onExpand={expandWorkout}
          />,
          document.body
        )
      }

      {/* Render ActiveWorkoutInterface as portal when workout is expanded */}
      {isClient && isWorkoutExpanded && isWorkoutActive && workoutState?.context?.activeWorkoutActor && 
        createPortal(
          <div className="fixed inset-0 z-50 bg-background">
            <ActiveWorkoutInterface
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              activeWorkoutActor={workoutState.context.activeWorkoutActor as any}
              onMinimize={() => {
                console.log('[WorkoutUIProvider] Minimizing workout interface');
                workoutSend({ type: 'MINIMIZE_INTERFACE' });
              }}
              onWorkoutComplete={(workoutData) => {
                console.log('[WorkoutUIProvider] Workout completed with data:', workoutData);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                workoutSend({ type: 'WORKOUT_COMPLETED', workoutData: workoutData as any });
              }}
              onWorkoutCancel={() => {
                console.log('[WorkoutUIProvider] Canceling workout');
                workoutSend({ type: 'WORKOUT_CANCELLED' });
              }}
            />
          </div>,
          document.body
        )
      }
    </>
  );
};
