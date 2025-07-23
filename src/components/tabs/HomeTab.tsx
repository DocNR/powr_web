import React from 'react';
import { Dumbbell, Zap, Trophy, Users } from 'lucide-react';

export default function HomeTab() {
  return (
    <>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to POWR</h1>
        <p className="text-muted-foreground text-lg">
          Your fitness tracking journey starts here
        </p>
      </div>

      {/* Coming Soon Features */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col items-center p-8 border-2 border-dashed border-muted-foreground/30 rounded-lg">
          <Dumbbell className="h-12 w-12 text-[color:var(--workout-primary)] mb-4" />
          <h3 className="text-xl font-semibold mb-2">Smart Workout Templates</h3>
          <p className="text-muted-foreground text-center">
            Discover and share workout routines via the Nostr network
          </p>
          <div className="mt-4 px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
            Coming Soon™
          </div>
        </div>

        <div className="flex flex-col items-center p-8 border-2 border-dashed border-muted-foreground/30 rounded-lg">
          <Zap className="h-12 w-12 text-[color:var(--workout-primary)] mb-4" />
          <h3 className="text-xl font-semibold mb-2">Real-time Tracking</h3>
          <p className="text-muted-foreground text-center">
            Track sets, reps, and weights with offline-first sync
          </p>
          <div className="mt-4 px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
            Coming Soon™
          </div>
        </div>

        <div className="flex flex-col items-center p-8 border-2 border-dashed border-muted-foreground/30 rounded-lg">
          <Trophy className="h-12 w-12 text-[color:var(--workout-timer)] mb-4" />
          <h3 className="text-xl font-semibold mb-2">Progress Analytics</h3>
          <p className="text-muted-foreground text-center">
            Visualize your strength gains and personal records
          </p>
          <div className="mt-4 px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
            Coming Soon™
          </div>
        </div>

        <div className="flex flex-col items-center p-8 border-2 border-dashed border-muted-foreground/30 rounded-lg">
          <Users className="h-12 w-12 text-[color:var(--workout-primary)] mb-4" />
          <h3 className="text-xl font-semibold mb-2">Social Fitness</h3>
          <p className="text-muted-foreground text-center">
            Connect with the fitness community through decentralized social
          </p>
          <div className="mt-4 px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
            Coming Soon™
          </div>
        </div>
      </div>

      {/* Technical Vision */}
      <div className="bg-[color:var(--workout-surface)] rounded-lg p-6 space-y-4">
        <h2 className="text-2xl font-semibold">Built Different</h2>
        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <div>
            <h4 className="font-medium text-[color:var(--workout-primary)] mb-2">🌐 Decentralized</h4>
            <p className="text-muted-foreground">
              Your data belongs to you, powered by the Nostr protocol
            </p>
          </div>
          <div>
            <h4 className="font-medium text-[color:var(--workout-primary)] mb-2">📱 Offline-First</h4>
            <p className="text-muted-foreground">
              Track workouts anywhere, sync when you are back online
            </p>
          </div>
          <div>
            <h4 className="font-medium text-[color:var(--workout-primary)] mb-2">🚀 Progressive Web App</h4>
            <p className="text-muted-foreground">
              Install like a native app, update instantly
            </p>
          </div>
        </div>
      </div>
    </>
  );
}