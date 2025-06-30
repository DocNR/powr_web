/**
 * NDK Tag Deduplication Test Component
 * 
 * Tests the critical NDK bug where identical workout sets get silently deduplicated.
 * Our fix adds set numbers as the 8th parameter to make each set unique.
 * 
 * Based on research findings from docs/research/ndk-tag-deduplication-research-findings.md
 */

'use client';

import React, { useState } from 'react';
import { workoutAnalyticsService } from '@/lib/services/workoutAnalytics';
import { publishEvent } from '@/lib/actors/globalNDKActor';
import { useAccount } from '@/lib/auth/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TestResult {
  scenario: string;
  description: string;
  expectedTags: number;
  actualTags: number;
  success: boolean;
  eventData?: any;
  error?: string;
}

export default function NDKDeduplicationTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const account = useAccount();

  const publishTestEvent = async (eventData: any) => {
    try {
      const requestId = `test_${Date.now()}`;
      publishEvent(eventData, requestId);
      console.log('✅ Test event published with request ID:', requestId);
    } catch (error) {
      console.error('❌ Failed to publish test event:', error);
    }
  };

  const runDeduplicationTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    const results: TestResult[] = [];

    // Use authenticated user's pubkey
    if (!account?.pubkey) {
      results.push({
        scenario: 'Authentication Check',
        description: 'User must be authenticated to run tests',
        expectedTags: 0,
        actualTags: 0,
        success: false,
        error: 'Please authenticate with NIP-07 extension or other method first'
      });
      setTestResults(results);
      setIsRunning(false);
      return;
    }

    console.log('[NDK Deduplication Test] Using authenticated user pubkey:', account.pubkey.slice(0, 16) + '...');

    try {
      // Test Scenario 1: Identical Sets (Should be deduplicated in current NDK)
      console.log('🧪 Running Test Scenario 1: Identical Sets');
      
      const identicalSetsWorkout = {
        workoutId: `test_identical_${Date.now()}`,
        title: 'Identical Sets Test',
        workoutType: 'strength' as const,
        startTime: Date.now() - 3600000,
        endTime: Date.now(),
        completedSets: [
          {
            exerciseRef: '33401:test:pushups',
            setNumber: 1,
            reps: 10,
            weight: 0,
            rpe: 7,
            setType: 'normal' as const,
            completedAt: Date.now() - 1800000
          },
          {
            exerciseRef: '33401:test:pushups',
            setNumber: 1, // Same set number - should cause deduplication
            reps: 10,
            weight: 0,
            rpe: 7,
            setType: 'normal' as const,
            completedAt: Date.now() - 1200000
          },
          {
            exerciseRef: '33401:test:pushups',
            setNumber: 1, // Same set number - should cause deduplication
            reps: 10,
            weight: 0,
            rpe: 7,
            setType: 'normal' as const,
            completedAt: Date.now() - 600000
          }
        ]
      };

      const identicalEventData = workoutAnalyticsService.generateNIP101eEvent(identicalSetsWorkout, account.pubkey);
      const identicalExerciseTags = identicalEventData.tags.filter(tag => tag[0] === 'exercise');
      
      results.push({
        scenario: 'Identical Sets (Broken)',
        description: 'Three identical pushup sets with same set number - NDK should deduplicate to 1 tag',
        expectedTags: 1, // NDK deduplication should reduce to 1
        actualTags: identicalExerciseTags.length,
        success: identicalExerciseTags.length === 1, // This should fail with our fix
        eventData: identicalEventData
      });

      // Test Scenario 2: Unique Set Numbers (Our Fix)
      console.log('🧪 Running Test Scenario 2: Unique Set Numbers');
      
      const uniqueSetsWorkout = {
        workoutId: `test_unique_${Date.now()}`,
        title: 'Unique Set Numbers Test',
        workoutType: 'strength' as const,
        startTime: Date.now() - 3600000,
        endTime: Date.now(),
        completedSets: [
          {
            exerciseRef: '33401:test:pushups',
            setNumber: 1, // Unique set number
            reps: 10,
            weight: 0,
            rpe: 7,
            setType: 'normal' as const,
            completedAt: Date.now() - 1800000
          },
          {
            exerciseRef: '33401:test:pushups',
            setNumber: 2, // Unique set number
            reps: 10,
            weight: 0,
            rpe: 7,
            setType: 'normal' as const,
            completedAt: Date.now() - 1200000
          },
          {
            exerciseRef: '33401:test:pushups',
            setNumber: 3, // Unique set number
            reps: 10,
            weight: 0,
            rpe: 7,
            setType: 'normal' as const,
            completedAt: Date.now() - 600000
          }
        ]
      };

      const uniqueEventData = workoutAnalyticsService.generateNIP101eEvent(uniqueSetsWorkout, account.pubkey);
      const uniqueExerciseTags = uniqueEventData.tags.filter(tag => tag[0] === 'exercise');
      
      results.push({
        scenario: 'Unique Set Numbers (Fixed)',
        description: 'Three pushup sets with unique set numbers (1,2,3) - should preserve all 3 tags',
        expectedTags: 3,
        actualTags: uniqueExerciseTags.length,
        success: uniqueExerciseTags.length === 3,
        eventData: uniqueEventData
      });

      // Test Scenario 3: Progressive Workout (Realistic)
      console.log('🧪 Running Test Scenario 3: Progressive Workout');
      
      const progressiveWorkout = {
        workoutId: `test_progressive_${Date.now()}`,
        title: 'Progressive Workout Test',
        workoutType: 'strength' as const,
        startTime: Date.now() - 3600000,
        endTime: Date.now(),
        completedSets: [
          {
            exerciseRef: '33401:test:pushups',
            setNumber: 1,
            reps: 12,
            weight: 0,
            rpe: 6,
            setType: 'warmup' as const,
            completedAt: Date.now() - 1800000
          },
          {
            exerciseRef: '33401:test:pushups',
            setNumber: 2,
            reps: 10,
            weight: 0,
            rpe: 8,
            setType: 'normal' as const,
            completedAt: Date.now() - 1200000
          },
          {
            exerciseRef: '33401:test:pushups',
            setNumber: 3,
            reps: 8,
            weight: 0,
            rpe: 9,
            setType: 'failure' as const,
            completedAt: Date.now() - 600000
          }
        ]
      };

      const progressiveEventData = workoutAnalyticsService.generateNIP101eEvent(progressiveWorkout, account.pubkey);
      const progressiveExerciseTags = progressiveEventData.tags.filter(tag => tag[0] === 'exercise');
      
      results.push({
        scenario: 'Progressive Workout (Realistic)',
        description: 'Realistic progressive workout with decreasing reps and increasing RPE',
        expectedTags: 3,
        actualTags: progressiveExerciseTags.length,
        success: progressiveExerciseTags.length === 3,
        eventData: progressiveEventData
      });

      // Test Scenario 4: Multi-Exercise Workout
      console.log('🧪 Running Test Scenario 4: Multi-Exercise Workout');
      
      const multiExerciseWorkout = {
        workoutId: `test_multi_${Date.now()}`,
        title: 'Multi-Exercise Test',
        workoutType: 'strength' as const,
        startTime: Date.now() - 3600000,
        endTime: Date.now(),
        completedSets: [
          // Pushups
          {
            exerciseRef: '33401:test:pushups',
            setNumber: 1,
            reps: 10,
            weight: 0,
            rpe: 7,
            setType: 'normal' as const,
            completedAt: Date.now() - 1800000
          },
          {
            exerciseRef: '33401:test:pushups',
            setNumber: 2,
            reps: 8,
            weight: 0,
            rpe: 8,
            setType: 'normal' as const,
            completedAt: Date.now() - 1600000
          },
          // Squats
          {
            exerciseRef: '33401:test:squats',
            setNumber: 1,
            reps: 15,
            weight: 60,
            rpe: 7,
            setType: 'normal' as const,
            completedAt: Date.now() - 1400000
          },
          {
            exerciseRef: '33401:test:squats',
            setNumber: 2,
            reps: 12,
            weight: 60,
            rpe: 8,
            setType: 'normal' as const,
            completedAt: Date.now() - 1200000
          }
        ]
      };

      const multiExerciseEventData = workoutAnalyticsService.generateNIP101eEvent(multiExerciseWorkout, account.pubkey);
      const multiExerciseExerciseTags = multiExerciseEventData.tags.filter(tag => tag[0] === 'exercise');
      
      results.push({
        scenario: 'Multi-Exercise Workout',
        description: 'Multiple exercises with per-exercise set numbering',
        expectedTags: 4,
        actualTags: multiExerciseExerciseTags.length,
        success: multiExerciseExerciseTags.length === 4,
        eventData: multiExerciseEventData
      });

    } catch (error) {
      console.error('Test execution failed:', error);
      results.push({
        scenario: 'Test Execution',
        description: 'Failed to execute deduplication tests',
        expectedTags: 0,
        actualTags: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 NDK Tag Deduplication Test</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tests the critical NDK bug where identical workout sets get silently deduplicated.
            Our fix adds set numbers as the 8th parameter to make each set unique.
          </p>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runDeduplicationTests} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? 'Running Tests...' : 'Run Deduplication Tests'}
          </Button>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Test Results</h3>
          
          {testResults.map((result, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{result.scenario}</CardTitle>
                  <Badge variant={result.success ? 'default' : 'destructive'}>
                    {result.success ? '✅ PASS' : '❌ FAIL'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{result.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Expected Tags:</span>
                    <span className="font-mono">{result.expectedTags}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Actual Tags:</span>
                    <span className="font-mono">{result.actualTags}</span>
                  </div>
                  
                  {result.error && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      Error: {result.error}
                    </div>
                  )}
                  
                  {result.eventData && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                        View Exercise Tags
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-50 rounded overflow-x-auto">
                        {JSON.stringify(
                          result.eventData.tags.filter((tag: string[]) => tag[0] === 'exercise'),
                          null,
                          2
                        )}
                      </pre>
                    </details>
                  )}
                  
                  {result.eventData && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => publishTestEvent(result.eventData!)}
                      className="w-full mt-2"
                    >
                      Publish Test Event
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Test Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Tests:</span>
                  <span className="ml-2 font-medium">{testResults.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Passed:</span>
                  <span className="ml-2 font-medium text-green-600">
                    {testResults.filter(r => r.success).length}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Failed:</span>
                  <span className="ml-2 font-medium text-red-600">
                    {testResults.filter(r => !r.success).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p>
              <strong>After running tests:</strong> Use NAK commands to verify actual published tag counts:
            </p>
            <div className="bg-gray-100 p-3 rounded font-mono text-xs">
              {`# Count exercise tags in published event
nak req -k 1301 -a YOUR_PUBKEY --tag d=test-workout-id wss://nos.lol | jq '.tags[] | select(.[0] == "exercise")' | wc -l

# Examine tag content for uniqueness
nak req -k 1301 -a YOUR_PUBKEY --tag d=test-workout-id wss://nos.lol | jq '.tags[] | select(.[0] == "exercise")'`}
            </div>
            <p>
              <strong>Expected Results:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Progressive scenarios should show all tags surviving (3 each)</li>
              <li>Identical sets scenario should show only 1 tag (deduplication)</li>
              <li>Mixed workout should show 4 total tags (2 per exercise)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
