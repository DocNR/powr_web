'use client';

import React from 'react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { cn } from '@/lib/utils';

interface MobileBottomTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    notificationDot?: boolean;
    href?: string;
  }>;
}

export function MobileBottomTabs({ activeTab, onTabChange, tabs }: MobileBottomTabsProps) {
  return (
    <div className="fixed left-0 right-0 bottom-0 z-50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 border-t border-border">
      <div 
        className="flex items-center justify-around px-2"
        style={{ 
          paddingTop: '0.75rem', // 12px - balanced top padding
          paddingBottom: `calc(1.5rem + env(safe-area-inset-bottom, 0px))`, // 24px + safe area - much more space from home indicator
          height: 'calc(72px + env(safe-area-inset-bottom, 0px))' // Increased to 72px + safe area for proper spacing
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              className={cn(
                "flex items-center justify-center h-12 w-12 p-2 relative rounded-full flex-shrink-0", // Reduced from h-14 w-14 to h-12 w-12
                "transition-all duration-200 ease-out will-change-auto",
                "min-h-[48px] min-w-[48px]", // Keep minimum touch targets for accessibility
                "touch-manipulation", // Optimize for touch on mobile
                "select-none", // Prevent text selection on buttons
                isActive 
                  ? "text-white bg-gradient-to-r from-orange-400 to-orange-500 shadow-md shadow-orange-400/20" // Softer orange (400-500 instead of 500-600) and lighter shadow
                  : "text-muted-foreground hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 active:bg-orange-100 dark:active:bg-orange-950/30" // Softer hover color too
              )}
              onClick={() => onTabChange(tab.id)}
              aria-label={tab.label}
            >
              <div className="relative">
                <Icon className={cn(
                  "h-6 w-6 transition-all duration-150 ease-out will-change-auto", // Larger icons
                  isActive && "scale-110"
                )} />
                
                {/* Badge */}
                {tab.badge && tab.badge > 0 && (
                  <div className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full font-medium">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </div>
                )}
                
                {/* Notification Dot */}
                {tab.notificationDot && (
                  <div className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-destructive rounded-full" />
                )}
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
