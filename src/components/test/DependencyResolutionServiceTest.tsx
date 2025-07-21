'use client';

/**
 * Dependency Resolution Service Test Component
 * 
 * Tests the extracted dependency resolution service to validate:
 * - Single template resolution
 * - Exercise reference parsing
 * - Batch optimization
 * - Error handling
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAccount, useIsAuthenticated } from '@/lib/auth/hooks';
import { dependencyResolutionService } from '@/lib/services/dependencyResolution';

interface TestResult {
  success: boolean;
  timing: number;
  data?: unknown;
  error?: string;
  testName: string;
}

interface ExerciseReference {
  original: string;
  parsed: {
    kind: string;
    pubkey: string;
    dTag: string;
  };
  isValid: boolean;
  issue?: string;
}

// Test template reference - using the new correctly formatted workout template with title tag
const TEST_TEMPLATE_REF = '33402:79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798:corrected-bodyweight-workout-v2';

export function DependencyResolutionServiceTest() {
  const account = useAccount();
  const isAuthenticated = useIsAuthenticated();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [exerciseReferences, setExerciseReferences] = useState<ExerciseReference[]>([]);

  // Test 1: Parse exercise references to identify malformed ones
  const testExerciseReferenceParsing = async (): Promise<TestResult> => {
    const startTime = performance.now();
    
    try {
      console.log('[DependencyServiceTest] Testing exercise reference parsing...');

      // Test with known problematic references from console logs
      const testReferences = [
        '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:test-burpees,,0,8,8,normal,1',
        '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:test-mountain-climbers,,0,20,7,normal,1',
        '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:test-jump-squats,,0,12,7,normal,1',
        // What they should look like:
        '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:test-burpees',
        '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:test-mountain-climbers',
        '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:test-jump-squats'
      ];

      const parsedReferences: ExerciseReference[] = testReferences.map(ref => {
        const parts = ref.split(':');
        const isValid = parts.length === 3 && parts[0] === '33401' && parts[1].length === 64;
        
        let issue: string | undefined;
        if (parts.length !== 3) {
          issue = `Wrong number of parts: ${parts.length} (should be 3)`;
        } else if (parts[0] !== '33401') {
          issue = `Wrong kind: ${parts[0]} (should be 33401)`;
        } else if (parts[1].length !== 64) {
          issue = `Wrong pubkey length: ${parts[1].length} (should be 64)`;
        } else if (parts[2].includes(',')) {
          issue = `d-tag contains commas: ${parts[2]} (should be clean d-tag)`;
        }

        return {
          original: ref,
          parsed: {
            kind: parts[0] || '',
            pubkey: parts[1] || '',
            dTag: parts[2] || ''
          },
          isValid,
          issue
        };
      });

      setExerciseReferences(parsedReferences);

      const endTime = performance.now();
      const timing = endTime - startTime;

      console.log('[DependencyServiceTest] Exercise reference parsing results:', parsedReferences);

      return {
        success: true,
        timing,
        data: parsedReferences,
        testName: 'Exercise Reference Parsing'
      };

    } catch (error) {
      const endTime = performance.now();
      const timing = endTime - startTime;
      
      console.error('[DependencyServiceTest] Exercise reference parsing failed:', error);
      return {
        success: false,
        timing,
        error: error instanceof Error ? error.message : 'Unknown error',
        testName: 'Exercise Reference Parsing'
      };
    }
  };

  // Test 2: Single template resolution
  const testSingleTemplateResolution = async (): Promise<TestResult> => {
    const startTime = performance.now();
    
    try {
      console.log('[DependencyServiceTest] Testing single template resolution...');
      console.log('[DependencyServiceTest] Template ref:', TEST_TEMPLATE_REF);

      const result = await dependencyResolutionService.resolveSingleTemplate(TEST_TEMPLATE_REF);

      const endTime = performance.now();
      const timing = endTime - startTime;

      console.log('[DependencyServiceTest] Single template resolution result:', result);

      return {
        success: true,
        timing,
        data: result,
        testName: 'Single Template Resolution'
      };

    } catch (error) {
      const endTime = performance.now();
      const timing = endTime - startTime;
      
      console.error('[DependencyServiceTest] Single template resolution failed:', error);
      return {
        success: false,
        timing,
        error: error instanceof Error ? error.message : 'Unknown error',
        testName: 'Single Template Resolution'
      };
    }
  };

  // Test 3: Batch template resolution
  const testBatchTemplateResolution = async (): Promise<TestResult> => {
    const startTime = performance.now();
    
    try {
      console.log('[DependencyServiceTest] Testing batch template resolution...');

      const templateRefs = [
        '33402:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:test-hiit-circuit',
        '33402:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:push-workout-bodyweight',
        '33402:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pull-workout-bodyweight'
      ];

      const result = await dependencyResolutionService.resolveTemplateDependencies(templateRefs);

      const endTime = performance.now();
      const timing = endTime - startTime;

      console.log('[DependencyServiceTest] Batch template resolution result:', result);

      return {
        success: true,
        timing,
        data: result,
        testName: 'Batch Template Resolution'
      };

    } catch (error) {
      const endTime = performance.now();
      const timing = endTime - startTime;
      
      console.error('[DependencyServiceTest] Batch template resolution failed:', error);
      return {
        success: false,
        timing,
        error: error instanceof Error ? error.message : 'Unknown error',
        testName: 'Batch Template Resolution'
      };
    }
  };

  // Test 4: Exercise resolution with clean references
  const testCleanExerciseResolution = async (): Promise<TestResult> => {
    const startTime = performance.now();
    
    try {
      console.log('[DependencyServiceTest] Testing clean exercise resolution...');

      // Use clean exercise references (without the malformed parts)
      const cleanExerciseRefs = [
        '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:test-burpees',
        '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:test-mountain-climbers',
        '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:test-jump-squats'
      ];

      const result = await dependencyResolutionService.resolveExerciseReferences(cleanExerciseRefs);

      const endTime = performance.now();
      const timing = endTime - startTime;

      console.log('[DependencyServiceTest] Clean exercise resolution result:', result);

      return {
        success: true,
        timing,
        data: result,
        testName: 'Clean Exercise Resolution'
      };

    } catch (error) {
      const endTime = performance.now();
      const timing = endTime - startTime;
      
      console.error('[DependencyServiceTest] Clean exercise resolution failed:', error);
      return {
        success: false,
        timing,
        error: error instanceof Error ? error.message : 'Unknown error',
        testName: 'Clean Exercise Resolution'
      };
    }
  };

  // Test 5: Malformed exercise resolution (should fail gracefully)
  const testMalformedExerciseResolution = async (): Promise<TestResult> => {
    const startTime = performance.now();
    
    try {
      console.log('[DependencyServiceTest] Testing malformed exercise resolution...');

      // Use the actual malformed references from the console logs
      const malformedExerciseRefs = [
        '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:test-burpees,,0,8,8,normal,1',
        '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:test-mountain-climbers,,0,20,7,normal,1',
        '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:test-jump-squats,,0,12,7,normal,1'
      ];

      const result = await dependencyResolutionService.resolveExerciseReferences(malformedExerciseRefs);

      const endTime = performance.now();
      const timing = endTime - startTime;

      console.log('[DependencyServiceTest] Malformed exercise resolution result:', result);

      return {
        success: true,
        timing,
        data: result,
        testName: 'Malformed Exercise Resolution'
      };

    } catch (error) {
      const endTime = performance.now();
      const timing = endTime - startTime;
      
      console.error('[DependencyServiceTest] Malformed exercise resolution failed:', error);
      return {
        success: false,
        timing,
        error: error instanceof Error ? error.message : 'Unknown error',
        testName: 'Malformed Exercise Resolution'
      };
    }
  };

  const runTest = async (testFunction: () => Promise<TestResult>) => {
    setIsProcessing(true);
    try {
      const result = await testFunction();
      setTestResults(prev => [result, ...prev]);
    } catch (error) {
      console.error('[DependencyServiceTest] Test execution failed:', error);
      setTestResults(prev => [{
        success: false,
        timing: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        testName: 'Test Execution'
      }, ...prev]);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setExerciseReferences([]);
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dependency Resolution Service Test</CardTitle>
          <CardDescription>
            Please authenticate to test the dependency resolution service
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Authentication required to test dependency resolution.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Service Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Dependency Resolution Service Test</CardTitle>
          <CardDescription>
            Test the extracted dependency resolution service to debug exercise reference issues.
            Check browser console for detailed logging.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Info */}
          <div className="text-sm text-muted-foreground">
            <p>Authenticated as: {account?.pubkey?.slice(0, 16)}...</p>
            <p>Test Template: {TEST_TEMPLATE_REF.split(':')[2]}</p>
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={() => runTest(testExerciseReferenceParsing)}
              disabled={isProcessing}
              variant="default"
            >
              Test Exercise Reference Parsing
            </Button>
            
            <Button 
              onClick={() => runTest(testSingleTemplateResolution)}
              disabled={isProcessing}
              variant="outline"
            >
              Test Single Template Resolution
            </Button>

            <Button 
              onClick={() => runTest(testBatchTemplateResolution)}
              disabled={isProcessing}
              variant="outline"
            >
              Test Batch Template Resolution
            </Button>

            <Button 
              onClick={() => runTest(testCleanExerciseResolution)}
              disabled={isProcessing}
              variant="secondary"
            >
              Test Clean Exercise Resolution
            </Button>

            <Button 
              onClick={() => runTest(testMalformedExerciseResolution)}
              disabled={isProcessing}
              variant="destructive"
            >
              Test Malformed Exercise Resolution
            </Button>

            <Button 
              onClick={clearResults}
              disabled={isProcessing}
              variant="ghost"
            >
              Clear Results
            </Button>
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <Alert>
              <AlertDescription>
                Running test... Check console for detailed logs.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Exercise Reference Analysis */}
      {exerciseReferences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Exercise Reference Analysis</CardTitle>
            <CardDescription>
              Analysis of exercise references to identify malformed ones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exerciseReferences.map((ref, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={ref.isValid ? "default" : "destructive"}>
                      {ref.isValid ? "✅ Valid" : "❌ Invalid"}
                    </Badge>
                    {ref.issue && (
                      <span className="text-xs text-red-600">{ref.issue}</span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-mono break-all">
                      <strong>Original:</strong> {ref.original}
                    </p>
                    <div className="text-xs space-y-1">
                      <p><strong>Kind:</strong> {ref.parsed.kind}</p>
                      <p><strong>Pubkey:</strong> {ref.parsed.pubkey.slice(0, 16)}...</p>
                      <p><strong>D-Tag:</strong> {ref.parsed.dTag}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Results from dependency resolution service tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <Alert key={index} variant={result.success ? "default" : "destructive"}>
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p>
                          <strong>{result.testName}</strong>
                          <span className="ml-2">
                            {result.success ? '✅ Success' : '❌ Failed'}
                          </span>
                        </p>
                        <span className="text-xs">
                          {result.timing.toFixed(2)}ms
                        </span>
                      </div>
                      
                      {result.error && (
                        <p className="text-xs text-red-600">
                          Error: {result.error}
                        </p>
                      )}
                      
                      {result.data && (
                        <div className="text-xs space-y-1">
                          {result.testName === 'Single Template Resolution' && (
                            <div>
                              <p><strong>Template:</strong> {(result.data as any)?.template?.name || 'N/A'}</p>
                              <p><strong>Exercises Found:</strong> {(result.data as any)?.exercises?.length || 0}</p>
                              <p><strong>Load Time:</strong> {(result.data as any)?.loadTime}ms</p>
                            </div>
                          )}
                          
                          {result.testName === 'Batch Template Resolution' && (
                            <div>
                              <p><strong>Templates Found:</strong> {(result.data as any[])?.length || 0}</p>
                            </div>
                          )}
                          
                          {(result.testName === 'Clean Exercise Resolution' || result.testName === 'Malformed Exercise Resolution') && (
                            <div>
                              <p><strong>Exercises Found:</strong> {(result.data as any[])?.length || 0}</p>
                              {(result.data as any[])?.length > 0 && (
                                <p><strong>First Exercise:</strong> {(result.data as any[])[0]?.name || 'N/A'}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground space-y-2">
            <p><strong>Test Sequence:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li><strong>Exercise Reference Parsing:</strong> Analyze malformed vs clean references</li>
              <li><strong>Single Template Resolution:</strong> Test the main service method</li>
              <li><strong>Clean Exercise Resolution:</strong> Test with properly formatted references</li>
              <li><strong>Malformed Exercise Resolution:</strong> Test with actual malformed references</li>
            </ol>
            
            <Separator className="my-2" />
            
            <p><strong>Expected Results:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Exercise reference parsing should identify malformed d-tags</li>
              <li>Clean exercise resolution should find exercises</li>
              <li>Malformed exercise resolution should find 0 exercises</li>
              <li>This confirms the root issue is in the exercise references</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
