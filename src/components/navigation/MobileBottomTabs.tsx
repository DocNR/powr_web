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
                "flex flex-col items-center justify-center h-9 w-14 p-1 relative",
                "transition-all duration-150 ease-out",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => onTabChange(tab.id)}
            >
              <div className="relative mb-0.5">
                <Icon className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isActive && "scale-110"
                )} />
                
                {/* Badge */}
                {tab.badge && tab.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1.5 -right-1.5 h-3 w-3 p-0 text-xs flex items-center justify-center"
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </Badge>
                )}
                
                {/* Notification Dot */}
                {tab.notificationDot && (
                  <div className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 bg-destructive rounded-full" />
                )}
              </div>
              
              <span className={cn(
                "text-xs leading-none transition-all duration-200",
                isActive ? "font-medium" : "font-normal"
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
