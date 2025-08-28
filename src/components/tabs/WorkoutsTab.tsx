'use client';

/**
 * WorkoutsTab - Template-Focused Workout Discovery
 * 
 * Uses cached Nostr data from WorkoutDataProvider for workout discovery interface.
 * Social feed now shows templates that friends have tried (template-focused with social proof).
 * Discovery shows available templates from the network.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { CalendarBar, WorkoutCard, ScrollableGallery, SearchableWorkoutDiscovery, WorkoutDetailModal } from '@/components/powr-ui/workout';
import { WorkoutSummaryModal } from '@/components/powr-ui/workout/WorkoutSummaryModal';
import WorkoutCardSkeleton from '@/components/powr-ui/workout/WorkoutCardSkeleton';
import { useWorkoutData } from '@/providers/WorkoutDataProvider';
import { useWorkoutHistory } from '@/providers/WorkoutHistoryProvider';
import { useWorkoutContext } from '@/hooks/useWorkoutContext';

export default function WorkoutsTab() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Modal state now managed by global workout context
  const [modalError, setModalError] = useState<string | undefined>();

  // Get authenticated user pubkey (for future use)
  // const userPubkey = usePubkey();

  // Get cached data from provider (now template-focused)
  const {
    socialWorkouts, // Now contains templates with social proof
    discoveryTemplates,
    rawEventData,
    isLoading,
    error,
    loadMoreSocialWorkouts,
    loadMoreDiscoveryTemplates,
    hasMoreWorkouts,
    hasMoreTemplates,
    isLoadingMore
  } = useWorkoutData();

  // ✅ NEW: Get user's actual workout records for calendar indicators
  const { workoutRecords } = useWorkoutHistory();

  // ✅ NEW: Generate workout indicators from user's actual 1301 records
  const workoutIndicators = useMemo(() => {
    return workoutRecords.slice(0, 20).map(workout => ({
      date: new Date(workout.createdAt), // Use actual workout completion date
      count: 1,
      type: 'completed' as const
    }));
  }, [workoutRecords]);

  // Global Workout Context - replaces local machine
  const { workoutState, workoutSend } = useWorkoutContext();

  // Machine state-based UI updates - modal state now derived from global state
  useEffect(() => {
    // Handle machine state changes for UI updates
    // Modal opens/closes based on machine state
  }, [workoutState]);

  // ✅ REMOVED: Aggressive cleanup on component unmount
  // This was causing workout state loss during tab navigation
  // Global workout state now persists across all navigation
  // Only essential cleanup remains (app close, logout, explicit cancellation)

  // POWR WOD - keep as featured content for now
  const powrWOD = useMemo(() => ({
    id: '100-pushups-challenge',
    title: '100 Pushups Challenge',
    description: 'Complete 100 push-ups in as few sets as possible. Great for building upper body endurance and strength.',
    exercises: [
      { name: 'Push-ups', sets: 1, reps: 100, weight: 0 }
    ],
    estimatedDuration: 20,
    difficulty: 'intermediate' as const,
    tags: ['strength', 'upper-body', 'bodyweight', 'challenge'],
    author: {
      pubkey: '55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21',
      name: 'POWR Coach',
      picture: '/assets/logos/powr-logo.svg'
    },
    eventId: '100-pushups-challenge-event-id',
    eventTags: [
      ['d', '100-pushups-challenge'],
      ['title', '100 Pushups Challenge'],
      ['difficulty', 'intermediate'],
      ['duration', '20'],
      ['t', 'fitness']
    ],
    eventContent: JSON.stringify({
      description: 'Complete 100 push-ups in as few sets as possible. Great for building upper body endurance and strength.',
      exercises: [
        { name: 'Push-ups', sets: 1, reps: 100 }
      ]
    }),
    eventKind: 33402
  }), []);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleWorkoutSelect = (workoutId: string) => {
    // Reset machine to idle state before starting new selection
    // This prevents multiple machines from running simultaneously
    if (!workoutState.matches('idle')) {
      console.log('🔄 Machine not idle, resetting before new workout selection');
      workoutSend({ type: 'RESET_LIFECYCLE' });
      return; // Exit early, user can click again after reset
    }


    // ✅ SIMPLIFIED: Use template reference directly from data structures
    let templateReference: string | undefined;

    // Check if it's the POWR WOD
    if (workoutId === powrWOD.id) {
      templateReference = `33402:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:100-pushups-challenge`;
      console.log('🔍 Using POWR WOD template reference:', templateReference);
    } else {
      // Check social workouts first (now template-focused)
      const socialWorkout = socialWorkouts.find(w => w.id === workoutId);
      if (socialWorkout) {
        templateReference = socialWorkout.templateReference;
        console.log('🔍 ✅ Found template reference from social workout:', templateReference);
        console.log('🔍 Social proof: Tried by', socialWorkout.socialProof.triedBy);
      } else {
        // Check discovery templates
        const discoveryWorkout = discoveryTemplates.find(w => w.id === workoutId || w.eventId === workoutId);
        if (discoveryWorkout) {
          templateReference = discoveryWorkout.templateRef;
          console.log('🔍 Found template reference from discovery:', templateReference);
        } else {
          // Fallback: extract from rawEventData (for backwards compatibility)
          const eventData = rawEventData.get(workoutId);
          const templateReference_extracted = eventData?.templateReference as string;
          
          if (templateReference_extracted) {
            templateReference = templateReference_extracted;
            console.log('🔍 ⚠️ Using fallback template reference from rawEventData:', templateReference);
          }
        }
      }
    }

    // Validate template reference format
    if (!templateReference) {
      console.error('❌ No template reference found for workout:', workoutId);
      setModalError('Cannot start workout: No template reference found');
      return;
    }

    const templateParts = templateReference.split(':');
    if (templateParts.length !== 3) {
      console.error('❌ Invalid template reference format:', templateReference);
      setModalError('Cannot start workout: Invalid template reference format');
      return;
    }

    console.log('🚀 Starting workout lifecycle machine with template reference:', templateReference);
    
    // Start the workout lifecycle machine with the correct template reference
    workoutSend({ 
      type: 'START_SETUP',
      templateReference: templateReference
    });
    
    // DON'T open modal yet - wait for setup machine to resolve template data
    // Modal will open when machine reaches 'setupComplete' state with resolved data
  };

  const handleCloseModal = () => {
    setModalError(undefined);
    
    // ✅ FIXED: Only reset machine if we're in setup states, not active workout
    if (workoutState.matches('setupComplete')) {
      console.log('🔄 Canceling setup - returning machine to idle state');
      workoutSend({ type: 'CANCEL_SETUP' });
    } else if (workoutState.matches('setup')) {
      console.log('🔄 Canceling setup in progress - returning machine to idle state');
      workoutSend({ type: 'CANCEL_SETUP' });
    }
    // ✅ CRITICAL: Do NOT reset machine when workout is active
    // The modal should close but the workout should continue running in background
    // This enables the mini playbar functionality
  };

  const handleStartWorkout = () => {
    console.log('🚀 Starting workout from modal!');
    
    // ✅ FIXED: Use the machine's resolved workout data instead of reconstructing
    if (workoutState.context.workoutData) {
      console.log('✅ Using resolved workout data from machine:', workoutState.context.workoutData);
      
      workoutSend({ 
        type: 'START_WORKOUT',
        workoutData: workoutState.context.workoutData // Use machine's resolved data
      });
    } else {
      console.error('❌ No workout data available in machine context');
      console.log('🔍 Machine context:', workoutState.context);
      
      // Fallback to basic workout data if machine data is missing (shouldn't happen)
      console.warn('⚠️ Falling back to basic workout data');
      workoutSend({ 
        type: 'START_WORKOUT',
        workoutData: {
          workoutId: `workout_${Date.now()}`,
          title: 'Workout',
          exercises: [],
          completedSets: [],
          workoutType: 'strength',
          startTime: Date.now()
        }
      });
    }
    
    // ✅ FIXED: DON'T close modal - let the machine state change handle the UI
    // The useEffect that watches workoutState will handle opening/closing the modal
    console.log('🚀 START_WORKOUT event sent to machine');
  };

  // Summary modal handlers
  const handleShareWorkout = (content: string) => {
    console.log('📱 Sharing workout to Nostr:', content);
    workoutSend({ 
      type: 'SHARE_WORKOUT',
      content: content
    });
  };

  const handleSkipSharing = () => {
    console.log('⏭️ Skipping workout sharing');
    workoutSend({ type: 'SKIP_SHARING' });
  };

  const handleCloseSummary = () => {
    console.log('❌ Closing workout summary');
    workoutSend({ type: 'CLOSE_SUMMARY' });
  };


  const handleMenuAction = (action: string, workoutId: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 Menu action:', action, 'for workout:', workoutId);
    }
    
    switch (action) {
      case 'details':
        handleWorkoutSelect(workoutId);
        break;
      case 'library':
        console.log('Add to library:', workoutId);
        // TODO: Add to user's library
        break;
      case 'copy':
        // Copy template reference or event data to clipboard
        const socialWorkout = socialWorkouts.find(w => w.id === workoutId);
        const discoveryWorkout = discoveryTemplates.find(w => w.id === workoutId);
        
        let copyText = '';
        if (socialWorkout) {
          copyText = socialWorkout.templateReference;
        } else if (discoveryWorkout?.templateRef) {
          copyText = discoveryWorkout.templateRef;
        } else {
          const eventData = rawEventData.get(workoutId);
          copyText = (eventData?.naddr || eventData?.nevent || workoutId) as string;
        }
        
        navigator.clipboard.writeText(copyText);
        console.log('Copied to clipboard:', copyText);
        break;
      case 'share':
        console.log('Share workout:', workoutId);
        // TODO: Open share dialog
        break;
      default:
        console.warn('Unknown menu action:', action);
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Bar */}
      <CalendarBar
        selectedDate={selectedDate}
        workoutIndicators={workoutIndicators}
        onDateSelect={handleDateSelect}
      />

      {/* POWR WOD Hero Card */}
      <section>
        <WorkoutCard
          variant="hero"
          workout={powrWOD}
          onSelect={handleWorkoutSelect}
          showImage={true}
          showAuthor={false}
          showStats={true}
        />
      </section>

      {/* Loading State - Only show during initial load, not during "load more" */}
      {isLoading && !isLoadingMore && socialWorkouts.length === 0 && discoveryTemplates.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading workout data from Nostr...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-destructive/10 rounded border border-destructive/20">
          <h3 className="font-medium mb-2 text-destructive">⚠️ Error Loading Data</h3>
          <p className="text-sm text-destructive/80">{error}</p>
          <p className="text-xs text-destructive/60 mt-2">
            Check console for details. Ensure NDK is initialized and connected.
          </p>
        </div>
      )}

      {/* ✅ UPDATED: Social Feed Section - Now Template-Focused */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Workouts your friends are trying</h2>
          {hasMoreWorkouts && (
            <button 
              onClick={loadMoreSocialWorkouts}
              disabled={isLoadingMore}
              className="text-sm text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {isLoadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                  Loading...
                </>
              ) : (
                'Load more'
              )}
            </button>
          )}
        </div>
        
        {!isLoading && socialWorkouts.length === 0 ? (
          <div className="p-6 text-center bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">No workout templates from your network yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              When your friends complete workouts, their templates will appear here.
            </p>
          </div>
        ) : (
          <>
            <ScrollableGallery>
              {socialWorkouts.map((workout) => (
                <div key={workout.id} className="w-80 flex-shrink-0">
                  <WorkoutCard
                    variant="social"
                    workout={{
                      // Map social workout to expected format
                      id: workout.id,
                      title: workout.title, // Template name
                      description: workout.description,
                      exercises: workout.exercises, // Template exercises
                      estimatedDuration: workout.estimatedDuration,
                      difficulty: workout.difficulty as 'beginner' | 'intermediate' | 'advanced' | undefined,
                      author: {
                        pubkey: workout.author.pubkey, // Template author
                        name: workout.author.name || (workout.author.pubkey ? workout.author.pubkey.slice(0, 8) + '...' : 'Unknown User'),
                        picture: workout.author.picture || '/assets/workout-template-fallback.jpg'
                      },
                      // Add social proof info with triedByPubkey for profile fetching
                      socialProof: {
                        triedBy: workout.socialProof.triedBy,
                        triedByPubkey: workout.socialProof.triedByPubkey, // This is the key field that was missing!
                        completedAt: workout.socialProof.completedAt
                      },
                      eventId: workout.eventId,
                      // Add required Nostr event fields for WorkoutCard (use fallback values since SocialWorkout doesn't have these)
                      eventTags: [['t', 'fitness']],
                      eventContent: JSON.stringify({ description: workout.description }),
                      eventKind: 33402
                    }}
                    onSelect={handleWorkoutSelect}
                    showImage={true}
                    showAuthor={true}
                    showStats={true}
                  />
                </div>
              ))}
            </ScrollableGallery>

            {/* ✨ NEW: Show skeleton cards while loading more - OUTSIDE ScrollableGallery */}
            {isLoadingMore && hasMoreWorkouts && (
              <div className="mt-4">
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {[1, 2, 3].map((index) => (
                    <div key={`skeleton-${index}`} className="w-80 flex-shrink-0">
                      <WorkoutCardSkeleton variant="social" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </>
        )}
      </section>

      {/* Discovery Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Find workout</h2>
          {hasMoreTemplates && (
            <button 
              onClick={loadMoreDiscoveryTemplates}
              disabled={isLoadingMore}
              className="text-sm text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {isLoadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                  Loading...
                </>
              ) : (
                'Load more'
              )}
            </button>
          )}
        </div>
        
        <SearchableWorkoutDiscovery
          workouts={discoveryTemplates.map(workout => ({
            ...workout,
            difficulty: workout.difficulty || 'intermediate' as const,
            author: {
              ...workout.author,
              name: workout.author.name || workout.author.pubkey.slice(0, 8) + '...'
            }
          }))}
          onWorkoutSelect={handleWorkoutSelect}
          onMenuAction={handleMenuAction}
          isLoading={isLoading && discoveryTemplates.length === 0}  // ← Only show loading when no templates loaded yet
        />
        
      </section>

      {/* Workout Detail Modal */}
      <WorkoutDetailModal
        isOpen={workoutState.matches('setup') || workoutState.matches('setupComplete')}
        isLoading={workoutState.matches('setup')}
        templateData={{
          // ✅ IMPROVED UX: Better loading states with immediate feedback
          title: (workoutState.context.resolvedTemplate as { name?: string })?.name || 
                 (workoutState.context.workoutData as { title?: string })?.title || 
                 (workoutState.matches('setup') ? 'Loading workout...' : 'Untitled Workout'),
          description: (workoutState.context.resolvedTemplate as { description?: string })?.description || 
                       (workoutState.matches('setup') ? 'Resolving workout details from Nostr network...' : 'Loading workout description...'),
          content: (workoutState.context.resolvedTemplate as { description?: string })?.description || 
                   (workoutState.matches('setup') ? 'Resolving workout details from Nostr network...' : 'Loading workout description...'),
          
          // ✅ CRITICAL FIX: Pass resolved data directly from machine context with proper type handling
          resolvedTemplate: workoutState.context.resolvedTemplate ? {
            name: (workoutState.context.resolvedTemplate as { name?: string })?.name || 'Loading...',
            description: (workoutState.context.resolvedTemplate as { description?: string })?.description || 'Loading workout details...',
            exercises: (workoutState.context.resolvedTemplate as { exercises?: Array<{ exerciseRef: string; sets?: number; reps?: number; weight?: number }> })?.exercises || []
          } : undefined,
          resolvedExercises: workoutState.context.resolvedExercises as Array<{
            id: string;
            name: string;
            equipment: string;
            description: string;
            muscleGroups: string[];
          }> | undefined,
          
          // Also pass as loadedTemplate/loadedExercises for backward compatibility
          loadedTemplate: workoutState.context.resolvedTemplate ? {
            name: (workoutState.context.resolvedTemplate as { name?: string })?.name || 'Loading...',
            description: (workoutState.context.resolvedTemplate as { description?: string })?.description || 'Loading workout details...',
            exercises: (workoutState.context.resolvedTemplate as { exercises?: Array<{ exerciseRef: string; sets?: number; reps?: number; weight?: number }> })?.exercises || []
          } : undefined,
          loadedExercises: workoutState.context.resolvedExercises as Array<{
            id: string;
            name: string;
            equipment: string;
            description: string;
            muscleGroups: string[];
          }> | undefined,
          
          // ✅ DEBUG: Add debug logging to see what's actually in the context
          ...(process.env.NODE_ENV === 'development' && {
            _debugContext: workoutState.context,
            _debugTemplateSelection: workoutState.context.templateSelection,
            _debugResolvedTemplate: workoutState.context.resolvedTemplate,
            _debugResolvedExercises: workoutState.context.resolvedExercises
          }),
          
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
    </div>
  );
}
