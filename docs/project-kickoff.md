# Workout PWA Project Kickoff Document

**Project Name**: Workout PWA  
**Start Date**: TBD  
**Target MVP**: 10 days from start  
**Last Updated**: Initial creation

## Project Overview

### Vision
Build a fitness tracking Progressive Web App (PWA) using Next.js and NDK (Nostr Development Kit) to validate NDK-first architecture patterns for complex real-time applications.

## Primary Architectural Hypothesis

**Core Question**: Can NDK IndexedDB cache + Nostr events completely replace custom database architecture for complex real-time applications?

**Current Problem**: Complex applications often use dual-database approaches:
- Custom SQLite database for app data
- NDK SQLite cache for Nostr events  
- Complex field mapping between systems
- Manual sync logic and data duplication

**Proposed Solution**: Single NDK-first architecture:
- NDK IndexedDB cache as only persistence layer
- Nostr events (NIP-101e) as primary data model
- No custom database, no field mapping, no sync complexity
- Add custom analytics database ONLY if needed later for advanced features

**Success = Proof**: If workout tracking works seamlessly with just NDK cache + events, then NDK-first architecture is validated for complex real-time applications.

### Core Goals
1. **Validate NDK-first architecture** for complex real-time tracking applications
2. **Prove XState patterns work seamlessly** with Nostr event-driven data
3. **Build genuinely useful fitness app** with social features via Nostr protocol
4. **Create proven patterns** for future application development
5. **Rapid iteration and user feedback** without App Store constraints

### Success Metrics
- ✅ Complete workout flow: Template selection → Active tracking → Event publishing
- ✅ Offline functionality with automatic sync when online
- ✅ NIP-101e compliance for all workout events
- ✅ XState machines managing complex workout state
- ✅ User authentication via NIP-07 (browser extensions)
- ✅ Social discovery of workout templates from other users
- ✅ Zero custom database code - All persistence via NDK cache
- ✅ Events as data model - No object-relational mapping needed
- ✅ Simplified architecture - Single source of truth for data

## Technical Architecture

### Stack Decision
- **Framework**: Next.js 14 (App Router)
- **State Management**: XState v5 (proven patterns from existing applications)
- **Nostr Integration**: NDK browser packages
- **Styling**: Tailwind CSS + Mantine UI components
- **Caching**: NDKCacheAdapterDexie (IndexedDB)
- **Authentication**: NIP-07 browser extensions + private key fallback

### NDK Browser Setup
```typescript
// Core packages (WEB versions, not mobile)
"@nostr-dev-kit/ndk": "latest"
"@nostr-dev-kit/ndk-cache-dexie": "latest"
"xstate": "^5.x"
"@xstate/react": "^4.x"
```

### Key Architectural Decisions
- **Events as Data Model**: NIP-101e events (kinds 33401, 33402, 1301) are primary data structure
- **No Custom Database**: NDK IndexedDB cache handles all persistence
- **Local-First**: Full offline functionality with sync when online
- **XState for Complex State**: Workout setup, active tracking, publishing workflows

## NIP-101e Implementation Scope

### Event Types (MVP)
- **Kind 33401**: Exercise Templates (use existing community templates)
- **Kind 33402**: Workout Templates (browse/select existing templates)
- **Kind 1301**: Workout Records (create from completed workouts)

### Workout Flow
```
Browse Templates (33402) → Setup Workout (XState) → Track Sets/Reps (XState) → Publish Record (1301)
```

### MVP Limitations (Deliberate)
- ❌ No exercise template creation (use existing ones)
- ❌ No complex analytics (focus on core tracking)
- ❌ No advanced social features (basic discovery only)
- ❌ No gamification/leaderboards (save for later)

## Development Phases

### Phase 1: Foundation (Days 1-3)
**Day 1**: Next.js + NDK setup, basic authentication  
**Day 2**: NIP-101e event utilities, test publishing/reading  
**Day 3**: XState machine adaptation from established patterns  

**Deliverables**: Working NDK integration, basic event publishing, proven state machine patterns

### Phase 2: Core Workflow (Days 4-7)
**Day 4**: Active workout machine with timer  
**Day 5**: Template browser UI  
**Day 6**: Active workout interface  
**Day 7**: Workout completion and publishing  

**Deliverables**: End-to-end workout flow, working UI components

### Phase 3: PWA Features (Days 8-10)
**Day 8**: Service worker setup, offline queue  
**Day 9**: Error handling, loading states  
**Day 10**: Testing, polish, deployment  

**Deliverables**: Production-ready PWA with offline support

## Project Structure

```
workout-pwa/
├── app/                    # Next.js app router
│   ├── page.tsx           # Home/dashboard
│   ├── browse/            # Template browser
│   ├── workout/           # Active workout
│   └── layout.tsx         # Root layout
├── lib/
│   ├── ndk.ts            # NDK configuration
│   ├── workout-events.ts  # NIP-101e utilities
│   └── machines/         # XState machines
│       ├── workoutSetup.ts
│       ├── activeWorkout.ts
│       └── publishing.ts
├── components/
│   ├── auth/             # Authentication components
│   ├── workout/          # Workout-specific UI
│   └── ui/               # Reusable UI components
├── providers/
│   └── NDKProvider.tsx   # NDK React context
└── public/
    ├── manifest.json     # PWA manifest
    └── sw.js            # Service worker
```

## Development Environment

### Local Development Setup
```bash
# Project initialization
npx create-next-app@latest workout-pwa --typescript --tailwind --app
cd workout-pwa

# Core dependencies
npm install @nostr-dev-kit/ndk @nostr-dev-kit/ndk-cache-dexie
npm install xstate @xstate/react
npm install @mantine/core @mantine/hooks @tabler/icons-react

# PWA support
npm install next-pwa

# Development tools
npm install --save-dev @types/node
```

### Relay Testing Strategy
**Recommendation**: Use public relays initially, add local relay only if needed.

**Public Relays for Testing**:
- `wss://relay.damus.io` (reliable, fast)
- `wss://nos.lol` (good performance)
- `wss://relay.primal.net` (Nostr-native)

**Local Relay Setup** (Optional):
```bash
# Only if public relays are insufficient
git clone https://github.com/hoytech/strfry
cd strfry
docker build -t strfry .
docker run -p 7777:7777 strfry
```

**Why Public Relays First**:
- ✅ Zero setup complexity
- ✅ Real-world testing conditions
- ✅ Existing workout templates to discover
- ✅ Social features work immediately
- ✅ NDK outbox model optimization

## Current Status

### ✅ Completed
- [x] NDK research and architecture planning
- [x] Technical stack decisions
- [x] Development phases defined
- [x] Project structure planned
- [x] Project initialization
- [x] NDK provider setup
- [x] Basic authentication implementation
- [x] Next.js project creation
- [x] NDK dependencies installation
- [x] Basic event publishing test
- [x] **Phase 1 Test Content Creation COMPLETE (June 25, 2025) ✅**
  - [x] 12 bodyweight exercises (Kind 33401) published and verified
  - [x] 3 workout templates (Kind 33402) published and verified
  - [x] 2 NIP-51 collections (Kind 30003) published and verified
  - [x] Complete dependency chain validation: Collections → Templates → Exercises
  - [x] NIP-101e/NIP-51 compliance confirmed via NAK verification
  - [x] Extended WorkoutPublisher with systematic content creation
  - [x] Enhanced workout-events.ts with comprehensive generation utilities
- [x] **Phase 2: Complete End-to-End Workout Flow COMPLETE (June 27, 2025) ✅**
  - [x] XState v5 workout machines (workoutLifecycleMachine, workoutSetupMachine, activeWorkoutMachine)
  - [x] Real NDK integration with template loading (272ms performance)
  - [x] Complete dependency resolution (4/4 exercises, 571-940ms)
  - [x] Active workout tracking with real-time set completion
  - [x] NIP-101e event publishing (Event ID: 189a048ece6dc5fb12a4255a4a4fbd523254a8f344565ceacaa640e8d8d62373)
  - [x] End-to-end workflow validation: Template selection → Active tracking → Published workout
  - [x] NDK-first architecture FULLY VALIDATED - zero custom database code
  - [x] XState + NDK integration patterns established for future application development

### 🚧 In Progress
- [ ] Phase 3: UI/UX Polish and Service Extraction

### 📋 Next Up
- [ ] Phase 3A: Beautiful workout interface with shadcn/ui components
- [ ] Phase 3B: Service extraction for future application development
- [ ] Production deployment planning
- [ ] Future application development roadmap

## Key Architectural Learnings

### What Works Well (Keep)
- ✅ XState machines for complex state management
- ✅ Local-first approach with sync
- ✅ Professional UI patterns
- ✅ Comprehensive error handling
- ✅ Offline-first mentality

### What to Simplify (Improve)
- ❌ Dual database complexity → Single NDK cache
- ❌ Manual field mapping → Events as canonical format
- ❌ Custom sync logic → NDK automatic sync
- ❌ Complex repository patterns → Simple event utilities

### Proven Patterns to Apply
- **XState Machine Architecture**: Setup → Active → Completed workflows
- **Error Boundary Patterns**: Comprehensive error handling
- **Timer Management**: Real-time updates and background timers
- **Offline Queue**: Automatic sync when connectivity restored

## Risk Mitigation

### Technical Risks
1. **NDK Browser Performance**: Mitigation via IndexedDB benchmarking
2. **XState Integration Complexity**: Leverage proven application patterns
3. **Event Structure Evolution**: Design for NIP-101e extensibility
4. **Offline Sync Conflicts**: Use NDK's built-in conflict resolution

### User Experience Risks
1. **Authentication Friction**: NIP-07 detection + smooth fallbacks
2. **First-time User Onboarding**: Clear explanation of Nostr benefits
3. **Workout Discovery**: Curate initial set of quality templates

### Project Risks
1. **Scope Creep**: Strict MVP boundaries, resist feature additions
2. **Timeline Pressure**: Focus on core workflow first
3. **Migration Path**: Document all patterns for future application development

## Testing Strategy

### Phase 1 Testing
- [ ] NDK connection to multiple relays
- [ ] Event publishing and reading
- [ ] Authentication flows (NIP-07 + fallback)
- [ ] Basic XState machine transitions

### Phase 2 Testing
- [ ] Complete workout flow end-to-end
- [ ] XState machine integration with NDK events
- [ ] UI responsiveness and usability
- [ ] Error handling and edge cases

### Phase 3 Testing
- [ ] Offline functionality
- [ ] PWA installation and app-like behavior
- [ ] Cross-browser compatibility
- [ ] Performance with large event collections

## Documentation Standards

### Code Documentation
- TypeScript interfaces for all event types
- JSDoc comments for public functions
- XState machine state diagrams
- Component prop documentation

### Architecture Documentation
- Decision records for major choices
- Integration patterns with examples
- Migration guides for future application development
- Performance benchmarks and optimizations

## Success Criteria & KPIs

### Technical Success
- [ ] 100% NIP-101e event compliance
- [ ] <2s workout completion publishing
- [ ] Offline functionality maintains state
- [ ] Zero data loss during network interruptions

### User Experience Success
- [ ] Intuitive workout flow (user testing)
- [ ] Fast authentication (NIP-07 or fallback)
- [ ] Responsive UI on mobile and desktop
- [ ] Clear error messages and recovery

### Business Success
- [ ] Validates NDK-first architecture viability
- [ ] Provides concrete patterns for future application development
- [ ] Demonstrates social fitness app potential
- [ ] Creates foundation for future gamekeeper analytics

## Next Actions

### Immediate (Next 2 Days)
1. [ ] Create new Claude project with this document
2. [ ] Initialize Next.js project with dependencies
3. [ ] Set up basic NDK provider and authentication
4. [ ] Test basic event publishing to public relays

### Week 1 Goals
1. [ ] Complete Phase 1 (Foundation)
2. [ ] Begin Phase 2 (Core Workflow)
3. [ ] Document any architectural discoveries
4. [ ] Update this document with progress

### Future Considerations
- Gamekeeper analytics backend integration
- React Native migration planning
- Golf app refactoring roadmap
- Community template curation strategy

---

**Contact**: Claude AI Assistant  
**Project Repository**: TBD  
**Deployment**: Vercel (planned)  
**Monitoring**: Console logging + error boundaries (MVP)

---

*This document should be updated as the project progresses. Key decisions, learnings, and changes should be documented for future reference and application development planning.*
