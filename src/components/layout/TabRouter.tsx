'use client';

import React, { useEffect, useRef } from 'react';
import { useNavigation } from '@/providers/NavigationProvider';
import HomeTab from '@/components/tabs/HomeTab';
import { LibraryTab } from '@/components/tabs/LibraryTab';
import ActiveTab from '@/components/tabs/ActiveTab';
import { SocialTab } from '@/components/tabs/SocialTab';
import { LogTab } from '@/components/tabs/LogTab';
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
      case 'library':
        return <LibraryTab />;
      case 'workout':
        return <ActiveTab />;
      case 'social':
        return <SocialTab />;
      case 'log':
        return <LogTab />;
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
