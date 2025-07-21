'use client';

import React, { useState } from 'react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/powr-ui/primitives/Card';
import { useWorkoutContext } from '@/hooks/useWorkoutContext';
import { WorkoutMiniBar } from '@/components/powr-ui/workout/WorkoutMiniBar';
import { WorkoutDetailModal } from '@/components/powr-ui/workout/WorkoutDetailModal';

export const GlobalWorkoutStatePersistenceValidationTest: React.FC = () => {
  const { workoutState: state, workoutSend: send } = useWorkoutContext();
  const [showModal, setShowModal] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runPersistenceTest = () => {
    addTestResult('🧪 Starting Global Workout State Persistence Test');
    
    // Test 1: Initial state validation
    addTestResult(`✅ Initial state: ${state.value}`);
    addTestResult(`✅ Context available: ${state ? 'YES' : 'NO'}`);
    
    // Test 2: Start a mock workout
    const mockWorkoutData = {
      id: 'test-workout-123',
      title: 'Test Persistence Workout',
      description: 'Testing global state persistence',
      exercises: [
        { name: 'Push-ups', sets: 3, reps: 10 },
        { name: 'Squats', sets: 3, reps: 15 }
      ]
    };

    send({
      type: 'START_WORKOUT',
      workoutData: mockWorkoutData,
    });
    
    addTestResult('✅ Sent START_WORKOUT event to global context');
  };

  const testMiniBarVisibility = () => {
    const isWorkoutActive = state.matches('workoutActive');
    addTestResult(`🔍 Workout active state: ${isWorkoutActive ? 'ACTIVE' : 'INACTIVE'}`);
    
    if (isWorkoutActive) {
      addTestResult('✅ Mini bar should be visible across all tabs');
    } else {
      addTestResult('ℹ️ Mini bar hidden - no active workout');
    }
  };

  const testModalIntegration = () => {
    setShowModal(true);
    addTestResult('✅ Opening workout modal with global state integration');
  };

  const testStateTransitions = () => {
    addTestResult('🔄 Testing state transitions...');
    
    // Log current state details
    addTestResult(`Current state: ${JSON.stringify(state.value)}`);
    addTestResult(`Context keys: ${Object.keys(state.context).join(', ')}`);
    
    if (state.context.selectedTemplate) {
      addTestResult(`✅ Selected template: ${state.context.selectedTemplate.title}`);
    }
    
    if (state.context.activeWorkoutActor) {
      addTestResult('✅ Active workout actor exists in global context');
    } else {
      addTestResult('ℹ️ No active workout actor in context');
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const isWorkoutActive = state.matches('workoutActive');
  const workoutTitle = state.context.selectedTemplate?.title || 'Test Workout';

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Global Workout State Persistence Validation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Current State</h3>
              <div className="text-sm space-y-1">
                <div>State: <code className="bg-gray-100 px-1 rounded">{JSON.stringify(state.value)}</code></div>
                <div>Workout Active: <span className={isWorkoutActive ? 'text-green-600' : 'text-gray-500'}>{isWorkoutActive ? 'YES' : 'NO'}</span></div>
                <div>Selected Template: {state.context.selectedTemplate?.title || 'None'}</div>
                <div>Active Actor: {state.context.activeWorkoutActor ? 'Present' : 'None'}</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Test Actions</h3>
              <div className="space-y-2">
                <Button onClick={runPersistenceTest} className="w-full" size="sm">
                  🧪 Run Persistence Test
                </Button>
                <Button onClick={testMiniBarVisibility} className="w-full" size="sm" variant="outline">
                  🔍 Test Mini Bar Visibility
                </Button>
                <Button onClick={testModalIntegration} className="w-full" size="sm" variant="outline">
                  📱 Test Modal Integration
                </Button>
                <Button onClick={testStateTransitions} className="w-full" size="sm" variant="outline">
                  🔄 Test State Transitions
                </Button>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Test Results</h3>
              <Button onClick={clearResults} size="sm" variant="ghost">Clear</Button>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg max-h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <div className="text-gray-500 text-sm">No test results yet. Run a test to see results.</div>
              ) : (
                <div className="space-y-1">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-sm font-mono">{result}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Manual Navigation Test</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>1. Click "Run Persistence Test" to start a workout</div>
              <div>2. Navigate to different tabs (Home, Progress, Profile)</div>
              <div>3. Verify the mini bar appears on all tabs</div>
              <div>4. Click the mini bar to expand the workout interface</div>
              <div>5. Return to Workouts tab - state should persist</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mini Bar Test Display */}
      {isWorkoutActive && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <WorkoutMiniBar
            workoutTitle={workoutTitle}
            elapsedTime={45000} // 45 seconds for demo
            isPaused={false}
            onExpand={() => {
              addTestResult('✅ Mini bar expand clicked - opening modal');
              setShowModal(true);
            }}
            onTogglePause={() => {
              addTestResult('⏸️ Mini bar pause/resume clicked');
            }}
          />
        </div>
      )}

      {/* Modal Test Integration */}
      <WorkoutDetailModal
        isOpen={showModal}
        isLoading={false}
        templateData={state.context.selectedTemplate}
        onClose={() => {
          setShowModal(false);
          addTestResult('✅ Modal closed - state should persist');
        }}
        onStartWorkout={() => {
          addTestResult('✅ Start workout clicked from modal');
          if (!isWorkoutActive) {
            send({ 
              type: 'START_WORKOUT', 
              templateData: state.context.selectedTemplate,
              templateRef: 'modal-start'
            });
          }
        }}
      />
    </div>
  );
};
