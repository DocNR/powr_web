---
title: POWR Workout PWA - Development Backlog
description: Prioritized list of features, improvements, and technical debt
status: active
last_updated: 2025-06-23
category: roadmap
formatting_rules:
  - "Use checkbox lists for tasks"
  - "Group by priority (🔴 Critical, 🟡 High, 🟢 Normal, 🔵 Low)"
  - "Include effort estimates (XS, S, M, L, XL)"
  - "Link to related documentation where applicable"
  - "Mark completed items with ✅ and completion date"
---

# POWR Workout PWA - Development Backlog

## 🔴 Critical Priority

### PWA Installation Issues
- [ ] **PWA Installation Debugging** (L)
  - Issue: PWA installation not working despite 4+ hours of troubleshooting
  - All technical requirements appear met (favicon, icons, manifest, service worker)
  - May require production HTTPS environment for proper testing
  - Consider using PWA testing tools or different browsers
  - Alternative: Focus on web app functionality, defer PWA installation
  - **Context**: Spent significant time on favicon, icon sizes, manifest configuration
  - **Files Modified**: layout.tsx, manifest.json, service worker, all icon files
  - **Status**: Technical implementation complete, installation still failing

### Core Workout Features (MVP)
- [ ] **NIP-101e Workout Event Publishing** (L)
  - Create workout event generation system
  - Implement event validation and publishing
  - Build workout completion flow
  - Related: `docs/nip-101e-specification.md`

- [ ] **Workout Template Browser** (M)
  - Browse and select workout templates
  - Filter by muscle groups, difficulty, equipment
  - Template preview and details

- [ ] **Active Workout Tracking** (L)
  - Real-time workout session management
  - Set/rep tracking with timer
  - Rest period management
  - Progress indicators

## 🟡 High Priority

### User Experience Improvements
- [ ] **UI Layout Standardization** (M)
  - Create semantic layout wrapper components (FeedLayout, ContentLayout, WorkoutLayout)
  - Standardize tab layout patterns while preserving UX differences
  - Migrate existing tabs to use standardized components
  - Related: `docs/tasks/ui-layout-standardization-task.md`

- [ ] **User Profile Management** (M)
  - Profile creation and editing
  - Avatar and bio management
  - Workout history display

- [ ] **Social Features** (L)
  - Like and comment on workout events
  - Follow other users
  - Workout feed and discovery

- [ ] **PWA Enhancements** (M)
  - Service worker implementation
  - Offline workout tracking
  - Push notifications for workout reminders

## 🟢 Normal Priority

### Technical Improvements
- [ ] **Authentication/Publishing Separation Architecture Enhancement** (M)
  - **Context**: Current fix reduces NIP-07 auth from 10s to instant by separating auth from relay connections
  - **Opportunity**: Further optimize by creating separate "minimal NDK" for authentication vs "full NDK" for publishing
  - **Benefits**: Even faster auth, cleaner separation of concerns, better error isolation
  - **Implementation**: Create `createAuthNDK()` (no relays) and `createPublishingNDK()` (with relays)
  - **Impact**: Authentication becomes truly instant, publishing operations handle their own relay requirements
  - **Priority**: Medium - current fix works well, this would be architectural improvement

- [ ] **Fix ESLint errors in test files** (S)
  - Multiple ESLint errors in src/components/test/ files
  - Issues: unescaped entities, @typescript-eslint/no-explicit-any, unused variables
  - Currently disabled ESLint during builds for deployment
  - Should fix errors and re-enable linting for better code quality
  - **Context**: ESLint disabled in next.config.ts for Vercel deployment

- [ ] **Service Layer Extraction for activeWorkoutMachine** (M)
  - Extract template loading service (~150 lines of complex fallback logic)
  - Extract workout data transformation service (CompletedWorkout format conversion)
  - Extract exercise progression calculations (set number calculation with boundary protection)
  - Extract timing and session management service (duration calculations, pause time tracking)
  - **Benefits**: Improved testability, reusability, maintainability, and performance
  - **Context**: activeWorkoutMachine is getting large (~700+ lines) with significant business logic that could be extracted following service-layer-architecture.md patterns

- [ ] **Hydration Error Audit** (S)
  - Remove all `suppressHydrationWarning` flags temporarily
  - Document exact hydration errors that appear
  - Fix any real issues found
  - Only re-add suppression for truly acceptable differences
  - **Context**: Currently using suppressHydrationWarning on main page and callback page containers after fixing major Jotai and window access issues

- [ ] **Performance Optimization** (M)
  - Bundle size analysis and optimization
  - Image optimization and lazy loading
  - Code splitting for better loading

- [ ] **Error Handling Enhancement** (S)
  - Global error boundary implementation
  - Better error messages and recovery
  - Offline error handling

### Data & Analytics
- [ ] **Workout Analytics** (M)
  - Progress tracking and charts
  - Personal records tracking
  - Workout streak counters

- [ ] **Data Export/Import** (S)
  - Export workout data
  - Import from other fitness apps
  - Backup and restore functionality

## 🔵 Low Priority

### Advanced Features
- [ ] **Workout Planning** (L)
  - Custom workout template creation
  - Workout scheduling and calendar
  - Training program management

- [ ] **Community Features** (XL)
  - Workout challenges
  - Leaderboards
  - Group workouts

- [ ] **Integration Features** (L)
  - Fitness device integration
  - Third-party app connections
  - API for external developers

### Developer Experience
- [ ] **Testing Infrastructure** (M)
  - Unit test coverage improvement
  - E2E testing setup
  - Performance testing

- [ ] **Documentation** (S)
  - API documentation
  - Component library documentation
  - Deployment guides

## ✅ Completed

### Authentication System ✅ (2025-06-23)
- [x] **Multi-Method Nostr Authentication** (XL)
  - NIP-07 browser extension support
  - NIP-46 remote signer integration
  - NIP-55 Amber mobile app support
  - Jotai state management implementation
  - Complete hydration error resolution

## Effort Estimates

- **XS**: 1-2 hours
- **S**: 1-2 days
- **M**: 3-5 days
- **L**: 1-2 weeks
- **XL**: 2+ weeks

## Notes

### Technical Debt
- **Hydration Warnings**: Currently using `suppressHydrationWarning` on container elements after fixing major issues. Should audit to ensure no real problems are being masked.
- **Auto-logout**: Disabled automatic Amber authentication check during development - should re-enable for production.

### Architecture Decisions
- **NDK-First**: All data persistence through NDK cache, no custom database
- **Event-Driven**: NIP-101e workout events as primary data model
- **Web-Optimized**: Browser-specific patterns for authentication and caching

### Golf App Migration
All patterns and components are being designed for eventual migration to the golf app, particularly:
- Authentication system (proven and tested)
- Event publishing patterns
- State management architecture
- PWA infrastructure

---

**Last Updated**: 2025-06-23
**Next Review**: Weekly during development sprints
