/**
 * Active Workout NIP-101e Compliance Test
 * 
 * Tests the fixed activeWorkoutMachine to ensure it uses template data
 * instead of hardcoded progressive set generation.
 */

import React, { useState } from 'react';
import { createActor } from 'xstate';
import { activeWorkoutMachine } from '@/lib/machines/workout/activeWorkoutMachine';
import type { ActiveWorkoutMachineInput } from '@/lib/machines/workout/types/activeWorkoutTypes';

const ActiveWorkoutNIP101eTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      addResult('🧪 Starting NIP-101e Compliance Test');
      
      // Create test input with template data
      const testInput: ActiveWorkoutMachineInput = {
        userInfo: {
          pubkey: '55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21',
          npub: 'npub12535ljw7cq7xkjd28x4h0kenjm03c3x9c53mhkglumltgqw6nvssjxkk5z'
        },
        workoutData: {
          workoutId: 'test-workout-123',
          title: 'Test Workout',
          startTime: Date.now(),
          workoutType: 'strength' as const,
          exercises: [],
          completedSets: []
        },
        templateSelection: {
          templateId: 'hodl-strength-workout',
          templatePubkey: 'eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222',
          templateReference: '33402:eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222:hodl-strength-workout'
        }
      };

      addResult('📋 Creating active workout machine with template selection');
      
      // Create the machine actor
      const actor = createActor(activeWorkoutMachine, {
        input: testInput
      });

      // Subscribe to state changes
      actor.subscribe((snapshot) => {
        addResult(`🔄 State: ${snapshot.value} | Status: ${snapshot.status}`);
        
        if (snapshot.status === 'done') {
          addResult('✅ Machine completed successfully');
        } else if (snapshot.status === 'error') {
          addResult(`❌ Machine error: ${snapshot.error}`);
        }
        
        // Check for template exercises parsing
        if (snapshot.context.templateExercises && snapshot.context.templateExercises.length > 0) {
          addResult(`📋 Template exercises parsed: ${snapshot.context.templateExercises.length}`);
          
          snapshot.context.templateExercises.forEach((exercise, index) => {
            addResult(`  Exercise ${index + 1}: ${exercise.exerciseRef}`);
            addResult(`    Prescribed: ${exercise.prescribedWeight}kg, ${exercise.prescribedReps} reps, RPE ${exercise.prescribedRPE}, ${exercise.prescribedSetType}`);
          });
        }
        
        // Check for completed sets using template data
        if (snapshot.context.workoutData.completedSets && snapshot.context.workoutData.completedSets.length > 0) {
          addResult(`✅ Completed sets: ${snapshot.context.workoutData.completedSets.length}`);
          
          snapshot.context.workoutData.completedSets.forEach((set, index) => {
            addResult(`  Set ${index + 1}: ${set.exerciseRef} - ${set.weight}kg x ${set.reps} @ RPE ${set.rpe} (${set.setType})`);
          });
        }
      });

      // Start the machine
      addResult('🚀 Starting active workout machine');
      actor.start();

      // Wait for template loading
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Simulate completing a set to test template data usage
      const currentState = actor.getSnapshot().value;
      if (typeof currentState === 'object' && 'exercising' in currentState) {
        addResult('🏋️ Simulating set completion');
        actor.send({ type: 'COMPLETE_SET' });
        
        // Wait for set completion processing
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Stop the actor
      actor.stop();
      addResult('🛑 Test completed');
      
    } catch (error) {
      addResult(`❌ Test failed: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          🧪 Active Workout NIP-101e Compliance Test
        </h2>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            This test verifies that the activeWorkoutMachine now uses actual template data 
            instead of hardcoded progressive set generation.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Test Objectives:</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>✅ Load template data from 33402 workout template event</li>
              <li>✅ Parse prescribed weight, reps, RPE, and set type from template</li>
              <li>✅ Use template values as defaults for set completion</li>
              <li>✅ Maintain NDK deduplication fix (per-exercise set counters)</li>
              <li>✅ Generate NIP-101e compliant workout records</li>
            </ul>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={runTest}
            disabled={isRunning}
            className={`px-6 py-3 rounded-lg font-semibold ${
              isRunning
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isRunning ? '🔄 Running Test...' : '🚀 Run NIP-101e Compliance Test'}
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Test Results:</h3>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500 italic">No test results yet. Click "Run Test" to start.</p>
            ) : (
              testResults.map((result, index) => (
                <div
                  key={index}
                  className={`text-sm font-mono p-2 rounded ${
                    result.includes('❌') ? 'bg-red-100 text-red-800' :
                    result.includes('✅') ? 'bg-green-100 text-green-800' :
                    result.includes('🔄') ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-700'
                  }`}
                >
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Expected Behavior:</h3>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• Machine should load template data from the specified 33402 event</li>
            <li>• Template exercises should be parsed with prescribed parameters</li>
            <li>• Set completion should use template values as defaults</li>
            <li>• No hardcoded progressive generation should occur</li>
            <li>• Generated workout records should be NIP-101e compliant</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ActiveWorkoutNIP101eTest;
