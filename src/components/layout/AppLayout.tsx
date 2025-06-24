'use client';

import React from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MobileBottomTabs } from '@/components/navigation/MobileBottomTabs';
import { DesktopSidebar } from '@/components/navigation/DesktopSidebar';
import { TabRouter } from '@/components/layout/TabRouter';
import { Header } from '@/components/dashboard/header';
import { navigationTabs } from '@/config/navigation';
import { useNavigation } from '@/providers/NavigationProvider';

export function AppLayout() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { activeTab, setActiveTab } = useNavigation();

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
      <div className={`flex-1 flex flex-col ${!isMobile ? 'ml-64' : ''}`}>
        {/* Header - only show on mobile since desktop has sidebar */}
        {isMobile && (
          <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 border-b border-border">
            <Header />
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          <TabRouter />
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
