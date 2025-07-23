'use client';

import React from 'react';
import { Library, BookOpen, Sparkles } from 'lucide-react';

export function LibraryTab() {
  return (
    <>
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <Library className="h-8 w-8 text-[color:var(--workout-primary)]" />
          <h1 className="text-3xl font-bold tracking-tight">Exercise Library</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Discover exercises from the Nostr fitness community
        </p>
      </div>

      {/* Main Coming Soon Message */}
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center space-y-6">
        <div className="relative">
          <BookOpen className="h-24 w-24 text-muted-foreground/20" />
          <Sparkles className="h-8 w-8 text-[color:var(--workout-primary)] absolute -top-2 -right-2" />
        </div>
        
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">Exercise Library Coming Soon™</h2>
          <p className="text-muted-foreground max-w-md">
            We're building a decentralized exercise database where fitness enthusiasts can share and discover workouts through the Nostr protocol.
          </p>
        </div>

        {/* Feature Preview */}
        <div className="grid gap-4 text-sm max-w-lg mt-8">
          <div className="flex items-start gap-3 text-left">
            <div className="w-2 h-2 rounded-full bg-[color:var(--workout-primary)] mt-2 flex-shrink-0" />
            <p className="text-muted-foreground">
              Browse exercises by muscle group, difficulty, and equipment
            </p>
          </div>
          <div className="flex items-start gap-3 text-left">
            <div className="w-2 h-2 rounded-full bg-[color:var(--workout-primary)] mt-2 flex-shrink-0" />
            <p className="text-muted-foreground">
              Discover new movements shared by the fitness community
            </p>
          </div>
          <div className="flex items-start gap-3 text-left">
            <div className="w-2 h-2 rounded-full bg-[color:var(--workout-primary)] mt-2 flex-shrink-0" />
            <p className="text-muted-foreground">
              Create and publish your own exercise variations
            </p>
          </div>
          <div className="flex items-start gap-3 text-left">
            <div className="w-2 h-2 rounded-full bg-[color:var(--workout-primary)] mt-2 flex-shrink-0" />
            <p className="text-muted-foreground">
              Sync across devices without losing your personal database
            </p>
          </div>
        </div>
      </div>
    </>
  );
}