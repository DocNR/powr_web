'use client';

/**
 * Test Tab - NDK Cache Validation
 * 
 * Contains WorkoutPublisher and WorkoutReader components for testing
 * NDK cache persistence and validation.
 */

import React from 'react';
import { WorkoutPublisher } from '@/components/test/WorkoutPublisher';
import { WorkoutReader } from '@/components/test/WorkoutReader';
import { GlobalNDKActorTest } from '@/components/test/GlobalNDKActorTest';
import Phase1ContentVerificationTest from '@/components/test/Phase1ContentVerificationTest';
import NDKDeduplicationTest from '@/components/test/NDKDeduplicationTest';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TestTube, Database, Wifi, WifiOff } from 'lucide-react';

export function TestTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <TestTube className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">NDK Cache Validation</h1>
          <p className="text-muted-foreground">
            Test NDK IndexedDB persistence, offline queue, and cross-session behavior
          </p>
        </div>
      </div>

      {/* Instructions */}
      <Alert>
        <Database className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p><strong>Testing Instructions:</strong></p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Open DevTools → Application → IndexedDB → workout-pwa-cache</li>
              <li>Use WorkoutPublisher to create test events</li>
              <li>Use WorkoutReader to verify events are cached and retrievable</li>
              <li>Test offline behavior using DevTools Network tab</li>
              <li>Test cross-session persistence by refreshing the page</li>
            </ol>
          </div>
        </AlertDescription>
      </Alert>

      {/* Test Components */}
      <div className="space-y-6">
        {/* 🔴 CRITICAL: NDK Tag Deduplication Test - PRIORITY */}
        <div className="w-full">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                🚨 CRITICAL: NDK Deduplication Fix Test
              </CardTitle>
              <CardDescription className="text-red-700">
                Test the fix for silent data loss in workout sets. This is blocking real workout usage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NDKDeduplicationTest />
            </CardContent>
          </Card>
        </div>

        {/* Essential Test Components */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Workout Publisher */}
          <div className="space-y-4">
            <WorkoutPublisher />
          </div>

          {/* Workout Reader */}
          <div className="space-y-4">
            <WorkoutReader />
          </div>
        </div>
        
        {/* Phase 1 Content Verification */}
        <div className="w-full">
          <Phase1ContentVerificationTest />
        </div>
        
        {/* Global NDK Actor Test */}
        <div className="w-full">
          <GlobalNDKActorTest />
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
              if it's normal NDK behavior or indicates a queue cleanup issue.
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
