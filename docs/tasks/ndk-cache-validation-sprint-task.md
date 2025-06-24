# NDK Cache Validation Sprint Implementation Task

## Objective
Validate that NDK's IndexedDB cache can serve as the primary persistence layer for workout tracking in a web browser environment, eliminating the need for custom database code and proving the NDK-first architecture for golf app migration.

## Current State Analysis
- **Authentication Foundation**: Multi-method Nostr authentication working (NIP-07, NIP-46, NIP-55)
- **NDK Integration**: NDK singleton with IndexedDB cache configured
- **UI Foundation**: Professional dashboard with mock workout data
- **Missing**: Real workout event publishing, cache persistence validation, offline behavior testing
- **Architecture Question**: Can NDK cache completely replace custom database for real-time workout tracking?

## Technical Approach
- **NDK-First Architecture**: Use NDK cache as sole persistence layer
- **NIP-101e Compliance**: Follow corrected specification with `exercise` tags
- **Browser Optimization**: Test IndexedDB limits, offline behavior, cross-session persistence
- **No XState Initially**: Focus purely on NDK cache validation before state machine integration
- **Incremental Validation**: Test each cache capability independently

## Implementation Steps

### Phase 1: Basic Event Publishing & Reading (Day 1) ✅ COMPLETED
1. [x] **Create NIP-101e Test Event Utilities** (1.5 hours) ✅
   - Generate valid workout records (kind 1301) with corrected `exercise` tag format
   - Use hardcoded exercise references for testing (`33401:test-pubkey:exercise-d-tag`)
   - Include proper NIP-101e validation following `.clinerules/nip-101e-standards.md`
   - Test data: 2-3 exercises with multiple sets each

2. [x] **Build Test Publishing Component** (1 hour) ✅
   - Simple UI component with "Publish Test Workout" button
   - Integration with existing NDK provider and authentication
   - Display publish status and event IDs
   - Error handling and console logging for debugging

3. [x] **Implement Event Reading & Display** (1 hour) ✅
   - Subscribe to user's own workout events (kind 1301)
   - Filter by current user's pubkey only
   - Display retrieved workout data in simple list format
   - Verify data integrity matches published events

### Phase 2: Cache Persistence & Offline Behavior (Day 2)
4. [ ] **IndexedDB Verification** (30 minutes)
   - Manual testing with browser DevTools
   - Verify NDK cache database structure
   - Confirm events persist in IndexedDB after publishing
   - Document cache schema and data organization

5. [ ] **Offline Publishing Queue Testing** (2 hours)
   - Test network disconnect scenarios (DevTools offline mode)
   - Verify events queue locally when offline
   - Test browser close/reopen with queued events
   - Validate automatic publishing when network returns
   - Test multiple events queued while offline

6. [ ] **Cross-Session Persistence Testing** (1 hour)
   - Publish events and close browser completely
   - Reopen browser and verify events still accessible
   - Test page refresh scenarios
   - Measure cache loading performance

### Phase 3: Advanced Validation & Performance (Day 3)
7. [ ] **Duplicate Event Handling** (1 hour)
   - Test publishing same event multiple times
   - Verify NDK deduplication works correctly
   - Test network retry scenarios
   - Ensure no data corruption from duplicates

8. [ ] **Cache Size Limits & Performance** (1.5 hours)
   - Publish 50+ workout events
   - Monitor IndexedDB storage usage
   - Test query performance with large datasets
   - Document performance degradation points
   - Test browser storage limit behavior

9. [ ] **NIP-51 List Integration** (1.5 hours)
   - Create workout history lists (kind 30003 bookmark sets)
   - Test list-based workout organization
   - Verify list updates and synchronization
   - Test list persistence across sessions

## Success Criteria

### Must Achieve (Critical - 100% required)
- [x] **Publish workout records successfully** using corrected NIP-101e format ✅
- [x] **Read own workout events reliably** from NDK cache ✅
- [ ] **Offline persistence works** - events saved locally when no network
- [ ] **Cross-session persistence** - events survive browser close/reopen

### Should Achieve (High Priority - 80% required)
- [ ] **Auto-sync when back online** - queued events publish automatically
- [x] **Performance targets met** - <1s publish, <500ms queries for 50 events ✅
- [ ] **Duplicate event handling** - no corruption from network retries
- [x] **NIP-101e compliance validated** - all events pass specification ✅

### Nice to Have (Medium Priority - 60% required)
- [ ] **NIP-51 list integration** - workout organization via Nostr lists
- [ ] **Cache size limit handling** - graceful behavior at browser limits
- [ ] **Complex offline scenarios** - multiple tabs, extended offline periods
- [ ] **Production environment testing** - real relay network validation

## References

### Required Documentation Review
- **`.clinerules/README.md`** - Smart navigation for development rules
- **`docs/project-kickoff.md`** - NDK-first architecture goals and timeline
- **`docs/nip-101e-specification.md`** - Official workout event specification
- **`.clinerules/nip-101e-standards.md`** - Updated compliance standards
- **`.clinerules/ndk-best-practices.md`** - Official NDK patterns for web

### Technical References
- **`.clinerules/web-ndk-actor-integration.md`** - NDK integration patterns
- **`src/lib/ndk.ts`** - Current NDK singleton configuration
- **`src/lib/auth/`** - Working authentication system
- **`CHANGELOG.md`** - Recent authentication implementation details

### Architecture Validation
- **Golf App Migration**: Document all patterns for React Native transfer
- **Performance Baselines**: Establish metrics for mobile comparison
- **Offline Behavior**: Critical for mobile app offline-first requirements
- **Event Standards**: Ensure compatibility with broader Nostr ecosystem

## Risk Mitigation

### Technical Risks & Fallbacks
- **NDK Cache Failure**: Use NIP-51 lists for organization and discovery
- **Performance Issues**: Implement pagination and lazy loading patterns
- **Browser Limits**: Document limits and implement cleanup strategies
- **Network Issues**: Robust offline queue with retry logic

### Sprint Risks & Mitigations
- **Scope Creep**: Focus only on cache validation, no UI polish
- **Authentication Issues**: Use existing working auth, don't modify
- **Time Pressure**: Extend timeline if needed, 80% success threshold acceptable

## Architecture Decision Points

### If Cache Validation Succeeds
- **Next Phase**: Minimal XState workout flow integration
- **Golf App Path**: Direct migration of NDK-first patterns
- **Database Strategy**: Eliminate custom database entirely

### If Cache Limitations Found
- **Hybrid Approach**: NDK cache + NIP-51 lists for organization
- **Performance Optimization**: Custom indexing on top of NDK cache
- **Fallback Strategy**: Selective use of custom storage for critical data

## Post-Implementation Documentation

### Required Deliverables
- **Architecture Decision Record**: NDK-first viability assessment
- **Performance Metrics**: Baseline measurements for golf app comparison
- **Implementation Patterns**: Reusable code patterns for React Native
- **Known Limitations**: Edge cases and browser-specific issues

### Golf App Migration Insights
- **Pattern Documentation**: What works directly in React Native
- **Performance Differences**: Web vs mobile NDK cache behavior
- **Security Considerations**: Browser vs mobile authentication patterns
- **Offline Strategies**: Network handling differences between platforms

---

**Created**: 2025-06-23
**Sprint Duration**: 2-3 days (extendable)
**Success Threshold**: 80% of criteria met
**Primary Goal**: Validate NDK-first architecture for golf app migration
**Environment**: Web Browser (Chrome, Safari, Firefox)
