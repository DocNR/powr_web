# XState Parent-Child Data Flow Rule

## Brief overview
This rule establishes patterns for proper data flow between parent and child XState machines, preventing duplicate service calls and ensuring efficient data resolution across machine hierarchies.

## Core Principles

### 1. **Single Source of Truth (CRITICAL)**
- **Parent machines** resolve expensive data operations once
- **Child machines** receive and trust resolved data from parents
- **No duplicate service calls** for the same data across machine hierarchy

### 2. **Data Flow Hierarchy**
- **Setup Level**: Resolve dependencies and parse data
- **Lifecycle Level**: Coordinate and pass complete data
- **Execution Level**: Use resolved data, focus on business logic

### 3. **Input Validation at Boundaries**
- **Always validate input** at child machine entry points
- **Provide clear error messages** when expected data is missing
- **Fail fast** rather than attempting to re-resolve data

## Approved Data Flow Patterns

### ✅ Pattern 1: Parent Resolves, Child Trusts
```typescript
// PARENT MACHINE: Resolves data once
const parentMachine = setup({
  actors: {
    resolveDataActor: fromPromise(async ({ input }) => {
      const resolvedData = await expensiveService.resolve(input.reference);
      return { resolvedData, metadata: resolvedData.metadata };
    })
  }
}).createMachine({
  // ... states
  states: {
    resolving: {
      invoke: {
        src: 'resolveDataActor',
        onDone: {
          target: 'resolved',
          actions: assign({
            resolvedData: ({ event }) => event.output.resolvedData,
            metadata: ({ event }) => event.output.metadata
          })
        }
      }
    },
    resolved: {
      on: {
        SPAWN_CHILD: {
          actions: assign({
            childActor: ({ spawn, context }) => spawn('childMachine', {
              input: {
                // ✅ CORRECT: Pass resolved data to child
                resolvedData: context.resolvedData,
                metadata: context.metadata,
                // Include original reference for debugging
                originalReference: context.originalReference
              }
            })
          })
        }
      }
    }
  }
});

// CHILD MACHINE: Validates and uses resolved data
const childMachine = setup({
  types: {
    input: {} as {
      resolvedData: ResolvedData;
      metadata: Metadata;
      originalReference: string;
    }
  }
}).createMachine({
  context: ({ input }) => {
    // ✅ CRITICAL: Validate input immediately
    if (!input.resolvedData) {
      throw new Error(`Missing resolved data. Original reference: ${input.originalReference}`);
    }
    
    if (!input.metadata) {
      throw new Error(`Missing metadata for resolved data: ${input.originalReference}`);
    }
    
    return {
      resolvedData: input.resolvedData,
      metadata: input.metadata,
      // Child focuses on execution logic
      executionState: 'ready'
    };
  },
  
  initial: 'executing',
  states: {
    executing: {
      // Child uses resolved data without re-resolving
      entry: ({ context }) => {
        console.log(`[Child] Using resolved data:`, {
          dataId: context.resolvedData.id,
          itemCount: context.resolvedData.items.length
        });
      }
    }
  }
});
```

### ✅ Pattern 2: Service Call Coordination
```typescript
// SETUP MACHINE: Calls services once
const setupMachine = setup({
  actors: {
    loadTemplateActor: fromPromise(async ({ input }) => {
      // Service calls happen here
      const template = await dependencyResolutionService.resolveTemplate(input.templateRef);
      const exercises = await dependencyResolutionService.resolveExercises(template.exercises);
      
      return { template, exercises };
    })
  }
}).createMachine({
  // ... setup logic
  output: ({ context }) => ({
    templateSelection: context.templateSelection,
    workoutData: context.workoutData,
    // ✅ CRITICAL: Include resolved data in output
    resolvedTemplate: context.resolvedTemplate,
    resolvedExercises: context.resolvedExercises
  })
});

// LIFECYCLE MACHINE: Passes resolved data
const lifecycleMachine = setup({
  actors: {
    setupMachine,
    activeMachine
  }
}).createMachine({
  states: {
    setup: {
      invoke: {
        src: 'setupMachine',
        onDone: {
          target: 'active',
          actions: [
            assign({
              // Store resolved data from setup
              resolvedTemplate: ({ event }) => event.output.resolvedTemplate,
              resolvedExercises: ({ event }) => event.output.resolvedExercises
            }),
            // ✅ CORRECT: Spawn child with resolved data
            assign({
              activeActor: ({ spawn, context }) => spawn('activeMachine', {
                input: {
                  workoutData: context.workoutData,
                  // Pass resolved data - no re-resolution needed
                  resolvedTemplate: context.resolvedTemplate,
                  resolvedExercises: context.resolvedExercises
                }
              })
            })
          ]
        }
      }
    }
  }
});

// ACTIVE MACHINE: Uses resolved data
const activeMachine = setup({
  types: {
    input: {} as {
      workoutData: WorkoutData;
      resolvedTemplate: ResolvedTemplate;
      resolvedExercises: ResolvedExercise[];
    }
  }
}).createMachine({
  context: ({ input }) => {
    // ✅ CRITICAL: Validate resolved data
    if (!input.resolvedTemplate || !input.resolvedExercises) {
      throw new Error(`Missing resolved data: template=${!!input.resolvedTemplate}, exercises=${!!input.resolvedExercises}`);
    }
    
    return {
      workoutData: input.workoutData,
      // Use resolved data directly
      template: input.resolvedTemplate,
      exercises: input.resolvedExercises,
      // Focus on execution state
      currentExerciseIndex: 0,
      completedSets: []
    };
  },
  
  initial: 'ready',
  states: {
    ready: {
      // No data resolution needed - focus on workout execution
    }
  }
});
```

## Anti-Patterns to Avoid

### ❌ FORBIDDEN: Child Re-Resolves Parent Data
```typescript
// DON'T: Child machine duplicating parent's work
const childMachine = setup({
  actors: {
    // ❌ WRONG: Re-resolving data that parent already resolved
    reResolveDataActor: fromPromise(async ({ input }) => {
      // This data was already resolved by parent!
      return await expensiveService.resolve(input.reference);
    })
  }
}).createMachine({
  context: ({ input }) => ({
    reference: input.reference // Only raw reference, no resolved data
  }),
  
  initial: 'reResolving', // ❌ Wasteful re-resolution
  states: {
    reResolving: {
      invoke: {
        src: 'reResolveDataActor' // ❌ Duplicate service call
      }
    }
  }
});
```

### ❌ FORBIDDEN: No Input Validation
```typescript
// DON'T: Assume input is valid without checking
const childMachine = setup({}).createMachine({
  context: ({ input }) => ({
    // ❌ WRONG: No validation - will fail at runtime
    data: input.resolvedData.items, // Could be undefined!
    metadata: input.metadata.version // Could be undefined!
  })
});
```

### ❌ FORBIDDEN: Complex Input Transformation
```typescript
// DON'T: Complex data transformation in child machines
const childMachine = setup({}).createMachine({
  context: ({ input }) => {
    // ❌ WRONG: Complex business logic in child context
    const transformedData = input.rawData.map(item => ({
      ...item,
      computed: complexCalculation(item),
      merged: mergeWithExternalData(item)
    }));
    
    return { transformedData }; // This should be done in parent!
  }
});
```

## Input Validation Patterns

### ✅ Comprehensive Validation
```typescript
const validateChildInput = (input: any): input is ValidChildInput => {
  if (!input) {
    throw new Error('Child machine input is required');
  }
  
  if (!input.resolvedData) {
    throw new Error('Missing resolvedData in child machine input');
  }
  
  if (!Array.isArray(input.resolvedExercises)) {
    throw new Error('resolvedExercises must be an array');
  }
  
  if (input.resolvedExercises.length === 0) {
    throw new Error('resolvedExercises cannot be empty');
  }
  
  return true;
};

const childMachine = setup({}).createMachine({
  context: ({ input }) => {
    validateChildInput(input);
    
    return {
      resolvedData: input.resolvedData,
      resolvedExercises: input.resolvedExercises,
      // Child-specific state
      executionPhase: 'initializing'
    };
  }
});
```

### ✅ Graceful Error Messages
```typescript
const childMachine = setup({}).createMachine({
  context: ({ input }) => {
    const missingFields = [];
    
    if (!input.resolvedTemplate) missingFields.push('resolvedTemplate');
    if (!input.resolvedExercises) missingFields.push('resolvedExercises');
    if (!input.workoutData) missingFields.push('workoutData');
    
    if (missingFields.length > 0) {
      throw new Error(
        `Child machine missing required input fields: ${missingFields.join(', ')}. ` +
        `Parent machine should resolve these before spawning child.`
      );
    }
    
    return {
      template: input.resolvedTemplate,
      exercises: input.resolvedExercises,
      workoutData: input.workoutData
    };
  }
});
```

## Machine Responsibility Boundaries

### Setup Machine Responsibilities
- **Resolve all external dependencies**
- **Parse and validate raw data**
- **Merge related data sources**
- **Transform data for consumption**
- **Output complete, ready-to-use data**

### Lifecycle Machine Responsibilities
- **Coordinate machine transitions**
- **Store resolved data in context**
- **Pass complete data to child machines**
- **Handle machine lifecycle events**
- **Manage parent-child communication**

### Execution Machine Responsibilities
- **Validate received input**
- **Execute business logic**
- **Manage execution state**
- **Send results back to parent**
- **Focus on single responsibility**

## When to Apply This Rule

### Always Apply For
- Parent-child machine architectures
- Multi-level state machine hierarchies
- Expensive data resolution operations
- Service-dependent state machines

### Especially Important When
- Multiple machines need the same data
- Service calls are expensive or slow
- Data transformation is complex
- Child machines are spawned dynamically

### Success Metrics
- **No duplicate service calls** across machine hierarchy
- **Clear error messages** when input validation fails
- **Single source of truth** for resolved data
- **Fast child machine initialization** (no re-resolution)
- **Predictable data flow** through machine levels

## Integration with Existing Rules

### Related .clinerules
- **xstate-anti-pattern-prevention.md**: Prevents workarounds and complexity
- **service-layer-architecture.md**: Defines service call patterns
- **simple-solutions-first.md**: Encourages straightforward data flow

### Workflow Integration
1. **Design Phase**: Define data flow hierarchy
2. **Implementation Phase**: Follow parent-resolves, child-trusts pattern
3. **Testing Phase**: Validate input validation and error handling
4. **Review Phase**: Check for duplicate service calls

---

**Last Updated**: 2025-07-26
**Project**: POWR Workout PWA
**Environment**: Web Browser
**Pattern Source**: Analysis of workout machine hierarchy duplication issues
