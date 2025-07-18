'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from '@xstate/react';
import { Button, WorkoutTimer } from '@/components/powr-ui';
import { ExerciseSection } from './ExerciseSection';
import { WorkoutMiniBar } from './WorkoutMiniBar';
import { ArrowLeft, Square } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface SetData {
  weight: number;
  reps: number;
  rpe?: number;
  setType?: 'warmup' | 'normal' | 'drop' | 'failure';
  completed?: boolean;
}

interface ExerciseData {
  id: string;
  name: string;
  equipment?: string;
  notes?: string;
  sets: SetData[];
  prescribedSets?: number;
  prescribedReps?: number;
  prescribedWeight?: number;
}

interface WorkoutData {
  workoutId: string;
  title: string;
  startTime: number;
  completedSets: CompletedSet[];
  workoutType: string;
  exercises: WorkoutExercise[];
}

interface CompletedSet {
  exerciseRef: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  setType: 'warmup' | 'normal' | 'drop' | 'failure';
  completedAt: number;
}

interface WorkoutExercise {
  exerciseRef: string;
  name?: string;
  sets: number;
  reps: number;
  weight?: number;
  rpe?: number;
  setType?: string;
  equipment?: string;
  notes?: string;
}

interface ActiveWorkoutInterfaceProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeWorkoutActor: any; // XState actor reference
  onClose: () => void;
  onWorkoutComplete?: (workoutData: WorkoutData) => void;
  onWorkoutCancel?: () => void;
  className?: string;
}

export const ActiveWorkoutInterface: React.FC<ActiveWorkoutInterfaceProps> = ({
  activeWorkoutActor,
  onClose,
  onWorkoutComplete,
  onWorkoutCancel,
  className
}) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // ✅ OPTIMIZED: Use fewer, more specific selectors to reduce re-renders
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workoutData = useSelector(activeWorkoutActor, (state: any) => state.context?.workoutData);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exerciseProgression = useSelector(activeWorkoutActor, (state: any) => state.context?.exerciseProgression);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workoutSession = useSelector(activeWorkoutActor, (state: any) => state.context?.workoutSession);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timingInfo = useSelector(activeWorkoutActor, (state: any) => state.context?.timingInfo);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actorState = useSelector(activeWorkoutActor, (state: any) => state);
  
  // ✅ ADDED: Select extraSetsRequested from actor context (THE FIX!)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extraSetsRequested = useSelector(activeWorkoutActor, (state: any) => 
    state.context?.workoutData?.extraSetsRequested || {}
  );

  // ✅ MINIMAL LOGGING: Only log on initial mount
  useEffect(() => {
    if (workoutData?.title) {
      console.log('🔧 ActiveWorkoutInterface: Workout loaded:', workoutData.title);
    }
  }, [workoutData?.workoutId]); // Only log when workout changes, not on every render

  // ✅ Send function - direct from actorRef (from XState React docs)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actorSend = (event: any) => {
    // Only log important events to reduce console spam
    if (event.type === 'COMPLETE_SET' || event.type === 'COMPLETE_WORKOUT' || event.type === 'CANCEL_WORKOUT') {
      console.log('🔧 ActiveWorkoutInterface: Sending event:', event.type);
    }
    activeWorkoutActor.send(event);
  };

  // Calculate derived state from actor context
  const title = workoutData?.title || 'Active Workout';
  const isPaused = workoutSession?.isPaused || false;
  const currentExerciseIndex = exerciseProgression?.currentExerciseIndex || 0;
  const currentSetIndex = (exerciseProgression?.currentSetNumber || 1) - 1;

  // Calculate elapsed time from actor timing info
  const [elapsedTime, setElapsedTime] = useState(0);
  
  useEffect(() => {
    if (!timingInfo?.startTime || isPaused) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const pauseTime = timingInfo.pauseTime || 0;
      const totalPauseTime = workoutSession?.totalPauseTime || 0;
      
      if (pauseTime > 0) {
        // Currently paused - don't include current pause time
        setElapsedTime(Math.floor((timingInfo.startTime + totalPauseTime) / 1000));
      } else {
        // Active - include all time except previous pauses
        setElapsedTime(Math.floor((now - timingInfo.startTime - totalPauseTime) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timingInfo, isPaused, workoutSession?.totalPauseTime]);

  // ✅ FIXED: Create exercises from workout data with extraSetsRequested support
  const exercises: ExerciseData[] = workoutData?.exercises?.map((exercise: WorkoutExercise, index: number) => {
    const completedSetsForExercise = workoutData.completedSets?.filter(
      (set: CompletedSet) => set.exerciseRef === exercise.exerciseRef
    ) || [];

    // ✅ FIXED: Handle user-requested extra sets properly (ported from ActiveWorkoutContainer)
    const templateSets = exercise.sets || 3;
    
    // Check if user has requested extra sets via ADD_SET events
    const extraSets = extraSetsRequested[exercise.exerciseRef] || 0;
    
    // Total sets = template sets + any extra sets the user has requested
    const totalSets = templateSets + extraSets;

    // Removed repetitive exercise logging to reduce console spam

    return {
      id: exercise.exerciseRef || `exercise-${index}`,
      name: exercise.name || `Exercise ${index + 1}`,
      equipment: exercise.equipment,
      notes: exercise.notes,
      sets: Array.from({ length: totalSets }, (_, setIndex) => {  // ✅ Use totalSets instead of exercise.sets
        const completedSet = completedSetsForExercise.find(
          (set: CompletedSet) => set.setNumber === setIndex + 1
        );
        
        return {
          weight: completedSet?.weight || exercise.weight || 0,
          reps: completedSet?.reps || exercise.reps || 0,
          rpe: completedSet?.rpe || exercise.rpe || 7,
          setType: completedSet?.setType || (exercise.setType as 'warmup' | 'normal' | 'drop' | 'failure') || 'normal',
          completed: !!completedSet
        };
      }),
      prescribedSets: templateSets, // ✅ Keep original template count for display
      prescribedReps: exercise.reps || 10,
      prescribedWeight: exercise.weight || 0
    };
  }) || [];

  // Event handlers that send events to the actor
  const handleSetComplete = (exerciseId: string, setIndex: number, setData: SetData) => {
    // Send COMPLETE_SET event to activeWorkoutActor
    actorSend({ 
      type: 'COMPLETE_SET',
      setData: {
        weight: setData.weight,
        reps: setData.reps,
        rpe: setData.rpe,
        setType: setData.setType
      }
    });
  };

  // ✅ FIXED: Add set functionality
  const handleAddSet = (exerciseId: string) => {
    // Send ADD_SET event to activeWorkoutActor
    actorSend({ 
      type: 'ADD_SET',
      exerciseRef: exerciseId
    });
  };

  // NEW: Exercise selection handler for superset support
  const handleExerciseSelect = (exerciseIndex: number) => {
    // Send NAVIGATE_TO_EXERCISE event to activeWorkoutActor
    actorSend({ 
      type: 'NAVIGATE_TO_EXERCISE',
      exerciseIndex
    });
  };

  const handleTogglePause = () => {
    if (isPaused) {
      actorSend({ type: 'RESUME_WORKOUT' });
    } else {
      actorSend({ type: 'PAUSE_WORKOUT' });
    }
  };

  const handleCancelConfirm = () => {
    setShowCancelDialog(false);
    actorSend({ type: 'CANCEL_WORKOUT' });
    onWorkoutCancel?.();
    onClose();
  };

  const handleFinishConfirm = () => {
    setShowFinishDialog(false);
    actorSend({ type: 'COMPLETE_WORKOUT' });
    
    // Call completion callback with workout data
    if (onWorkoutComplete && workoutData) {
      onWorkoutComplete(workoutData);
    }
  };

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Handle actor state changes
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((actorState as any)?.matches?.('completed') || (actorState as any)?.matches?.('final')) {
      console.log('🔧 ActiveWorkoutInterface: Workout completed, calling completion handler');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (onWorkoutComplete && (actorState as any).output?.workoutData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onWorkoutComplete((actorState as any).output.workoutData);
      }
    }
  }, [actorState, onWorkoutComplete]);

  // Calculate workout progress from exercises
  const totalSets = exercises.reduce((total: number, exercise: ExerciseData) => total + exercise.sets.length, 0);
  const completedSets = exercises.reduce(
    (total: number, exercise: ExerciseData) => total + exercise.sets.filter((set: SetData) => set.completed).length, 
    0
  );


  // If minimized, show only the mini bar
  if (isMinimized) {
    return (
      <WorkoutMiniBar
        workoutTitle={title}
        elapsedTime={elapsedTime}
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        onExpand={handleToggleMinimize}
        className={className}
      />
    );
  }

  return (
    <>
      {/* Full Screen Workout Interface */}
      <div className={cn(
        "fixed inset-0 bg-white z-50 flex flex-col",
        "safe-area-inset-top safe-area-inset-bottom",
        className
      )}>
        {/* Clean 3-Element Header */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-[var(--workout-border)]">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-[var(--workout-text-muted)] hover:text-[var(--workout-text)]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Central Timer */}
          <div className="flex flex-col items-center">
            <WorkoutTimer 
              elapsedTime={elapsedTime}
              className="text-2xl font-bold"
            />
            <div className="text-sm text-[var(--workout-text-muted)] mt-1">
              {completedSets}/{totalSets} sets
            </div>
          </div>

          {/* Finish Button */}
          <Button
            variant="workout-success"
            onClick={() => setShowFinishDialog(true)}
            className="px-6"
          >
            Finish
          </Button>
        </div>

        {/* Exercise List - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
          {exercises.map((exercise: ExerciseData, exerciseIndex: number) => {
            const isActiveExercise = exerciseIndex === currentExerciseIndex;

            return (
              <ExerciseSection
                key={exercise.id}
                exercise={exercise}
                isActive={isActiveExercise}
                currentSetIndex={isActiveExercise ? currentSetIndex : -1}
                onSetComplete={(exerciseId: string, setIndex: number, setData: SetData) => 
                  handleSetComplete(exerciseId, setIndex, setData)
                }
                onAddSet={(exerciseId: string) => handleAddSet(exerciseId)}
                onExerciseSelect={() => handleExerciseSelect(exerciseIndex)}
              />
            );
          })}
        </div>

        {/* Bottom Action Bar */}
        <div className="p-4 border-t border-[var(--workout-border)] bg-white">
          <div className="flex items-center justify-between gap-4">
            {/* Cancel Button */}
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(true)}
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Square className="h-4 w-4 mr-2" />
              Cancel
            </Button>

            {/* Minimize Button */}
            <Button
              variant="outline"
              onClick={handleToggleMinimize}
              className="px-6"
            >
              Minimize
            </Button>

            {/* Finish Button */}
            <Button
              variant="workout-success"
              onClick={() => setShowFinishDialog(true)}
              className="flex-1"
            >
              Finish Workout
            </Button>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Workout?</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to cancel this workout? All progress will be lost.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Keep Going
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
            >
              Cancel Workout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finish Confirmation Dialog */}
      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finish Workout?</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to finish this workout? This will save your progress and publish to Nostr.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFinishDialog(false)}
            >
              Keep Going
            </Button>
            <Button
              variant="workout-success"
              onClick={handleFinishConfirm}
            >
              Finish Workout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
