# Active Workout UI Implementation Plan

## Project Overview

**Objective**: Implement a complete Active Workout UI system that integrates with the existing `activeWorkoutMachine.ts` XState machine to provide full-screen workout tracking interface.

**Integration Touch Point**: `WorkoutDetailModal` "Start workout" button → `onStartWorkout()` callback → spawn `activeWorkoutMachine`

**Architecture**: Container/UI separation with `ActiveWorkoutContainer` handling XState integration and pure UI components for display.

## Architecture Analysis

### ✅ Excellent Foundation in Place
- **Complete XState Machine**: `activeWorkoutMachine.ts` fully implemented with all required actors, states, and event handling
- **POWR UI Component Library**: Well-structured Radix-based primitives with gym personality theming
- **Clear Integration Point**: `WorkoutDetailModal.onStartWorkout()` callback ready for machine spawning
- **NDK Publishing**: Complete event publishing pipeline with NIP-101e compliance and deduplication fixes

### 🎯 Key Integration Insights
- Machine auto-generates set data from context, eliminating complex UI data management
- Progressive set tracking with NDK deduplication fixes already implemented
- Timer state managed entirely by machine (`timingInfo.startTime`)
- Clear event flow: UI → `COMPLETE_SET` → `setTrackingActor` → context update

## 3-Day Implementation Timeline

### **Day 1: Core UI Components (4-5 hours)**

#### Component File Structure
```
src/components/powr-ui/workout/
├── SetRow.tsx                    # Weight/reps input with completion
├── ExerciseSection.tsx           # Exercise container with progress
├── ActiveWorkoutInterface.tsx    # Full-screen layout (no timer)
├── WorkoutMiniBar.tsx            # Bottom mini bar with title + timer
└── ActiveWorkoutContainer.tsx    # XState integration layer

src/components/test/
└── ActiveWorkoutUITest.tsx       # Complete testing component
```

#### Implementation Order

**1. SetRow Component (1.5 hours)**
- Mobile-optimized number inputs for weight/reps
- 44px+ touch targets for gym environments
- Completion checkbox with visual feedback
- Previous set data reference display
- **POWR UI Components**: `Button`, `Input`, `Label`

**2. ExerciseSection Component (1.5 hours)**
- Exercise name and set count display
- Set list with SetRow components
- Add set functionality
- Simple completed/total count (no progress bar for MVP)
- **POWR UI Components**: `Card`, `CardContent`, `CardHeader`

**3. ActiveWorkoutInterface Component (1.5 hours)**
- Full-screen layout with header timer
- Pause/Cancel/Finish controls in header
- Scrollable exercise list
- Confirmation dialogs for Cancel and Finish actions
- **POWR UI Components**: `Card`, `Button` + `Dialog` from shadcn/ui

**4. Component Integration Testing (0.5 hours)**
- Test individual components with mock data
- Validate mobile touch targets (44px+ minimum)
- Verify POWR UI styling consistency

### **Day 2: XState Integration (4-5 hours)**

**1. ActiveWorkoutContainer Component (2 hours)**
- **Spawn Integration**: Receive template data from `WorkoutDetailModal.onStartWorkout()`
- **Machine Setup**: `useMachine(activeWorkoutMachine, { input: templateData })`
- **Data Transformation**: Machine context → UI props
- **Event Handlers**: Set completion, pause/resume, finish

**2. Timer Implementation (1 hour)**
- Total workout timer using machine context `timingInfo.startTime`
- Format display (MM:SS or HH:MM:SS for long workouts)
- Pause/resume timer state synchronization

**3. Workout Control Integration (1 hour)**
- Pause/resume functionality with machine state sync
- Cancel workout with confirmation dialog → `CANCEL_WORKOUT` event
- Finish workout with confirmation dialog → `COMPLETE_WORKOUT` event

**4. Set Tracking Integration (1 hour)**
- Connect SetRow completion to `COMPLETE_SET` event
- Auto-generate set data from machine context (existing pattern)
- Handle progressive set tracking for NDK deduplication

**5. State Synchronization Testing (0.5 hours)**
- Test pause/resume functionality
- Verify set completion updates machine state
- Test cancel/finish confirmation dialogs

### **Day 3: End-to-End Integration & Testing (3-4 hours)**

**1. ActiveWorkoutUITest Component (1.5 hours)**
- Comprehensive test component with mock workout templates
- **Integration Flow**: Template selection → active tracking → completion
- **Touch Point Testing**: `WorkoutDetailModal` → `ActiveWorkoutContainer` → `activeWorkoutMachine`

**2. Complete Flow Testing (1 hour)**
- Test template selection to published NIP-101e event
- Validate with real dependency resolution service data
- Test pause/resume across component re-renders

**3. Performance Optimization (1 hour)**
- Optimize re-renders with React.memo where needed
- Validate memory usage during long workouts
- Test on mobile devices for touch responsiveness

**4. Documentation & Handoff (0.5 hours)**
- Update component documentation
- Create usage examples
- Document integration patterns

## Technical Implementation Details

### XState Integration Pattern
```typescript
// ActiveWorkoutContainer.tsx
import { useMachine } from '@xstate/react';
import { activeWorkoutMachine } from '@/lib/machines/workout/activeWorkoutMachine';

const ActiveWorkoutContainer = ({ templateData, userPubkey, onClose }) => {
  const [state, send] = useMachine(activeWorkoutMachine, {
    input: {
      userInfo: { pubkey: userPubkey },
      workoutData: { exercises: templateData.exercises },
      templateSelection: { templateId: templateData.id }
    }
  });

  // Set completion handler
  const handleSetComplete = (setData?: Partial<SetData>) => {
    send({ type: 'COMPLETE_SET', setData });
  };

  // Workout control handlers
  const handlePause = () => send({ type: 'PAUSE_WORKOUT' });
  const handleResume = () => send({ type: 'RESUME_WORKOUT' });
  const handleCancel = () => send({ type: 'CANCEL_WORKOUT' });
  const handleFinish = () => send({ type: 'COMPLETE_WORKOUT' });

  return (
    <ActiveWorkoutInterface
      state={state}
      onSetComplete={handleSetComplete}
      onPause={handlePause}
      onResume={handleResume}
      onCancel={handleCancel}
      onFinish={handleFinish}
      onClose={onClose}
    />
  );
};
```

### POWR UI Import Standards
```typescript
// ✅ CORRECT: Use POWR UI primitives
import { Button } from '@/components/powr-ui/primitives/Button'
import { Card, CardContent, CardHeader } from '@/components/powr-ui/primitives/Card'
import { Input } from '@/components/powr-ui/primitives/Input'
import { Label } from '@/components/powr-ui/primitives/Label'

// For confirmation dialogs only
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

// ❌ FORBIDDEN: Don't use shadcn/ui for main components
import { Button } from '@/components/ui/button'  // Wrong path
```

### Mobile Optimization Requirements
- **Touch Targets**: All interactive elements minimum 44px height
- **Number Inputs**: Optimized for gym environments with large, easy-to-tap controls
- **Scrolling**: Smooth scrolling through exercise lists
- **Performance**: Responsive input handling under 50ms
- **Viewport**: Full-screen layout optimized for mobile devices

### XState-Native Timer Implementation

Based on XState documentation examples, we'll implement a fully integrated timer using the `fromCallback` pattern with actor subscription:

#### 1. Timer Actor Integration in activeWorkoutMachine.ts
```typescript
// Add to actors section in activeWorkoutMachine.ts
actors: {
  // ... existing actors
  
  // XState-native timer using fromCallback pattern
  workoutTimer: fromCallback(({ sendBack }) => {
    const interval = setInterval(() => {
      sendBack({ type: 'TIMER_TICK' });
    }, 1000); // Update every second
    
    return () => clearInterval(interval);
  })
}

// Update exercising state to invoke timer
states: {
  exercising: {
    invoke: {
      src: 'workoutTimer' // Timer runs during exercising
    },
    
    on: {
      TIMER_TICK: {
        actions: assign({
          timingInfo: ({ context }) => ({
            ...context.timingInfo,
            // Calculate elapsed time accounting for pauses
            currentElapsed: Date.now() - context.timingInfo.startTime - context.workoutSession.totalPauseTime
          })
        })
      },
      // ... existing events
    }
  },
  
  paused: {
    // Timer automatically stops when paused (no invoke)
    // Will restart when returning to exercising state
  }
}
```

#### 2. React Integration with useSelector (No Mixed State)
```typescript
// WorkoutMiniBar.tsx - Pure XState integration
import { useSelector } from '@xstate/react';

const WorkoutMiniBar = ({ actorRef }) => {
  // Use useSelector for efficient, XState-native updates
  const elapsedTime = useSelector(actorRef, (state) => 
    state.context.timingInfo.currentElapsed || 0
  );
  
  const workoutTitle = useSelector(actorRef, (state) => 
    state.context.workoutData.template?.name || 'Workout'
  );
  
  const isPaused = useSelector(actorRef, (state) => 
    state.context.workoutSession.isPaused
  );

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-3 shadow-lg">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <span className="font-medium truncate flex-1 mr-4">{workoutTitle}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isPaused && <span className="text-orange-500 text-sm">⏸</span>}
          <span className="font-mono text-lg">{formatTime(elapsedTime)}</span>
        </div>
      </div>
    </div>
  );
};
```

#### 3. Benefits of XState-Native Timer
- **No React Timer Logic**: Timer is entirely managed by XState machine
- **Automatic Pause/Resume**: Timer stops/starts with state transitions
- **Efficient Updates**: `useSelector` only re-renders when timer changes
- **State Persistence**: Timer survives component unmounts
- **No Race Conditions**: Single source of truth in machine state

## Two-Timer Architecture: Workout Timer vs Rest Timer

### Current Implementation Analysis
Looking at `activeWorkoutMachine.ts`, there are **two separate timer systems**:

#### 1. **Workout Timer** (Total Workout Duration)
- **Purpose**: Track total workout elapsed time
- **Scope**: Entire workout session
- **Implementation**: New `workoutTimer` actor (to be added)
- **UI Display**: WorkoutMiniBar bottom component
- **Behavior**: Runs during `exercising` state, pauses during `paused` state

#### 2. **Rest Timer** (Between Sets)
- **Purpose**: Track rest periods between sets
- **Scope**: Individual rest periods
- **Implementation**: Existing `restTimer` actor in machine
- **UI Display**: Future rest timer component (not in MVP)
- **Behavior**: Runs during `restPeriod` sub-state

### Architecture Decision: Same Machine, Different Actors

**✅ RECOMMENDED: Use the same `activeWorkoutMachine` for both timers**

**Benefits**:
- **Unified State Management**: Both timers controlled by same machine
- **Coordinated Behavior**: Rest timer can pause when workout is paused
- **Simplified Architecture**: Single source of truth for all timing
- **XState Best Practice**: Multiple actors in one machine is the intended pattern

**Implementation Pattern**:
```typescript
// activeWorkoutMachine.ts - Two timer actors
actors: {
  // Total workout timer (NEW - to be added)
  workoutTimer: fromCallback(({ sendBack }) => {
    const interval = setInterval(() => {
      sendBack({ type: 'WORKOUT_TIMER_TICK' });
    }, 1000);
    return () => clearInterval(interval);
  }),
  
  // Rest timer (EXISTING - already implemented)
  restTimer: fromPromise<void, { duration: number }>(async ({ input }) => {
    const { duration } = input;
    return new Promise((resolve) => {
      setTimeout(() => resolve(), duration);
    });
  })
}

states: {
  exercising: {
    // Workout timer runs during entire exercising state
    invoke: {
      src: 'workoutTimer'
    },
    
    states: {
      performingSet: {
        // No rest timer here
      },
      
      restPeriod: {
        // Rest timer runs during rest periods
        invoke: {
          src: 'restTimer',
          input: { duration: 60000 } // 1 minute
        }
      }
    }
  }
}
```

### Future Rest Timer UI (Post-MVP)
When we add rest timer UI in later phases:

```typescript
// RestTimerDisplay.tsx (Future component)
const RestTimerDisplay = ({ actorRef }) => {
  const isResting = useSelector(actorRef, (state) => 
    state.matches({ exercising: 'restPeriod' })
  );
  
  const restTimeRemaining = useSelector(actorRef, (state) => 
    state.context.restTimeRemaining || 0
  );
  
  if (!isResting) return null;
  
  return (
    <div className="rest-timer-overlay">
      <div className="text-center">
        <h3>Rest Period</h3>
        <div className="text-4xl font-mono">
          {formatTime(restTimeRemaining)}
        </div>
        <Button onClick={() => actorRef.send({ type: 'END_REST_PERIOD' })}>
          Skip Rest
        </Button>
      </div>
    </div>
  );
};
```

### MVP Scope: Workout Timer Only
For this implementation, we're focusing on:
- ✅ **Workout Timer**: Total workout duration in WorkoutMiniBar
- ❌ **Rest Timer UI**: Deferred to future phases (machine logic exists)

The rest timer will run in the background during rest periods, but won't have UI display in the MVP.

## Success Criteria (80% minimum)

### Core Functionality (100% required)
- [ ] All 5 UI components render without errors using POWR UI primitives
- [ ] SetRow input handling works smoothly on mobile with 44px+ touch targets (always-visible inputs)
- [ ] ExerciseSection displays set count and exercise list with free navigation
- [ ] ActiveWorkoutInterface shows optimized header with Pause/Resume/Finish controls (no timer)
- [ ] WorkoutMiniBar displays at bottom with workout title + timer (Spotify-style)
- [ ] ActiveWorkoutContainer integrates with `activeWorkoutMachine` via `useMachine`
- [ ] Cancel and Finish buttons show simple confirmation dialogs before action

### XState Integration (100% required)
- [ ] "Start workout" button in `WorkoutDetailModal` spawns `activeWorkoutMachine` correctly
- [ ] Set completion triggers `COMPLETE_SET` event with auto-generated data
- [ ] Pause/resume functionality works with machine state synchronization
- [ ] Cancel workout triggers `CANCEL_WORKOUT` event after confirmation
- [ ] Finish workout triggers `COMPLETE_WORKOUT` event after confirmation
- [ ] Workout completion generates valid NIP-101e event via `publishWorkoutActor`
- [ ] State persists across component unmounts/remounts

### User Experience (80% required)
- [ ] Exercise list view with sets beneath feels intuitive and responsive
- [ ] Touch targets work smoothly in gym environment (44px+ validated)
- [ ] Timer display is clear and updates correctly from machine context
- [ ] Pause/Cancel/Finish controls are easily accessible and clear
- [ ] Confirmation dialogs prevent accidental workout cancellation/completion
- [ ] Completion flow feels satisfying and publishes to Nostr network

### Performance (80% required)
- [ ] Component rendering stays under 100ms
- [ ] No memory leaks during pause/resume cycles
- [ ] Smooth scrolling through exercise list
- [ ] Responsive input handling under 50ms

### Standards Compliance (100% required)
- [ ] All components use POWR UI primitives: `@/components/powr-ui/primitives/`
- [ ] XState integration follows anti-pattern prevention rules
- [ ] Generated events comply with NIP-101e specification
- [ ] Mobile optimization meets 44px+ touch target requirements

## Integration Flow Diagram

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

## Risk Mitigation

### Low Risk Factors
- ✅ `activeWorkoutMachine.ts` is complete and working
- ✅ POWR UI component library is established
- ✅ `WorkoutDetailModal` integration point is ready
- ✅ NDK publishing pipeline is proven

### Mitigation Strategies
- **Day 1 Issues**: Focus on core SetRow and ExerciseSection, defer ActiveWorkoutInterface
- **Day 2 Issues**: Use simplified timer implementation, defer advanced XState features
- **Day 3 Issues**: Focus on basic integration, defer performance optimization

### Fallback Plans
- **Component Issues**: Use simpler HTML elements with POWR UI styling
- **XState Issues**: Implement basic state management with useState as fallback
- **Performance Issues**: Optimize after core functionality is working

## UX Decisions (FINALIZED)

### ✅ 1. Timer Display: Bottom Mini Bar (Spotify-Style)
**Decision**: Bottom mini bar with workout title + timer for future minimization support

**Benefits**:
- **Spotify-Style Minimization Ready**: Persistent position for smooth minimize/expand transitions
- **Better UX During Active Workout**: Frees header for pause/finish controls
- **Navigation Integration**: Works perfectly above bottom tabs
- **Thumb Reachable**: Easy to tap for future minimize/expand functionality

**Implementation**:
- Persistent bottom position (above navigation tabs)
- Essential info: Workout title (truncated) + timer
- Future-ready foundation for minimization feature

### ✅ 2. Set Input UX: Always-Visible Inputs
**Decision**: Always-visible weight/reps inputs for current set, display-only for completed sets

**Implementation**:
- Current set: Large, touch-optimized number inputs (44px+ height)
- Completed sets: Display-only with visual completion indicators
- Quick edit: Tap completed sets to re-edit if needed

### ✅ 3. Exercise Navigation: Free Navigation
**Decision**: Users can navigate freely between all exercises during workout

**Implementation**:
- Exercise list with tap-to-navigate functionality
- Visual indicators for current exercise
- Skip/jump to any exercise at any time
- Progress tracking per exercise regardless of order

### ✅ 4. Confirmation Dialogs: Simple Alerts
**Decision**: Simple confirmation dialogs, workout summary comes after completion

**Implementation**:
- Cancel: "Are you sure you want to cancel this workout?"
- Finish: "Are you sure you want to finish this workout?"
- Post-completion: Detailed workout summary screen (separate from confirmations)

## Next Steps

1. **Answer Clarification Questions**: Update this plan based on UX preferences
2. **Begin Day 1 Implementation**: Start with SetRow component
3. **Iterative Testing**: Test each component as it's built
4. **Integration Validation**: Ensure XState integration works smoothly
5. **End-to-End Testing**: Validate complete workout flow

## Dependencies

### Required Existing Components
- ✅ `activeWorkoutMachine.ts` - Complete XState v5 implementation
- ✅ POWR UI component library - Radix primitives at `src/components/powr-ui/primitives/`
- ✅ `WorkoutDetailModal` - For "Start workout" button integration
- ✅ NDK integration - For event publishing via `publishWorkoutActor`

### Required Standards
- ✅ `.clinerules/radix-ui-component-library.md` - UI component standards
- ✅ `.clinerules/xstate-anti-pattern-prevention.md` - XState integration patterns
- ✅ `.clinerules/nip-101e-standards.md` - Event generation compliance

---

**Status**: Ready for Implementation
**Timeline**: 3 days (12-14 hours total)
**Success Threshold**: 80% minimum
**Architecture**: POWR UI + XState v5 + NDK-first patterns
**Integration Touch Point**: `WorkoutDetailModal.onStartWorkout()` → spawn `activeWorkoutMachine`
