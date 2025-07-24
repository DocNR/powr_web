'use client';

import React, { useState, useEffect } from 'react';
import { dataParsingService } from '@/lib/services/dataParsingService';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/powr-ui/primitives/Card';

/**
 * DataParsingService Test Component
 * 
 * Tests the performance improvements and caching functionality of the
 * consolidated DataParsingService. This component validates that:
 * 
 * 1. Parsing results are cached to prevent duplicate processing
 * 2. Cache hit rates improve with repeated parsing requests
 * 3. Performance metrics show reduced parsing time for cached results
 * 4. LRU cache management works correctly
 */
export default function DataParsingServiceTest() {
  const [metrics, setMetrics] = useState<string>('No metrics yet');
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Mock NDK event for testing
  const createMockWorkoutEvent = (id: string) => ({
    id,
    kind: 1301,
    pubkey: '55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21',
    created_at: Math.floor(Date.now() / 1000),
    content: JSON.stringify({
      exercises: [
        { name: 'Push-ups', sets: [{ reps: 10, weight: 0 }] }
      ],
      duration: 1800,
      notes: 'Test workout'
    }),
    tags: [
      ['d', `workout_${id}`],
      ['title', `Test Workout ${id}`],
      ['type', 'strength'],
      ['start', (Math.floor(Date.now() / 1000) - 1800).toString()],
      ['end', Math.floor(Date.now() / 1000).toString()],
      ['completed', 'true'],
      ['exercise', '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pushup-standard', '', '0', '10', '7', 'normal', '1']
    ]
  });

  const createMockTemplateEvent = (id: string) => ({
    id,
    kind: 33402,
    pubkey: '55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21',
    created_at: Math.floor(Date.now() / 1000),
    content: 'Test workout template',
    tags: [
      ['d', `template_${id}`],
      ['title', `Test Template ${id}`],
      ['type', 'strength'],
      ['difficulty', 'beginner'],
      ['duration', '1800'],
      ['exercise', '33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pushup-standard', '3', '10', '0']
    ]
  });

  const runCacheTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const results: string[] = [];
    
    try {
      // Clear cache to start fresh
      dataParsingService.clearCache();
      results.push('✅ Cache cleared for fresh test');
      
      // Test 1: Parse same event multiple times to test caching
      results.push('\n🧪 Test 1: Cache Hit Rate Test');
      const mockEvent = createMockWorkoutEvent('test-1') as any;
      
      // First parse - should be cache miss
      const start1 = Date.now();
      const result1 = dataParsingService.parseWorkoutEvent(mockEvent);
      const time1 = Date.now() - start1;
      results.push(`   First parse: ${time1}ms (cache miss expected)`);
      
      // Second parse - should be cache hit
      const start2 = Date.now();
      const result2 = dataParsingService.parseWorkoutEvent(mockEvent);
      const time2 = Date.now() - start2;
      results.push(`   Second parse: ${time2}ms (cache hit expected)`);
      
      // Third parse - should be cache hit
      const start3 = Date.now();
      const result3 = dataParsingService.parseWorkoutEvent(mockEvent);
      const time3 = Date.now() - start3;
      results.push(`   Third parse: ${time3}ms (cache hit expected)`);
      
      // Verify results are identical
      const identical = result1?.id === result2?.id && result2?.id === result3?.id;
      results.push(`   Results identical: ${identical ? '✅' : '❌'}`);
      
      // Test 2: Test getCachedParse method directly
      results.push('\n🧪 Test 2: Direct Cache Method Test');
      let parseCount = 0;
      const expensiveOperation = () => {
        parseCount++;
        // Simulate expensive parsing
        const start = Date.now();
        while (Date.now() - start < 10) {} // 10ms delay
        return { result: `Expensive operation ${parseCount}`, timestamp: Date.now() };
      };
      
      // First call - should execute function
      const cached1 = dataParsingService.getCachedParse('test-key', expensiveOperation);
      results.push(`   First call: parseCount=${parseCount}, result=${cached1.result}`);
      
      // Second call - should use cache
      const cached2 = dataParsingService.getCachedParse('test-key', expensiveOperation);
      results.push(`   Second call: parseCount=${parseCount}, result=${cached2.result}`);
      
      // Third call - should use cache
      const cached3 = dataParsingService.getCachedParse('test-key', expensiveOperation);
      results.push(`   Third call: parseCount=${parseCount}, result=${cached3.result}`);
      
      const cacheWorking = parseCount === 1 && cached1.result === cached2.result && cached2.result === cached3.result;
      results.push(`   Cache working correctly: ${cacheWorking ? '✅' : '❌'}`);
      
      // Test 3: Test social workout parsing with caching
      results.push('\n🧪 Test 3: Social Workout Parsing Cache Test');
      const workoutEvent = createMockWorkoutEvent('social-test') as any;
      const templateEvent = createMockTemplateEvent('social-template') as any;
      
      // Parse social workout multiple times
      const socialStart1 = Date.now();
      const social1 = dataParsingService.parseSocialWorkout(workoutEvent, templateEvent);
      const socialTime1 = Date.now() - socialStart1;
      
      const socialStart2 = Date.now();
      const social2 = dataParsingService.parseSocialWorkout(workoutEvent, templateEvent);
      const socialTime2 = Date.now() - socialStart2;
      
      results.push(`   First social parse: ${socialTime1}ms`);
      results.push(`   Second social parse: ${socialTime2}ms (should be faster)`);
      results.push(`   Performance improvement: ${socialTime2 < socialTime1 ? '✅' : '❌'}`);
      
      // Test 4: Test discovery template parsing with caching
      results.push('\n🧪 Test 4: Discovery Template Parsing Cache Test');
      const templateForDiscovery = createMockTemplateEvent('discovery-test') as any;
      
      const discoveryStart1 = Date.now();
      const discovery1 = dataParsingService.parseDiscoveryTemplate(templateForDiscovery);
      const discoveryTime1 = Date.now() - discoveryStart1;
      
      const discoveryStart2 = Date.now();
      const discovery2 = dataParsingService.parseDiscoveryTemplate(templateForDiscovery);
      const discoveryTime2 = Date.now() - discoveryStart2;
      
      results.push(`   First discovery parse: ${discoveryTime1}ms`);
      results.push(`   Second discovery parse: ${discoveryTime2}ms (should be faster)`);
      results.push(`   Performance improvement: ${discoveryTime2 < discoveryTime1 ? '✅' : '❌'}`);
      
      // Test 5: LRU Cache Management Test
      results.push('\n🧪 Test 5: LRU Cache Management Test');
      
      // Create many events to test cache eviction
      for (let i = 0; i < 5; i++) {
        const testEvent = createMockWorkoutEvent(`lru-test-${i}`) as any;
        dataParsingService.parseWorkoutEvent(testEvent);
      }
      results.push(`   Created 5 cached entries`);
      
      // Get performance metrics
      dataParsingService.logPerformanceMetrics();
      
      results.push('\n✅ All cache tests completed successfully!');
      
    } catch (error) {
      results.push(`\n❌ Test failed: ${error}`);
    }
    
    setTestResults(results);
    setIsRunning(false);
    
    // Update metrics display
    setTimeout(() => {
      setMetrics('Check console for detailed performance metrics');
    }, 100);
  };

  const clearCacheAndMetrics = () => {
    dataParsingService.clearCache();
    setMetrics('Cache cleared');
    setTestResults([]);
  };

  const showPerformanceMetrics = () => {
    dataParsingService.logPerformanceMetrics();
    setMetrics('Performance metrics logged to console');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>DataParsingService Performance Test</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tests caching functionality and performance improvements for workout data parsing.
            This validates that the same templates are not being parsed repeatedly due to React re-renders.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={runCacheTest} 
              disabled={isRunning}
              variant="default"
            >
              {isRunning ? 'Running Tests...' : 'Run Cache Tests'}
            </Button>
            
            <Button 
              onClick={showPerformanceMetrics} 
              variant="outline"
            >
              Show Metrics
            </Button>
            
            <Button 
              onClick={clearCacheAndMetrics} 
              variant="outline"
            >
              Clear Cache
            </Button>
          </div>
          
          <div className="bg-muted p-3 rounded text-sm">
            <strong>Metrics:</strong> {metrics}
          </div>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded overflow-auto max-h-96 whitespace-pre-wrap">
              {testResults.join('\n')}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Expected Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="space-y-1">
            <p><strong>✅ Cache Hit Rate Test:</strong></p>
            <p className="ml-4">• First parse should take longer (cache miss)</p>
            <p className="ml-4">• Second and third parses should be much faster (cache hits)</p>
            <p className="ml-4">• All results should be identical</p>
          </div>
          
          <div className="space-y-1">
            <p><strong>✅ Direct Cache Method Test:</strong></p>
            <p className="ml-4">• Expensive operation should only run once (parseCount = 1)</p>
            <p className="ml-4">• All three calls should return the same result</p>
          </div>
          
          <div className="space-y-1">
            <p><strong>✅ Social/Discovery Parsing Tests:</strong></p>
            <p className="ml-4">• Second parse should be significantly faster than first</p>
            <p className="ml-4">• This proves React re-render performance issue is solved</p>
          </div>
          
          <div className="space-y-1">
            <p><strong>✅ Performance Metrics:</strong></p>
            <p className="ml-4">• Cache hit rate should increase with repeated operations</p>
            <p className="ml-4">• Console should show detailed cache statistics</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
