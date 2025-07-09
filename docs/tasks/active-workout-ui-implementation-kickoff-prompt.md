# Active Workout UI Implementation - Kickoff Prompt

## Task Summary
Implement a complete Active Workout UI system that integrates with the existing `activeWorkoutMachine.ts` XState machine. The system provides a full-screen workout tracking interface with exercise list view, set completion tracking, and total workout timer.

## Key Technical Approach
- **Integration Touch Point**: `WorkoutDetailModal` "Start workout" button → `onStartWorkout()` callback → spawn `activeWorkoutMachine`
- **Component Architecture**: Container/UI separation with `ActiveWorkoutContainer` handling XState integration
- **UI Library**: POWR UI components built on Radix primitives (NOT shadcn/ui)
- **Timer Strategy**: Total workout timer only (MVP scope - no rest timers)

## Primary Goal/Outcome
Create a production-ready active workout tracking interface that allows users to:
1. Start workouts from the existing `WorkoutDetailModal`
2. Track sets with weight/reps input optimized for mobile gym use
3. View total workout time and pause/resume functionality
4. Complete workouts that publish valid NIP-101e events to Nostr

## Key Files to Review

### **Critical Task Document**
- `docs/tasks/active-workout-ui-implementation-task.md` - Complete implementation requirements and success criteria

### **Existing Architecture (DO NOT MODIFY)**
- `src/lib/machines/workout/activeWorkoutMachine.ts` - Complete XState v5 implementation with all required actors
- `src/components/powr-ui/workout/WorkoutDetailModal.tsx` - Integration touch point with "Start workout" button

### **POWR UI Component Library**
- `src/components/powr-ui/primitives/Button.tsx` - Use for all buttons
- `src/components/powr-ui/primitives/Card.tsx` - Use for containers
- `src/components/powr-ui/primitives/Progress.tsx` - Use for progress bars
- `src/components/powr-ui/primitives/Input.tsx` - Use for weight/reps inputs

### **Relevant .clinerules**
- `.clinerules/radix-ui-component-library.md` - UI component standards (MANDATORY)
- `.clinerules/xstate-anti-pattern-prevention.md` - XState integration patterns (MANDATORY)
- `.clinerules/nip-101e-standards.md` - Event generation compliance
- `/Users/danielwyler/ReferenceRepos/state-management/xstate/xstate-react.mdx` - Xstate react documentation

## Starting Point
Begin with **Day 1: Core UI Components** from the task document:

1. **SetRow Component** - Weight/reps input with mobile-optimized touch targets
2. **ExerciseSection Component** - Exercise container with progress display
3. **ActiveWorkoutInterface Component** - Full-screen layout with timer
4. **Component Integration Testing** - Validate POWR UI styling consistency

## Critical Import Path Requirements

### **✅ CORRECT: Use POWR UI Primitives**
```typescript
import { Button } from '@/components/powr-ui/primitives/Button'
import { Card, CardContent, CardHeader } from '@/components/powr-ui/primitives/Card'
import { Progress } from '@/components/powr-ui/primitives/Progress'
import { Input } from '@/components/powr-ui/primitives/Input'
import { Label } from '@/components/powr-ui/primitives/Label'
```

### **❌ FORBIDDEN: Don't Use shadcn/ui**
```typescript
import { Button } from '@/components/ui/button'  // WRONG PATH
import { Card } from '@/components/ui/card'      // WRONG PATH
```

### **XState Integration Imports**
```typescript
import { useMachine, useSelector } from '@xstate/react'
import { activeWorkoutMachine } from '@/lib/machines/workout/activeWorkoutMachine'
```

## Component File Structure to Create
```
src/components/powr-ui/workout/
├── SetRow.tsx                    # Weight/reps input with completion
├── ExerciseSection.tsx           # Exercise container with progress
├── ActiveWorkoutInterface.tsx    # Full-screen layout with timer
└── ActiveWorkoutContainer.tsx    # XState integration layer

src/components/test/
└── ActiveWorkoutUITest.tsx       # Complete testing component
```

## Integration Flow
```
WorkoutDetailModal
    ↓ "Start workout" button click
    ↓ onStartWorkout() callback
    ↓ 
ActiveWorkoutContainer
    ↓ useMachine(activeWorkoutMachine, { input: templateData })
    ↓
activeWorkoutMachine
    ↓ loadingTemplate → exercising → completed → publishing
    ↓
ActiveWorkoutInterface
    ↓ SetRow completion
    ↓ COMPLETE_SET event
    ↓
setTrackingActor → publishWorkoutActor → NIP-101e event
```

## Success Criteria Highlights (80% minimum)
- All components use POWR UI primitives (no shadcn/ui)
- Touch targets are 44px+ for gym environments
- XState integration via `useMachine` (no context service injection)
- Set completion generates valid NIP-101e events
- Total workout timer displays correctly
- Pause/resume functionality works with machine state

## Dependencies Already Available
- ✅ `activeWorkoutMachine.ts` - Complete and working
- ✅ POWR UI component library - All primitives ready
- ✅ `WorkoutDetailModal` - Integration point ready
- ✅ NDK publishing - `publishWorkoutActor` handles event generation

## Timeline
- **Day 1**: Core UI Components (4-5 hours)
- **Day 2**: XState Integration (4-5 hours)  
- **Day 3**: End-to-End Testing (3-4 hours)

## Important Notes
- **MVP Scope**: Total workout timer only - no rest timers
- **Mobile First**: All components optimized for gym environments
- **No Architecture Changes**: Use existing `activeWorkoutMachine.ts` as-is
- **Standards Compliance**: All .clinerules are mandatory

---

**Ready to implement! Start with the SetRow component using POWR UI primitives.**
