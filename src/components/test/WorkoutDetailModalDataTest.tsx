'use client';

/**
 * WorkoutDetailModalDataTest - Test component to verify modal data display
 * 
 * This component creates mock resolved template and exercise data to test
 * the WorkoutDetailModal's ability to display proper content and equipment.
 */

import React, { useState } from 'react';
import { WorkoutDetailModal } from '@/components/powr-ui/workout';

export default function WorkoutDetailModalDataTest() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock resolved template data (33402 workout template)
  const mockResolvedTemplate = {
    id: 'test-template-id',
    name: 'HODL Strength Workout',
    description: 'A comprehensive strength training workout focusing on compound movements. Build muscle and strength with this proven routine that targets all major muscle groups.',
    content: 'A comprehensive strength training workout focusing on compound movements. Build muscle and strength with this proven routine that targets all major muscle groups.',
    tags: [
      ['d', 'hodl-strength-workout'],
      ['title', 'HODL Strength Workout'],
      ['type', 'strength'],
      ['difficulty', 'intermediate'],
      ['duration', '45'],
      ['t', 'fitness']
    ],
    exercises: [
      {
        name: 'Push-ups',
        sets: 3,
        reps: 12,
        weight: 0,
        exerciseRef: '33401:test-pubkey:pushup-standard'
      },
      {
        name: 'Squats',
        sets: 3,
        reps: 15,
        weight: 0,
        exerciseRef: '33401:test-pubkey:squat-bodyweight'
      },
      {
        name: 'Pull-ups',
        sets: 3,
        reps: 8,
        weight: 0,
        exerciseRef: '33401:test-pubkey:pullup-standard'
      }
    ]
  };

  // Mock resolved exercises data (33401 exercise templates)
  const mockResolvedExercises = [
    {
      id: 'pushup-standard',
      name: 'Standard Pushup',
      description: 'Classic bodyweight exercise targeting chest, shoulders, and triceps. Perfect for building upper body strength.',
      equipment: 'bodyweight',
      difficulty: 'beginner',
      muscleGroups: ['chest', 'shoulders', 'triceps'],
      tags: [
        ['d', 'pushup-standard'],
        ['title', 'Standard Pushup'],
        ['equipment', 'bodyweight'],
        ['difficulty', 'beginner'],
        ['t', 'chest'],
        ['t', 'push'],
        ['t', 'fitness']
      ]
    },
    {
      id: 'squat-bodyweight',
      name: 'Bodyweight Squat',
      description: 'Fundamental lower body exercise targeting quads, glutes, and hamstrings. Great for building leg strength and mobility.',
      equipment: 'bodyweight',
      difficulty: 'beginner',
      muscleGroups: ['quads', 'glutes', 'hamstrings'],
      tags: [
        ['d', 'squat-bodyweight'],
        ['title', 'Bodyweight Squat'],
        ['equipment', 'bodyweight'],
        ['difficulty', 'beginner'],
        ['t', 'legs'],
        ['t', 'squat'],
        ['t', 'fitness']
      ]
    },
    {
      id: 'pullup-standard',
      name: 'Standard Pull-up',
      description: 'Upper body pulling exercise targeting lats, rhomboids, and biceps. Requires pull-up bar or similar equipment.',
      equipment: 'pull-up bar',
      difficulty: 'intermediate',
      muscleGroups: ['lats', 'rhomboids', 'biceps'],
      tags: [
        ['d', 'pullup-standard'],
        ['title', 'Standard Pull-up'],
        ['equipment', 'pull-up bar'],
        ['difficulty', 'intermediate'],
        ['t', 'back'],
        ['t', 'pull'],
        ['t', 'fitness']
      ]
    }
  ];

  // Mock workout data
  const mockWorkoutData = {
    title: 'HODL Strength Workout',
    exercises: mockResolvedTemplate.exercises
  };

  // Template data structure that should work with the modal
  const templateData = {
    // Basic info
    title: mockResolvedTemplate.name,
    description: mockResolvedTemplate.description,
    content: mockResolvedTemplate.description,
    
    // Resolved data (this is what should fix the display)
    resolvedTemplate: mockResolvedTemplate,
    resolvedExercises: mockResolvedExercises,
    
    // Backward compatibility
    loadedTemplate: mockResolvedTemplate,
    loadedExercises: mockResolvedExercises,
    
    // Workout data
    workoutData: mockWorkoutData,
    
    // Metadata
    tags: [['t', 'fitness']],
    eventKind: 33402,
    templateRef: '33402:test-pubkey:hodl-strength-workout'
  };

  const handleOpenModal = () => {
    console.log('🧪 Opening test modal with data:');
    console.log('📋 Template Data:', templateData);
    console.log('🏋️ Resolved Template:', mockResolvedTemplate);
    console.log('💪 Resolved Exercises:', mockResolvedExercises);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleStartWorkout = () => {
    console.log('🚀 Starting test workout!');
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Workout Detail Modal Data Test</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Test Purpose:</h3>
            <p className="text-sm text-gray-600">
              This test verifies that the WorkoutDetailModal can properly display:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
              <li><strong>Overview Tab:</strong> Actual workout description instead of "Template:dtag"</li>
              <li><strong>Equipment Tab:</strong> Equipment from resolved exercises (bodyweight, pull-up bar) instead of "Equipment information will be loaded..."</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Mock Data Summary:</h3>
            <div className="bg-gray-50 p-3 rounded text-sm">
              <p><strong>Template:</strong> {mockResolvedTemplate.name}</p>
              <p><strong>Description:</strong> {mockResolvedTemplate.description.substring(0, 100)}...</p>
              <p><strong>Exercises:</strong> {mockResolvedExercises.length} exercises</p>
              <p><strong>Equipment:</strong> {mockResolvedExercises.map(e => e.equipment).join(', ')}</p>
            </div>
          </div>

          <button
            onClick={handleOpenModal}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            🧪 Open Test Modal
          </button>
        </div>
      </div>

      {/* Data Structure Display */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Template Data Structure:</h3>
        <pre className="text-xs overflow-auto max-h-96 bg-white p-3 rounded border">
          {JSON.stringify(templateData, null, 2)}
        </pre>
      </div>

      {/* Test Modal */}
      <WorkoutDetailModal
        isOpen={isModalOpen}
        isLoading={false}
        templateData={templateData}
        onClose={handleCloseModal}
        onStartWorkout={handleStartWorkout}
      />
    </div>
  );
}
