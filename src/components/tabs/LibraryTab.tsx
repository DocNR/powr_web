'use client';

import React from 'react';
import { Library, Search, Filter, Plus } from 'lucide-react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Card, CardContent } from '@/components/powr-ui/primitives/Card';
import { Input } from '@/components/powr-ui/primitives/Input';

export function LibraryTab() {
  return (
    <div className="flex-1 flex flex-col p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Library className="h-6 w-6 text-orange-500" />
          <h1 className="text-2xl font-bold">Exercise Library</h1>
        </div>
        <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Exercise
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search exercises..." 
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { name: 'Chest', emoji: '💪', count: 12 },
          { name: 'Back', emoji: '🏋️', count: 15 },
          { name: 'Legs', emoji: '🦵', count: 18 },
          { name: 'Arms', emoji: '💪', count: 10 },
          { name: 'Shoulders', emoji: '🤸', count: 8 },
          { name: 'Core', emoji: '🔥', count: 14 },
          { name: 'Cardio', emoji: '❤️', count: 6 },
          { name: 'Flexibility', emoji: '🧘', count: 9 },
        ].map((category) => (
          <Card key={category.name} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">{category.emoji}</div>
              <h3 className="font-medium">{category.name}</h3>
              <p className="text-sm text-muted-foreground">{category.count} exercises</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Exercises */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Exercises</h2>
        <div className="space-y-3">
          {[
            { name: 'Push-ups', category: 'Chest', difficulty: 'Beginner' },
            { name: 'Pull-ups', category: 'Back', difficulty: 'Intermediate' },
            { name: 'Squats', category: 'Legs', difficulty: 'Beginner' },
            { name: 'Deadlifts', category: 'Back', difficulty: 'Advanced' },
          ].map((exercise) => (
            <Card key={exercise.name} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{exercise.name}</h3>
                    <p className="text-sm text-muted-foreground">{exercise.category}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      exercise.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                      exercise.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {exercise.difficulty}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
