'use client';

import React from 'react';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { RecentWorkouts } from '@/components/dashboard/recent-workouts';
import { WorkoutPublisher } from '@/components/test/WorkoutPublisher';
import { WorkoutReader } from '@/components/test/WorkoutReader';

// Mock data for now - this will be replaced with real data from NDK
const mockStats = {
  totalWorkouts: 12,
  currentStreak: 3,
  totalHours: 18,
  thisWeek: 4,
};

const mockWorkouts = [
  {
    id: '1',
    name: 'Upper Body Strength',
    date: '2025-06-22',
    duration: 45,
    exercises: 6,
  },
  {
    id: '2',
    name: 'Cardio & Core',
    date: '2025-06-21',
    duration: 30,
    exercises: 4,
  },
  {
    id: '3',
    name: 'Full Body Workout',
    date: '2025-06-20',
    duration: 60,
    exercises: 8,
  },
];

export function HomeTab() {
  return (
    <>
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s your workout overview.
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards {...mockStats} />

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <QuickActions />
        <RecentWorkouts workouts={mockWorkouts} />
      </div>

      {/* NDK Cache Validation Test Components */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">NDK Cache Validation</h2>
          <p className="text-muted-foreground">
            Test components for validating NDK-first architecture. Phase 1 of sprint validation.
          </p>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <WorkoutPublisher />
          <WorkoutReader />
        </div>
      </div>
    </>
  );
}
