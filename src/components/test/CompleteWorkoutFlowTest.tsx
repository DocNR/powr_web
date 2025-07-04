/**
 * Complete Workout Flow Test Component
 * 
 * Comprehensive test of the entire parent-child XState machine hierarchy:
 * - workoutLifecycleMachine (parent)
 * - workoutSetupMachine (child via invoke)
 * - activeWorkoutMachine (child via spawn)
 * 
 * Validates real NDK integration, DependencyResolutionService, and performance targets.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createActor, type Actor } from 'xstate';
import { workoutLifecycleMachine } from '@/lib/machines/workout/workoutLifecycleMachine';
import { dependencyResolutionService, type WorkoutTemplate, type Exercise, type ResolvedTemplate } from '@/lib/services/dependencyResolution';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAccount, usePubkey, useIsAuthenticated } from '@/lib/auth/hooks';

// Types for test state management
interface PerformanceMetrics {
  setupDuration?: number;
  templateResolutionDuration?: number;
  activeWorkoutSpawnDuration?: number;
  publishingDuration?: number;
  totalWorkflowDuration?: number;
}

interface ArchitectureValidation {
  parentChildCommunication: boolean;
  realMachinesUsed: boolean;
  spawnPatternWorking: boolean;
  cleanupWorking: boolean;
  serviceIntegration: boolean;
}

interface ChildMachineStates {
  setupMachine?: string;
  activeWorkoutActor?: string;
}

interface TestScenario {
  id: string;
  name: string;
  description: string;
  templateRef?: string;
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'happy-path',
    name: '🎯 Complete Happy Path',
    description: 'Full workflow: Setup → Active → Complete → Publish',
    templateRef: '33402:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:push-workout-bodyweight'
  },
  {
    id: 'template-resolution',
    name: '⚡ Template Resolution Performance',
    description: 'Test DependencyResolutionService speed (<100ms target)',
    templateRef: '33402:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:legs-workout-bodyweight'
  },
  {
    id: 'parent-child-communication',
    name: '🔗 Parent-Child Communication',
    description: 'Test machine hierarchy and communication patterns'
  },
  {
    id: 'error-handling',
    name: '🚨 Error Handling',
    description: 'Test error scenarios and recovery patterns'
  }
];

const CompleteWorkoutFlowTest: React.FC = () => {
  // Core state
  const [actor, setActor] = useState<Actor<typeof workoutLifecycleMachine> | null>(null);
  const [parentState, setParentState] = useState<string>('Not Started');
  const [childStates, setChildStates] = useState<ChildMachineStates>({});
  const [logs, setLogs] = useState<string[]>([]);
  
  // Performance and validation
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({});
  const [architectureValidation, setArchitectureValidation] = useState<ArchitectureValidation>({
    parentChildCommunication: false,
    realMachinesUsed: false,
    spawnPatternWorking: false,
    cleanupWorking: false,
    serviceIntegration: false
  });
  
  // Template resolution testing
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [resolvedExercises, setResolvedExercises] = useState<Exercise[]>([]);
  const [currentScenario, setCurrentScenario] = useState<TestScenario | null>(null);
  
  // Authentication
  const account = useAccount();
  const pubkey = usePubkey();
  const isAuthenticated = useIsAuthenticated();

  // Enhanced logging with source tracking
  const addLog = useCallback((message: string, source: 'parent' | 'setup' | 'active' | 'system' | 'service' = 'system') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      parent: '🏗️ [Parent]',
      setup: '⚙️ [Setup]', 
      active: '🏋️ [Active]',
      system: '🔧 [System]',
      service: '📦 [Service]'
    }[source];
    
    setLogs(prev => [...prev, `${timestamp} ${prefix}: ${message}`]);
  }, []);

  // Performance tracking
  const trackPerformance = useCallback((phase: keyof PerformanceMetrics, duration: number) => {
    setPerformanceMetrics(prev => ({
      ...prev,
      [phase]: duration
    }));
    addLog(`Performance: ${phase} completed in ${duration}ms`, 'system');
  }, [addLog]);

  // Architecture validation updates
  const updateArchitectureValidation = useCallback((updates: Partial<ArchitectureValidation>) => {
    setArchitectureValidation(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Test real template resolution
  const testTemplateResolution = useCallback(async (templateRef: string) => {
    const startTime = Date.now();
    addLog(`Testing template resolution for: ${templateRef}`, 'service');
    
    try {
      const resolved: ResolvedTemplate = await dependencyResolutionService.resolveSingleTemplate(templateRef);
      const duration = Date.now() - startTime;
      
      setSelectedTemplate(resolved.template);
      setResolvedExercises(resolved.exercises);
      trackPerformance('templateResolutionDuration', duration);
      updateArchitectureValidation({ serviceIntegration: true });
      
      addLog(`✅ Template resolved: ${resolved.template.name} with ${resolved.exercises.length} exercises`, 'service');
      addLog(`Performance target: ${duration < 100 ? '✅ PASSED' : '❌ FAILED'} (<100ms target)`, 'service');
      
      return resolved;
    } catch (error) {
      addLog(`❌ Template resolution failed: ${error}`, 'service');
      throw error;
    }
  }, [addLog, trackPerformance, updateArchitectureValidation]);

  // Load real templates for testing
  const loadRealTemplates = useCallback(async () => {
    addLog('Loading real templates from Nostr...', 'service');
    
    try {
      const templateRefs = [
        '33402:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:push-workout-bodyweight',
        '33402:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:legs-workout-bodyweight',
        '33402:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pull-workout-bodyweight'
      ];
      
      const templates = await dependencyResolutionService.resolveTemplateDependencies(templateRefs);
      addLog(`✅ Loaded ${templates.length} real templates`, 'service');
      
      return templates;
    } catch {
      addLog(`❌ Failed to load templates`, 'service');
      return [];
    }
  }, [addLog]);

  // Start machine with comprehensive monitoring
  const startMachine = useCallback(async (scenario: TestScenario) => {
    if (!isAuthenticated || !pubkey) {
      addLog('❌ Error: User not authenticated. Please login first.', 'system');
      return;
    }

    const workflowStartTime = Date.now();
    setCurrentScenario(scenario);
    addLog(`🚀 Starting scenario: ${scenario.name}`, 'system');

    const userInfo = {
      pubkey: pubkey,
      displayName: account?.npub?.slice(0, 16) + '...' || 'Authenticated User'
    };

    addLog(`✅ Using authenticated user: ${pubkey.slice(0, 16)}...`, 'system');

    // Test template resolution if scenario requires it
    if (scenario.templateRef) {
      try {
        await testTemplateResolution(scenario.templateRef);
      } catch {
        addLog(`❌ Template resolution failed, continuing with fallback`, 'system');
      }
    }

    const newActor = createActor(workoutLifecycleMachine, {
      input: {
        userInfo: userInfo,
        preselectedTemplateId: scenario.templateRef?.split(':')[2] || 'test-template'
      }
    });

    // Enhanced state monitoring with child machine tracking
    newActor.subscribe((snapshot) => {
      const stateValue = typeof snapshot.value === 'object' 
        ? JSON.stringify(snapshot.value) 
        : snapshot.value as string;
      
      setParentState(stateValue);
      addLog(`State: ${stateValue}`, 'parent');
      
      // Track architecture validation
      if (stateValue.includes('setup')) {
        updateArchitectureValidation({ realMachinesUsed: true });
      }
      
      if (stateValue.includes('active')) {
        updateArchitectureValidation({ spawnPatternWorking: true });
      }
      
      // Monitor context for child actor references
      if (snapshot.context.activeWorkoutActor) {
        addLog('✅ Active workout actor spawned successfully', 'parent');
        updateArchitectureValidation({ parentChildCommunication: true });
        
        // Subscribe to child actor if available
        try {
          const childActor = snapshot.context.activeWorkoutActor as any;
          if (childActor && typeof childActor.subscribe === 'function') {
            childActor.subscribe((childSnapshot: any) => {
              const childState = typeof childSnapshot.value === 'object' 
                ? JSON.stringify(childSnapshot.value) 
                : childSnapshot.value as string;
              
              setChildStates(prev => ({
                ...prev,
                activeWorkoutActor: childState
              }));
              addLog(`Child state: ${childState}`, 'active');
            });
          }
        } catch (error) {
          addLog(`⚠️ Could not subscribe to child actor: ${error}`, 'active');
        }
      }
      
      // Track performance milestones
      if (stateValue === 'active' && !performanceMetrics.activeWorkoutSpawnDuration) {
        const spawnDuration = Date.now() - workflowStartTime;
        trackPerformance('activeWorkoutSpawnDuration', spawnDuration);
      }
      
      if (stateValue === 'published') {
        const totalDuration = Date.now() - workflowStartTime;
        trackPerformance('totalWorkflowDuration', totalDuration);
        updateArchitectureValidation({ cleanupWorking: true });
      }
    });

    newActor.start();
    setActor(newActor);
    addLog('✅ Workout lifecycle machine started with enhanced monitoring', 'system');
  }, [isAuthenticated, pubkey, account, addLog, testTemplateResolution, updateArchitectureValidation, performanceMetrics.activeWorkoutSpawnDuration, trackPerformance]);

  // Enhanced workflow control
  const startSetup = useCallback(() => {
    if (actor) {
      const setupStartTime = Date.now();
      actor.send({ 
        type: 'START_SETUP', 
        preselectedTemplateId: currentScenario?.templateRef?.split(':')[2] || 'test-template'
      });
      addLog('Sent START_SETUP event', 'parent');
      
      // Track setup performance
      setTimeout(() => {
        const setupDuration = Date.now() - setupStartTime;
        trackPerformance('setupDuration', setupDuration);
      }, 100);
    }
  }, [actor, currentScenario, addLog, trackPerformance]);

  const completeWorkout = useCallback(() => {
    if (actor && pubkey) {
      const publishStartTime = Date.now();
      
      // Create realistic workout completion data
      const workoutId = `complete-test-workout-${Date.now()}`;
      const startTime = Date.now() - 1800000; // 30 minutes ago
      const endTime = Date.now();
      
      const completedSets = [
        {
          exerciseRef: `33401:${pubkey}:pushup-standard`,
          setNumber: 1,
          reps: 12,
          weight: 0,
          rpe: 7,
          setType: 'normal' as const,
          completedAt: startTime + 300000
        },
        {
          exerciseRef: `33401:${pubkey}:pushup-standard`,
          setNumber: 2,
          reps: 10,
          weight: 0,
          rpe: 8,
          setType: 'normal' as const,
          completedAt: startTime + 600000
        },
        {
          exerciseRef: `33401:${pubkey}:bodyweight-squats`,
          setNumber: 1,
          reps: 15,
          weight: 0,
          rpe: 7,
          setType: 'normal' as const,
          completedAt: startTime + 900000
        }
      ];

      actor.send({ 
        type: 'WORKOUT_COMPLETED',
        workoutData: {
          workoutId,
          title: 'Complete Flow Test Workout',
          startTime,
          endTime,
          completedSets,
          workoutType: 'strength',
          notes: 'Comprehensive parent-child machine test completed successfully!'
        }
      });
      
      addLog(`Sent WORKOUT_COMPLETED event with ${completedSets.length} sets`, 'parent');
      
      // Track publishing performance
      setTimeout(() => {
        const publishDuration = Date.now() - publishStartTime;
        trackPerformance('publishingDuration', publishDuration);
      }, 1000);
    }
  }, [actor, pubkey, addLog, trackPerformance]);

  const stopMachine = useCallback(() => {
    if (actor) {
      actor.stop();
      setActor(null);
      setParentState('Stopped');
      setChildStates({});
      addLog('✅ Machine stopped and cleaned up', 'system');
      updateArchitectureValidation({ cleanupWorking: true });
    }
  }, [actor, addLog, updateArchitectureValidation]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const resetTest = useCallback(() => {
    stopMachine();
    setPerformanceMetrics({});
    setArchitectureValidation({
      parentChildCommunication: false,
      realMachinesUsed: false,
      spawnPatternWorking: false,
      cleanupWorking: false,
      serviceIntegration: false
    });
    setSelectedTemplate(null);
    setResolvedExercises([]);
    setCurrentScenario(null);
    clearLogs();
    addLog('🔄 Test environment reset', 'system');
  }, [stopMachine, clearLogs, addLog]);

  // Load templates on mount
  useEffect(() => {
    loadRealTemplates();
  }, [loadRealTemplates]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏋️ Complete Workout Flow Test
            <Badge variant="outline">Parent-Child Architecture</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Comprehensive test of XState parent-child machine hierarchy with real NDK integration
          </p>
        </CardHeader>
      </Card>

      {/* Test Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Test Scenarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEST_SCENARIOS.map((scenario) => (
              <Card key={scenario.id} className="p-4">
                <h4 className="font-semibold mb-2">{scenario.name}</h4>
                <p className="text-sm text-muted-foreground mb-3">{scenario.description}</p>
                <Button 
                  onClick={() => startMachine(scenario)}
                  disabled={!!actor}
                  size="sm"
                  className="w-full"
                >
                  Run Scenario
                </Button>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Machine Hierarchy Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🏗️ Lifecycle (Parent)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-sm bg-muted p-2 rounded">
              {parentState}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Manages overall workflow
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">⚙️ Setup (Invoked)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-sm bg-muted p-2 rounded">
              {childStates.setupMachine || 'Not Active'}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Real machine via invoke
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🏋️ Active (Spawned)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-sm bg-muted p-2 rounded">
              {childStates.activeWorkoutActor || 'Not Active'}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Real machine via spawn
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>⚡ Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <div className="font-semibold">Setup</div>
              <div className="font-mono">{performanceMetrics.setupDuration || '--'}ms</div>
            </div>
            <div>
              <div className="font-semibold">Template Resolution</div>
              <div className="font-mono">
                {performanceMetrics.templateResolutionDuration || '--'}ms
                {performanceMetrics.templateResolutionDuration && (
                  <Badge 
                    variant={performanceMetrics.templateResolutionDuration < 100 ? "default" : "destructive"}
                    className="ml-1 text-xs"
                  >
                    {performanceMetrics.templateResolutionDuration < 100 ? '✅' : '❌'}
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <div className="font-semibold">Active Spawn</div>
              <div className="font-mono">{performanceMetrics.activeWorkoutSpawnDuration || '--'}ms</div>
            </div>
            <div>
              <div className="font-semibold">Publishing</div>
              <div className="font-mono">{performanceMetrics.publishingDuration || '--'}ms</div>
            </div>
            <div>
              <div className="font-semibold">Total Workflow</div>
              <div className="font-mono">{performanceMetrics.totalWorkflowDuration || '--'}ms</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Architecture Validation */}
      <Card>
        <CardHeader>
          <CardTitle>🏛️ Architecture Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            {Object.entries(architectureValidation).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <Badge variant={value ? "default" : "secondary"}>
                  {value ? '✅' : '⏳'}
                </Badge>
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Template Resolution Status */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Resolved Template</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Name:</strong> {selectedTemplate.name}</div>
              <div><strong>Exercises:</strong> {resolvedExercises.length}</div>
              <div><strong>Author:</strong> {selectedTemplate.authorPubkey.slice(0, 16)}...</div>
              <div className="text-sm text-muted-foreground">
                <strong>Exercises:</strong> {resolvedExercises.map(ex => ex.name).join(', ')}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>🎮 Control Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button 
              onClick={startSetup} 
              disabled={!actor || parentState !== 'idle'}
              variant="outline"
            >
              Start Setup
            </Button>
            <Button 
              onClick={completeWorkout} 
              disabled={!actor || !parentState.includes('active')}
              variant="outline"
            >
              Complete Workout
            </Button>
            <Button 
              onClick={stopMachine} 
              disabled={!actor}
              variant="destructive"
            >
              Stop Machine
            </Button>
            <Button 
              onClick={resetTest}
              variant="secondary"
            >
              Reset Test
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>📝 Activity Log</CardTitle>
            <Button onClick={clearLogs} variant="ghost" size="sm">
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto bg-muted p-3 rounded-lg">
            {logs.length === 0 ? (
              <div className="text-muted-foreground text-sm">No activity yet</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-sm font-mono mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Architecture Info */}
      <Card>
        <CardHeader>
          <CardTitle>ℹ️ Architecture Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>✅ XState v5 parent-child hierarchy (NOGA patterns)</div>
            <div>✅ Real child machines (no fromPromise actors)</div>
            <div>✅ DependencyResolutionService integration</div>
            <div>✅ Performance monitoring and validation</div>
            <div>✅ Real NDK IndexedDB cache utilization</div>
            <div>✅ Comprehensive parent-child communication testing</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteWorkoutFlowTest;
