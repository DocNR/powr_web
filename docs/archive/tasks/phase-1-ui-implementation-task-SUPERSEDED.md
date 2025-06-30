---
title: SPRINT - Phase 1 UI Implementation - Radix UI + Tailwind Enterprise Architecture
description: 6-week sprint to build enterprise-grade POWR Design System using Radix UI + Tailwind for white labeling business model
status: active
start_date: 2025-06-28
category: sprint
priority: high
estimated_duration: 4-6 days
sprint_type: ui_architecture
lead: Developer + Claude
---

# SPRINT - Phase 1 UI Implementation - Radix UI + Tailwind Enterprise Architecture

## 🎯 Sprint Overview

### **Strategic Mission**
Transform your validated NDK-first workout architecture into an enterprise-grade white label platform using Radix UI + Tailwind, eliminating shadcn/ui dependencies while maintaining your proven 272ms template loading performance.

### **Sprint Foundation - What We're Building On**
- ✅ **Validated Architecture**: Complete workout flow working (template selection → active tracking → NIP-101e publishing)
- ✅ **Proven Performance**: 272ms template loading, real-world Nostr event publishing
- ✅ **XState Integration**: Working state machines with `WorkflowValidationTest.tsx` as foundation
- ✅ **Research Complete**: Radix UI mobile optimization, Dialog architecture, Progress components validated
- ✅ **AI Standards**: `.clinerules/radix-ui-component-library.md` for consistent development patterns

### **Why Radix UI + Tailwind Over shadcn/ui**
Based on Leonardo Montini's critique and your white labeling business needs:

**shadcn/ui Risks**:
- **Ownership Problem**: Components become YOUR responsibility, not npm updates
- **Dependency Chain**: Radix → shadcn/ui → Your App (multiple failure points)
- **White Label Constraints**: Limited control over theming and customization

**Radix UI + Tailwind Benefits**:
- **Enterprise Stability**: Direct Radix updates, no community dependency
- **Complete Control**: Every styling decision is yours for white labeling
- **Business Reliability**: Paying gym customers need bulletproof interfaces

## 🏗️ Architecture Vision

### **POWR Design System Philosophy**
```
Radix UI Primitives → POWR Design System → Gym-Specific Themes → Customer Apps
```

**Core Principles**:
- **Mobile-First**: Optimized for gym environments and touch interactions
- **White Label Ready**: Complete styling control for gym personalities
- **Performance Focused**: Maintain your proven 272ms performance
- **XState Compatible**: Seamless integration with your working state machines

## 📅 Sprint Plan - Corrected Timeline (4-6 Days Total)

### **Sprint 1: Foundation Setup (2 Days)**

#### **Task 1: Radix Primitives + Tailwind Setup (Day 1)** 
**Goal**: Install and configure Radix UI Primitives + Tailwind architecture based on definitive research findings

**✅ DEFINITIVE APPROACH: Radix Primitives + Tailwind Only**
Based on comprehensive research in `docs/research/radix-primitives-vs-themes-analysis.md`, Radix Themes **cannot achieve** the dramatic visual differences needed for gym personalities.

```bash
# Install core Radix primitives for WorkoutCard
npm install @radix-ui/react-separator @radix-ui/react-dialog @radix-ui/react-progress
npm install class-variance-authority clsx tailwind-merge lucide-react
```

**Gym Personality Theme System (Radix Primitives + Tailwind)**:
```typescript
// src/lib/themes/gymPersonalities.ts
export const gymPersonalities = {
  zen: {
    borderRadius: 'rounded-full',
    shadows: 'shadow-sm',
    colors: 'bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50',
    typography: 'font-light',
    spacing: 'p-6',
  },
  hardcore: {
    borderRadius: 'rounded-none',
    shadows: 'shadow-2xl',
    colors: 'bg-red-900 text-red-50',
    typography: 'font-black uppercase',
    spacing: 'p-4',
  },
  corporate: {
    borderRadius: 'rounded-md',
    shadows: 'shadow-none',
    colors: 'bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-50',
    typography: 'font-medium',
    spacing: 'p-5',
  },
  boutique: {
    borderRadius: 'rounded-lg',
    shadows: 'shadow-lg',
    colors: 'bg-purple-50 text-purple-900 dark:bg-purple-950 dark:text-purple-50',
    typography: 'font-semibold',
    spacing: 'p-5',
  }
};
```

**File Structure (Radix Primitives + Tailwind)**:
```
src/components/powr-ui/
├── primitives/
│   ├── Button.tsx      # Basic button component  
│   ├── Card.tsx        # Card components for WorkoutCard
│   ├── Badge.tsx       # Badge for difficulty/status
│   └── index.ts        # Exports
└── workout/
    └── WorkoutCard.tsx # Our quick win component
```

#### **Task 2: WorkoutCard Implementation (Day 1-2) - CURRENT FOCUS** 
**Goal**: Build and integrate first POWR UI component matching Figma designs with existing WorkflowValidationTest

**Success Criteria**:
- [ ] WorkoutCard displays templates correctly
- [ ] XState integration preserved (useMachine with workoutSetupMachine)
- [ ] Performance maintained (272ms template loading)
- [ ] **Matches Figma Design**: Orange gradient buttons, dark theme, proper card layout
- [ ] Mobile-optimized touch targets (44px+)

**Implementation Strategy**:
1. Create basic Button, Card, Badge primitives using Radix Themes or custom primitives
2. Build WorkoutCard component matching Figma screenshots exactly
3. Replace template display in WorkflowValidationTest
4. Validate all existing functionality works
5. Test performance and mobile responsiveness

**WorkoutCard Component (Radix Primitives + Tailwind)**:
```typescript
// src/components/powr-ui/workout/WorkoutCard.tsx
import * as Card from '@radix-ui/react-card'
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
  const exerciseCount = Array.isArray(workout.exercises) 
    ? workout.exercises.length 
    : workout.exercises.length;
    
  const duration = workout.estimatedDuration 
    ? Math.floor(workout.estimatedDuration / 60) 
    : 30;

  return (
    <div 
      className={cn(
        // Base card styles
        "bg-card text-card-foreground rounded-lg border shadow-sm",
        "cursor-pointer transition-all duration-200 ease-in-out",
        "hover:shadow-md hover:scale-[1.02]",
        // Touch optimization for gym environments
        "touch-manipulation",
        // Mobile-first responsive padding
        "p-4 space-y-3",
        className
      )}
      onClick={() => onSelect(workout.id)}
    >
      {/* Header with title and difficulty */}
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          {workout.name}
        </h3>
        {workout.difficulty && (
          <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-md">
            {workout.difficulty}
          </span>
        )}
      </div>

      {/* Exercise count and duration */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Dumbbell size={16} />
          <span>{exerciseCount} exercises</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={16} />
          <span>{duration} min</span>
        </div>
      </div>

      {/* Orange gradient button matching Figma */}
      <button 
        className={cn(
          // Base button styles
          "w-full rounded-md font-semibold text-white",
          // Orange gradient matching Figma
          "bg-gradient-to-r from-orange-500 to-orange-600",
          "hover:from-orange-600 hover:to-orange-700",
          // Large touch target for gym use (44px minimum)
          "h-11 px-4",
          // Smooth transitions
          "transition-all duration-200 ease-in-out",
          "active:scale-[0.98]"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(workout.id);
        }}
      >
        Start workout
      </button>
    </div>
  );
};
```

**Integration with WorkflowValidationTest**:
```typescript
// In WorkflowValidationTest.tsx - replace existing template display
import { WorkoutCard } from '@/components/powr-ui/workout/WorkoutCard'
import { Grid } from '@radix-ui/themes'

// Replace template grid section with:
<Grid columns={{ initial: "1", sm: "2" }} gap="4">
  {state.context.availableTemplates.map((template) => (
    <WorkoutCard
      key={template.id}
      workout={template}
      onSelect={handleTemplateSelect}
    />
  ))}
</Grid>
```

#### **Task 3: Complete Core Infrastructure (Day 3-4)**
**Goal**: Build full component foundation using Radix Themes system

**Complete Setup Decision**:
Based on your Figma designs and need for speed, we should use **Radix Themes** as the foundation and customize the orange gradient theme.

**Complete Dependencies**:
```bash
# Radix Themes (includes all primitives we need)
npm install @radix-ui/themes

# Additional utilities for custom styling
npm install class-variance-authority clsx tailwind-merge

# Icons and forms
npm install lucide-react @tailwindcss/forms @tailwindcss/typography
```

**Theme Configuration (Matching Figma)**:
```typescript
// app/layout.tsx - Root theme setup
import '@radix-ui/themes/styles.css'
import { Theme } from '@radix-ui/themes'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Theme 
          accentColor="orange"      // Primary color for buttons/actions
          appearance="dark"         // Dark theme from screenshots
          grayColor="slate"         // Cool gray for text/borders
          radius="medium"           // Moderate rounding
          scaling="100%"            // Standard scaling
          panelBackground="solid"   // Solid cards like Figma
        >
          {children}
        </Theme>
      </body>
    </html>
  )
}
```

**Custom Orange Gradient Override**:
```css
/* globals.css - Override orange accent for Figma gradient */
.radix-themes {
  --orange-9: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
  --orange-a9: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
}

/* Custom gradient button class */
.workout-gradient-button {
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%) !important;
  border: none !important;
  color: white !important;
}
```

**Complete File Structure (Radix Themes Based)**:
```
src/components/powr-ui/
├── workout/             # Fitness-specific components
│   ├── WorkoutCard.tsx   # ✅ Complete from Task 2
│   ├── ExerciseInput.tsx # For set/rep entry
│   ├── SetCounter.tsx    # For set tracking
│   ├── WorkoutTimer.tsx  # For workout timing
│   └── WorkoutProgress.tsx # Progress indicators
├── theming/             # White label theming system
│   ├── ThemeProvider.tsx # Gym personality wrapper
│   ├── GymThemes.tsx     # Predefined gym themes
│   └── theme-utils.ts    # Theme utilities
└── index.ts             # Barrel exports
```

**Why Radix Themes Over Raw Primitives**:
- **Faster Development**: Pre-built components matching your dark theme
- **Better Dark Mode**: Built-in dark theme support with proper contrast
- **Consistent Tokens**: CSS variables for customization
- **Mobile Optimized**: Touch-friendly out of the box
- **Easy Customization**: Override specific colors while keeping system benefits

#### **Task 4: Radix Integration Components (Day 5-6)**
**Goal**: Implement complex Radix components for workout flows using Radix Themes

**Modal Component (Using Radix Themes Dialog)**:
```typescript
// src/components/powr-ui/workout/WorkoutDialog.tsx
import { Dialog, Button, Flex } from '@radix-ui/themes'

interface WorkoutDialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title?: string
  description?: string
}

export const WorkoutDialog = ({ 
  children, 
  open, 
  onOpenChange, 
  title, 
  description 
}: WorkoutDialogProps) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        {title && (
          <Dialog.Title>{title}</Dialog.Title>
        )}
        {description && (
          <Dialog.Description size="2" mb="4">
            {description}
          </Dialog.Description>
        )}

        {children}

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}
```

**Progress Component (Radix Themes)**:
```typescript
// src/components/powr-ui/workout/WorkoutProgress.tsx
import { Progress, Flex, Text, Badge } from '@radix-ui/themes'

interface WorkoutProgressProps {
  completedSets: number
  totalSets: number
  workoutTime: number
}

export const WorkoutProgress = ({ 
  completedSets, 
  totalSets, 
  workoutTime 
}: WorkoutProgressProps) => {
  const progressPercentage = (completedSets / totalSets) * 100
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Flex direction="column" gap="4">
      <Flex justify="between" align="center">
        <Text size="6" weight="bold">Active Workout</Text>
        <Badge size="2" variant="outline">
          {formatTime(workoutTime)}
        </Badge>
      </Flex>
      
      <Flex direction="column" gap="2">
        <Flex justify="between">
          <Text size="2" color="gray">Progress</Text>
          <Text size="2" color="gray">
            {completedSets} of {totalSets} sets
          </Text>
        </Flex>
        <Progress 
          value={progressPercentage} 
          style={{ height: '8px' }}
        />
      </Flex>
    </Flex>
  )
}
```

### **Week 2: White Label Theming System**

#### **Task 5: Gym Theme Architecture (Day 7-8)**
**Goal**: Build white labeling foundation on top of Radix Themes

**Theme Provider System (Extending Radix Themes)**:
```typescript
// src/components/powr-ui/theming/POWRThemeProvider.tsx
import { Theme, ThemeProps } from '@radix-ui/themes'
import { createContext, useContext, useEffect } from 'react'

interface GymPersonality {
  id: string
  name: string
  radixTheme: ThemeProps  // Use Radix theme props as base
  customCSS?: string      // Additional custom styling
}

const gymPersonalities: Record<string, GymPersonality> = {
  powerlifting: {
    id: 'powerlifting',
    name: 'Powerlifting Gym',
    radixTheme: {
      accentColor: 'orange',    // Your Figma orange
      appearance: 'dark',
      grayColor: 'slate',
      radius: 'small',          // Sharp edges for hardcore feel
      scaling: '105%',          // Slightly larger for power
    },
    customCSS: `
      .gym-powerlifting .rt-Button[data-accent-color="orange"] {
        background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%) !important;
        font-weight: 700;
        text-transform: uppercase;
      }
    `
  },
  
  wellness: {
    id: 'wellness',
    name: 'Wellness Studio',
    radixTheme: {
      accentColor: 'green',
      appearance: 'light',
      grayColor: 'sage',
      radius: 'full',           // Soft, rounded for zen feel
      scaling: '95%',           // Smaller, more delicate
    },
    customCSS: `
      .gym-wellness .rt-Button {
        box-shadow: none;
        font-weight: 400;
      }
    `
  },
  
  corporate: {
    id: 'corporate',
    name: 'Corporate Fitness',
    radixTheme: {
      accentColor: 'blue',
      appearance: 'light',
      grayColor: 'gray',
      radius: 'medium',
      scaling: '100%',
    }
  }
}

const GymPersonalityContext = createContext<GymPersonality | null>(null)

export const POWRThemeProvider = ({ 
  personality = 'powerlifting',
  children 
}: { 
  personality?: string
  children: React.ReactNode 
}) => {
  const gymTheme = gymPersonalities[personality]
  
  useEffect(() => {
    // Apply gym personality class to body
    document.body.className = `gym-${personality}`
    
    // Inject custom CSS if provided
    if (gymTheme.customCSS) {
      const styleEl = document.createElement('style')
      styleEl.textContent = gymTheme.customCSS
      document.head.appendChild(styleEl)
      
      return () => {
        document.head.removeChild(styleEl)
      }
    }
  }, [personality, gymTheme])

  return (
    <GymPersonalityContext.Provider value={gymTheme}>
      <Theme {...gymTheme.radixTheme}>
        {children}
      </Theme>
    </GymPersonalityContext.Provider>
  )
}

export const useGymPersonality = () => {
  const context = useContext(GymPersonalityContext)
  if (!context) {
    throw new Error('useGymPersonality must be used within POWRThemeProvider')
  }
  return context
}
```

#### **Task 6: Gym Personality Extensions (Day 9-10)**
**Goal**: Create foundation for future white labeling (implement later as needed)

### **Week 3-4: Workout-Specific Components**

#### **Task 7: Fitness-Optimized Components (Day 11-12)**
**Goal**: Build components specific to workout flows

**Exercise Input Component (Mobile-Optimized)**:
```typescript
// src/components/powr-ui/workout/ExerciseInput.tsx
interface ExerciseInputProps {
  exercise: string
  setNumber: number
  onComplete: (data: { weight: number; reps: number; rpe: number }) => void
}

export const ExerciseInput = ({ exercise, setNumber, onComplete }: ExerciseInputProps) => {
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [rpe, setRpe] = useState(7)

  const handleComplete = () => {
    onComplete({
      weight: parseFloat(weight) || 0,
      reps: parseInt(reps) || 0,
      rpe
    })
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{exercise}</span>
          <Badge>Set {setNumber}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Large, touch-friendly inputs for gym use */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">Weight (kg)</label>
              <Input 
                type="number" 
                placeholder="0" 
                className="mt-1 h-12 text-lg" // Larger for gym use
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Reps</label>
              <Input 
                type="number" 
                placeholder="0" 
                className="mt-1 h-12 text-lg"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">RPE</label>
              <Input 
                type="number" 
                min="1" 
                max="10" 
                placeholder="7" 
                className="mt-1 h-12 text-lg"
                value={rpe}
                onChange={(e) => setRpe(parseInt(e.target.value) || 7)}
              />
            </div>
          </div>

          <Button 
            className="w-full h-12 text-lg" 
            size="lg"
            onClick={handleComplete}
          >
            Complete Set
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

#### **Task 8: WorkflowValidationTest Enhancement (Day 13-14)**
**Goal**: Replace all UI in WorkflowValidationTest with POWR UI components

**Integration Strategy**:
```typescript
// In WorkflowValidationTest.tsx - replace existing template display
import { WorkoutCard } from '@/components/powr-ui/workout/WorkoutCard';

// Replace this section:
{state.context.availableTemplates.map((template) => (
  <div key={template.id} className="border rounded p-3">
    {/* Old markup */}
  </div>
))}

// With this:
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

#### **Task 9: Active Workout Interface (Day 15-16)**
**Goal**: Build active workout UI components

**Enhanced Progress Component**:
```typescript
// src/components/powr-ui/workout/WorkoutProgress.tsx
import { Progress } from '@/components/powr-ui/primitives/Progress'

export const WorkoutProgress = ({ completedSets, totalSets, workoutTime }) => {
  const progressPercentage = (completedSets / totalSets) * 100

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Active Workout</h2>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {formatTime(workoutTime)}
        </Badge>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{completedSets} of {totalSets} sets</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>
    </div>
  )
}
```

### **Week 5-6: Mobile & PWA Optimization**

#### **Task 10: Mobile-First Enhancements (Day 17-18)**
**Goal**: Optimize all components for gym mobile environments

**Mobile Optimization Patterns**:
```typescript
const mobileOptimizations = {
  // Larger touch targets (minimum 44px)
  touchTargets: "min-h-[44px] min-w-[44px]",
  
  // Better contrast for gym lighting
  highContrast: "contrast-125 brightness-110",
  
  // Prevent zoom on input focus
  preventZoom: "text-base", // 16px minimum
  
  // Better performance
  performance: "touch-manipulation will-change-transform",
}
```

#### **Task 11: Integration Testing (Day 19-20)**
**Goal**: Test complete POWR UI system

**Performance Validation**:
- [ ] Template loading maintains 272ms performance
- [ ] Smooth 60fps animations on all components
- [ ] Touch interactions responsive on mobile
- [ ] All XState integration working correctly

#### **Task 12: Documentation & Handoff (Day 21-22)**
**Goal**: Complete sprint documentation and future planning

## 🎯 Success Criteria

### **Enterprise Stability ✅**
- [ ] Zero shadcn/ui dependencies
- [ ] Direct Radix UI integration working
- [ ] No community bug fix dependencies
- [ ] Enterprise-grade error handling
- [ ] Production-ready component system

### **XState Integration ✅**
- [ ] All `WorkflowValidationTest` functionality preserved
- [ ] Beautiful POWR UI interface implemented
- [ ] useMachine hook patterns working correctly
- [ ] Component/machine relationships following XState React guide

### **Performance ✅**
- [ ] Template loading maintains 272ms performance
- [ ] 60fps animations and smooth interactions
- [ ] Mobile-optimized touch targets (44px+)
- [ ] Efficient component re-rendering

### **White Label Foundation ✅**
- [ ] Complete styling control for gym themes
- [ ] CSS variable theming system implemented
- [ ] Foundation for gym personality expansion
- [ ] Theme switching works seamlessly

## 📚 Sprint Resources & References

### **Sprint Research & Standards**
- **Research Documentation**: `docs/research/radix-ui-phase-1-research.md` - Complete technical validation
- **AI Development Rule**: `.clinerules/radix-ui-component-library.md` - Consistent component patterns
- **XState Integration Guide**: Available in project knowledge for component/machine relationships

### **Technical Foundation**
- **Working Component**: `src/components/test/WorkflowValidationTest.tsx` - Proven XState + NDK patterns
- **XState Machines**: `src/lib/machines/workout/` - Complete state machine hierarchy
- **NDK Integration**: `src/lib/actors/globalNDKActor.ts` - Validated publishing architecture
- **Figma Designs**: Beautiful mobile-first workout interfaces for reference

### **Architecture Guidance**
- **Leonardo's Critique**: https://leonardomontini.dev/shadcn-ui-use-with-caution - Why we chose Radix over shadcn/ui
- **Radix UI Documentation**: https://www.radix-ui.com/primitives - Official component documentation
- **XState React Patterns**: Project knowledge contains integration patterns and cheatsheet

## 🚀 Sprint Kickoff - Ready to Begin!

### **Current Task: WorkoutCard Quick Win (Days 1-2)**
**Goal**: Validate Radix UI + XState integration with immediate visual improvement
**Success**: Better-looking template selection that maintains all existing functionality

### **Immediate Next Steps**:
1. **Install minimal dependencies** for WorkoutCard quick win
2. **Create basic primitives** (Button, Card, Badge)
3. **Build WorkoutCard component** with proper TypeScript interfaces
4. **Integrate with WorkflowValidationTest** preserving all XState functionality
5. **Validate performance** and mobile responsiveness

### **Sprint Success Metric**
Enterprise-grade POWR Design System ready for white label gym customization with:
- Complete control over styling (no shadcn/ui dependencies)
- Proven XState + Radix UI integration
- Mobile-optimized components for gym environments
- Foundation for gym personality theming system

---

**Business Value**: Eliminates shadcn/ui dependency risks while creating the foundation for a scalable white label fitness platform business that gives you complete control over every styling decision for your gym customers.

**Ready to start Task 1 & 2? Let's build that WorkoutCard! 🏋️‍♂️**
