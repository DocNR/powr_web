# Auto-Formatter Imports Rule

## Brief overview
This rule establishes a workflow for handling auto-formatter behavior with imports to prevent TypeScript errors when adding new components or functionality.

## The Problem
When adding imports to React/TypeScript files, auto-formatters (like Prettier or ESLint) often remove unused imports during the save process. This creates a chicken-and-egg problem:
1. Add imports first → Auto-formatter removes them because they're not used yet
2. Add code first → TypeScript errors because imports are missing

## The Solution Workflow
Follow this specific order when adding new components or functionality:

### Step 1: Add State Variables First
Add any new state variables, props, or other JavaScript/TypeScript declarations that will reference the new imports.

```typescript
// Add state for new functionality
const [showNewComponent, setShowNewComponent] = useState(false);
```

### Step 2: Add JSX/Component Usage
Add the JSX code or component usage that references the imports.

```tsx
{showNewComponent && (
  <div className="test-container">
    <NewComponent />
  </div>
)}
```

### Step 3: Add Imports Last
Only after the code is using the imports, add the import statements.

```typescript
import NewComponent from '@/components/NewComponent';
```

## Why This Works
- Auto-formatters only remove imports that are not referenced in the code
- By adding the usage first, the imports become "needed" when they're added
- This prevents the auto-formatter from removing them on save

## Example Implementation
```typescript
// ❌ WRONG ORDER - Import will be removed
import NewComponent from '@/components/NewComponent';
// ... (no usage yet)

// ✅ CORRECT ORDER
// 1. Add state
const [showNewComponent, setShowNewComponent] = useState(false);

// 2. Add JSX usage
{showNewComponent && <NewComponent />}

// 3. Add import (now it won't be removed)
import NewComponent from '@/components/NewComponent';
```

## Additional Tips
- If you must add imports first, add a temporary usage comment: `// TODO: NewComponent usage`
- Consider disabling auto-format-on-save temporarily for complex additions
- Use multiple small SEARCH/REPLACE operations rather than large ones to minimize conflicts

## When to Apply This Rule
- Adding new React components to existing files
- Adding new utilities or hooks that aren't immediately used
- Any situation where imports need to be added before their usage is complete
- Large files where auto-formatter behavior is unpredictable

---

**Last Updated**: 2025-06-21
**Project**: POWR Workout PWA
**Environment**: Web Browser
