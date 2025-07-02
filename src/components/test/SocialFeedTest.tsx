'use client';

/**
 * SocialFeedTest Component
 * 
 * Test component to showcase the social variant of WorkoutCard
 * matching the mockup design with avatar overlays and proper styling.
 */

import { WorkoutCard } from '@/components/powr-ui/workout/WorkoutCard';
import { ScrollableGallery } from '@/components/powr-ui/workout/ScrollableGallery';

// Mock social workout data
const mockSocialWorkouts = [
  {
    id: 'social-1',
    title: 'Mike Mentzer Legs',
    completedAt: new Date('2025-06-30'),
    duration: 28,
    exercises: [
      {
        name: 'Squats',
        sets: [
          { reps: 8, weight: 225, rpe: 8 },
          { reps: 6, weight: 245, rpe: 9 }
        ]
      },
      {
        name: 'Romanian Deadlifts',
        sets: [
          { reps: 10, weight: 185, rpe: 7 },
          { reps: 8, weight: 205, rpe: 8 }
        ]
      },
      {
        name: 'Leg Press',
        sets: [
          { reps: 15, weight: 400, rpe: 8 },
          { reps: 12, weight: 450, rpe: 9 }
        ]
      },
      {
        name: 'Calf Raises',
        sets: [
          { reps: 20, weight: 135, rpe: 7 },
          { reps: 18, weight: 155, rpe: 8 }
        ]
      },
      {
        name: 'Leg Curls',
        sets: [
          { reps: 12, weight: 90, rpe: 8 },
          { reps: 10, weight: 100, rpe: 9 }
        ]
      },
      {
        name: 'Walking Lunges',
        sets: [
          { reps: 16, weight: 0, rpe: 7 }
        ]
      }
    ],
    author: {
      pubkey: 'abc123def456',
      name: 'John Doe',
      picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    notes: 'Intense leg session focusing on compound movements. Really felt the burn on those final sets!',
    eventTags: [
      ['imeta', 'url /assets/workout-record-fallback.jpg', 'm image/jpeg']
    ],
    eventContent: 'Completed an intense leg workout focusing on compound movements',
    eventKind: 1301
  },
  {
    id: 'social-2', 
    title: 'Arnold Upper Body Blast',
    completedAt: new Date('2025-06-29'),
    duration: 45,
    exercises: [
      {
        name: 'Bench Press',
        sets: [
          { reps: 8, weight: 185, rpe: 8 },
          { reps: 6, weight: 205, rpe: 9 },
          { reps: 4, weight: 225, rpe: 10 }
        ]
      },
      {
        name: 'Pull-ups',
        sets: [
          { reps: 10, weight: 0, rpe: 7 },
          { reps: 8, weight: 25, rpe: 8 },
          { reps: 6, weight: 45, rpe: 9 }
        ]
      },
      {
        name: 'Overhead Press',
        sets: [
          { reps: 8, weight: 135, rpe: 8 },
          { reps: 6, weight: 155, rpe: 9 }
        ]
      },
      {
        name: 'Barbell Rows',
        sets: [
          { reps: 10, weight: 155, rpe: 7 },
          { reps: 8, weight: 175, rpe: 8 }
        ]
      },
      {
        name: 'Dips',
        sets: [
          { reps: 12, weight: 0, rpe: 7 },
          { reps: 10, weight: 25, rpe: 8 }
        ]
      }
    ],
    author: {
      pubkey: 'def456ghi789',
      name: 'Sarah Wilson',
      picture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
    },
    notes: 'Classic Arnold-style upper body workout. The pump was incredible!',
    eventTags: [
      ['imeta', 'url /assets/workout-record-fallback.jpg', 'm image/jpeg']
    ],
    eventContent: 'Arnold-inspired upper body session with classic compound movements',
    eventKind: 1301
  },
  {
    id: 'social-3',
    title: 'Morning Cardio & Core',
    completedAt: new Date('2025-06-28'),
    duration: 35,
    exercises: [
      {
        name: 'Treadmill Run',
        sets: [
          { reps: 1, weight: 0, rpe: 6 }
        ]
      },
      {
        name: 'Plank',
        sets: [
          { reps: 1, weight: 0, rpe: 7 },
          { reps: 1, weight: 0, rpe: 8 },
          { reps: 1, weight: 0, rpe: 8 }
        ]
      },
      {
        name: 'Russian Twists',
        sets: [
          { reps: 30, weight: 20, rpe: 7 },
          { reps: 25, weight: 20, rpe: 8 }
        ]
      }
    ],
    author: {
      pubkey: 'ghi789jkl012',
      name: 'Mike Chen',
      picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    notes: 'Quick morning session to start the day right. Feeling energized!',
    eventTags: [
      ['imeta', 'url /assets/workout-record-fallback.jpg', 'm image/jpeg']
    ],
    eventContent: 'Morning cardio and core session to kickstart the day',
    eventKind: 1301
  }
];

export function SocialFeedTest() {
  const handleWorkoutSelect = (workoutId: string) => {
    console.log('Selected workout:', workoutId);
  };

  const handleAuthorClick = (pubkey: string) => {
    console.log('Author clicked:', pubkey);
  };

  return (
    <div className="space-y-6 p-4">
      <div>
        <h2 className="text-2xl font-bold mb-4">Social Feed Test</h2>
        <p className="text-muted-foreground mb-6">
          Testing the social variant of WorkoutCard matching the mockup design
        </p>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">What your friends are up to</h3>
        <button className="text-orange-500 text-sm font-medium">See all</button>
      </div>

      {/* Horizontal Scrollable Gallery */}
      <ScrollableGallery>
        {mockSocialWorkouts.map((workout) => (
          <div key={workout.id} className="flex-shrink-0 w-80">
            <WorkoutCard
              variant="social"
              workout={workout}
              onSelect={handleWorkoutSelect}
              onAuthorClick={handleAuthorClick}
              showImage={true}
              showAuthor={true}
              showStats={true}
            />
          </div>
        ))}
      </ScrollableGallery>

      {/* Individual Cards for Testing */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Individual Social Cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockSocialWorkouts.map((workout) => (
            <WorkoutCard
              key={workout.id}
              variant="social"
              workout={workout}
              onSelect={handleWorkoutSelect}
              onAuthorClick={handleAuthorClick}
              showImage={true}
              showAuthor={true}
              showStats={true}
            />
          ))}
        </div>
      </div>

      {/* Design Notes */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2">Design Features Implemented:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Avatar overlay in top-left corner with white border</li>
          <li>• &ldquo;is doing now&rdquo; text overlay in top-right with backdrop blur</li>
          <li>• Heart icon in bottom-right corner with white background</li>
          <li>• POWR logo in bottom-left corner</li>
          <li>• Dark gradient overlay for text readability</li>
          <li>• Text content below image (not overlaid) for better contrast</li>
          <li>• Exercise count, duration, and calories display</li>
          <li>• Level indicators and rating system</li>
          <li>• Hover effects and smooth transitions</li>
        </ul>
      </div>
    </div>
  );
}
