'use client';

import React, { lazy, Suspense } from 'react';
import { useNavigation } from '@/providers/NavigationProvider';
import HomeTab from '@/components/tabs/HomeTab';
import { LibraryTab } from '@/components/tabs/LibraryTab';
import WorkoutsTab from '@/components/tabs/WorkoutsTab';
import { SocialTab } from '@/components/tabs/SocialTab';
import { LogTab } from '@/components/tabs/LogTab';

// Conditionally import TestTab only in development
const TestTab = process.env.NODE_ENV !== 'production' 
  ? lazy(() => import('@/components/tabs/TestTab'))
  : null;

export function TabRouter() {
  const { activeTab } = useNavigation();

  const renderTab = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab />;
      case 'library':
        return <LibraryTab />;
      case 'workout':
        return <WorkoutsTab />;
      case 'social':
        return <SocialTab />;
      case 'log':
        return <LogTab />;
      case 'test':
        // Only render TestTab in development
        return process.env.NODE_ENV !== 'production' && TestTab ? (
          <Suspense fallback={<div>Loading...</div>}>
            <TestTab />
          </Suspense>
        ) : <HomeTab />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto p-6 pb-20 md:pb-6 space-y-6">
        {renderTab()}
      </div>
    </div>
  );
}
