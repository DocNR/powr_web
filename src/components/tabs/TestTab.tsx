'use client';

import React from 'react';
import NDKDeduplicationTest from '@/components/test/NDKDeduplicationTest';
import WorkflowValidationTest from '@/components/test/WorkflowValidationTest';
import NIP101eTemplateReferenceTest from '@/components/test/NIP101eTemplateReferenceTest';
import { WorkoutDetailModalTest } from '@/components/test/WorkoutDetailModalTest';
import WorkoutLifecycleMachineIntegrationTest from '@/components/test/WorkoutLifecycleMachineIntegrationTest';
import ActiveWorkoutNIP101eTest from '@/components/test/ActiveWorkoutNIP101eTest';
import { DependencyResolutionServiceTest } from '@/components/test/DependencyResolutionServiceTest';
import CompleteWorkoutFlowTest from '@/components/test/CompleteWorkoutFlowTest';
import ParameterInterpretationTest from '@/components/test/ParameterInterpretationTest';
import TemplateReferenceCorruptionTest from '@/components/test/TemplateReferenceCorruptionTest';
import { WorkoutListManager } from '@/components/test/WorkoutListManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TestTube, Target, Wifi, WifiOff } from 'lucide-react';

/**
 * Test Tab - Workout Flow Testing
 * 
 * Contains essential test components for validating the complete workout workflow
 * and critical NDK functionality.
 */

export default function TestTab() {
  // Only render test components in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <TestTube className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Workout Flow Testing</h1>
          <p className="text-muted-foreground">
            Test complete workout workflows and critical NDK functionality
          </p>
        </div>
      </div>

      {/* Instructions */}
      <Alert>
        <Target className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p><strong>Testing Focus:</strong></p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Use Workflow Validation Test for complete end-to-end workout testing</li>
              <li>Use NDK Deduplication Test to verify set number fix</li>
              <li>These tests provide the foundation for building production UI</li>
              <li>Authenticate with NIP-07 extension for full functionality</li>
            </ol>
          </div>
        </AlertDescription>
      </Alert>

      {/* Test Components */}
      <div className="space-y-6">
        {/* 🎯 PRIMARY: Workflow Validation Test - UI Foundation */}
        <div className="w-full">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                🎯 PRIMARY: Complete Workout Flow Test
              </CardTitle>
              <CardDescription className="text-blue-700">
                Foundation for UI development. Test the complete user journey from template selection to workout completion.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkflowValidationTest />
            </CardContent>
          </Card>
        </div>

        {/* 🔴 CRITICAL: NDK Tag Deduplication Test */}
        <div className="w-full">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                🔴 CRITICAL: NDK Deduplication Fix Test
              </CardTitle>
              <CardDescription className="text-red-700">
                Verify the fix for silent data loss in workout sets. Essential for data integrity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NDKDeduplicationTest />
            </CardContent>
          </Card>
        </div>

        {/* 🔧 FIX: NIP-101e Template Reference Test */}
        <div className="w-full">
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800 flex items-center gap-2">
                🔧 FIX: NIP-101e Template Reference Test
              </CardTitle>
              <CardDescription className="text-orange-700">
                Test the corrected template reference format in workout records for NIP-101e compliance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NIP101eTemplateReferenceTest />
            </CardContent>
          </Card>
        </div>

        {/* 🎨 NEW: Workout Detail Modal Test */}
        <div className="w-full">
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-purple-800 flex items-center gap-2">
                🎨 NEW: Workout Detail Modal Test
              </CardTitle>
              <CardDescription className="text-purple-700">
                Test the full-screen workout detail modal with loading states, error handling, and tabbed content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkoutDetailModalTest />
            </CardContent>
          </Card>
        </div>

        {/* Other test components... */}
        <div className="w-full">
          <Card className="border-emerald-200 bg-emerald-50">
            <CardHeader>
              <CardTitle className="text-emerald-800 flex items-center gap-2">
                🎯 NEW: Workout Lifecycle Machine Integration Test
              </CardTitle>
              <CardDescription className="text-emerald-700">
                Test the complete integration: WorkoutsTab → workoutLifecycleMachine → workoutSetupMachine → exercise dependency resolution.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkoutLifecycleMachineIntegrationTest />
            </CardContent>
          </Card>
        </div>

        <div className="w-full">
          <Card className="border-cyan-200 bg-cyan-50">
            <CardHeader>
              <CardTitle className="text-cyan-800 flex items-center gap-2">
                🧪 NEW: Dependency Resolution Service Test
              </CardTitle>
              <CardDescription className="text-cyan-700">
                Test the extracted dependency resolution service with correctly formatted NIP-101e events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DependencyResolutionServiceTest />
            </CardContent>
          </Card>
        </div>

        <div className="w-full">
          <Card className="border-indigo-200 bg-indigo-50">
            <CardHeader>
              <CardTitle className="text-indigo-800 flex items-center gap-2">
                🏗️ NEW: Complete Workout Flow Test
              </CardTitle>
              <CardDescription className="text-indigo-700">
                Comprehensive test of XState parent-child machine hierarchy with real NDK integration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompleteWorkoutFlowTest />
            </CardContent>
          </Card>
        </div>

        <div className="w-full">
          <Card className="border-violet-200 bg-violet-50">
            <CardHeader>
              <CardTitle className="text-violet-800 flex items-center gap-2">
                🧪 NEW: Parameter Interpretation Test
              </CardTitle>
              <CardDescription className="text-violet-700">
                Test the parameter interpretation service with real leg workout data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ParameterInterpretationTest />
            </CardContent>
          </Card>
        </div>

        <div className="w-full">
          <Card className="border-rose-200 bg-rose-50">
            <CardHeader>
              <CardTitle className="text-rose-800 flex items-center gap-2">
                🧪 NEW: Active Workout NIP-101e Compliance Test
              </CardTitle>
              <CardDescription className="text-rose-700">
                Test the fixed activeWorkoutMachine to ensure it uses actual template data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActiveWorkoutNIP101eTest />
            </CardContent>
          </Card>
        </div>

        <div className="w-full">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                📋 NIP-51 Lists & Collections Test
              </CardTitle>
              <CardDescription className="text-green-700">
                Test NIP-51 list creation and management for workout collections.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkoutListManager />
            </CardContent>
          </Card>
        </div>

        <div className="w-full">
          <Card className="border-red-300 bg-red-100">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center gap-2">
                🐛 DEBUG: Template Reference Corruption Test
              </CardTitle>
              <CardDescription className="text-red-800">
                Debug the template reference corruption bug.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TemplateReferenceCorruptionTest />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Testing Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Testing Scenarios
          </CardTitle>
          <CardDescription>
            Systematic tests for NDK cache validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Wifi className="h-4 w-4 text-green-600" />
                Online Testing
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Publish single workout events</li>
                <li>• Publish bulk events (10 workouts)</li>
                <li>• Verify events appear in IndexedDB</li>
                <li>• Test WorkoutReader performance</li>
                <li>• Check relay confirmation with NAK</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <WifiOff className="h-4 w-4 text-orange-600" />
                Offline Testing
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• DevTools → Network → Offline</li>
                <li>• Publish events while offline</li>
                <li>• Verify events queue in unpublishedEvents</li>
                <li>• Go online and verify auto-sync</li>
                <li>• Test browser restart while offline</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
