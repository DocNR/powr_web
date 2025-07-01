---
title: UI Sprint Day 1 - Foundation + Header + Bottom Navigation
description: Install Radix Primitives, create POWR Design System foundation, build AppHeader with settings drawer, and enhance bottom tab navigation
status: active
start_date: 2025-06-30
category: implementation
priority: high
estimated_duration: 6-8 hours
sprint_day: 1
parent_sprint: ui-sprint-plan.md
lead: Developer + Claude
---

# UI Sprint Day 1 - Foundation + Header + Bottom Navigation

## 🎯 Day 1 Objective

**Strategic Mission**: Establish the POWR Design System foundation with Radix UI Primitives + Tailwind CSS, create a beautiful app header with settings drawer, and enhance the bottom tab navigation - all while preserving current SPA architecture.

## 📋 Day 1 Success Criteria (80% Minimum)

### **Foundation Setup ✅**
- [ ] Radix Primitives installed and configured
- [ ] POWR UI directory structure created (`src/components/powr-ui/`)
- [ ] Core primitive components built (Button, Card, Badge, Sheet, Avatar)
- [ ] Class Variance Authority (CVA) integration working

### **App Header Implementation ✅**
- [ ] AppHeader component with avatar and title
- [ ] Settings drawer accessible from avatar button
- [ ] Settings drawer with gym personality switching
- [ ] Nostr settings section in drawer

### **Bottom Navigation Enhancement ✅**
- [ ] MobileBottomTabs enhanced with POWR UI styling
- [ ] Updated tab structure: Home | Library | Workout | Social | Log
- [ ] Orange gradient active states matching design
- [ ] Touch-optimized for gym environments (44px+ targets)

### **Architecture Preservation ✅**
- [ ] Current SPA tab navigation working perfectly
- [ ] No route changes or file structure modifications
- [ ] All existing XState + NDK functionality preserved
- [ ] 272ms performance benchmark maintained

## 🚀 Implementation Plan

### **Morning Session (3-4 hours): Foundation + Primitives**

#### **Step 1: Install Radix Primitives (30 minutes)**
```bash
# Install core Radix UI primitives for beautiful components
npm install @radix-ui/react-separator @radix-ui/react-dialog @radix-ui/react-progress
npm install @radix-ui/react-sheet @radix-ui/react-avatar
npm install class-variance-authority clsx tailwind-merge lucide-react
```

#### **Step 2: Create POWR UI Directory Structure (30 minutes)**
```
src/components/powr-ui/          # NEW: POWR Design System
├── primitives/                  # Core Radix + Tailwind components
│   ├── Button.tsx              # Button with gym personality variants
│   ├── Card.tsx                # Card components for layouts
│   ├── Badge.tsx               # Status and difficulty badges
│   ├── Sheet.tsx               # Settings drawer component
│   ├── Avatar.tsx              # User avatar component
│   └── index.ts                # Barrel exports
├── layout/                     # Layout components
│   ├── AppHeader.tsx           # Header with avatar + title
│   ├── SettingsDrawer.tsx      # Settings slide-out drawer
│   └── index.ts                # Barrel exports
└── index.ts                    # Main exports
```

#### **Step 3: Build Core Primitive Components (2-3 hours)**

**Button Component with Gym Personalities**:
```typescript
// src/components/powr-ui/primitives/Button.tsx
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
      gymPersonality: {
        default: "",
        hardcore: "font-black uppercase tracking-wide shadow-2xl",
        zen: "rounded-full font-light",
        corporate: "font-semibold",
        boutique: "font-medium italic",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      gymPersonality: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, gymPersonality, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, gymPersonality, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
```

**Card Component**:
```typescript
// src/components/powr-ui/primitives/Card.tsx
import { cn } from "@/lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  )
)

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
)

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
)

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)

export { Card, CardHeader, CardTitle, CardContent }
```

### **Afternoon Session (3-4 hours): Header + Navigation**

#### **Step 4: Build App Header with Settings Drawer (2-3 hours)**

**AppHeader Component**:
```typescript
// src/components/powr-ui/layout/AppHeader.tsx
import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/powr-ui/primitives/Avatar'
import { SettingsDrawer } from './SettingsDrawer'

export const AppHeader = () => {
  const [settingsOpen, setSettingsOpen] = useState(false)
  
  return (
    <>
      {/* Header Bar */}
      <header className="flex items-center justify-between p-4 border-b bg-background">
        {/* Avatar Button - Opens Settings Drawer */}
        <button 
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors touch-manipulation"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src="/user-avatar.jpg" />
            <AvatarFallback className="bg-orange-500 text-white font-semibold">
              DW
            </AvatarFallback>
          </Avatar>
        </button>
        
        {/* App Title */}
        <h1 className="text-xl font-bold text-foreground">POWR Fitness</h1>
        
        {/* Right side spacer for center alignment */}
        <div className="w-10"></div>
      </header>

      {/* Settings Drawer - Accessible from ANY tab */}
      <SettingsDrawer 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />
    </>
  )
}
```

**Settings Drawer Component**:
```typescript
// src/components/powr-ui/layout/SettingsDrawer.tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/powr-ui/primitives/Sheet'
import { Button } from '@/components/powr-ui/primitives/Button'
import { User, Key, Wifi, Users, Palette, Settings, Dumbbell } from 'lucide-react'

export const SettingsDrawer = ({ open, onClose }) => {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          {/* Gym Theme Selection */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Gym Theme
            </h3>
            <Button variant="ghost" className="w-full justify-start h-auto p-3">
              <Palette className="h-4 w-4 mr-3" />
              <div className="text-left">
                <div className="font-medium">Powerlifting</div>
                <div className="text-xs text-muted-foreground">Bold, aggressive styling</div>
              </div>
            </Button>
            <Button variant="ghost" className="w-full justify-start h-auto p-3">
              <Palette className="h-4 w-4 mr-3" />
              <div className="text-left">
                <div className="font-medium">Wellness</div>
                <div className="text-xs text-muted-foreground">Calm, zen styling</div>
              </div>
            </Button>
          </div>

          {/* Nostr Settings */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Nostr Settings
            </h3>
            <Button variant="ghost" className="w-full justify-start h-auto p-3">
              <Key className="h-4 w-4 mr-3" />
              <div className="text-left">
                <div className="font-medium">Key Management</div>
                <div className="text-xs text-muted-foreground">NIP-07, NIP-46 settings</div>
              </div>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

#### **Step 5: Enhance Bottom Tab Navigation (1 hour)**

**Enhanced MobileBottomTabs**:
```typescript
// Update src/components/navigation/MobileBottomTabs.tsx
import { Button } from '@/components/powr-ui/primitives/Button'
import { Badge } from '@/components/powr-ui/primitives/Badge'
import { Home, BookOpen, Dumbbell, Users, BarChart3 } from 'lucide-react'

export const MobileBottomTabs = () => {
  const [activeTab, setActiveTab] = useActiveTab()
  
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'library', label: 'Library', icon: BookOpen },
    { id: 'workout', label: 'Workout', icon: Dumbbell },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'log', label: 'Log', icon: BarChart3 }
  ]
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            size="sm"
            className={cn(
              "flex flex-col items-center gap-1 h-auto py-2 px-3 min-h-[44px] touch-manipulation",
              activeTab === tab.id && "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="h-5 w-5" />
            <span className="text-xs">{tab.label}</span>
          </Button>
        ))}
      </div>
    </nav>
  )
}
```

## 🔧 Integration Steps

### **Step 6: Integrate with Existing Layout (30 minutes)**
1. **Update AppLayout** to use new AppHeader
2. **Preserve existing tab routing** logic
3. **Test all current functionality** works

### **Step 7: Testing & Validation (30 minutes)**
1. **Test tab navigation** - all tabs working
2. **Test settings drawer** - opens/closes properly
3. **Test gym personality switching** - visual changes work
4. **Performance check** - 272ms benchmark maintained

## 📚 Technical Standards

### **Component Standards**
- **Follow `.clinerules/radix-ui-component-library.md`** for all component patterns
- **Use `.clinerules/auto-formatter-imports.md`** workflow for imports
- **Enterprise stability** - direct Radix UI primitives only

### **Architecture Compliance**
- **SPA Preservation** - no routing changes
- **XState Integration** - all existing functionality preserved
- **NDK Compatibility** - no impact on Nostr operations
- **PWA Ready** - optimized for progressive web app deployment

## 🎯 End of Day 1 Deliverables

### **Files Created**
- `src/components/powr-ui/primitives/Button.tsx`
- `src/components/powr-ui/primitives/Card.tsx`
- `src/components/powr-ui/primitives/Badge.tsx`
- `src/components/powr-ui/primitives/Sheet.tsx`
- `src/components/powr-ui/primitives/Avatar.tsx`
- `src/components/powr-ui/layout/AppHeader.tsx`
- `src/components/powr-ui/layout/SettingsDrawer.tsx`
- `src/components/powr-ui/index.ts` (barrel exports)

### **Files Enhanced**
- `src/components/navigation/MobileBottomTabs.tsx` (POWR UI styling)
- `src/components/layout/AppLayout.tsx` (new header integration)

### **Visual Results**
- ✅ **Beautiful app header** with avatar and centered title
- ✅ **Functional settings drawer** with gym personality options
- ✅ **Enhanced bottom navigation** with orange gradient active states
- ✅ **Touch-optimized interface** for gym environments
- ✅ **Enterprise-grade components** built on Radix UI primitives

## 🚀 Ready for Day 2

With Day 1 complete, you'll have:
- **Solid POWR Design System foundation**
- **Beautiful header and navigation**
- **White labeling infrastructure ready**
- **All existing functionality preserved**

**Next**: Day 2 will focus on WorkoutCard implementation and calendar bar for the main Workout tab.

---

**Focus**: Foundation and navigation enhancement while preserving current SPA architecture and maintaining PWA deployment readiness.
