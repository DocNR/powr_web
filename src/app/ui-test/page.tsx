'use client';

import React, { useState } from 'react';
import { 
  Button, 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Progress,
  AppHeader
} from '@/components/powr-ui';
import { Settings, User, Dumbbell, Trophy, TrendingUp } from 'lucide-react';

export default function UITestPage() {
  const [progress, setProgress] = useState(65);

  return (
    <div className="min-h-screen bg-background">
      {/* App Header */}
      <AppHeader />
      
      <div className="container mx-auto p-6 space-y-8 pt-20">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">POWR UI Component Library</h1>
          <p className="text-muted-foreground">Built on Radix UI Primitives + Tailwind CSS</p>
        </div>

        {/* Button Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Button Components</CardTitle>
            <CardDescription>All button variants with gym personality support</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="default">Default</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon"><Settings className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>

        {/* Avatar Components */}
        <Card>
          <CardHeader>
            <CardTitle>Avatar Components</CardTitle>
            <CardDescription>User avatars with fallback support</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
              </Avatar>
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">PW</AvatarFallback>
              </Avatar>
            </div>
          </CardContent>
        </Card>

        {/* Progress Components */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Components</CardTitle>
            <CardDescription>Workout progress tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Workout Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setProgress(Math.max(0, progress - 10))}
              >
                -10%
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setProgress(Math.min(100, progress + 10))}
              >
                +10%
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sheet Component */}
        <Card>
          <CardHeader>
            <CardTitle>Sheet Components</CardTitle>
            <CardDescription>Slide-out panels and drawers</CardDescription>
          </CardHeader>
          <CardContent>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open Settings</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Workout Settings</SheetTitle>
                  <SheetDescription>
                    Configure your workout preferences and gym personality.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Gym Personality</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm">Zen</Button>
                      <Button variant="outline" size="sm">Hardcore</Button>
                      <Button variant="outline" size="sm">Corporate</Button>
                      <Button variant="outline" size="sm">Boutique</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Notifications</h4>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">Rest timer alerts</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">Workout reminders</span>
                      </label>
                    </div>
                  </div>
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button>Save Changes</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </CardContent>
        </Card>

        {/* Workout Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Workout</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Push Day</div>
              <p className="text-xs text-muted-foreground">
                5 exercises • 45 minutes
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Start Workout</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">
                Workouts completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12%</div>
              <p className="text-xs text-muted-foreground">
                Strength increase
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>🎯 POWR UI - Enterprise-grade components for white label fitness apps</p>
          <p>Built with Radix UI Primitives + Tailwind CSS</p>
        </div>
      </div>
    </div>
  );
}
