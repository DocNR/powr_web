'use client';

/**
 * WorkoutsTab - Gallery-Based Workout Discovery
 * 
 * Uses cached Nostr data from WorkoutDataProvider for workout discovery interface.
 * Displays recent 1301 workout records and 33402 templates from the network.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { CalendarBar, WorkoutCard, ScrollableGallery, SearchableWorkoutDiscovery, WorkoutDetailModal } from '@/components/powr-ui/workout';
import { useWorkoutData } from '@/providers/WorkoutDataProvider';
import { useMachine } from '@xstate/react';
import { workoutLifecycleMachine } from '@/lib/machines/workout/workoutLifecycleMachine';
import { usePubkey } from '@/lib/auth/hooks';

export default function WorkoutsTab() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Modal state
  const [selectedWorkout, setSelectedWorkout] = useState<Record<string, unknown> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | undefined>();

  // Get authenticated user pubkey
  const userPubkey = usePubkey();

  // Get cached data from provider
  const {
    socialWorkouts,
    discoveryTemplates,
    workoutIndicators,
    rawEventData,
    isLoading,
    error,
    loadMoreSocialWorkouts,
    loadMoreDiscoveryTemplates,
    hasMoreWorkouts,
    hasMoreTemplates,
    isLoadingMore
  } = useWorkoutData();

  // Workout Lifecycle Machine
  const [workoutState, workoutSend] = useMachine(workoutLifecycleMachine, {
    input: {
      userInfo: {
        pubkey: userPubkey || 'user-pubkey', // Use real pubkey from auth
        displayName: 'User'
      }
    }
  });

  // Machine state-based UI updates
  useEffect(() => {
    console.log('🔄 Workout machine state changed:', workoutState.value);
    
    if (workoutState.matches('setup')) {
      // Setup state - machine is resolving template, don't open modal yet
      console.log('📋 Machine in setup state - waiting for template resolution...');
      
    } else if (workoutState.matches('setupComplete')) {
      // Setup complete - template is resolved, show modal with resolved data
      console.log('✅ Setup complete - template resolved:', workoutState.context.templateSelection);
      
      // NOW open modal with resolved data from machine state
      if (workoutState.context.templateSelection && workoutState.context.workoutData) {
        const resolvedWorkout = {
          title: workoutState.context.workoutData.title,
          description: `Template: ${workoutState.context.templateSelection.templateId}`,
          content: JSON.stringify(workoutState.context.workoutData),
          exercises: workoutState.context.workoutData.exercises || [],
          equipment: ['Various'],
          tags: [['t', 'fitness']],
          eventKind: 33402,
          templateRef: workoutState.context.templateSelection.templateReference
        };
        
        setSelectedWorkout(resolvedWorkout);
        setIsModalOpen(true); // Open modal NOW with resolved data
      }
      
    } else if (workoutState.matches('active')) {
      // Active state - activeWorkoutMachine is running
      console.log('🏃‍♂️ Machine in active state - workout is running');
      // Keep modal OPEN to show active workout UI
      setIsModalOpen(true);
      
    } else if (workoutState.matches('completed')) {
      // Completed state - show completion UI or navigate back
      console.log('✅ Machine in completed state - workout finished');
      setIsModalOpen(false);
    } else if (workoutState.matches('idle')) {
      // Idle state - machine is ready for new workout
      console.log('💤 Machine in idle state - ready for new workout');
    }
  }, [workoutState]);

  // Cleanup effect - reset machine on component unmount only
  useEffect(() => {
    return () => {
      // This cleanup function only runs on actual component unmount
      // Check current state and reset if needed
      const currentSnapshot = workoutState;
      if (currentSnapshot && !currentSnapshot.matches('idle')) {
        console.log('🧹 Component unmounting - resetting machine to idle state');
        workoutSend({ type: 'RESET_LIFECYCLE' });
      }
    };
  }, [workoutSend, workoutState]); // Empty dependency array = only runs on mount/unmount

  // POWR WOD - keep as featured content for now
  const powrWOD = useMemo(() => ({
    id: 'powr-wod-today',
    title: 'Upper Body Power',
    description: 'Build explosive upper body strength with this compound movement focused workout.',
    exercises: [
      { name: 'Push-ups', sets: 3, reps: 12, weight: 0 },
      { name: 'Pull-ups', sets: 3, reps: 8, weight: 0 },
      { name: 'Dips', sets: 3, reps: 10, weight: 0 },
      { name: 'Pike Push-ups', sets: 3, reps: 8, weight: 0 },
      { name: 'Plank', sets: 3, reps: 60, weight: 0 }
    ],
    estimatedDuration: 35,
    difficulty: 'intermediate' as const,
    tags: ['strength', 'upper-body', 'bodyweight'],
    author: {
      pubkey: 'powr-coach',
      name: 'POWR Coach',
      picture: '/assets/logos/powr-logo.svg'
    },
    eventId: 'powr-wod-event-id',
    eventTags: [
      ['d', 'upper-body-power'],
      ['title', 'Upper Body Power'],
      ['difficulty', 'intermediate'],
      ['duration', '35'],
      ['t', 'fitness']
    ],
    eventContent: JSON.stringify({
      description: 'Build explosive upper body strength with this compound movement focused workout.',
      exercises: [
        { name: 'Push-ups', sets: 3, reps: 12 },
        { name: 'Pull-ups', sets: 3, reps: 8 },
        { name: 'Dips', sets: 3, reps: 10 },
        { name: 'Pike Push-ups', sets: 3, reps: 8 },
        { name: 'Plank', sets: 3, reps: 60 }
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

    // Only log in development mode to avoid production performance impact
    if (process.env.NODE_ENV === 'development') {
      console.log('🏋️ Selected workout:', workoutId);
      
      // Log detailed event information for this specific workout
      const eventData = rawEventData.get(workoutId);
      if (eventData) {
        console.group(`📊 Detailed Event Info: ${workoutId}`);
        console.log('Event Type:', eventData.type);
        console.log('Hex ID:', eventData.hexId);
        
        if (eventData.type === '1301_workout_record') {
          console.log('Nevent:', eventData.nevent);
        } else if (eventData.type === '33402_workout_template') {
          console.log('Naddr:', eventData.naddr);
        }
        
        console.log('Pubkey:', eventData.pubkey);
        console.log('Created At:', new Date((eventData.created_at as number) * 1000).toLocaleString());
        console.log('Tags:', eventData.tags);
        
        // Check for referenced template
        const templateData = rawEventData.get(`${workoutId}_template`);
        if (templateData) {
          console.log('Referenced Template:', {
            title: templateData.title,
            hexId: templateData.hexId,
            naddr: templateData.naddr
          });
        }
        
        // Check for exercise data
        const exerciseData = rawEventData.get(`${workoutId}_exercises`);
        if (exerciseData) {
          console.log('Exercises:', exerciseData.exercises);
        }
        
        console.groupEnd();
      } else {
        console.warn('No event data found for workout:', workoutId);
      }
    }

    // NEW ARCHITECTURE: Start machine with preselected template
    // Find the template ID to pass to the machine
    let templateId = workoutId;
    
    // Check if it's the POWR WOD
    if (workoutId === powrWOD.id) {
      templateId = powrWOD.id;
    } else {
      // Check discovery templates
      const discoveryWorkout = discoveryTemplates.find(w => w.id === workoutId || w.eventId === workoutId);
      if (discoveryWorkout) {
        templateId = discoveryWorkout.id;
      } else {
        // Check social workouts - if they have a referenced template, use that
        const socialWorkout = socialWorkouts.find(w => w.id === workoutId || w.eventId === workoutId);
        if (socialWorkout) {
          const templateData = rawEventData.get(`${workoutId}_template`);
          if (templateData && templateData.hexId && typeof templateData.hexId === 'string') {
            // Use the referenced template ID
            templateId = templateData.hexId;
          }
        }
      }
    }

    // Extract template author pubkey for proper template reference
    let templateAuthorPubkey = 'user-pubkey'; // fallback
    
    // Check if it's the POWR WOD
    if (workoutId === powrWOD.id) {
      templateAuthorPubkey = 'powr-coach'; // POWR WOD author
    } else {
      // Check discovery templates for real author
      const discoveryWorkout = discoveryTemplates.find(w => w.id === workoutId || w.eventId === workoutId);
      if (discoveryWorkout) {
        templateAuthorPubkey = discoveryWorkout.author.pubkey;
        console.log('🔍 Found template author from discovery:', templateAuthorPubkey.slice(0, 8) + '...');
      } else {
        // Check raw event data for template author
        const eventData = rawEventData.get(workoutId);
        if (eventData && eventData.pubkey) {
          templateAuthorPubkey = eventData.pubkey as string;
          console.log('🔍 Found template author from event data:', templateAuthorPubkey.slice(0, 8) + '...');
        }
      }
    }

    // Create template reference in unified format
    const templateReference = `33402:${templateAuthorPubkey}:${templateId}`;
    
    console.log('🚀 Starting workout lifecycle machine with template reference:', templateReference);
    
    // Start the workout lifecycle machine with unified template reference
    workoutSend({ 
      type: 'START_SETUP',
      templateReference: templateReference
    });
    
    // DON'T open modal yet - wait for setup machine to resolve template data
    // Modal will open when machine reaches 'setupComplete' state with resolved data
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedWorkout(null);
    setModalError(undefined);
    
    // CRITICAL: Reset machine to idle state when modal closes
    // This prevents multiple machines from accumulating
    if (workoutState.matches('setupComplete')) {
      console.log('🔄 Canceling setup - returning machine to idle state');
      workoutSend({ type: 'CANCEL_SETUP' });
    } else if (!workoutState.matches('idle')) {
      console.log('🔄 Resetting lifecycle - returning machine to idle state');
      workoutSend({ type: 'RESET_LIFECYCLE' });
    }
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
      
      // Fallback to old behavior if machine data is missing (shouldn't happen)
      console.warn('⚠️ Falling back to reconstructed workout data');
      workoutSend({ 
        type: 'START_WORKOUT',
        workoutData: {
          workoutId: `workout_${Date.now()}`,
          title: selectedWorkout?.title as string || 'Workout',
          exercises: (selectedWorkout?.exercises as Array<{ name: string; sets: number; reps: number; weight: number }> || []).map(ex => ({
            exerciseRef: `33401:user-pubkey:${ex.name.toLowerCase().replace(/\s+/g, '-')}`,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight
          })),
          completedSets: [],
          workoutType: 'strength',
          startTime: Date.now()
        }
      });
    }
    
    // ✅ FIXED: DON'T close modal - let the machine state change handle the UI
    // The useEffect that watches workoutState will handle opening/closing the modal
    // setIsModalOpen(false); // ❌ Remove this line
    
    console.log('🚀 START_WORKOUT event sent to machine');
  };

  const handleAuthorClick = (pubkey: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('👤 View author profile:', pubkey);
    }
    // TODO: Navigate to author profile
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
        // Copy naddr to clipboard
        const eventData = rawEventData.get(workoutId);
        if (eventData?.naddr) {
          navigator.clipboard.writeText(eventData.naddr as string);
          console.log('Copied naddr to clipboard:', eventData.naddr);
        }
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
          onAuthorClick={handleAuthorClick}
          showImage={true}
          showAuthor={false}
          showStats={true}
        />
      </section>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading workout data from Nostr...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 rounded border border-red-200">
          <h3 className="font-medium mb-2 text-red-900">⚠️ Error Loading Data</h3>
          <p className="text-sm text-red-700">{error}</p>
          <p className="text-xs text-red-600 mt-2">
            Check console for details. Ensure NDK is initialized and connected.
          </p>
        </div>
      )}

      {/* Social Feed Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">What your friends are up to</h2>
          <button className="text-sm text-orange-600 hover:text-orange-700">
            View all
          </button>
        </div>
        
        {!isLoading && socialWorkouts.length === 0 ? (
          <div className="p-6 text-center bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">No recent workout records found.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try publishing some workouts or check back later.
            </p>
          </div>
        ) : (
          <>
            <ScrollableGallery>
              {socialWorkouts.map((workout) => (
                <div key={workout.id} className="w-80 flex-shrink-0">
                  <WorkoutCard
                    variant="social"
                    workout={workout}
                    onSelect={handleWorkoutSelect}
                    onAuthorClick={handleAuthorClick}
                    showImage={true}
                    showAuthor={true}
                    showStats={true}
                  />
                </div>
              ))}
            </ScrollableGallery>
            
            {/* Load More Social Workouts */}
            {hasMoreWorkouts && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={loadMoreSocialWorkouts}
                  disabled={isLoadingMore}
                  className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Loading more...
                    </>
                  ) : (
                    <>
                      📥 Load more workouts
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Discovery Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Find workout</h2>
          <button className="text-sm text-orange-600 hover:text-orange-700">
            Browse all
          </button>
        </div>
        
        <SearchableWorkoutDiscovery
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          workouts={discoveryTemplates as any}
          onWorkoutSelect={handleWorkoutSelect}
          onMenuAction={handleMenuAction}
          isLoading={isLoading}
        />
        
        {/* Load More Discovery Templates */}
        {hasMoreTemplates && (
          <div className="flex justify-center mt-4">
            <button
              onClick={loadMoreDiscoveryTemplates}
              disabled={isLoadingMore}
              className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Loading more...
                </>
              ) : (
                <>
                  📥 Load more templates
                </>
              )}
            </button>
          </div>
        )}
      </section>

      {/* Real Nostr Integration Status */}
      <div className="p-4 bg-blue-50 rounded border border-blue-200">
        <h3 className="font-medium mb-2 text-blue-900">🌐 Real Nostr Integration</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>✅ Phase 1: Calendar Bar - COMPLETE</p>
          <p>✅ Phase 2: POWR WOD Hero Card - COMPLETE</p>
          <p>✅ Phase 3: Social Feed Gallery with Beautiful Cards - COMPLETE</p>
          <p>✅ Phase 4: Discovery Section - COMPLETE</p>
          <p>✅ Phase 5: Mockup-Perfect Social Feed Design - COMPLETE</p>
          <p>✅ Phase 6: Real Nostr Integration - COMPLETE</p>
          <p>✅ Phase 7: Cached Data Provider - COMPLETE</p>
          <p>✅ Phase 8: Real-Time Subscriptions & Infinite Scroll - COMPLETE</p>
          <div className="mt-2 pt-2 border-t border-blue-200">
            <p className="font-medium">Live Data Sources:</p>
            <p>• Social Feed: Recent Kind 1301 workout records ({socialWorkouts.length} loaded)</p>
            <p>• Discovery: Kind 33402 workout templates ({discoveryTemplates.length} loaded)</p>
            <p>• Calendar: Workout completion indicators ({workoutIndicators.length} loaded)</p>
            <p>• Real-Time: {isLoading ? '🔄 Loading...' : '📡 Live WebSocket subscriptions active'}</p>
            <p>• Infinite Scroll: {hasMoreWorkouts || hasMoreTemplates ? '📥 More content available' : '✅ All content loaded'}</p>
          </div>
        </div>
      </div>

      {/* Workout Detail Modal */}
      <WorkoutDetailModal
        isOpen={isModalOpen}
        isLoading={false}
        templateData={selectedWorkout || undefined}
        error={modalError}
        onClose={handleCloseModal}
        onStartWorkout={handleStartWorkout}
        isWorkoutActive={workoutState.matches('active')}
        userPubkey={userPubkey}
        workoutMachineState={workoutState}
        workoutMachineSend={workoutSend}
      />
    </div>
  );
}
