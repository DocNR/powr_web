# Full-Screen PWA Auto-Hiding Header Implementation Task

## Objective
Implement an auto-hiding header with progressive transparency and semi-transparent bottom navigation for the POWR Workout PWA, creating a modern mobile UX pattern similar to Instagram, Twitter, and YouTube that maximizes content visibility during scrolling.

## Current State Analysis
- **AppLayout.tsx** currently uses fixed positioning for header (`fixed top-0 left-0 right-0 z-40`)
- **MobileBottomTabs.tsx** has solid background with backdrop blur (`bg-background/80 backdrop-blur-md`)
- **AppHeader.tsx** is always visible with consistent height (48px mobile, 64px desktop)
- **Main content** has proper padding calculations for fixed headers
- **Existing PWA optimizations** in globals.css include touch-action, safe areas, and scroll behavior
- **No existing scroll direction detection** - need to create custom hook

## Technical Approach
Following `.clinerules/simple-solutions-first.md` principles, this implementation uses:
- **Simple CSS transforms and opacity** (GPU-accelerated properties)
- **Custom React hook** for scroll direction detection with passive listeners
- **Minimal state management** - only track scroll direction and position
- **Progressive enhancement** - maintains existing functionality if JavaScript fails
- **Performance-first** - uses `requestAnimationFrame` and passive event listeners

## Implementation Steps

### 1. Create useScrollDirection Hook
- [ ] Create `src/hooks/useScrollDirection.ts`
- [ ] Implement scroll direction detection with 10px threshold
- [ ] Use passive event listeners for performance
- [ ] Return `{ isScrollingDown, isScrollingUp, isAtTop }` state
- [ ] Handle cleanup and memory management

### 2. Add CSS Classes to globals.css
- [ ] Add header visibility classes with combined transform + opacity transitions
- [ ] Add bottom navigation transparency classes with backdrop-filter
- [ ] Use 300ms ease-in-out transitions for smooth animations
- [ ] Include `will-change: transform, opacity` for performance
- [ ] Add reduced motion media query support

### 3. Integrate Scroll Behavior into AppLayout
- [ ] Import and use `useScrollDirection` hook in AppLayout.tsx
- [ ] Apply scroll-responsive classes to header container
- [ ] Maintain existing padding calculations for content
- [ ] Ensure desktop layout remains unchanged
- [ ] Test with existing sub-navigation positioning

### 4. Update Header Component
- [ ] Add scroll-responsive class names to AppHeader.tsx
- [ ] Ensure header content remains accessible during transitions
- [ ] Maintain existing functionality (user menu, search, etc.)
- [ ] Test header interactions during scroll animations

### 5. Update Bottom Navigation
- [ ] Add transparency logic to MobileBottomTabs.tsx
- [ ] Implement glass effect with backdrop-filter when transparent
- [ ] Maintain icon visibility with proper contrast
- [ ] Ensure touch targets remain accessible

### 6. Mobile-Specific Optimizations
- [ ] Handle iOS momentum scrolling properly
- [ ] Test with safe area insets on notched devices
- [ ] Ensure accessibility with proper ARIA states
- [ ] Add landscape orientation handling

## Success Criteria
- [ ] **Header slides up and fades out** when user scrolls down (swiping up gesture)
- [ ] **Header slides down and fades in** when user scrolls up (swiping down gesture)
- [ ] **Bottom navigation becomes transparent** when scrolling down
- [ ] **Bottom navigation returns to solid** only when scrolling up
- [ ] **Smooth 300ms transitions** for all animations
- [ ] **Header stays visible and solid** when at the very top of the page
- [ ] **No jitter or false triggers** - only activates after 10+ pixels of scroll
- [ ] **Performance maintained** - no scroll lag or frame drops
- [ ] **Accessibility preserved** - all interactive elements remain accessible
- [ ] **Works across all mobile devices** including iOS and Android
- [ ] **Graceful degradation** - app remains functional if JavaScript fails

## Technical Implementation Details

### useScrollDirection Hook Interface
```typescript
interface UseScrollDirectionOptions {
  threshold?: number; // Default: 10px
  target?: HTMLElement | null; // Default: window
}

interface UseScrollDirectionReturn {
  isScrollingDown: boolean;
  isScrollingUp: boolean;
  isAtTop: boolean;
  scrollY: number;
}
```

### CSS Classes Structure
```css
/* Header visibility with combined transitions */
.header-visible { 
  transform: translateY(0); 
  opacity: 1;
}
.header-hidden { 
  transform: translateY(-100%); 
  opacity: 0;
}
.header-transition {
  transition: transform 300ms ease-in-out, opacity 300ms ease-in-out;
  will-change: transform, opacity;
}

/* Bottom navigation transparency */
.nav-solid { 
  background: rgba(var(--background-rgb), 0.8);
  backdrop-filter: blur(12px);
}
.nav-transparent { 
  background: rgba(var(--background-rgb), 0.1);
  backdrop-filter: blur(10px);
}
.nav-transition {
  transition: background-color 300ms ease-in-out, backdrop-filter 300ms ease-in-out;
}
```

### Integration Logic
```typescript
const { isScrollingDown, isScrollingUp, isAtTop } = useScrollDirection({ threshold: 10 });

// Header visibility AND opacity
const headerVisible = isAtTop || isScrollingUp;
const headerClasses = `header-transition ${headerVisible ? 'header-visible' : 'header-hidden'}`;

// Bottom nav transparency (maintain state when scrolling stops)
const [wasTransparent, setWasTransparent] = useState(false);
useEffect(() => {
  if (isScrollingDown && !isAtTop) setWasTransparent(true);
  if (isScrollingUp || isAtTop) setWasTransparent(false);
}, [isScrollingDown, isScrollingUp, isAtTop]);

const navTransparent = !isAtTop && (isScrollingDown || wasTransparent);
const navClasses = `nav-transition ${navTransparent ? 'nav-transparent' : 'nav-solid'}`;
```

## Performance Considerations
- **GPU-accelerated properties only** - transform and opacity
- **Passive scroll listeners** to avoid blocking main thread
- **RequestAnimationFrame** for smooth animations
- **Debounced state updates** to prevent excessive re-renders
- **Will-change CSS property** for elements that will animate
- **Cleanup event listeners** in useEffect cleanup

## Mobile-Specific Requirements
- **iOS momentum scrolling** - handle overscroll behavior
- **Touch interactions** - ensure gestures don't interfere with scroll detection
- **Safe area insets** - maintain proper spacing on notched devices
- **Reduced motion** - respect user's accessibility preferences
- **Landscape handling** - adjust behavior for landscape orientation

## Testing Checklist
- [ ] **Scroll down** → Header slides up + fades out, bottom nav transparent
- [ ] **Scroll up** → Header slides down + fades in, bottom nav solid
- [ ] **Scroll stop** → Maintain current state (don't change transparency)
- [ ] **At top** → Header visible + opaque, bottom nav solid
- [ ] **Fast scrolling** → Smooth animations without lag
- [ ] **Slow scrolling** → Proper threshold detection (10px)
- [ ] **iOS Safari** → No bounce scroll interference
- [ ] **Android Chrome** → Consistent behavior
- [ ] **Landscape mode** → Appropriate adjustments
- [ ] **Accessibility** → Screen reader compatibility
- [ ] **Performance** → No frame drops during scroll

## References
- **Current Layout**: `src/components/layout/AppLayout.tsx`
- **Header Component**: `src/components/powr-ui/layout/AppHeader.tsx`
- **Bottom Navigation**: `src/components/navigation/MobileBottomTabs.tsx`
- **Existing Styles**: `src/app/globals.css`
- **Existing Hooks**: `src/hooks/useMediaQuery.ts` (reference pattern)
- **Simple Solutions Rule**: `.clinerules/simple-solutions-first.md`
- **Task Creation Process**: `.clinerules/task-creation-process.md`

## Architecture Validation
This implementation validates:
- **PWA UX patterns** - Modern mobile app behavior
- **Performance optimization** - GPU-accelerated animations
- **Accessibility compliance** - Maintains usability standards
- **Cross-platform compatibility** - Works on iOS and Android
- **Simple solution approach** - Minimal complexity, maximum impact

## Golf App Migration Notes
This scroll behavior pattern will transfer directly to React Native:
- **useScrollDirection hook** can be adapted for React Native ScrollView
- **Animation patterns** translate to React Native Animated API
- **State management logic** remains identical
- **Performance optimizations** apply to mobile native apps
- **Accessibility patterns** transfer to React Native accessibility props

---

**Created**: 2025-08-05
**Project**: POWR Workout PWA
**Environment**: Web Browser PWA
**Complexity**: Medium (UI Enhancement)
**Estimated Time**: 4-6 hours
