# NDK Best Practices Rule

## Brief overview
This rule establishes NDK-specific best practices adapted from official NDK documentation, ensuring proper usage patterns for the POWR Workout PWA while maintaining web browser compatibility.

## Core NDK Principles

### 1. **Singleton Pattern (CRITICAL)**
- **✅ REQUIRED**: Create NDK as a singleton and load immediately
- **❌ FORBIDDEN**: DO NOT use React Context/Provider for NDK
- **❌ FORBIDDEN**: Never use official NDK React hooks
- **✅ REQUIRED**: Use direct NDK methods through service layer abstraction

```typescript
// ✅ CORRECT: Singleton pattern for web
// lib/ndk.ts
import NDK, { NDKCacheAdapterDexie } from '@nostr-dev-kit/ndk';

const explicitRelayUrls = [
  'wss://relay.damus.io',
  'wss://nos.lol', 
  'wss://relay.primal.net'
];

export const ndkSingleton = new NDK({
  explicitRelayUrls,
  clientName: 'powr-workout-pwa',
  cacheAdapter: new NDKCacheAdapterDexie({
    dbName: 'workout-pwa-cache'
  })
});

// Initialize immediately
ndkSingleton.connect();
```

### 2. **Direct NDK Methods (CRITICAL)**
- **✅ REQUIRED**: Use direct NDK instance methods for full control
- **❌ FORBIDDEN**: Never use official NDK React hooks (useSubscribe, useProfileValue, etc.)
- **✅ REQUIRED**: Wrap NDK operations in custom hooks and services
- **✅ REQUIRED**: Service layer abstraction protects against NDK updates

```typescript
// ✅ CORRECT: Direct NDK methods through service layer
export class UniversalNDKCacheService {
  private ndk: NDK;

  async fetchEvents(filters: NDKFilter[]): Promise<NDKEvent[]> {
    // Direct NDK method call - full control
    return Array.from(await this.ndk.fetchEvents(filters, {
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST
    }));
  }

  subscribe(filters: NDKFilter[], callback: (event: NDKEvent) => void): NDKSubscription {
    // Direct NDK subscription - full control
    const sub = this.ndk.subscribe(filters, {
      cacheUsage: NDKSubscriptionCacheUsage.PARALLEL
    });
    sub.on('event', callback);
    return sub;
  }
}

// ❌ FORBIDDEN: Official NDK hooks
const { events } = useSubscribe([...]); // Never use this
const profile = useProfileValue({ pubkey }); // Never use this
```

### 3. **Custom Hook Pattern (REQUIRED)**
- **✅ REQUIRED**: Create custom hooks that wrap NDK operations
- **✅ REQUIRED**: Service layer handles all NDK interactions
- **✅ REQUIRED**: Components use custom hooks, never direct NDK access

```typescript
// ✅ CORRECT: Custom hook wrapping NDK operations
export function useNDKDataWithCaching(options: CacheOptions) {
  const [events, setEvents] = useState<NDKEvent[]>([]);
  const [isFromCache, setIsFromCache] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // Service layer handles NDK operations
      const result = await ndkCacheService.getCachedEvents(options);
      setEvents(result.events);
      setIsFromCache(result.isFromCache);
    };

    loadData();
  }, [options]);

  return { events, isFromCache };
}

// ✅ CORRECT: Component uses custom hook
const WorkoutLibrary = () => {
  const { events: exercises } = useNDKDataWithCaching({
    filters: [{ kinds: [33401], '#t': ['fitness'] }],
    strategy: 'CACHE_FIRST'
  });

  return (
    <div>
      {exercises.length === 0 ? (
        <div>No exercises yet - building your library!</div>
      ) : (
        exercises.map(exercise => (
          <ExerciseCard key={exercise.tagId()} exercise={exercise} />
        ))
      )}
    </div>
  );
};
```

## Web-Specific NDK Patterns

### Browser Authentication
```typescript
// ✅ CORRECT: Web browser authentication
import { NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';

// For NIP-07 browser extensions
const authenticateWithExtension = async () => {
  if (window.nostr) {
    const pubkey = await window.nostr.getPublicKey();
    // NDK will use window.nostr automatically
    return { pubkey };
  }
  throw new Error('No NIP-07 extension found');
};

// For private key fallback
const authenticateWithPrivateKey = (privateKey: string) => {
  const signer = new NDKPrivateKeySigner(privateKey);
  ndkSingleton.signer = signer;
  return { pubkey: signer.user.pubkey };
};
```

### Event Publishing (Web Optimized)
```typescript
// ✅ CORRECT: Optimistic publishing (don't await)
const publishWorkout = (workoutData: WorkoutData) => {
  const event = new NDKEvent(ndkSingleton);
  event.kind = 1301; // NIP-101e workout record
  event.content = JSON.stringify(workoutData);
  event.tags = [
    ['d', workoutData.id],
    ['date', workoutData.date],
    ['duration', workoutData.duration.toString()]
  ];
  
  // Don't await - optimistic updates
  event.publish();
};

// ❌ WRONG: Awaiting publish
const publishWorkoutWrong = async (workoutData: WorkoutData) => {
  const event = new NDKEvent(ndkSingleton);
  // ... setup event
  await event.publish(); // Don't do this
};
```

### Data Fetching Patterns
```typescript
// ✅ CORRECT: Custom hooks wrapping NDK operations
const WorkoutHistory = () => {
  const { events: workouts } = useNDKDataWithCaching({
    filters: [{ 
      kinds: [1301], 
      authors: [userPubkey],
      limit: 50 
    }],
    strategy: 'CACHE_FIRST'
  });
  
  // Events come pre-sorted, no need to re-sort
  return (
    <div>
      {workouts.map(workout => (
        <WorkoutCard key={workout.tagId()} workout={workout} />
      ))}
    </div>
  );
};

// ❌ WRONG: Using official NDK hooks
const WorkoutHistoryWrong = () => {
  const { events } = useSubscribe([...]); // Never use official hooks
  const profile = useProfileValue({ pubkey }); // Never use official hooks
};
```

## User and Event Encoding

### User References
```typescript
// ✅ CORRECT: User encoding patterns
const user = ndkSingleton.getUser({ pubkey });

// Internal references - use pubkey (hex)
const userId = user.pubkey; // For database keys, internal logic

// External references - use npub
const userUrl = `/profile/${user.npub}`; // For URLs, display
const shareText = `Check out ${user.npub} on Nostr!`; // For sharing
```

### Event References
```typescript
// ✅ CORRECT: Event encoding patterns
const workout = new NDKEvent(ndkSingleton);

// Internal references - use tagId() for stable ID
const workoutId = workout.tagId(); // For database, internal references

// External references - use encode()
const workoutUrl = `/workout/${workout.encode()}`; // For URLs
const shareUrl = `https://app.com/workout/${workout.encode()}`; // For sharing
```

## Service Layer Integration

### NDK Operations Through Services
```typescript
// ✅ CORRECT: Service layer handles all NDK operations
export class WorkoutDataService {
  private ndk: NDK;

  async getExerciseLibrary(): Promise<NDKEvent[]> {
    return Array.from(await this.ndk.fetchEvents([
      { kinds: [33401], '#t': ['fitness'], limit: 100 }
    ]));
  }

  subscribeToWorkouts(userPubkey: string, callback: (event: NDKEvent) => void): NDKSubscription {
    const sub = this.ndk.subscribe([
      { kinds: [1301], authors: [userPubkey] }
    ]);
    sub.on('event', callback);
    return sub;
  }
}

// ✅ CORRECT: Components use service through custom hooks
const ExerciseLibrary = () => {
  const { events: exercises } = useNDKDataWithCaching({
    filters: [{ kinds: [33401], '#t': ['fitness'], limit: 100 }],
    strategy: 'CACHE_FIRST'
  });
  
  return (
    <div>
      {exercises.map(exercise => (
        <ExerciseCard key={exercise.tagId()} exercise={exercise} />
      ))}
    </div>
  );
};

// ✅ CORRECT: Conditional data loading
const UserWorkouts = ({ userPubkey }: { userPubkey?: string }) => {
  const { events: workouts } = useNDKDataWithCaching({
    filters: userPubkey ? [{ kinds: [1301], authors: [userPubkey] }] : [],
    strategy: 'CACHE_FIRST',
    enabled: !!userPubkey
  });
  
  return <div>{workouts.length} workouts</div>;
};
```

### Cache-Only Operations
```typescript
// ✅ CORRECT: Cache-only queries through service layer
const CachedWorkouts = () => {
  const { events: workouts } = useNDKDataWithCaching({
    filters: [{ kinds: [1301], authors: [userPubkey] }],
    strategy: 'ONLY_CACHE' // Cache only, no network requests
  });
  
  // Reacts to cache updates without creating relay subscriptions
  return <div>{workouts.length} cached workouts</div>;
};
```

## Anti-Patterns to Avoid

### ❌ FORBIDDEN Patterns
```typescript
// DON'T: Use React Context for NDK
const NDKContext = createContext<NDK | null>(null); // Never do this

// DON'T: Create multiple NDK instances
const anotherNDK = new NDK(); // Use singleton only

// DON'T: Manual event signing
event.sign(); // Events are signed by publish() automatically
await event.publish();

// DON'T: Validate NIP-46 URIs manually
if (validateNip46Uri(bunkerUri)) { // validateNip46Uri doesn't exist
  // NDKNip46Signer handles validation
}

// DON'T: Manual serialization
JSON.stringify(profile); // Use serializeProfile() instead

// DON'T: Await publish for optimistic updates
await event.publish(); // Don't await

// DON'T: Re-sort events
events.sort((a, b) => b.created_at - a.created_at); // Already sorted

// DON'T: Use non-existent hooks
const { events, loading } = useEvents([...]); // useEvents doesn't exist
```

### ✅ CORRECT Alternatives
```typescript
// DO: Use singleton access through service layer
import { ndkSingleton } from '@/lib/ndk';
const ndk = ndkSingleton; // Direct singleton access

// DO: Use proper serialization
import { serializeProfile } from '@nostr-dev-kit/ndk';
const serialized = serializeProfile(profile);

// DO: Use optimistic publishing
event.publish(); // Don't await

// DO: Use custom hooks for data fetching
const { events } = useNDKDataWithCaching({
  filters: [...],
  strategy: 'CACHE_FIRST'
});

// DO: Use service layer for subscriptions
const subscription = ndkCacheService.subscribe(filters, callback);
```

## Web Browser Adaptations

### Storage Considerations
```typescript
// ✅ CORRECT: Let user decide on storage security
// Don't over-engineer localStorage security - user's choice
localStorage.setItem('nostr_key', privateKey); // If user chooses this

// ✅ CORRECT: Use NDK's built-in cache
// Don't recommend IndexedDB - NDK cache handles it
// Don't worry about connection issues - NDK handles retries
```

### Performance Optimizations
```typescript
// ✅ CORRECT: Component-level optimization with custom hooks
const WorkoutCard = memo(({ workout }: { workout: WorkoutEvent }) => {
  // Use custom hook for profile data
  const { events: profiles } = useNDKDataWithCaching({
    filters: [{ kinds: [0], authors: [workout.pubkey] }],
    strategy: 'CACHE_FIRST'
  });
  
  const profile = profiles[0];
  
  return (
    <div>
      <div>{profile?.content ? JSON.parse(profile.content).name : workout.pubkey.slice(0, 8)}</div>
      <div>{workout.content}</div>
    </div>
  );
});

// ✅ CORRECT: Efficient filtering with custom hooks
const RecentWorkouts = () => {
  const { events: recentWorkouts } = useNDKDataWithCaching({
    filters: [{ 
      kinds: [1301],
      since: Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60), // Last 7 days
      limit: 20
    }],
    strategy: 'PARALLEL' // Cache + network for recent data
  });
  
  return (
    <div>
      {recentWorkouts.map(workout => (
        <WorkoutCard key={workout.tagId()} workout={workout} />
      ))}
    </div>
  );
};
```

## Universal NDK Cache Service (Enhanced Architecture)

### Cache-First Data Loading with Smart Strategies
```typescript
// ✅ ENHANCED: Universal NDK Cache Service with intelligent caching
import { useNDKDataWithCaching } from '@/hooks/useNDKDataWithCaching';

const ExerciseLibrary = () => {
  // Smart caching with multiple strategies
  const { 
    events: exercises, 
    isFromCache, 
    checkOfflineAvailability 
  } = useNDKDataWithCaching({
    filters: [{ kinds: [33401], '#t': ['fitness'], limit: 100 }],
    strategy: 'CACHE_FIRST', // Try cache first, fallback to network
    cacheTimeout: 300000, // 5 minutes
    enableRealTime: true // Live updates when available
  });
  
  return (
    <div>
      {exercises.length === 0 ? (
        <div>No exercises yet - building your library!</div>
      ) : (
        exercises.map(exercise => (
          <ExerciseCard key={exercise.tagId()} exercise={exercise} />
        ))
      )}
      {isFromCache && <div className="text-sm text-gray-500">Loaded from cache</div>}
    </div>
  );
};
```

### Available Cache Strategies
```typescript
// ✅ CACHE_FIRST: Try cache first, network fallback (offline-capable)
const { events } = useNDKDataWithCaching({
  filters: [{ kinds: [33401] }],
  strategy: 'CACHE_FIRST' // Best for offline functionality
});

// ✅ PARALLEL: Cache + network simultaneously (fastest updates)
const { events } = useNDKDataWithCaching({
  filters: [{ kinds: [1301] }],
  strategy: 'PARALLEL' // Best for real-time social feeds
});

// ✅ ONLY_CACHE: Cache only, no network requests (pure offline)
const { events } = useNDKDataWithCaching({
  filters: [{ kinds: [33401] }],
  strategy: 'ONLY_CACHE' // Best for guaranteed offline access
});

// ✅ SMART: Adaptive strategy based on network conditions
const { events } = useNDKDataWithCaching({
  filters: [{ kinds: [1301] }],
  strategy: 'SMART' // Best for variable network conditions
});
```

### Specialized Domain Services
```typescript
// ✅ ENHANCED: Domain-specific caching services
import { useLibraryData, useWorkoutHistory, useDiscoveryData } from '@/hooks/useNDKDataWithCaching';

// Library data with offline-first caching
const LibraryTab = () => {
  const { events: exercises, checkOfflineAvailability } = useLibraryData({
    kinds: [33401, 33402], // Exercises and templates
    tags: ['fitness'],
    strategy: 'CACHE_FIRST'
  });
  
  return <ExerciseGrid exercises={exercises} />;
};

// Workout history with smart caching
const HistoryTab = () => {
  const { events: workouts, getOfflineCount } = useWorkoutHistory(userPubkey, {
    limit: 50,
    strategy: 'CACHE_FIRST'
  });
  
  return <WorkoutHistory workouts={workouts} />;
};

// Discovery feed with parallel loading
const SocialTab = () => {
  const { events: workouts } = useDiscoveryData({
    kinds: [1301],
    strategy: 'PARALLEL', // Cache + live updates
    enableRealTime: true
  });
  
  return <WorkoutFeed workouts={workouts} />;
};
```

### Performance Benefits
- **70%+ Network Request Reduction**: Cached content loads instantly
- **Sub-100ms Loading**: Previously viewed content loads from IndexedDB
- **True Offline Functionality**: Full app functionality without network
- **Smart Deduplication**: Eliminates duplicate subscriptions automatically
- **Adaptive Strategies**: Optimal performance across network conditions

## Integration with Existing Rules

### Compatibility with Current Architecture
- **Global NDK Actor**: Still valid for XState machine publishing
- **Service Layer**: Services can use NDK singleton directly
- **Security**: Authentication patterns remain the same
- **Event Standards**: NIP-101e validation still applies
- **Universal Cache Service**: Enhances NDK singleton with intelligent caching

### Enhanced Patterns
- **No React Context**: Remove any NDK Context/Provider patterns
- **Singleton Access**: Use `const { ndk } = useNDK()` instead of context
- **Optimistic Updates**: Don't await publishing in services
- **Component Subscriptions**: Move data fetching to component level
- **Cache-First Loading**: Use Universal NDK Cache Service for offline capability
- **Smart Strategies**: Choose appropriate caching strategy per use case

## When to Apply This Rule

### Always Apply For
- Any NDK instance creation or access
- Event publishing and subscription patterns
- User and event encoding/decoding
- Data fetching and caching strategies

### Critical for Web Performance
- Optimistic publishing for responsive UI
- Component-level subscriptions for efficiency
- Proper event and user encoding for URLs
- Cache-first data loading patterns

This rule ensures that the POWR Workout PWA follows official NDK best practices while maintaining web browser compatibility and performance optimization.

---

**Last Updated**: 2025-08-05
**Project**: POWR Workout PWA
**Environment**: Web Browser
**Source**: Official NDK Documentation + Universal NDK Cache Service Integration
