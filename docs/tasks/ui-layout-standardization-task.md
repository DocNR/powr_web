# UI Layout Standardization Task

## Objective
Standardize tab layout patterns across the POWR Workout PWA to ensure consistent user experience and maintainable code architecture while preserving the unique UX requirements of different content types.

## Current State Analysis
During the horizontal scrolling fix investigation, we discovered that different tabs use different layout patterns:

### Existing Layout Patterns
1. **SocialTab**: Uses edge-to-edge feed pattern (`-mx-4`) for immersive social content
2. **LibraryTab**: Uses padded content pattern (`p-4 space-y-6`) for browsing/searching
3. **WorkoutsTab**: Currently minimal test content - needs proper layout when implemented

### Why Different Layouts Exist
- **SocialTab**: Needs Twitter/X-like edge-to-edge content for social feeds
- **LibraryTab**: Needs padded content areas for readability and focus
- **WorkoutsTab**: Will likely need hybrid approach (calendar edge-to-edge, cards padded)

## Technical Approach

### Phase 1: Create Semantic Layout Components
Create standardized layout wrapper components that preserve UX while ensuring consistency:

```typescript
// Standard tab layout components
<FeedLayout>        // For social feeds (edge-to-edge)
<ContentLayout>     // For standard content (padded)
<WorkoutLayout>     // For workout-specific needs (hybrid)
```

### Phase 2: Define Layout Pattern Standards
Establish 3 core patterns that tabs can choose from:

1. **Feed Pattern**: `<div className="-mx-4">` - Edge-to-edge content for social feeds
2. **Content Pattern**: `<div className="p-4 space-y-6">` - Padded content for browsing
3. **Hybrid Pattern**: Mix of both for complex layouts like workout tracking

### Phase 3: Create Layout Wrapper Components
```typescript
// src/components/powr-ui/layout/FeedLayout.tsx
export function FeedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4">
      {children}
    </div>
  );
}

// src/components/powr-ui/layout/ContentLayout.tsx
export function ContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 space-y-6">
      {children}
    </div>
  );
}

// src/components/powr-ui/layout/WorkoutLayout.tsx
export function WorkoutLayout({ 
  calendar, 
  content 
}: { 
  calendar?: React.ReactNode;
  content: React.ReactNode;
}) {
  return (
    <div>
      {calendar && (
        <div className="-mx-4 mb-4">
          {calendar}
        </div>
      )}
      <div className="p-4 space-y-6">
        {content}
      </div>
    </div>
  );
}
```

## Implementation Steps

### Step 1: Create Layout Components (1-2 hours)
1. [ ] Create `src/components/powr-ui/layout/FeedLayout.tsx`
2. [ ] Create `src/components/powr-ui/layout/ContentLayout.tsx`
3. [ ] Create `src/components/powr-ui/layout/WorkoutLayout.tsx`
4. [ ] Export from `src/components/powr-ui/layout/index.ts`

### Step 2: Update Existing Tabs (2-3 hours)
1. [ ] Migrate SocialTab to use `<FeedLayout>`
2. [ ] Migrate LibraryTab to use `<ContentLayout>`
3. [ ] Test that existing functionality is preserved
4. [ ] Verify responsive behavior remains intact

### Step 3: Documentation and Guidelines (1 hour)
1. [ ] Document when to use each layout pattern
2. [ ] Add examples to component documentation
3. [ ] Update design system guidelines
4. [ ] Create usage examples for future tabs

### Step 4: Future Tab Implementation (ongoing)
1. [ ] Use `<WorkoutLayout>` when implementing real WorkoutsTab content
2. [ ] Apply appropriate layout patterns to new tabs
3. [ ] Maintain consistency across all tab implementations

## Success Criteria
- [ ] All tabs use standardized layout wrapper components
- [ ] Existing UX patterns are preserved (social feed vs content browsing)
- [ ] New tabs can easily choose appropriate layout pattern
- [ ] Documentation clearly explains when to use each pattern
- [ ] No regression in responsive behavior
- [ ] Code is more maintainable and consistent

## References
- **Current Working Tabs**: `src/components/tabs/SocialTab.tsx`, `src/components/tabs/LibraryTab.tsx`
- **Layout Architecture**: `src/components/layout/AppLayout.tsx`
- **UI Component Standards**: `.clinerules/radix-ui-component-library.md`
- **Horizontal Scrolling Fix**: `docs/tasks/horizontal-scrolling-fix-task.md`

## Design System Integration
This task aligns with the POWR Design System goals:
- **Consistency**: Standardized layout patterns across tabs
- **Flexibility**: Different patterns for different UX needs
- **Maintainability**: Reusable layout components
- **White Label Support**: Layout components support theming

## Future Considerations
- **Mobile Optimization**: Ensure all layout patterns work well on mobile
- **Accessibility**: Maintain proper focus management and screen reader support
- **Performance**: Layout components should not impact rendering performance
- **Extensibility**: Easy to add new layout patterns as needed

---

**Estimated Time**: 4-6 hours total
**Priority**: Medium (improves maintainability but not blocking)
**Dependencies**: None (can be implemented independently)
**Related Tasks**: UI component standardization, design system development
