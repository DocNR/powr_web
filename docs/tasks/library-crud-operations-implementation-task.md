# Library CRUD Operations Implementation Task

## Objective
Implement complete CRUD (Create, Read, Update, Delete) operations for user library management, enabling users to add and remove exercises and workout templates from their personal collections with professional UX and optimal performance.

## Current State Analysis

### ✅ What's Already Working
- **Service Layer**: Complete CRUD operations in `LibraryCollectionService`
  - `addToCollection()` - Fully implemented
  - `removeFromCollection()` - Fully implemented
  - `createCollection()` - Auto-creation working
  - `getUserCollection()` - Working with cache optimization
- **UI Components**: 90% complete with placeholder buttons
  - `ExerciseLibrary.tsx` - Search, filtering, sorting, display
  - `WorkoutLibrary.tsx` - Search, filtering, sorting, display
  - Professional loading/error states
  - Responsive grid layouts
- **Data Layer**: Optimized with LibraryDataProvider
  - 70%+ network request reduction
  - Sub-100ms cache performance
  - Automatic refresh on changes
- **Architecture**: NDK-first with NIP-51 collections
  - Universal NDK caching integration
  - Proven patterns from Active Workout CRUD

### 🎯 What Needs Implementation
- Connect existing "Add Exercise/Workout" buttons to service layer
- Implement remove functionality with confirmation dialogs
- Add toast notifications for user feedback
- Enhance menu actions for library management
- Add bulk operations (optional enhancement)

## Technical Approach

### Architecture Compliance
- **Service Layer**: Use existing `libraryManagementService` facade
- **NDK-First**: All operations through NDK cache with optimistic updates
- **NIP-51**: Standard collection format (Kind 30003 events)
- **POWR UI**: Radix primitives + Tailwind for consistent styling
- **Simple Solutions First**: Build on existing proven patterns

### Core Implementation Pattern
```typescript
// Standard pattern for all CRUD operations
const handleLibraryAction = async (action: 'add' | 'remove', itemRef: string) => {
  try {
    // Optimistic UI update
    setIsLoading(true);
    
    // Service layer operation
    if (action === 'add') {
      await libraryManagementService.addToLibraryCollection(
        userPubkey, 
        collectionType, 
        itemRef
      );
    } else {
      await libraryManagementService.removeFromLibraryCollection(
        userPubkey, 
        collectionType, 
        itemRef
      );
    }
    
    // Success feedback
    showToast(`${action === 'add' ? 'Added to' : 'Removed from'} library`, 'success');
    
    // Data refresh (automatic via LibraryDataProvider)
  } catch (error) {
    // Error feedback
    showToast(`Failed to ${action} item`, 'error');
    console.error(`Library ${action} error:`, error);
  } finally {
    setIsLoading(false);
  }
};
```

## Implementation Steps

### Phase 1: Exercise Library CRUD (Day 1)

#### 1.1 Add Toast Notification System
- [ ] Install/configure toast library (or use existing Radix Toast)
- [ ] Create `useToast` hook for consistent notifications
- [ ] Add toast container to app layout

#### 1.2 Implement Add Exercise Functionality
- [ ] Connect "Add Exercise" button in `ExerciseLibrary.tsx`
- [ ] Add exercise discovery integration (from search/browse)
- [ ] Implement optimistic updates with loading states
- [ ] Add success/error toast notifications

#### 1.3 Implement Remove Exercise Functionality
- [ ] Add remove button to exercise cards (hover/menu action)
- [ ] Create confirmation dialog component
- [ ] Implement remove operation with service integration
- [ ] Add undo functionality (optional)

#### 1.4 Enhance Exercise Menu Actions
- [ ] Update `ExerciseMenuDropdown` with library actions
- [ ] Add "Add to Library" / "Remove from Library" options
- [ ] Implement context-aware menu (show appropriate actions)

### Phase 2: Workout Library CRUD (Day 2)

#### 2.1 Implement Add Workout Functionality
- [ ] Connect "Add Workout" button in `WorkoutLibrary.tsx`
- [ ] Add workout template discovery integration
- [ ] Implement optimistic updates with loading states
- [ ] Add success/error toast notifications

#### 2.2 Implement Remove Workout Functionality
- [ ] Enhance existing remove placeholder in `WorkoutCard`
- [ ] Create workout-specific confirmation dialog
- [ ] Implement remove operation with service integration
- [ ] Add bulk remove functionality (select multiple)

#### 2.3 Enhance Workout Menu Actions
- [ ] Add comprehensive menu actions (remove, share, copy, details)
- [ ] Implement context-aware menu states
- [ ] Add keyboard shortcuts for power users

### Phase 3: Polish & Enhancement (Day 3)

#### 3.1 User Experience Enhancements
- [ ] Add loading skeletons for better perceived performance
- [ ] Implement swipe actions for mobile (optional)
- [ ] Add keyboard navigation support
- [ ] Enhance empty states with actionable suggestions

#### 3.2 Bulk Operations
- [ ] Add multi-select functionality for exercises/workouts
- [ ] Implement bulk add/remove operations
- [ ] Add "Select All" / "Clear Selection" actions
- [ ] Create bulk action confirmation dialogs

#### 3.3 Integration Testing
- [ ] Test add/remove operations across all collection types
- [ ] Verify cache performance and automatic refresh
- [ ] Test error scenarios and recovery
- [ ] Validate NIP-51 event publishing

## Success Criteria

### Functional Requirements (80% minimum)
- [ ] **Add Operations**: Users can add exercises/workouts to personal library
- [ ] **Remove Operations**: Users can remove items with confirmation
- [ ] **Visual Feedback**: Toast notifications for all operations
- [ ] **Error Handling**: Graceful error states with retry options
- [ ] **Performance**: Operations complete in <500ms with optimistic updates
- [ ] **Data Integrity**: All operations properly update NIP-51 collections

### User Experience Requirements
- [ ] **Intuitive Interface**: Clear add/remove buttons with consistent iconography
- [ ] **Mobile Optimization**: Touch-friendly targets (44px+) and responsive design
- [ ] **Loading States**: Professional loading indicators during operations
- [ ] **Confirmation Dialogs**: Prevent accidental deletions with clear confirmations
- [ ] **Accessibility**: Proper ARIA labels and keyboard navigation

### Technical Requirements
- [ ] **Service Integration**: All operations use existing `libraryManagementService`
- [ ] **NDK Compliance**: Proper NIP-51 event publishing and caching
- [ ] **Error Recovery**: Robust error handling with user-friendly messages
- [ ] **Performance**: Leverage existing 70%+ cache optimization
- [ ] **Code Quality**: Follow established patterns from Active Workout CRUD

## Implementation Details

### Toast Notification System
```typescript
// useToast hook implementation
export const useToast = () => {
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    // Implementation using Radix Toast or similar
  };
  
  return { showToast };
};
```

### Confirmation Dialog Component
```typescript
// ConfirmationDialog.tsx
interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'default';
}
```

### Enhanced Menu Actions
```typescript
// Library-aware menu actions
const getMenuActions = (item: ExerciseLibraryItem | WorkoutLibraryItem, isInLibrary: boolean) => [
  {
    label: isInLibrary ? 'Remove from Library' : 'Add to Library',
    icon: isInLibrary ? Trash2 : Plus,
    action: isInLibrary ? 'remove' : 'add',
    variant: isInLibrary ? 'destructive' : 'default'
  },
  { label: 'View Details', icon: Eye, action: 'details' },
  { label: 'Share', icon: Share, action: 'share' },
  { label: 'Copy Link', icon: Copy, action: 'copy' }
];
```

## Risk Assessment

### Low Risk
- **Service Layer**: Already implemented and tested
- **UI Components**: 90% complete, minimal changes needed
- **Data Provider**: Proven performance with automatic refresh

### Medium Risk
- **Toast Integration**: May need library selection/configuration
- **Mobile UX**: Touch interactions need careful testing
- **Bulk Operations**: Additional complexity for multi-select

### Mitigation Strategies
- **Incremental Implementation**: Phase 1 & 2 provide core value
- **Existing Patterns**: Follow proven Active Workout CRUD patterns
- **Fallback Options**: Graceful degradation for failed operations
- **Testing Strategy**: Manual testing with real Nostr events

## Timeline Estimate

**Total: 2-3 days maximum**

- **Day 1 (6-8 hours)**: Exercise Library CRUD + Toast system
- **Day 2 (6-8 hours)**: Workout Library CRUD + Menu enhancements  
- **Day 3 (4-6 hours)**: Polish, bulk operations, testing

**Confidence Level**: Very High (90%+)
- Service layer complete and tested
- UI components 90% ready
- Proven patterns from existing CRUD implementations
- Clear, incremental implementation path

## References

### Related Files
- `src/lib/services/libraryManagement.ts` - Service facade
- `src/lib/services/libraryCollectionService.ts` - Core CRUD operations
- `src/components/library/ExerciseLibrary.tsx` - Exercise UI component
- `src/components/library/WorkoutLibrary.tsx` - Workout UI component
- `src/providers/LibraryDataProvider.tsx` - Data management
- `src/components/powr-ui/workout/ExerciseMenuDropdown.tsx` - Menu actions

### .clinerules Compliance
- **simple-solutions-first.md**: Building on existing foundation
- **service-layer-architecture.md**: Using established service patterns
- **radix-ui-component-library.md**: POWR UI component standards
- **ndk-best-practices.md**: NDK-first architecture patterns
- **task-creation-process.md**: Standardized task format

### Architecture Validation
- **NDK-First**: All persistence through NDK cache
- **Events as Data**: NIP-51 collections as single source of truth
- **Service Layer**: Pure business logic with NDK operations
- **React Patterns**: Provider-based data management
- **Golf App Migration**: Patterns proven for React Native transfer

---

**Created**: August 8, 2025
**Estimated Completion**: August 11, 2025
**Priority**: High - Immediate user value with minimal complexity
**Dependencies**: None - all prerequisites complete
