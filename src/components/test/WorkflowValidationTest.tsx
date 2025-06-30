'use client';

/**
 * Workflow Validation Test Component
 * 
 * Basic functional test component that validates the complete workout data flow:
 * 1. Template selection from real Phase 1 content
 * 2. Exercise progression with set completion tracking
 * 3. Complete NIP-101e event publishing
 * 4. Event verification on Nostr network
 * 
 * NO UI design - purely functional validation.
 */

import React, { useState, useEffect } from 'react';
import { useMachine } from '@xstate/react';
import { workoutSetupMachine } from '@/lib/machines/workout/workoutSetupMachine';
import { activeWorkoutMachine } from '@/lib/machines/workout/activeWorkoutMachine';
import { usePubkey, useIsAuthenticated } from '@/lib/auth/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, Play, Target } from 'lucide-react';
import type { WorkoutTemplate } from '@/lib/machines/workout/types/workoutTypes';

export default function WorkflowValidationTest() {
  const pubkey = usePubkey();
  const isAuthenticated = useIsAuthenticated();
  
  const [state, send] = useMachine(workoutSetupMachine, {
    input: { userPubkey: pubkey || '' }
  });
  
  const [activityLog, setActivityLog] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [workoutData, setWorkoutData] = useState<{
    templateId?: string;
    template?: WorkoutTemplate;
    exercises?: unknown[];
    startTime: number;
  } | null>(null);
  const [activeWorkoutState, sendActiveWorkout] = useMachine(activeWorkoutMachine, {
    input: {
      userInfo: {
        pubkey: pubkey || '',
        displayName: 'Test User'
      },
      workoutData: {
        workoutId: 'test-workout-' + Date.now(),
        title: 'Test Workout',
        startTime: Date.now(),
        workoutType: 'strength' as const,
        exercises: [],
        completedSets: []
      },
      templateSelection: {
        templateId: selectedTemplate?.id || '' // Use selected template ID if available
      }
    }
  });

  // Initialize userPubkey when authentication changes
  useEffect(() => {
    if (pubkey && state.context.userPubkey !== pubkey) {
      // Update context with real pubkey
      send({ type: 'LOAD_TEMPLATES' });
      addLog(`Authentication detected: ${pubkey.slice(0, 8)}...`);
    }
  }, [pubkey, send, state.context.userPubkey]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setActivityLog(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    const template = state.context.availableTemplates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
    send({ type: 'SELECT_TEMPLATE', templateId });
    addLog(`Template selected: ${template?.name} (${template?.exercises.length} exercises)`);
  };

  // Handle template confirmation
  const handleConfirmTemplate = () => {
    send({ type: 'CONFIRM_TEMPLATE' });
    setWorkoutData({
      templateId: state.context.selectedTemplateId || undefined,
      template: state.context.loadedTemplate || undefined,
      exercises: state.context.loadedExercises,
      startTime: Date.now()
    });
    addLog(`Template confirmed: Ready for active workout simulation`);
  };

  // Authentication check
  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Workflow Validation Test
          </CardTitle>
          <CardDescription>
            End-to-end workout data flow validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please authenticate to test the workout workflow. This test requires access to your Phase 1 test content.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Workflow Validation Test
          </CardTitle>
          <CardDescription>
            Testing complete data flow: Template Selection → Exercise Progression → Event Publishing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant="outline">User: {pubkey?.slice(0, 8)}...</Badge>
            <Badge variant={state.matches('error') ? 'destructive' : 'default'}>
              State: {state.value.toString()}
            </Badge>
            {state.context.loadTime > 0 && (
              <Badge variant="secondary">Load Time: {state.context.loadTime}ms</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Template Loading */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Step 1: Template Loading
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {state.matches('idle') && (
              <Button 
                onClick={() => send({ type: 'LOAD_TEMPLATES' })}
                className="w-full"
              >
                Load Available Templates
              </Button>
            )}

            {state.matches('loadingTemplates') && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading templates from NDK...</p>
              </div>
            )}

            {state.matches('templateSelection') && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Available Templates ({state.context.availableTemplates.length}):</p>
                {state.context.availableTemplates.map((template) => (
                  <div key={template.id} className="border rounded p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {template.exercises.length} exercises • {template.difficulty} • {template.estimatedDuration}s
                        </p>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => handleTemplateSelect(template.id)}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {state.matches('error') && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {state.context.error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Template Confirmation */}
      {(state.matches('loadingTemplate') || state.matches('templateLoaded')) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Step 2: Template Confirmation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {state.matches('loadingTemplate') && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading template details...</p>
              </div>
            )}

            {state.matches('templateLoaded') && state.context.loadedTemplate && (
              <div className="space-y-4">
                <div className="border rounded p-4">
                  <h3 className="font-medium">{state.context.loadedTemplate.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{state.context.loadedTemplate.description}</p>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Exercises ({state.context.loadedTemplate.exercises.length}):</p>
                    {state.context.loadedTemplate.exercises.map((exercise, index) => (
                      <div key={index} className="text-sm bg-muted p-2 rounded">
                        <span className="font-medium">{exercise.exerciseRef.split(':')[2]}</span>
                        <span className="text-muted-foreground ml-2">
                          {exercise.sets} sets × {exercise.reps} reps
                          {exercise.weight ? ` @ ${exercise.weight}kg` : ' (bodyweight)'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleConfirmTemplate} className="w-full">
                  Confirm Template & Start Active Workout Machine
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Active Workout Machine - Real Workout Execution */}
      {workoutData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Step 3: Active Workout Execution
            </CardTitle>
            <CardDescription>
              Complete workout flow: sets → exercises → navigation → completion → publishing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Machine State:</span> {typeof activeWorkoutState.value === 'string' ? activeWorkoutState.value : JSON.stringify(activeWorkoutState.value)}
                </div>
                <div>
                  <span className="font-medium">Current Exercise:</span> {activeWorkoutState.context.exerciseProgression.currentExerciseIndex + 1} of {activeWorkoutState.context.exerciseProgression.totalExercises}
                </div>
                <div>
                  <span className="font-medium">Current Set:</span> {activeWorkoutState.context.exerciseProgression.currentSetNumber}
                </div>
                <div>
                  <span className="font-medium">Publishing:</span> {activeWorkoutState.context.publishingStatus.isPublishing ? 'Yes' : 'No'}
                </div>
              </div>

              {/* Machine Controls */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {activeWorkoutState.matches('loadingTemplate') && (
                  <div className="col-span-full text-center py-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-1 text-sm text-muted-foreground">Loading template...</p>
                  </div>
                )}

                {/* Show controls for any exercising state */}
                {activeWorkoutState.matches('exercising') && (
                  <>
                    {/* Always show these basic controls when exercising */}
                    <Button
                      size="sm"
                      onClick={() => sendActiveWorkout({
                        type: 'COMPLETE_SET'
                        // Machine auto-generates all set data from template + progression
                      })}
                      disabled={!activeWorkoutState.matches({ exercising: 'performingSet' })}
                    >
                      Complete Set
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendActiveWorkout({ type: 'PREVIOUS_EXERCISE' })}
                      disabled={!activeWorkoutState.can({ type: 'PREVIOUS_EXERCISE' })}
                    >
                      Previous Exercise
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendActiveWorkout({ type: 'NEXT_EXERCISE' })}
                      disabled={!activeWorkoutState.can({ type: 'NEXT_EXERCISE' })}
                    >
                      Next Exercise
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => sendActiveWorkout({ type: 'PAUSE_WORKOUT' })}
                    >
                      Pause
                    </Button>

                    {/* Rest period specific control */}
                    {activeWorkoutState.matches({ exercising: 'restPeriod' }) && (
                      <Button
                        size="sm"
                        onClick={() => sendActiveWorkout({ type: 'END_REST_PERIOD' })}
                      >
                        Skip Rest
                      </Button>
                    )}

                    {/* Between exercises control */}
                    {activeWorkoutState.matches({ exercising: 'betweenExercises' }) && (
                      <Button
                        size="sm"
                        onClick={() => sendActiveWorkout({ type: 'START_EXERCISE', exerciseIndex: 0 })}
                      >
                        Start Exercise
                      </Button>
                    )}
                  </>
                )}

                {activeWorkoutState.matches('paused') && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => sendActiveWorkout({ type: 'RESUME_WORKOUT' })}
                    >
                      Resume
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendActiveWorkout({ type: 'COMPLETE_WORKOUT' })}
                      disabled={!activeWorkoutState.can({ type: 'COMPLETE_WORKOUT' })}
                    >
                      Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => sendActiveWorkout({ type: 'CANCEL_WORKOUT' })}
                    >
                      Cancel
                    </Button>
                  </>
                )}

                {activeWorkoutState.matches('publishing') && (
                  <div className="col-span-full text-center py-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-1 text-sm text-muted-foreground">Publishing workout...</p>
                  </div>
                )}

                {activeWorkoutState.matches('showingSummary') && (
                  <Button
                    size="sm"
                    onClick={() => sendActiveWorkout({ type: 'DISMISS_SUMMARY' })}
                  >
                    Dismiss Summary
                  </Button>
                )}

                {activeWorkoutState.matches('error') && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => sendActiveWorkout({ type: 'RETRY_OPERATION' })}
                  >
                    Retry
                  </Button>
                )}

                {/* Debug: Show current state details */}
                <div className="col-span-full mt-2 p-2 bg-muted rounded text-xs">
                  <p><strong>Debug State:</strong> {JSON.stringify(activeWorkoutState.value)}</p>
                  <p><strong>Can Complete Set:</strong> {activeWorkoutState.can({ type: 'COMPLETE_SET', setData: { exerciseRef: 'test', setNumber: 1, reps: 10, weight: 0, rpe: 7, setType: 'normal', completedAt: Date.now() } }) ? 'Yes' : 'No'}</p>
                  <p><strong>Can Next Exercise:</strong> {activeWorkoutState.can({ type: 'NEXT_EXERCISE' }) ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {/* Machine Context Display */}
              {activeWorkoutState.context.currentSetData && (
                <div className="p-3 bg-muted rounded">
                  <p className="text-sm font-medium mb-2">Current Set Data:</p>
                  <div className="text-xs space-y-1">
                    <p><strong>Exercise:</strong> {activeWorkoutState.context.currentSetData.exerciseRef}</p>
                    <p><strong>Set:</strong> {activeWorkoutState.context.currentSetData.setNumber}</p>
                    <p><strong>Planned:</strong> {activeWorkoutState.context.currentSetData.plannedReps} reps @ {activeWorkoutState.context.currentSetData.plannedWeight}kg</p>
                  </div>
                </div>
              )}

              {/* Final Output */}
              {(activeWorkoutState.matches('final') || activeWorkoutState.matches('cancelled')) && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Active Workout Machine Complete!</strong>
                    <pre className="text-xs mt-2 bg-white p-2 rounded border overflow-auto">
                      {JSON.stringify(activeWorkoutState.output, null, 2)}
                    </pre>
                    <div className="mt-3">
                      <Button
                        size="sm"
                        onClick={() => {
                          // Reset the workflow to start over
                          setWorkoutData(null);
                          setSelectedTemplate(null);
                          addLog('🔄 Restarting workout workflow...');
                          // Send reset event to setup machine
                          send({ type: 'LOAD_TEMPLATES' });
                        }}
                      >
                        Start New Workout
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-xs text-muted-foreground">
                <p><strong>Machine Info:</strong> This demonstrates the activeWorkoutMachine following Noga&apos;s patterns exactly.</p>
                <p>The machine handles workout execution, set tracking, exercise navigation, and NDK publishing.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {activityLog.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet...</p>
            ) : (
              activityLog.map((log, index) => (
                <div key={index} className="text-xs font-mono bg-muted p-2 rounded">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
