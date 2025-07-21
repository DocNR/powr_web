'use client';

import React from 'react';
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
import { WorkoutUIProvider } from '@/providers/WorkoutUIProvider';
import { WorkoutContext } from '@/contexts/WorkoutContext';
import { WorkoutMiniBar } from '@/components/powr-ui/workout/WorkoutMiniBar';
import { usePubkey } from '@/lib/auth/hooks';

// WorkoutMiniBarContainer - Shows mini bar when workout is active AND not on WorkoutsTab
function WorkoutMiniBarContainer() {
  // Hooks must be called at the top level
  const workoutState = WorkoutContext.useSelector((state) => state);
  const workoutSend = WorkoutContext.useActorRef().send;
  const { activeTab, setActiveTab } = useNavigation();

  // Real-time timer using React state that updates every second
  const [currentTime, setCurrentTime] = React.useState(Date.now());

  // Update timer every second when workout is active
  React.useEffect(() => {
    if (!workoutState?.matches('active')) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [workoutState?.matches('active')]);

  try {
    // Only show mini bar when workout is active AND minimized
    if (!workoutState?.matches('active') || !workoutState?.matches({ active: 'minimized' })) {
      return null;
    }

    // Don't show mini bar on WorkoutsTab - the full ActiveWorkoutInterface handles it there
    if (activeTab === 'workouts') {
      return null;
    }

    const workoutData = workoutState.context?.workoutData;
    const activeWorkoutActor = workoutState.context?.activeWorkoutActor;

    if (!workoutData) {
      return null;
    }

    // Get real elapsed time from active workout actor if available
    let elapsedTime = 0;
    let isPaused = false;
    
    if (activeWorkoutActor && typeof activeWorkoutActor === 'object' && 'getSnapshot' in activeWorkoutActor) {
      try {
        const activeWorkoutSnapshot = (activeWorkoutActor as { getSnapshot: () => { context: { timingInfo?: { startTime?: number; pauseTime?: number } }; matches: (state: string) => boolean } }).getSnapshot();
        const activeWorkoutContext = activeWorkoutSnapshot.context;
        
        // Get actual start time from active workout timing info
        const startTime = activeWorkoutContext?.timingInfo?.startTime || workoutState.context.lifecycleStartTime || Date.now();
        elapsedTime = currentTime - startTime;
        
        // Check if workout is paused
        isPaused = activeWorkoutSnapshot.matches && activeWorkoutSnapshot.matches('paused') || false;
        
        // If paused, calculate elapsed time up to pause point
        if (isPaused && activeWorkoutContext?.timingInfo?.pauseTime) {
          elapsedTime = activeWorkoutContext.timingInfo.pauseTime - startTime;
        }
      } catch (error) {
        console.warn('Could not get active workout state, using fallback:', error);
        // Fallback to lifecycle start time
        const startTime = workoutState.context.lifecycleStartTime || Date.now();
        elapsedTime = currentTime - startTime;
      }
    } else {
      // Fallback when no active workout actor
      const startTime = workoutState.context.lifecycleStartTime || Date.now();
      elapsedTime = currentTime - startTime;
    }

    const handleTogglePause = () => {
      try {
        if (activeWorkoutActor && typeof activeWorkoutActor === 'object' && 'send' in activeWorkoutActor) {
          // Send pause/resume to active workout actor
          const actorRef = activeWorkoutActor as { send: (event: { type: string }) => void };
          if (isPaused) {
            actorRef.send({ type: 'RESUME_WORKOUT' });
          } else {
            actorRef.send({ type: 'PAUSE_WORKOUT' });
          }
        } else {
          // Fallback to lifecycle machine
          if (isPaused) {
            workoutSend({ type: 'WORKOUT_RESUMED' });
          } else {
            workoutSend({ type: 'WORKOUT_PAUSED' });
          }
        }
      } catch (error) {
        console.error('Error toggling workout pause:', error);
      }
    };

    const handleExpand = () => {
      // Navigate to WorkoutsTab and the active workout will be automatically shown
      setActiveTab('workouts');
    };

    return (
      <WorkoutMiniBar
        workoutTitle={workoutData.title || 'Active Workout'}
        elapsedTime={elapsedTime}
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        onExpand={handleExpand}
      />
    );
  } catch (error) {
    console.error('Error in WorkoutMiniBarContainer:', error);
    return null; // Gracefully fail without crashing the app
  }
}

export function AppLayout() {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const { activeTab, setActiveTab } = useNavigation();
  const { getActiveSubTab, setActiveSubTab } = useSubNavigation();
  
  // Get user info for workout context
  const userPubkey = usePubkey();
  
  const subNavItems = getSubNavigation(activeTab);
  const activeSubTab = getActiveSubTab(activeTab);
  
  const handleSubTabChange = (subTabId: string) => {
    setActiveSubTab(activeTab, subTabId);
  };

  // Calculate header heights for proper spacing
  const headerHeight = 64; // AppHeader height in pixels
  const subNavHeight = 48; // SubNavigation height in pixels
  const totalFixedHeight = isMobile ? (
    headerHeight + (subNavItems ? subNavHeight : 0)
  ) : 0;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <DesktopSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={navigationTabs}
        />
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col overflow-x-hidden max-w-full ${!isMobile ? 'ml-64' : ''}`}>
        {/* Header - only show on mobile since desktop has sidebar */}
        {isMobile && (
          <div className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 border-b border-border">
            <AppHeader />
          </div>
        )}

        {/* Conditional Sub-Navigation - Fixed header for tabs that need it */}
        {isMobile && subNavItems && (
          <div className="fixed top-16 left-0 right-0 z-30 bg-background border-b border-border">
            <SubNavigation
              items={subNavItems}
              activeItem={activeSubTab || subNavItems[0]?.id || ''}
              onItemChange={handleSubTabChange}
            />
          </div>
        )}

        {/* Main Content - Scrollable Container */}
        <main 
          className={`flex-1 flex flex-col ${isMobile ? 'overflow-y-auto overscroll-y-contain' : ''}`}
          style={isMobile ? { 
            paddingTop: `${totalFixedHeight}px`,
            height: '100vh',
            maxHeight: '100vh'
          } : {}}
        >
          <div className="flex-1">
            <WorkoutContext.Provider 
              options={{
                input: {
                  userInfo: {
                    pubkey: userPubkey || '',
                    displayName: userPubkey ? userPubkey.slice(0, 8) + '...' : 'Unknown User'
                  }
                }
              }}
            >
              <WorkoutDataProvider>
                <WorkoutUIProvider>
                  <TabRouter />
                  <WorkoutMiniBarContainer />
                </WorkoutUIProvider>
              </WorkoutDataProvider>
            </WorkoutContext.Provider>
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
    </div>
  );
}
