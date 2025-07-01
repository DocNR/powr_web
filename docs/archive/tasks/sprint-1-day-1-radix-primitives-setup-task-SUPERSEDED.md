---
title: Sprint 1 Day 1 - Radix Primitives Setup + WorkoutCard Foundation
description: Install Radix UI Primitives + Tailwind architecture and begin WorkoutCard implementation based on definitive research findings
status: ready
start_date: 2025-06-28
category: implementation
priority: high
estimated_duration: 1 day
sprint: ui-implementation
sprint_day: 1
parent_sprint: docs/tasks/ui-sprint-plan.md
lead: Implementation Developer
coordinator: Sprint Coordinator
---

# Sprint 1 Day 1 - Radix Primitives Setup + WorkoutCard Foundation

## 🎯 Day 1 Objective

Install and configure Radix UI Primitives + Tailwind CSS architecture based on definitive research findings, then begin WorkoutCard component implementation using Figma designs as reference.

## 📋 Current State Analysis

### **What Exists Now**
- ✅ **Working XState Integration**: `src/components/test/WorkflowValidationTest.tsx` with template selection
- ✅ **Proven Performance**: 272ms template loading benchmark established
- ✅ **NDK Integration**: Complete workout flow working (template selection → active tracking → NIP-101e publishing)
- ✅ **Figma Designs**: Complete mobile-first workout interfaces ready for implementation
- ✅ **Research Complete**: `docs/research/radix-primitives-vs-themes-analysis.md` - definitive architectural decision

### **What Needs to Change**
- ❌ **No POWR UI System**: Currently using basic HTML/CSS for template display
- ❌ **No Gym Personality Theming**: No white label customization system
- ❌ **No Radix Primitives**: Missing enterprise-grade component foundation
- ❌ **Basic Visual Design**: Template cards need Figma-matched styling

## 🏗️ Technical Approach

### **Architecture Decision (Research-Backed)**
**Definitive Choice**: Radix UI Primitives + Tailwind CSS ONLY
- **Research Evidence**: `docs/research/radix-primitives-vs-themes-analysis.md`
- **Critical Finding**: Radix Themes cannot achieve dramatic visual differences needed for gym personalities
- **Performance Advantage**: 15-25KB vs 45-60KB bundle size
- **Enterprise Stability**: Direct dependency chain (Radix → POWR App)

### **Implementation Strategy**
1. **Morning (Setup)**: Install Radix Primitives dependencies and configure Tailwind integration
2. **Afternoon (Foundation)**: Create POWR UI directory structure and begin WorkoutCard component
3. **Validation**: Ensure existing XState functionality preserved and performance maintained

## 📝 Implementation Steps

### **Morning Session (9:00 AM - 12:00 PM): Radix Primitives Setup**

#### **Step 1: Install Core Dependencies (30 minutes)**
```bash
# Install core Radix primitives for WorkoutCard
npm install @radix-ui/react-separator @radix-ui/react-dialog @radix-ui/react-progress

# Install utility libraries for component composition
npm install class-variance-authority clsx tailwind-merge

# Install icons for workout components
npm install lucide-react
```

**Success Criteria Step 1**:
- [ ] All dependencies installed without conflicts
- [ ] Package.json updated with correct versions
- [ ] No TypeScript errors in existing codebase

#### **Step 2: Create POWR UI Directory Structure (30 minutes)**
```
src/components/powr-ui/
├── primitives/              # Core Radix + Tailwind components
│   ├── Button.tsx          # Button with gym personality variants
│   ├── Card.tsx            # Card components for layouts
│   ├── Badge.tsx           # Status and difficulty badges
│   └── index.ts            # Barrel exports
├── workout/                # Fitness-specific components
│   ├── WorkoutCard.tsx     # Template and workout display cards (Day 1 focus)
│   └── index.ts            # Barrel exports
├── theming/                # White label theming system (foundation)
│   ├── gymPersonalities.ts # Gym personality configuration
│   └── index.ts            # Barrel exports
└── index.ts                # Main exports
```

**Success Criteria Step 2**:
- [ ] Directory structure created following architecture plan
- [ ] Index files created with proper TypeScript exports
- [ ] No import/export errors

#### **Step 3: Configure Gym Personality Theme Foundation (60 minutes)**
Create the foundation for gym personality theming system:

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

**Success Criteria Step 3**:
- [ ] Gym personality configuration created
- [ ] TypeScript interfaces defined for theme system
- [ ] Foundation ready for component integration

### **Afternoon Session (1:00 PM - 5:00 PM): WorkoutCard Implementation**

#### **Step 4: Create Basic WorkoutCard Component (2 hours)**
Build WorkoutCard component using Radix Primitives + Tailwind, matching Figma designs:

```typescript
// src/components/powr-ui/workout/WorkoutCard.tsx
import { cn } from '@/lib/utils'
import { Clock, Dumbbell } from 'lucide-react'

interface WorkoutCardProps {
  workout: {
    id: string;
    name: string;
    exercises: { length: number } | any[];
    estimatedDuration?: number;
    difficulty?: string;
  };
  onSelect: (workoutId: string) => void;
  className?: string;
}

export const WorkoutCard = ({ workout, onSelect, className }: WorkoutCardProps) => {
  // Implementation following Figma designs with:
  // - Orange gradient button matching designs
  // - Mobile-optimized touch targets (44px+)
  // - Proper spacing and typography
  // - Gym personality theme integration ready
}
```

**Success Criteria Step 4**:
- [ ] WorkoutCard component created with proper TypeScript interfaces
- [ ] Matches Figma design specifications exactly
- [ ] Orange gradient button implemented
- [ ] Mobile-optimized touch targets (44px minimum)
- [ ] Responsive design for mobile-first approach

#### **Step 5: Integrate with WorkflowValidationTest (1.5 hours)**
Replace existing template display in WorkflowValidationTest with new WorkoutCard:

```typescript
// In WorkflowValidationTest.tsx - replace template grid section
import { WorkoutCard } from '@/components/powr-ui/workout/WorkoutCard'

// Replace existing template display with:
<div className="grid gap-4 md:grid-cols-2">
  {state.context.availableTemplates.map((template) => (
    <WorkoutCard
      key={template.id}
      workout={template}
      onSelect={handleTemplateSelect}
    />
  ))}
</div>
```

**Success Criteria Step 5**:
- [ ] WorkoutCard integrated with existing WorkflowValidationTest
- [ ] All existing XState functionality preserved
- [ ] Template selection working correctly
- [ ] No TypeScript errors or runtime issues

#### **Step 6: Performance and Mobile Validation (30 minutes)**
Test and validate the implementation:

**Success Criteria Step 6**:
- [ ] Template loading maintains 272ms performance benchmark
- [ ] Touch interactions responsive on mobile
- [ ] Visual design matches Figma specifications
- [ ] No console errors or warnings

## 🎯 Day 1 Success Criteria (80% Minimum Threshold)

### **Enterprise Foundation ✅**
- [ ] Radix UI Primitives installed and configured correctly
- [ ] POWR UI directory structure established following architecture plan
- [ ] Zero dependency conflicts or installation issues
- [ ] TypeScript integration working properly

### **WorkoutCard Implementation ✅**
- [ ] WorkoutCard component created matching Figma designs exactly
- [ ] Orange gradient button implemented per design specifications
- [ ] Mobile-optimized touch targets (44px+ minimum)
- [ ] Proper TypeScript interfaces and error handling

### **XState Integration Preserved ✅**
- [ ] All existing WorkflowValidationTest functionality working
- [ ] Template selection using new WorkoutCard component
- [ ] useMachine hook patterns working correctly
- [ ] No regression in existing state machine behavior

### **Performance Maintained ✅**
- [ ] Template loading maintains 272ms performance benchmark
- [ ] Smooth 60fps interactions and animations
- [ ] No performance degradation from new components
- [ ] Mobile responsiveness optimized for gym environments

### **White Label Foundation ✅**
- [ ] Gym personality theme system foundation established
- [ ] CSS-only theme switching architecture ready
- [ ] Foundation for dramatic visual differences between personalities
- [ ] Scalable architecture for future gym customization

## 📚 Required Resources & References

### **Standards Compliance**
- **AI Development Standards**: `.clinerules/radix-ui-component-library.md` - Component patterns
- **Sprint Coordinator Standards**: `.clinerules/sprint-coordinator-role.md` - Quality gates
- **Auto-formatter Workflow**: `.clinerules/auto-formatter-imports.md` - Import management

### **Technical Foundation**
- **Research Documentation**: `docs/research/radix-primitives-vs-themes-analysis.md` - Architectural decision evidence
- **Working XState Integration**: `src/components/test/WorkflowValidationTest.tsx` - Integration target
- **Figma Designs**: Complete mobile-first workout interfaces for implementation reference

### **Architecture Guidance**
- **Radix UI Primitives**: https://www.radix-ui.com/primitives - Official component documentation
- **Tailwind CSS**: https://tailwindcss.com/docs - Utility-first CSS framework
- **Class Variance Authority**: https://cva.style/docs - Component variant management

## 🚨 Risk Mitigation & Contingency Plans

### **Potential Risks**
1. **Dependency Conflicts**: Radix primitives conflicting with existing packages
2. **TypeScript Errors**: Integration issues with existing codebase
3. **Performance Regression**: New components impacting 272ms benchmark
4. **XState Integration Issues**: Breaking existing state machine functionality

### **Mitigation Strategies**
1. **Incremental Installation**: Install dependencies one at a time, test after each
2. **TypeScript Validation**: Run type checking after each major change
3. **Performance Monitoring**: Test template loading speed after WorkoutCard integration
4. **XState Preservation**: Maintain exact same props and event handling patterns

### **Fallback Plans**
- **If dependency conflicts**: Use exact versions from research documentation
- **If performance issues**: Optimize component rendering and remove unnecessary re-renders
- **If XState breaks**: Revert to previous template display temporarily while debugging
- **If timeline slips**: Focus on core WorkoutCard functionality, defer advanced styling

## 📋 Quality Gates & Validation

### **Pre-Implementation Checklist**
- [ ] Research documentation reviewed and understood
- [ ] Figma designs accessible and analyzed
- [ ] Existing WorkflowValidationTest functionality documented
- [ ] Development environment ready and tested

### **Mid-Day Checkpoint (12:00 PM)**
- [ ] Dependencies installed successfully
- [ ] Directory structure created correctly
- [ ] No TypeScript errors in existing codebase
- [ ] Ready to proceed with WorkoutCard implementation

### **End-of-Day Validation (5:00 PM)**
- [ ] All Day 1 success criteria achieved (80% minimum)
- [ ] WorkoutCard component working and integrated
- [ ] Performance benchmark maintained
- [ ] Ready for Sprint 1 Day 2 (WorkoutCard completion + XState validation)

## 🚀 Handoff to Implementation

### **Implementation Developer Kickoff**
**Immediate Next Steps**:
1. Review research documentation: `docs/research/radix-primitives-vs-themes-analysis.md`
2. Analyze Figma designs for WorkoutCard specifications
3. Begin with dependency installation following exact commands provided
4. Create directory structure following architecture plan

### **Success Metrics**
- **80% Success Threshold**: All core success criteria achieved
- **Enterprise Foundation**: Radix Primitives architecture established
- **Visual Improvement**: WorkoutCard matches Figma designs exactly
- **Performance Maintained**: 272ms template loading benchmark preserved

### **Communication Protocol**
- **Progress Updates**: Report completion of each major step
- **Blockers**: Escalate any technical issues immediately
- **Quality Gates**: Validate success criteria before proceeding to next step

---

**Sprint Coordinator Note**: This task establishes the foundation for the entire POWR UI system. Success here enables rapid development of remaining components in subsequent days. Focus on quality over speed - a solid foundation prevents technical debt.

**Ready for Implementation! 🏋️‍♂️**
