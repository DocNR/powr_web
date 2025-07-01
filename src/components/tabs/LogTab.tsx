'use client';

import React from 'react';
import { BookOpen, Calendar, Clock, TrendingUp, Filter, Search } from 'lucide-react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Card, CardContent } from '@/components/powr-ui/primitives/Card';
import { Input } from '@/components/powr-ui/primitives/Input';

export function LogTab() {
  return (
    <div className="flex-1 flex flex-col p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-orange-500" />
          <h1 className="text-2xl font-bold">Workout Log</h1>
        </div>
        <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
          <Calendar className="h-4 w-4 mr-2" />
          View Calendar
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search workout history..." 
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-500">24</div>
            <div className="text-sm text-muted-foreground">This Month</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">156</div>
            <div className="text-sm text-muted-foreground">Total Workouts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">42h</div>
            <div className="text-sm text-muted-foreground">Total Time</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-500">7</div>
            <div className="text-sm text-muted-foreground">Current Streak</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Workouts */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Workouts</h2>
        <div className="space-y-3">
          {[
            {
              name: 'Push Day - Upper Body',
              date: 'Today',
              time: '45 min',
              exercises: 6,
              sets: 18,
              volume: '2,450 lbs',
              type: 'Strength',
            },
            {
              name: 'Pull Day - Back & Biceps',
              date: 'Yesterday',
              time: '52 min',
              exercises: 5,
              sets: 15,
              volume: '2,180 lbs',
              type: 'Strength',
            },
            {
              name: 'Leg Day - Lower Body',
              date: '2 days ago',
              time: '38 min',
              exercises: 4,
              sets: 12,
              volume: '3,200 lbs',
              type: 'Strength',
            },
            {
              name: 'HIIT Cardio Session',
              date: '3 days ago',
              time: '25 min',
              exercises: 8,
              sets: 4,
              volume: 'Bodyweight',
              type: 'Cardio',
            },
            {
              name: 'Full Body Circuit',
              date: '4 days ago',
              time: '35 min',
              exercises: 7,
              sets: 21,
              volume: '1,890 lbs',
              type: 'Circuit',
            },
          ].map((workout, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <h3 className="font-medium">{workout.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {workout.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {workout.time}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      workout.type === 'Strength' ? 'bg-blue-100 text-blue-800' :
                      workout.type === 'Cardio' ? 'bg-red-100 text-red-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {workout.type}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium">{workout.exercises}</div>
                    <div className="text-muted-foreground">Exercises</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{workout.sets}</div>
                    <div className="text-muted-foreground">Sets</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{workout.volume}</div>
                    <div className="text-muted-foreground">Volume</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Progress Chart Placeholder */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Progress Overview</h2>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                <p>Progress chart coming soon</p>
                <p className="text-sm">Track your strength gains over time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
