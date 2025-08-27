'use client';

import React from 'react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { cn } from '@/lib/utils';
import { usePWA } from '@/hooks/usePWA';

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
  const { isIOSPWA } = usePWA();

  return (
    <div className="fixed left-0 right-0 bottom-0 z-50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 border-t border-border">
      <div 
        className="flex items-center justify-around px-2"
        style={{ 
          paddingTop: '0.5rem', // 8px - standard iOS top padding
          paddingBottom: isIOSPWA 
            ? `calc(0.5rem + env(safe-area-inset-bottom, 0px) + 1.25rem)` // 8px + safe area + 20px extra for PWA home indicator
            : `calc(0.5rem + env(safe-area-inset-bottom, 0px))`, // 8px + safe area - standard iOS bottom padding
          height: isIOSPWA
            ? 'calc(49px + env(safe-area-inset-bottom, 0px) + 1.25rem)' // Standard iOS tab bar height + extra for PWA home indicator
            : 'calc(49px + env(safe-area-inset-bottom, 0px))' // Standard iOS tab bar height: 49px + safe area
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
                "flex flex-col items-center justify-center h-10 w-16 p-1 relative flex-shrink-0", // Reduced height to h-10 for standard iOS tabs, smaller padding
                "transition-all duration-200 ease-out will-change-auto",
                "min-h-[44px] min-w-[44px]", // Standard minimum touch targets
                "touch-manipulation", // Optimize for touch on mobile
                "select-none", // Prevent text selection on buttons
                "gap-0.5", // Smaller gap between icon and text for compact layout
                isActive 
                  ? "text-primary" // Color-only highlighting - no background
                  : "text-muted-foreground hover:text-primary" // Simple color transitions
              )}
              onClick={() => onTabChange(tab.id)}
              aria-label={tab.label}
            >
              <div className="relative">
                <Icon className={cn(
                  "h-4 w-4 transition-all duration-150 ease-out will-change-auto", // Smaller icons for compact iOS-style tabs
                  isActive && "scale-105" // Subtle scale for active state
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
              
              {/* Text Label */}
              <span className={cn(
                "text-[10px] font-medium transition-all duration-150 ease-out will-change-auto leading-tight", // Even smaller text for compact layout
                isActive && "font-semibold" // Slightly bolder when active
              )}>
                {tab.label}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
