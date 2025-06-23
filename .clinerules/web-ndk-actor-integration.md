# Web NDK Actor Integration Rule

## Brief overview
This rule establishes patterns for using the Global NDK Actor for Nostr publishing in XState machines for web applications, ensuring reliable NDK service access while maintaining security and architectural best practices.

## The Global NDK Actor Pattern for Web
The Global NDK Actor provides centralized NDK service management for XState machines, eliminating "NDK undefined" errors and following the Global Actor pattern adapted for web browser environments.

## Architecture Overview
- **NDK Singleton**: `lib/ndk.ts` - Single NDK instance initialized immediately
- **NDK-Hooks Integration**: Use official `useNDK()`, `useSubscribe()`, `useProfileValue()` hooks
- **Global NDK Actor**: `lib/actors/globalNDKActor.ts` - For XState machine publishing only
- **No React Context**: Follow official NDK pattern - no Context/Provider for NDK

## When to Use Global NDK Actor vs NDK Hooks

### ✅ Use Global NDK Actor For:
- **XState machines** that need to publish Nostr events
- **State-driven publishing** (workout completion, template creation, etc.)
- **Background publishing** operations from state machines

### ✅ Use Official NDK Hooks For:
- **All React components** that need NDK access
- **Data subscriptions** with `useSubscribe()`
- **Profile data** with `useProfileValue()`
- **User authentication** with `useNDKCurrentUser()`
- **Manual publishing** from UI components

## Implementation Patterns

### Pattern 1: Publishing from XState Machines
```typescript
// ✅ CORRECT: Use Global NDK Actor for XState publishing
import { publishEvent } from '@/lib/actors/globalNDKActor';

// In XState machine actor
const publishWorkoutActor = fromPromise(async ({ input }) => {
  const eventData = {
    kind: 1301, // NIP-101e workout record
    content: JSON.stringify(input.workoutData),
    tags: [
      ['d', `workout_${input.workoutId}`],
      ['template', input.templateId],
      ['duration', input.duration.toString()]
    ],
    created_at: Math.floor(Date.now() / 1000),
    pubkey: input.userPubkey
  };
  
  const requestId = `workout_${input.workoutId}_${Date.now()}`;
  publishEvent(eventData, requestId);
  
  return { success: true, requestId };
});
```

### Pattern 2: React Component Publishing (Official NDK Hooks)
```typescript
// ✅ CORRECT: React components use official NDK hooks
import { useNDK, useNDKCurrentUser } from '@nostr-dev-kit/ndk-hooks';
import { NDKEvent } from '@nostr-dev-kit/ndk';

function PublishNoteComponent() {
  const { ndk } = useNDK();
  const currentUser = useNDKCurrentUser();
  
  const publishNote = (content: string) => {
    if (!ndk || !currentUser) return;
    
    const event = new NDKEvent(ndk, {
      kind: 1,
      content,
      created_at: Math.floor(Date.now() / 1000),
      pubkey: currentUser.pubkey
    });
    
    // Don't await - optimistic publishing
    event.publish();
  };
  
  return (
    <button onClick={() => publishNote('Hello Nostr!')}>
      Publish Note
    </button>
  );
}
```

### Pattern 3: Data Fetching with Official NDK Hooks
```typescript
// ✅ CORRECT: Component-level subscriptions with official hooks
import { useSubscribe, useProfileValue } from '@nostr-dev-kit/ndk-hooks';

const WorkoutFeed = () => {
  // Component-level subscription - NDK optimizes automatically
  const { events: workouts } = useSubscribe([
    { kinds: [1301], '#t': ['fitness'], limit: 50 }
  ]);
  
  return (
    <div>
      {workouts.length === 0 ? (
        <div>No workouts yet - start your first workout!</div>
      ) : (
        workouts.map(workout => (
          <WorkoutCard key={workout.tagId()} workout={workout} />
        ))
      )}
    </div>
  );
};

const WorkoutCard = ({ workout }) => {
  // Profile fetching at component level - NDK merges efficiently
  const profile = useProfileValue({ pubkey: workout.pubkey });
  
  return (
    <div>
      <div>{profile?.name || 'Anonymous'}</div>
      <div>{workout.content}</div>
    </div>
  );
};
```

## Web-Specific Security Requirements

### ✅ REQUIRED Security Patterns
- **MUST** use web authentication patterns from `web-private-key-security.md`
- **MUST** never hardcode keys or bypass authentication
- **MUST** use authenticated NDK instance from NDKProvider
- **MUST** validate user is authenticated before publishing
- **MUST** use real user pubkey from authentication context

### ❌ FORBIDDEN Security Anti-Patterns
```typescript
// ❌ FORBIDDEN: Creating new NDK instances in machines
const ndk = new NDK(); // Bypasses authentication

// ❌ FORBIDDEN: Hardcoded keys or test data
const testPubkey = 'abc123...'; // Security violation

// ❌ FORBIDDEN: Bypassing Global Actor
const directNDK = await initializeNDK(); // Wrong pattern
```

## Web Browser NDK Configuration

### Browser-Specific NDK Setup
```typescript
// ✅ CORRECT: Web browser NDK configuration
import NDK, { NDKCacheAdapterDexie, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';

const createWebNDK = async (authMethod: 'extension' | 'private-key', credentials?: any) => {
  const ndkConfig = {
    explicitRelayUrls: [
      'wss://relay.damus.io',
      'wss://nos.lol',
      'wss://relay.primal.net'
    ],
    cacheAdapter: new NDKCacheAdapterDexie({
      dbName: 'workout-pwa-cache',
      eventCacheSize: 10000,
      profileCacheSize: 1000
    })
  };

  if (authMethod === 'extension') {
    // NIP-07 extension authentication
    const ndk = new NDK(ndkConfig);
    await ndk.connect();
    return ndk;
  } else if (authMethod === 'private-key' && credentials?.privateKey) {
    // Private key authentication (fallback)
    const signer = new NDKPrivateKeySigner(credentials.privateKey);
    const ndk = new NDK({
      ...ndkConfig,
      signer
    });
    await ndk.connect();
    return ndk;
  }

  throw new Error('Invalid authentication method or missing credentials');
};
```

### IndexedDB Cache Configuration
```typescript
// ✅ CORRECT: Browser-optimized cache settings
const cacheAdapter = new NDKCacheAdapterDexie({
  dbName: 'workout-pwa-cache',
  eventCacheSize: 10000,     // Workout events and templates
  profileCacheSize: 1000,    // User profiles
  saveSig: true,             // Save event signatures for verification
});
```

## Event Publishing Standards for Web

### NIP-101e Workout Event Structure
```typescript
// ✅ CORRECT: Workout record event (Kind 1301)
const workoutEventData = {
  kind: 1301,
  content: JSON.stringify({
    exercises: [
      {
        name: 'Push-ups',
        sets: [
          { reps: 10, weight: 0 },
          { reps: 8, weight: 0 }
        ]
      }
    ],
    duration: 1800, // 30 minutes in seconds
    notes: 'Great workout!'
  }),
  tags: [
    ['d', `workout_${workoutId}`],           // Replaceable event identifier
    ['template', templateId],                // Reference to workout template
    ['duration', '1800'],                    // Duration in seconds
    ['date', '2025-06-21'],                  // Workout date
    ['p', userPubkey]                        // User reference
  ],
  created_at: Math.floor(Date.now() / 1000),
  pubkey: userPubkey
};
```

### Exercise Template Event Structure
```typescript
// ✅ CORRECT: Exercise template event (Kind 33401)
const exerciseTemplateData = {
  kind: 33401,
  content: JSON.stringify({
    name: 'Push-up',
    description: 'Classic bodyweight exercise',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: 'none',
    instructions: [
      'Start in plank position',
      'Lower body to ground',
      'Push back up'
    ]
  }),
  tags: [
    ['d', exerciseId],                       // Unique exercise identifier
    ['name', 'Push-up'],                     // Exercise name
    ['muscle', 'chest'],                     // Primary muscle group
    ['equipment', 'none'],                   // Equipment required
    ['difficulty', 'beginner']               // Difficulty level
  ],
  created_at: Math.floor(Date.now() / 1000),
  pubkey: userPubkey
};
```

## Error Handling Patterns for Web

### Connection Status Monitoring
```typescript
// ✅ CORRECT: Web-specific connection monitoring
const checkWebNDKConnection = () => {
  const status = getNDKConnectionStatus();
  
  if (!status.isConnected) {
    // Check if it's a network issue
    if (!navigator.onLine) {
      throw new Error('No internet connection - workout will be saved locally');
    }
    
    throw new Error('NDK not connected - cannot publish to Nostr');
  }
  
  return status;
};
```

### Publishing Result Handling
```typescript
// ✅ CORRECT: Web publishing with offline support
const publishWithOfflineSupport = async (eventData: any, requestId: string) => {
  try {
    const status = checkWebNDKConnection();
    publishEvent(eventData, requestId);
    
    // Store in IndexedDB for offline access
    await storeEventLocally(eventData);
    
  } catch (error) {
    console.warn('Publishing failed, storing locally:', error);
    
    // Queue for later publishing when online
    await queueEventForLater(eventData, requestId);
    
    // Still store locally for immediate access
    await storeEventLocally(eventData);
  }
};
```

## Testing Patterns for Web

### Testing Global NDK Actor in Browser
```typescript
// ✅ CORRECT: Web-specific testing component
import { useState, useEffect } from 'react';
import { 
  getNDKConnectionStatus, 
  subscribeToNDKState,
  publishEvent 
} from '@/lib/actors/globalNDKActor';

const WebNDKActorTest = () => {
  const [status, setStatus] = useState(getNDKConnectionStatus());
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToNDKState((snapshot) => {
      setStatus({
        status: snapshot.context.connectionStatus,
        isConnected: snapshot.context.connectedRelays > 0,
        relayCount: snapshot.context.connectedRelays,
        queueLength: snapshot.context.publishQueue.length
      });
      
      setLogs(prev => [...prev, `Status: ${snapshot.context.connectionStatus}`]);
    });

    return () => unsubscribe.unsubscribe();
  }, []);

  const testPublish = () => {
    const testEvent = {
      kind: 1,
      content: 'Test from POWR PWA',
      created_at: Math.floor(Date.now() / 1000),
      pubkey: 'test-pubkey'
    };
    
    publishEvent(testEvent, `test_${Date.now()}`);
    setLogs(prev => [...prev, 'Test event published']);
  };

  return (
    <div className="p-4 border rounded">
      <h3>Web NDK Actor Status</h3>
      <p>Status: {status.status}</p>
      <p>Connected: {status.isConnected ? 'Yes' : 'No'}</p>
      <p>Relays: {status.relayCount}</p>
      <p>Queue: {status.queueLength}</p>
      
      <button onClick={testPublish} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
        Test Publish
      </button>
      
      <div className="mt-4">
        <h4>Activity Log:</h4>
        <div className="max-h-32 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className="text-sm">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WebNDKActorTest;
```

### Mocking for Unit Tests
```typescript
// ✅ CORRECT: Mock Global NDK Actor for web unit tests
jest.mock('@/lib/actors/globalNDKActor', () => ({
  publishEvent: jest.fn(),
  getNDKConnectionStatus: jest.fn(() => ({ 
    status: 'connected', 
    isConnected: true,
    relayCount: 3,
    queueLength: 0
  })),
  subscribeToNDKState: jest.fn(() => ({ unsubscribe: jest.fn() }))
}));
```

## Performance Considerations for Web

### Browser Cache Management
```typescript
// ✅ CORRECT: Efficient IndexedDB usage
const optimizeWebCache = () => {
  // Limit cache size for browser performance
  const cacheAdapter = new NDKCacheAdapterDexie({
    dbName: 'workout-pwa-cache',
    eventCacheSize: 5000,      // Smaller than mobile for memory constraints
    profileCacheSize: 500,     // Limit profile cache
    saveSig: true
  });
  
  // Periodic cleanup
  setInterval(() => {
    cacheAdapter.cleanupOldEvents(7 * 24 * 60 * 60 * 1000); // 7 days
  }, 24 * 60 * 60 * 1000); // Daily cleanup
};
```

### Connection Lifecycle for Web
```typescript
// ✅ CORRECT: Web-optimized connection management
const setupWebConnectionLifecycle = () => {
  // Handle page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Pause non-critical operations
      pauseNonCriticalOperations();
    } else {
      // Resume operations
      resumeOperations();
    }
  });
  
  // Handle online/offline events
  window.addEventListener('online', () => {
    console.log('Back online - resuming NDK operations');
    resumeNDKOperations();
  });
  
  window.addEventListener('offline', () => {
    console.log('Gone offline - switching to local mode');
    switchToOfflineMode();
  });
};
```

## Migration from Direct NDK Usage

### ❌ OLD Pattern (Context Service Injection)
```typescript
// DON'T DO THIS - Anti-pattern for web
interface MachineContext {
  ndk?: NDK; // External service in context
  workoutData: WorkoutData;
}
```

### ✅ NEW Pattern (Global Actor)
```typescript
// DO THIS - Global Actor pattern for web
const publishActor = fromPromise(async ({ input }) => {
  publishEvent(input.eventData, input.requestId);
  return { success: true };
});
```

## When to Apply This Rule

### Always Use Global NDK Actor For:
- XState machine publishing operations
- Background publishing tasks
- Reliable publishing with retry logic
- State-driven Nostr operations

### Continue Using React Patterns For:
- UI components and user interactions
- Real-time data subscriptions
- Profile and avatar displays
- Manual user-initiated publishing

## Success Metrics

### Architecture Quality Indicators:
- No "NDK undefined" errors in XState machines
- Reliable publishing with proper error handling
- Clean separation between UI and state machine concerns
- Consistent authentication patterns
- Efficient browser cache usage

### Code Quality Indicators:
- No NDK instances in XState context
- Proper use of Global Actor for publishing
- Security patterns maintained
- Comprehensive error handling
- Web-optimized performance

This pattern ensures reliable, secure Nostr publishing from XState machines while maintaining the existing React component patterns and web browser optimization.

---

**Last Updated**: 2025-06-21
**Project**: POWR Workout PWA
**Environment**: Web Browser
