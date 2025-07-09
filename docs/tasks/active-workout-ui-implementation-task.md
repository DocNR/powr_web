# Active Workout UI Implementation Task

## Research Foundation
- **Integration Touch Point**: `WorkoutDetailModal` "Start workout" button → `onStartWorkout()` callback → spawn `activeWorkoutMachine`
- **Architecture Analysis**: Existing `activeWorkoutMachine.ts` provides complete XState v5 state management
- **Component Foundation**: POWR UI component library established with Radix primitives at `src/components/powr-ui/primitives/`
- **UX Research**: Downloaded component examples demonstrate preferred exercise list view with sets beneath
- **MVP Scope**: Total workout timer only, no rest timers or exercise progress bars for initial implementation
- **Workout Controls**: User can Pause, Cancel (with confirmation), and Finish (with confirmation) workouts
- **Standards Compliance**: All patterns follow `.clinerules/radix-ui-component-library.md` and `.clinerules/xstate-anti-pattern-prevention.md`

## Implementation Requirements

### **NIP-101e Compliance**
- All completed sets must generate valid NIP-101e workout record events (Kind 1301)
- Exercise references must follow `33401:pubkey:d-tag` format exactly
- Set data must include: exerciseRef, setNumber, reps, weight, rpe, setType, completedAt
- Progressive set tracking with unique set numbers to bypass NDK deduplication

### **XState Integration Touch Points**
- **Spawn Point**: `WorkoutDetailModal` "Start workout" button calls `onStartWorkout()` → spawn `activeWorkoutMachine`
- **Machine Integration**: Use `useMachine` and `useSelector` patterns, no context service injection
- **Event Flow**: UI SetRow completion → `COMPLETE_SET` → `setTrackingActor` → machine context update
- **Container Pattern**: `ActiveWorkoutContainer` handles XState, pure UI components for display

### **UI Standards**
- **Component Library**: POWR UI components at `src/components/powr-ui/primitives/` (no shadcn/ui)
- **Import Paths**: `import { Button } from '@/components/powr-ui/primitives/Button'`
- **Mobile Optimization**: Touch targets 44px+ minimum for gym environments
- **UX Pattern**: Exercise list view with sets beneath each exercise (preferred UX from artifacts)
- **Timer Display**: Total workout timer in header (MVP scope - no rest timers)

### **Performance Targets**
- Component rendering under 100ms for smooth set tracking
- State updates under 50ms for responsive input handling
- Memory usage stable during long workouts (2+ hours)
- No memory leaks during pause/resume cycles

## Implementation Steps

### **Day 1: Core UI Components (4-5 hours)**

#### **Component File Structure**
```
src/components/powr-ui/workout/
├── SetRow.tsx                    # Weight/reps input with completion
├── ExerciseSection.tsx           # Exercise container with progress
├── ActiveWorkoutInterface.tsx    # Full-screen layout with timer
└── ActiveWorkoutContainer.tsx    # XState integration layer

src/components/test/
└── ActiveWorkoutUITest.tsx       # Complete testing component
```

#### **Implementation Order**
1. **SetRow Component** (1.5 hours)
   - Weight/reps input with mobile-optimized number inputs
   - Completion checkbox with visual feedback
   - Previous set data reference display
   - Touch-optimized 44px+ targets for gym environments
   - **Import**: `import { Button } from '@/components/powr-ui/primitives/Button'`

2. **ExerciseSection Component** (1.5 hours)
   - Exercise name and set count display
   - Set list with SetRow components
   - Add set functionality
   - Simple completed/total count (no progress bar for MVP)
   - **Import**: `import { Card } from '@/components/powr-ui/primitives/Card'`

3. **ActiveWorkoutInterface Component** (1.5 hours)
   - Full-screen layout with header timer
   - Pause/Cancel/Finish controls in header
   - Scrollable exercise list
   - Confirmation dialogs for Cancel and Finish actions
   - **Import**: `import { Card } from '@/components/powr-ui/primitives/Card'`

4. **Component Integration Testing** (0.5 hours)
   - Test individual components with mock data
   - Validate mobile touch targets
   - Verify POWR UI styling consistency

### **Day 2: XState Integration (4-5 hours)**

#### **Integration Touch Point Implementation**
1. **ActiveWorkoutContainer Component** (2 hours)
   - **Spawn Integration**: Receive template data from `WorkoutDetailModal.onStartWorkout()`
   - **Machine Setup**: `useMachine(activeWorkoutMachine, { input: templateData })`
   - **Data Transformation**: Machine context → UI props
   - **Event Handlers**: Set completion, pause/resume, finish

2. **Timer Implementation** (1 hour)
   - Total workout timer using machine context `timingInfo.startTime`
   - Format display (MM:SS or HH:MM:SS for long workouts)
   - Pause/resume timer state synchronization
   - **Integration**: Timer state from `activeWorkoutMachine` context

3. **Workout Control Integration** (1 hour)
   - Pause/resume functionality with machine state sync
   - Cancel workout with confirmation dialog → `CANCEL_WORKOUT` event
   - Finish workout with confirmation dialog → `COMPLETE_WORKOUT` event
   - **Event Flow**: UI controls → machine events → state updates

4. **Set Tracking Integration** (1 hour)
   - Connect SetRow completion to `COMPLETE_SET` event
   - Auto-generate set data from machine context (existing pattern)
   - Handle progressive set tracking for NDK deduplication
   - **Event Flow**: UI → `COMPLETE_SET` → `setTrackingActor` → context update

5. **State Synchronization Testing** (0.5 hours)
   - Test pause/resume functionality
   - Verify set completion updates machine state
   - Test cancel/finish confirmation dialogs
   - Validate workout completion flow

### **Day 3: End-to-End Integration & Testing (3-4 hours)**

1. **ActiveWorkoutUITest Component** (1.5 hours)
   - Comprehensive test component with mock workout templates
   - **Integration Flow**: Template selection → active tracking → completion
   - **Touch Point Testing**: `WorkoutDetailModal` → `ActiveWorkoutContainer` → `activeWorkoutMachine`

2. **Complete Flow Testing** (1 hour)
   - Test template selection to published NIP-101e event
   - Validate with real dependency resolution service data
   - Test pause/resume across component re-renders
   - **End-to-End**: "Start workout" button → completed workout event

3. **Performance Optimization** (1 hour)
   - Optimize re-renders with React.memo where needed
   - Validate memory usage during long workouts
   - Test on mobile devices for touch responsiveness

4. **Documentation & Handoff** (0.5 hours)
   - Update component documentation
   - Create usage examples
   - Document integration patterns for future features

## Success Criteria (80% minimum)

### **Core Functionality (100% required)**
- [ ] All 4 UI components render without errors using POWR UI primitives
- [ ] SetRow input handling works smoothly on mobile with 44px+ touch targets
- [ ] ExerciseSection displays set count and exercise list UX (no progress bar)
- [ ] ActiveWorkoutInterface shows timer and Pause/Cancel/Finish controls
- [ ] ActiveWorkoutContainer integrates with `activeWorkoutMachine` via `useMachine`
- [ ] Cancel and Finish buttons show confirmation dialogs before action

### **XState Integration (100% required)**
- [ ] "Start workout" button in `WorkoutDetailModal` spawns `activeWorkoutMachine` correctly
- [ ] Set completion triggers `COMPLETE_SET` event with auto-generated data
- [ ] Pause/resume functionality works with machine state synchronization
- [ ] Cancel workout triggers `CANCEL_WORKOUT` event after confirmation
- [ ] Finish workout triggers `COMPLETE_WORKOUT` event after confirmation
- [ ] Workout completion generates valid NIP-101e event via `publishWorkoutActor`
- [ ] State persists across component unmounts/remounts

### **User Experience (80% required)**
- [ ] Exercise list view with sets beneath feels intuitive and responsive
- [ ] Touch targets work smoothly in gym environment (44px+ validated)
- [ ] Timer display is clear and updates correctly from machine context
- [ ] Pause/Cancel/Finish controls are easily accessible and clear
- [ ] Confirmation dialogs prevent accidental workout cancellation/completion
- [ ] Completion flow feels satisfying and publishes to Nostr network

### **Performance (80% required)**
- [ ] Component rendering stays under 100ms
- [ ] No memory leaks during pause/resume cycles
- [ ] Smooth scrolling through exercise list
- [ ] Responsive input handling under 50ms

### **Standards Compliance (100% required)**
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

## Component Import Standards

### **Required POWR UI Imports**
```typescript
// ✅ CORRECT: Use POWR UI primitives
import { Button } from '@/components/powr-ui/primitives/Button'
import { Card, CardContent, CardHeader } from '@/components/powr-ui/primitives/Card'
import { Input } from '@/components/powr-ui/primitives/Input'
import { Label } from '@/components/powr-ui/primitives/Label'

// For confirmation dialogs
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

// ❌ FORBIDDEN: Don't use shadcn/ui for main components
import { Button } from '@/components/ui/button'  // Wrong path
```

### **XState Integration Imports**
```typescript
// ✅ CORRECT: XState v5 patterns
import { useMachine, useSelector } from '@xstate/react'
import { activeWorkoutMachine } from '@/lib/machines/workout/activeWorkoutMachine'
```

## Architecture for Future Enhancement

### **Minimizable Workout Bar (Phase 2)**
- Container component designed to support both `full` and `minimized` modes
- State persists across mode changes via XState machine
- Designed to work above bottom navigation tabs (Spotify-style UX)

### **Rest Timer Integration (Phase 2)**
- Timer infrastructure ready for rest timer addition
- SetRow component can be enhanced with rest timer display
- XState machine already includes `restTimer` actor for future use

### **Exercise Progress Tracking (Phase 2)**
- Add progress bars showing completed vs planned sets
- Visual progress indicators for workout completion
- Enhanced exercise section with progress visualization

### **Advanced Set Tracking (Phase 3)**
- RPE (Rate of Perceived Exertion) input
- Set type selection (warmup, normal, drop, failure)
- Previous workout data comparison
- Exercise notes and modifications

## Risk Mitigation

### **Technical Risks**
- **XState Integration Complexity**: Mitigated by existing working `activeWorkoutMachine.ts`
- **Mobile Performance**: Mitigated by POWR UI mobile-first design
- **State Persistence**: Mitigated by XState built-in persistence patterns

### **Integration Risks**
- **Touch Point Complexity**: Clear integration flow from `WorkoutDetailModal` documented
- **Component Path Confusion**: Explicit import paths specified for POWR UI
- **Machine Spawning**: Use proven `useMachine` patterns, not custom spawning

### **Scope Risks**
- **Feature Creep**: Strict MVP scope - total timer only, no rest timers
- **Over-Engineering**: Use existing machine, don't modify core architecture
- **Timeline Pressure**: 3-day scope with clear daily deliverables

### **Fallback Plans**
- **Day 1 Issues**: Focus on core SetRow and ExerciseSection, defer ActiveWorkoutInterface
- **Day 2 Issues**: Use simplified timer implementation, defer advanced XState features
- **Day 3 Issues**: Focus on basic integration, defer performance optimization

## Dependencies

### **Required Existing Components**
- ✅ `activeWorkoutMachine.ts` - Complete XState v5 implementation
- ✅ POWR UI component library - Radix primitives at `src/components/powr-ui/primitives/`
- ✅ `WorkoutDetailModal` - For "Start workout" button integration
- ✅ NDK integration - For event publishing via `publishWorkoutActor`

### **Required Standards**
- ✅ `.clinerules/radix-ui-component-library.md` - UI component standards
- ✅ `.clinerules/xstate-anti-pattern-prevention.md` - XState integration patterns
- ✅ `.clinerules/nip-101e-standards.md` - Event generation compliance

## Validation Metrics

### **Component Quality**
- TypeScript compilation with zero errors
- All components render in test environment
- Mobile touch targets measured at 44px+ minimum
- POWR UI styling consistency across all components

### **Integration Quality**
- "Start workout" button spawns machine correctly
- XState machine events trigger correctly from UI
- Machine state updates reflect in UI within 50ms
- Pause/resume cycles work without state corruption
- Workout completion generates valid Nostr events

### **Performance Quality**
- Component render times measured under 100ms
- Memory usage stable during 2+ hour workout simulation
- Smooth scrolling through 20+ exercise list
- Input responsiveness under 50ms on mobile devices

---

**Task Type**: UI Implementation
**Priority**: High
**Estimated Duration**: 3 days
**Success Threshold**: 80% minimum
**Standards Compliance**: Mandatory
**Integration Touch Point**: `WorkoutDetailModal.onStartWorkout()` → spawn `activeWorkoutMachine`
**Architecture**: POWR UI + XState v5 + NDK-first patterns
