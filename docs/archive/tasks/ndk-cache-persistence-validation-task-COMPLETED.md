# NDK Cache Persistence Validation Implementation Task

## Objective
Validate NDK's IndexedDB cache persistence capabilities for workout data across browser sessions, network outages, and offline scenarios. This is Phase 2 of the NDK Cache Validation Sprint, building on successful Phase 1 event publishing and reading.

## Current State Analysis
- **Phase 1 Complete**: WorkoutPublisher and WorkoutReader components working
- **Authentication**: Multi-method Nostr authentication functional (NIP-07, NIP-46, NIP-55)
- **NDK Integration**: Singleton with IndexedDB cache configured (`workout-pwa-cache`)
- **Event Publishing**: NIP-101e compliant workout records (kind 1301) publishing successfully
- **Event Reading**: User's workout events retrievable from NDK cache
- **Missing**: Persistence validation, offline behavior testing, cross-session reliability

## Technical Approach
- **IndexedDB Verification**: Manual inspection of NDK cache database structure
- **Offline Queue Testing**: Network disconnect scenarios with DevTools
- **Cross-Session Persistence**: Browser restart and page refresh testing
- **Performance Baseline**: Establish cache query performance metrics
- **No Code Changes**: Focus on testing existing NDK cache implementation
- **Documentation First**: Document findings for golf app migration patterns

## Implementation Steps

### Step 1: IndexedDB Manual Verification (30 minutes)
1. [ ] **Open Browser DevTools** → Application tab → Storage → IndexedDB
2. [ ] **Locate NDK Database** (should be named `workout-pwa-cache`)
3. [ ] **Document Database Schema**:
   - Database name and version
   - Object stores (tables) present
   - Index structure and keys
   - Sample event data format
4. [ ] **Verify Event Storage Process**:
   - Use existing WorkoutPublisher to publish test workout
   - Refresh DevTools IndexedDB view
   - Confirm event appears in database
   - Verify data integrity (tags, content, metadata match)
5. [ ] **Review NDK Cache Configuration** in `src/lib/ndk.ts`:
   - Confirm `dbName: 'workout-pwa-cache'`
   - Check `eventCacheSize` and `profileCacheSize` limits
   - Verify `saveSig: true` setting

### Step 2: Offline Publishing Queue Testing (2 hours)
1. [ ] **Basic Offline Publishing Test**:
   - Open DevTools → Network tab → Check "Offline"
   - Use WorkoutPublisher to publish workout event
   - Check console logs for queue behavior
   - Go back online (uncheck "Offline")
   - Verify event publishes automatically
2. [ ] **Browser Close/Reopen While Offline**:
   - Go offline in DevTools
   - Publish workout event
   - Close browser completely (not just tab)
   - Reopen browser while still offline
   - Verify queued event persists
   - Go online and verify sync
3. [ ] **Multiple Events Offline Queue**:
   - Go offline
   - Publish 3-5 different workout events
   - Verify all events are queued locally
   - Go online and verify all events sync in correct order
4. [ ] **Document Queue Behavior**:
   - NDK's offline queue implementation details
   - Event ordering and deduplication behavior
   - Any limitations or edge cases discovered

### Step 3: Cross-Session Persistence Testing (1 hour)
1. [ ] **Browser Restart Test**:
   - Publish 5-10 workout events using WorkoutPublisher
   - Close browser completely
   - Reopen browser and navigate to app
   - Use WorkoutReader to verify all events load from cache
   - Measure and document load performance
2. [ ] **Page Refresh Test**:
   - Hard refresh page (Ctrl+Shift+R) after publishing events
   - Verify events persist and load correctly
   - Test authentication state persistence
   - Check for any data loss or corruption
3. [ ] **Performance Baseline Measurement**:
   - Time to load 10 events from cache
   - Time to load 50 events from cache
   - Time to load 100 events (if available)
   - Compare against success criteria (<500ms for 50 events)

## Success Criteria

### Must Achieve (Critical - 100% required)
- [ ] **IndexedDB Storage Verified** - Events visible in DevTools with proper schema
- [ ] **Offline Queue Works** - Events queue locally when network unavailable
- [ ] **Auto-Sync Functions** - Queued events publish when network returns
- [ ] **Cross-Session Persistence** - Events survive browser close/reopen

### Should Achieve (High Priority - 80% required)
- [ ] **Performance Targets Met** - <500ms load time for 50 events
- [ ] **Data Integrity Maintained** - No corruption during offline scenarios
- [ ] **Queue Persistence** - Offline queue survives browser restart
- [ ] **Multiple Event Handling** - Correct ordering of queued events

### Nice to Have (Medium Priority - 60% required)
- [ ] **Browser Compatibility** - Test across Chrome, Safari, Firefox
- [ ] **Storage Capacity Documentation** - IndexedDB limits and usage
- [ ] **Error Handling** - Graceful behavior when storage limits reached
- [ ] **Performance Optimization** - Identify bottlenecks for large datasets

## References

### Required Documentation Review
- **`.clinerules/README.md`** - Smart navigation for development rules
- **`docs/tasks/ndk-cache-validation-sprint-task.md`** - Main sprint task context
- **`.clinerules/ndk-best-practices.md`** - Official NDK patterns for web
- **`src/lib/ndk.ts`** - Current NDK singleton configuration
- **`src/components/test/WorkoutPublisher.tsx`** - Existing publishing component
- **`src/components/test/WorkoutReader.tsx`** - Existing reading component

### Technical References
- **`.clinerules/web-ndk-actor-integration.md`** - NDK integration patterns
- **`.clinerules/nip-101e-standards.md`** - Workout event compliance
- **`docs/project-kickoff.md`** - NDK-first architecture goals
- **Browser DevTools Documentation** - IndexedDB inspection techniques

## Web-Specific Considerations

### Browser Environment Testing
- Use Chrome DevTools for primary testing
- Test offline scenarios with Network tab controls
- Monitor IndexedDB storage in Application tab
- Check console logs for NDK cache behavior

### Performance Optimization
- Measure cache query performance across different data sizes
- Document any browser-specific differences
- Identify optimal cache configuration settings
- Test storage limits and cleanup behavior

### Offline-First Validation
- Verify NDK queue implementation works in browser
- Test network state change detection
- Validate automatic sync when connectivity returns
- Document any limitations for mobile app migration

## Common Pitfalls to Avoid

- Don't modify existing NDK configuration during testing
- Don't clear IndexedDB manually unless specifically testing clean state
- Don't assume offline queue works without explicit verification
- Don't skip performance measurement - critical for golf app migration
- Don't test only happy path - include error scenarios

## Post-Implementation Documentation

### Required Deliverables
- **`docs/ndk-cache-validation-results.md`** - Complete test results and findings
- **`docs/indexeddb-schema-documentation.md`** - Database structure documentation
- **Update `CHANGELOG.md`** with Phase 2 completion
- **Update main sprint task** with results and next phase planning

### Golf App Migration Insights
- **Performance Baselines** - Metrics for React Native comparison
- **Offline Behavior** - Patterns that transfer to mobile
- **Storage Limitations** - Browser vs mobile differences
- **Configuration Optimization** - Settings for mobile environments

## Risk Mitigation

### Technical Risks & Fallbacks
- **NDK Cache Failure**: Document limitations and design hybrid approach
- **Performance Issues**: Identify optimization strategies
- **Offline Queue Problems**: Evaluate custom queue implementation needs
- **Browser Compatibility**: Document browser-specific workarounds

### Testing Risks & Mitigations
- **Data Loss During Testing**: Use test accounts only
- **Browser State Corruption**: Clear cache between major test scenarios
- **Network Simulation Issues**: Use multiple offline testing methods
- **Performance Measurement Accuracy**: Test multiple times and average results

## When to Apply This Task

### Prerequisites
- Phase 1 of NDK Cache Validation Sprint completed
- WorkoutPublisher and WorkoutReader components functional
- Authentication system working with test accounts
- NDK singleton properly configured

### Success Indicators
- All critical success criteria met (100%)
- Performance baselines established
- Offline behavior documented and reliable
- Clear recommendations for Phase 3 or golf app migration

This task validates the core persistence capabilities that make NDK-first architecture viable for real-world workout tracking applications.

---

**Last Updated**: 2025-06-24
**Project**: POWR Workout PWA
**Environment**: Web Browser
**Phase**: 2 of 3 (NDK Cache Validation Sprint)
**Duration**: 3.5 hours
**Dependencies**: Phase 1 completion, working authentication
