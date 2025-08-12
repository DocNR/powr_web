'use client';

import React, { useState, useEffect } from 'react';
import { Search, Calendar } from 'lucide-react';
import { useSubNavigation } from '@/providers/SubNavigationProvider';
import { useLibraryData } from '@/providers/LibraryDataProvider';
import { useWorkoutContext } from '@/hooks/useWorkoutContext';
import { Input } from '@/components/powr-ui/primitives/Input';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Card, CardContent } from '@/components/powr-ui/primitives/Card';
import { WorkoutDetailModal } from '@/components/powr-ui/workout/WorkoutDetailModal';
import { WorkoutSummaryModal } from '@/components/powr-ui/workout/WorkoutSummaryModal';
import { ExerciseDetailModal } from '@/components/library/ExerciseDetailModal';
import { ExerciseLibrary } from '@/components/library/ExerciseLibrary';
import { WorkoutLibrary } from '@/components/library/WorkoutLibrary';
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

  const handleCloseExerciseModal = () => {
    setIsExerciseModalOpen(false);
    setSelectedExercise(null);
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
      {/* Sub-tab content */}
      <div className="space-y-6">
        {activeSubTab === 'exercises' && (
          <ExerciseLibrary 
            onShowOnboarding={() => setIsModalOpen(true)} 
          />
        )}
        {activeSubTab === 'workouts' && (
          <WorkoutLibrary 
            onShowOnboarding={() => setIsModalOpen(true)} 
            onStartWorkout={(templateRef) => handleWorkoutSelect(templateRef, templateRef)}
          />
        )}
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
