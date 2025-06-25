'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Timer } from 'lucide-react';

export function ActiveTab() {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Active Workout</h1>
          <p className="text-muted-foreground">Track your current workout session</p>
        </div>
        <Button>
          <Play className="h-4 w-4 mr-2" />
          Start Workout
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            No Active Workout
          </CardTitle>
          <CardDescription>
            Start a workout to begin tracking your session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-6xl font-bold text-muted-foreground mb-4">00:00</div>
            <p className="text-muted-foreground mb-6">Ready to start your workout?</p>
            <div className="flex gap-2 justify-center">
              <Button size="lg">
                <Play className="h-4 w-4 mr-2" />
                Quick Start
              </Button>
              <Button variant="outline" size="lg">
                Choose Template
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Goal</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45 min</div>
            <p className="text-xs text-muted-foreground">
              Target workout duration
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 / 5</div>
            <p className="text-xs text-muted-foreground">
              Workouts completed
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
