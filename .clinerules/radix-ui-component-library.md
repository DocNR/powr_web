# Radix UI + Tailwind Component Library Rule

## Brief overview
This rule establishes Radix UI + Tailwind as the primary component architecture for the POWR Workout PWA, ensuring enterprise stability, complete white labeling control, and optimal performance for the fitness platform business model.

## Strategic Decision: Radix UI + Tailwind Over shadcn/ui

### **Why This Change**
After analyzing Leonardo Montini's excellent critique of shadcn/ui (https://leonardomontini.dev/shadcn-ui-use-with-caution), we've identified critica long-ter risks for our project:

**shadcn/ui Risks**:
- **Ownership Problem**: Components become YOUR responsibility, not npm updates
- **Dependency Chain Issues**: Radix → shadcn/ui → Your App (multiple failure points)
- **Community Bug Fixes**: Relying on community solutions vs. official patches
- **White Label Constraints**: Limited control over theming and customization

**Radix UI + Tailwind Benefits**:
- **Enterprise Stability**: Direct Radix updates through npm, no community dependency
- **Complete Control**: Every styling decision is yours for white labeling
- **Simpler Chain**: Radix UI → Your Components → Your App
- **Business Reliability**: Paying customers need bulletproof interfaces

## Core Principles

### **POWR Design System Architecture**
```
Radix UI Primitives → POWR Design System → Gym-Specific Themes → PWA Deployment
```

### **Primary Component Strategy**
**ALWAYS build POWR UI components** using Radix UI primitives + Tailwind CSS for complete control over styling and behavior.

### **Installation Pattern**
When using new Radix UI primitives, follow this pattern:
```bash
npm install @radix-ui/react-[primitive-name]
```

### **Component Import Convention**
Always import POWR UI components from the designated path:
```typescript
import { Button } from "@/components/powr-ui/primitives/Button"
import { Card, CardContent, CardHeader } from "@/components/powr-ui/primitives/Card"
import { WorkoutCard } from "@/components/powr-ui/workout/WorkoutCard"
```

## Available Core Primitives

### **Radix UI Primitives (Direct Dependencies)**
- `@radix-ui/react-dialog` - Modal dialogs and overlays
- `@radix-ui/react-dropdown-menu` - Dropdown menus
- `@radix-ui/react-progress` - Progress indicators
- `@radix-ui/react-separator` - Visual dividers
- `@radix-ui/react-switch` - Toggle switches
- `@radix-ui/react-toast` - Notification toasts

### **POWR UI Components (Built on Radix)**
- `Button` - All button variants with gym personality support
- `Card` - Container components optimized for workout content
- `Input` - Form inputs optimized for mobile gym use
- `Modal` - Dialog components using Radix Dialog
- `Progress` - Progress bars for workout tracking

### **Workout-Specific Components**
- `WorkoutCard` - Template and workout display cards
- `ExerciseInput` - Mobile-optimized exercise data entry
- `SetCounter` - Set completion tracking
- `WorkoutTimer` - Timer components for rest periods

## Implementation Rules

### 1. **Component-First Approach**
- **ALWAYS build POWR UI components** using Radix primitives
- Only use Radix primitives directly when building new POWR components
- Never bypass the POWR Design System for UI components

### 2. **White Label Theming Guidelines**
- Use gym personality variants in all components
- Implement CSS variable theming for complete customization
- Support zen, hardcore, corporate, and boutique gym personalities

### 3. **Installation Workflow**
When you need a new component:
1. Check if POWR UI has it: `src/components/powr-ui/`
2. If not, check Radix UI primitives: https://www.radix-ui.com/primitives
3. Install Radix primitive: `npm install @radix-ui/react-[primitive]`
4. Build POWR UI component using the primitive
5. Add gym personality and theming support

### 4. **Accessibility Priority**
- Radix UI primitives are built for accessibility (WCAG 2.1 AA)
- Always use semantic HTML through Radix primitives
- Maintain ARIA compliance that comes built-in
- Test with screen readers and keyboard navigation

### 5. **TypeScript Integration**
- All POWR UI components are fully typed
- Use Radix UI TypeScript interfaces as base
- Extend types for gym personality and theming variants

## Anti-Patterns to Avoid

### ❌ FORBIDDEN Patterns
```typescript
// DON'T: Use shadcn/ui components
import { Button } from "@/components/ui/button";

// DON'T: Build custom components without Radix primitives
const CustomDialog = ({ children }) => (
  <div className="fixed inset-0 bg-black/50">{children}</div>
);

// DON'T: Use non-POWR UI components for interface
import { Button } from "some-other-ui-library";

// DON'T: Override POWR UI styles heavily
<Button className="!bg-red-500 !text-white !border-none">
  Heavily Overridden
</Button>
```

### ✅ CORRECT Alternatives
```typescript
// DO: Use POWR UI components
import { Button } from "@/components/powr-ui/primitives/Button";

// DO: Use gym personality variants
<Button variant="primary" gymPersonality="hardcore">Delete</Button>

// DO: Use Tailwind for minor adjustments
<Button className="w-full mt-4">Submit</Button>

// DO: Build on Radix primitives for new components
import * as Dialog from '@radix-ui/react-dialog'
```

## Performance Considerations

### **Enterprise Stability Benefits**
- Radix UI primitives are mature and stable
- Direct npm updates without community dependency
- No shadcn/ui breaking changes to worry about
- Enterprise-grade reliability for paying customers

### **Bundle Size Optimization**
```typescript
// ✅ CORRECT: Import only needed Radix primitives
import * as Dialog from '@radix-ui/react-dialog'
import * as Progress from '@radix-ui/react-progress'

// ❌ AVOID: Importing entire libraries
import * as Radix from '@radix-ui/react'
```

### **Performance Best Practices**
- Use `React.memo()` for complex POWR UI component compositions
- Leverage Radix's built-in performance optimizations
- Monitor bundle size with Next.js bundle analyzer
- Optimize for mobile gym environments

## White Label Customization Guidelines

### **Gym Theme System**
```typescript
// ✅ CORRECT: Complete theming control
interface GymTheme {
  personality: 'zen' | 'hardcore' | 'corporate' | 'boutique'
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  typography: {
    fontFamily: string
    fontWeight: string
  }
  spacing: {
    borderRadius: string
    shadow: string
  }
}

const Button = ({ gymPersonality, ...props }) => {
  const theme = useGymTheme()
  
  return (
    <button
      className={cn(
        "base-button-styles",
        gymPersonality === 'hardcore' && "rounded-none shadow-2xl font-black uppercase",
        gymPersonality === 'zen' && "rounded-full shadow-none",
        // YOU control every style decision
      )}
      {...props}
    />
  )
}
```

### **Component Extension**
```typescript
// ✅ CORRECT: Extend POWR UI components for specific use cases
import { Button, ButtonProps } from "@/components/powr-ui/primitives/Button";
import { cn } from "@/lib/utils";

interface WorkoutButtonProps extends ButtonProps {
  workoutType?: 'strength' | 'cardio' | 'flexibility';
}

const WorkoutButton = ({ workoutType, className, ...props }: WorkoutButtonProps) => {
  return (
    <Button
      className={cn(
        workoutType === 'strength' && 'bg-blue-500 hover:bg-blue-600',
        workoutType === 'cardio' && 'bg-red-500 hover:bg-red-600',
        workoutType === 'flexibility' && 'bg-green-500 hover:bg-green-600',
        className
      )}
      {...props}
    />
  );
};
```

## Example Usage Patterns

### **Basic POWR UI Form**
```typescript
import { Button } from "@/components/powr-ui/primitives/Button"
import { Input } from "@/components/powr-ui/primitives/Input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/powr-ui/primitives/Card"

<Card>
  <CardHeader>
    <CardTitle>Workout Login</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <Input placeholder="Email" type="email" />
      <Button className="w-full" gymPersonality="hardcore">
        Start Training
      </Button>
    </div>
  </CardContent>
</Card>
```

### **Workout-Specific Components**
```typescript
import { WorkoutCard } from "@/components/powr-ui/workout/WorkoutCard"
import { ExerciseInput } from "@/components/powr-ui/workout/ExerciseInput"

<WorkoutCard
  workout={{
    id: "push-workout",
    name: "Push Day",
    exercises: 5,
    duration: 45,
    difficulty: "intermediate"
  }}
  onSelect={handleWorkoutSelect}
/>

<ExerciseInput
  exercise="Push-ups"
  setNumber={1}
  onComplete={handleSetComplete}
/>
```

### **Gym Theme Integration**
```typescript
import { GymThemeProvider, gymThemes } from "@/components/powr-ui/theming"

<GymThemeProvider theme={gymThemes.powerlifting}>
  <WorkoutApp />
</GymThemeProvider>

// Components automatically adapt to gym personality
// - Hardcore: Angular, bold, high contrast
// - Zen: Rounded, soft, calming colors
// - Corporate: Clean, professional, minimal
// - Boutique: Elegant, refined, premium feel
```

## Testing Guidelines

### **Component Testing**
```typescript
// ✅ CORRECT: Test POWR UI component integration
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/powr-ui/primitives/Button';

test('renders button with gym personality', () => {
  render(<Button gymPersonality="hardcore">Train Hard</Button>);
  expect(screen.getByRole('button')).toHaveClass('font-black');
});

test('button handles click events', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  
  fireEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### **Accessibility Testing**
```typescript
// ✅ CORRECT: Test Radix UI accessibility features
import { render, screen } from '@testing-library/react';
import { Modal } from '@/components/powr-ui/primitives/Modal';

test('modal is properly labeled and accessible', () => {
  render(
    <Modal open={true} title="Workout Complete">
      <p>Great job!</p>
    </Modal>
  );
  
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByRole('dialog')).toHaveAccessibleName('Workout Complete');
});
```

## Integration with Existing Rules

### **References to Other .clinerules**
- **Auto-formatter**: Follow `.clinerules/auto-formatter-imports.md` for import organization
- **Documentation**: Follow `.clinerules/documentation-maintenance.md` for component documentation
- **Task workflow**: Reference `.clinerules/task-creation-process.md` for UI feature tasks
- **Simple solutions**: Follow `.clinerules/simple-solutions-first.md` - build on proven Radix primitives

### **Compatibility with Project Architecture**
- **Tailwind CSS**: POWR UI is built on Tailwind for complete styling control
- **TypeScript**: Full type safety with all components and gym theming
- **Next.js**: Optimized for Next.js App Router and SSR
- **White Labeling**: Built-in gym personality and theming system

## Business Benefits

### **For White Labeling Business**
- **Complete Control**: Every pixel can be customized per gym
- **Enterprise Stability**: No community dependency risks
- **Gym Personalities**: Built-in theming for different gym types
- **Scalable Architecture**: Easy to add new gym themes and personalities

### **For Development Team**
- **Predictable Updates**: Direct Radix UI updates through npm
- **No Breaking Changes**: No shadcn/ui community dependency issues
- **Full Customization**: Build exactly what the business needs
- **Performance Optimized**: Mobile-first for gym environments

## When to Apply This Rule

### **Always Apply For:**
- Any new UI component development
- Form creation and input handling
- Modal dialogs and overlays
- Progress indicators and feedback
- Workout-specific interface components

### **Especially Important When:**
- Building white label features for different gyms
- Creating mobile-optimized workout interfaces
- Ensuring enterprise-grade stability for paying customers
- Maintaining accessibility compliance
- Working within performance requirements

### **Success Metrics:**
- Zero shadcn/ui dependencies in the project
- Complete gym theming system working
- Enterprise-grade component stability
- Mobile-optimized workout interfaces
- Accessibility compliance maintained

## Resources

### **Documentation**
- **Radix UI Primitives**: https://www.radix-ui.com/primitives
- **Tailwind CSS**: https://tailwindcss.com/docs
- **POWR UI Implementation**: `docs/tasks/ui-sprint-plan.md`

### **GitHub Repositories**
- **Radix UI**: https://github.com/radix-ui/primitives
- **Tailwind CSS**: https://github.com/tailwindlabs/tailwindcss

### **Architecture References**
- **Leonardo's Critique**: https://leonardomontini.dev/shadcn-ui-use-with-caution
- **Component Examples**: `src/components/powr-ui/`

## Project Integration

### **Current Setup**
- Works seamlessly with existing Tailwind CSS configuration
- Compatible with Next.js App Router and TypeScript setup
- Supports complete white labeling through gym themes
- Integrates with existing authentication and state management

### **Migration Strategy**
- Replace shadcn/ui components with POWR UI equivalents
- Maintain existing functionality while improving control
- Update component imports to use POWR UI paths
- Test white labeling capabilities with multiple gym themes

---

**Last Updated**: 2025-06-28
**Project**: POWR Workout PWA
**Environment**: Web Browser
**Architecture**: Enterprise-Grade White Label Platform
