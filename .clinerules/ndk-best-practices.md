# NDK Best Practices Rule

## Brief overview
This rule establishes NDK-specific best practices adapted from official NDK documentation, ensuring proper usage patterns for the POWR Workout PWA while maintaining web browser compatibility.

## Core NDK Principles

### 1. **Singleton Pattern (CRITICAL)**
- **✅ REQUIRED**: Create NDK as a singleton and load immediately
- **❌ FORBIDDEN**: DO NOT use React Context/Provider for NDK
- **❌ FORBIDDEN**: Never use Context API for Nostr functionality

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

### 2. **No Loading States (CRITICAL)**
- **❌ FORBIDDEN**: Never include concept of 'loading' anywhere
- **✅ REQUIRED**: Data is either fetched or not - react when available
- **✅ REQUIRED**: Use sane defaults and optimistic updates

```typescript
// ❌ WRONG: Loading states
const [loading, setLoading] = useState(true);
if (loading) return <div>Loading...</div>;

// ✅ CORRECT: React to data availability
const { events: workouts } = useSubscribe<WorkoutEvent>([
  { kinds: [1301], '#t': ['fitness'] }
]);

return (
  <div>
    {workouts.length === 0 ? (
      <div>No workouts yet - start your first workout!</div>
    ) : (
      workouts.map(workout => <WorkoutCard key={workout.id} workout={workout} />)
    )}
  </div>
);
```

### 3. **Component-Level Subscriptions**
- **✅ REQUIRED**: Put subscriptions at component level, not feed level
- **✅ REQUIRED**: NDK automatically merges filters efficiently
- **✅ REQUIRED**: Fetch data where it's actually used

```typescript
// ✅ CORRECT: Profile fetching in individual components
const WorkoutCard = ({ workout }: { workout: WorkoutEvent }) => {
  const profile = useProfileValue({ pubkey: workout.pubkey });
  
  return (
    <div>
      <div>{profile?.name || 'Anonymous'}</div>
      <div>{workout.content}</div>
    </div>
  );
};

// ❌ WRONG: Prefetching all profiles in feed component
const WorkoutFeed = ({ workouts }: { workouts: WorkoutEvent[] }) => {
  const profiles = workouts.map(w => useProfileValue({ pubkey: w.pubkey })); // Don't do this
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
// ✅ CORRECT: useSubscribe for reactive data
const WorkoutHistory = () => {
  const { events: workouts } = useSubscribe<WorkoutEvent>([
    { 
      kinds: [1301], 
      authors: [userPubkey],
      limit: 50 
    }
  ]);
  
  // Events come pre-sorted, no need to re-sort
  return (
    <div>
      {workouts.map(workout => (
        <WorkoutCard key={workout.tagId()} workout={workout} />
      ))}
    </div>
  );
};

// ❌ WRONG: Using non-existent hooks
const WorkoutHistoryWrong = () => {
  const { events, loading } = useEvents([...]); // useEvents doesn't exist
  const workouts = events.sort((a, b) => b.created_at - a.created_at); // Unnecessary sorting
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

## Subscription Patterns

### Reactive Data Loading
```typescript
// ✅ CORRECT: useSubscribe with proper typing
const ExerciseLibrary = () => {
  const { events: exercises } = useSubscribe<ExerciseTemplate>([
    { 
      kinds: [33401], // NIP-101e exercise template
      '#t': ['fitness'],
      limit: 100 
    }
  ], 
  { wrap: true }, // Wrap in NDKEvent subclass
  []); // Dependencies
  
  return (
    <div>
      {exercises.map(exercise => (
        <ExerciseCard key={exercise.tagId()} exercise={exercise} />
      ))}
    </div>
  );
};

// ✅ CORRECT: Conditional subscriptions
const UserWorkouts = ({ userPubkey }: { userPubkey?: string }) => {
  const { events: workouts } = useSubscribe<WorkoutEvent>(
    userPubkey ? [{ 
      kinds: [1301], 
      authors: [userPubkey] 
    }] : false, // Won't execute when false
    { wrap: true },
    [userPubkey] // Dependency
  );
  
  return <div>{workouts.length} workouts</div>;
};
```

### Cache-Only Queries
```typescript
// ✅ CORRECT: useObserver for cache-only reactive data
const CachedWorkouts = () => {
  const workouts = useObserver<WorkoutEvent>([
    { kinds: [1301], authors: [userPubkey] }
  ]);
  
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
// DO: Use singleton access
const { ndk } = useNDK(); // Access singleton

// DO: Use proper serialization
import { serializeProfile } from '@nostr-dev-kit/ndk';
const serialized = serializeProfile(profile);

// DO: Use optimistic publishing
event.publish(); // Don't await

// DO: Use events as-is (pre-sorted)
const { events } = useSubscribe([...]);

// DO: Use correct hooks
const { events, eose } = useSubscribe([...]); // No loading property
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
// ✅ CORRECT: Component-level optimization
const WorkoutCard = memo(({ workout }: { workout: WorkoutEvent }) => {
  const profile = useProfileValue({ pubkey: workout.pubkey });
  
  return (
    <div>
      <div>{profile?.name || workout.pubkey.slice(0, 8)}</div>
      <div>{workout.content}</div>
    </div>
  );
});

// ✅ CORRECT: Efficient filtering
const { events: recentWorkouts } = useSubscribe<WorkoutEvent>([
  { 
    kinds: [1301],
    since: Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60), // Last 7 days
    limit: 20
  }
]);
```

## Integration with Existing Rules

### Compatibility with Current Architecture
- **Global NDK Actor**: Still valid for XState machine publishing
- **Service Layer**: Services can use NDK singleton directly
- **Security**: Authentication patterns remain the same
- **Event Standards**: NIP-101e validation still applies

### Updated Patterns
- **No React Context**: Remove any NDK Context/Provider patterns
- **Singleton Access**: Use `const { ndk } = useNDK()` instead of context
- **Optimistic Updates**: Don't await publishing in services
- **Component Subscriptions**: Move data fetching to component level

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

**Last Updated**: 2025-06-21
**Project**: POWR Workout PWA
**Environment**: Web Browser
**Source**: Official NDK Documentation
