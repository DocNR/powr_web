'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, BookOpen, History, Plus } from 'lucide-react';

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button className="h-auto flex-col gap-2 p-4" size="lg">
            <Play className="h-6 w-6" />
            <div className="text-center">
              <div className="font-semibold">Start Workout</div>
              <div className="text-xs text-primary-foreground/80">Begin a new session</div>
            </div>
          </Button>
          
          <Button variant="outline" className="h-auto flex-col gap-2 p-4" size="lg">
            <BookOpen className="h-6 w-6" />
            <div className="text-center">
              <div className="font-semibold">Browse Templates</div>
              <div className="text-xs text-muted-foreground">Find workout plans</div>
            </div>
          </Button>
          
          <Button variant="outline" className="h-auto flex-col gap-2 p-4" size="lg">
            <History className="h-6 w-6" />
            <div className="text-center">
              <div className="font-semibold">View History</div>
              <div className="text-xs text-muted-foreground">Past workouts</div>
            </div>
          </Button>
          
          <Button variant="outline" className="h-auto flex-col gap-2 p-4" size="lg">
            <Plus className="h-6 w-6" />
            <div className="text-center">
              <div className="font-semibold">Create Template</div>
              <div className="text-xs text-muted-foreground">Build custom plan</div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
