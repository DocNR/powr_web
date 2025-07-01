'use client';

/**
 * Test Tab - Workout Flow Testing
 * 
 * Contains essential test components for validating the complete workout workflow
 * and critical NDK functionality.
 */

import React from 'react';
import NDKDeduplicationTest from '@/components/test/NDKDeduplicationTest';
import WorkflowValidationTest from '@/components/test/WorkflowValidationTest';
import WorkoutGalleryTest from '@/components/test/WorkoutGalleryTest';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TestTube, Target, Wifi, WifiOff } from 'lucide-react';

export function TestTab() {
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

        {/* 🎨 NEW: Workout Gallery Components Test */}
        <div className="w-full">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                🎨 NEW: Workout Gallery Components Test
              </CardTitle>
              <CardDescription className="text-green-700">
                Test the new UI components: CalendarBar, WorkoutCard variants, and ScrollableGallery components.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkoutGalleryTest />
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
            {/* Online Testing */}
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

            {/* Offline Testing */}
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

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h5 className="font-medium mb-2">Current Investigation</h5>
            <p className="text-sm text-muted-foreground">
              <strong>Unexpected Behavior:</strong> Published events are appearing in the 
              <code className="mx-1 px-1 bg-background rounded">unpublishedEvents</code> table 
              even after successful publication to relays. This needs investigation to determine 
              if it&apos;s normal NDK behavior or indicates a queue cleanup issue.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Targets</CardTitle>
          <CardDescription>
            Success criteria for NDK cache validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">&lt;500ms</div>
              <div className="text-sm text-muted-foreground">Load 50 events</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">100%</div>
              <div className="text-sm text-muted-foreground">Cross-session persistence</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">Auto</div>
              <div className="text-sm text-muted-foreground">Offline queue sync</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
