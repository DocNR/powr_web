# Phase 2: Cache Persistence & Offline Behavior Implementation Plan

## Overview
**Goal**: Validate that NDK's IndexedDB cache provides reliable persistence for workout data across browser sessions, network outages, and offline scenarios.

**Current Status**: Phase 1 completed successfully - we can publish and read workout events
**Next Phase**: Test the persistence layer that makes NDK-first architecture viable

## Implementation Steps

### Step 4: IndexedDB Verification (30 minutes) 🎯 IMMEDIATE NEXT
**Objective**: Confirm NDK is actually storing data in IndexedDB and understand the schema

#### 4.1 Manual IndexedDB Inspection (15 minutes)
1. **Open Browser DevTools** → Application tab → Storage → IndexedDB
2. **Locate NDK Database** (likely named `workout-pwa-cache` or similar)
3. **Document Schema Structure**:
   - Database name and version
   - Object stores (tables)
   - Indexes and keys
   - Sample event data structure
4. **Verify Event Storage**:
   - Publish a test workout using existing WorkoutPublisher
   - Refresh DevTools and confirm event appears in IndexedDB
   - Check event data integrity (tags, content, metadata)

#### 4.2 Cache Configuration Validation (15 minutes)
1. **Review NDK Configuration** in `src/lib/ndk.ts`
2. **Verify Cache Adapter Settings**:
   - `dbName: 'workout-pwa-cache'`
   - `eventCacheSize` and `profileCacheSize` limits
   - `saveSig: true` for event verification
3. **Test Cache Limits**:
   - Check current storage usage
   - Estimate capacity for workout events
   - Document any configuration optimizations needed

**Deliverable**: Documentation of NDK IndexedDB schema and configuration validation

### Step 5: Offline Publishing Queue Testing (2 hours)
**Objective**: Validate that workout events are queued locally when offline and sync when back online

#### 5.1 Create Offline Test Component (45 minutes)
```typescript
// src/components/test/OfflineTest.tsx
// - Network status indicator
// - "Go Offline" button (using DevTools Network tab)
// - Publish workout while offline
// - Queue status display
// - "Go Online" button
// - Auto-sync verification
```

#### 5.2 Offline Scenario Testing (45 minutes)
1. **Basic Offline Publishing**:
   - Use DevTools → Network → "Offline" checkbox
   - Publish workout event using WorkoutPublisher
   - Verify event is queued locally (check console logs)
   - Go back online and verify auto-sync

2. **Browser Close/Reopen While Offline**:
   - Go offline, publish event
   - Close browser completely
   - Reopen browser (still offline)
   - Verify queued event persists
   - Go online and verify sync

3. **Multiple Events While Offline**:
   - Publish 3-5 workout events while offline
   - Verify all events are queued
   - Go online and verify all events sync in correct order

#### 5.3 Queue Behavior Documentation (30 minutes)
- Document NDK's offline queue implementation
- Test queue persistence across browser sessions
- Verify event ordering and deduplication
- Document any limitations or edge cases found

### Step 6: Cross-Session Persistence Testing (1 hour)
**Objective**: Ensure workout data survives browser restarts and maintains performance

#### 6.1 Browser Restart Testing (30 minutes)
1. **Publish Multiple Workouts** (5-10 events)
2. **Close Browser Completely** (not just tab)
3. **Reopen Browser and Navigate to App**
4. **Verify All Events Load** from IndexedDB cache
5. **Measure Load Performance** (should be <500ms for 50 events)

#### 6.2 Page Refresh Testing (15 minutes)
1. **Hard Refresh** (Ctrl+Shift+R) after publishing events
2. **Verify Events Persist** and load correctly
3. **Test Authentication State** persistence
4. **Check for Any Data Loss** or corruption

#### 6.3 Performance Baseline (15 minutes)
1. **Measure Cache Query Performance**:
   - Time to load 10 events
   - Time to load 50 events
   - Time to load 100 events (if available)
2. **Document Performance Metrics**
3. **Compare Against Success Criteria** (<500ms for 50 events)

## Testing Checklist

### Pre-Testing Setup
- [ ] Ensure WorkoutPublisher and WorkoutReader are working
- [ ] Have browser DevTools ready (Application tab)
- [ ] Clear any existing IndexedDB data for clean test
- [ ] Authenticate with a test account

### Step 4 Checklist: IndexedDB Verification
- [ ] Located NDK database in DevTools
- [ ] Documented database schema structure
- [ ] Verified events are stored after publishing
- [ ] Confirmed data integrity matches published events
- [ ] Reviewed NDK cache configuration
- [ ] Documented storage capacity estimates

### Step 5 Checklist: Offline Testing
- [ ] Created offline test component (if needed)
- [ ] Tested basic offline publishing
- [ ] Verified events queue locally when offline
- [ ] Tested browser close/reopen while offline
- [ ] Verified queued events persist across sessions
- [ ] Tested multiple events queued offline
- [ ] Verified auto-sync when back online
- [ ] Documented queue behavior and limitations

### Step 6 Checklist: Cross-Session Persistence
- [ ] Published multiple workout events
- [ ] Closed browser completely and reopened
- [ ] Verified all events load from cache
- [ ] Measured cache loading performance
- [ ] Tested hard page refresh scenarios
- [ ] Verified authentication state persistence
- [ ] Documented performance baselines

## Expected Outcomes

### Success Indicators
- **IndexedDB Storage**: Events visible in DevTools, proper schema
- **Offline Queue**: Events queue locally and sync when online
- **Cross-Session**: Data persists across browser restarts
- **Performance**: <500ms load time for 50 events
- **Data Integrity**: No corruption or loss during offline scenarios

### Potential Issues & Solutions
- **No IndexedDB Data**: Check NDK cache configuration
- **Offline Queue Fails**: May need custom queue implementation
- **Performance Issues**: Optimize cache settings or implement pagination
- **Data Loss**: Review NDK cache adapter settings

## Documentation Requirements

### Create/Update Files
- `docs/ndk-cache-validation-results.md` - Test results and findings
- `docs/indexeddb-schema-documentation.md` - Database structure
- Update `CHANGELOG.md` with Phase 2 completion
- Update main task document with results

### Key Metrics to Document
- IndexedDB database size and structure
- Event storage format and metadata
- Offline queue behavior and limitations
- Cross-session persistence reliability
- Performance benchmarks for different data sizes
- Any browser-specific differences found

## Next Steps After Phase 2
If Phase 2 succeeds:
- **Phase 3**: Advanced validation (duplicate handling, performance limits)
- **Architecture Decision**: Confirm NDK-first approach viability
- **Golf App Planning**: Document patterns for golf app migration

If Phase 2 reveals limitations:
- **Hybrid Approach**: NDK cache + supplementary storage
- **Performance Optimization**: Custom indexing or pagination
- **Alternative Strategies**: NIP-51 lists for organization

---

**Phase 2 Duration**: 3.5 hours total
**Success Threshold**: All critical persistence tests pass
**Primary Risk**: Offline queue behavior may not meet requirements
**Fallback Plan**: Document limitations and design hybrid approach
