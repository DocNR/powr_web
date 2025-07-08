'use client';

import React, { useState, useEffect } from 'react';
import { useWorkoutData } from '@/providers/WorkoutDataProvider';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/powr-ui/primitives/Card';

/**
 * Real-Time Infinite Scroll Test Component
 * 
 * Tests the new real-time subscription and infinite scroll functionality
 * in the WorkoutDataProvider. This validates Phase 1 implementation.
 */
export default function RealTimeInfiniteScrollTest() {
  const {
    socialWorkouts,
    discoveryTemplates,
    isLoading,
    error,
    loadMoreSocialWorkouts,
    loadMoreDiscoveryTemplates,
    hasMoreWorkouts,
    hasMoreTemplates,
    isLoadingMore,
    refreshData
  } = useWorkoutData();

  const [subscriptionHealth, setSubscriptionHealth] = useState({
    socialEvents: 0,
    discoveryEvents: 0,
    lastUpdate: Date.now()
  });

  // Monitor data changes to track real-time updates
  useEffect(() => {
    setSubscriptionHealth({
      socialEvents: socialWorkouts.length,
      discoveryEvents: discoveryTemplates.length,
      lastUpdate: Date.now()
    });
  }, [socialWorkouts.length, discoveryTemplates.length]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>🔄 Real-Time Subscriptions Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Setting up NDK subscriptions for workout records and templates...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">❌ Subscription Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={refreshData} variant="outline">
            Retry Subscriptions
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Subscription Health Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>📡 Real-Time Subscription Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded">
              <div className="font-semibold text-blue-700">Social Workouts</div>
              <div className="text-2xl font-bold text-blue-600">{subscriptionHealth.socialEvents}</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="font-semibold text-green-700">Discovery Templates</div>
              <div className="text-2xl font-bold text-green-600">{subscriptionHealth.discoveryEvents}</div>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <div className="font-semibold text-purple-700">Last Update</div>
              <div className="text-sm text-purple-600">{formatTime(subscriptionHealth.lastUpdate)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-semibold text-gray-700">Status</div>
              <div className="text-sm text-green-600">🟢 Live</div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={refreshData} variant="outline" size="sm">
              🔄 Refresh Subscriptions
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Social Workouts Feed */}
        <Card>
          <CardHeader>
            <CardTitle>💪 Social Workouts (Real-Time)</CardTitle>
            <p className="text-sm text-gray-600">
              Live subscription to workout records (Kind 1301)
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {socialWorkouts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📭</div>
                  <p>No workout records found</p>
                  <p className="text-xs">Subscription is active and waiting for events...</p>
                </div>
              ) : (
                socialWorkouts.map((workout, index) => (
                  <div key={workout.eventId || index} className="border rounded p-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-sm">{workout.title}</h4>
                      <span className="text-xs text-gray-500">
                        {workout.completedAt.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Duration: {workout.duration} min</div>
                      <div>Exercises: {workout.exercises.length}</div>
                      <div>Author: {workout.author.name}</div>
                      {workout.eventId && (
                        <div className="font-mono text-xs bg-white p-1 rounded">
                          ID: {workout.eventId.slice(0, 16)}...
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Infinite Scroll Controls */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {hasMoreWorkouts ? 'More available' : 'All loaded'}
                </span>
                <Button
                  onClick={loadMoreSocialWorkouts}
                  disabled={!hasMoreWorkouts || isLoadingMore}
                  variant="outline"
                  size="sm"
                >
                  {isLoadingMore ? '⏳ Loading...' : '📥 Load More'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Discovery Templates Feed */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 Discovery Templates (Real-Time)</CardTitle>
            <p className="text-sm text-gray-600">
              Live subscription to workout templates (Kind 33402)
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {discoveryTemplates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📋</div>
                  <p>No workout templates found</p>
                  <p className="text-xs">Subscription is active and waiting for events...</p>
                </div>
              ) : (
                discoveryTemplates.map((template, index) => (
                  <div key={template.eventId || index} className="border rounded p-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-sm">{template.title}</h4>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {template.difficulty}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Duration: ~{template.estimatedDuration} min</div>
                      <div>Exercises: {template.exercises.length}</div>
                      {template.rating && <div>Rating: ⭐ {template.rating.toFixed(1)}</div>}
                      <div>Author: {template.author.name}</div>
                      {template.eventId && (
                        <div className="font-mono text-xs bg-white p-1 rounded">
                          ID: {template.eventId.slice(0, 16)}...
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Infinite Scroll Controls */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {hasMoreTemplates ? 'More available' : 'All loaded'}
                </span>
                <Button
                  onClick={loadMoreDiscoveryTemplates}
                  disabled={!hasMoreTemplates || isLoadingMore}
                  variant="outline"
                  size="sm"
                >
                  {isLoadingMore ? '⏳ Loading...' : '📥 Load More'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-Time Testing Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 Real-Time Testing Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">✅ Phase 1 Complete: Real-Time Subscriptions</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Live WebSocket subscriptions to workout records (Kind 1301)</li>
                <li>Live WebSocket subscriptions to workout templates (Kind 33402)</li>
                <li>Automatic UI updates when new events are published</li>
                <li>NDK deduplication prevents duplicate events</li>
                <li>Proper subscription cleanup on component unmount</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">🔄 Infinite Scroll Implementation</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Timestamp-based pagination using `until` parameter</li>
                <li>Small page sizes (3 events) for testing with current data volume</li>
                <li>Separate pagination state for workouts and templates</li>
                <li>Loading states and &ldquo;no more data&rdquo; indicators</li>
                <li>Maintains chronological order during pagination</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">🎯 Testing Real-Time Updates</h4>
              <div className="bg-blue-50 p-3 rounded">
                <p className="font-medium text-blue-800 mb-2">To test real-time functionality:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  <li>Open this page in two browser tabs</li>
                  <li>Use WorkoutPublisher component to publish new events</li>
                  <li>Watch both tabs update automatically</li>
                  <li>Check console logs for subscription activity</li>
                  <li>Test infinite scroll with &ldquo;Load More&rdquo; buttons</li>
                </ol>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">📊 Architecture Validation</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li><strong>NDK-First:</strong> All data flows through NDK cache and subscriptions</li>
                <li><strong>Real-Time:</strong> WebSocket connections stay open for live updates</li>
                <li><strong>Performance:</strong> Small initial loads with on-demand pagination</li>
                <li><strong>Golf App Ready:</strong> Patterns proven for NOGA golf app migration</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
