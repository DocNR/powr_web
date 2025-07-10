'use client';

import React, { useState } from 'react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { ExerciseSection } from './ExerciseSection';
import { WorkoutMiniBar } from './WorkoutMiniBar';
import { ArrowLeft, Pause, Play, Square, MoreVertical } from 'lucide-react';
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

interface WorkoutState {
  title: string;
  exercises: ExerciseData[];
  currentExerciseIndex: number;
  currentSetIndex: number;
  elapsedTime: number;
  isPaused: boolean;
  isCompleted: boolean;
}

interface ActiveWorkoutInterfaceProps {
  workoutState: WorkoutState;
  onSetComplete: (exerciseId: string, setIndex: number, setData: SetData) => void;
  onSetEdit?: (exerciseId: string, setIndex: number, setData: SetData) => void;
  onAddSet?: (exerciseId: string) => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onFinish: () => void;
  onClose: () => void;
  className?: string;
}

export const ActiveWorkoutInterface: React.FC<ActiveWorkoutInterfaceProps> = ({
  workoutState,
  onSetComplete,
  onSetEdit,
  onAddSet,
  onPause,
  onResume,
  onCancel,
  onFinish,
  onClose,
  className
}) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleTogglePause = () => {
    if (workoutState.isPaused) {
      onResume();
    } else {
      onPause();
    }
  };

  const handleCancelConfirm = () => {
    setShowCancelDialog(false);
    onCancel();
  };

  const handleFinishConfirm = () => {
    setShowFinishDialog(false);
    onFinish();
  };

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Calculate workout progress
  const totalSets = workoutState.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  const completedSets = workoutState.exercises.reduce(
    (total, exercise) => total + exercise.sets.filter(set => set.completed).length, 
    0
  );

  // If minimized, show only the mini bar
  if (isMinimized) {
    return (
      <WorkoutMiniBar
        workoutTitle={workoutState.title}
        elapsedTime={workoutState.elapsedTime}
        isPaused={workoutState.isPaused}
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
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Workout Title and Progress */}
          <div className="flex-1 text-center mx-4">
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {workoutState.title}
            </h1>
            <p className="text-sm text-gray-600">
              {completedSets}/{totalSets} sets completed
            </p>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-2">
            {/* Pause/Resume Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleTogglePause}
              className={cn(
                "text-gray-600 hover:text-gray-800",
                workoutState.isPaused && "text-orange-500 hover:text-orange-600"
              )}
            >
              {workoutState.isPaused ? (
                <Play className="h-5 w-5" />
              ) : (
                <Pause className="h-5 w-5" />
              )}
            </Button>

            {/* More Options */}
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:text-gray-800"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Exercise List - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
          {workoutState.exercises.map((exercise, exerciseIndex) => {
            const isActiveExercise = exerciseIndex === workoutState.currentExerciseIndex;
            const currentSetIndex = isActiveExercise ? workoutState.currentSetIndex : -1;

            return (
              <ExerciseSection
                key={exercise.id}
                exercise={exercise}
                isActive={isActiveExercise}
                currentSetIndex={currentSetIndex}
                onSetComplete={onSetComplete}
                onSetEdit={onSetEdit}
                onAddSet={onAddSet}
              />
            );
          })}
        </div>

        {/* Bottom Action Bar */}
        <div className="p-4 border-t border-gray-200 bg-white">
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
              onClick={() => setShowFinishDialog(true)}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            >
              Finish Workout
            </Button>
          </div>
        </div>
      </div>

      {/* Mini Bar (when minimized) */}
      <WorkoutMiniBar
        workoutTitle={workoutState.title}
        elapsedTime={workoutState.elapsedTime}
        isPaused={workoutState.isPaused}
        onTogglePause={handleTogglePause}
        onExpand={handleToggleMinimize}
      />

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
              onClick={handleFinishConfirm}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Finish Workout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
