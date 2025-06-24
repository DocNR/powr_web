'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Dumbbell } from 'lucide-react';

interface DesktopSidebarProps {
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

export function DesktopSidebar({ activeTab, onTabChange, tabs }: DesktopSidebarProps) {
  return (
    <div className="fixed left-0 top-0 z-40 h-full w-64 bg-background border-r border-border">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-2 p-6 border-b border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Dumbbell className="size-5" />
          </div>
          <span className="text-xl font-semibold">POWR</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <Button
                key={tab.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-12 px-4",
                  "transition-colors duration-200",
                  isActive 
                    ? "bg-secondary text-secondary-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                onClick={() => onTabChange(tab.id)}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="relative">
                    <Icon className={cn(
                      "h-5 w-5 transition-transform duration-200",
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
                  
                  <span className={cn(
                    "text-sm transition-all duration-200",
                    isActive ? "font-medium" : "font-normal"
                  )}>
                    {tab.label}
                  </span>
                </div>
              </Button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            POWR Workout PWA
          </div>
        </div>
      </div>
    </div>
  );
}
