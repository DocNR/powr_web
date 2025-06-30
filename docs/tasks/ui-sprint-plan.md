---
title: SPRINT - POWR UI Implementation - Radix Primitives + Tailwind (4-6 Days)
description: Build enterprise-grade POWR Design System using Radix UI Primitives + Tailwind for white labeling business model
status: active
start_date: 2025-06-28
category: sprint
priority: high
estimated_duration: 4-6 days
sprint_type: ui_architecture
lead: Developer + Claude
research_complete: true
architectural_decision: radix_primitives_tailwind
---

# SPRINT - POWR UI Implementation - Radix Primitives + Tailwind

## 🎯 Sprint Overview

### **Strategic Mission**
Build enterprise-grade POWR Design System using **Radix UI Primitives + Tailwind CSS** based on definitive research findings, enabling dramatic visual differences for gym personalities while maintaining proven 272ms performance.

### **Research Foundation - DEFINITIVE DECISION**
✅ **Research Complete**: `docs/research/radix-primitives-vs-themes-analysis.md`
✅ **Architectural Decision**: Radix UI Primitives + Tailwind CSS ONLY
✅ **Critical Finding**: Radix Themes **cannot achieve** dramatic visual differences needed for gym personalities

**Key Research Findings**:
- **Radix Themes Limitation**: Only 6 predefined radius values, zero shadow customization, no typography control
- **Performance Advantage**: Primitives + Tailwind = 15-25KB vs Themes 45-60KB bundle size
- **Enterprise Stability**: Direct dependency chain (Radix → POWR App) vs complex (Radix → Themes → POWR App)
- **White Label Success**: Proven track record for enterprise white label platforms

### **Sprint Foundation - What We're Building On**
- ✅ **Validated Architecture**: Complete workout flow working (template selection → active tracking → NIP-101e publishing)
- ✅ **Proven Performance**: 272ms template loading, real-world Nostr event publishing
- ✅ **XState Integration**: Working state machines with `WorkflowValidationTest.tsx` as foundation
- ✅ **Figma Designs**: Complete mobile-first workout interfaces ready for implementation
- ✅ **AI Standards**: `.clinerules/radix-ui-component-library.md` for consistent development patterns

## 📅 Sprint Plan - Corrected Timeline (4-6 Days Total)

### **Sprint 1: Foundation + First Components (2 Days)**

#### **Day 1: Radix Primitives Setup + WorkoutCard Foundation**
**Goal**: Install Radix Primitives + Tailwind architecture and begin WorkoutCard implementation

**Morning (Setup)**:
```bash
# Install core Radix primitives for WorkoutCard
npm install @radix-ui/react-separator @radix-ui/react-dialog @radix-ui/react-progress
npm install class-variance-authority clsx tailwind-merge lucide-react
```

**Afternoon (WorkoutCard Start)**:
- Create `src/components/powr-ui/` directory structure
- Build basic WorkoutCard component using Radix Primitives + Tailwind
- Implement gym personality theme system foundation

**Success Criteria Day 1**:
- [ ] Radix Primitives installed and configured
- [ ] Basic WorkoutCard component created
- [ ] Gym personality theme system foundation established
- [ ] Orange gradient button matching Figma implemented

#### **Day 2: WorkoutCard Integration + XState Validation**
**Goal**: Complete WorkoutCard and integrate with existing WorkflowValidationTest

**Morning (Complete WorkoutCard)**:
- Finish WorkoutCard component with all Figma design elements
- Implement mobile-optimized touch targets (44px+)
- Add proper TypeScript interfaces

**Afternoon (XState Integration)**:
- Replace template display in WorkflowValidationTest with WorkoutCard
- Validate all existing XState functionality preserved
- Test performance maintains 272ms benchmark

**Success Criteria Day 2**:
- [ ] WorkoutCard displays templates correctly
- [ ] XState integration preserved (useMachine with workoutSetupMachine)
- [ ] Performance maintained (272ms template loading)
- [ ] Matches Figma Design exactly
- [ ] Mobile-optimized touch targets working

### **Sprint 2: Core Library + Theme System (2 Days)**

#### **Day 3: Core Primitive Components**
**Goal**: Build essential POWR UI primitive components using Radix + Tailwind

**Morning (Button + Card Primitives)**:
- Create Button component with gym personality variants
- Create Card component with proper styling system
- Create Badge component for difficulty/status indicators

**Afternoon (Form Components)**:
- Create Input component optimized for gym environments
- Create Progress component for workout tracking
- Implement proper TypeScript interfaces for all components

**Success Criteria Day 3**:
- [ ] Button component with gym personality variants
- [ ] Card component with proper styling
- [ ] Input component optimized for mobile gym use
- [ ] Progress component for workout tracking
- [ ] All components follow POWR Design System patterns

#### **Day 4: Gym Personality Theme System**
**Goal**: Implement comprehensive gym personality theming system

**Morning (Theme Architecture)**:
- Create gym personality configuration system
- Implement CSS-only theme switching
- Build theme provider for personality management

**Afternoon (Personality Variants)**:
- Implement zen gym personality (rounded, soft, calming)
- Implement hardcore gym personality (sharp, aggressive, bold)
- Test theme switching performance and visual differences

**Success Criteria Day 4**:
- [ ] Gym personality theme system working
- [ ] Dramatic visual differences between zen and hardcore personalities
- [ ] CSS-only theme switching (no JavaScript re-renders)
- [ ] Theme provider managing personality state
- [ ] All components support personality variants

### **Sprint 3: White Label Demo Ready (1-2 Days)**

#### **Day 5: Workout-Specific Components**
**Goal**: Build fitness-optimized components for complete workout flow

**Morning (Exercise Components)**:
- Create ExerciseInput component for set/rep entry
- Create SetCounter component for set tracking
- Optimize all components for gym mobile environments

**Afternoon (Workout Flow Components)**:
- Create WorkoutProgress component with timer
- Create WorkoutDialog component for modals
- Integrate all components with existing XState machines

**Success Criteria Day 5**:
- [ ] ExerciseInput component for mobile gym use
- [ ] SetCounter component for set tracking
- [ ] WorkoutProgress component with timer
- [ ] All components integrate with XState machines
- [ ] Mobile-optimized for gym environments

#### **Day 6: Integration Testing + Documentation (Optional)**
**Goal**: Complete system testing and documentation

**Morning (Integration Testing)**:
- Test complete POWR UI system with WorkflowValidationTest
- Validate performance benchmarks maintained
- Test gym personality switching across all components

**Afternoon (Documentation)**:
- Document POWR Design System patterns
- Create component usage examples
- Prepare handoff documentation

**Success Criteria Day 6**:
- [ ] Complete POWR UI system tested and working
- [ ] Performance benchmarks maintained (272ms template loading)
- [ ] All gym personalities working across components
- [ ] Documentation complete for handoff

## 🎯 Success Criteria (80% Minimum Threshold)

### **Enterprise Stability ✅**
- [ ] Zero shadcn/ui dependencies (eliminates community dependency risk)
- [ ] Direct Radix UI Primitives integration working
- [ ] Enterprise-grade error handling implemented
- [ ] Production-ready component system established

### **White Label Foundation ✅**
- [ ] Dramatic visual differences between gym personalities achieved
- [ ] Complete styling control for gym themes implemented
- [ ] CSS-only theme switching working (no JavaScript overhead)
- [ ] Foundation for unlimited gym personality expansion

### **XState Integration ✅**
- [ ] All `WorkflowValidationTest` functionality preserved
- [ ] Beautiful POWR UI interface implemented
- [ ] useMachine hook patterns working correctly
- [ ] Component/machine relationships following XState patterns

### **Performance ✅**
- [ ] Template loading maintains 272ms performance benchmark
- [ ] 60fps animations and smooth interactions
- [ ] Mobile-optimized touch targets (44px+ minimum)
- [ ] Efficient component re-rendering (no unnecessary updates)

### **Business Model Support ✅**
- [ ] White label theming system supports paying gym customers
- [ ] Gym personality system ready for business expansion
- [ ] Enterprise stability for business-critical applications
- [ ] Foundation for React Native migration established

## 🏗️ Architecture Implementation

### **POWR Design System Philosophy**
```
Radix UI Primitives → POWR Design System → Gym Personality Themes → Customer Apps
```

### **Gym Personality System**
```typescript
// src/lib/themes/gymPersonalities.ts
export const gymPersonalities = {
  zen: {
    borderRadius: 'rounded-full',      // Very rounded for calming feel
    shadows: 'shadow-sm',              // Soft shadows
    colors: 'bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50',
    typography: 'font-light',          // Light typography
    spacing: 'p-6',                    // Generous spacing
  },
  hardcore: {
    borderRadius: 'rounded-none',      // Sharp edges for aggressive feel
    shadows: 'shadow-2xl',             // Heavy shadows
    colors: 'bg-red-900 text-red-50',  // Bold contrast
    typography: 'font-black uppercase', // Aggressive typography
    spacing: 'p-4',                    // Tight spacing
  },
  corporate: {
    borderRadius: 'rounded-md',        // Professional rounding
    shadows: 'shadow-none',            // Clean, minimal
    colors: 'bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-50',
    typography: 'font-medium',         // Professional weight
    spacing: 'p-5',                    // Balanced spacing
  },
  boutique: {
    borderRadius: 'rounded-lg',        // Elegant curves
    shadows: 'shadow-lg',              // Refined shadows
    colors: 'bg-purple-50 text-purple-900 dark:bg-purple-950 dark:text-purple-50',
    typography: 'font-semibold',       // Premium feel
    spacing: 'p-5',                    // Premium spacing
  }
};
```

### **Component Architecture**
```
src/components/powr-ui/
├── primitives/              # Core Radix + Tailwind components
│   ├── Button.tsx          # Button with gym personality variants
│   ├── Card.tsx            # Card components for layouts
│   ├── Input.tsx           # Form inputs optimized for gym use
│   ├── Progress.tsx        # Progress indicators
│   ├── Badge.tsx           # Status and difficulty badges
│   └── index.ts            # Barrel exports
├── workout/                # Fitness-specific components
│   ├── WorkoutCard.tsx     # Template and workout display cards
│   ├── ExerciseInput.tsx   # Set/rep entry for mobile gym use
│   ├── SetCounter.tsx      # Set completion tracking
│   ├── WorkoutProgress.tsx # Progress with timer
│   ├── WorkoutDialog.tsx   # Modal dialogs for workout flows
│   └── index.ts            # Barrel exports
├── theming/                # White label theming system
│   ├── GymPersonalityProvider.tsx # Theme provider
│   ├── useGymPersonality.tsx      # Theme hook
│   └── theme-utils.ts             # Theme utilities
└── index.ts                # Main exports
```

## 📚 Sprint Resources & Standards

### **Research & Decision Documentation**
- **Definitive Research**: `docs/research/radix-primitives-vs-themes-analysis.md`
- **AI Development Standards**: `.clinerules/radix-ui-component-library.md`
- **Sprint Coordinator Role**: `.clinerules/sprint-coordinator-role.md`

### **Technical Foundation**
- **Working XState Integration**: `src/components/test/WorkflowValidationTest.tsx`
- **XState Machines**: `src/lib/machines/workout/` - Complete state machine hierarchy
- **NDK Integration**: `src/lib/actors/globalNDKActor.ts` - Validated publishing architecture
- **Figma Designs**: Complete mobile-first workout interfaces for implementation reference

### **Architecture Guidance**
- **Leonardo's Critique**: https://leonardomontini.dev/shadcn-ui-use-with-caution
- **Radix UI Primitives**: https://www.radix-ui.com/primitives
- **Tailwind CSS**: https://tailwindcss.com/docs

## 🚀 Sprint Kickoff - Implementation Ready

### **Immediate Next Steps (Day 1 Morning)**
1. **Install Radix Primitives dependencies** for WorkoutCard
2. **Create POWR UI directory structure** following architecture plan
3. **Begin WorkoutCard implementation** using Figma designs as reference
4. **Establish gym personality theme foundation** for white labeling

### **Sprint Success Metrics**
- **80% Success Threshold**: All core success criteria achieved
- **Enterprise Stability**: Zero community dependencies, direct Radix integration
- **White Label Ready**: Dramatic visual differences between gym personalities
- **Performance Maintained**: 272ms template loading benchmark preserved
- **Business Foundation**: Ready for paying gym customer white labeling

### **Risk Mitigation**
- **Proven Velocity**: Team has track record of completing tasks faster than estimated
- **Clear Architecture**: Research eliminates uncertainty, Figma designs eliminate iteration
- **Existing Foundation**: Working XState + NDK integration provides solid base
- **Aggressive Timeline**: 4-6 days is achievable given advantages and proven patterns

---

**Business Value**: Creates enterprise-grade white label platform foundation with complete styling control, eliminating shadcn/ui dependency risks while enabling dramatic visual customization for paying gym customers.

**Ready to Begin Sprint 1, Day 1! 🏋️‍♂️**

**Next Action**: Install Radix Primitives dependencies and begin WorkoutCard implementation using Figma designs as reference.
