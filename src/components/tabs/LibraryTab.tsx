'use client';

import React, { useState, useEffect } from 'react';
import { Library, Search, BookOpen, Dumbbell, Calendar } from 'lucide-react';
import { useSubNavigation } from '@/providers/SubNavigationProvider';
import { useLibraryData } from '@/providers/LibraryDataProvider';
import { useWorkoutContext } from '@/hooks/useWorkoutContext';
import { Input } from '@/components/powr-ui/primitives/Input';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Card, CardContent } from '@/components/powr-ui/primitives/Card';
import { WorkoutCard } from '@/components/powr-ui/workout/WorkoutCard';
import { ExerciseCard } from '@/components/powr-ui/workout/ExerciseCard';
import { WorkoutDetailModal } from '@/components/powr-ui/workout/WorkoutDetailModal';
import { WorkoutSummaryModal } from '@/components/powr-ui/workout/WorkoutSummaryModal';
import { ExerciseDetailModal } from '@/components/library/ExerciseDetailModal';
import { SimpleLibraryOnboarding } from '@/components/library/SimpleLibraryOnboarding';
import { useSimpleLibraryOnboarding } from '@/hooks/useSimpleLibraryOnboarding';
import { libraryManagementService } from '@/lib/services/libraryManagement';
import { useToast } from '@/providers/ToastProvider';
import { ConfirmationDialog } from '@/components/powr-ui/primitives/ConfirmationDialog';
import { usePubkey } from '@/lib/auth/hooks';

export function LibraryTab() {
  const { getActiveSubTab } = useSubNavigation();
  const activeSubTab = getActiveSubTab('library') || 'exercises';
  const [modalError, setModalError] = useState<string | undefined>();
  const userPubkey = usePubkey();
  const { showToast } = useToast();

  // Exercise Detail Modal state
  const [selectedExercise, setSelectedExercise] = useState<{
    id: string;
    name: string;
    description?: string;
    equipment?: string;
    difficulty?: string;
    muscleGroups?: string[];
    format?: string[];
    formatUnits?: string[];
    authorPubkey?: string;
    createdAt?: number;
    eventId?: string;
    eventTags?: string[];
    eventContent?: string;
    eventKind?: number;
  } | null>(null);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);

  // CRUD operation state
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    itemRef: string;
    itemName: string;
    itemType: 'exercise' | 'workout';
  }>({
    isOpen: false,
    itemRef: '',
    itemName: '',
    itemType: 'exercise'
  });

  // Simple onboarding hook - no complex state synchronization
  const {
    isModalOpen,
    setIsModalOpen,
    isOnboarding,
    runOnboarding,
    skipOnboarding,
    error: onboardingError,
    result: onboardingResult
  } = useSimpleLibraryOnboarding();

  // Global Workout Context - same as WorkoutsTab
  const { workoutState, workoutSend } = useWorkoutContext();

  // Machine state-based UI updates
  useEffect(() => {
    // Handle machine state changes for UI updates
    // Modal opens/closes based on machine state
  }, [workoutState]);

  // Handle workout selection from library templates
  const handleWorkoutSelect = (workoutId: string, templateRef?: string) => {
    // Reset machine to idle state before starting new selection
    if (!workoutState.matches('idle')) {
      workoutSend({ type: 'RESET_LIFECYCLE' });
      return; // Exit early, user can click again after reset
    }

    // Use provided templateRef or try to construct from workoutId
    const templateReference = templateRef;
    
    if (!templateReference) {
      setModalError('Cannot start workout: No template reference found');
      return;
    }

    // Validate template reference format
    const templateParts = templateReference.split(':');
    if (templateParts.length !== 3) {
      setModalError('Cannot start workout: Invalid template reference format');
      return;
    }
    
    // Start the workout lifecycle machine with the correct template reference
    workoutSend({ 
      type: 'START_SETUP',
      templateReference: templateReference
    });
  };

  const handleCloseModal = () => {
    setModalError(undefined);
    
    // Only reset machine if we're in setup states, not active workout
    if (workoutState.matches('setupComplete')) {
      workoutSend({ type: 'CANCEL_SETUP' });
    } else if (workoutState.matches('setup')) {
      workoutSend({ type: 'CANCEL_SETUP' });
    }
  };

  const handleStartWorkout = () => {
    // Use the machine's resolved workout data
    if (workoutState.context.workoutData) {
      workoutSend({ 
        type: 'START_WORKOUT',
        workoutData: workoutState.context.workoutData
      });
    } else {
      // Fallback to basic workout data
      workoutSend({ 
        type: 'START_WORKOUT',
        workoutData: {
          workoutId: `workout_${Date.now()}`,
          title: 'Library Workout',
          exercises: [],
          completedSets: [],
          workoutType: 'strength',
          startTime: Date.now()
        }
      });
    }
  };

  // Summary modal handlers
  const handleShareWorkout = (content: string) => {
    workoutSend({ 
      type: 'SHARE_WORKOUT',
      content: content
    });
  };

  const handleSkipSharing = () => {
    workoutSend({ type: 'SKIP_SHARING' });
  };

  const handleCloseSummary = () => {
    workoutSend({ type: 'CLOSE_SUMMARY' });
  };

  // Exercise Detail Modal handlers
  const handleExerciseSelect = (exerciseData: {
    id: string;
    name: string;
    description?: string;
    equipment?: string;
    difficulty?: string;
    muscleGroups?: string[];
    format?: string[];
    formatUnits?: string[];
    authorPubkey?: string;
    createdAt?: number;
    eventId?: string;
    eventTags?: string[];
    eventContent?: string;
    eventKind?: number;
  }) => {
    setSelectedExercise(exerciseData);
    setIsExerciseModalOpen(true);
  };

  const handleCloseExerciseModal = () => {
    setIsExerciseModalOpen(false);
    setSelectedExercise(null);
  };

  // CRUD handlers for library items
  const handleRemoveItem = (itemRef: string, itemName: string, itemType: 'exercise' | 'workout') => {
    setConfirmDialog({
      isOpen: true,
      itemRef,
      itemName,
      itemType
    });
  };

  const confirmRemoveItem = async () => {
    if (!userPubkey || !confirmDialog.itemRef) return;

    setIsOperationLoading(true);
    try {
      const collectionType = confirmDialog.itemType === 'exercise' ? 'EXERCISE_LIBRARY' : 'WORKOUT_LIBRARY';
      
      // Use the new service method with automatic cache refresh
      await libraryManagementService.removeFromLibraryCollectionWithRefresh(
        userPubkey,
        collectionType,
        confirmDialog.itemRef
      );

      showToast(
        `${confirmDialog.itemType === 'exercise' ? 'Exercise' : 'Workout'} removed`,
        'success',
        `${confirmDialog.itemName} has been removed from your library`
      );

      // Close dialog
      setConfirmDialog({ isOpen: false, itemRef: '', itemName: '', itemType: 'exercise' });
      
      // Cache refresh event automatically dispatched by service
    } catch (error) {
      console.error('[LibraryTab] Failed to remove item:', error);
      showToast(
        `Failed to remove ${confirmDialog.itemType}`,
        'error',
        'Please try again'
      );
    } finally {
      setIsOperationLoading(false);
    }
  };


  return (
    <>
      {/* Header */}
      <div className="text-center space-y-2 mb-6">
        <div className="flex items-center justify-center gap-3">
          <Library className="h-8 w-8 text-[color:var(--workout-primary)]" />
          <h1 className="text-3xl font-bold tracking-tight">Library</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Your personal fitness collection
        </p>
      </div>

      {/* Sub-tab content */}
      <div className="space-y-6">
        {activeSubTab === 'exercises' && <ExercisesView onShowOnboarding={() => setIsModalOpen(true)} onExerciseSelect={handleExerciseSelect} onRemoveItem={handleRemoveItem} />}
        {activeSubTab === 'workouts' && <WorkoutsView onShowOnboarding={() => setIsModalOpen(true)} onWorkoutSelect={handleWorkoutSelect} onRemoveItem={handleRemoveItem} />}
        {activeSubTab === 'collections' && <CollectionsView onShowOnboarding={() => setIsModalOpen(true)} />}
      </div>

      {/* Onboarding Modal */}
      <SimpleLibraryOnboarding 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
        onComplete={runOnboarding}
        onSkip={skipOnboarding}
        isLoading={isOnboarding}
        error={onboardingError}
        result={onboardingResult}
      />

      {/* Workout Detail Modal */}
      <WorkoutDetailModal
        isOpen={workoutState.matches('setup') || workoutState.matches('setupComplete')}
        isLoading={workoutState.matches('setup')}
        templateData={{
          title: (workoutState.context.resolvedTemplate as { name?: string })?.name || 
                 (workoutState.context.workoutData as { title?: string })?.title || 
                 (workoutState.matches('setup') ? 'Loading workout...' : 'Untitled Workout'),
          description: (workoutState.context.resolvedTemplate as { description?: string })?.description || 
                       (workoutState.matches('setup') ? 'Resolving workout details from Nostr network...' : 'Loading workout description...'),
          content: (workoutState.context.resolvedTemplate as { description?: string })?.description || 
                   (workoutState.matches('setup') ? 'Resolving workout details from Nostr network...' : 'Loading workout description...'),
          
          // Pass resolved data directly from machine context
          resolvedTemplate: workoutState.context.resolvedTemplate ? {
            name: (workoutState.context.resolvedTemplate as { name?: string })?.name || 'Untitled Workout',
            description: (workoutState.context.resolvedTemplate as { description?: string })?.description || '',
            exercises: (workoutState.context.resolvedTemplate as { exercises?: Array<{ exerciseRef: string; sets?: number; reps?: number; weight?: number }> })?.exercises || []
          } : undefined,
          resolvedExercises: workoutState.context.resolvedExercises as Array<{
            id: string;
            name: string;
            equipment: string;
            description: string;
            muscleGroups: string[];
          }>,
          
          // Additional metadata
          tags: [['t', 'fitness']],
          eventKind: 33402,
          templateRef: workoutState.context.templateSelection?.templateReference
        }}
        error={modalError}
        onClose={handleCloseModal}
        onStartWorkout={handleStartWorkout}
      />

      {/* Workout Summary Modal */}
      {workoutState.matches('summary') && workoutState.context.workoutData && (
        <WorkoutSummaryModal
          isOpen={true}
          onClose={handleCloseSummary}
          workoutData={{
            workoutId: workoutState.context.workoutData.workoutId,
            title: workoutState.context.workoutData.title,
            workoutType: workoutState.context.workoutData.workoutType,
            startTime: workoutState.context.workoutData.startTime,
            endTime: workoutState.context.workoutData.endTime || Date.now(),
            completedSets: workoutState.context.workoutData.completedSets || [],
            notes: workoutState.context.workoutData.notes,
            templateId: (workoutState.context.templateSelection as { templateId?: string })?.templateId,
            templatePubkey: (workoutState.context.templateSelection as { templatePubkey?: string })?.templatePubkey || workoutState.context.userInfo.pubkey,
            templateReference: (workoutState.context.templateSelection as { templateReference?: string })?.templateReference,
            templateRelayUrl: (workoutState.context.templateSelection as { templateRelayUrl?: string })?.templateRelayUrl || ''
          }}
          onShare={handleShareWorkout}
          onSkipSharing={handleSkipSharing}
        />
      )}

      {/* Exercise Detail Modal */}
      <ExerciseDetailModal
        isOpen={isExerciseModalOpen}
        exercise={selectedExercise ? {
          ...selectedExercise,
          equipment: selectedExercise.equipment || '',
          muscleGroups: selectedExercise.muscleGroups || [],
          eventTags: (selectedExercise.eventTags || []).map(tag => Array.isArray(tag) ? tag : [tag]),
          authorPubkey: selectedExercise.authorPubkey || '',
          createdAt: selectedExercise.createdAt || Date.now(),
          eventId: selectedExercise.eventId || '',
          eventContent: selectedExercise.eventContent || '',
          eventKind: selectedExercise.eventKind || 33401
        } : undefined}
        onClose={handleCloseExerciseModal}
      />

      {/* Remove Item Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, itemRef: '', itemName: '', itemType: 'exercise' })}
        onConfirm={confirmRemoveItem}
        title={`Remove ${confirmDialog.itemType === 'exercise' ? 'Exercise' : 'Workout'}`}
        description={`Are you sure you want to remove "${confirmDialog.itemName}" from your ${confirmDialog.itemType} library? This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isOperationLoading}
      />
    </>
  );
}

// Exercises View Component
function ExercisesView({ onShowOnboarding, onExerciseSelect, onRemoveItem }: { 
  onShowOnboarding: () => void;
  onExerciseSelect?: (exerciseData: {
    id: string;
    name: string;
    description?: string;
    equipment?: string;
    difficulty?: string;
    muscleGroups?: string[];
    format?: string[];
    formatUnits?: string[];
    authorPubkey?: string;
    createdAt?: number;
    eventId?: string;
    eventTags?: string[];
    eventContent?: string;
    eventKind?: number;
  }) => void;
  onRemoveItem?: (itemRef: string, itemName: string, itemType: 'exercise' | 'workout') => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  
  // ✅ PERFORMANCE: Use shared library data from context (eliminates duplicate subscription)
  const { exerciseLibrary } = useLibraryData();


  if (exerciseLibrary.isLoading || exerciseLibrary.isResolving) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">
            {exerciseLibrary.isResolving ? 'Resolving exercise references...' : 'Loading exercise library...'}
          </p>
        </div>
      </div>
    );
  }

  if (exerciseLibrary.error) {
    return (
      <div className="p-4 bg-destructive/10 rounded border border-destructive/20">
        <h3 className="font-medium mb-2 text-destructive">⚠️ Error Loading Library</h3>
        <p className="text-sm text-destructive/80">{exerciseLibrary.error}</p>
      </div>
    );
  }

  if (!exerciseLibrary.content || exerciseLibrary.content.length === 0) {
    return (
      <div className="text-center space-y-6 py-16">
        <Dumbbell className="h-16 w-16 text-muted-foreground/50 mx-auto" />
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">No Exercises</h2>
          <p className="text-muted-foreground">
            Your exercise library is empty. Add some exercises to get started.
          </p>
        </div>
        <Button className="mt-4" onClick={onShowOnboarding}>
          Get Started with Exercises
        </Button>
      </div>
    );
  }

  // Filter exercises based on search
  const filteredExercises = searchTerm.trim() 
    ? exerciseLibrary.content.filter(item => 
        item.exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.exercise.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : exerciseLibrary.content;

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search exercises..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Exercises Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredExercises.map((item) => (
          <ExerciseCard
            key={item.exerciseRef}
            variant="discovery"
            exercise={{
              id: item.exercise.id,
              name: item.exercise.name,
              description: item.exercise.description,
              equipment: item.exercise.equipment,
              muscleGroups: item.exercise.muscleGroups,
              difficulty: item.exercise.difficulty as 'beginner' | 'intermediate' | 'advanced' | undefined,
              author: { pubkey: item.exercise.authorPubkey },
              eventId: item.exercise.eventId,
                eventTags: (item.exercise.hashtags || []).map(tag => Array.isArray(tag) ? tag : [tag]),
              eventContent: item.exercise.description,
              eventKind: 33401
            }}
            onSelect={(exerciseId) => {
              if (onExerciseSelect) {
                const exerciseItem = exerciseLibrary.content?.find(ex => ex.exercise.id === exerciseId);
                if (exerciseItem) {
                  onExerciseSelect({
                    id: exerciseItem.exercise.id,
                    name: exerciseItem.exercise.name,
                    description: exerciseItem.exercise.description,
                    equipment: exerciseItem.exercise.equipment,
                    difficulty: exerciseItem.exercise.difficulty,
                    muscleGroups: exerciseItem.exercise.muscleGroups,
                    format: exerciseItem.exercise.format,
                    formatUnits: exerciseItem.exercise.format_units,
                    authorPubkey: exerciseItem.exercise.authorPubkey,
                    createdAt: exerciseItem.exercise.createdAt,
                    eventId: exerciseItem.exercise.eventId,
                    eventTags: exerciseItem.exercise.hashtags || [],
                    eventContent: exerciseItem.exercise.description,
                    eventKind: 33401
                  });
                }
              }
            }}
              onMenuAction={(action, exerciseId) => {
                const exerciseItem = exerciseLibrary.content?.find(ex => ex.exercise.id === exerciseId);
                if (!exerciseItem) return;

                switch (action) {
                  case 'details':
                    if (onExerciseSelect) {
                      onExerciseSelect({
                        id: exerciseItem.exercise.id,
                        name: exerciseItem.exercise.name,
                        description: exerciseItem.exercise.description,
                        equipment: exerciseItem.exercise.equipment,
                        difficulty: exerciseItem.exercise.difficulty,
                        muscleGroups: exerciseItem.exercise.muscleGroups,
                        format: exerciseItem.exercise.format,
                        formatUnits: exerciseItem.exercise.format_units,
                        authorPubkey: exerciseItem.exercise.authorPubkey,
                        createdAt: exerciseItem.exercise.createdAt,
                        eventId: exerciseItem.exercise.eventId,
                        eventTags: (exerciseItem.exercise.hashtags || []).flat(),
                        eventContent: exerciseItem.exercise.description,
                        eventKind: 33401
                      });
                    }
                    break;
                  case 'remove':
                    // Use the parent component's confirmation dialog
                    if (onRemoveItem) {
                      onRemoveItem(exerciseItem.exerciseRef, exerciseItem.exercise.name, 'exercise');
                    }
                    break;
                  case 'copy':
                  case 'share':
                    showToast(
                      `${action === 'copy' ? 'Copy naddr' : 'Share Exercise'}`,
                      'info',
                      `${action === 'copy' ? 'Copy' : 'Share'} functionality coming soon!`
                    );
                    break;
                }
              }}
            showAuthor={true}
            showEquipment={true}
          />
        ))}
      </div>
    </div>
  );
}

// Workouts View Component
function WorkoutsView({ onShowOnboarding, onWorkoutSelect, onRemoveItem }: { 
  onShowOnboarding: () => void;
  onWorkoutSelect?: (workoutId: string, templateRef?: string) => void;
  onRemoveItem?: (itemRef: string, itemName: string, itemType: 'exercise' | 'workout') => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  
  // ✅ PERFORMANCE: Use shared library data from context (eliminates duplicate subscription)
  const { workoutLibrary } = useLibraryData();

  if (workoutLibrary.isLoading || workoutLibrary.isResolving) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">
            {workoutLibrary.isResolving ? 'Resolving workout references...' : 'Loading workout library...'}
          </p>
        </div>
      </div>
    );
  }

  if (workoutLibrary.error) {
    return (
      <div className="p-4 bg-destructive/10 rounded border border-destructive/20">
        <h3 className="font-medium mb-2 text-destructive">⚠️ Error Loading Library</h3>
        <p className="text-sm text-destructive/80">{workoutLibrary.error}</p>
      </div>
    );
  }

  if (!workoutLibrary.content || workoutLibrary.content.length === 0) {
    return (
      <div className="text-center space-y-6 py-16">
        <BookOpen className="h-16 w-16 text-muted-foreground/50 mx-auto" />
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">No Workouts</h2>
          <p className="text-muted-foreground">
            Your workout library is empty. Add some workouts to get started.
          </p>
        </div>
        <Button className="mt-4" onClick={onShowOnboarding}>
          Get Started with Workouts
        </Button>
      </div>
    );
  }

  // Filter workouts based on search
  const filteredWorkouts = searchTerm.trim() 
    ? workoutLibrary.content.filter(item => 
        item.template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.template.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : workoutLibrary.content;

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search workout templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Workouts Grid */}
      {filteredWorkouts.length === 0 ? (
        <div className="text-center py-16">
          <Search className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No workouts found</h3>
          <p className="text-muted-foreground">Try adjusting your search terms</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredWorkouts.map((item) => (
            <WorkoutCard
              key={item.templateRef}
              variant="discovery"
              workout={{
                id: item.template.id,
                title: item.template.name,
                description: item.template.description,
                exercises: item.template.exercises.map(ex => ({
                  name: ex.exerciseRef.split(':')[2], // Extract exercise name from ref
                  sets: ex.sets || 0,
                  reps: ex.reps || 0,
                  weight: ex.weight
                })),
                estimatedDuration: item.template.estimatedDuration || 0,
                difficulty: item.template.difficulty as 'beginner' | 'intermediate' | 'advanced' | undefined,
                author: { pubkey: item.template.authorPubkey },
                eventId: item.template.eventId,
                eventTags: item.template.tags.map(tag => Array.isArray(tag) ? tag : [tag]),
                eventContent: item.template.description,
                eventKind: 33402
              }}
              onSelect={(workoutId) => {
                // Use the template reference from the library item
                if (onWorkoutSelect) {
                  onWorkoutSelect(workoutId, item.templateRef);
                }
              }}
              onMenuAction={(action, workoutId) => {
                const workoutItem = workoutLibrary.content?.find(w => w.template.id === workoutId);
                if (!workoutItem) return;

                switch (action) {
                  case 'start':
                  case 'details':
                    if (onWorkoutSelect) {
                      onWorkoutSelect(workoutId, workoutItem.templateRef);
                    }
                    break;
                  case 'remove':
                    // Use the parent component's confirmation dialog (same pattern as ExercisesView)
                    if (onRemoveItem) {
                      onRemoveItem(workoutItem.templateRef, workoutItem.template.name, 'workout');
                    }
                    break;
                  case 'copy':
                  case 'share':
                    showToast(
                      `${action === 'copy' ? 'Copy naddr' : 'Share Workout'}`,
                      'info',
                      `${action === 'copy' ? 'Copy' : 'Share'} functionality coming soon!`
                    );
                    break;
                }
              }}
              showImage={true}
              showAuthor={true}
              showStats={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Collections View Component
function CollectionsView({ onShowOnboarding }: { onShowOnboarding: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // ✅ PERFORMANCE: Use shared library data from context (eliminates duplicate subscription)
  const { collectionSubscriptions } = useLibraryData();

  if (collectionSubscriptions.isLoading || collectionSubscriptions.isResolving) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">
            {collectionSubscriptions.isResolving ? 'Resolving collection references...' : 'Loading collections...'}
          </p>
        </div>
      </div>
    );
  }

  if (collectionSubscriptions.error) {
    return (
      <div className="p-4 bg-destructive/10 rounded border border-destructive/20">
        <h3 className="font-medium mb-2 text-destructive">⚠️ Error Loading Collections</h3>
        <p className="text-sm text-destructive/80">{collectionSubscriptions.error}</p>
      </div>
    );
  }

  if (!collectionSubscriptions.content || collectionSubscriptions.content.length === 0) {
    return (
      <div className="text-center space-y-6 py-16">
        <Calendar className="h-16 w-16 text-muted-foreground/50 mx-auto" />
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">No Collections</h2>
          <p className="text-muted-foreground">
            You haven&apos;t subscribed to any collections yet. Discover collections from other users.
          </p>
        </div>
        <Button className="mt-4" onClick={onShowOnboarding}>
          Get Started with Collections
        </Button>
      </div>
    );
  }

  // Filter collections based on search
  const filteredCollections = searchTerm.trim() 
    ? collectionSubscriptions.content.filter(item => 
        item.collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.collection.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : collectionSubscriptions.content;

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search collections..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Collections Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCollections.map((item) => (
          <Card key={item.collectionRef} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg line-clamp-1">{item.collection.name}</h3>
                  <div className="text-sm text-muted-foreground">
                    {item.collection.contentRefs.length} items
                  </div>
                </div>
                
                {item.collection.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.collection.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>By {item.collection.authorPubkey.slice(0, 8)}...</span>
                  <span>{new Date(item.collection.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
