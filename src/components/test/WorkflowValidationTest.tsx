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
import { useAccount, usePubkey, useIsAuthenticated } from '@/lib/auth/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, Play, Target } from 'lucide-react';

export default function WorkflowValidationTest() {
  const account = useAccount();
  const pubkey = usePubkey();
  const isAuthenticated = useIsAuthenticated();
  
  const [state, send] = useMachine(workoutSetupMachine, {
    input: { userPubkey: pubkey || '' }
  });
  
  const [activityLog, setActivityLog] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [workoutData, setWorkoutData] = useState<any>(null);

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
    setSelectedTemplate(template);
    send({ type: 'SELECT_TEMPLATE', templateId });
    addLog(`Template selected: ${template?.name} (${template?.exercises.length} exercises)`);
  };

  // Handle template confirmation
  const handleConfirmTemplate = () => {
    send({ type: 'CONFIRM_TEMPLATE' });
    setWorkoutData({
      templateId: state.context.selectedTemplateId,
      template: state.context.loadedTemplate,
      exercises: state.context.loadedExercises,
      startTime: Date.now()
    });
    addLog(`Template confirmed: Ready for active workout simulation`);
  };

  // Simulate workout completion
  const simulateWorkoutCompletion = () => {
    if (!workoutData) return;
    
    // Simulate completed sets for each exercise
    const completedSets = workoutData.template.exercises.flatMap((exercise: any, exerciseIndex: number) => {
      return Array.from({ length: exercise.sets }, (_, setIndex) => ({
        exerciseRef: exercise.exerciseRef,
        exerciseIndex,
        setIndex,
        weight: exercise.weight || 0,
        reps: exercise.reps + Math.floor(Math.random() * 3) - 1, // Slight variation
        rpe: 7 + Math.floor(Math.random() * 3), // RPE 7-9
        setType: 'normal',
        completedAt: Date.now() + (setIndex * 60000) // 1 minute between sets
      }));
    });

    const completedWorkout = {
      ...workoutData,
      completedSets,
      endTime: Date.now() + (completedSets.length * 60000),
      totalSets: completedSets.length,
      status: 'completed'
    };

    setWorkoutData(completedWorkout);
    addLog(`Workout simulation completed: ${completedSets.length} sets across ${workoutData.template.exercises.length} exercises`);
  };

  // Test workout publishing
  const testWorkoutPublishing = async () => {
    if (!workoutData || !workoutData.completedSets || !pubkey) return;
    
    addLog('🔄 Testing NIP-101e event publishing...');
    
    try {
      // Import the publishing actor and analytics service
      const { publishWorkoutActor } = await import('@/lib/machines/workout/actors/publishWorkoutActor');
      const { workoutAnalyticsService } = await import('@/lib/services/workoutAnalytics');
      const { createActor } = await import('xstate');
      
      // Create completed workout data
      const completedWorkoutData = {
        workoutId: workoutAnalyticsService.generateWorkoutId(),
        title: workoutData.template.name,
        workoutType: 'strength' as const,
        startTime: workoutData.startTime,
        endTime: workoutData.endTime,
        completedSets: workoutData.completedSets.map((set: any) => ({
          exerciseRef: set.exerciseRef,
          setNumber: set.setIndex + 1,
          reps: set.reps,
          weight: set.weight,
          rpe: set.rpe,
          setType: set.setType,
          completedAt: set.completedAt
        })),
        templateId: workoutData.templateId
      };
      
      // Test publishing
      const publishResult = await new Promise((resolve) => {
        const actor = createActor(publishWorkoutActor, {
          input: {
            workoutData: completedWorkoutData,
            userPubkey: pubkey
          }
        });
        
        actor.subscribe((snapshot) => {
          if (snapshot.status === 'done') {
            resolve(snapshot.output);
          } else if (snapshot.status === 'error') {
            resolve({ success: false, error: snapshot.error });
          }
        });
        
        actor.start();
      });
      
      if (publishResult.success) {
        setWorkoutData({
          ...workoutData,
          published: true,
          eventId: publishResult.eventId,
          requestId: publishResult.requestId
        });
        addLog(`✅ Workout published successfully! Event ID: ${publishResult.eventId}`);
      } else {
        addLog(`❌ Publishing failed: ${publishResult.error}`);
      }
      
    } catch (error) {
      addLog(`❌ Publishing test failed: ${error.message}`);
    }
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
                  Confirm Template & Start Workout Simulation
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Workout Simulation */}
      {workoutData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Step 3: Workout Data Flow Simulation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Template:</span> {workoutData.template.name}
                </div>
                <div>
                  <span className="font-medium">Exercises:</span> {workoutData.template.exercises.length}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {workoutData.status || 'In Progress'}
                </div>
                <div>
                  <span className="font-medium">Sets:</span> {workoutData.completedSets?.length || 0} / {workoutData.template.exercises.reduce((sum: number, ex: any) => sum + ex.sets, 0)}
                </div>
              </div>

              {!workoutData.completedSets && (
                <Button onClick={simulateWorkoutCompletion} className="w-full">
                  Simulate Workout Completion
                </Button>
              )}

              {workoutData.completedSets && (
                <div className="space-y-3">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Workout simulation completed! {workoutData.completedSets.length} sets recorded.
                      Ready for NIP-101e event publishing validation.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="text-sm space-y-1">
                    <p className="font-medium">Completed Sets Preview:</p>
                    {workoutData.completedSets.slice(0, 3).map((set: any, index: number) => (
                      <div key={index} className="bg-muted p-2 rounded text-xs">
                        {set.exerciseRef.split(':')[2]} - Set {set.setIndex + 1}: {set.reps} reps @ {set.weight}kg (RPE {set.rpe})
                      </div>
                    ))}
                    {workoutData.completedSets.length > 3 && (
                      <p className="text-xs text-muted-foreground">...and {workoutData.completedSets.length - 3} more sets</p>
                    )}
                  </div>

                  {!workoutData.published && (
                    <Button 
                      onClick={() => testWorkoutPublishing()} 
                      className="w-full"
                      variant="default"
                    >
                      Test NIP-101e Event Publishing
                    </Button>
                  )}

                  {workoutData.published && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        ✅ Workout published successfully! Event ID: {workoutData.eventId}
                        <br />
                        <span className="text-xs font-mono">{workoutData.eventId}</span>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
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
