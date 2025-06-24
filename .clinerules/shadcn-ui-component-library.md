# shadcn/ui Component Library Rule

## Brief overview
This rule establishes shadcn/ui as the primary component library for the POWR Workout PWA, ensuring consistent UI patterns, accessibility compliance, and optimal performance through standardized component usage.

## Core Principles

### Primary UI Component Library
**ALWAYS use shadcn/ui components** from https://ui.shadcn.com/docs/components for building user interfaces.

### Installation Pattern
When using new shadcn/ui components, follow this pattern:
```bash
npx shadcn@latest add [component-name]
```

### Component Import Convention
Always import shadcn/ui components from the designated path:
```typescript
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
```

## Available Core Components

### Layout & Structure
- `Card` - Primary container component
- `Separator` - Visual dividers
- `Tabs` - Tabbed interfaces
- `Sheet` - Slide-over panels
- `Dialog` - Modal dialogs

### Forms & Input
- `Button` - All button variants
- `Input` - Text inputs
- `Label` - Form labels  
- `Select` - Dropdown selectors
- `Switch` - Toggle switches
- `Checkbox` - Checkboxes
- `RadioGroup` - Radio button groups
- `Form` - Form wrapper with validation

### Navigation
- `DropdownMenu` - Dropdown menus
- `NavigationMenu` - Main navigation
- `Breadcrumb` - Breadcrumb navigation
- `Pagination` - Page navigation

### Feedback & Display
- `Toast` - Notification toasts
- `Alert` - Alert messages
- `Badge` - Status badges
- `Progress` - Progress indicators
- `Skeleton` - Loading placeholders
- `Avatar` - User avatars

### Data Display
- `Table` - Data tables
- `Accordion` - Collapsible content
- `HoverCard` - Hover overlays
- `Tooltip` - Contextual tooltips

## Implementation Rules

### 1. Component-First Approach
- **ALWAYS check shadcn/ui first** before building custom components
- Only create custom components when shadcn/ui doesn't have a suitable option
- Extend shadcn/ui components rather than replacing them

### 2. Styling Guidelines
- Use shadcn/ui's built-in variants and sizes
- Extend with additional Tailwind classes when needed
- Maintain consistent design system through shadcn/ui's theme

### 3. Installation Workflow
When you need a new component:
1. Check if shadcn/ui has it: https://ui.shadcn.com/docs/components
2. Install with: `npx shadcn@latest add [component-name]`
3. Import from `@/components/ui/[component-name]`
4. Use according to documented patterns

### 4. Accessibility Priority
- shadcn/ui components are built on Radix UI primitives (fully accessible)
- Always use semantic HTML through these components
- Maintain ARIA compliance that comes built-in

### 5. TypeScript Integration
- All shadcn/ui components are fully typed
- Use provided TypeScript interfaces
- Extend types when creating custom variants

## Anti-Patterns to Avoid

### ❌ FORBIDDEN Patterns
```typescript
// DON'T: Build custom components when shadcn/ui exists
const CustomButton = ({ children, onClick }) => (
  <div className="custom-button" onClick={onClick}>{children}</div>
);

// DON'T: Import from wrong paths
import { Button } from "some-other-ui-library";
import { Button } from "../custom/button";

// DON'T: Override core shadcn/ui styles heavily
<Button className="!bg-red-500 !text-white !border-none">
  Heavily Overridden
</Button>

// DON'T: Import entire libraries
import * as UI from "@/components/ui";
```

### ✅ CORRECT Alternatives
```typescript
// DO: Use shadcn/ui components
import { Button } from "@/components/ui/button";

// DO: Extend with variants when needed
<Button variant="destructive" size="lg">Delete</Button>

// DO: Use Tailwind for minor adjustments
<Button className="w-full mt-4">Submit</Button>

// DO: Import only needed components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
```

## Performance Considerations

### Tree-Shaking Benefits
- shadcn/ui components are designed for optimal tree-shaking
- Only import what you use to minimize bundle size
- Radix UI primitives are lightweight and performant

### Bundle Size Monitoring
```typescript
// ✅ CORRECT: Import only needed components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// ❌ AVOID: Importing entire libraries
import * as UI from "@/components/ui";
```

### Performance Best Practices
- Use `React.memo()` for complex shadcn/ui component compositions
- Leverage built-in lazy loading for heavy components like `Table`
- Monitor bundle size with Next.js bundle analyzer

## Customization Guidelines

### Theme Customization
- Modify `tailwind.config.ts` for global theme changes
- Use CSS variables in `globals.css` for color schemes
- Extend component variants through the `cn()` utility

### Component Extension
```typescript
// ✅ CORRECT: Extend shadcn/ui components
import { Button, ButtonProps } from "@/components/ui/button";
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

### Variant Creation
```typescript
// ✅ CORRECT: Create new variants using cva
import { cva, type VariantProps } from "class-variance-authority";

const workoutCardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      workoutType: {
        strength: "border-blue-200 bg-blue-50",
        cardio: "border-red-200 bg-red-50",
        flexibility: "border-green-200 bg-green-50",
      },
      size: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
      },
    },
    defaultVariants: {
      workoutType: "strength",
      size: "default",
    },
  }
);
```

## Example Usage Patterns

### Basic Form
```typescript
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Login</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" />
      </div>
      <Button className="w-full">Sign In</Button>
    </div>
  </CardContent>
</Card>
```

### Data Display
```typescript
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Workout</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Morning Run</TableCell>
      <TableCell><Badge variant="success">Complete</Badge></TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Complex Form with Validation
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  workoutName: z.string().min(2, "Workout name must be at least 2 characters"),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
});

const WorkoutForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workoutName: "",
      duration: 0,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="workoutName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workout Name</FormLabel>
              <FormControl>
                <Input placeholder="Morning Run" {...field} />
              </FormControl>
              <FormDescription>
                Give your workout a memorable name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Create Workout</Button>
      </form>
    </Form>
  );
};
```

## Testing Guidelines

### Component Testing
```typescript
// ✅ CORRECT: Test shadcn/ui component integration
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

test('renders button with correct variant', () => {
  render(<Button variant="destructive">Delete</Button>);
  expect(screen.getByRole('button')).toHaveClass('bg-destructive');
});

test('button handles click events', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  
  fireEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Accessibility Testing
```typescript
// ✅ CORRECT: Test accessibility features
import { render, screen } from '@testing-library/react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

test('form controls are properly labeled', () => {
  render(
    <>
      <Label htmlFor="email">Email Address</Label>
      <Input id="email" type="email" />
    </>
  );
  
  expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
});
```

## Integration with Existing Rules

### References to Other .clinerules
- **Auto-formatter**: Follow `.clinerules/auto-formatter-imports.md` for import organization
- **Documentation**: Follow `.clinerules/documentation-maintenance.md` for component documentation
- **Task workflow**: Reference `.clinerules/task-creation-process.md` for UI feature tasks
- **Simple solutions**: Follow `.clinerules/simple-solutions-first.md` - use shadcn/ui before building custom

### Compatibility with Project Architecture
- **Tailwind CSS**: shadcn/ui is built on Tailwind and integrates seamlessly
- **TypeScript**: Full type safety with all components
- **Next.js**: Optimized for Next.js App Router and SSR
- **Dark mode**: Built-in dark mode support through CSS variables

## Exceptions

Only deviate from shadcn/ui when:
- Component doesn't exist in shadcn/ui library
- Highly specialized domain-specific components needed (workout timers, exercise form validators)
- Performance-critical custom implementations required
- Third-party integrations that require specific component structures

### Exception Documentation
When creating custom components, document:
```typescript
/**
 * Custom WorkoutTimer component
 * 
 * @reason shadcn/ui doesn't have a specialized workout timer
 * @alternatives Considered using Progress + custom logic, but performance requirements needed custom implementation
 * @accessibility Implements ARIA live regions for screen readers
 */
const WorkoutTimer = ({ duration, onComplete }: WorkoutTimerProps) => {
  // Custom implementation
};
```

## When to Apply This Rule

### Always Apply For:
- Any new UI component development
- Form creation and input handling
- Data display and layout components
- Navigation and feedback elements
- Modal dialogs and overlays
- Loading states and progress indicators

### Especially Important When:
- Building user-facing features
- Creating reusable component patterns
- Ensuring accessibility compliance
- Maintaining design system consistency
- Working within the 10-day MVP timeline
- Onboarding new developers to the project

### Success Metrics:
- Zero custom UI components that duplicate shadcn/ui functionality
- Consistent visual design across all features
- Accessibility compliance through Radix UI primitives
- Faster development velocity with proven components
- Smaller bundle sizes through tree-shaking optimization

## Resources

### Documentation
- **shadcn/ui Components**: https://ui.shadcn.com/docs/components
- **Radix UI Primitives**: https://www.radix-ui.com/primitives
- **Tailwind CSS**: https://tailwindcss.com/docs

### GitHub Repositories
- **shadcn/ui**: https://github.com/shadcn-ui/ui
- **Radix UI**: https://github.com/radix-ui/primitives

### Examples and Inspiration
- **shadcn/ui Examples**: https://ui.shadcn.com/examples
- **Component Storybook**: Available in shadcn/ui documentation

## Project Integration

### Current Setup
- Works seamlessly with existing Tailwind CSS configuration
- Compatible with Next.js App Router and TypeScript setup
- Supports dark mode out of the box through CSS variables
- Integrates with existing authentication and state management

### Migration Strategy
- Gradually replace custom UI components with shadcn/ui equivalents
- Maintain existing functionality while improving consistency
- Update component imports to use shadcn/ui paths
- Test accessibility improvements with screen readers

---

**Last Updated**: 2025-06-23
**Project**: POWR Workout PWA
**Environment**: Web Browser
