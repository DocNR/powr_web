# NIP-92 Media Attachments Implementation Task

## Objective
Implement NIP-92 media attachments (imeta tags) for both cover images and workout example GIFs in the POWR Workout PWA, enhancing the visual appeal and educational value of workout content.

## Current State Analysis
- **NIP-101e Specification**: Already includes `imeta` tag support for exercise templates (kind 33401)
- **Existing Media Handling**: Basic image handling exists in `WorkoutImageHandler.tsx` and fallback images
- **UI Components**: WorkoutCard, WorkoutDetailModal, and ExpandableExerciseCard ready for media integration
- **Nostr Standards**: NIP-92 and NIP-94 provide comprehensive media attachment specifications

## Research Findings

### NIP-92 Media Attachments
- **Purpose**: Add media URLs to event content with rich metadata
- **imeta Tag Format**: Variadic space-delimited key/value pairs
- **Required Fields**: `url` + at least one other field
- **Integration**: Works with NIP-94 file metadata fields

### NIP-94 File Metadata Fields
- `url` - Direct download URL
- `m` - MIME type (e.g., `image/jpeg`, `video/mp4`)
- `x` - SHA-256 hash of file
- `dim` - Dimensions in pixels (`<width>x<height>`)
- `alt` - Accessibility description
- `blurhash` - Loading placeholder
- `thumb` - Thumbnail URL
- `fallback` - Alternative URLs

## Technical Approach

### 1. Enhanced NIP-101e Integration
Our specification already supports `imeta` tags for exercise templates. We'll extend this to:
- **Exercise Templates (33401)**: Form demonstration videos/GIFs
- **Workout Templates (33402)**: Cover images for workout branding
- **Workout Records (1301)**: Progress photos and completion media

### 2. Media Types Support
- **Cover Images**: JPEG/PNG for workout template branding
- **Exercise GIFs**: Animated demonstrations of proper form
- **Progress Photos**: Before/after or completion photos
- **Video Demonstrations**: MP4 videos for complex movements

### 3. UI Component Enhancements
- **WorkoutCard**: Display cover images with fallback handling
- **ExerciseCard**: Show form demonstration GIFs
- **WorkoutDetailModal**: Rich media gallery
- **MediaViewer**: Full-screen media viewing component

## Implementation Steps

### Phase 1: Core Media Service (1-2 days)
1. **Create Media Service**
   - [ ] `src/lib/services/mediaService.ts` - Media URL validation and metadata extraction
   - [ ] Support for NIP-92 imeta tag generation
   - [ ] Integration with existing workout event generation

2. **Update Event Generation**
   - [ ] Extend `workoutEventGeneration.ts` to include imeta tags
   - [ ] Add media validation for exercise templates
   - [ ] Support multiple media types per event

3. **Media Parsing Service**
   - [ ] Parse imeta tags from Nostr events
   - [ ] Extract media metadata for UI components
   - [ ] Handle fallback URLs and error states

### Phase 2: UI Component Integration (2-3 days)
1. **Enhanced WorkoutCard**
   - [ ] Display cover images from workout template imeta tags
   - [ ] Lazy loading with blurhash placeholders
   - [ ] Fallback to existing placeholder images

2. **Exercise Media Display**
   - [ ] GIF/video player for exercise demonstrations
   - [ ] Thumbnail previews with play buttons
   - [ ] Accessibility support with alt text

3. **Media Gallery Component**
   - [ ] Full-screen media viewer
   - [ ] Support for images, GIFs, and videos
   - [ ] Navigation between multiple media items

### Phase 3: Content Creation Tools (2-3 days)
1. **Media Upload Interface**
   - [ ] File selection and preview
   - [ ] Automatic metadata extraction (dimensions, MIME type)
   - [ ] Blurhash generation for smooth loading

2. **Exercise Template Creator**
   - [ ] Add demonstration media to exercise templates
   - [ ] Preview media in template creation flow
   - [ ] Validation of media URLs and metadata

3. **Workout Template Creator**
   - [ ] Add cover images to workout templates
   - [ ] Image cropping and optimization
   - [ ] Preview in template creation interface

### Phase 4: Advanced Features (1-2 days)
1. **Media Optimization**
   - [ ] Automatic thumbnail generation
   - [ ] Progressive loading for large media
   - [ ] Bandwidth-aware media selection

2. **Accessibility Enhancements**
   - [ ] Screen reader support for media descriptions
   - [ ] Keyboard navigation for media galleries
   - [ ] High contrast mode support

## Success Criteria

### Core Functionality (80% threshold)
- [ ] Exercise templates can include demonstration GIFs/videos via imeta tags
- [ ] Workout templates can include cover images via imeta tags
- [ ] Media displays correctly in WorkoutCard and ExerciseCard components
- [ ] Fallback handling works when media URLs are unavailable
- [ ] NIP-92 compliance verified with published events

### Enhanced Features
- [ ] Full-screen media viewer with navigation
- [ ] Blurhash placeholders for smooth loading
- [ ] Multiple fallback URLs support
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Media upload and creation tools

### Performance Targets
- [ ] Media loading doesn't block UI rendering
- [ ] Lazy loading reduces initial page load time
- [ ] Thumbnail generation under 500ms
- [ ] Full media loading under 3 seconds on 3G

## Technical Implementation Details

### Media Service Architecture
```typescript
// src/lib/services/mediaService.ts
export interface MediaMetadata {
  url: string;
  mimeType: string;
  dimensions?: { width: number; height: number };
  hash?: string;
  alt?: string;
  blurhash?: string;
  thumbnailUrl?: string;
  fallbackUrls?: string[];
}

export interface ImetaTag {
  url: string;
  m?: string;        // MIME type
  dim?: string;      // dimensions
  x?: string;        // SHA-256 hash
  alt?: string;      // alt text
  blurhash?: string; // blurhash
  thumb?: string;    // thumbnail URL
  fallback?: string; // fallback URL
}

export class MediaService {
  generateImetaTag(metadata: MediaMetadata): string[]
  parseImetaTag(tag: string[]): MediaMetadata
  validateMediaUrl(url: string): Promise<boolean>
  extractMetadata(file: File): Promise<MediaMetadata>
  generateBlurhash(imageUrl: string): Promise<string>
}
```

### Event Generation Integration
```typescript
// Enhanced exercise template with media
const exerciseTemplate = {
  kind: 33401,
  content: "Proper deadlift form demonstration with video guide",
  tags: [
    ["d", "deadlift-barbell"],
    ["title", "Barbell Deadlift"],
    ["format", "weight", "reps", "rpe", "set_type"],
    ["format_units", "kg", "count", "0-10", "enum"],
    ["equipment", "barbell"],
    ["imeta", 
      "url https://media.powr.fit/exercises/deadlift-demo.mp4",
      "m video/mp4",
      "dim 1920x1080",
      "alt Demonstration of proper barbell deadlift form",
      "thumb https://media.powr.fit/exercises/deadlift-thumb.jpg",
      "fallback https://backup.powr.fit/exercises/deadlift-demo.gif"
    ],
    ["t", "compound"],
    ["t", "legs"]
  ]
};

// Enhanced workout template with cover image
const workoutTemplate = {
  kind: 33402,
  content: "High-intensity strength training workout",
  tags: [
    ["d", "strength-blast-workout"],
    ["title", "Strength Blast"],
    ["type", "strength"],
    ["imeta",
      "url https://media.powr.fit/workouts/strength-blast-cover.jpg",
      "m image/jpeg", 
      "dim 1200x800",
      "alt Strength training workout cover image",
      "blurhash LKO2?U%2Tw=w]~RBVZRi};RPxuwH"
    ],
    ["exercise", "33401:pubkey:deadlift-barbell", "", "100", "5", "8", "normal", "1"],
    ["t", "strength"]
  ]
};
```

### UI Component Examples
```typescript
// Enhanced WorkoutCard with cover image
const WorkoutCard = ({ workout }: { workout: WorkoutTemplate }) => {
  const coverImage = useMemo(() => 
    parseImetaFromTags(workout.tags), [workout.tags]
  );

  return (
    <Card className="workout-card">
      {coverImage && (
        <div className="relative aspect-video">
          <Image
            src={coverImage.url}
            alt={coverImage.alt || workout.title}
            fill
            className="object-cover rounded-t-lg"
            placeholder={coverImage.blurhash ? "blur" : "empty"}
            blurDataURL={coverImage.blurhash}
            onError={() => setImageError(true)}
          />
        </div>
      )}
      <CardContent>
        <h3>{workout.title}</h3>
        <p>{workout.description}</p>
      </CardContent>
    </Card>
  );
};

// Exercise demonstration component
const ExerciseDemonstration = ({ exercise }: { exercise: ExerciseTemplate }) => {
  const media = parseImetaFromTags(exercise.tags);
  
  if (!media) return null;
  
  return (
    <div className="exercise-demo">
      {media.mimeType?.startsWith('video/') ? (
        <video
          src={media.url}
          poster={media.thumbnailUrl}
          controls
          className="w-full rounded-lg"
          aria-label={media.alt}
        />
      ) : (
        <Image
          src={media.url}
          alt={media.alt || `${exercise.title} demonstration`}
          width={media.dimensions?.width || 400}
          height={media.dimensions?.height || 300}
          className="rounded-lg"
        />
      )}
    </div>
  );
};
```

## Integration with Existing Architecture

### NDK Event Publishing
- **Global NDK Actor**: Handle media-rich event publishing
- **Event Validation**: Ensure imeta tags comply with NIP-92
- **Cache Integration**: Store media metadata in NDK cache

### XState Integration
- **Media Loading States**: Handle loading, error, and success states
- **Progressive Enhancement**: Load media after core content
- **Error Recovery**: Fallback to alternative media sources

### POWR UI Components
- **Radix UI Integration**: Use Radix primitives for media controls
- **Accessibility**: Full keyboard navigation and screen reader support
- **Responsive Design**: Adapt to different screen sizes and orientations

## Testing Strategy

### Unit Tests
- [ ] Media service functions (URL validation, metadata extraction)
- [ ] Imeta tag generation and parsing
- [ ] Component rendering with and without media

### Integration Tests
- [ ] End-to-end media upload and display flow
- [ ] Fallback handling when media URLs fail
- [ ] Accessibility compliance testing

### Performance Tests
- [ ] Media loading performance benchmarks
- [ ] Memory usage with multiple media items
- [ ] Network efficiency with lazy loading

## File Structure
```
src/
├── lib/
│   └── services/
│       ├── mediaService.ts          # Core media handling
│       ├── imetaParser.ts           # NIP-92 tag parsing
│       └── mediaValidation.ts       # URL and metadata validation
├── components/
│   └── powr-ui/
│       ├── media/
│       │   ├── MediaViewer.tsx      # Full-screen media viewer
│       │   ├── MediaGallery.tsx     # Media gallery component
│       │   ├── MediaUpload.tsx      # Media upload interface
│       │   └── ExerciseDemo.tsx     # Exercise demonstration player
│       └── workout/
│           ├── WorkoutCard.tsx      # Enhanced with cover images
│           ├── ExerciseCard.tsx     # Enhanced with demo media
│           └── WorkoutDetailModal.tsx # Media gallery integration
├── types/
│   └── media.ts                     # Media-related TypeScript types
└── utils/
    ├── blurhash.ts                  # Blurhash generation utilities
    └── mediaOptimization.ts         # Image/video optimization
```

## Dependencies
- **@plaiceholder/next**: Blurhash generation
- **sharp**: Image processing and optimization
- **react-player**: Video player component
- **@radix-ui/react-dialog**: Media viewer modal

## Rollout Strategy

### Phase 1: Core Infrastructure
- Deploy media service and parsing utilities
- Update event generation to support imeta tags
- Basic media display in existing components

### Phase 2: Enhanced UI
- Full media gallery and viewer components
- Upload and creation tools
- Advanced features (blurhash, fallbacks)

### Phase 3: Content Migration
- Add media to existing exercise templates
- Create cover images for popular workout templates
- User-generated content support

## Success Metrics

### User Engagement
- **Media Interaction Rate**: % of users who interact with media content
- **Workout Completion**: Improved completion rates with visual demonstrations
- **Content Discovery**: Increased browsing of workout templates with cover images

### Technical Performance
- **Loading Performance**: Media loading under 3 seconds
- **Error Rate**: <5% media loading failures
- **Accessibility Score**: WCAG 2.1 AA compliance

### Content Quality
- **Media Coverage**: 80% of exercise templates have demonstration media
- **Template Appeal**: 60% of workout templates have cover images
- **User Satisfaction**: Positive feedback on visual content quality

## References
- **NIP-92**: Media Attachments specification
- **NIP-94**: File Metadata specification  
- **NIP-101e**: Our workout events specification
- **WCAG 2.1**: Web accessibility guidelines
- **Radix UI**: Component library documentation

---

**Last Updated**: 2025-07-27
**Project**: POWR Workout PWA
**Environment**: Web Browser
**Estimated Timeline**: 6-8 days total implementation
