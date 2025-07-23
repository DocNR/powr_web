'use client';

import React from 'react';
import { BookOpen, BarChart3, Calendar } from 'lucide-react';

export function LogTab() {
  return (
    <>
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <BookOpen className="h-8 w-8 text-[color:var(--workout-primary)]" />
          <h1 className="text-3xl font-bold tracking-tight">Workout Log</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Track your fitness journey with decentralized data
        </p>
      </div>

      {/* Main Coming Soon Message */}
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center space-y-6">
        <div className="relative">
          <BarChart3 className="h-24 w-24 text-muted-foreground/20" />
          <Calendar className="h-8 w-8 text-[color:var(--workout-success)] absolute -top-2 -right-2" />
        </div>
        
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">Workout History Coming Soon™</h2>
          <p className="text-muted-foreground max-w-md">
            Your workout history will be stored as Nostr events, giving you complete ownership and control over your fitness data.
          </p>
        </div>

        {/* Feature Preview */}
        <div className="grid gap-4 text-sm max-w-lg mt-8">
          <div className="flex items-start gap-3 text-left">
            <div className="w-2 h-2 rounded-full bg-[color:var(--workout-success)] mt-2 flex-shrink-0" />
            <p className="text-muted-foreground">
              View complete workout history with performance analytics
            </p>
          </div>
          <div className="flex items-start gap-3 text-left">
            <div className="w-2 h-2 rounded-full bg-[color:var(--workout-success)] mt-2 flex-shrink-0" />
            <p className="text-muted-foreground">
              Track progress across exercises with strength gains visualization
            </p>
          </div>
          <div className="flex items-start gap-3 text-left">
            <div className="w-2 h-2 rounded-full bg-[color:var(--workout-success)] mt-2 flex-shrink-0" />
            <p className="text-muted-foreground">
              Export your data anytime - it's yours, stored on the Nostr network
            </p>
          </div>
          <div className="flex items-start gap-3 text-left">
            <div className="w-2 h-2 rounded-full bg-[color:var(--workout-success)] mt-2 flex-shrink-0" />
            <p className="text-muted-foreground">
              Calendar view to see workout patterns and consistency streaks
            </p>
          </div>
        </div>
      </div>
    </>
  );
}