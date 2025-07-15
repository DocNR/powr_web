'use client';

/**
 * WorkoutCardSkeleton - Loading placeholder for WorkoutCard
 * 
 * Matches the exact dimensions and layout of the real WorkoutCard
 * to prevent layout shift during loading states.
 */

import React from 'react';
import { Card, CardContent } from '@/components/powr-ui/primitives/Card';
import { cn } from '@/lib/utils';

interface WorkoutCardSkeletonProps {
  variant?: 'hero' | 'social' | 'discovery' | 'compact';
  className?: string;
}

export const WorkoutCardSkeleton: React.FC<WorkoutCardSkeletonProps> = ({
  variant = 'social',
  className
}) => {
  if (variant === 'social') {
    return (
      <Card className={cn("overflow-hidden animate-pulse", className)}>
        {/* Image skeleton */}
        <div className="relative h-48 w-full bg-gray-200">
          {/* Gradient overlay skeleton */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-300 via-gray-200 to-gray-300" />
          
          {/* Social proof badge skeleton */}
          <div className="absolute top-3 left-3 z-10">
            <div className="bg-gray-300 px-3 py-1.5 rounded-full h-6 w-20"></div>
          </div>
          
          {/* Author avatar skeleton */}
          <div className="absolute top-3 right-3 z-10">
            <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Title skeleton */}
          <div className="h-5 bg-gray-200 rounded-md w-3/4 mb-2"></div>
          
          {/* Description skeleton */}
          <div className="h-4 bg-gray-200 rounded-md w-full mb-1"></div>
          <div className="h-4 bg-gray-200 rounded-md w-2/3 mb-3"></div>

          {/* Stats skeleton */}
          <div className="flex items-center gap-2 text-sm">
            <div className="h-4 bg-gray-200 rounded-md w-16"></div>
            <span>•</span>
            <div className="h-4 bg-gray-200 rounded-md w-12"></div>
            <span>•</span>
            <div className="h-4 bg-gray-200 rounded-md w-20"></div>
          </div>

          {/* Difficulty and rating skeleton */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              {/* Difficulty dots skeleton */}
              <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-gray-200"
                  />
                ))}
              </div>
              <div className="h-4 bg-gray-200 rounded-md w-16"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded-md w-20"></div>
          </div>

          {/* Social proof timestamp skeleton */}
          <div className="mt-2">
            <div className="h-3 bg-gray-200 rounded-md w-24"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Discovery variant skeleton
  if (variant === 'discovery') {
    return (
      <Card className={cn("overflow-hidden animate-pulse", className)}>
        <div className="relative h-40 w-full bg-gray-200"></div>
        
        <CardContent className="p-4">
          <div className="h-5 bg-gray-200 rounded-md w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded-md w-full mb-1"></div>
          <div className="h-4 bg-gray-200 rounded-md w-2/3 mb-3"></div>
          
          <div className="flex items-center gap-2">
            <div className="h-4 bg-gray-200 rounded-md w-16"></div>
            <span>•</span>
            <div className="h-4 bg-gray-200 rounded-md w-12"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact variant skeleton
  if (variant === 'compact') {
    return (
      <Card className={cn("overflow-hidden animate-pulse", className)}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded-md w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded-md w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Hero variant skeleton
  return (
    <Card className={cn("overflow-hidden animate-pulse", className)}>
      <div className="relative h-64 w-full bg-gray-200">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-300 via-gray-200 to-gray-300" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="h-6 bg-gray-300 rounded-md w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded-md w-1/2"></div>
        </div>
      </div>
    </Card>
  );
};

export default WorkoutCardSkeleton;