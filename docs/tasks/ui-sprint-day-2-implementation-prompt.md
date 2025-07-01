# UI Sprint Day 2 Implementation Prompt

## 🎯 Task Summary

Implement UI Sprint Day 2: Gallery-Based Workout Discovery with Enhanced WorkoutCards. Build a comprehensive workout discovery experience with scrollable galleries, multiple WorkoutCard variants, calendar bar, and real Nostr integration.

## 📋 Key Technical Approach

**Start with monolithic WorkoutFlow component approach for Day 2 speed, with planned service extraction for Day 3+.**

### **Component Architecture to Build:**
```
src/components/powr-ui/workout/
├── WorkoutCard.tsx          # Multiple variants: Hero, Social, Discovery
├── CalendarBar.tsx          # 7-day calendar with workout indicators
├── ScrollableGallery.tsx    # Horizontal scrolling container
├── FilterableGallery.tsx    # Discovery section with filtering
├── WorkoutImageHandler.tsx  # imeta tag parsing and fallbacks
└── index.ts                 # Barrel exports
```

### **Gallery Layout Structure (Top to Bottom):**
1. **CalendarBar** - 7-day horizontal calendar
2. **POWR WOD Hero Card** - Featured workout of the day (Kind 33402)
3. **"What your friends are up to"** - Social feed (Kind 1301 cards)
4. **"Find workout"** - Discovery with filtering (Kind 33402 cards)

## 🔗 Key Files to Review

### **Critical .clinerules (MUST READ FIRST):**
- `.clinerules/README.md` - Smart navigation system for development rules
- `.clinerules/radix-ui-component-library.md` - POWR UI component standards
- `.clinerules/ndk-best-practices.md` - NDK hook usage patterns
- `.clinerules/service-layer-architecture.md` - Service extraction guidelines
- `.clinerules/research-before-implementation.md` - MCP research requirements

### **Task Documentation:**
- `docs/tasks/ui-sprint-day-2-workoutcard-calendar-task.md` - Complete implementation plan
- `docs/tasks/ui-sprint-plan.md` - Overall sprint context

### **Existing Integration Points:**
- `src/components/test/WorkflowValidationTest.tsx` - Current template selection interface
- `src/lib/machines/workout/workoutSetupMachine.ts` - Template loading state machine
- `src/lib/actors/loadTemplateActor.ts` - Template loading with 272ms performance
- `src/components/powr-ui/primitives/` - Day 1 foundation components

## 🚀 Starting Point

### **Phase 0: Research & Architecture Planning (30-45 minutes)**

1. **Review .clinerules**: Start with `.clinerules/README.md` for smart navigation
2. **MCP Research**: Use repo-explorer to research NDK hooks for social feed implementation
3. **Architecture Decision**: Determine NDK hooks vs service layer approach based on research

### **Phase 1: Foundation Components (2-3 hours)**

1. **Install Dependencies**: `npm install date-fns`
2. **Create CalendarBar**: 7-day week view with orange active states
3. **Build WorkoutImage**: `imeta` tag parsing with fallback images
4. **Test Integration**: Add to WorkflowValidationTest or WorkoutsTab

### **Phase 2: WorkoutCard Variants (3-4 hours)**

1. **Enhanced WorkoutCard**: Multiple variants (hero, social, discovery, compact)
2. **Gallery Components**: ScrollableGallery and FilterableGallery
3. **Integration**: Connect to existing XState workflow

### **Phase 3: Nostr Integration (2-3 hours)**

1. **Enhanced WorkoutsTab**: Gallery layout with real Nostr data
2. **NDK Subscriptions**: Kind 33402 templates and Kind 1301 social feed
3. **Performance Testing**: Maintain 272ms benchmark

## ✅ Success Criteria (80% Minimum Threshold)

### **Calendar Bar Implementation:**
- [ ] 7-day week view with proper date navigation
- [ ] Touch-optimized buttons (44px+ targets)
- [ ] Orange active state matching design specifications
- [ ] Workout indicator dots for scheduled workouts

### **WorkoutCard Implementation:**
- [ ] Beautiful card design matching specifications
- [ ] Exercise count and duration display
- [ ] Difficulty badges with proper colors
- [ ] Orange gradient "Start Workout" button
- [ ] Multiple variants (hero, social, discovery)

### **Integration Success:**
- [ ] WorkflowValidationTest using new WorkoutCard component
- [ ] Template selection working with enhanced UI
- [ ] All existing XState functionality preserved
- [ ] 272ms performance benchmark maintained
- [ ] Zero TypeScript errors

### **Mobile Optimization:**
- [ ] Touch targets 44px+ for gym environments
- [ ] Smooth animations and transitions
- [ ] Proper spacing and typography
- [ ] Orange gradient buttons working on all devices

## 🎯 Performance & Complexity Confidence

**Our SPA PWA can absolutely handle this complexity!**

- **Modern PWA Capabilities**: Next.js 14 + React 18 + NDK architecture is battle-tested
- **Performance Benchmarks**: 272ms template loading already achieved
- **Industry Comparison**: Our complexity is moderate vs. Twitter, Instagram, Discord PWAs
- **Built-in Optimizations**: React.memo, useMemo, NDK automatic deduplication
- **Clear Refactoring Path**: Service extraction plan prevents technical debt

## 🔮 Future Service Extraction (Post-Day 2)

**Service Extraction Triggers:**
- WorkoutFlow > 500 lines: Extract calendar and filter logic to services
- Multiple NDK subscriptions: Extract to dedicated data services
- Complex filtering: Extract to workoutDiscoveryService

**Planned Services:**
- `workoutDiscoveryService.ts` - Template filtering, search, recommendations
- `socialFeedService.ts` - Kind 1301 parsing, profile enrichment
- `workoutCalendarService.ts` - Calendar logic, workout scheduling

## 🎨 Design Requirements

### **Orange Gradient Styling:**
```css
background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)
```

### **Touch Optimization:**
- Minimum 44px touch targets for gym environments
- Smooth hover effects and animations
- Proper spacing for mobile use

### **Component Variants:**
- **Hero**: Large featured workout card with POWR WOD badge
- **Social**: Workout records with author profiles
- **Discovery**: Template cards with filtering
- **Compact**: Smaller cards for lists

## 📱 Integration Strategy

### **WorkoutsTab vs WorkflowValidationTest:**

**Day 2 Goal:**
- **WorkflowValidationTest**: Enhanced with beautiful WorkoutCard UI (keeps all XState functionality)
- **WorkoutsTab**: Becomes the production workout discovery interface with gallery layout

**Evolution Path:**
1. Enhance WorkflowValidationTest with new WorkoutCard components
2. Build gallery layout in WorkoutsTab with real Nostr data
3. Connect WorkoutsTab gallery to same XState workflow as WorkflowValidationTest

## 🔧 Technical Notes

### **NDK Integration:**
- Use `useSubscribe` for real-time data (Kind 33402 templates, Kind 1301 records)
- Use `useProfileValue` for social card profiles
- Component-level subscriptions per NDK best practices

### **State Machine Integration:**
```
WorkoutCard.onSelect(templateId)
    ↓
workoutSetupMachine.SELECT_TEMPLATE
    ↓
loadTemplateActor (272ms performance)
    ↓
workoutLifecycleMachine.START_WORKOUT
```

### **Performance Optimizations:**
- React.memo for expensive components
- useMemo for filtered data
- Lazy loading for images
- NDK automatic subscription deduplication

---

**Focus**: Build beautiful workout discovery experience while preserving all existing functionality and maintaining enterprise-grade performance standards.

**Confidence Level**: HIGH - Modern PWA stack handles much more complex applications successfully.
