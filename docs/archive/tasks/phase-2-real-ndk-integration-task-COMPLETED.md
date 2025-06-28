---
title: Phase 2 - Real NDK Integration Task
description: Replace mock actors with real NDK publishing services and build complete workout flow
status: partially_complete
last_updated: 2025-06-27
completion_notes: "Day 1 objectives complete - real NDK publishing working with event ID 82dc1410dddf303e29f242229e3f41a3ee429c525f6bbdb74d9b1d6bb03622af. Days 2-4 (template loading, setup machine, exercise progression) remain for future implementation."
category: implementation
sprint_reference: docs/tasks/xstate-workout-machines-sprint.md
phase: 2
dependencies: 
  - XState Workout Machines Implementation (Phase 1) - COMPLETE
  - NDK Event Queue Architecture Optimization - COMPLETE
  - Global NDK Actor - COMPLETE
---

# Phase 2: Real NDK Integration Task

## 🎯 **Sprint Coordinator Overview**

**Sprint**: XState Workout Machines - Phase 2  
**Duration**: 4-5 days focused implementation  
**Objective**: Replace mock actors with real NDK publishing and build complete workout flow  
**Success Criteria**: End-to-end workout flow publishing real NIP-101e events to Nostr network  

## 📋 **Phase 2 Scope**

### **What We're Building On**
- ✅ **Phase 1 Complete**: XState v5 workout machines with working test components
- ✅ **NDK Infrastructure**: Optimized Global NDK Actor with proven queue handling
- ✅ **Architecture Validated**: NDK-first approach with 867-903ms performance baseline
- ✅ **Test Framework**: Complete testing infrastructure ready for integration

### **What We're Implementing**
- 🎯 **Real NDK Publishing Actors**: Replace mock actors with actual NDK publishing
- 🎯 **Workout Setup Machine**: Template selection and workout configuration
- 🎯 **Active Workout Machine**: Real exercise progression with NDK publishing
- 🎯 **End-to-End Testing**: Complete workout flow validation

## 🚀 **Implementation Plan**

### **Day 1: Real NDK Publishing Actors**

#### **Objective**: Replace mock actors in workout machines with real NDK publishing services

#### **Tasks**:
1. **Update Workout Analytics Service**
   - Enhance `generateNIP101eEvent()` method for real publishing
   - Add workout validation and error handling
   - Integrate with optimized Global NDK Actor

2. **Replace Mock Actors in Workout Lifecycle Machine**
   - Replace `loadWorkoutActor` with real NDK event fetching
   - Update `publishWorkoutActor` to use Global NDK Actor
   - Add proper error handling and retry logic

3. **Test Real Publishing Integration**
   - Update `WorkoutLifecycleMachineTest.tsx` for real NDK
   - Verify events publish to actual Nostr relays
   - Validate NIP-101e compliance

#### **Success Criteria**:
- ✅ Mock actors replaced with real NDK publishing
- ✅ Test component publishes actual NIP-101e events
- ✅ Events verifiable on Nostr network using NAK commands
- ✅ Error handling works for offline scenarios

### **Day 2: Workout Setup Machine**

#### **Objective**: Build template selection and workout configuration machine

#### **Tasks**:
1. **Create Workout Setup Machine**
   - Template browsing and selection
   - Workout customization (sets, reps, weights)
   - Integration with existing test content

2. **Template Loading Service**
   - Load workout templates from NDK cache
   - Parse NIP-101e template events
   - Handle template dependencies (exercises)

3. **Setup Machine Integration**
   - Integrate with workout lifecycle machine
   - Pass selected template to active workout
   - Handle setup cancellation and retry

#### **Success Criteria**:
- ✅ Template selection working with real NDK data
- ✅ Workout customization persists in XState context
- ✅ Setup machine integrates with lifecycle machine
- ✅ Uses existing Phase 1 test content (templates + exercises)

### **Day 3: Active Workout Machine Enhancement**

#### **Objective**: Implement real exercise progression with NDK publishing

#### **Tasks**:
1. **Exercise Progression Logic**
   - Real exercise data from templates
   - Set completion tracking in XState context
   - Progress calculation and display

2. **Real-Time Workout Tracking**
   - Timer integration for rest periods
   - Set completion with weight/reps/RPE
   - Pause/resume functionality enhancement

3. **Workout Completion Publishing**
   - Generate complete NIP-101e workout record
   - Publish via optimized Global NDK Actor
   - Handle publishing success/failure states

#### **Success Criteria**:
- ✅ Real exercise progression from template data
- ✅ Set completion updates XState context correctly
- ✅ Workout completion publishes complete NIP-101e event
- ✅ Published events include all exercise tags and metadata

### **Day 4: End-to-End Testing & Integration**

#### **Objective**: Complete workout flow validation and testing

#### **Tasks**:
1. **Complete Workflow Testing**
   - Setup → Active → Complete flow working
   - Real NDK publishing throughout
   - Error handling and recovery

2. **Performance Validation**
   - Maintain 867-903ms baseline performance
   - Memory usage optimization
   - Publishing speed optimization

3. **Documentation Updates**
   - Update sprint documentation
   - Document new patterns for golf app migration
   - Create usage examples and guides

#### **Success Criteria**:
- ✅ Complete workout flow working end-to-end
- ✅ Performance maintains baseline (867-903ms)
- ✅ All events verifiable on Nostr network
- ✅ Documentation updated for golf app migration

### **Day 5: Polish & Optimization (If Needed)**

#### **Objective**: Final polish and preparation for Phase 3

#### **Tasks**:
1. **Code Quality Review**
   - .clinerules compliance check
   - XState anti-pattern prevention validation
   - Service layer architecture compliance

2. **Testing Infrastructure Enhancement**
   - Comprehensive test coverage
   - Integration test scenarios
   - Error handling validation

3. **Golf App Migration Preparation**
   - Document reusable patterns
   - Identify service extraction opportunities
   - Prepare for Phase 3 planning

## 🔧 **Technical Implementation Details**

### **Real NDK Publishing Actor Pattern**
```typescript
// src/lib/machines/workout/actors/publishWorkoutActor.ts
import { fromPromise } from 'xstate';
import { publishEvent } from '@/lib/actors/globalNDKActor';
import { workoutAnalyticsService } from '@/lib/services/workoutAnalytics';

export const publishWorkoutActor = fromPromise(async ({ input }: {
  input: { workoutData: CompletedWorkoutData; userPubkey: string }
}) => {
  // Generate NIP-101e event using service
  const eventData = workoutAnalyticsService.generateNIP101eEvent(
    input.workoutData,
    input.userPubkey
  );
  
  // Publish via optimized Global NDK Actor
  const requestId = `workout_${input.workoutData.id}_${Date.now()}`;
  publishEvent(eventData, requestId);
  
  return { 
    success: true, 
    eventId: eventData.id,
    requestId 
  };
});
```

### **Template Loading Actor Pattern**
```typescript
// src/lib/machines/workout/actors/loadTemplateActor.ts
export const loadTemplateActor = fromPromise(async ({ input }: {
  input: { templateId: string; userPubkey: string }
}) => {
  const ndk = getNDKInstance();
  if (!ndk) throw new Error('NDK not initialized');
  
  // Load template using validated dependency resolution
  const templateEvent = await ndk.fetchEvent({
    kinds: [33402],
    authors: [input.userPubkey],
    '#d': [input.templateId]
  });
  
  if (!templateEvent) {
    throw new Error(`Template not found: ${input.templateId}`);
  }
  
  // Parse template and resolve exercise dependencies
  const template = parseWorkoutTemplate(templateEvent);
  const exercises = await resolveExerciseDependencies(template.exercises);
  
  return {
    template,
    exercises,
    loadTime: Date.now()
  };
});
```

### **Setup Machine Integration**
```typescript
// src/lib/machines/workout/workoutSetupMachine.ts
export const workoutSetupMachine = setup({
  types: {} as {
    context: WorkoutSetupContext;
    events: WorkoutSetupEvent;
  },
  actors: {
    loadTemplateActor,
    loadTemplatesActor: fromPromise(async ({ input }) => {
      // Load available templates for selection
      const ndk = getNDKInstance();
      const templates = await ndk.fetchEvents({
        kinds: [33402],
        '#t': ['fitness'],
        limit: 20
      });
      
      return templates.map(parseWorkoutTemplate);
    })
  }
}).createMachine({
  id: 'workoutSetup',
  initial: 'loadingTemplates',
  
  states: {
    loadingTemplates: {
      invoke: {
        src: 'loadTemplatesActor',
        onDone: {
          target: 'templateSelection',
          actions: assign({
            availableTemplates: ({ event }) => event.output
          })
        },
        onError: 'loadError'
      }
    },
    
    templateSelection: {
      on: {
        SELECT_TEMPLATE: {
          target: 'loadingTemplate',
          actions: assign({
            selectedTemplateId: ({ event }) => event.templateId
          })
        }
      }
    },
    
    loadingTemplate: {
      invoke: {
        src: 'loadTemplateActor',
        input: ({ context }) => ({
          templateId: context.selectedTemplateId!,
          userPubkey: context.userPubkey
        }),
        onDone: {
          target: 'workoutCustomization',
          actions: assign({
            selectedTemplate: ({ event }) => event.output.template,
            templateExercises: ({ event }) => event.output.exercises
          })
        },
        onError: 'loadError'
      }
    },
    
    workoutCustomization: {
      on: {
        CONFIRM_WORKOUT: {
          target: 'completed',
          actions: assign({
            finalWorkoutData: ({ context, event }) => ({
              id: generateWorkoutId(),
              template: context.selectedTemplate!,
              exercises: context.templateExercises!,
              customizations: event.customizations,
              userPubkey: context.userPubkey
            })
          })
        }
      }
    },
    
    completed: { type: 'final' },
    loadError: {
      on: {
        RETRY: 'loadingTemplates'
      }
    }
  }
});
```

## 📊 **Success Metrics**

### **Technical Metrics**
- **End-to-End Flow**: Setup → Active → Complete working with real NDK
- **Publishing Success**: 100% of completed workouts publish to Nostr network
- **Performance**: Maintain 867-903ms baseline for template loading
- **Event Compliance**: All published events pass NIP-101e validation
- **Error Handling**: Graceful offline/online transitions

### **Architecture Metrics**
- **XState Compliance**: No anti-patterns, follows official v5 patterns
- **Service Integration**: Clean separation between state and business logic
- **NDK Integration**: Proper use of optimized Global NDK Actor
- **Golf App Ready**: Patterns documented for React Native migration

### **Quality Metrics**
- **Test Coverage**: All new actors and machines have test coverage
- **Documentation**: Complete documentation for new patterns
- **Code Quality**: .clinerules compliance maintained
- **Verification**: All published events verifiable with NAK commands

## 🔍 **Quality Gates**

### **Before Each Day's Work**
- [ ] Review previous day's progress against success criteria
- [ ] Check .clinerules compliance for any new code
- [ ] Validate XState patterns against anti-pattern prevention rules
- [ ] Ensure NDK integration follows established Global NDK Actor patterns

### **After Each Day's Work**
- [ ] Test new functionality with real NDK publishing
- [ ] Verify events on Nostr network using NAK commands
- [ ] Update documentation for new patterns
- [ ] Commit progress with conventional commit messages

### **Phase 2 Completion Gates**
- [ ] Complete workout flow working end-to-end
- [ ] All events verifiable on Nostr network
- [ ] Performance baseline maintained
- [ ] Documentation updated for golf app migration
- [ ] Code quality standards maintained

## 🎯 **Golf App Migration Considerations**

### **Patterns to Establish**
- **Actor Reusability**: Publishing actors work for both workout and golf domains
- **Template System**: Template loading patterns apply to golf course/round templates
- **Progress Tracking**: Set completion patterns apply to shot/hole completion
- **Event Publishing**: NIP-101e patterns extend to NIP-101g for golf

### **Service Extraction Preparation**
- **Business Logic Services**: Identify reusable workout logic for golf adaptation
- **Data Transformation**: Event generation patterns for cross-domain use
- **State Management**: XState patterns that work for both workout and golf flows

## 📝 **Sprint Coordination Notes**

### **Daily Standup Questions**
1. What did you complete yesterday toward Phase 2 goals?
2. What are you working on today?
3. Any blockers or .clinerules compliance issues?
4. Is the NDK integration following established patterns?

### **Risk Mitigation**
- **XState Complexity**: Monitor for anti-patterns, refer to `.clinerules/xstate-anti-pattern-prevention.md`
- **NDK Integration**: Ensure Global NDK Actor patterns are followed
- **Performance Regression**: Monitor template loading times against 867-903ms baseline
- **Event Compliance**: Validate all events against NIP-101e standards

### **Success Indicators**
- Daily progress visible in test components
- Real events appearing on Nostr network
- Performance metrics maintained
- Documentation staying current

---

**Last Updated**: 2025-06-26  
**Sprint Coordinator**: Claude AI  
**Phase**: 2 of 3 (Real NDK Integration)  
**Next Phase**: Service Extraction & Golf App Migration Preparation  
**Dependencies**: Phase 1 Complete, NDK Queue Optimization Complete  
**Timeline**: 4-5 days focused implementation
