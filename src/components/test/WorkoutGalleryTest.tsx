'use client';

/**
 * WorkoutGalleryTest Component
 * 
 * Test component showcasing the new workout gallery components:
 * - CalendarBar
 * - WorkoutCard (multiple variants)
 * - ScrollableGallery
 * - WorkoutImageHandler
 */

import { useState } from 'react';
import { 
  CalendarBar,
  WorkoutCard,
  WorkoutGallery,
  SocialGallery,
  HeroGallery
} from '@/components/powr-ui/workout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/powr-ui/primitives/Card';
import { Button } from '@/components/powr-ui/primitives/Button';

// Mock data
const mockWorkoutTemplates = [
  {
    id: 'push-workout-1',
    title: 'Push Day Power',
    description: 'Upper body strength workout focusing on pushing movements',
    exercises: [
      { name: 'Bench Press', sets: 4, reps: 8, weight: 185 },
      { name: 'Overhead Press', sets: 3, reps: 10, weight: 135 },
      { name: 'Push-ups', sets: 3, reps: 15 },
      { name: 'Dips', sets: 3, reps: 12 }
    ],
    estimatedDuration: 45,
    difficulty: 'intermediate' as const,
    author: {
      pubkey: 'abc123',
      name: 'Coach Mike',
      picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    eventTags: [
      ['imeta', 'url https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop', 'm image/jpeg', 'alt Gym workout']
    ],
    eventContent: 'Push day workout https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop',
    eventKind: 33402
  },
  {
    id: 'pull-workout-1',
    title: 'Pull Day Strength',
    description: 'Back and bicep focused pulling workout',
    exercises: [
      { name: 'Pull-ups', sets: 4, reps: 8 },
      { name: 'Barbell Rows', sets: 4, reps: 10, weight: 155 },
      { name: 'Lat Pulldowns', sets: 3, reps: 12, weight: 120 }
    ],
    estimatedDuration: 40,
    difficulty: 'advanced' as const,
    author: {
      pubkey: 'def456',
      name: 'Sarah Strong',
      picture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
    },
    eventTags: [
      ['imeta', 'url https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&h=400&fit=crop', 'm image/jpeg', 'alt Pull workout']
    ],
    eventContent: 'Pull day strength https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&h=400&fit=crop',
    eventKind: 33402
  },
  {
    id: 'leg-workout-1',
    title: 'Leg Day Crusher',
    description: 'Lower body strength and power workout',
    exercises: [
      { name: 'Squats', sets: 5, reps: 5, weight: 225 },
      { name: 'Romanian Deadlifts', sets: 4, reps: 8, weight: 185 },
      { name: 'Lunges', sets: 3, reps: 12 }
    ],
    estimatedDuration: 50,
    difficulty: 'beginner' as const,
    author: {
      pubkey: 'ghi789',
      name: 'Alex Fit',
      picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    eventTags: [
      ['imeta', 'url https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=600&h=400&fit=crop', 'm image/jpeg', 'alt Leg workout']
    ],
    eventContent: 'Leg day crusher https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=600&h=400&fit=crop',
    eventKind: 33402
  }
];

const mockWorkoutRecords = [
  {
    id: 'record-1',
    title: 'Morning Push Session',
    completedAt: new Date('2025-06-30T08:00:00'),
    duration: 42,
    exercises: [
      {
        name: 'Bench Press',
        sets: [
          { reps: 8, weight: 185, rpe: 7 },
          { reps: 8, weight: 185, rpe: 8 },
          { reps: 6, weight: 185, rpe: 9 }
        ]
      }
    ],
    author: {
      pubkey: 'user123',
      name: 'John Doe',
      picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'
    },
    notes: 'Great session! Felt strong on bench press today.',
    eventTags: [
      ['imeta', 'url https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop', 'm image/jpeg', 'alt Completed workout']
    ],
    eventContent: 'Completed push workout https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    eventKind: 1301
  },
  {
    id: 'record-2',
    title: 'Evening Pull Workout',
    completedAt: new Date('2025-06-29T18:30:00'),
    duration: 38,
    exercises: [
      {
        name: 'Pull-ups',
        sets: [
          { reps: 10, weight: 0, rpe: 6 },
          { reps: 8, weight: 0, rpe: 7 },
          { reps: 6, weight: 0, rpe: 8 }
        ]
      }
    ],
    author: {
      pubkey: 'user456',
      name: 'Jane Smith',
      picture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    },
    notes: 'Solid pull session. Pull-ups feeling easier!',
    eventTags: [
      ['imeta', 'url https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop', 'm image/jpeg', 'alt Pull workout completed']
    ],
    eventContent: 'Evening pull session https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop',
    eventKind: 1301
  }
];

export default function WorkoutGalleryTest() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);

  const handleWorkoutSelect = (workoutId: string) => {
    setSelectedWorkout(workoutId);
    console.log('Selected workout:', workoutId);
  };

  const handleAuthorClick = (pubkey: string) => {
    console.log('Author clicked:', pubkey);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    console.log('Date selected:', date);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Workout Gallery Components Test</CardTitle>
          <p className="text-sm text-gray-600">
            Testing CalendarBar, WorkoutCard variants, and ScrollableGallery components
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          
          {/* Calendar Bar */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Calendar Bar</h3>
            <CalendarBar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              workoutIndicators={[
                { date: new Date('2025-06-28'), count: 1, type: 'completed' },
                { date: new Date('2025-06-30'), count: 1, type: 'scheduled' },
                { date: new Date('2025-07-01'), count: 2, type: 'completed' }
              ]}
            />
          </div>

          {/* Hero Gallery - POWR WOD */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Hero Gallery - POWR WOD</h3>
            <HeroGallery
              title="POWR WOD"
              subtitle="Today's featured workout"
            >
              <WorkoutCard
                variant="hero"
                workout={mockWorkoutTemplates[0]}
                onSelect={handleWorkoutSelect}
                onAuthorClick={handleAuthorClick}
              />
            </HeroGallery>
          </div>

          {/* Social Gallery - What your friends are up to */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Social Gallery</h3>
            <SocialGallery
              title="What your friends are up to"
              subtitle="Recent workout completions"
              onSeeAll={() => console.log('See all social')}
            >
              {mockWorkoutRecords.map(record => (
                <WorkoutCard
                  key={record.id}
                  variant="social"
                  workout={record}
                  onSelect={handleWorkoutSelect}
                  onAuthorClick={handleAuthorClick}
                />
              ))}
            </SocialGallery>
          </div>

          {/* Discovery Gallery - Find workout */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Discovery Gallery</h3>
            <WorkoutGallery
              title="Find workout"
              subtitle="Browse workout templates"
              cardSize="md"
              onSeeAll={() => console.log('See all workouts')}
            >
              {mockWorkoutTemplates.map(template => (
                <WorkoutCard
                  key={template.id}
                  variant="discovery"
                  workout={template}
                  onSelect={handleWorkoutSelect}
                  onAuthorClick={handleAuthorClick}
                />
              ))}
            </WorkoutGallery>
          </div>

          {/* Compact Gallery - List view */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Compact Gallery</h3>
            <div className="space-y-2">
              {mockWorkoutTemplates.map(template => (
                <WorkoutCard
                  key={template.id}
                  variant="compact"
                  workout={template}
                  onSelect={handleWorkoutSelect}
                  onAuthorClick={handleAuthorClick}
                />
              ))}
            </div>
          </div>

          {/* Individual Card Variants */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Individual Card Variants</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Discovery Card */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Discovery Variant</h4>
                <WorkoutCard
                  variant="discovery"
                  workout={mockWorkoutTemplates[0]}
                  onSelect={handleWorkoutSelect}
                  onAuthorClick={handleAuthorClick}
                />
              </div>

              {/* Social Card */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Social Variant</h4>
                <WorkoutCard
                  variant="social"
                  workout={mockWorkoutRecords[0]}
                  onSelect={handleWorkoutSelect}
                  onAuthorClick={handleAuthorClick}
                />
              </div>

              {/* Compact Card */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Compact Variant</h4>
                <WorkoutCard
                  variant="compact"
                  workout={mockWorkoutTemplates[1]}
                  onSelect={handleWorkoutSelect}
                  onAuthorClick={handleAuthorClick}
                />
              </div>
            </div>
          </div>

          {/* Selection State */}
          {selectedWorkout && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Selected Workout:</strong> {selectedWorkout}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedWorkout(null)}
                className="mt-2"
              >
                Clear Selection
              </Button>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
