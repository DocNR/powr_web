# Full-Screen PWA Auto-Hiding Header Implementation - Kickoff Prompt

## Task Summary
Implement an auto-hiding header with progressive transparency and semi-transparent bottom navigation for the POWR Workout PWA. This creates a modern mobile UX pattern (like Instagram/Twitter/YouTube) that maximizes content visibility during scrolling by combining slide animations with fade effects for a polished native app feel.

## Key Technical Approach
- **Simple CSS transforms + opacity** for GPU-accelerated animations
- **Custom useScrollDirection hook** with passive scroll listeners
- **Progressive transparency** - header slides + fades simultaneously
- **Smart state logic** - only trigger on active scroll, maintain state when stopped
- **Performance-first** - 300ms transitions with requestAnimationFrame

## Primary Goal
Create an immersive full-screen PWA experience that feels like a native mobile app while maintaining all existing functionality and accessibility standards.

## Key Files to Review
1. **Task Document**: `docs/tasks/full-screen-pwa-auto-hiding-header-implementation-task.md`
2. **Current Layout**: `src/components/layout/AppLayout.tsx` - Main integration point
3. **Header Component**: `src/components/powr-ui/layout/AppHeader.tsx` - Needs scroll classes
4. **Bottom Navigation**: `src/components/navigation/MobileBottomTabs.tsx` - Transparency logic
5. **Current Styles**: `src/app/globals.css` - Add new CSS classes

## Relevant .clinerules
- **`.clinerules/simple-solutions-first.md`** - Ensures we don't over-engineer
- **`.clinerules/task-creation-process.md`** - Task structure and workflow
- **`.clinerules/radix-ui-component-library.md`** - UI component standards

## Starting Point
1. **Create the useScrollDirection hook** in `src/hooks/useScrollDirection.ts`
2. **Add CSS classes** to `src/app/globals.css` for header/nav transitions
3. **Integrate scroll behavior** into `src/components/layout/AppLayout.tsx`

## Dependencies to Check
- Existing `useMediaQuery` hook pattern in `src/hooks/useMediaQuery.ts`
- Current mobile layout structure in AppLayout.tsx
- Existing PWA optimizations in globals.css
- Fixed positioning and z-index hierarchy

## Success Validation
- Header gracefully dissolves away (slide + fade) when scrolling down
- Header smoothly reappears when scrolling up
- Bottom navigation becomes transparent during content viewing
- No performance impact or scroll lag
- Works consistently across iOS Safari and Android Chrome
