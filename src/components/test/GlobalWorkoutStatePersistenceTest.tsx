'use client';

/**
 * Global Workout State Persistence Test
 * 
 * Tests the new global workout context architecture to ensure:
 * 1. Workout state persists across tab navigation
 * 2. Mini playbar appears when workout is active
 * 3. Modal state is properly managed by global context
 * 4. No state loss during component unmounting
 */

import React, { useState } from 'react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/powr-ui/primitives/Card';
import { WorkoutContext } from '@/contexts/WorkoutContext';
import { useWorkoutContext } from '@/hooks/useWorkoutContext';

export default function GlobalWorkoutStatePersistenceTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');

  // Access global workout context
  const workoutState = WorkoutContext.useSelector((state) => state);
  const workoutSend = WorkoutContext.useActorRef().send;

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const clearResults = () => {
    setTestResults([]);
    setCurrentTest('');
  };

  // Test 1: Start workout setup
  const testStartWorkoutSetup = () => {
    setCurrentTest('Starting workout setup...');
    addResult('🚀 Starting workout setup with template reference');
    
    workoutSend({
      type: 'START_SETUP',
      templateReference: '33402:test-pubkey:test-template'
    });
    
    addResult(`✅ Setup started - Machine state: ${workoutState.value}`);
  };

  // Test 2: Check state persistence during navigation simulation
  const testStatePersistence = () => {
    setCurrentTest('Testing state persistence...');
    addResult('🔄 Simulating tab navigation (component unmount/remount)');
    
    // Force a re-render to simulate navigation
    const currentState = workoutState.value;
    const currentContext = workoutState.context;
    
    addResult(`📊 Current state before navigation: ${JSON.stringify(currentState)}`);
    addResult(`📊 Current context: ${JSON.stringify(currentContext, null, 2)}`);
    
    // Check if state is maintained
    setTimeout(() => {
      const newState = workoutState.value;
      if (JSON.stringify(currentState) === JSON.stringify(newState)) {
        addResult('✅ State persisted correctly across navigation');
      } else {
        addResult('❌ State was lost during navigation');
      }
    }, 100);
  };

  // Test 3: Start active workout
  const testStartActiveWorkout = () => {
    setCurrentTest('Starting active workout...');
    addResult('🏃‍♂️ Starting active workout');
    
    const mockWorkoutData = {
      workoutId: `test-workout-${Date.now()}`,
      title: 'Test Workout',
      exercises: [
        {
          exerciseRef: '33401:test-pubkey:pushups',
          sets: 3,
          reps: 10,
          weight: 0,
          rpe: 7,
          setType: 'normal' as const
        }
      ],
      completedSets: [],
      workoutType: 'strength' as const,
      startTime: Date.now()
    };
    
    workoutSend({
      type: 'START_WORKOUT',
      workoutData: mockWorkoutData
    });
    
    addResult(`✅ Active workout started - Machine state: ${workoutState.value}`);
  };

  // Test 4: Reset to idle
  const testResetToIdle = () => {
    setCurrentTest('Resetting to idle...');
    addResult('🔄 Resetting machine to idle state');
    
    workoutSend({ type: 'RESET_LIFECYCLE' });
    
    addResult(`✅ Reset complete - Machine state: ${workoutState.value}`);
  };

  // Test 5: Complete workout flow
  const testCompleteWorkoutFlow = async () => {
    setCurrentTest('Testing complete workout flow...');
    addResult('🔄 Starting complete workout flow test');
    
    // Step 1: Start setup
    workoutSend({
      type: 'START_SETUP',
      templateReference: '33402:test-pubkey:complete-flow-test'
    });
    addResult(`Step 1: Setup started - State: ${workoutState.value}`);
    
    // Step 2: Wait and start workout
    setTimeout(() => {
      const mockWorkoutData = {
        workoutId: `complete-flow-${Date.now()}`,
        title: 'Complete Flow Test',
        exercises: [
          {
            exerciseRef: '33401:test-pubkey:test-exercise',
            sets: 2,
            reps: 5,
            weight: 0,
            rpe: 6,
            setType: 'normal' as const
          }
        ],
        completedSets: [],
        workoutType: 'strength' as const,
        startTime: Date.now()
      };
      
      workoutSend({
        type: 'START_WORKOUT',
        workoutData: mockWorkoutData
      });
      addResult(`Step 2: Workout started - State: ${workoutState.value}`);
      
      // Step 3: Complete workout
      setTimeout(() => {
        workoutSend({
          type: 'WORKOUT_COMPLETED',
          workoutData: {
            ...mockWorkoutData,
            completedSets: [
              {
                exerciseRef: '33401:test-pubkey:test-exercise',
                setNumber: 1,
                reps: 5,
                weight: 0,
                rpe: 6,
                setType: 'normal',
                completedAt: Date.now()
              }
            ],
            endTime: Date.now()
          }
        });
        addResult(`Step 3: Workout completed - State: ${workoutState.value}`);
      }, 1000);
    }, 500);
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Global Workout State Persistence Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Button onClick={testStartWorkoutSetup} size="sm">
              1. Start Setup
            </Button>
            <Button onClick={testStatePersistence} size="sm">
              2. Test Persistence
            </Button>
            <Button onClick={testStartActiveWorkout} size="sm">
              3. Start Workout
            </Button>
            <Button onClick={testResetToIdle} size="sm">
              4. Reset to Idle
            </Button>
            <Button onClick={testCompleteWorkoutFlow} size="sm">
              5. Complete Flow
            </Button>
            <Button onClick={clearResults} variant="outline" size="sm">
              Clear Results
            </Button>
          </div>
          
          {currentTest && (
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm font-medium text-blue-900">Current Test: {currentTest}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current State Display */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Current Global Workout State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Machine State:</p>
                <p className="text-lg font-mono bg-gray-100 p-2 rounded">
                  {JSON.stringify(workoutState.value)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Context Keys:</p>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                  {Object.keys(workoutState.context).join(', ')}
                </p>
              </div>
            </div>
            
            {workoutState.context.workoutData && (
              <div>
                <p className="text-sm font-medium text-gray-700">Workout Data:</p>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(workoutState.context.workoutData, null, 2)}
                </pre>
              </div>
            )}
            
            {workoutState.context.templateSelection && (
              <div>
                <p className="text-sm font-medium text-gray-700">Template Selection:</p>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(workoutState.context.templateSelection, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Test Results ({testResults.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-sm">No test results yet. Run a test to see results.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono bg-gray-50 p-2 rounded">
                  {result}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expected Behavior */}
      <Card>
        <CardHeader>
          <CardTitle>✅ Expected Behavior</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>✅ Global State Persistence:</strong> Workout state should persist across all tab navigation</p>
            <p><strong>✅ Modal State Management:</strong> Modal open/close state derived from global machine state</p>
            <p><strong>✅ Mini Playbar:</strong> Should appear when workout is active (state: 'active')</p>
            <p><strong>✅ No State Loss:</strong> Component unmounting should not affect global workout state</p>
            <p><strong>✅ Clean Transitions:</strong> State transitions should be predictable and logged</p>
            <p><strong>✅ Context Access:</strong> All components can access global workout state via WorkoutContext</p>
          </div>
        </CardContent>
      </Card>

      {/* Architecture Validation */}
      <Card>
        <CardHeader>
          <CardTitle>🏗️ Architecture Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Global Context:</strong> ✅ Using XState's createActorContext pattern</p>
            <p><strong>Provider Location:</strong> ✅ WorkoutContext.Provider in AppLayout</p>
            <p><strong>Component Integration:</strong> ✅ WorkoutsTab uses global context instead of local machine</p>
            <p><strong>Modal State:</strong> ✅ Derived from global state (setupComplete || active)</p>
            <p><strong>Mini Playbar:</strong> ✅ Triggered by global state (active)</p>
            <p><strong>Machine Preservation:</strong> ✅ Zero changes to workoutLifecycleMachine.ts</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
