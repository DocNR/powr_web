/**
 * NIP-101e Template Reference Fix Test Component
 * 
 * Tests the corrected template reference format in workout records:
 * - OLD: ["template", "just-template-id"] ❌
 * - NEW: ["template", "33402:pubkey:d-tag", "relay-url"] ✅
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/powr-ui/primitives/Card';
import { Button } from '@/components/powr-ui/primitives/Button';
import { workoutAnalyticsService } from '@/lib/services/workoutAnalytics';
import type { CompletedWorkout } from '@/lib/services/workoutAnalytics';

const NIP101eTemplateReferenceTest: React.FC = () => {
  const [testResults, setTestResults] = useState<{
    oldFormat?: {
      tag: string[];
      compliant: boolean;
      issues: string[];
      error?: string;
    };
    newFormat?: {
      tag: string[];
      compliant: boolean;
      format: string;
      parts: {
        kind: string;
        pubkey: string;
        dTag: string;
        relayUrl: string;
      } | null;
      error?: string;
    };
    validationResult?: {
      valid: boolean;
      error?: string;
    };
    fullEvent?: {
      kind: number;
      templateTag: string[];
      totalTags: number;
      hasRequiredFields: boolean;
    };
  }>({});

  const runTemplateReferenceTest = () => {
    console.log('[NIP101eTest] Running template reference format test...');

    // Test data with template reference information
    const mockCompletedWorkout: CompletedWorkout = {
      workoutId: 'test-workout-123',
      title: 'Push Day Test',
      workoutType: 'strength',
      startTime: Date.now() - 3600000, // 1 hour ago
      endTime: Date.now(),
      completedSets: [
        {
          exerciseRef: workoutAnalyticsService.createExerciseReference('test-pubkey', 'pushup-standard'),
          setNumber: 1,
          reps: 10,
          weight: 0,
          rpe: 7,
          setType: 'normal',
          completedAt: Date.now() - 1800000
        }
      ],
      notes: 'Test workout for NIP-101e compliance',
      // NEW: Template reference fields
      templateId: 'push-workout-bodyweight',
      templatePubkey: '55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21',
      templateReference: '33402:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:push-workout-bodyweight',
      templateRelayUrl: 'wss://nos.lol'
    };

    const userPubkey = '55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21';

    try {
      // Generate event with NEW format
      const newFormatEvent = workoutAnalyticsService.generateNIP101eEvent(mockCompletedWorkout, userPubkey);
      
      // Find the template tag
      const templateTag = newFormatEvent.tags.find(tag => tag[0] === 'template');
      
      // Simulate OLD format for comparison
      const oldFormatTag = ['template', mockCompletedWorkout.templateId];
      
      // Validate the new format
      const validation = workoutAnalyticsService.validateWorkoutData(mockCompletedWorkout);

      const results = {
        oldFormat: {
          tag: oldFormatTag as string[],
          compliant: false,
          issues: [
            'Missing template author pubkey',
            'Missing kind prefix (33402)',
            'Not addressable event format',
            'Breaks cross-client compatibility'
          ]
        },
        newFormat: {
          tag: templateTag || [],
          compliant: true,
          format: 'NIP-01 addressable event reference',
          parts: templateTag ? {
            kind: templateTag[1]?.split(':')[0] || '',
            pubkey: templateTag[1]?.split(':')[1] || '',
            dTag: templateTag[1]?.split(':')[2] || '',
            relayUrl: templateTag[2] || ''
          } : null
        },
        validationResult: validation,
        fullEvent: {
          kind: newFormatEvent.kind,
          templateTag: templateTag || [],
          totalTags: newFormatEvent.tags.length,
          hasRequiredFields: !!(templateTag && templateTag[1] && templateTag[1].includes(':'))
        }
      };

      setTestResults(results);
      
      console.log('[NIP101eTest] Test completed:', results);
      console.log('[NIP101eTest] Generated event tags:', newFormatEvent.tags);
      
    } catch (error) {
      console.error('[NIP101eTest] Test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResults({
        oldFormat: { 
          tag: [], 
          compliant: false, 
          issues: [], 
          error: 'Test failed' 
        },
        newFormat: { 
          tag: [], 
          compliant: false, 
          format: '', 
          parts: null, 
          error: errorMessage 
        },
        validationResult: { valid: false, error: errorMessage }
      });
    }
  };

  const formatTagDisplay = (tag: string[] | undefined) => {
    if (!tag) return 'No template tag found';
    return `["${tag.join('", "')}"]`;
  };

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>NIP-101e Template Reference Fix Test</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tests the corrected template reference format in workout records for NIP-101e compliance.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runTemplateReferenceTest} className="w-full">
            Run Template Reference Test
          </Button>
          
          {testResults.oldFormat && (
            <div className="space-y-4">
              {/* OLD Format Display */}
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-700 text-lg">❌ OLD Format (Broken)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="font-mono text-sm bg-red-100 p-2 rounded">
                      {formatTagDisplay(testResults.oldFormat.tag)}
                    </div>
                    <div className="text-sm">
                      <strong>Issues:</strong>
                      <ul className="list-disc list-inside mt-1 text-red-600">
                        {testResults.oldFormat.issues?.map((issue: string, i: number) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* NEW Format Display */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-700 text-lg">✅ NEW Format (NIP-101e Compliant)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="font-mono text-sm bg-green-100 p-2 rounded">
                      {formatTagDisplay(testResults.newFormat.tag)}
                    </div>
                    {testResults.newFormat?.parts && (
                      <div className="text-sm">
                        <strong>Parsed Components:</strong>
                        <ul className="list-disc list-inside mt-1 text-green-600">
                          <li><strong>Kind:</strong> {testResults.newFormat.parts.kind} (Workout Template)</li>
                          <li><strong>Author:</strong> {testResults.newFormat.parts.pubkey?.slice(0, 16)}...</li>
                          <li><strong>Template ID:</strong> {testResults.newFormat.parts.dTag}</li>
                          <li><strong>Relay:</strong> {testResults.newFormat.parts.relayUrl || 'Not specified'}</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Validation Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Validation Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className={`p-2 rounded ${testResults.validationResult?.valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      <strong>Status:</strong> {testResults.validationResult?.valid ? '✅ Valid' : '❌ Invalid'}
                    </div>
                    {testResults.validationResult?.error && (
                      <div className="text-sm text-red-600">
                        <strong>Error:</strong> {testResults.validationResult.error}
                      </div>
                    )}
                    {testResults.fullEvent && (
                      <div className="text-sm">
                        <strong>Event Summary:</strong>
                        <ul className="list-disc list-inside mt-1">
                          <li>Kind: {testResults.fullEvent.kind} (Workout Record)</li>
                          <li>Total Tags: {testResults.fullEvent.totalTags}</li>
                          <li>Has Template Reference: {testResults.fullEvent.hasRequiredFields ? '✅ Yes' : '❌ No'}</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* NAK Verification Commands */}
      <Card>
        <CardHeader>
          <CardTitle>NAK Verification Commands</CardTitle>
          <p className="text-sm text-muted-foreground">
            Use these commands to verify the fix works with real Nostr events.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm bg-gray-100 p-3 rounded">
            <div># Verify template exists (should work with new format)</div>
            <div>nak req -k 33402 -a 55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21 --tag d=push-workout-bodyweight wss://nos.lol</div>
            <div className="mt-2"># Check workout records with template references</div>
            <div>nak req -k 1301 -a YOUR_PUBKEY wss://nos.lol | jq '.tags[] | select(.[0] == "template")'</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NIP101eTemplateReferenceTest;
