/**
 * NDK Deduplication Test Component
 * 
 * Tests whether NDK deduplicates identical tags in 33402 workout templates
 * vs 1301 workout records with set_number parameters.
 * 
 * This test addresses the critical question: Does 33402 have the same
 * deduplication problem as 1301, and should we add set_number to 33402?
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/powr-ui/primitives/Card';
import { Badge } from '@/components/ui/badge';
import { getNDKInstance, WORKOUT_EVENT_KINDS } from '@/lib/ndk';
import { workoutEventGenerationService, type CompletedWorkout } from '@/lib/services/workoutEventGeneration';
import { NDKEvent } from '@nostr-dev-kit/ndk';

interface TestResult {
  eventType: '33402' | '33402-with-set' | '1301';
  eventId: string;
  publishedTags: number;
  retrievedTags: number;
  deduplicationOccurred: boolean;
  tags: string[][];
  error?: string;
}

interface TestState {
  isRunning: boolean;
  results: TestResult[];
  logs: string[];
  currentTest: string;
}

const NDKDeduplicationTest: React.FC = () => {
  const [testState, setTestState] = useState<TestState>({
    isRunning: false,
    results: [],
    logs: [],
    currentTest: ''
  });

  const addLog = useCallback((message: string) => {
    console.log(`[NDKDeduplicationTest] ${message}`);
    setTestState(prev => ({
      ...prev,
      logs: [...prev.logs, `${new Date().toLocaleTimeString()}: ${message}`]
    }));
  }, []);

  const setCurrentTest = useCallback((test: string) => {
    setTestState(prev => ({ ...prev, currentTest: test }));
  }, []);

  /**
   * Generate test 33402 workout template with identical exercise tags (NO set_number)
   * This is the core test - will NDK deduplicate identical exercise prescriptions?
   */
  const generateTestWorkoutTemplate = (): { eventData: Record<string, unknown>; expectedTags: number } => {
    const testPubkey = '55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21';
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Create 3 identical exercise tags - this is the deduplication test
    const identicalExerciseTags = [
      ['exercise', '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pushup-standard', '', '0', '10', '7', 'normal'],
      ['exercise', '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pushup-standard', '', '0', '10', '7', 'normal'],
      ['exercise', '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pushup-standard', '', '0', '10', '7', 'normal']
    ];

    const tags = [
      ['d', `dedup-test-template-${timestamp}`],
      ['title', 'NDK Deduplication Test Template'],
      ['type', 'strength'],
      ...identicalExerciseTags, // 3 identical exercise tags
      ['duration', '1800'],
      ['t', 'fitness'],
      ['client', 'POWR-Dedup-Test']
    ];

    return {
      eventData: {
        kind: WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE,
        content: 'Test template to check if NDK deduplicates identical exercise tags in 33402 events',
        tags,
        created_at: timestamp,
        pubkey: testPubkey
      },
      expectedTags: identicalExerciseTags.length // Should be 3 if no deduplication
    };
  };

  /**
   * Generate test 33402 workout template WITH set_number parameters
   * This tests whether adding set_number to 33402 templates prevents deduplication
   */
  const generateTestWorkoutTemplateWithSetNumber = (): { eventData: Record<string, unknown>; expectedTags: number } => {
    const testPubkey = '55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21';
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Create 3 exercise tags with unique set_number parameters - should prevent deduplication
    const exerciseTagsWithSetNumber = [
      ['exercise', '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pushup-standard', '', '0', '10', '7', 'normal', '1'],
      ['exercise', '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pushup-standard', '', '0', '10', '7', 'normal', '2'],
      ['exercise', '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pushup-standard', '', '0', '10', '7', 'normal', '3']
    ];

    const tags = [
      ['d', `dedup-test-template-with-set-${timestamp}`],
      ['title', 'NDK Deduplication Test Template (With Set Numbers)'],
      ['type', 'strength'],
      ...exerciseTagsWithSetNumber, // 3 exercise tags with unique set numbers
      ['duration', '1800'],
      ['t', 'fitness'],
      ['client', 'POWR-Dedup-Test']
    ];

    return {
      eventData: {
        kind: WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE,
        content: 'Test template with set_number to check if it prevents NDK deduplication in 33402 events',
        tags,
        created_at: timestamp,
        pubkey: testPubkey
      },
      expectedTags: exerciseTagsWithSetNumber.length // Should be 3 if set_number prevents deduplication
    };
  };

  /**
   * Generate test 1301 workout record with set_number parameters
   * This should NOT be deduplicated due to unique set_number values
   */
  const generateTestWorkoutRecord = (): { eventData: Record<string, unknown>; expectedTags: number } => {
    const testPubkey = '55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21';
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Create test workout data with 3 identical sets but unique set numbers
    const completedWorkout: CompletedWorkout = {
      workoutId: `dedup-test-record-${timestamp}`,
      title: 'NDK Deduplication Test Record',
      workoutType: 'strength',
      startTime: timestamp * 1000 - 1800000, // 30 minutes ago
      endTime: timestamp * 1000,
      completedSets: [
        {
          exerciseRef: '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pushup-standard',
          setNumber: 1, // Unique set number
          reps: 10,
          weight: 0,
          rpe: 7,
          setType: 'normal',
          completedAt: timestamp * 1000 - 1200000
        },
        {
          exerciseRef: '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pushup-standard',
          setNumber: 2, // Unique set number
          reps: 10,
          weight: 0,
          rpe: 7,
          setType: 'normal',
          completedAt: timestamp * 1000 - 600000
        },
        {
          exerciseRef: '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pushup-standard',
          setNumber: 3, // Unique set number
          reps: 10,
          weight: 0,
          rpe: 7,
          setType: 'normal',
          completedAt: timestamp * 1000
        }
      ]
    };

    const eventData = workoutEventGenerationService.generateWorkoutRecord(completedWorkout, testPubkey);
    const exerciseTagCount = eventData.tags.filter(tag => tag[0] === 'exercise').length;

    return {
      eventData: eventData as unknown as Record<string, unknown>,
      expectedTags: exerciseTagCount // Should be 3 with set_number preventing deduplication
    };
  };

  /**
   * Publish event and retrieve it to check for deduplication
   */
  const testEventDeduplication = async (
    eventType: '33402' | '33402-with-set' | '1301',
    eventData: Record<string, unknown>,
    expectedTags: number
  ): Promise<TestResult> => {
    const ndk = getNDKInstance();
    if (!ndk) {
      throw new Error('NDK not initialized');
    }

    addLog(`Publishing ${eventType} event with ${expectedTags} expected exercise tags...`);

    // Create and publish event
    const event = new NDKEvent(ndk, eventData);
    await event.publish();

    addLog(`Published ${eventType} event: ${event.id}`);
    addLog(`Waiting 3 seconds for relay propagation...`);

    // Wait for relay propagation
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Retrieve the event to check tag count
    addLog(`Retrieving ${eventType} event to check for deduplication...`);
    
    const retrievedEvents = await ndk.fetchEvents({
      ids: [event.id]
    });

    if (retrievedEvents.size === 0) {
      throw new Error(`Failed to retrieve ${eventType} event ${event.id}`);
    }

    const retrievedEvent = Array.from(retrievedEvents)[0];
    const exerciseTags = retrievedEvent.tags.filter(tag => tag[0] === 'exercise');
    const retrievedTagCount = exerciseTags.length;

    addLog(`Retrieved ${eventType} event with ${retrievedTagCount} exercise tags (expected ${expectedTags})`);

    const deduplicationOccurred = retrievedTagCount < expectedTags;
    
    if (deduplicationOccurred) {
      addLog(`🚨 DEDUPLICATION DETECTED in ${eventType}: ${expectedTags} → ${retrievedTagCount} tags`);
    } else {
      addLog(`✅ NO DEDUPLICATION in ${eventType}: ${retrievedTagCount} tags preserved`);
    }

    return {
      eventType,
      eventId: event.id,
      publishedTags: expectedTags,
      retrievedTags: retrievedTagCount,
      deduplicationOccurred,
      tags: retrievedEvent.tags
    };
  };

  /**
   * Run comprehensive deduplication test
   */
  const runDeduplicationTest = async () => {
    setTestState(prev => ({
      ...prev,
      isRunning: true,
      results: [],
      logs: [],
      currentTest: ''
    }));

    try {
      addLog('🧪 Starting NDK Deduplication Test');
      addLog('Testing whether NDK deduplicates identical tags in 33402 vs 1301 events');

      // Test 1: 33402 Workout Template WITHOUT set_number (current behavior)
      setCurrentTest('Testing 33402 Template Deduplication (No Set Numbers)');
      addLog('\n--- TEST 1: 33402 Workout Template (No Set Numbers) ---');
      
      const { eventData: templateData, expectedTags: templateExpected } = generateTestWorkoutTemplate();
      const templateResult = await testEventDeduplication('33402', templateData, templateExpected);

      setTestState(prev => ({
        ...prev,
        results: [...prev.results, templateResult]
      }));

      // Test 2: 33402 Workout Template WITH set_number (proposed fix)
      setCurrentTest('Testing 33402 Template with Set Numbers (Proposed Fix)');
      addLog('\n--- TEST 2: 33402 Workout Template (With Set Numbers) ---');
      
      const { eventData: templateWithSetData, expectedTags: templateWithSetExpected } = generateTestWorkoutTemplateWithSetNumber();
      const templateWithSetResult = await testEventDeduplication('33402-with-set', templateWithSetData, templateWithSetExpected);

      setTestState(prev => ({
        ...prev,
        results: [...prev.results, templateWithSetResult]
      }));

      // Test 3: 1301 Workout Record WITH set_number (current working solution)
      setCurrentTest('Testing 1301 Record Deduplication Prevention');
      addLog('\n--- TEST 3: 1301 Workout Record (With Set Numbers) ---');
      
      const { eventData: recordData, expectedTags: recordExpected } = generateTestWorkoutRecord();
      const recordResult = await testEventDeduplication('1301', recordData, recordExpected);

      setTestState(prev => ({
        ...prev,
        results: [...prev.results, recordResult]
      }));

      // Analysis
      addLog('\n--- COMPREHENSIVE ANALYSIS ---');
      
      const template33402Deduped = templateResult.deduplicationOccurred;
      const template33402WithSetDeduped = templateWithSetResult.deduplicationOccurred;
      const record1301Deduped = recordResult.deduplicationOccurred;
      
      addLog(`33402 without set_number: ${template33402Deduped ? 'DEDUPLICATED' : 'PRESERVED'}`);
      addLog(`33402 with set_number: ${template33402WithSetDeduped ? 'DEDUPLICATED' : 'PRESERVED'}`);
      addLog(`1301 with set_number: ${record1301Deduped ? 'DEDUPLICATED' : 'PRESERVED'}`);
      
      if (template33402Deduped && !template33402WithSetDeduped && !record1301Deduped) {
        addLog('🎯 CONCLUSION: Adding set_number to 33402 templates SOLVES the deduplication issue!');
        addLog('💡 RECOMMENDATION: Update NIP-101e spec to include set_number in 33402 exercise tags');
        addLog('📋 ACTION ITEM: Modify workout template generation to include set_number parameter');
      } else if (template33402Deduped && template33402WithSetDeduped && !record1301Deduped) {
        addLog('🤔 CONCLUSION: set_number works for 1301 but not 33402 - different NDK behavior?');
        addLog('💡 RECOMMENDATION: Investigate why set_number works differently between event kinds');
      } else if (!template33402Deduped && !template33402WithSetDeduped && !record1301Deduped) {
        addLog('✅ CONCLUSION: No deduplication issues detected in any event type');
        addLog('💡 RECOMMENDATION: Current implementation is working correctly');
      } else {
        addLog('🚨 CONCLUSION: Unexpected deduplication pattern detected');
        addLog('💡 RECOMMENDATION: Further investigation needed - check NDK version and behavior');
      }

      addLog('\n✅ Deduplication test completed successfully');

    } catch (error) {
      addLog(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Deduplication test error:', error);
    } finally {
      setTestState(prev => ({
        ...prev,
        isRunning: false,
        currentTest: ''
      }));
    }
  };

  /**
   * Clear test results and logs
   */
  const clearResults = () => {
    setTestState({
      isRunning: false,
      results: [],
      logs: [],
      currentTest: ''
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>NDK Deduplication Test</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tests whether NDK deduplicates identical exercise tags in 33402 workout templates 
            vs 1301 workout records with set_number parameters.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runDeduplicationTest} 
              disabled={testState.isRunning}
              className="flex-1"
            >
              {testState.isRunning ? 'Running Test...' : 'Run Deduplication Test'}
            </Button>
            <Button 
              onClick={clearResults} 
              variant="outline"
              disabled={testState.isRunning}
            >
              Clear Results
            </Button>
          </div>

          {testState.currentTest && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm font-medium text-blue-800">
                Current Test: {testState.currentTest}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {testState.results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testState.results.map((result, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">
                      {result.eventType === '33402' ? 'Workout Template (No Set Numbers)' : 
                       result.eventType === '33402-with-set' ? 'Workout Template (With Set Numbers)' : 
                       'Workout Record'} 
                      (Kind {result.eventType.startsWith('33402') ? '33402' : result.eventType})
                    </h4>
                    <Badge variant={result.deduplicationOccurred ? 'destructive' : 'default'}>
                      {result.deduplicationOccurred ? 'DEDUPLICATED' : 'NO DEDUPLICATION'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Event ID:</span>
                      <p className="font-mono text-xs break-all">{result.eventId}</p>
                    </div>
                    <div>
                      <span className="font-medium">Exercise Tags:</span>
                      <p>{result.retrievedTags} / {result.publishedTags} preserved</p>
                    </div>
                  </div>

                  {result.deduplicationOccurred && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                      <p className="font-medium text-red-800">Deduplication Detected!</p>
                      <p className="text-red-700">
                        Published {result.publishedTags} identical exercise tags, 
                        but only {result.retrievedTags} were retrieved.
                      </p>
                    </div>
                  )}

                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">
                      View Exercise Tags ({result.tags.filter(t => t[0] === 'exercise').length})
                    </summary>
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono">
                      {result.tags
                        .filter(tag => tag[0] === 'exercise')
                        .map((tag, i) => (
                          <div key={i} className="mb-1">
                            [{tag.map(t => `"${t}"`).join(', ')}]
                          </div>
                        ))}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Logs */}
      {testState.logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto bg-gray-50 p-4 rounded font-mono text-xs">
              {testState.logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>Test Explanation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">What This Test Does:</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>Test 1:</strong> Creates a 33402 workout template with 3 identical exercise tags (no set_number)</li>
              <li><strong>Test 2:</strong> Creates a 33402 workout template with 3 exercise tags WITH set_number parameters</li>
              <li><strong>Test 3:</strong> Creates a 1301 workout record with 3 identical sets but unique set_number values</li>
              <li>Publishes all events and retrieves them to count surviving tags</li>
              <li>Compares tag survival rates across all three scenarios</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Expected Results:</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>33402 without set_number:</strong> Should show deduplication (3 → 1 tags)</li>
              <li><strong>33402 with set_number:</strong> Should preserve all 3 tags if fix works</li>
              <li><strong>1301 with set_number:</strong> Should preserve all 3 tags (known working)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Potential Outcomes:</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>Best Case:</strong> set_number fixes 33402 deduplication → Update NIP-101e spec</li>
              <li><strong>Partial Fix:</strong> set_number works differently for 33402 vs 1301 → Investigate NDK behavior</li>
              <li><strong>No Issues:</strong> No deduplication detected → Current implementation is correct</li>
              <li><strong>Unexpected:</strong> Different pattern → Further investigation needed</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NDKDeduplicationTest;
