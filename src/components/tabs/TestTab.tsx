'use client';

import React from 'react';
import { WorkoutListManager } from '@/components/test/WorkoutListManager';
import { GlobalWorkoutStatePersistenceValidationTest } from '@/components/test/GlobalWorkoutStatePersistenceValidationTest';
import DataParsingServiceTest from '@/components/test/DataParsingServiceTest';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TestTube, Target, List, Database } from 'lucide-react';

/**
 * Test Tab - Essential Testing
 * 
 * Contains only the essential test components we're actively working on.
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
          <h1 className="text-3xl font-bold">Essential Testing</h1>
          <p className="text-muted-foreground">
            Core tests for active development features
          </p>
        </div>
      </div>

      {/* Instructions */}
      <Alert>
        <Target className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p><strong>Current Focus:</strong></p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>WorkoutListManager - NIP-51 lists implementation (next feature)</li>
              <li>Global Workout State Persistence - Architecture validation</li>
              <li>Authenticate with NIP-07 extension for full functionality</li>
            </ol>
          </div>
        </AlertDescription>
      </Alert>

      {/* Test Components */}
      <div className="space-y-6">
        {/* 🎯 NEXT: NIP-51 Lists & Collections Test */}
        <div className="w-full">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <List className="h-5 w-5" />
                🎯 NEXT: NIP-51 Lists & Collections Test
              </CardTitle>
              <CardDescription className="text-green-700">
                Test NIP-51 list creation and management for workout collections. This is our next implementation target.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkoutListManager />
            </CardContent>
          </Card>
        </div>

        {/* 🏗️ ARCHITECTURE: Global Workout State Persistence */}
        <div className="w-full">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                🏗️ ARCHITECTURE: Global Workout State Persistence
              </CardTitle>
              <CardDescription className="text-blue-700">
                Validate the global workout state architecture and persistence across tab navigation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GlobalWorkoutStatePersistenceValidationTest />
            </CardContent>
          </Card>
        </div>

        {/* 🔧 SERVICE: Data Parsing Service Test */}
        <div className="w-full">
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-purple-800 flex items-center gap-2">
                <Database className="h-5 w-5" />
                🔧 SERVICE: Data Parsing Service Test
              </CardTitle>
              <CardDescription className="text-purple-700">
                Test the centralized DataParsingService for all workout data parsing operations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataParsingServiceTest />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Development Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Development Notes
          </CardTitle>
          <CardDescription>
            Current development focus and next steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-green-800 mb-2">🎯 Next Implementation: NIP-51 Lists</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Implement NIP-51 list creation for workout collections</li>
                <li>• Add list management UI components</li>
                <li>• Test list publishing and retrieval</li>
                <li>• Validate list event structure compliance</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-800 mb-2">🏗️ Architecture Validation</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Global workout state persistence across tabs</li>
                <li>• WorkoutUIProvider portal rendering</li>
                <li>• Mini bar visibility and expand functionality</li>
                <li>• Clean separation of concerns</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
