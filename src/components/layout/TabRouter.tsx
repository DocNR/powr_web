'use client';

import React, { useEffect, useRef } from 'react';
import { useNavigation } from '@/providers/NavigationProvider';
import { HomeTab } from '@/components/tabs/HomeTab';
import { WorkoutsTab } from '@/components/tabs/WorkoutsTab';
import { ActiveTab } from '@/components/tabs/ActiveTab';
import { ProgressTab } from '@/components/tabs/ProgressTab';
import { ProfileTab } from '@/components/tabs/ProfileTab';
import { TestTab } from '@/components/tabs/TestTab';

export function TabRouter() {
  const { activeTab } = useNavigation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to top when tab changes
  useEffect(() => {
    // Small delay to ensure DOM has updated
    const timer = setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [activeTab]);

  const renderTab = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab />;
      case 'workouts':
        return <WorkoutsTab />;
      case 'active':
        return <ActiveTab />;
      case 'progress':
        return <ProgressTab />;
      case 'profile':
        return <ProfileTab />;
      case 'test':
        return <TestTab />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-auto">
      <div className="container mx-auto p-6 pb-20 md:pb-6 space-y-6">
        {renderTab()}
      </div>
    </div>
  );
}
