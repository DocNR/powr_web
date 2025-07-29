# Workout History Tab Implementation Task

## Objective
Implement a comprehensive workout history tab that displays user's completed workout records (Kind 1301 events) with detailed viewing capabilities and public sharing functionality, leveraging existing services and components while following .clinerules best practices.

## Current State Analysis
- **Existing Components**: `WorkoutDetailModal`, `WorkoutCard`, `WorkoutSummaryModal` provide proven patterns
- **Existing Services**: `DependencyResolutionService`, `ParameterInterpretationService`, `WorkoutAnalyticsService` handle data operations
- **NDK Integration**: Proven `useSubscribe` patterns from `WorkoutsTab.tsx` and `SocialTab.tsx`
- **Tab Infrastructure**: Navigation system supports additional tabs via `TabRouter.tsx`
- **Modal Patterns**: Recent `WorkoutSummaryModal` provides clean separation pattern
- **Search Infrastructure**: `GlobalWorkoutSearch` provides reusable UI patterns, debouncing, and data transformation logic
- **NDK Readiness**: Confirmed `useSubscribe`, `CACHE_FIRST`, and component-level subscription patterns available

## Technical Approach

### NDK-First Architecture
- **Component-Level Subscriptions**: Use `useSubscribe` for Kind 1301 workout records
- **Service Layer**: Extend existing services for business logic (volume calculations, parsing)
- **No Loading States**: React to data availability with sane defaults
- **Cache-First Strategy**: Leverage NDK's IndexedDB cache for optimal performance

### Service Integration
- **Extend `DependencyResolutionService`**: Add `resolveWorkoutRecords()` method
- **Leverage `ParameterInterpretationService`**: Handle dynamic parameter parsing for workout records
- **Extend `WorkoutAnalyticsService`**: Add volume calculation and workout record parsing methods
- **Pure Business Logic**: Services handle calculations, components handle NDK operations

### UI Component Strategy
- **Separate Modal**: Create `WorkoutHistoryDetailModal` following `WorkoutSummaryModal` pattern
- **Card Extension**: Create `WorkoutHistoryCard` extending existing `WorkoutCard` patterns
- **Radix UI Components**: Use established POWR UI component library
- **Responsive Design**: Mobile-first approach with desktop optimization

## Implementation Steps

### Phase 1: Service Layer Extensions (1.5-2 hours)

#### 1.1 Extend DependencyResolutionService
- [ ] Add `resolveWorkoutRecords(userPubkey: string): Promise<WorkoutRecord[]>` method
- [ ] Use proven CACHE_FIRST + batched query patterns
- [ ] Integrate with existing NDK optimization strategies
- [ ] Add NIP-101e validation for workout record events

#### 1.2 Extend WorkoutAnalyticsService  
- [ ] Add `calculateWorkoutVolume(exerciseTags: string[][], exerciseTemplates: Map<string, Exercise>): VolumeMetrics` method
- [ ] Add `parseWorkoutRecord(event: NDKEvent): ParsedWorkoutRecord` method
- [ ] Add `generateWorkoutSummary(record: ParsedWorkoutRecord): WorkoutSummary` method
- [ ] Leverage existing `ParameterInterpretationService` for dynamic parsing

#### 1.3 Create History-Specific Types
- [ ] Define `WorkoutRecord`, `ParsedWorkoutRecord`, `VolumeMetrics` interfaces
- [ ] Add timeline view data structures
- [ ] Define sharing URL generation types

#### 1.4 Implement Client-Side Search
- [ ] Add simple title-based filtering function (no need to extend `useNDKSearch`)
- [ ] Reuse debouncing patterns from `GlobalWorkoutSearch`
- [ ] Implement search state management for history filtering

### Phase 2: UI Components (2.5-3 hours)

#### 2.1 Create WorkoutHistoryCard Component
- [ ] Extend existing `WorkoutCard` patterns with history-specific props
- [ ] Display: date, title, duration, total volume, exercise count
- [ ] Reuse data transformation patterns from `GlobalWorkoutSearch.transformTemplateToWorkoutCard()`
- [ ] Follow POWR UI design system standards

#### 2.2 Create WorkoutHistoryDetailModal Component
- [ ] Follow `WorkoutSummaryModal` separation pattern
- [ ] Timeline view of actual workout progression
- [ ] Template attribution section (if workout used template)
- [ ] Share actions: Copy URL, Share to Nostr, Export data
- [ ] Responsive design with mobile optimization

#### 2.3 Create HistoryTab Container
- [ ] Use `useSubscribe` with `CACHE_FIRST` for Kind 1301 events by user pubkey
- [ ] Reuse search UI patterns from `GlobalWorkoutSearch` (input, debouncing, status text)
- [ ] Implement client-side filtering instead of complex search service extension
- [ ] Handle loading states with skeleton cards following existing patterns
- [ ] Integrate with existing tab navigation system

### Phase 3: Public Sharing Integration (1-1.5 hours)

#### 3.1 Create Dynamic Route
- [ ] Add `app/workout/[nevent]/page.tsx` for public workout record viewing
- [ ] Use `WorkoutHistoryDetailModal` in read-only mode
- [ ] Generate proper SEO metadata for shared workouts
- [ ] Handle invalid/missing workout records gracefully

#### 3.2 URL Generation Service
- [ ] Extend existing `SocialSharingService` with workout record URL generation
- [ ] Generate nevent encoding for workout records
- [ ] Add clipboard copy functionality
- [ ] Integrate with native share API for mobile

#### 3.3 Share Actions Integration
- [ ] Add share button to `WorkoutHistoryDetailModal`
- [ ] Generate shareable URLs using nevent encoding
- [ ] Support copying workout record naddr for cross-client compatibility
- [ ] Add social sharing text generation

### Phase 4: Integration & Polish (1 hour)

#### 4.1 Tab Navigation Integration
- [ ] Add HistoryTab to `TabRouter.tsx` configuration
- [ ] Update navigation config with proper routing
- [ ] Ensure consistent tab switching behavior
- [ ] Test deep linking to history tab

#### 4.2 Error Handling & Edge Cases
- [ ] Handle empty workout history gracefully
- [ ] Add error boundaries for malformed workout records
- [ ] Implement retry logic for failed NDK queries
- [ ] Add offline support messaging

## Success Criteria

### Functional Requirements
- [ ] User can view all their completed workout records in reverse chronological order
- [ ] Search functionality filters workouts by title instantly (<100ms)
- [ ] Workout history cards display key metrics: date, duration, volume, exercise count
- [ ] Detail modal opens smoothly (<200ms) with timeline view of actual workout
- [ ] Public sharing URLs work correctly and display workout records to non-authenticated users
- [ ] All sharing actions (copy URL, share to Nostr) function properly

### Technical Requirements
- [ ] NDK queries use CACHE_FIRST strategy for optimal performance
- [ ] Component-level subscriptions follow NDK best practices
- [ ] Services contain only pure business logic (no NDK operations)
- [ ] All components use POWR UI design system consistently
- [ ] Public sharing routes generate proper SEO metadata
- [ ] Mobile-responsive design works on all screen sizes

### Performance Requirements
- [ ] Initial history load completes within 500ms for typical user (50 workouts)
- [ ] Search filtering responds within 100ms
- [ ] Modal opening animation completes within 200ms
- [ ] Public sharing URLs load within 1 second
- [ ] Memory usage remains stable with large workout histories (200+ records)

## Architecture Compliance

### NDK Best Practices (`.clinerules/ndk-best-practices.md`)
- ✅ Use `useSubscribe` for component-level data fetching
- ✅ No loading states - react to data availability
- ✅ Leverage NDK's automatic caching and deduplication
- ✅ Use proper event encoding for URLs (`event.encode()`)

### Service Layer Architecture (`.clinerules/service-layer-architecture.md`)
- ✅ Pure business logic in services (volume calculations, parsing)
- ✅ NDK operations in components only
- ✅ Direct service calls in XState actors (if needed)
- ✅ Singleton service pattern without dependency injection

### Radix UI Component Library (`.clinerules/radix-ui-component-library.md`)
- ✅ Use POWR UI components built on Radix primitives
- ✅ Maintain enterprise stability with direct Radix dependencies
- ✅ Support white labeling through gym personality theming
- ✅ Ensure accessibility compliance through Radix primitives

### NIP-101e Standards (`.clinerules/nip-101e-standards.md`)
- ✅ Strict validation of Kind 1301 workout record events
- ✅ Proper parsing of exercise tags with parameter interpretation
- ✅ Generate valid naddr/nevent references for sharing
- ✅ Handle malformed events gracefully with clear error messages

## File Structure

```
src/
├── components/
│   └── tabs/
│       └── HistoryTab.tsx                    # Main history tab container
├── components/powr-ui/workout/
│   ├── WorkoutHistoryCard.tsx               # History-specific workout card
│   └── WorkoutHistoryDetailModal.tsx        # Dedicated history detail modal
├── lib/services/
│   ├── dependencyResolution.ts              # Extended with resolveWorkoutRecords()
│   ├── workoutAnalytics.ts                  # Extended with volume calculations
│   └── socialSharingService.ts              # Extended with workout record URLs
├── app/workout/[nevent]/
│   └── page.tsx                             # Public workout record viewing
└── types/
    └── workoutHistory.ts                    # History-specific TypeScript interfaces
```

## Dependencies

### Existing Packages (Already Available)
- `@nostr-dev-kit/ndk` - Nostr event querying and caching
- `@nostr-dev-kit/ndk-react` - React hooks for NDK integration
- `@radix-ui/react-dialog` - Modal functionality via POWR UI
- `lucide-react` - Icons for actions and UI elements
- `date-fns` - Date formatting and calculations

### New Utilities Needed
- Workout record volume calculation logic
- Timeline view data transformation utilities
- Public sharing URL generation with nevent encoding
- Client-side search/filter functionality (reusing `GlobalWorkoutSearch` patterns)

### Reusable Components from GlobalWorkoutSearch
- Search input with debouncing (400ms) and focus management
- Full-screen modal layout pattern matching `ActiveWorkoutInterface`
- Data transformation logic (`transformTemplateToWorkoutCard` as reference)
- Status text generation for loading, error, and result states
- Race condition prevention using `useRef` for latest search tracking

## Testing Strategy

### Unit Tests
- [ ] Service methods for volume calculations and workout parsing
- [ ] URL generation and nevent encoding functionality
- [ ] Search/filter logic for workout titles
- [ ] Timeline data transformation utilities

### Integration Tests
- [ ] NDK subscription integration with real workout record data
- [ ] Modal opening/closing flows with proper data passing
- [ ] Public sharing URL generation and resolution
- [ ] Tab navigation and deep linking functionality

### Component Tests
- [ ] WorkoutHistoryCard rendering with various workout data
- [ ] WorkoutHistoryDetailModal timeline view display
- [ ] HistoryTab search and filtering functionality
- [ ] Responsive design across different screen sizes

## Risk Mitigation

### Technical Risks
- **Large Dataset Performance**: Implement virtual scrolling if >200 workouts impact performance
- **Malformed Event Handling**: Robust validation and graceful degradation for invalid workout records
- **NDK Connection Issues**: Offline fallback with cached data and retry logic
- **Public URL Security**: Validate nevent parameters to prevent injection attacks

### UX Risks
- **Information Overload**: Keep history cards focused on essential metrics only
- **Search Performance**: Ensure client-side filtering remains responsive with large datasets
- **Modal Navigation**: Smooth transitions and clear exit paths for detail modal
- **Share Action Discoverability**: Make sharing functionality obvious and accessible

## Future Enhancements (Deferred)

### Advanced Features (Next Sprint)
- **Comparison Views**: Template vs actual performance, workout-to-workout comparisons
- **Analytics Dashboard**: Progress tracking, volume trends, personal record tracking
- **Advanced Filtering**: Date ranges, workout types, specific exercises, difficulty levels
- **Bulk Operations**: Delete multiple workouts, export workout data, batch sharing

### Social Features (Future)
- **Workout Comments**: Add comments and notes to past workouts
- **Progress Sharing**: Share progress updates and achievements
- **Workout Reactions**: Like/react to shared workout records
- **Follow-up Workouts**: Create new workouts based on historical performance

## References

### Architecture Documentation
- **Project Goals**: `docs/project-kickoff.md` - NDK-first architecture validation
- **NIP-101e Specification**: `docs/nip-101e-specification.md` - Workout event standards
- **Existing Components**: `src/components/powr-ui/workout/` - Proven component patterns

### .clinerules Compliance
- **Task Creation**: `.clinerules/task-creation-process.md` - Standardized task workflow
- **NDK Best Practices**: `.clinerules/ndk-best-practices.md` - Official NDK patterns
- **Service Architecture**: `.clinerules/service-layer-architecture.md` - Service layer patterns
- **UI Components**: `.clinerules/radix-ui-component-library.md` - POWR UI standards
- **NIP-101e Standards**: `.clinerules/nip-101e-standards.md` - Event compliance
- **Simple Solutions**: `.clinerules/simple-solutions-first.md` - Avoid over-engineering

### Implementation References
- **Existing Tabs**: `src/components/tabs/WorkoutsTab.tsx` - Tab structure patterns
- **Modal Patterns**: `src/components/powr-ui/workout/WorkoutSummaryModal.tsx` - Recent modal separation
- **Service Examples**: `src/lib/services/dependencyResolution.ts` - Proven NDK service patterns
- **NDK Integration**: `src/lib/ndk.ts` - Singleton NDK configuration
- **Search Patterns**: `src/components/search/GlobalWorkoutSearch.tsx` - Reusable UI and data transformation
- **Search Hook**: `src/hooks/useNDKSearch.ts` - Search state management patterns

## Quality Assurance

### Code Review Checklist
- [ ] NDK operations only in components, business logic only in services
- [ ] All components use POWR UI design system consistently
- [ ] TypeScript interfaces properly defined for all data structures
- [ ] Error handling covers network failures and malformed events
- [ ] Performance considerations implemented (virtual scrolling, caching)
- [ ] Accessibility compliance maintained through Radix primitives

### Standards Compliance Verification
- [ ] NIP-101e workout record parsing follows specification exactly
- [ ] Public sharing URLs generate valid nevent/naddr references
- [ ] Service layer contains zero NDK operations
- [ ] Component subscriptions use proper NDK hooks and patterns
- [ ] UI components maintain white labeling support for gym personalities

---

**Task Status**: Ready for Implementation  
**Estimated Timeline**: 5-6.5 hours total (optimized with reusable components)
**Priority**: High - Core user functionality  
**Dependencies**: None - leverages existing architecture  
**Created**: 2025-07-29  
**Compliance**: Verified against all relevant .clinerules

---

**This task provides essential workout tracking functionality while validating NDK-first architecture patterns. The implementation leverages existing services and components to minimize development time while maintaining architectural quality and preparing patterns for future golf app migration.**
