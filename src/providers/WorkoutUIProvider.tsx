'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWorkoutContext } from '@/hooks/useWorkoutContext';
import { WorkoutMiniBar } from '@/components/powr-ui/workout/WorkoutMiniBar';
import { ActiveWorkoutInterface } from '@/components/powr-ui/workout/ActiveWorkoutInterface';
import { useNavigation } from '@/providers/NavigationProvider';

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
  const { activeTab, setActiveTab } = useNavigation();
  const [isClient, setIsClient] = useState(false);
  
  // Real-time timer using React state that updates every second
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Ensure we're on the client side for portal rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Determine workout UI state
  const isWorkoutActive = workoutState?.matches('active') || false;
  const isWorkoutExpanded = workoutState?.matches({ active: 'expanded' }) || false;
  const isMinimized = workoutState?.matches({ active: 'minimized' }) || false;

  // Update timer every second when workout is active
  useEffect(() => {
    if (!isWorkoutActive) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [isWorkoutActive]);

  // Function to expand workout back to full interface
  const expandWorkout = () => {
    if (workoutSend && isMinimized) {
      console.log('[WorkoutUIProvider] Expanding workout interface');
      // Navigate to workouts tab first, then expand after navigation completes
      setActiveTab('workouts');
      // Small delay to ensure navigation completes before expanding
      setTimeout(() => {
        workoutSend({ type: 'EXPAND_INTERFACE' });
      }, 50);
    }
  };

  // Context value
  const contextValue: WorkoutUIContextType = {
    isMinimized,
    expandWorkout
  };

  // Calculate workout data for mini bar
  const getMiniBarData = () => {
    const workoutData = workoutState.context?.workoutData;
    const activeWorkoutActor = workoutState.context?.activeWorkoutActor;

    if (!workoutData) {
      return null;
    }

    // Calculate elapsed time and pause state
    let elapsedTime = 0;
    let isPaused = false;
    
    if (activeWorkoutActor && typeof activeWorkoutActor === 'object' && 'getSnapshot' in activeWorkoutActor) {
      try {
        const activeWorkoutSnapshot = (activeWorkoutActor as { getSnapshot: () => { 
          context: { 
            timingInfo?: { startTime?: number; pauseTime?: number }; 
            workoutSession?: { isPaused?: boolean; totalPauseTime?: number }
          }; 
          matches: (state: string) => boolean 
        } }).getSnapshot();
        
        const timingInfo = activeWorkoutSnapshot.context?.timingInfo;
        const sessionInfo = activeWorkoutSnapshot.context?.workoutSession;
        
        if (timingInfo?.startTime) {
          const baseElapsed = currentTime - timingInfo.startTime;
          const pauseTime = sessionInfo?.totalPauseTime || 0;
          elapsedTime = Math.max(0, baseElapsed - pauseTime);
        }
        
        isPaused = sessionInfo?.isPaused || activeWorkoutSnapshot.matches('paused') || false;
        
      } catch (error) {
        console.warn('Error reading active workout timing info:', error);
        // Fallback: calculate from workout data
        if (workoutData.startTime) {
          elapsedTime = currentTime - workoutData.startTime;
        }
      }
    } else {
      // Fallback: calculate from workout data
      if (workoutData.startTime) {
        elapsedTime = currentTime - workoutData.startTime;
      }
    }

    const handleTogglePause = () => {
      if (activeWorkoutActor && typeof activeWorkoutActor === 'object' && 'send' in activeWorkoutActor) {
        try {
          (activeWorkoutActor as { send: (event: unknown) => void }).send({ 
            type: isPaused ? 'RESUME_WORKOUT' : 'PAUSE_WORKOUT' 
          });
        } catch (error) {
          console.error('Error toggling workout pause:', error);
        }
      }
    };

    return {
      workoutTitle: workoutData.title || 'Active Workout',
      elapsedTime,
      isPaused,
      onTogglePause: handleTogglePause,
      onExpand: expandWorkout
    };
  };

  return (
    <>
      <WorkoutUIContext.Provider value={contextValue}>
        {children}
      </WorkoutUIContext.Provider>
      
      {/* Render WorkoutMiniBar when workout is minimized (regardless of tab) */}
      {isClient && isMinimized && isWorkoutActive && !isWorkoutExpanded && (() => {
        console.log('[WorkoutUIProvider] Rendering mini bar - isMinimized:', isMinimized, 'isExpanded:', isWorkoutExpanded);
        const miniBarData = getMiniBarData();
        return miniBarData ? createPortal(
          <WorkoutMiniBar {...miniBarData} />,
          document.body
        ) : null;
      })()}

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