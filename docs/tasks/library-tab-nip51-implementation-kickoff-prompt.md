# Library Tab NIP-51 Implementation - Kickoff Prompt

## Task Summary
Implement a comprehensive Library Tab with three sub-tabs (Exercises, Workouts, Programs) using proven NIP-51 collections architecture from WorkoutListManager. Leverage existing DependencyResolutionService, DataParsingService, ParameterInterpretationService, and WorkoutCard components while adding first-time user onboarding with POWR starter content and exercise detail modal. Target: 11-15 hours total implementation with <500ms collection resolution performance.

## Key Technical Approach
- **Reuse WorkoutListManager Architecture** - Extract proven "List of Lists" patterns achieving 867-903ms performance
- **Service Integration** - Use existing DependencyResolutionService and DataParsingService for heavy lifting
- **Component Reuse** - Leverage WorkoutCard variants (compact, discovery, social) and POWR UI primitives
- **Progressive Enhancement** - Start with basic collections, add onboarding and advanced features

## 🚨 CRITICAL: Real Data Only - No Hardcoded Fluff
- **❌ FORBIDDEN**: Star ratings, popularity metrics, fake social proof, multiple trainer attribution
- **✅ REQUIRED**: Use only real NIP-101e event data - exercise names, descriptions, format arrays, equipment tags, difficulty from actual events
- **✅ REQUIRED**: POWR-only content sourcing - display actual collection counts and legitimate workout data

## Key Files to Review

### Critical Reference Files (Must Review First)
1. **`docs/tasks/library-tab-nip51-implementation-task.md`** - Complete implementation plan and requirements
2. **`src/components/test/WorkoutListManager.tsx`** - Proven NIP-51 "List of Lists" architecture patterns
3. **`src/lib/services/dependencyResolution.ts`** - Batched resolution with CACHE_FIRST optimization
4. **`src/lib/services/dataParsingService.ts`** - NIP-101e parsing with LRU caching
5. **`src/lib/services/parameterInterpretation.ts`** - Exercise parameter formatting and interpretation
6. **`src/components/powr-ui/workout/WorkoutCard.tsx`** - Multiple variants for library display
7. **`src/components/powr-ui/workout/WorkoutDetailModal.tsx`** - Modal patterns for detail views
8. **`src/components/powr-ui/workout/WorkoutHistoryDetailModal.tsx`** - Historical data display patterns

### Relevant .clinerules Standards
- **`.clinerules/service-layer-architecture.md`** - Pure business logic service patterns
- **`.clinerules/radix-ui-component-library.md`** - POWR UI component standards
- **`.clinerules/xstate-anti-pattern-prevention.md`** - State management best practices
- **`.clinerules/nip-101e-standards.md`** - Workout event compliance requirements

### UI Pattern References
- **`src/components/tabs/WorkoutsTab.tsx`** - Tab structure and layout patterns
- **`src/components/tabs/SocialTab.tsx`** - Social proof and user interaction patterns
- **`src/providers/WorkoutHistoryProvider.tsx`** - Data provider patterns to follow
- **`src/lib/services/workoutAnalytics.ts`** - Performance tracking and historical analysis patterns

## Starting Point
Begin with **Phase 1: Core Library Service** by creating `src/lib/services/libraryManagement.ts` - extract the proven NIP-51 collection patterns from WorkoutListManager.tsx, focusing on the master subscription list creation and collection resolution methods that already achieve <500ms performance. The WorkoutListManager has validated all the core patterns needed.

## Dependencies Check
✅ **All dependencies available:**
- DependencyResolutionService - Complete batched resolution
- DataParsingService - Full NIP-101e parsing with caching
- ParameterInterpretationService - Exercise parameter formatting and interpretation
- WorkoutCard - Multiple variants ready for library display
- WorkoutDetailModal patterns - Modal architecture for exercise details
- WorkoutAnalytics - Historical data and performance tracking
- POWR UI Components - Tabs, Cards, Buttons, etc. established
- Authentication System - NDK authentication working
- WorkoutListManager - Proven NIP-51 architecture patterns

## Success Validation
Target 80% minimum completion of success criteria including three-tab interface, NIP-51 collections CRUD, <500ms dependency resolution, first-time onboarding, bookmark integration, cross-account subscriptions, filtering system, parameter interpretation integration, and exercise detail modal with historical data. Performance benchmarks must match WorkoutListManager standards.
