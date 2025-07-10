'use client';

import React, { useState } from 'react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/powr-ui/primitives/Card';
import { ActiveWorkoutContainer } from '@/components/powr-ui/workout/ActiveWorkoutContainer';

// Mock template data for testing
const mockTemplateData = {
  id: 'push-workout-bodyweight',
  name: 'Push Workout (Bodyweight)',
  description: 'A bodyweight push workout focusing on chest, shoulders, and triceps',
  exercises: [
    {
      exerciseRef: '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pushup-standard',
      sets: 3,
      reps: 10,
      weight: 0,
      rpe: 7,
      setType: 'normal'
    },
    {
      exerciseRef: '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pike-pushup',
      sets: 3,
      reps: 8,
      weight: 0,
      rpe: 8,
      setType: 'normal'
    },
    {
      exerciseRef: '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:tricep-dip',
      sets: 3,
      reps: 12,
      weight: 0,
      rpe: 7,
      setType: 'normal'
    }
  ]
};

const mockUserPubkey = '55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21';

export const ActiveWorkoutUITest: React.FC = () => {
  const [showActiveWorkout, setShowActiveWorkout] = useState(false);

  const handleStartWorkout = () => {
    console.log('[ActiveWorkoutUITest] Starting workout with template:', mockTemplateData);
    setShowActiveWorkout(true);
  };

  const handleCloseWorkout = () => {
    console.log('[ActiveWorkoutUITest] Closing workout');
    setShowActiveWorkout(false);
  };

  if (showActiveWorkout) {
    return (
      <ActiveWorkoutContainer
        templateData={mockTemplateData}
        userPubkey={mockUserPubkey}
        onClose={handleCloseWorkout}
      />
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Active Workout UI Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Test Template: {mockTemplateData.name}</h3>
            <p className="text-gray-600 mb-4">{mockTemplateData.description}</p>
            
            <div className="space-y-2">
              <h4 className="font-medium">Exercises:</h4>
              {mockTemplateData.exercises.map((exercise, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded">
                  <div className="font-medium">
                    {exercise.exerciseRef.split(':')[2]?.replace(/-/g, ' ') || 'Exercise'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {exercise.sets} sets × {exercise.reps} reps
                    {exercise.weight > 0 && ` @ ${exercise.weight}kg`}
                    {exercise.rpe && ` (RPE ${exercise.rpe})`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Actions</h3>
            
            <Button 
              onClick={handleStartWorkout}
              className="w-full"
              size="lg"
            >
              🏋️ Start Active Workout
            </Button>

            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>What this tests:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>ActiveWorkoutContainer XState integration</li>
                <li>Template loading and parsing</li>
                <li>ActiveWorkoutInterface rendering</li>
                <li>Set completion workflow</li>
                <li>Workout timer functionality</li>
                <li>Pause/resume controls</li>
                <li>Workout completion and publishing</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded">
              <h4 className="font-medium text-blue-900 mb-2">Expected Flow:</h4>
              <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                <li>Click &ldquo;Start Active Workout&rdquo; → Shows loading state</li>
                <li>Template loads → Shows ActiveWorkoutInterface</li>
                <li>Complete sets by tapping checkmarks</li>
                <li>Use pause/resume and navigation controls</li>
                <li>Finish workout → Publishing state → Success summary</li>
                <li>Workout publishes to Nostr as NIP-101e event</li>
              </ol>
            </div>

            <div className="bg-yellow-50 p-4 rounded">
              <h4 className="font-medium text-yellow-900 mb-2">Key Features to Test:</h4>
              <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                <li>✅ XState machine state transitions</li>
                <li>✅ Set completion with auto-generated data</li>
                <li>✅ Exercise navigation (previous/next)</li>
                <li>✅ Workout timer (elapsed time display)</li>
                <li>✅ Pause/resume functionality</li>
                <li>✅ Cancel workout option</li>
                <li>✅ Finish workout and publish to Nostr</li>
                <li>✅ Error handling and retry logic</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActiveWorkoutUITest;
