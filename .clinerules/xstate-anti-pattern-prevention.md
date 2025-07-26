# XState Anti-Pattern Prevention Rule

## Brief overview
This rule prevents "workaround rabbit holes" when working with XState by establishing a clear decision tree and red flags that indicate when to stop and simplify rather than building complex workarounds.

**Note**: For AI-specific directives with automated pattern matching and scoring, see `.clinerules/xstate-ai-workaround-prevention.md`

## The Core Principle
**"Fighting against XState creates complexity. Working with XState creates simplicity."**

When XState feels difficult or requires complex workarounds, the solution is almost always to simplify and follow framework best practices, not to build more complexity.

## Decision Tree for XState Issues

### Step 1: Documentation First (MANDATORY)
Before implementing ANY XState solution:
1. **Check available XState documentation** in your local reference repositories
2. **Review official XState v5 documentation** online
3. **Review our working examples** in `components/test/` directory
4. **Check existing patterns** in our codebase that work correctly

### Step 2: Framework Alignment Check
Ask these questions:
- **Am I fighting against XState or working with it?**
- **Does this feel like I'm forcing XState to do something unnatural?**
- **Would a beginner understand this XState pattern?**
- **Is this pattern documented in official XState docs?**

If ANY answer suggests fighting the framework, STOP and simplify.

### Step 3: Pattern Selection Priority
Choose solutions in this order:
1. **Standard XState patterns** from official documentation
2. **Existing working patterns** from our codebase
3. **Simple, explicit approaches** over clever/complex ones
4. **Event-driven solutions** over automatic transitions

## Red Flags: Stop and Simplify

### 🚨 IMMEDIATE RED FLAGS
These patterns indicate you're in a workaround rabbit hole:

#### Context Service Injection (NEW - Prevents NDK-style mistakes)
```typescript
// 🚨 RED FLAG: External services in context
interface Context {
  ndk?: any; // ❌ WRONG - Our exact expensive mistake!
  apiClient?: SomeService; // ❌ WRONG
  externalService?: any; // ❌ WRONG
  database?: DB; // ❌ WRONG
}
```
**Solution**: Use Global Actor pattern for cross-cutting services

#### Complex `always` Transitions
```typescript
// 🚨 RED FLAG: Complex automatic logic
always: [
  { target: 'stateA', guard: complexGuard1 },
  { target: 'stateB', guard: complexGuard2 },
  { target: 'stateC', guard: complexGuard3 }
]
```
**Solution**: Use explicit events instead of `always` transitions

#### Defensive Programming Around Timing
```typescript
// 🚨 RED FLAG: Working around race conditions
if (data && data.length > 0 && !isLoading && hasInitialized) {
  // Complex logic to handle timing issues
}
```
**Solution**: Fix the state machine, don't work around it

#### Custom State Synchronization
```typescript
// 🚨 RED FLAG: Manual state orchestration
useEffect(() => {
  // Complex logic to sync XState with other state
}, [xstateValue, otherState, anotherState]);
```
**Solution**: Let XState handle orchestration

#### Dynamic Imports in XState Machines (NEW - Prevents Module Context Issues)
```typescript
// 🚨 RED FLAG: Dynamic imports in XState actors
const someActor = fromPromise(async () => {
  const { dependencyResolution } = await import('@/lib/services/dependencyResolution');
  return dependencyResolution.resolve();
});
```
**Why This Creates Problems**:
- **Module Context Conflicts**: Creates separate module instances when the same service is also statically imported elsewhere
- **Race Conditions**: Module loading timing can affect service resolution
- **Unpredictable Behavior**: Same service might behave differently depending on how it was loaded
- **Hard to Debug**: Issues manifest as mysterious "undefined" or "fallback data" problems

**Solution**: Use static imports to ensure consistent module resolution
```typescript
// ✅ CORRECT: Static imports ensure consistent module resolution
import { dependencyResolution } from '@/lib/services/dependencyResolution';

const someActor = fromPromise(async () => {
  return dependencyResolution.resolve();
});
```

#### "Hack" Comments
```typescript
// 🚨 RED FLAG: Any comment like these
// "Hack to make XState work"
// "Workaround for XState timing issue"
// "Custom logic because XState can't handle this"
```
**Solution**: There's always a proper XState way

### 🟡 WARNING SIGNS
These patterns suggest you might be heading toward complexity:

- More than 3 guards on a single transition
- Complex logic in guard functions
- Multiple layers of state validation
- Atomic operations to "fix" race conditions
- Custom hooks to "simplify" XState usage

## Approved XState Patterns

### ✅ Event-Driven Architecture
```typescript
// GOOD: Explicit events
on: {
  'CHECK_DATA': [
    { target: 'processing', guard: 'hasData' },
    { target: 'error', guard: 'hasError' }
  ]
}
```

### ✅ Simple Guards
```typescript
// GOOD: Simple, clear validation
guards: {
  hasData: ({ context }) => context.data.length > 0,
  isReady: ({ context }) => !!context.initialized
}
```

### ✅ Direct Actor Interaction (for spawned actors)
```typescript
// GOOD: Direct interaction with spawned actors
const [snapshot, setSnapshot] = useState(() => actor.getSnapshot());
useEffect(() => {
  const subscription = actor.subscribe(setSnapshot);
  return subscription.unsubscribe;
}, [actor]);
```

### ✅ createActorContext Pattern
```typescript
// GOOD: Standard React integration
const MyContext = createActorContext(myMachine);
const state = MyContext.useSelector(state => state);
```

## Implementation Workflow

### When Starting XState Work
1. **Read the docs first** - Always check XState v5 documentation
2. **Find similar patterns** - Look for existing working examples
3. **Start simple** - Use the most basic pattern that works
4. **Test early** - Verify the pattern works before adding complexity

### When Encountering Issues
1. **STOP** - Don't immediately build a workaround
2. **Question the approach** - Is this the right XState pattern?
3. **Simplify** - Can this be done with a simpler pattern?
4. **Document first** - Check if the docs suggest a different approach

### When Reviewing Code
Look for these anti-patterns:
- Complex `always` transitions
- Defensive programming around state
- Custom state synchronization
- Comments indicating workarounds
- More than 3 guards per transition

## Real-World Example: Workout Machine Simplification

### ❌ BEFORE: Workaround Rabbit Hole
```typescript
// Complex always transitions with race conditions
always: [
  {
    target: '#workoutSetup.templateSelection',
    guard: ({ context }) => {
      // Complex logic to handle timing
      if (!context.selectedTemplateId || !context.templates.length) return false;
      const template = context.templates.find(t => t.id === context.selectedTemplateId);
      return !!(template && template.loadStatus === 'loaded');
    }
  }
]
```

### ✅ AFTER: XState Best Practices
```typescript
// Simple event-driven approach
on: {
  'CHECK_PRESELECTED': [
    { target: '#workoutSetup.templateSelection', guard: 'templateNeedsSelection' },
    { target: '#workoutSetup.workoutActive', guard: 'hasSelectedTemplate' }
  ]
}

guards: {
  templateNeedsSelection: ({ context }) => {
    const template = context.templates.find(t => t.id === context.selectedTemplateId);
    return !!(template && template.loadStatus === 'loaded');
  }
}
```

**Result**: 40% code reduction, eliminated race conditions, improved reliability

## Web-Specific XState Patterns

### Browser Event Integration
```typescript
// ✅ CORRECT: Browser event handling with XState
const workoutMachine = setup({
  types: {
    events: {} as 
      | { type: 'WINDOW_FOCUS' }
      | { type: 'WINDOW_BLUR' }
      | { type: 'ONLINE' }
      | { type: 'OFFLINE' }
  }
}).createMachine({
  id: 'workout',
  initial: 'active',
  states: {
    active: {
      on: {
        'WINDOW_BLUR': 'paused',
        'OFFLINE': 'offline'
      }
    },
    paused: {
      on: {
        'WINDOW_FOCUS': 'active'
      }
    },
    offline: {
      on: {
        'ONLINE': 'active'
      }
    }
  }
});

// Setup browser event listeners
useEffect(() => {
  const handleFocus = () => send({ type: 'WINDOW_FOCUS' });
  const handleBlur = () => send({ type: 'WINDOW_BLUR' });
  const handleOnline = () => send({ type: 'ONLINE' });
  const handleOffline = () => send({ type: 'OFFLINE' });

  window.addEventListener('focus', handleFocus);
  window.addEventListener('blur', handleBlur);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('focus', handleFocus);
    window.removeEventListener('blur', handleBlur);
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, [send]);
```

### Service Worker Integration
```typescript
// ✅ CORRECT: Service worker events in XState
const pwaStateMachine = setup({
  types: {
    events: {} as 
      | { type: 'SW_UPDATE_AVAILABLE' }
      | { type: 'SW_INSTALL_PROMPT' }
      | { type: 'ACCEPT_UPDATE' }
      | { type: 'DISMISS_UPDATE' }
  }
}).createMachine({
  id: 'pwa',
  initial: 'ready',
  states: {
    ready: {
      on: {
        'SW_UPDATE_AVAILABLE': 'updateAvailable',
        'SW_INSTALL_PROMPT': 'installPrompt'
      }
    },
    updateAvailable: {
      on: {
        'ACCEPT_UPDATE': 'updating',
        'DISMISS_UPDATE': 'ready'
      }
    },
    updating: {
      // Handle service worker update
    },
    installPrompt: {
      on: {
        'ACCEPT_UPDATE': 'installing',
        'DISMISS_UPDATE': 'ready'
      }
    }
  }
});
```

## Documentation References

### Primary Sources
- **XState v5 Official Docs**: Online documentation
- **Our Working Examples**: `components/test/` directory
- **Service Integration**: `.clinerules/service-layer-architecture.md`
- **NDK Integration**: `.clinerules/web-ndk-actor-integration.md`

### Key Documentation Sections
- [States and Transitions](https://stately.ai/docs/transitions)
- [Eventless Transitions](https://stately.ai/docs/eventless-transitions) - When NOT to use them
- [Guards](https://stately.ai/docs/guards) - Proper validation patterns
- [React Integration](https://stately.ai/docs/xstate-react) - `createActorContext` pattern

## Success Metrics

### Code Quality Indicators
- **Simplicity**: Can a new developer understand the XState pattern?
- **Documentation Alignment**: Does it match official XState patterns?
- **Maintainability**: Is it easy to modify and extend?
- **Reliability**: Does it work consistently without workarounds?

### Warning Signs of Success
- Code becomes simpler, not more complex
- Fewer guards and conditions needed
- No custom synchronization logic
- Clear, predictable state flow

## When to Apply This Rule

### Always Apply For
- New XState machine development
- Debugging existing XState issues
- Code reviews involving state machines
- Refactoring complex state logic

### Especially Important When
- Feeling frustrated with XState behavior
- Building "temporary" workarounds
- Adding defensive programming around state
- Considering custom state management solutions

## Emergency Brake Protocol

If you find yourself:
1. **Writing complex workarounds** → STOP, read XState docs
2. **Fighting timing issues** → STOP, simplify the state machine
3. **Adding defensive code** → STOP, fix the root cause
4. **Considering alternatives to XState** → STOP, you're probably using it wrong

Remember: **XState is designed to handle complex state orchestration. If it feels hard, you're probably fighting it instead of using it.**

The goal is to work WITH XState's strengths, not around its perceived limitations.

---

**Last Updated**: 2025-07-26
**Project**: POWR Workout PWA
**Environment**: Web Browser
