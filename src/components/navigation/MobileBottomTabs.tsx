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
          paddingTop: '0.75rem', // 12px - more breathing room at top
          paddingBottom: `calc(0.75rem + env(safe-area-inset-bottom, 0px))`, // 12px + safe area
          height: 'calc(64px + env(safe-area-inset-bottom, 0px))' // Ensure 64px + safe area total
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
                "flex items-center justify-center h-14 w-14 p-2 relative rounded-full flex-shrink-0",
                "transition-all duration-200 ease-out will-change-auto",
                "min-h-[48px] min-w-[48px]", // Even larger touch targets for gym use
                "touch-manipulation", // Optimize for touch on mobile
                "select-none", // Prevent text selection on buttons
                isActive 
                  ? "text-white bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25" 
                  : "text-muted-foreground hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 active:bg-orange-100 dark:active:bg-orange-950/30"
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