# NIP-92 Media Attachments Implementation - Kickoff Prompt

## Task Summary
Implement NIP-92 media attachments (imeta tags) to add cover images for workout templates and demonstration GIFs/videos for exercise templates, enhancing visual appeal and educational value of the POWR Workout PWA.

## Key Technical Approach
- **Extend NIP-101e**: Our specification already supports imeta tags for exercise templates (33401)
- **Add to Workout Templates**: Implement cover images for workout templates (33402) 
- **Media Service**: Create comprehensive media handling service with NIP-92/94 compliance
- **UI Enhancement**: Upgrade WorkoutCard, ExerciseCard, and WorkoutDetailModal components

## Key Files to Review
1. **Task Document**: `docs/tasks/nip-92-media-attachments-implementation-task.md` - Complete implementation plan
2. **NIP-101e Spec**: `docs/nip-101e-specification.md` - Current imeta tag support for exercises
3. **Existing Components**: 
   - `src/components/powr-ui/workout/WorkoutCard.tsx` - Needs cover image support
   - `src/components/powr-ui/workout/ExpandableExerciseCard.tsx` - Needs demo media
   - `src/components/powr-ui/workout/WorkoutImageHandler.tsx` - Current media handling
4. **Event Generation**: `src/lib/services/workoutEventGeneration.ts` - Needs imeta tag support
5. **Standards Compliance**: `.clinerules/nip-101e-standards.md` - Event generation standards

## Starting Point
Begin with Phase 1: Core Media Service implementation by creating `src/lib/services/mediaService.ts` with NIP-92 imeta tag generation and parsing capabilities. The service should handle:
- Media URL validation and metadata extraction
- NIP-92 compliant imeta tag generation 
- Integration with existing workout event generation
- Support for images, GIFs, and videos with fallback handling

## Success Criteria (80% threshold)
- Exercise templates can include demonstration GIFs/videos via imeta tags
- Workout templates can include cover images via imeta tags  
- Media displays correctly in WorkoutCard and ExerciseCard components
- Fallback handling works when media URLs are unavailable
- NIP-92 compliance verified with published events

## Dependencies to Check
Ensure these packages are available or add them:
- Next.js Image component (already available)
- Sharp for image processing (may need to add)
- React Player for video support (may need to add)

## Implementation Timeline
- **Phase 1**: Core Media Service (1-2 days)
- **Phase 2**: UI Component Integration (2-3 days) 
- **Phase 3**: Content Creation Tools (2-3 days)
- **Phase 4**: Advanced Features (1-2 days)

**Total Estimated Timeline**: 6-8 days

---

This implementation will significantly enhance the visual appeal and educational value of workout content while maintaining full NIP-92 compliance and integration with our existing NDK-first architecture.
