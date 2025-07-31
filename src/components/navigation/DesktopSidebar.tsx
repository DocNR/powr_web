'use client';

import React from 'react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';

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
  // New props for subtab support
  subNavItems?: Array<{
    id: string;
    label: string;
  }>;
  activeSubTab?: string;
  onSubTabChange?: (subTabId: string) => void;
}

export function DesktopSidebar({ 
  activeTab, 
  onTabChange, 
  tabs, 
  subNavItems, 
  activeSubTab, 
  onSubTabChange 
}: DesktopSidebarProps) {
  return (
    <div className="fixed left-0 top-0 z-40 h-full w-64 bg-background border-r border-border">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-2 p-6 border-b border-border">
          <Logo width={32} height={32} className="rounded-md" />
          <span className="text-xl font-semibold">POWR</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const hasSubTabs = isActive && subNavItems && subNavItems.length > 0;
            
            return (
              <div key={tab.id}>
                <Button
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
                        <div className="absolute -top-2 -right-2 h-4 w-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                          {tab.badge > 99 ? '99+' : tab.badge}
                        </div>
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

                {/* Sub-navigation for active tab */}
                {hasSubTabs && (
                  <div className="ml-4 mt-1 space-y-1">
                    {subNavItems.map((subTab) => {
                      const isSubActive = activeSubTab === subTab.id;
                      
                      return (
                        <Button
                          key={subTab.id}
                          variant={isSubActive ? "secondary" : "ghost"}
                          size="sm"
                          className={cn(
                            "w-full justify-start h-8 px-3 text-xs",
                            "transition-colors duration-200",
                            isSubActive
                              ? "bg-secondary text-secondary-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          )}
                          onClick={() => onSubTabChange?.(subTab.id)}
                        >
                          <span className={cn(
                            "transition-all duration-200",
                            isSubActive ? "font-medium" : "font-normal"
                          )}>
                            {subTab.label}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
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
