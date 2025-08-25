# POWR Workout PWA - Beta Release Cleanup Task

## Objective
Complete comprehensive cleanup and polish of the POWR Workout PWA to prepare for beta release, focusing on core functionality improvements, UI polish, and open source preparation.

## Current State Analysis
The main user flow is functional with workout tracking, exercise management, and basic sharing capabilities. However, several key areas need cleanup and enhancement before beta release:

- Missing functionality gaps (add to library buttons, set removal)
- UI inconsistencies (hardcoded data, unused tabs)
- Authentication persistence issues (NIP-46 bunker)
- Share functionality needs improvement
- Security audit required for open source release

## Technical Approach
Follow the established NDK-first architecture while implementing missing UI functionality and cleaning up inconsistencies. Maintain NIP-101e compliance throughout all changes and ensure proper XState integration patterns.

**CRITICAL: Incremental Testing Strategy**
- Complete ONE item at a time, then test thoroughly before moving to next
- Manual testing required after each implementation
- Verify no regressions in existing functionality
- Document any issues discovered during testing
- Only proceed to next item after current item is fully working

## Implementation Steps

### Phase 1: Critical Security & Infrastructure (Week 1)

#### 1. Open Source Security Audit ✅ COMPLETE
- [x] **Remove All Hardcoded Secrets**
  - Scanned for API keys, private keys, passwords, tokens
  - Removed test credentials and OAuth tokens
  - Audited configuration files for embedded secrets
- [x] **Clean Personal References**
  - Removed personal names, emails, file paths from code
  - Cleaned TODO comments with personal references
  - Reviewed git history for personal data exposure
- [x] **Environment Variables Audit**
  - Moved all secrets to proper environment variables
  - Created .env.example with placeholder values
  - Updated configuration for required environment setup
- [x] **Configuration Review**
  - Cleaned next.config.js, manifest.json, package.json
  - Removed deployment-specific personal configs

#### 2. Remove Hardcoded Data from Cards ✅ COMPLETE
- [x] **Audit All Card Components**
  - WorkoutCard components showing placeholder data
  - ExerciseCard components with hardcoded values
  - Ensure all cards pull from real Nostr events
- [x] **Fix Data Flow**
  - Verified proper NDK data integration
  - Removed all mock/placeholder duration and calorie calculations
  - Cards now show only real data: exercise count, set count, difficulty

#### 3. Navigation Cleanup ✅ COMPLETE
- [x] **Remove Unused Tabs**
  - Removed Social tab (functionality exists in WorkoutsTab)
  - Removed Home tab (analytics dashboard not built)
  - Keep core functional tabs: Library, Workout, Log, Debug (dev only)
- [x] **Update Navigation Components**
  - Modified navigation.ts to exclude unused tabs
  - Updated MobileBottomTabs component automatically
  - Set Library as default landing tab

### Phase 2: Core Functionality Improvements (Week 2)

#### 4. Library UI Mobile Optimization ✅ COMPLETE
- [x] **Mobile List View Implementation**
  - Added responsive design: mobile uses clean list view, desktop uses card grid
  - List view shows: name, duration, exercises count, difficulty with dropdown menus
  - Implemented WorkoutListView and ExerciseListView components with Spotify-style design
- [x] **Responsive Design**
  - Mobile touch targets optimized with proper spacing and menu functionality
  - Full-height containers with proper bottom padding for tab navigation
  - Clean black and white styling eliminates distracting colors
- [x] **Critical Bug Fix**
  - Fixed "View Details" menu action in workout library that wasn't working
  - Now properly opens workout detail modal on both mobile and desktop
  - Consistent behavior across all interaction patterns (click item, menu actions)

#### 5. Active Workout Header & Menu ✅ COMPLETE
- [x] **Workout Title and Description Display**
  - Add workout title above first exercise in ActiveWorkoutInterface
  - Show workout description (truncated with expand option)
  - Provide visual context for what workout user is performing
- [x] **Workout Menu Implementation**
  - Add "..." menu button in workout header
  - Dropdown menu for workout-level actions and settings
  - Clean, accessible menu design consistent with ExerciseMenuDropdown
- [x] **Template Info Modal Integration**
  - "Template Info" menu action opens WorkoutDetailModal during active workout
  - Shows original template data (prescribed sets, reps, weights)
  - Proper data transformation from active workout to modal format
  - Added spacing between workout image and tab navigation
- [x] **Bugs**
  - After reordering exercises, the active workout machine gets minimized instead of going to the regular active workout machine screen

#### 6. Weight Units Conversion System ✅ COMPLETE
- [x] **User Preference Setting**
  - Added unit preference toggle to workout menu ("..." dropdown)
  - Store preference in localStorage for workout session
  - Eventually migrate to app-level setting with NIP-78 user preferences
- [x] **Automatic Conversion Logic**
  - Display conversion: multiply by 2.20462 for kg to lbs
  - Convert back to kg when saving NIP-101e records (Kind 1301)
  - Maintain protocol compliance (always store kg)
  - Proper rounding to 1 decimal place for display
- [x] **UI Integration**
  - Updated all weight input fields to show user's preferred unit
  - Applied same unit preference to Kind 1 share messages
  - Ensured consistent display across ActiveWorkoutInterface
  - Real-time unit switching during active workout

#### 7. NIP-46 Bunker Authentication Persistence ✅ COMPLETE
- [x] **Research Stacker News Implementation**
  - Clone stacker news github to referencerepos folder so that our mcp-tool repo explorer can be used on it
  - Study their NextJS PWA bunker login approach
  - Use NDK's built-in NIP-46 support patterns
  - Consider nostr-login or window.nostr.js proxy solutions
- [x] **Session Persistence**
  - Store bunker connection details in localStorage securely
  - Save bunker URI and connection state on successful connect
  - Implement automatic reconnection on app load
- [x] **Error Handling**
  - Add proper error handling for failed reconnections
  - Show loading state while attempting to restore connection
  - Graceful fallback to login screen if restoration fails

### Phase 3: Enhanced User Experience (Week 3)

#### 8. Delete/Remove Set Functionality ⏭️ SKIPPED (Moved to Backlog)
#### 8. Delete/Remove Set Functionality ⏭️ SKIPPED (Moved to Backlog)
**Decision**: Skipped in favor of higher-impact features. Incomplete sets don't affect NIP-101e workout records (Kind 1301), making this a polish feature rather than core functionality.

**Moved to**: `docs/BACKLOG.md` - V1.1 Polish Features

#### 9. Add Library Buttons to Detail Modals ✅ COMPLETE
- [x] **Workout Detail Modal Enhancement**
  - Add "Add to Library" button adjacent to "Start Workout" button
  - Handle saving workout templates to user's collection via NIP-51
  - Show success feedback when added to library
- [x] **Exercise titles clickable in WorkoutDetailModal** - COMPLETE: Fixed event handling and dual interaction model
- [x] **Exercise Detail Modal Enhancement**
  - Add "Add to Library" button for exercise saving
  - Handle saving exercises to user's exercise collection
  - Integrate with existing libraryManagementService
- [x] **Complete Discovery Workflow**
  - Enable: Browse → View Details → Add to Library → Use Later
  - Works for both NADDR discovered content and social feed content
- [x] **Bug Fixes Applied**
  - Fixed runtime error by adding LibraryDataProvider to app layout
  - Fixed toast click-through issue with backdrop
  - Added signer validation to both add/remove collection methods
  - Authentication timing issue resolved (restart fixes it - acceptable for beta)

#### 10. Enhanced Library Content Sources
- [x] **Unified Content Display**
  - Show exercises from user's personal collection AND subscribed collections
  - Same for workouts: user's saved + collection subscriptions
  - Clear attribution showing which collection each item comes from
- [x] **Filtering System**
  - Toggle between "My Saved" vs "From Collections" vs "All"
  - Maintain existing search functionality
  - Use existing NIP-51 architecture and useLibraryDataWithCollections hook
- [x] **Bugs**
  - Content (exercises and workouts) are blocked by the bottom tab navigator (can't see the bottom workout or exercise)

#### 11. NADDR Search & Discovery ✅ COMPLETE
- [x] **Search Enhancement**
  - Enhanced existing search boxes to recognize NADDR format (naddr1...)
  - When user pastes NADDR, fetches that specific workout/exercise using NDK's built-in capabilities
  - Added "Add to Library" action for found NADDR content via WorkoutDetailModal integration
- [x] **User Flow Implementation**
  - Friend shares: "Check out this workout: naddr1abc123..."
  - User copies NADDR and pastes in search box
  - App recognizes format and fetches the workout using NDKNaddrResolutionService
  - Shows workout details with "Add to Library" button through seamless modal integration
- [x] **Feedback System**
  - Clear feedback when NADDR is found vs not found with proper loading states
  - Support discovery for both workouts and exercises via unified resolution system
  - Comprehensive error handling for invalid or unfetchable NADDRs with user-friendly messages
- [x] **Technical Implementation**
  - Created NDKNaddrResolutionService with fetchByNaddr, batchResolveNaddrs methods
  - Implemented useNDKNaddrResolution hook following service layer architecture patterns
  - Integrated NADDR resolution with existing WorkoutDetailModal for cohesive UI/UX
  - Added comprehensive logging and error handling throughout resolution pipeline
  - Supports multiple cache strategies (CACHE_FIRST, PARALLEL, ONLY_CACHE, SMART)

### Phase 4: Share Functionality & Polish (Week 4)

#### 12. Fix Share Functionality
- [ ] **Improve Kind 1 Share Message Formatting**
  - Better formatted text for workout sharing
  - Include workout duration, exercise count, completion status
  - Apply user's preferred units (kg vs lbs) to share messages (but maintain proper NIP101e parameters and units for the 1301 record)
  - Make shared notes readable and engaging
- [ ] **NADDR Link Sharing Support**
  - Enable sharing workout record NADDR links
  - Allow users to view shared workout records by clicking links
  - Support both web links and NADDR format sharing
- [ ] **Unit Consistency**
  - Ensure share messages use same unit preference as UI
  - Convert units properly for display while keeping NIP-101e compliance

#### 13. Library Collection Management ✅ COMPLETE
- [x] **Add to Personal Collections**
  - Add existing exercises/workouts to user's NIP-51 collections (Kind 30003)
  - "Add to Library" buttons in detail modals (covered in item 9)
  - Update user's personal exercise and workout collections
  - Replaced "In Library" badge with small checkmark badge similar to Spotify
- [x] **Remove from Personal Collections**
  - Remove exercises/workouts from user's NIP-51 collections
  - Confirmation dialogs for removal actions
  - Update collection events properly
- [x] **Collection State Management**
  - Real-time updates to library displays when items added/removed
  - Proper NIP-51 collection event publishing
  - Integration with existing libraryManagementService patterns

### Phase 5: Content Creation (After Cleanup Complete)

#### 14. Content Strategy Implementation
- [ ] **Publish High-Quality Content**
  - Create comprehensive exercise library using stable app
  - Publish diverse workout templates for different fitness levels
  - Use NADDR sharing to distribute content efficiently
- [ ] **User Empowerment Features**
  - Enable users to modify existing workouts (reorder, substitute, adjust)
  - Save modified workouts as new templates with smart naming
  - Template modification tracking and analysis
- [ ] **Bridge to V1.1**
  - This approach gives users creativity without from-scratch builder
  - Collect feedback on what custom workout features users want most
  - Prepare foundation for full custom workout builder in v1.1

## Technical Achievements (Completed During Beta Cleanup)

### NADDR Resolution System Implementation ✅
**Achievement**: Successfully implemented comprehensive NADDR (Nostr Address) resolution system enabling seamless content discovery and sharing.

**Technical Details**:
- **NDKNaddrResolutionService**: Created service layer abstraction with methods for fetchByNaddr, batchResolveNaddrs, resolveExerciseTemplate, resolveWorkoutTemplate
- **useNDKNaddrResolution Hook**: Implemented custom hook following .clinerules architecture patterns (no official NDK hooks)
- **Universal Cache Integration**: Supports multiple cache strategies (CACHE_FIRST, PARALLEL, ONLY_CACHE, SMART) for optimal performance
- **WorkoutDetailModal Integration**: NADDR-resolved content opens same modal as text search results, creating cohesive UI/UX
- **Comprehensive Error Handling**: User-friendly error messages and loading states throughout resolution pipeline

**User Impact**: Users can now paste NADDR links (naddr1...) in search boxes to instantly discover and add shared workout templates to their library, enabling seamless content sharing between users.

**Architecture Compliance**: Follows established service layer architecture patterns, maintains NIP-101e compliance, and integrates with existing NDK caching strategies.

## Success Criteria

### Core Functionality
- [ ] Users can reliably add workouts/exercises to library from detail modals
- [x] NADDR search enables content discovery and sharing ✅ **COMPLETE**
- [ ] Weight units display according to user preference while maintaining kg storage
- [ ] NIP-46 bunker authentication persists across app sessions
- [ ] Set removal functionality works smoothly with good UX

### User Experience
- [ ] Mobile library has clean list view option
- [ ] Navigation focuses on working features only (no placeholder tabs)
- [ ] Share functionality produces well-formatted, engaging messages
- [ ] All cards display real data, no hardcoded placeholders

### Technical Quality
- [ ] No hardcoded secrets or personal information in codebase
- [ ] All functionality maintains NIP-101e compliance
- [ ] XState patterns follow established anti-pattern prevention rules
- [ ] Performance remains acceptable on target devices

### Open Source Readiness
- [ ] Security audit completed with no sensitive data exposure
- [ ] Documentation updated for new features
- [ ] Environment setup clearly documented
- [ ] Clean git history ready for public release

## References

### Related .clinerules
- `.clinerules/task-creation-process.md` - Task structure and workflow
- `.clinerules/nip-101e-standards.md` - Event compliance requirements
- `.clinerules/xstate-anti-pattern-prevention.md` - State management patterns
- `.clinerules/service-layer-architecture.md` - Service integration patterns
- `.clinerules/web-private-key-security.md` - Authentication security
- `.clinerules/simple-solutions-first.md` - Avoid over-engineering

### Key Files
- `src/components/tabs/LibraryTab.tsx` - Library UI components
- `src/lib/machines/workout/activeWorkoutMachine.ts` - Workout state management
- `src/lib/services/libraryManagement.ts` - Library operations
- `src/components/powr-ui/workout/ExerciseMenuDropdown.tsx` - Exercise actions
- `src/providers/LibraryDataProvider.tsx` - Data integration
- `src/hooks/useLibraryDataWithCollections.ts` - Collection data handling

## Implementation Strategy
**ONE ITEM AT A TIME WITH TESTING**
- Implement single item completely
- Test manually to ensure functionality works
- Verify no existing features are broken
- Document any issues or edge cases discovered
- Only move to next item after current item is stable

## Timeline
- **Week 1**: Security audit, hardcoded data cleanup, navigation cleanup (3 items, test each)
- **Week 2**: Mobile UI, workout header/menu, units system, authentication persistence (4 items, test each)
- **Week 3**: Set management, library buttons, content sources, NADDR search (4 items, test each)
- **Week 4**: Share functionality, library collection management (2 items, test each)
- **Week 5**: Content creation using stable, polished app

## Post-Beta Features (V1.1 Planning)
- Custom workout builder (start blank, add exercises on-the-fly)
- Exercise and workout template creation (Kind 33401, 33402 creation forms)
- Deep linking system (limited by iOS PWA constraints)
- Advanced sharing features with platform-specific formatting
- Programs & scheduling system with NIP-52 calendar integration
- App-level user preferences with NIP-78 implementation (migrate from workout-level unit settings)

---

**Last Updated**: 2025-08-11
**Project**: POWR Workout PWA
**Environment**: Web Browser
**Priority**: Critical for Beta Release
