'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
      <div className="flex items-center justify-around px-2 safe-area-pb" style={{ paddingTop: '0.25rem', paddingBottom: `calc(0.25rem + env(safe-area-inset-bottom, 0px))` }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              className={cn(
                "flex items-center justify-center h-12 w-12 p-2 relative rounded-full",
                "transition-colors duration-150 ease-out will-change-auto",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              onClick={() => onTabChange(tab.id)}
              aria-label={tab.label}
            >
              <div className="relative">
                <Icon className={cn(
                  "h-5 w-5 transition-all duration-150 ease-out will-change-auto",
                  isActive && "scale-110"
                )} />
                
                {/* Badge */}
                {tab.badge && tab.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center"
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </Badge>
                )}
                
                {/* Notification Dot */}
                {tab.notificationDot && (
                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full" />
                )}
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
