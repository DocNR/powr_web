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

export function AppLayout() {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const { activeTab, setActiveTab } = useNavigation();
  const { getActiveSubTab, setActiveSubTab } = useSubNavigation();
  
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
            <WorkoutContext.Provider >
              <WorkoutDataProvider>
                <WorkoutUIProvider>
                  <TabRouter />
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
