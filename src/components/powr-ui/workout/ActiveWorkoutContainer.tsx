'use client';

import React, { useMemo } from 'react';
import { useMachine } from '@xstate/react';
import { activeWorkoutMachine } from '@/lib/machines/workout/activeWorkoutMachine';
import { ActiveWorkoutInterface } from './ActiveWorkoutInterface';

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

interface TemplateExercise {
  exerciseRef: string;
  sets: number;
  reps: number;
  weight?: number;
  rpe?: number;
  setType?: string;
}

interface TemplateData {
  id: string;
  name: string;
  description?: string;
  exercises: TemplateExercise[];
}

interface CompletedSet {
  exerciseRef: string;
  setNumber: number;
  reps: number;
  weight: number;
  rpe?: number;
  setType: 'warmup' | 'normal' | 'drop' | 'failure';
  completedAt: number;
}

interface ActiveWorkoutContainerProps {
  templateData: TemplateData;
  userPubkey: string;
  onClose: () => void;
}

export const ActiveWorkoutContainer: React.FC<ActiveWorkoutContainerProps> = ({
  templateData,
  userPubkey,
  onClose
}) => {
  // Initialize XState machine with template data
  const [state, send] = useMachine(activeWorkoutMachine, {
    input: {
      userInfo: { pubkey: userPubkey },
      workoutData: { 
        workoutId: `workout_${Date.now()}`,
        title: templateData.name,
        startTime: Date.now(),
        workoutType: 'strength' as const,
        exercises: templateData.exercises.map(ex => ({
          exerciseRef: ex.exerciseRef,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight || 0,
          rpe: ex.rpe || 7,
          setType: ex.setType || 'normal'
        })),
        completedSets: []
      },
      templateSelection: { 
        templateId: templateData.id,
        templateReference: `33402:${userPubkey}:${templateData.id}` // NIP-01 format
      }
    }
  });

  // Extract workout state using direct context access for type safety
  const workoutTitle = state.context.workoutData.template?.name || templateData.name || 'Workout';
  const templateExercises = state.context.workoutData.template?.exercises || [];
  const completedSets = state.context.workoutData.completedSets || [];
  const currentExerciseIndex = state.context.exerciseProgression.currentExerciseIndex || 0;
  const currentSetIndex = (state.context.exerciseProgression.currentSetNumber - 1) || 0;

  const elapsedTime = useMemo(() => {
    const startTime = state.context.timingInfo.startTime;
    const pauseTime = state.context.timingInfo.pauseTime;
    const totalPauseTime = state.context.workoutSession.totalPauseTime || 0;
    
    if (pauseTime > 0) {
      // Currently paused - don't include current pause time
      return startTime ? (pauseTime - startTime - totalPauseTime) : 0;
    } else {
      // Currently active - include all time minus total pause time
      return startTime ? (Date.now() - startTime - totalPauseTime) : 0;
    }
  }, [state.context.timingInfo, state.context.workoutSession.totalPauseTime]);

  const isPaused = state.context.workoutSession.isPaused || false;
  const isCompleted = state.matches('completed') || state.matches('publishing') || state.matches('showingSummary');

  // Transform template exercises into UI format with completed sets
  const exercises: ExerciseData[] = useMemo(() => {
    return (templateExercises as TemplateExercise[]).map((templateExercise: TemplateExercise) => {
      // Find completed sets for this exercise
      const exerciseSets = (completedSets as CompletedSet[]).filter(
        (set: CompletedSet) => set.exerciseRef === templateExercise.exerciseRef
      );

      // Create sets array with completed and pending sets
      const totalSets = templateExercise.sets || 3;
      const sets: SetData[] = [];

      // Add completed sets
      exerciseSets.forEach((completedSet: CompletedSet) => {
        sets.push({
          weight: completedSet.weight,
          reps: completedSet.reps,
          rpe: completedSet.rpe,
          setType: completedSet.setType,
          completed: true
        });
      });

      // Add remaining pending sets
      const remainingSets = totalSets - exerciseSets.length;
      for (let i = 0; i < remainingSets; i++) {
        sets.push({
          weight: templateExercise.weight || 0,
          reps: templateExercise.reps || 10,
          rpe: 7,
          setType: 'normal',
          completed: false
        });
      }

      return {
        id: templateExercise.exerciseRef,
        name: templateExercise.exerciseRef.split(':')[2] || 'Exercise', // Extract name from ref
        equipment: undefined, // Not available in current template structure
        notes: undefined, // Not available in current template structure
        sets,
        prescribedSets: totalSets,
        prescribedReps: templateExercise.reps,
        prescribedWeight: templateExercise.weight
      };
    });
  }, [templateExercises, completedSets]);

  // Event handlers
  const handleSetComplete = (exerciseId: string, setIndex: number, setData: SetData) => {
    console.log('[ActiveWorkoutContainer] Set completed:', { exerciseId, setIndex, setData });
    
    // Send COMPLETE_SET event with optional set data override
    send({ 
      type: 'COMPLETE_SET',
      setData: {
        weight: setData.weight,
        reps: setData.reps,
        rpe: setData.rpe,
        setType: setData.setType
      }
    });
  };

  const handleSetEdit = (exerciseId: string, setIndex: number, setData: SetData) => {
    console.log('[ActiveWorkoutContainer] Set edit requested:', { exerciseId, setIndex, setData });
    // For now, we don't support editing completed sets
    // This could be implemented with an EDIT_SET event in the future
  };

  const handleAddSet = (exerciseId: string) => {
    console.log('[ActiveWorkoutContainer] Add set requested for:', exerciseId);
    // This could be implemented with an ADD_SET event in the future
  };

  const handlePause = () => {
    console.log('[ActiveWorkoutContainer] Pausing workout');
    send({ type: 'PAUSE_WORKOUT' });
  };

  const handleResume = () => {
    console.log('[ActiveWorkoutContainer] Resuming workout');
    send({ type: 'RESUME_WORKOUT' });
  };

  const handleCancel = () => {
    console.log('[ActiveWorkoutContainer] Cancelling workout');
    send({ type: 'CANCEL_WORKOUT' });
    onClose();
  };

  const handleFinish = () => {
    console.log('[ActiveWorkoutContainer] Finishing workout');
    send({ type: 'COMPLETE_WORKOUT' });
  };

  // Handle machine state changes
  React.useEffect(() => {
    if (state.matches('cancelled')) {
      console.log('[ActiveWorkoutContainer] Workout was cancelled');
      onClose();
    } else if (state.matches('final')) {
      console.log('[ActiveWorkoutContainer] Workout completed and published');
      // Could show a success message before closing
      setTimeout(() => onClose(), 2000);
    }
  }, [state, onClose]);

  // Show loading state while template is loading
  if (state.matches('loadingTemplate')) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workout template...</p>
        </div>
      </div>
    );
  }

  // Show error state if template loading failed
  if (state.matches('error')) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to Load Workout
          </h2>
          <p className="text-gray-600 mb-4">
            {state.context.error?.message || 'An error occurred while loading the workout template.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => send({ type: 'RETRY_OPERATION' })}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show publishing state
  if (state.matches('publishing')) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Publishing workout to Nostr...</p>
        </div>
      </div>
    );
  }

  // Show summary state
  if (state.matches('showingSummary')) {
    const publishedEventId = state.context.publishingStatus.eventId;
    
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Workout Complete!
          </h2>
          <p className="text-gray-600 mb-4">
            Your workout has been published to Nostr successfully.
          </p>
          {publishedEventId && (
            <p className="text-sm text-gray-500 mb-4">
              Event ID: {publishedEventId.slice(0, 16)}...
            </p>
          )}
          <button
            onClick={() => send({ type: 'DISMISS_SUMMARY' })}
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // Main workout interface
  const workoutState = {
    title: workoutTitle,
    exercises,
    currentExerciseIndex,
    currentSetIndex,
    elapsedTime,
    isPaused,
    isCompleted
  };

  return (
    <ActiveWorkoutInterface
      workoutState={workoutState}
      onSetComplete={handleSetComplete}
      onSetEdit={handleSetEdit}
      onAddSet={handleAddSet}
      onPause={handlePause}
      onResume={handleResume}
      onCancel={handleCancel}
      onFinish={handleFinish}
      onClose={onClose}
    />
  );
};
