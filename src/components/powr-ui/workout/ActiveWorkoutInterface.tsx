'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from '@xstate/react';
import { Button, WorkoutTimer } from '@/components/powr-ui';
import { ExerciseSection } from './ExerciseSection';
import { ExercisePicker } from './ExercisePicker';
import { SupersetCreationModal } from './SupersetCreationModal';
import { SupersetGroup } from './SupersetGroup';
import { ExerciseReorderModal } from './ExerciseReorderModal';
import { WorkoutImageHandler } from './WorkoutImageHandler';
import { ExerciseDetailModal } from '@/components/library/ExerciseDetailModal';
import { SaveTemplateModal } from './SaveTemplateModal';
import { WorkoutMenuDropdown } from './WorkoutMenuDropdown';
import { WorkoutDetailModal } from './WorkoutDetailModal';
import { WorkoutDescription } from './WorkoutDescription';
import { useWeightUnits } from '@/providers/WeightUnitsProvider';
import { ArrowLeft, Square, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/powr-ui/primitives/ConfirmationDialog';
import { cn } from '@/lib/utils';
import type { 
  CompletedSet, 
  WorkoutData, 
  WorkoutExercise 
} from '@/lib/machines/workout/types/workoutTypes';

// Local UI-specific interfaces (not duplicating core types)
interface SetData {
  weight: number;
  reps: number;
  rpe?: number;
  setType?: 'warmup' | 'normal' | 'drop' | 'failure';
  completed?: boolean;
}

interface ExerciseData {
  id: string;
  exerciseRef: string;
  name: string;
  equipment?: string;
  notes?: string;
  sets: SetData[];
  prescribedSets?: number;
  prescribedReps?: number;
  prescribedWeight?: number;
}

interface ActiveWorkoutInterfaceProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeWorkoutActor: any; // XState actor reference
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workoutLifecycleActor?: any; // NEW: Lifecycle actor for template save prompt
  isOpen?: boolean; // NEW: Control modal open state
  onMinimize: () => void; // Changed from onClose to onMinimize
  onWorkoutComplete?: (workoutData: WorkoutData) => void;
  onWorkoutCancel?: () => void;
  className?: string;
  // NEW: Template data for backdrop
  templateData?: {
    tags?: string[][];
    content?: string;
    description?: string;
    eventKind?: number;
    title?: string;
  };
}

export const ActiveWorkoutInterface: React.FC<ActiveWorkoutInterfaceProps> = ({
  activeWorkoutActor,
  workoutLifecycleActor, // NEW: Lifecycle actor for template save prompt
  isOpen = true, // NEW: Default to open
  onMinimize,
  onWorkoutComplete,
  onWorkoutCancel,
  className,
  templateData
}) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showAddExercisePicker, setShowAddExercisePicker] = useState(false);
  const [showExerciseDetail, setShowExerciseDetail] = useState(false);
  const [selectedExerciseRef, setSelectedExerciseRef] = useState<string | null>(null);
  const [showSupersetPicker, setShowSupersetPicker] = useState(false);
  const [supersetTriggerExerciseIndex, setSupersetTriggerExerciseIndex] = useState<number | null>(null);
  const [showExerciseReorder, setShowExerciseReorder] = useState(false);
  
  // NEW: Substitution picker state
  const [showSubstitutePicker, setShowSubstitutePicker] = useState(false);
  const [substituteExerciseIndex, setSubstituteExerciseIndex] = useState<number | null>(null);
  
  // NEW: Template info modal state
  const [showTemplateInfo, setShowTemplateInfo] = useState(false);
  
  // NEW: Confirmation dialog state for smart workout confirmations
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    type: 'remove' | 'substitute';
    exerciseIndex: number;
    exerciseName: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  
  // NEW: Local superset state (will be moved to XState in Phase 4)
  const [supersetGroups, setSupersetGroups] = useState<Array<{
    id: string;
    exerciseIndices: number[];
    exerciseNames: string[];
  }>>([]);
  
  // ✅ OPTIMIZED: Use fewer, more specific selectors to reduce re-renders
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workoutData = useSelector(activeWorkoutActor, (state: any) => state.context?.workoutData);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exerciseProgression = useSelector(activeWorkoutActor, (state: any) => state.context?.exerciseProgression);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timingInfo = useSelector(activeWorkoutActor, (state: any) => state.context?.timingInfo);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actorState = useSelector(activeWorkoutActor, (state: any) => state);
  
  // ✅ WEIGHT UNIT FIX: Get weight unit for component keys
  const { weightUnit } = useWeightUnits();
  
  
  // ✅ ADDED: Select extraSetsRequested from actor context (THE FIX!)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extraSetsRequested = useSelector(activeWorkoutActor, (state: any) => 
    state.context?.workoutData?.extraSetsRequested || {}
  );

  // ✅ FIXED: Always call useSelector, but handle null actor safely
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lifecycleState = useSelector(workoutLifecycleActor || { getSnapshot: () => null, subscribe: () => ({ unsubscribe: () => {} }) }, (state: any) => workoutLifecycleActor ? state : null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const templateAnalysis = useSelector(workoutLifecycleActor || { getSnapshot: () => null, subscribe: () => ({ unsubscribe: () => {} }) }, (state: any) => workoutLifecycleActor ? state.context?.templateAnalysis : null);
  
  // Check if we should show the template save modal
  const showTemplateSaveModal = lifecycleState?.matches?.('templateSavePrompt') && templateAnalysis?.hasModifications;

  // ✅ MINIMAL LOGGING: Only log on initial mount
  useEffect(() => {
    if (workoutData?.title) {
      console.log('🔧 ActiveWorkoutInterface: Workout loaded:', workoutData.title);
    }
  }, [workoutData?.workoutId, workoutData?.title]); // Include workoutData.title in dependencies

  // ✅ Send function - direct from actorRef (from XState React docs)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actorSend = (event: any) => {
    // Only log important events to reduce console spam
    if (event.type === 'COMPLETE_SET' || event.type === 'COMPLETE_SPECIFIC_SET' || event.type === 'COMPLETE_WORKOUT' || event.type === 'CANCEL_WORKOUT') {
      console.log('🔧 ActiveWorkoutInterface: Sending event:', event.type, event);
    }
    activeWorkoutActor.send(event);
  };

  // Calculate derived state from actor context
  const currentExerciseIndex = exerciseProgression?.currentExerciseIndex || 0;

  // Calculate elapsed time from actor timing info
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Simple continuous timer showing total gym time
  useEffect(() => {
    if (!timingInfo?.startTime) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - timingInfo.startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [timingInfo?.startTime]);

  // ✅ FIXED: Create exercises from workout data with extraSetsRequested support
  const exercises: ExerciseData[] = workoutData?.exercises?.map((exercise: WorkoutExercise, index: number) => {
    // ✅ FIXED: Filter by exerciseIndex instead of exerciseRef (for duplicate exercise support)
    const completedSetsForExercise = workoutData.completedSets?.filter(
      (set: CompletedSet) => set.exerciseIndex === index
    ) || [];

    // ✅ FIXED: Handle user-requested extra sets properly (ported from ActiveWorkoutContainer)
    const templateSets = exercise.sets || 3;
    
    // ✅ FIXED: Check if user has requested extra sets via ADD_SET events using exerciseIndex
    const extraSets = extraSetsRequested[index] || 0;
    
    // Total sets = template sets + any extra sets the user has requested
    const totalSets = templateSets + extraSets;

    // Removed repetitive exercise logging to reduce console spam

    return {
      id: `exercise-${index}`, // ✅ FIXED: Use unique index-based ID
      exerciseRef: exercise.exerciseRef, // ✅ FIXED: Keep the actual exercise reference
      name: exercise.exerciseName || `Exercise ${index + 1}`, // ✅ FIXED: Use exerciseName from active workout machine
      equipment: undefined, // WorkoutExercise doesn't have equipment field
      notes: undefined, // WorkoutExercise doesn't have notes field
      sets: Array.from({ length: totalSets }, (_, setIndex) => {  // ✅ Use totalSets instead of exercise.sets
        const completedSet = completedSetsForExercise.find(
          (set: CompletedSet) => set.setNumber === setIndex + 1
        );
        
        return {
          weight: completedSet?.weight || exercise.weight || 0,
          reps: completedSet?.reps || exercise.reps || 0,
          rpe: completedSet?.rpe || 7, // WorkoutExercise doesn't have rpe field
          setType: completedSet?.setType || 'normal', // WorkoutExercise doesn't have setType field
          completed: !!completedSet
        };
      }),
      prescribedSets: templateSets, // ✅ Keep original template count for display
      prescribedReps: exercise.reps || 10,
      prescribedWeight: exercise.weight || 0
    };
  }) || [];

  // ✅ FIXED: Use actual selected set from XState machine, not "first empty set"
  const calculateCurrentSetIndex = (exerciseIndex: number): number => {
    if (exerciseIndex !== currentExerciseIndex) {
      return -1; // Not the active exercise
    }
    
    // Use the actual currentSetNumber from XState machine (1-based) converted to 0-based index
    const selectedSetIndex = (exerciseProgression?.currentSetNumber || 1) - 1;
    
    const currentExercise = exercises[exerciseIndex];
    if (!currentExercise) return -1;
    
    // Ensure the selected set index is valid for this exercise
    if (selectedSetIndex >= 0 && selectedSetIndex < currentExercise.sets.length) {
      return selectedSetIndex;
    }
    
    // Fallback: if selected set is out of bounds, find first incomplete set
    const nextEmptySetIndex = currentExercise.sets.findIndex(set => !set.completed);
    
    if (nextEmptySetIndex >= 0) {
      return nextEmptySetIndex;
    }
    
    // All sets are complete - return special value to highlight "Add Set" button
    return -2; // Special value meaning "highlight Add Set button"
  };

  // Event handlers that send events to the actor
  const handleSetComplete = (exerciseId: string, setIndex: number, setData: SetData) => {
    // ✅ FIXED: Find exerciseIndex from exerciseId and use exerciseIndex for events
    const exerciseIndex = exercises.findIndex(ex => ex.id === exerciseId);
    if (exerciseIndex === -1) {
      console.error('🔧 ActiveWorkoutInterface: Exercise not found for ID:', exerciseId, {
        availableExercises: exercises.map(ex => ({ id: ex.id, name: ex.name, ref: ex.exerciseRef }))
      });
      return; // Exercise not found
    }
    
    const exercise = exercises[exerciseIndex];
    console.log('🔧 ActiveWorkoutInterface: handleSetComplete DEBUG:', {
      exerciseId,
      exerciseIndex,
      setIndex,
      setNumber: setIndex + 1,
      exerciseName: exercise.name,
      exerciseRef: exercise.exerciseRef,
      setData,
      isCompleting: setData.completed !== false,
      totalExercises: exercises.length
    });
    
    // 🔧 ROOT CAUSE FIX: Check completed flag and send appropriate event
    if (setData.completed === false) {
      // Uncompleting a set - send UNCOMPLETE_SET event
      console.log('🔧 ActiveWorkoutInterface: Uncompleting set - sending UNCOMPLETE_SET');
      actorSend({ 
        type: 'UNCOMPLETE_SET',
        exerciseIndex,
        setNumber: setIndex + 1
      });
    } else {
      // Completing a set - send COMPLETE_SPECIFIC_SET event
      console.log('🔧 ActiveWorkoutInterface: Completing set - sending COMPLETE_SPECIFIC_SET');
      actorSend({ 
        type: 'COMPLETE_SPECIFIC_SET',
        exerciseIndex, // ✅ FIXED: Use exerciseIndex instead of exerciseRef
        setNumber: setIndex + 1, // Convert 0-based index to 1-based set number
        setData: {
          weight: setData.weight,
          reps: setData.reps,
          rpe: setData.rpe,
          setType: setData.setType
        }
      });
    }
  };

  // ✅ FIXED: Add set functionality
  const handleAddSet = (exerciseId: string) => {
    // ✅ FIXED: Find exerciseIndex from exerciseId and use exerciseIndex for events
    const exerciseIndex = exercises.findIndex(ex => ex.id === exerciseId);
    if (exerciseIndex === -1) return; // Exercise not found
    
    actorSend({ 
      type: 'ADD_SET',
      exerciseIndex // ✅ FIXED: Use exerciseIndex instead of exerciseRef
    });
  };


  // NEW: Exercise detail modal handler
  const handleExerciseNameClick = (exerciseRef: string) => {
    setSelectedExerciseRef(exerciseRef);
    setShowExerciseDetail(true);
  };

  // NEW: Set selection handler for input focus following
  const handleSetSelect = (exerciseIndex: number, setIndex: number) => {
    // First navigate to the exercise
    actorSend({ 
      type: 'NAVIGATE_TO_EXERCISE',
      exerciseIndex
    });
    
    // Then send a SELECT_SET event for future flexible set interaction
    actorSend({
      type: 'SELECT_SET',
      exerciseIndex, // ✅ FIXED: Use exerciseIndex instead of exerciseRef
      setNumber: setIndex + 1 // Convert 0-based index to 1-based set number
    });
  };


  // NEW: Helper function to check if exercise has completed sets
  const hasCompletedSets = (exerciseIndex: number): boolean => {
    return workoutData.completedSets.some((set: CompletedSet) => set.exerciseIndex === exerciseIndex);
  };

  // CRUD Interface Handlers
  const handleAddExercises = (exerciseRefs: string[], insertIndex?: number) => {
    exerciseRefs.forEach(exerciseRef => {
      actorSend({
        type: 'ADD_EXERCISES',
        exerciseRefs: [exerciseRef],
        insertIndex
      });
    });
  };

  const handleRemoveExercise = (exerciseIndex: number) => {
    const exercise = exercises[exerciseIndex];
    
    if (hasCompletedSets(exerciseIndex)) {
      // Show confirmation dialog for exercises with completed sets
      setConfirmationDialog({
        isOpen: true,
        type: 'remove',
        exerciseIndex,
        exerciseName: exercise.name,
        message: `Remove ${exercise.name}? You'll lose your completed sets.`,
        onConfirm: () => {
          actorSend({
            type: 'REMOVE_EXERCISE',
            exerciseIndex
          });
          setConfirmationDialog(null);
        }
      });
    } else {
      // Direct action for exercises with no completed sets
      actorSend({
        type: 'REMOVE_EXERCISE',
        exerciseIndex
      });
    }
  };

  const handleSubstituteExercise = (exerciseIndex: number) => {
    const exercise = exercises[exerciseIndex];
    
    if (hasCompletedSets(exerciseIndex)) {
      // Show confirmation dialog for exercises with completed sets
      setConfirmationDialog({
        isOpen: true,
        type: 'substitute',
        exerciseIndex,
        exerciseName: exercise.name,
        message: `Substitute ${exercise.name}? You'll lose your completed sets.`,
        onConfirm: () => {
          // After confirmation, open the substitution picker
          setSubstituteExerciseIndex(exerciseIndex);
          setShowSubstitutePicker(true);
          setConfirmationDialog(null);
        }
      });
    } else {
      // Direct action for exercises with no completed sets - open picker immediately
      setSubstituteExerciseIndex(exerciseIndex);
      setShowSubstitutePicker(true);
    }
  };

  // NEW: Handle actual substitution after exercise is selected from picker
  const handleSubstituteExerciseComplete = (newExerciseRef: string) => {
    if (substituteExerciseIndex !== null) {
      actorSend({
        type: 'SUBSTITUTE_EXERCISE',
        exerciseIndex: substituteExerciseIndex,
        newExerciseRef
      });
      setShowSubstitutePicker(false);
      setSubstituteExerciseIndex(null);
    }
  };


  // NEW: Superset creation handler - TEMPORARILY DISABLED
  const handleCreateSuperset = () => {
    // Temporarily disabled - superset functionality coming soon
    console.log('🔗 Superset creation temporarily disabled - coming soon!');
    // setSupersetTriggerExerciseIndex(exerciseIndex);
    // setShowSupersetPicker(true);
  };

  // NEW: Regrouping logic for non-adjacent exercises
  const regroupExercisesForSuperset = (selectedIndices: number[]): number[] => {
    if (selectedIndices.length < 2) return selectedIndices;
    
    // Sort indices to maintain selection order
    const sortedIndices = [...selectedIndices].sort((a, b) => a - b);
    const firstIndex = sortedIndices[0];
    
    // Check if exercises are already consecutive
    const areConsecutive = sortedIndices.every((index, i) => 
      i === 0 || index === sortedIndices[i - 1] + 1
    );
    
    if (areConsecutive) {
      return selectedIndices; // No regrouping needed
    }
    
    // Need to regroup - move all selected exercises to be consecutive starting at first index
    console.log('🔄 Regrouping non-adjacent exercises:', {
      originalIndices: selectedIndices,
      sortedIndices,
      firstIndex,
      exerciseNames: selectedIndices.map(i => exercises[i]?.name)
    });
    
    // For now, just return the sorted indices - actual exercise reordering will be in Phase 4
    // In Phase 4, we'll send REGROUP_EXERCISES_FOR_SUPERSET event to XState
    return sortedIndices;
  };

  // NEW: Handle superset creation with automatic regrouping
  const handleSupersetCreation = (exerciseIndices: number[]) => {
    if (supersetTriggerExerciseIndex !== null && exerciseIndices.length >= 2) {
      // Apply regrouping logic
      const regroupedIndices = regroupExercisesForSuperset(exerciseIndices);
      
      // Create superset group locally (will be moved to XState in Phase 4)
      const newSuperset = {
        id: `superset-${Date.now()}`,
        exerciseIndices: regroupedIndices,
        exerciseNames: regroupedIndices.map(index => exercises[index]?.name || `Exercise ${index + 1}`)
      };
      
      setSupersetGroups(prev => [...prev, newSuperset]);
      
      console.log('🔗 Created superset with regrouping:', {
        originalIndices: exerciseIndices,
        regroupedIndices,
        supersetGroup: newSuperset
      });
      
      // TODO Phase 4: Send CREATE_SUPERSET event to XState machine
      // actorSend({
      //   type: 'CREATE_SUPERSET',
      //   exerciseIndices: regroupedIndices,
      //   triggerExerciseIndex: supersetTriggerExerciseIndex
      // });
    }
    
    setShowSupersetPicker(false);
    setSupersetTriggerExerciseIndex(null);
  };

  // NEW: Handle superset removal
  const handleRemoveSuperset = (groupId: string) => {
    setSupersetGroups(prev => prev.filter(group => group.id !== groupId));
    console.log('🔗 Removed superset group:', groupId);
    
    // TODO Phase 4: Send REMOVE_SUPERSET event to XState machine
    // actorSend({
    //   type: 'REMOVE_SUPERSET',
    //   groupId
    // });
  };

  // NEW: Check if exercise is in a superset
  const getExerciseSuperset = (exerciseIndex: number) => {
    return supersetGroups.find(group => 
      group.exerciseIndices.includes(exerciseIndex)
    );
  };

  // NEW: Exercise reorder handler
  const handleReorderExercises = () => {
    setShowExerciseReorder(true);
  };

  // NEW: Handle exercise reordering
  const handleExerciseReorder = (newOrder: number[]) => {
    console.log('🔄 Reordering exercises:', {
      originalOrder: exercises.map((ex, i) => ({ index: i, name: ex.name })),
      newOrder,
      newOrderNames: newOrder.map(i => exercises[i]?.name)
    });
    
    // Send REORDER_EXERCISES event to XState machine
    actorSend({
      type: 'REORDER_EXERCISES',
      newOrder
    });
    
    setShowExerciseReorder(false);
  };


  const handleCancelConfirm = () => {
    setShowCancelDialog(false);
    actorSend({ type: 'CANCEL_WORKOUT' });
    onWorkoutCancel?.();
    onMinimize(); // Minimize after canceling
  };

  const handleFinishConfirm = () => {
    setShowFinishDialog(false);
    actorSend({ type: 'COMPLETE_WORKOUT' });
    
    // Call completion callback with workout data
    if (onWorkoutComplete && workoutData) {
      onWorkoutComplete(workoutData);
    }
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

  return (
    <>
      {/* Desktop-only backdrop for better performance */}
      {isOpen && (
        <div className="fixed inset-0 z-40 opacity-100 hidden md:block">
          <WorkoutImageHandler
            tags={templateData?.tags}
            content={templateData?.content || templateData?.description}
            eventKind={templateData?.eventKind || 33402}
            alt={workoutData?.title || 'Active Workout'}
            className="w-full h-full object-cover"
            fill={true}
            priority={true}
          />
          {/* Enhanced overlay with frosted glass effect for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/65 backdrop-blur-sm md:backdrop-blur-md" />
        </div>
      )}

      {/* Responsive Modal Workout Interface - Consistent with WorkoutDetailModal */}
      <Dialog open={isOpen} onOpenChange={() => onMinimize()}>
        <DialogContent 
          className="max-w-full max-h-full w-screen h-[100dvh] supports-[height:100dvh]:h-[100dvh] p-0 m-0 rounded-none border-none" 
          showCloseButton={false}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Active Workout</DialogTitle>
          </DialogHeader>
          
          <div className={cn(
            "relative h-full bg-background/90 backdrop-blur-md overflow-hidden pb-[env(safe-area-inset-bottom)] flex flex-col",
            "md:bg-background/80 md:backdrop-blur-lg", // More transparency on desktop with backdrop
            className
          )}>
            {/* Enhanced Header with Workout Menu */}
            <div className="flex items-center justify-between p-4 bg-background border-b border-border flex-shrink-0">
              {/* Minimize Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  console.log('🔙 ActiveWorkoutInterface: Back button clicked - calling onMinimize');
                  onMinimize();
                }}
                className="text-muted-foreground hover:text-foreground"
                title="Minimize workout (workout continues in background)"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              {/* Central Timer */}
              <div className="flex flex-col items-center">
                <WorkoutTimer 
                  elapsedTime={elapsedTime}
                  className="text-2xl font-bold"
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {completedSets}/{totalSets} sets
                </div>
              </div>

              {/* Finish Button Only */}
              <Button
                variant="workout-success"
                onClick={() => setShowFinishDialog(true)}
                className="px-6"
              >
                Finish
              </Button>
            </div>

            {/* Workout Title and Description Section with Menu */}
            {(workoutData?.title || templateData?.description) && (
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-lg font-semibold text-foreground">
                    {workoutData?.title || 'Active Workout'}
                  </h2>
                  <WorkoutMenuDropdown 
                    onMenuAction={(action) => {
                      console.log('🔧 Workout menu action:', action);
                      if (action === 'template-info') {
                        setShowTemplateInfo(true);
                      }
                      // TODO: Handle other workout menu actions in Phase 2, Item 6
                    }}
                    workoutData={workoutData}
                    templateData={templateData}
                  />
                </div>
                {templateData?.description && (
                  <WorkoutDescription 
                    description={templateData.description}
                    maxLines={2}
                    expandable={true}
                  />
                )}
              </div>
            )}

            {/* Exercise List - Scrollable with comfortable padding */}
            <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-2">
              {/* ✅ SIMPLIFIED: Render individual exercises only (superset complexity removed for weight unit fix) */}
              {exercises.map((exercise: ExerciseData, exerciseIndex: number) => {
                const smartSetIndex = calculateCurrentSetIndex(exerciseIndex);
                const shouldHighlightAddSet = smartSetIndex === -2;

                return (
                  <ExerciseSection
                    key={`${exercise.id}-${exerciseIndex}`} // ✅ SIMPLE SOLUTION: Remove weightUnit from key since prop passing handles re-renders
                    exercise={exercise}
                    weightUnit={weightUnit} // ✅ SIMPLE SOLUTION: Pass weightUnit as prop
                    shouldHighlightAddSet={shouldHighlightAddSet}
                    onSetComplete={(exerciseId: string, setIndex: number, setData: SetData) => 
                      handleSetComplete(exerciseId, setIndex, setData)
                    }
                    onAddSet={(exerciseId: string) => handleAddSet(exerciseId)}
                    onExerciseNameClick={() => handleExerciseNameClick(exercise.exerciseRef)}
                    onSelectSet={handleSetSelect}
                    exerciseIndex={exerciseIndex}
                    // CRUD operation handlers
                    onRemoveExercise={handleRemoveExercise}
                    onSubstituteExercise={handleSubstituteExercise}
                    onReorderExercises={handleReorderExercises}
                    onCreateSuperset={handleCreateSuperset}
                    totalExercises={exercises.length}
                  />
                );
              })}
              
              {/* Add Exercise Button - Enhanced with semantic styling */}
              <div className="pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddExercisePicker(true)}
                  className="w-full h-14 border-2 border-dashed border-workout-active-border bg-workout-active-bg hover:bg-workout-active-border/10 text-workout-active hover:text-workout-active transition-all duration-200 hover:scale-[1.02] hover:shadow-lg group"
                >
                  <Plus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-medium">Add Exercise</span>
                </Button>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="p-4 border-t border-border bg-background flex-shrink-0">
              <div className="flex items-center justify-between gap-4">
                {/* Cancel Button - Fixed for dark mode with semantic styling */}
                <Button
                  variant="outline"
                  onClick={() => setShowCancelDialog(true)}
                  className="flex-1 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Cancel
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
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent
          className="w-[95vw] max-w-md sm:w-full sm:max-w-lg"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Cancel Workout?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to cancel this workout? All progress will be lost.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowCancelDialog(false);
              }}
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
        <DialogContent
          className="w-[95vw] max-w-md sm:w-full sm:max-w-lg"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Finish Workout?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to finish this workout? This will save your progress and publish to Nostr.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowFinishDialog(false);
              }}
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

      {/* Add Exercise Picker */}
      <ExercisePicker
        isOpen={showAddExercisePicker}
        onClose={() => setShowAddExercisePicker(false)}
        onSelectExercise={() => {}} // Not used in multiple mode
        onSelectMultipleExercises={(exerciseRefs) => {
          handleAddExercises(exerciseRefs);
          setShowAddExercisePicker(false);
        }}
        mode="multiple"
        title="Add Exercises"
        description="Select exercises to add to your workout"
      />

      {/* Substitution Exercise Picker */}
      <ExercisePicker
        isOpen={showSubstitutePicker}
        onClose={() => {
          setShowSubstitutePicker(false);
          setSubstituteExerciseIndex(null);
        }}
        onSelectExercise={(exerciseRef) => {
          handleSubstituteExerciseComplete(exerciseRef);
        }}
        mode="single"
        title="Substitute Exercise"
        description={
          substituteExerciseIndex !== null 
            ? `Replace "${exercises[substituteExerciseIndex]?.name}" with a different exercise`
            : "Select a replacement exercise"
        }
        excludeExerciseRefs={
          substituteExerciseIndex !== null 
            ? [exercises[substituteExerciseIndex]?.exerciseRef].filter(Boolean)
            : []
        }
      />

      {/* Exercise Detail Modal */}
      {selectedExerciseRef && (
        <ExerciseDetailModal
          isOpen={showExerciseDetail}
          onClose={() => {
            setShowExerciseDetail(false);
            setSelectedExerciseRef(null);
          }}
          hideBackground={true} // Hide background to keep parent ActiveWorkout background
          exercise={{
            id: selectedExerciseRef.split(':')[2] || selectedExerciseRef,
            name: exercises.find(ex => ex.exerciseRef === selectedExerciseRef)?.name || 'Exercise',
            description: 'Exercise details will be loaded from Nostr',
            equipment: 'Unknown',
            difficulty: 'intermediate',
            muscleGroups: [],
            authorPubkey: selectedExerciseRef.split(':')[1] || '',
            eventId: selectedExerciseRef
          }}
        />
      )}

      {/* Superset Creation Modal */}
      <SupersetCreationModal
        isOpen={showSupersetPicker}
        onClose={() => {
          setShowSupersetPicker(false);
          setSupersetTriggerExerciseIndex(null);
        }}
        onCreateSuperset={handleSupersetCreation}
        currentExercises={exercises.map((exercise, index) => ({
          index,
          name: exercise.name,
          exerciseRef: exercise.exerciseRef
        }))}
        triggerExerciseIndex={supersetTriggerExerciseIndex || 0}
      />

      {/* Exercise Reorder Modal */}
      <ExerciseReorderModal
        isOpen={showExerciseReorder}
        onClose={() => setShowExerciseReorder(false)}
        onReorderExercises={handleExerciseReorder}
        currentExercises={exercises.map((exercise, index) => ({
          index,
          name: exercise.name,
          exerciseRef: exercise.exerciseRef
        }))}
      />

      {/* ✅ NEW: Template Save Modal - Shows when lifecycle is in templateSavePrompt state */}
      {workoutLifecycleActor && templateAnalysis && (
        <SaveTemplateModal
          isOpen={showTemplateSaveModal}
          onClose={() => {
            console.log('⏭️ SaveTemplateModal: Skipping template save');
            workoutLifecycleActor.send({ type: 'SKIP_SAVE' });
          }}
          onSaveTemplate={(saveType: 'new' | 'update', templateName?: string) => {
            console.log('💾 SaveTemplateModal: Saving template:', { saveType, templateName });
            workoutLifecycleActor.send({ type: 'SAVE_TEMPLATE', saveType, templateName });
          }}
          modificationAnalysis={{
            isOwner: templateAnalysis.isOwner,
            hasSignificantChanges: templateAnalysis.hasModifications,
            modificationSummary: `${templateAnalysis.modificationCount} modifications made`,
            totalChanges: templateAnalysis.modificationCount,
            canUpdateOriginal: templateAnalysis.isOwner,
            canSaveAsNew: true
          }}
          originalTemplate={{
            id: templateAnalysis.originalTemplate?.templateId || 'unknown',
            name: templateAnalysis.originalTemplate?.templateId || 'Unknown Template',
            authorPubkey: templateAnalysis.originalTemplate?.templatePubkey || '',
            exercises: []
          }}
          isOwner={templateAnalysis.isOwner}
          suggestedName={templateAnalysis.suggestedName}
        />
      )}

      {/* ✅ NEW: Smart Workout Confirmation Dialog */}
      {confirmationDialog && (
        <ConfirmationDialog
          isOpen={confirmationDialog.isOpen}
          onClose={() => setConfirmationDialog(null)}
          onConfirm={confirmationDialog.onConfirm}
          title={confirmationDialog.type === 'remove' ? 'Remove Exercise' : 'Substitute Exercise'}
          description={confirmationDialog.message}
          confirmText={confirmationDialog.type === 'remove' ? 'Remove' : 'Substitute'}
          cancelText="Cancel"
          variant="destructive"
        />
      )}

      {/* ✅ NEW: Template Info Modal - Shows template details during active workout */}
      <WorkoutDetailModal
        isOpen={showTemplateInfo}
        onClose={() => setShowTemplateInfo(false)}
        onStartWorkout={() => {}} // No-op since workout is already active
        templateData={{
          // Transform active workout data to expected format
          title: workoutData?.title || templateData?.title,
          description: templateData?.description,
          tags: templateData?.tags,
          content: templateData?.content,
          eventKind: templateData?.eventKind,
          // Create resolvedTemplate from workout data (prescribed values)
          resolvedTemplate: {
            name: workoutData?.title || templateData?.title || 'Active Workout',
            description: templateData?.description || 'Workout template information',
            exercises: workoutData?.exercises?.map((exercise: WorkoutExercise, _index: number) => ({
              exerciseRef: exercise.exerciseRef,
              sets: exercise.sets || 3, // Prescribed sets
              reps: exercise.reps || 10, // Prescribed reps  
              weight: exercise.weight || 0 // Prescribed weight
            })) || []
          },
          // Create resolvedExercises from workout data
          resolvedExercises: workoutData?.exercises?.map((exercise: WorkoutExercise, index: number) => ({
            id: exercise.exerciseRef.split(':')[2] || `exercise-${index}`,
            name: exercise.exerciseName || `Exercise ${index + 1}`,
            equipment: 'Unknown', // We don't have equipment data in WorkoutExercise
            description: `Prescribed: ${exercise.sets || 3} sets × ${exercise.reps || 10} reps${exercise.weight ? ` @ ${exercise.weight}kg` : ''}`,
            muscleGroups: [], // We don't have muscle group data in WorkoutExercise
            difficulty: 'intermediate'
          })) || []
        }}
        hideStartButton={true} // Hide start button for active workouts
        isLoading={false}
      />

    </>
  );
};
