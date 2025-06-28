---
title: Phase 2 - Template Loading & Setup Machine Implementation  
description: Validate complete workout data flow from template selection through active tracking to event publishing
status: active
last_updated: 2025-06-27
category: implementation
sprint_reference: docs/tasks/xstate-workout-machines-sprint.md
phase: 2
dependencies: 
  - XState Workout Machines Implementation (Phase 1) - COMPLETE
  - Real NDK Publishing Integration - COMPLETE
  - Global NDK Actor - COMPLETE
  - Phase 1 Test Content - COMPLETE
---

# Phase 2: Template Loading & Setup Machine Workflow Validation

## 🎯 **Sprint Coordinator Overview**

**Sprint**: XState Workout Machines - Phase 2 Workflow Validation  
**Duration**: 2-3 days focused implementation  
**Objective**: Validate complete workout data flow from real template loading through active tracking to NIP-101e publishing  
**End Goal**: Functional test component that proves end-to-end workflow: load real template → customize workout data → track progress → publish complete event  

## 📋 **Current State Analysis**

### **✅ What We Have (Foundation)**
- **Phase 1 Complete**: XState v5 workout machines with working lifecycle
- **Real NDK Publishing**: Working publishWorkoutActor with verified event publishing
- **Template Loading Actor**: Basic loadTemplateActor with mock data fallback
- **Test Infrastructure**: WorkoutLifecycleMachineTest component with real authentication
- **Phase 1 Test Content**: 12 exercises, 3 workout templates, 2 collections published to Nostr

### **🎯 What We Need to Validate**
- **Real Template Loading**: Load actual workout templates from NDK cache/relays (remove mock data)
- **Data Flow Validation**: Ensure template → exercise dependency resolution works
- **Setup Machine Integration**: Connect template loading to workout lifecycle
- **Active Workout Data Flow**: Real exercise progression with set completion tracking
- **Complete Workflow Testing**: End-to-end data flow validation component

## 🚀 **Implementation Plan**

### **Day 1: Real Template Loading & Data Flow**

#### **Objective**: Replace mock data with real NDK template loading and validate data flows correctly

#### **Tasks**:
1. **Remove Mock Data from loadTemplateActor**
   - Connect to real Phase 1 test content (no fallback mock data)
   - Implement proper exercise dependency resolution
   - Add error handling for missing templates/exercises
   - Test with existing published templates (push-workout-bodyweight, etc.)

2. **Build Workout Setup Machine**
   - Create dedicated workoutSetupMachine.ts
   - Template browsing and selection states
   - Template confirmation (show workout as prescribed: warmup sets, work sets, etc.)
   - Integration with existing workoutLifecycleMachine

3. **Update Workout Lifecycle Machine**
   - Replace mock setupMachine with real workoutSetupMachine
   - Proper template data flow from setup to active states
   - Enhanced error handling and retry logic

#### **Success Criteria**:
- ✅ loadTemplateActor loads real templates from NDK (no mock data)
- ✅ workoutSetupMachine handles template selection and displays prescribed workout
- ✅ Workout lifecycle machine integrates with real setup machine
- ✅ Template data flows correctly from setup to active workout (as prescribed)

### **Day 2: Active Workout Data Tracking & Validation**

#### **Objective**: Validate real exercise progression and set completion data handling

#### **Tasks**:
1. **Enhance Active Workout Machine Data Flow**
   - Real exercise progression based on template data
   - Set completion tracking in XState context
   - Exercise navigation logic (current exercise, next exercise)
   - Progress validation (sets completed vs total sets)

2. **Build Set Completion Data Handling**
   - Data input validation for weight, reps, RPE per set
   - Set completion context updates and verification
   - Progress tracking logic (sets completed vs total sets)
   - Exercise completion and progression validation

3. **Update Workout Data Model**
   - Enhanced CompletedSet interface with all required fields
   - Proper exercise reference handling (33401:pubkey:d-tag format)
   - Workout completion data aggregation and validation

#### **Success Criteria**:
- ✅ Active workout tracks real exercise progression through template data
- ✅ Set completion updates XState context with validated data
- ✅ Exercise navigation works correctly (current → next exercise)
- ✅ Completed workout data includes all sets with proper exercise references

### **Day 3: Complete Workflow Testing & Validation**

#### **Objective**: Build functional test component to validate complete end-to-end workflow

#### **Tasks**:
1. **Build Workflow Validation Component**
   - Template selection testing (dropdown/list of available templates)
   - Exercise data input forms (basic forms for sets, reps, weight, RPE)
   - Active workout progression testing with set completion
   - Real-time workflow state monitoring and validation

2. **Complete Data Flow Integration**
   - Setup → Active → Complete flow with real data validation
   - Proper state transitions and error handling testing
   - Real NIP-101e event publishing with complete exercise data
   - Event verification workflow with NAK commands

3. **Workflow Testing & Validation**
   - End-to-end data flow testing
   - Published event verification on Nostr network
   - Performance validation (template loading times)
   - Error handling validation (missing templates, network issues)

#### **Success Criteria**:
- ✅ Functional test component validates template selection and exercise data handling
- ✅ End-to-end workflow proven: select template → configure data → track progress → publish event
- ✅ Published NIP-101e events include all exercise data and metadata
- ✅ All published events verifiable on Nostr network using NAK commands

## 🔧 **Technical Implementation Focus**

### **Real Template Loading Pattern**
```typescript
// Enhanced loadTemplateActor for real NDK data (no mock fallback)
export const loadTemplateActor = fromPromise(async ({ input }: {
  input: { templateId: string; userPubkey: string }
}): Promise<LoadTemplateOutput> => {
  const ndk = getNDKInstance();
  if (!ndk) throw new Error('NDK not initialized');
  
  // Load template from NDK (cache-first, then relays)
  const templateEvent = await ndk.fetchEvent({
    kinds: [33402],
    authors: [input.userPubkey],
    '#d': [input.templateId]
  });
  
  if (!templateEvent) {
    throw new Error(`Template not found: ${input.templateId}`);
  }
  
  // Parse template and resolve exercise dependencies
  const template = parseTemplateFromEvent(templateEvent);
  const exercises = await resolveExerciseDependencies(template.exercises, ndk);
  
  return { template, exercises, loadTime: Date.now() - startTime };
});
```

### **Workout Setup Machine Pattern**
```typescript
// New workoutSetupMachine.ts for data flow validation
export const workoutSetupMachine = setup({
  types: {} as {
    context: WorkoutSetupContext;
    events: WorkoutSetupEvent;
  },
  actors: {
    loadTemplatesActor: // Load available templates
    loadTemplateActor   // Load specific template with exercises
  }
}).createMachine({
  id: 'workoutSetup',
  initial: 'loadingTemplates',
  
  states: {
    loadingTemplates: { /* Load available templates */ },
    templateSelection: { /* Handle template selection */ },
    loadingTemplate: { /* Load specific template and exercises */ },
    dataCustomization: { /* Handle exercise data input */ },
    completed: { type: 'final' }
  }
});
```

### **Functional Test Component Pattern**
```typescript
// Basic functional test component for workflow validation
const WorkflowValidationTest: React.FC = () => {
  // Template selection testing
  const renderTemplateSelection = () => (
    <div className="space-y-4">
      <h3>Template Selection Test</h3>
      <select onChange={handleTemplateSelect}>
        <option>Choose template...</option>
        {availableTemplates.map(template => (
          <option key={template.id} value={template.id}>
            {template.name} ({template.exercises.length} exercises)
          </option>
        ))}
      </select>
    </div>
  );
  
  // Exercise data input testing
  const renderDataCustomization = () => (
    <div className="space-y-4">
      <h3>Exercise Data Configuration Test</h3>
      {selectedTemplate?.exercises.map((exercise, index) => (
        <div key={index} className="border p-4">
          <h4>{exercise.name}</h4>
          <input 
            type="number" 
            placeholder="Sets"
            onChange={(e) => updateExerciseData(index, 'sets', e.target.value)}
          />
          <input 
            type="number" 
            placeholder="Reps"
            onChange={(e) => updateExerciseData(index, 'reps', e.target.value)}
          />
          <input 
            type="number" 
            placeholder="Weight"
            onChange={(e) => updateExerciseData(index, 'weight', e.target.value)}
          />
        </div>
      ))}
    </div>
  );
  
  // Active workout testing
  const renderActiveWorkout = () => (
    <div className="space-y-4">
      <h3>Active Workout Data Flow Test</h3>
      <div>Exercise {currentExercise + 1} of {totalExercises}</div>
      <input type="number" placeholder="Weight" />
      <input type="number" placeholder="Reps" />
      <input type="number" placeholder="RPE" />
      <button onClick={completeSet}>Complete Set</button>
      <button onClick={nextExercise}>Next Exercise</button>
    </div>
  );
  
  return (
    <div className="space-y-6">
      {currentState === 'templateSelection' && renderTemplateSelection()}
      {currentState === 'dataCustomization' && renderDataCustomization()}
      {currentState.includes('active') && renderActiveWorkout()}
    </div>
  );
};
```

## 📊 **Success Metrics (Workflow Focused)**

### **Data Flow Validation**
- **Template Loading**: Real templates load from NDK cache/relays with no mock data
- **Exercise Resolution**: Template → exercise dependencies resolve correctly
- **Data Customization**: Exercise data (sets, reps, weight) flows through workflow
- **Event Publishing**: Complete NIP-101e events with all exercise data
- **Event Verification**: All published events verifiable with NAK commands

### **Workflow Validation**
- **Complete Flow**: Select template → customize data → track progress → publish event
- **Real Data Integration**: All data sourced from NDK cache/relays (Phase 1 test content)
- **State Management**: XState machines handle data flow correctly
- **Error Handling**: Graceful handling of missing templates, network issues
- **Performance**: Template loading under 1 second for cached content

### **Architecture Validation**
- **XState Compliance**: All patterns follow XState v5 best practices
- **NDK Integration**: Proper use of NDK singleton and Global NDK Actor
- **Data Model**: Clean data flow between state machines and business logic
- **Type Safety**: Complete TypeScript coverage for all data flows

## 🔍 **Quality Gates**

### **Before Implementation**
- [ ] Review existing Phase 1 test content structure and IDs
- [ ] Understand current workoutLifecycleMachine data flow points
- [ ] Verify authentication working for real user data access
- [ ] Check .clinerules compliance for XState and NDK patterns

### **During Implementation**
- [ ] Test template loading with real NDK data (verify no mock fallbacks)
- [ ] Validate exercise data customization flows correctly through machines
- [ ] Verify set completion updates XState context with correct data structure
- [ ] Test error handling for missing templates/exercises

### **After Implementation**
- [ ] Complete end-to-end workflow validation testing
- [ ] Verify published events on Nostr network using NAK commands
- [ ] Performance testing (template loading, event publishing)
- [ ] Documentation updates for validated patterns

## 🎯 **Integration with Existing Architecture**

### **Leverage Existing Foundation**
- **Phase 1 Test Content**: Use published templates (push-workout-bodyweight, pull-workout-bodyweight, legs-workout-bodyweight)
- **Real Authentication**: Use existing auth hooks (useAccount, usePubkey)
- **NDK Integration**: Use existing NDK singleton and Global NDK Actor
- **Service Layer**: Use workoutAnalyticsService for business logic

### **Extend Current Patterns**
- **XState v5**: Follow established setup({ actors }) patterns from Phase 1
- **Type Safety**: Extend existing TypeScript interfaces for data flow
- **Error Handling**: Use established error patterns from Phase 1
- **Testing**: Build on existing test component infrastructure

### **Prepare for Future UI Sprint**
- **Data Flow Validation**: Ensure all data flows work before UI implementation
- **Component Patterns**: Establish data handling patterns for future UI components
- **State Management**: Validate XState patterns for complex UI interactions
- **Performance**: Establish performance baselines for UI optimization

## 📝 **File Structure**

### **New Files to Create**
```
src/lib/machines/workout/
├── workoutSetupMachine.ts              # New setup machine for data flow
├── types/
│   ├── setupTypes.ts                   # Setup machine data types
│   └── activeWorkoutTypes.ts           # Enhanced active workout data types
└── actors/
    └── loadTemplatesActor.ts           # Load multiple templates

src/components/test/
└── WorkflowValidationTest.tsx          # New workflow testing component
```

### **Files to Modify**
```
src/lib/machines/workout/
├── workoutLifecycleMachine.ts          # Integrate real setup machine
├── actors/loadTemplateActor.ts         # Remove mock data, use real NDK
└── types/workoutLifecycleTypes.ts      # Add setup integration types

src/components/tabs/
└── TestTab.tsx                         # Add workflow validation component
```

## 🚀 **Task Summary**

**Primary Goal**: Prove the template → active workout → publishing flow works with real NDK data.

**Key Focus**: Core data flow validation - template loading, exercise progression, set completion, and event publishing. NO user interface design.

**Success Indicator**: A functional test component that demonstrates:
1. **Template Loading**: Real templates load from Phase 1 test content
2. **Active Workout**: Exercise progression with set completion tracking
3. **Event Publishing**: Complete NIP-101e events with all workout data
4. **Verification**: Published events verifiable on Nostr network

**Implementation Phases**:
- **Phase 2** (Current): Prove core data flow works
- **Phase 3** (Next): UI/UX implementation 
- **Phase 4** (Future): Advanced features (workout modification, exercise substitution, etc.)

**Scope Limitation**: No workout modification, exercise substitution, or advanced customization features. Focus purely on validating the prescribed template → completion → publishing workflow.

## 🚀 **Task Kickoff Prompt**

### **Task Summary**
Prove the template → active workout → publishing flow works with real NDK data. Build functional test component that validates: (1) Real template loading from Phase 1 test content, (2) Exercise progression with set completion tracking, (3) Complete NIP-101e event publishing, (4) Event verification on Nostr network. NO user interface design - focus purely on data flow validation.

### **Key Files to Review**
1. **Task Document**: `docs/tasks/phase-2-template-loading-setup-machine-task.md` - This complete implementation plan
2. **Current Foundation**: `src/lib/machines/workout/workoutLifecycleMachine.ts` - Integration points for setup machine
3. **Template Loading**: `src/lib/machines/workout/actors/loadTemplateActor.ts` - Remove mock data, use real NDK
4. **Test Component**: `src/components/test/WorkoutLifecycleMachineTest.tsx` - Extend for workflow validation
5. **Critical .clinerules**: 
   - `.clinerules/xstate-anti-pattern-prevention.md` - XState best practices
   - `.clinerules/service-layer-architecture.md` - NDK-first patterns
   - `.clinerules/nip-101e-standards.md` - Event structure compliance

### **Starting Point**
Begin with Day 1: Remove mock data from loadTemplateActor and connect to real Phase 1 test content. Then build workoutSetupMachine for template selection and confirmation. Focus on proving data flows correctly from template loading through exercise progression to event publishing.

### **Critical Success Factors**
- ✅ **Real NDK Data**: No mock data - use actual Phase 1 test content (push-workout-bodyweight, etc.)
- ✅ **Core Data Flow**: Template → exercise progression → set completion → publishing
- ✅ **XState v5 Compliance**: Follow established patterns from Phase 1
- ✅ **Event Verification**: All published events verifiable on Nostr network
- ✅ **Functional Testing**: Basic test component proves workflow works (no UI design)

**Ready to prove the complete NDK-first workout flow that validates our entire architecture!**
