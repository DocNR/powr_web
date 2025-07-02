'use client';

import { useState } from 'react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { WorkoutDetailModal } from '@/components/powr-ui/workout';

const mockTemplateData = {
  title: "Mike Mentzer's Chest and Back",
  description: "High-intensity training routine focusing on chest and back muscles with compound movements.",
  content: "Mike Mentzer's Chest and Back routine focuses on high-intensity, low-volume training to target the major muscles of the chest and back.",
  exercises: [
    {
      name: "Incline Barbell Press",
      sets: 1,
      reps: 8,
      description: "Heavy incline press to failure for maximum chest stimulation"
    },
    {
      name: "Weighted Pull-ups",
      sets: 1,
      reps: 6,
      description: "Pull-ups with added weight performed to complete failure"
    },
    {
      name: "Dumbbell Flyes",
      sets: 1,
      reps: 10,
      description: "Isolation movement for chest with perfect form"
    },
    {
      name: "Bent-over Rows",
      sets: 1,
      reps: 8,
      description: "Heavy rowing movement for back thickness"
    }
  ],
  equipment: ["Barbell", "Dumbbells", "Pull-up Bar", "Incline Bench"],
  tags: [
    ["t", "fitness"],
    ["t", "strength"]
  ],
  eventKind: 33402
};

export function WorkoutDetailModalTest() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError(undefined);
  };

  const handleStartWorkout = () => {
    console.log('Starting workout!');
    alert('Workout started! This would normally navigate to the active workout screen.');
    setIsModalOpen(false);
  };

  const handleTestLoading = () => {
    setIsLoading(true);
    setIsModalOpen(true);
    
    // Simulate loading for 2 seconds
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const handleTestError = () => {
    setError('Failed to load workout template. Please try again.');
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Workout Detail Modal Test</h2>
      
      <div className="space-y-3">
        <Button onClick={handleOpenModal} className="w-full">
          Open Workout Detail Modal
        </Button>
        
        <Button onClick={handleTestLoading} variant="outline" className="w-full">
          Test Loading State
        </Button>
        
        <Button onClick={handleTestError} variant="outline" className="w-full">
          Test Error State
        </Button>
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Features Demonstrated:</h3>
        <ul className="text-sm space-y-1">
          <li>• Full-screen modal with hero background image</li>
          <li>• Loading state with spinner</li>
          <li>• Error state with retry option</li>
          <li>• Tabbed content (Overview, Exercises, Equipment)</li>
          <li>• Orange gradient &ldquo;Start Workout&rdquo; button</li>
          <li>• Mobile-optimized design matching reference</li>
          <li>• Proper TypeScript types</li>
        </ul>
      </div>

      <WorkoutDetailModal
        isOpen={isModalOpen}
        isLoading={isLoading}
        templateData={error ? undefined : mockTemplateData}
        error={error}
        onClose={handleCloseModal}
        onStartWorkout={handleStartWorkout}
      />
    </div>
  );
}
