'use client';

import React from 'react';
import { useNavigation } from '@/providers/NavigationProvider';
import { HomeTab } from '@/components/tabs/HomeTab';
import { WorkoutsTab } from '@/components/tabs/WorkoutsTab';
import { ActiveTab } from '@/components/tabs/ActiveTab';
import { ProgressTab } from '@/components/tabs/ProgressTab';
import { ProfileTab } from '@/components/tabs/ProfileTab';

export function TabRouter() {
  const { activeTab } = useNavigation();

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
      default:
        return <HomeTab />;
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto p-4 pb-20 md:pb-4">
        {renderTab()}
      </div>
    </div>
  );
}
