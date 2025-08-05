'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MobileBottomTabs } from '@/components/navigation/MobileBottomTabs';
import { DesktopSidebar } from '@/components/navigation/DesktopSidebar';
import { TabRouter } from '@/components/layout/TabRouter';
import { AppHeader } from '@/components/powr-ui/layout/AppHeader';
import { SubNavigation } from '@/components/powr-ui/layout/SubNavigation';
import { navigationTabs } from '@/config/navigation';
import { useNavigation } from '@/providers/NavigationProvider';
import { useSubNavigation } from '@/providers/SubNavigationProvider';
import { getSubNavigation } from '@/config/subNavigation';
import { WorkoutDataProvider } from '@/providers/WorkoutDataProvider';
import { WorkoutHistoryProvider } from '@/providers/WorkoutHistoryProvider';
import { WorkoutUIProvider } from '@/providers/WorkoutUIProvider';
import { LibraryDataProvider } from '@/providers/LibraryDataProvider';
import { WorkoutContext } from '@/contexts/WorkoutContext';
import { workoutLifecycleMachine } from '@/lib/machines/workout/workoutLifecycleMachine';
import { usePubkey, useIsAuthenticated } from '@/lib/auth/hooks';
import { WorkoutDetailModal } from '@/components/powr-ui/workout';

export function AppLayout() {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const { activeTab, setActiveTab } = useNavigation();
  const { getActiveSubTab, setActiveSubTab } = useSubNavigation();
  const mainScrollRef = useRef<HTMLElement>(null);

  // Reset scroll position when tab changes (mobile only)
  useEffect(() => {
    if (isMobile && mainScrollRef.current) {
      // Small delay to ensure DOM has updated
      const timer = setTimeout(() => {
        if (mainScrollRef.current) {
          mainScrollRef.current.scrollTop = 0;
        }
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [activeTab, isMobile]);
  
  // Authentication hooks
  const pubkey = usePubkey();
  const isAuthenticated = useIsAuthenticated();
  
  const subNavItems = getSubNavigation(activeTab);
  const activeSubTab = getActiveSubTab(activeTab);
  
  const handleSubTabChange = (subTabId: string) => {
    setActiveSubTab(activeTab, subTabId);
  };

  // Create userInfo for the workout machine
  const userInfo = useMemo(() => {
    if (!pubkey || !isAuthenticated) {
      return { 
        pubkey: '', 
        displayName: 'Unknown User' 
      };
    }
    
    return {
      pubkey,
      displayName: pubkey.slice(0, 8) + '...'
    };
  }, [pubkey, isAuthenticated]);

  // Calculate header heights for proper spacing
  const headerHeight = isMobile ? 48 : 64; // Reduced mobile header height from 64px to 48px
  const subNavHeight = 48; // SubNavigation height in pixels
  const totalFixedHeight = isMobile ? (
    headerHeight + (subNavItems ? subNavHeight : 0)
  ) : 0;

  // AppHeader with workout context integration
  const AppHeaderWithWorkoutContext = () => {
    const workoutState = WorkoutContext.useSelector(state => state);
    const workoutSend = WorkoutContext.useActorRef().send;

    const handleWorkoutSelect = (templateReference: string) => {
      // Reset machine to idle state before starting new selection
      if (!workoutState.matches('idle')) {
        console.log('🔄 [AppHeader] Machine not idle, resetting before new workout selection');
        workoutSend({ type: 'RESET_LIFECYCLE' });
        return;
      }

      console.log('🚀 [AppHeader] Starting workout lifecycle with template:', templateReference);
      
      // Start the workout lifecycle machine
      workoutSend({ 
        type: 'START_SETUP',
        templateReference: templateReference
      });
    };

    return (
      <AppHeader 
        onWorkoutSelect={handleWorkoutSelect}
      />
    );
  };

  // Global Workout Modal - Handles search results and global workout selection
  const GlobalWorkoutModal = () => {
    const workoutState = WorkoutContext.useSelector(state => state);
    const workoutSend = WorkoutContext.useActorRef().send;

    console.log('🔍 [GlobalModal] Current state:', workoutState.value, 'matches setup:', workoutState.matches('setup'), 'matches setupComplete:', workoutState.matches('setupComplete'));

    const handleCloseModal = () => {
      // Only reset machine if we're in setup states, not active workout
      if (workoutState.matches('setupComplete')) {
        console.log('🔄 [Global] Canceling setup - returning machine to idle state');
        workoutSend({ type: 'CANCEL_SETUP' });
      } else if (workoutState.matches('setup')) {
        console.log('🔄 [Global] Canceling setup in progress - returning machine to idle state');
        workoutSend({ type: 'CANCEL_SETUP' });
      }
    };

    const handleStartWorkout = () => {
      console.log('🚀 [Global] Starting workout from modal!');
      
      if (workoutState.context.workoutData) {
        console.log('✅ [Global] Using resolved workout data from machine:', workoutState.context.workoutData);
        
        workoutSend({ 
          type: 'START_WORKOUT',
          workoutData: workoutState.context.workoutData
        });
      } else {
        console.error('❌ [Global] No workout data available in machine context');
        
        // Fallback to basic workout data
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
    };

    const isModalOpen = workoutState.matches('setup') || workoutState.matches('setupComplete');
    console.log('🔍 [GlobalModal] Should modal be open?', isModalOpen);

    return (
      <WorkoutDetailModal
        isOpen={isModalOpen}
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
          resolvedTemplate: workoutState.context.resolvedTemplate as {
            name: string;
            description: string;
            exercises: Array<{
              exerciseRef: string;
              sets?: number;
              reps?: number;
              weight?: number;
            }>;
          } | undefined,
          resolvedExercises: workoutState.context.resolvedExercises as Array<{
            id: string;
            name: string;
            equipment: string;
            description: string;
            muscleGroups: string[];
          }> | undefined,
          
          // Backward compatibility
          loadedTemplate: workoutState.context.resolvedTemplate as {
            name: string;
            description: string;
            exercises: Array<{
              exerciseRef: string;
              sets?: number;
              reps?: number;
              weight?: number;
            }>;
          } | undefined,
          loadedExercises: workoutState.context.resolvedExercises as Array<{
            id: string;
            name: string;
            equipment: string;
            description: string;
            muscleGroups: string[];
          }> | undefined,
          
          // Additional metadata
          tags: [['t', 'fitness']],
          eventKind: 33402,
          templateRef: workoutState.context.templateSelection?.templateReference
        }}
        onClose={handleCloseModal}
        onStartWorkout={handleStartWorkout}
      />
    );
  };

  return (
    <WorkoutContext.Provider 
      logic={workoutLifecycleMachine}
      options={{ input: { userInfo } }}
    >
      <div className="min-h-screen bg-background flex">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <DesktopSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={navigationTabs}
            subNavItems={subNavItems}
            activeSubTab={activeSubTab}
            onSubTabChange={handleSubTabChange}
          />
        )}

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col overflow-x-hidden max-w-full ${!isMobile ? 'ml-64' : ''}`}>
          {/* Header - show on both mobile and desktop */}
          <div className={`${isMobile ? 'fixed top-0 left-0 right-0 z-40' : 'sticky top-0 z-40'} bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 border-b border-border`}>
            <AppHeaderWithWorkoutContext />
          </div>

          {/* Conditional Sub-Navigation - Fixed header for tabs that need it */}
          {isMobile && subNavItems && (
            <div className="fixed top-12 left-0 right-0 z-30 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 border-b border-border">
              <SubNavigation
                items={subNavItems}
                activeItem={activeSubTab || subNavItems[0]?.id || ''}
                onItemChange={handleSubTabChange}
              />
            </div>
          )}

          {/* Main Content - Scrollable Container */}
          <main 
            ref={mainScrollRef}
            className={`flex-1 flex flex-col ${isMobile ? 'overflow-y-auto overscroll-y-contain' : ''}`}
            style={isMobile ? { 
              paddingTop: `${totalFixedHeight}px`,
              height: '100vh',
              maxHeight: '100vh'
            } : {}}
          >
            <div className="flex-1">
              <LibraryDataProvider>
                <WorkoutDataProvider>
                  <WorkoutHistoryProvider>
                    <WorkoutUIProvider>
                      <TabRouter />
                    </WorkoutUIProvider>
                  </WorkoutHistoryProvider>
                </WorkoutDataProvider>
              </LibraryDataProvider>
            </div>
          </main>

          {/* Mobile Bottom Navigation */}
          {isMobile && (
            <MobileBottomTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabs={navigationTabs}
            />
          )}
        </div>

        {/* Global Workout Detail Modal - Handles search results */}
        <GlobalWorkoutModal />
      </div>
    </WorkoutContext.Provider>
  );
}
