---
title: UI Sprint Day 2 - WorkoutCard + Calendar Bar Implementation
description: Build beautiful WorkoutCard component and calendar bar for workout scheduling, integrating with existing WorkflowValidationTest
status: ready
start_date: 2025-07-01
category: task
priority: high
estimated_duration: 4-6 hours
sprint_day: 2
parent_sprint: ui-sprint-plan.md
lead: Developer + Claude
dependencies:
  - ui-sprint-day-1-foundation-task-COMPLETED.md
success_criteria_threshold: 80%
---

# UI Sprint Day 2 - WorkoutCard + Calendar Bar Implementation

## 🎯 Objective

Build the core workout discovery experience with beautiful WorkoutCard components and calendar bar for workout scheduling, while integrating seamlessly with existing WorkflowValidationTest functionality.

## 📋 Current State Analysis

### **Day 1 Foundation Complete ✅**
- POWR UI directory structure established (`src/components/powr-ui/`)
- 8 core primitive components built (Button, Card, Badge, Sheet, Avatar, Progress, Input, Label)
- AppHeader with settings drawer implemented
- Enhanced bottom navigation with orange gradient active states
- All existing XState + NDK functionality preserved

### **Existing Integration Points**
- `src/components/test/WorkflowValidationTest.tsx` - Current template selection interface
- `src/lib/machines/workout/workoutSetupMachine.ts` - Template loading state machine
- `src/lib/actors/loadTemplateActor.ts` - Template loading with 272ms performance
- Template data structure already established and working

### **Design Requirements**
- Orange gradient buttons matching mobile app designs
- Touch-optimized 44px+ targets for gym environments
- Calendar bar with 7-day week view and workout indicators
- WorkoutCard with exercise count, duration, and difficulty badges

## 🛠 Technical Approach

### **Component Architecture**
```
src/components/powr-ui/workout/
├── WorkoutCard.tsx          # Main workout template card
├── CalendarBar.tsx          # 7-day calendar with workout indicators
└── index.ts                 # Barrel exports
```

### **Integration Strategy**
1. **Preserve Existing Logic**: Keep all WorkflowValidationTest state management
2. **Enhance UI Only**: Replace basic template display with beautiful WorkoutCard
3. **Add Calendar**: Integrate calendar bar for workout scheduling context
4. **Maintain Performance**: Ensure 272ms template loading benchmark preserved

## 📅 Implementation Steps

### **Morning: Calendar Bar Component (2-3 hours)**

#### **Step 1: Calendar Bar Foundation**
```typescript
// src/components/powr-ui/workout/CalendarBar.tsx
import { useState } from 'react'
import { format, addDays, startOfWeek, isSameDay } from 'date-fns'
import { cn } from '@/lib/utils'

interface CalendarBarProps {
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  workoutDates?: Date[] // Dates with scheduled workouts
}

export const CalendarBar = ({ 
  selectedDate = new Date(), 
  onDateSelect,
  workoutDates = []
}: CalendarBarProps) => {
  const [currentDate, setCurrentDate] = useState(selectedDate)
  
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }) // Sunday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  
  const hasWorkout = (date: Date) => {
    return workoutDates.some(workoutDate => 
      isSameDay(date, workoutDate)
    )
  }
  
  const handleDateSelect = (date: Date) => {
    setCurrentDate(date)
    onDateSelect?.(date)
  }
  
  return (
    <div className="bg-background border-b p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Today</h2>
        <p className="text-sm text-muted-foreground">
          {format(currentDate, 'EEEE, MMMM d')}
        </p>
      </div>
      
      {/* 7-day week view */}
      <div className="flex gap-2">
        {weekDays.map((day, i) => (
          <button
            key={i}
            onClick={() => handleDateSelect(day)}
            className={cn(
              "flex flex-col items-center p-3 rounded-lg min-w-[44px] flex-1",
              "transition-colors touch-manipulation",
              isSameDay(day, currentDate) 
                ? "bg-orange-500 text-white" 
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <span className={cn(
              "text-xs mb-1",
              isSameDay(day, currentDate) 
                ? "text-white" 
                : "text-muted-foreground"
            )}>
              {format(day, 'EEE')}
            </span>
            <span className="font-semibold">
              {format(day, 'd')}
            </span>
            {/* Workout indicator dot */}
            {hasWorkout(day) && (
              <div className={cn(
                "w-1 h-1 rounded-full mt-1",
                isSameDay(day, currentDate) 
                  ? "bg-white" 
                  : "bg-orange-500"
              )} />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
```

#### **Step 2: Calendar Integration with Mock Data**
```typescript
// Add to WorkoutsTab or WorkflowValidationTest
const mockWorkoutDates = [
  new Date(), // Today
  addDays(new Date(), 2), // Day after tomorrow
  addDays(new Date(), -1), // Yesterday
]

<CalendarBar 
  workoutDates={mockWorkoutDates}
  onDateSelect={(date) => console.log('Selected date:', date)}
/>
```

### **Afternoon: WorkoutCard Implementation (2-3 hours)**

#### **Step 3: WorkoutCard Component**
```typescript
// src/components/powr-ui/workout/WorkoutCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/powr-ui/primitives/Card'
import { Button } from '@/components/powr-ui/primitives/Button'
import { Badge } from '@/components/powr-ui/primitives/Badge'
import { Clock, Dumbbell, Users } from 'lucide-react'

interface WorkoutCardProps {
  workout: {
    id: string
    name: string
    exercises: { length: number } | any[]
    estimatedDuration?: number
    difficulty?: 'beginner' | 'intermediate' | 'advanced'
    description?: string
    tags?: string[]
  }
  onSelect: (workoutId: string) => void
  variant?: 'default' | 'compact'
}

export const WorkoutCard = ({ 
  workout, 
  onSelect, 
  variant = 'default' 
}: WorkoutCardProps) => {
  const exerciseCount = Array.isArray(workout.exercises) 
    ? workout.exercises.length 
    : workout.exercises?.length || 0
    
  const duration = workout.estimatedDuration 
    ? Math.floor(workout.estimatedDuration / 60) 
    : 30

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  }

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] touch-manipulation"
      onClick={() => onSelect(workout.id)}
    >
      <CardHeader className={variant === 'compact' ? 'pb-2' : undefined}>
        <div className="flex items-start justify-between">
          <CardTitle className={variant === 'compact' ? 'text-base' : 'text-lg'}>
            {workout.name}
          </CardTitle>
          {workout.difficulty && (
            <Badge 
              variant="secondary" 
              className={difficultyColors[workout.difficulty]}
            >
              {workout.difficulty}
            </Badge>
          )}
        </div>
        {workout.description && variant === 'default' && (
          <p className="text-sm text-muted-foreground mt-1">
            {workout.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className={variant === 'compact' ? 'pt-0' : undefined}>
        <div className="space-y-3">
          {/* Workout stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Dumbbell className="h-4 w-4" />
              <span>{exerciseCount} exercises</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{duration} min</span>
            </div>
          </div>

          {/* Tags */}
          {workout.tags && workout.tags.length > 0 && variant === 'default' && (
            <div className="flex flex-wrap gap-1">
              {workout.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {workout.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{workout.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Orange gradient button matching designs */}
          <Button 
            className="w-full"
            style={{
              background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
              border: 'none',
              color: 'white',
              fontWeight: 600,
              minHeight: '44px' // Touch-optimized for gym use
            }}
            onClick={(e) => {
              e.stopPropagation()
              onSelect(workout.id)
            }}
          >
            Start Workout
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

#### **Step 4: Integration with WorkflowValidationTest**
```typescript
// Update src/components/test/WorkflowValidationTest.tsx
import { WorkoutCard } from '@/components/powr-ui/workout/WorkoutCard'
import { CalendarBar } from '@/components/powr-ui/workout/CalendarBar'

// Add to the template selection section:
<div className="space-y-6">
  {/* Calendar Bar */}
  <CalendarBar 
    workoutDates={[new Date(), addDays(new Date(), 2)]}
    onDateSelect={(date) => console.log('Selected workout date:', date)}
  />
  
  {/* Template Grid */}
  <div>
    <h3 className="text-lg font-semibold mb-4">Available Templates</h3>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {state.context.availableTemplates.map((template) => (
        <WorkoutCard
          key={template.id}
          workout={{
            id: template.id,
            name: template.name,
            exercises: template.exercises,
            estimatedDuration: template.estimatedDuration,
            difficulty: template.difficulty || 'intermediate',
            description: template.description,
            tags: template.tags || ['strength', 'bodyweight']
          }}
          onSelect={handleTemplateSelect}
        />
      ))}
    </div>
  </div>
</div>
```

#### **Step 5: Barrel Exports**
```typescript
// src/components/powr-ui/workout/index.ts
export { WorkoutCard } from './WorkoutCard'
export { CalendarBar } from './CalendarBar'

// Update src/components/powr-ui/index.ts
export * from './workout'
```

## ✅ Success Criteria (80% Minimum Threshold)

### **Calendar Bar Implementation ✅**
- [ ] 7-day week view with proper date navigation
- [ ] Touch-optimized buttons (44px+ targets)
- [ ] Orange active state matching design specifications
- [ ] Workout indicator dots for scheduled workouts
- [ ] Responsive design for mobile and desktop
- [ ] Dark mode support

### **WorkoutCard Implementation ✅**
- [ ] Beautiful card design matching specifications
- [ ] Exercise count and duration display
- [ ] Difficulty badges with proper colors
- [ ] Orange gradient "Start Workout" button
- [ ] Touch-optimized interactions
- [ ] Hover effects and animations
- [ ] Compact variant for different layouts

### **Integration Success ✅**
- [ ] WorkflowValidationTest using new WorkoutCard component
- [ ] Template selection working with enhanced UI
- [ ] All existing XState functionality preserved
- [ ] 272ms performance benchmark maintained
- [ ] Zero TypeScript errors
- [ ] No regression in existing behavior

### **Mobile Optimization ✅**
- [ ] Touch targets 44px+ for gym environments
- [ ] Smooth animations and transitions
- [ ] Proper spacing and typography
- [ ] Orange gradient buttons working on all devices
- [ ] Calendar responsive across screen sizes

### **Architecture Compliance ✅**
- [ ] POWR UI component library patterns followed
- [ ] Radix UI primitives used correctly
- [ ] Class Variance Authority integration
- [ ] Proper TypeScript interfaces
- [ ] Barrel exports configured

## 🔗 References

### **Design Foundation**
- **Day 1 Components**: `src/components/powr-ui/primitives/`
- **Existing Integration**: `src/components/test/WorkflowValidationTest.tsx`
- **State Management**: `src/lib/machines/workout/workoutSetupMachine.ts`
- **Performance Target**: 272ms template loading benchmark

### **Standards Compliance**
- **Component Standards**: `.clinerules/radix-ui-component-library.md`
- **Auto-formatter Workflow**: `.clinerules/auto-formatter-imports.md`
- **Sprint Coordination**: `docs/tasks/ui-sprint-plan.md`

### **Technical Resources**
- **Radix UI Card**: https://www.radix-ui.com/primitives/docs/components/card
- **Date-fns**: https://date-fns.org/docs/Getting-Started
- **Tailwind CSS**: https://tailwindcss.com/docs

## 🚀 Day 2 Kickoff

### **Immediate Next Steps**
1. **Install date-fns** for calendar functionality: `npm install date-fns`
2. **Create CalendarBar component** with 7-day week view
3. **Build WorkoutCard component** with orange gradient buttons
4. **Integrate with WorkflowValidationTest** for template selection
5. **Test mobile touch optimization** and performance

### **Key Benefits**
- ✅ **Beautiful workout discovery** with calendar context
- ✅ **Enhanced template selection** with visual cards
- ✅ **Mobile-optimized** for gym environments
- ✅ **Performance maintained** at 272ms benchmark
- ✅ **Foundation ready** for Day 3 active workout modal

### **Success Validation**
- Template selection works with new WorkoutCard interface
- Calendar bar provides workout scheduling context
- Orange gradient buttons match design specifications
- All touch targets optimized for gym use
- Zero regression in existing XState functionality

---

**Focus**: Build beautiful workout discovery experience while preserving all existing functionality and maintaining enterprise-grade performance standards.
