/**
 * Workout Lifecycle Machine Test Component
 * 
 * Tests the XState workout lifecycle machine with proper patterns
 */

'use client';

import React, { useState } from 'react';
import { createActor, type Actor } from 'xstate';
import { workoutLifecycleMachine } from '@/lib/machines/workout/workoutLifecycleMachine';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAccount, usePubkey, useIsAuthenticated } from '@/lib/auth/hooks';

const WorkoutLifecycleMachineTest: React.FC = () => {
  const [actor, setActor] = useState<Actor<typeof workoutLifecycleMachine> | null>(null);
  const [currentState, setCurrentState] = useState<string>('Not Started');
  const [logs, setLogs] = useState<string[]>([]);
  
  // Get real authenticated user data
  const account = useAccount();
  const pubkey = usePubkey();
  const isAuthenticated = useIsAuthenticated();

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const startMachine = () => {
    // Use real authenticated user data instead of test data
    if (!isAuthenticated || !pubkey) {
      addLog('❌ Error: User not authenticated. Please login first.');
      return;
    }

    const userInfo = {
      pubkey: pubkey, // Use REAL authenticated user's pubkey
      displayName: account?.npub?.slice(0, 16) + '...' || 'Authenticated User'
    };

    addLog(`✅ Using authenticated user: ${pubkey.slice(0, 16)}...`);

    const newActor = createActor(workoutLifecycleMachine, {
      input: {
        userInfo: userInfo,
        preselectedTemplateId: 'test-template-123'
      }
    });

    newActor.subscribe((snapshot) => {
      // Handle nested state values properly
      const stateValue = typeof snapshot.value === 'object' 
        ? JSON.stringify(snapshot.value) 
        : snapshot.value as string;
      setCurrentState(stateValue);
      addLog(`State: ${stateValue}`);
    });

    newActor.start();
    setActor(newActor);
    addLog('Workout lifecycle machine started');
  };

  const startSetup = () => {
    if (actor) {
      actor.send({ 
        type: 'START_SETUP', 
        preselectedTemplateId: 'test-template-123' 
      });
      addLog('Sent START_SETUP event');
    }
  };

  const pauseWorkout = () => {
    if (actor) {
      actor.send({ type: 'WORKOUT_PAUSED' });
      addLog('Sent WORKOUT_PAUSED event');
    }
  };

  const resumeWorkout = () => {
    if (actor) {
      actor.send({ type: 'WORKOUT_RESUMED' });
      addLog('Sent WORKOUT_RESUMED event');
    }
  };

  const completeWorkout = () => {
    if (actor) {
      // Create realistic workout completion data with proper exercise references
      const workoutId = `legs-workout-bodyweight-${Date.now()}`;
      const startTime = Date.now() - 1800000; // 30 minutes ago
      const endTime = Date.now();
      
      // Use authenticated user's pubkey for exercise references
      const completedSets = [
        {
          exerciseRef: `33401:${pubkey}:bodyweight-squats`,
          setNumber: 1,
          reps: 15,
          weight: 0,
          rpe: 6,
          setType: 'warmup' as const,
          completedAt: startTime + 300000 // 5 minutes in
        },
        {
          exerciseRef: `33401:${pubkey}:bodyweight-squats`,
          setNumber: 2,
          reps: 12,
          weight: 0,
          rpe: 7,
          setType: 'normal' as const,
          completedAt: startTime + 600000 // 10 minutes in
        },
        {
          exerciseRef: `33401:${pubkey}:bodyweight-squats`,
          setNumber: 3,
          reps: 10,
          weight: 0,
          rpe: 8,
          setType: 'normal' as const,
          completedAt: startTime + 900000 // 15 minutes in
        },
        {
          exerciseRef: `33401:${pubkey}:lunges`,
          setNumber: 1,
          reps: 10,
          weight: 0,
          rpe: 7,
          setType: 'normal' as const,
          completedAt: startTime + 1200000 // 20 minutes in
        },
        {
          exerciseRef: `33401:${pubkey}:lunges`,
          setNumber: 2,
          reps: 8,
          weight: 0,
          rpe: 8,
          setType: 'normal' as const,
          completedAt: startTime + 1500000 // 25 minutes in
        }
      ];

      actor.send({ 
        type: 'WORKOUT_COMPLETED',
        workoutData: {
          workoutId,
          title: 'POWR Test Legs Workout',
          startTime,
          endTime,
          completedSets,
          workoutType: 'strength',
          notes: 'Great bodyweight leg workout! Feeling strong and energized.'
        }
      });
      addLog(`Sent WORKOUT_COMPLETED event with ${completedSets.length} completed sets`);
    }
  };

  const cancelWorkout = () => {
    if (actor) {
      actor.send({ type: 'WORKOUT_CANCELLED' });
      addLog('Sent WORKOUT_CANCELLED event');
    }
  };

  const stopMachine = () => {
    if (actor) {
      actor.stop();
      setActor(null);
      setCurrentState('Stopped');
      addLog('Workout lifecycle machine stopped');
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🏋️ Workout Lifecycle Machine Test</CardTitle>
        <p className="text-sm text-muted-foreground">
          Test the XState workout lifecycle machine following Noga patterns
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current State Display */}
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Current State</h3>
          <div className="text-lg font-mono">{currentState}</div>
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button 
            onClick={startMachine} 
            disabled={!!actor}
            variant="default"
          >
            Start Machine
          </Button>
          <Button 
            onClick={stopMachine} 
            disabled={!actor}
            variant="destructive"
          >
            Stop Machine
          </Button>
          <Button 
            onClick={startSetup} 
            disabled={!actor || currentState !== 'idle'}
            variant="outline"
          >
            Start Setup
          </Button>
          <Button 
            onClick={pauseWorkout} 
            disabled={!actor || !currentState.includes('active')}
            variant="outline"
          >
            Pause Workout
          </Button>
          <Button 
            onClick={resumeWorkout} 
            disabled={!actor || !currentState.includes('active')}
            variant="outline"
          >
            Resume Workout
          </Button>
          <Button 
            onClick={completeWorkout} 
            disabled={!actor || !currentState.includes('active')}
            variant="outline"
          >
            Complete Workout
          </Button>
          <Button 
            onClick={cancelWorkout} 
            disabled={!actor || currentState === 'idle'}
            variant="outline"
            className="col-span-3"
          >
            Cancel Workout
          </Button>
        </div>

        {/* Activity Log */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Activity Log</h3>
            <Button onClick={clearLogs} variant="ghost" size="sm">
              Clear
            </Button>
          </div>
          <div className="max-h-48 overflow-y-auto bg-muted p-3 rounded-lg">
            {logs.length === 0 ? (
              <div className="text-muted-foreground text-sm">No activity yet</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-sm font-mono">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Machine Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>✅ XState v5 setup() pattern</div>
          <div>✅ fromPromise actors for async operations</div>
          <div>✅ spawnChild for spawned actors</div>
          <div>✅ Proper TypeScript types</div>
          <div>✅ NDK-first architecture ready</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkoutLifecycleMachineTest;
