# NIP-92 Media Attachments Implementation Task (Enhanced with Custom Fields)

## Objective
Implement NIP-92 media attachments with POWR custom fields for explicit image type classification (cover, icon, demonstration, etc.) in the POWR Workout PWA, enhancing visual appeal and educational value of workout content.

## Current State Analysis
- **NIP-101e Specification**: Already includes `imeta` tag support for exercise templates (kind 33401)
- **Existing Media Handling**: Basic image handling exists in `WorkoutImageHandler.tsx` and fallback images
- **UI Components**: WorkoutCard, WorkoutDetailModal, and ExpandableExerciseCard ready for media integration
- **Nostr Standards**: NIP-92 and NIP-94 provide comprehensive media attachment specifications

## Research Findings

### NIP-92 Media Attachments with POWR Extensions
- **Purpose**: Add media URLs to event content with rich metadata
- **imeta Tag Format**: Variadic space-delimited key/value pairs
- **Required Fields**: `url` + at least one other field
- **POWR Custom Fields**: `purpose` and `context` for explicit image type classification
- **Integration**: Works with NIP-94 file metadata fields + BlurHash support

### POWR Custom Field Extensions
- **purpose**: Explicit image type (`cover`, `icon`, `demonstration`, `thumbnail`, `progress`, `gallery`)
- **context**: Content context (`workout`, `exercise`, `user`, `system`)
- **Extensible**: Follows NIP-92 extensibility pattern while maintaining compatibility

### BlurHash Integration
- **What is BlurHash**: Compact ~20-30 character string encoding a low-resolution image placeholder
- **Benefits**: Instant loading, smooth UX, tiny size (~30 chars vs KB thumbnails), aesthetic color matching
- **Implementation**: Generates blurred placeholder while actual image loads

## Technical Approach

### 1. Enhanced Type System with Custom Fields
```typescript
export type MediaPurpose = 
  | 'cover'         // Main visual for workout templates
  | 'icon'          // Small square images for UI elements
  | 'demonstration' // Exercise form videos/GIFs
  | 'thumbnail'     // Small preview images
  | 'progress'      // Before/after or completion photos
  | 'gallery';      // Additional supplementary images

export type MediaContext = 
  | 'workout'       // Related to workout templates/records
  | 'exercise'      // Related to exercise templates
  | 'user'          // User-generated content
  | 'system';       // App-generated content

export interface PowrMediaMetadata {
  url: string;
  mimeType: string;
  purpose: MediaPurpose;    // ← Custom POWR field
  context: MediaContext;    // ← Custom POWR field
  dimensions?: { width: number; height: number };
  hash?: string;
  alt?: string;
  blurhash?: string;
  thumbnailUrl?: string;
  fallbackUrls?: string[];
}
```

### 2. Enhanced NIP-101e Integration with Custom Fields
Our specification now supports explicit purpose classification:
- **Exercise Templates (33401)**: Form demonstration videos/GIFs with `purpose=demonstration`
- **Workout Templates (33402)**: Cover images with `purpose=cover`, icons with `purpose=icon`
- **Workout Records (1301)**: Progress photos with `purpose=progress`

### 3. Media Types Support with Purpose Classification
- **Cover Images**: `purpose=cover` - JPEG/PNG for workout template branding
- **Icons**: `purpose=icon` - Small square images for UI elements
- **Exercise Demonstrations**: `purpose=demonstration` - Animated GIFs/videos of proper form
- **Thumbnails**: `purpose=thumbnail` - Small preview images
- **Progress Photos**: `purpose=progress` - Before/after or completion photos
- **Gallery Images**: `purpose=gallery` - Additional supplementary content

## Implementation Steps

### Phase 1: Enhanced Media Service with Custom Fields (1-2 days)
1. **Create Enhanced Media Service**
   - [ ] `src/lib/services/mediaService.ts` - Media service with POWR custom fields
   - [ ] Support for NIP-92 imeta tag generation with `purpose` and `context` fields
   - [ ] Integration with existing workout event generation
   - [ ] BlurHash generation and parsing utilities

2. **Enhanced Type Definitions**
   - [ ] `src/types/media.ts` - Complete type system for POWR media
   - [ ] MediaPurpose and MediaContext enums
   - [ ] PowrMediaMetadata interface extending standard NIP-92 fields

3. **Media Parsing and Validation**
   - [ ] Parse imeta tags with custom POWR fields
   - [ ] Extract media metadata organized by purpose
   - [ ] Handle fallback URLs and error states
   - [ ] Validate media URL accessibility

### Phase 2: Event Generation Integration (1-2 days)
1. **Enhanced Event Generation**
   - [ ] Extend `workoutEventGeneration.ts` to include imeta tags with custom fields
   - [ ] Add media validation for exercise templates with purpose classification
   - [ ] Support multiple media types per event with different purposes

2. **NIP-101e Compliance with Custom Fields**
   - [ ] Exercise templates with demonstration media (`purpose=demonstration`)
   - [ ] Workout templates with cover images (`purpose=cover`) and icons (`purpose=icon`)
   - [ ] Workout records with progress photos (`purpose=progress`)

### Phase 3: Enhanced UI Component Integration (2-3 days)
1. **Purpose-Aware Media Hooks**
   - [ ] `useMediaFromTags` hook - Parse and organize media by purpose
   - [ ] Type-safe media access by purpose (cover, icon, demonstration, etc.)
   - [ ] Automatic fallback handling and error states

2. **Enhanced WorkoutCard with Purpose-Specific Media**
   - [ ] Display cover images from `purpose=cover` media
   - [ ] Show icons from `purpose=icon` media
   - [ ] BlurHash placeholders for smooth loading
   - [ ] Fallback to existing placeholder images

3. **Exercise Media Display with Demonstrations**
   - [ ] GIF/video player for `purpose=demonstration` media
   - [ ] Thumbnail previews with play buttons from `purpose=thumbnail`
   - [ ] Accessibility support with alt text
   - [ ] Progressive loading with BlurHash

4. **Media Gallery Component**
   - [ ] Full-screen media viewer supporting all purposes
   - [ ] Support for images, GIFs, and videos
   - [ ] Navigation between multiple media items
   - [ ] Purpose-based organization and filtering

### Phase 4: Content Creation Tools with Purpose Selection (2-3 days)
1. **Media Upload Interface with Purpose Classification**
   - [ ] File selection with purpose dropdown (cover, icon, demonstration, etc.)
   - [ ] Preview media with purpose-specific sizing
   - [ ] Automatic metadata extraction (dimensions, MIME type, hash)
   - [ ] BlurHash generation for smooth loading

2. **Exercise Template Creator with Media Purposes**
   - [ ] Add demonstration media (`purpose=demonstration`) to exercise templates
   - [ ] Add thumbnail media (`purpose=thumbnail`) for previews
   - [ ] Preview media in template creation flow
   - [ ] Validation of media URLs and metadata

3. **Workout Template Creator with Visual Branding**
   - [ ] Add cover images (`purpose=cover`) to workout templates
   - [ ] Add icons (`purpose=icon`) for UI elements
   - [ ] Image cropping and optimization
   - [ ] Preview in template creation interface

### Phase 5: Advanced Features and Optimization (1-2 days)
1. **Media Optimization**
   - [ ] Automatic thumbnail generation
   - [ ] Progressive loading for large media
   - [ ] Bandwidth-aware media selection
   - [ ] Purpose-specific optimization (cover vs icon sizing)

2. **Accessibility Enhancements**
   - [ ] Screen reader support for media descriptions
   - [ ] Keyboard navigation for media galleries
   - [ ] High contrast mode support
   - [ ] Purpose-aware alt text generation

## Success Criteria

### Core Functionality (80% threshold)
- [ ] Exercise templates can include demonstration media via `purpose=demonstration` imeta tags
- [ ] Workout templates can include cover images via `purpose=cover` and icons via `purpose=icon`
- [ ] Media displays correctly in WorkoutCard and ExerciseCard components with purpose-specific handling
- [ ] Fallback handling works when media URLs are unavailable
- [ ] NIP-92 compliance with POWR custom fields verified with published events

### Enhanced Features
- [ ] Full-screen media viewer with purpose-based navigation
- [ ] BlurHash placeholders for smooth loading experience
- [ ] Multiple fallback URLs support with automatic failover
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Media upload and creation tools with purpose selection

### Performance Targets
- [ ] Media loading doesn't block UI rendering
- [ ] BlurHash placeholders render instantly
- [ ] Lazy loading reduces initial page load time
- [ ] Thumbnail generation under 500ms
- [ ] Full media loading under 3 seconds on 3G

## Technical Implementation Details

### Enhanced Media Service Architecture
```typescript
// src/lib/services/mediaService.ts
export class MediaService {
  /**
   * Generate NIP-92 compliant imeta tag with POWR custom fields
   */
  generateImetaTag(metadata: PowrMediaMetadata): string[] {
    return [
      'imeta',
      `url ${metadata.url}`,
      `m ${metadata.mimeType}`,
      `purpose ${metadata.purpose}`,     // ← Custom POWR field
      `context ${metadata.context}`,     // ← Custom POWR field
      ...(metadata.dimensions ? [`dim ${metadata.dimensions.width}x${metadata.dimensions.height}`] : []),
      ...(metadata.alt ? [`alt ${metadata.alt}`] : []),
      ...(metadata.blurhash ? [`blurhash ${metadata.blurhash}`] : []),
      ...(metadata.thumbnailUrl ? [`thumb ${metadata.thumbnailUrl}`] : [])
    ];
  }

  /**
   * Parse imeta tag into POWR media metadata
   */
  parseImetaTag(tag: string[]): PowrMediaMetadata | null;

  /**
   * Extract all media from event tags, organized by purpose
   */
  parseAllMediaFromTags(tags: string[][]): Record<MediaPurpose, PowrMediaMetadata[]>;

  /**
   * Generate BlurHash from image URL
   */
  async generateBlurhash(imageUrl: string): Promise<string>;
}
```

### Enhanced Event Generation with Custom Fields
```typescript
// Enhanced exercise template with demonstration media
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
      "purpose demonstration",        // ← Custom POWR field
      "context exercise",            // ← Custom POWR field
      "dim 1920x1080",
      "alt Demonstration of proper barbell deadlift form",
      "thumb https://media.powr.fit/exercises/deadlift-thumb.jpg",
      "blurhash LKO2?U%2Tw=w]~RBVZRi};RPxuwH"
    ],
    ["t", "compound"],
    ["t", "legs"]
  ]
};

// Enhanced workout template with cover image and icon
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
      "purpose cover",               // ← Custom POWR field
      "context workout",             // ← Custom POWR field
      "dim 1200x800",
      "alt Strength training workout cover image",
      "blurhash LKO2?U%2Tw=w]~RBVZRi};RPxuwH"
    ],
    ["imeta",
      "url https://media.powr.fit/workouts/strength-blast-icon.png",
      "m image/png",
      "purpose icon",                // ← Custom POWR field
      "context workout",             // ← Custom POWR field
      "dim 256x256",
      "alt Strength Blast workout icon"
    ],
    ["exercise", "33401:pubkey:deadlift-barbell", "", "100", "5", "8", "normal", "1"],
    ["t", "strength"]
  ]
};
```

### Enhanced UI Component Examples
```typescript
// Enhanced WorkoutCard with purpose-specific media
const WorkoutCard = ({ workout }: { workout: WorkoutTemplate }) => {
  const mediaByPurpose = useMediaFromTags(workout.tags);
  
  const coverImage = mediaByPurpose.cover[0];
  const iconImage = mediaByPurpose.icon[0];

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
            blurDataURL={coverImage.blurhash ? 
              `data:image/jpeg;base64,${generateBlurDataURL(coverImage.blurhash)}` : 
              undefined
            }
          />
        </div>
      )}
      <CardContent>
        <div className="flex items-center gap-2">
          {iconImage && (
            <Image
              src={iconImage.url}
              alt={iconImage.alt}
              width={24}
              height={24}
              className="rounded"
            />
          )}
          <h3>{workout.title}</h3>
        </div>
      </CardContent>
    </Card>
  );
};

// Exercise demonstration component with purpose-aware media
const ExerciseDemonstration = ({ exercise }: { exercise: ExerciseTemplate }) => {
  const mediaByPurpose = useMediaFromTags(exercise.tags);
  
  const demonstrationMedia = mediaByPurpose.demonstration[0];
  const thumbnailMedia = mediaByPurpose.thumbnail[0];
  
  if (!demonstrationMedia) return null;
  
  return (
    <div className="exercise-demo">
      {demonstrationMedia.mimeType?.startsWith('video/') ? (
        <video
          src={demonstrationMedia.url}
          poster={thumbnailMedia?.url}
          controls
          className="w-full rounded-lg"
          aria-label={demonstrationMedia.alt}
        />
      ) : (
        <Image
          src={demonstrationMedia.url}
          alt={demonstrationMedia.alt || `${exercise.title} demonstration`}
          width={demonstrationMedia.dimensions?.width || 400}
          height={demonstrationMedia.dimensions?.height || 300}
          className="rounded-lg"
          placeholder={demonstrationMedia.blurhash ? "blur" : "empty"}
          blurDataURL={demonstrationMedia.blurhash ? 
            `data:image/jpeg;base64,${generateBlurDataURL(demonstrationMedia.blurhash)}` : 
            undefined
          }
        />
      )}
    </div>
  );
};
```

## Integration with Existing Architecture

### NDK Event Publishing
- **Global NDK Actor**: Handle media-rich event publishing with custom fields
- **Event Validation**: Ensure imeta tags comply with NIP-92 + POWR extensions
- **Cache Integration**: Store media metadata organized by purpose in NDK cache

### XState Integration
- **Media Loading States**: Handle loading, error, and success states by purpose
- **Progressive Enhancement**: Load media after core content with purpose prioritization
- **Error Recovery**: Fallback to alternative media sources based on purpose

### POWR UI Components
- **Radix UI Integration**: Use Radix primitives for media controls
- **Purpose-Aware Design**: Components adapt based on media purpose
- **Accessibility**: Full keyboard navigation and screen reader support
- **Responsive Design**: Adapt to different screen sizes with purpose-specific layouts

## Testing Strategy

### Unit Tests
- [ ] Media service functions (URL validation, metadata extraction, custom field parsing)
- [ ] Imeta tag generation and parsing with POWR custom fields
- [ ] Component rendering with and without media by purpose
- [ ] BlurHash generation and placeholder rendering

### Integration Tests
- [ ] End-to-end media upload and display flow with purpose selection
- [ ] Fallback handling when media URLs fail by purpose
- [ ] Accessibility compliance testing with purpose-aware components
- [ ] NIP-92 compliance with POWR custom fields

### Performance Tests
- [ ] Media loading performance benchmarks by purpose
- [ ] BlurHash generation and rendering performance
- [ ] Memory usage with multiple media items
- [ ] Network efficiency with lazy loading and purpose prioritization

## File Structure
```
src/
├── lib/
│   └── services/
│       ├── mediaService.ts          # Enhanced media service with custom fields
│       ├── imetaParser.ts           # NIP-92 tag parsing with POWR extensions
│       ├── mediaValidation.ts       # URL and metadata validation
│       └── blurhashUtils.ts         # BlurHash generation utilities
├── components/
│   └── powr-ui/
│       ├── media/
│       │   ├── MediaViewer.tsx      # Full-screen media viewer
│       │   ├── MediaGallery.tsx     # Purpose-aware media gallery
│       │   ├── MediaUpload.tsx      # Media upload with purpose selection
│       │   └── ExerciseDemo.tsx     # Exercise demonstration player
│       └── workout/
│           ├── WorkoutCard.tsx      # Enhanced with purpose-specific media
│           ├── ExerciseCard.tsx     # Enhanced with demonstration media
│           └── WorkoutDetailModal.tsx # Media gallery integration
├── hooks/
│   ├── useMediaFromTags.ts          # Parse and organize media by purpose
│   └── useBlurHash.ts               # BlurHash generation and utilities
├── types/
│   └── media.ts                     # Enhanced media types with POWR fields
└── utils/
    ├── blurhash.ts                  # BlurHash generation utilities
    └── mediaOptimization.ts         # Image/video optimization
```

## Dependencies
- **@plaiceholder/next**: BlurHash generation and placeholder utilities
- **sharp**: Image processing and optimization
- **react-player**: Video player component with custom controls
- **@radix-ui/react-dialog**: Media viewer modal primitives
- **blurhash**: BlurHash encoding/decoding library

## Rollout Strategy

### Phase 1: Core Infrastructure with Custom Fields
- Deploy enhanced media service with POWR custom fields
- Update event generation to support imeta tags with purpose/context
- Basic purpose-aware media display in existing components

### Phase 2: Enhanced UI with Purpose Classification
- Full media gallery and viewer components with purpose organization
- Upload and creation tools with purpose selection
- Advanced features (BlurHash, fallbacks, purpose-specific optimization)

### Phase 3: Content Migration and Enhancement
- Add demonstration media to existing exercise templates
- Create cover images and icons for popular workout templates
- User-generated content support with purpose classification

## Success Metrics

### User Engagement
- **Media Interaction Rate**: % of users who interact with purpose-specific media content
- **Workout Completion**: Improved completion rates with visual demonstrations
- **Content Discovery**: Increased browsing of workout templates with cover images
- **Purpose Utilization**: Usage distribution across different media purposes

### Technical Performance
- **Loading Performance**: Media loading under 3 seconds with BlurHash instant placeholders
- **Error Rate**: <5% media loading failures with fallback success
- **Purpose Accuracy**: 100% correct media classification and display
- **Accessibility Score**: WCAG 2.1 AA compliance maintained

### Content Quality
- **Media Coverage**: 80% of exercise templates have demonstration media
- **Visual Appeal**: 60% of workout templates have cover images and icons
- **User Satisfaction**: Positive feedback on purpose-specific visual content quality
- **Custom Field Adoption**: Successful parsing of POWR custom fields across Nostr ecosystem

## References
- **NIP-92**: Media Attachments specification with extensibility
- **NIP-94**: File Metadata specification for comprehensive media data
- **NIP-101e**: Our workout events specification with imeta support
- **BlurHash**: Compact image placeholder specification
- **WCAG 2.1**: Web accessibility guidelines for media content
- **Radix UI**: Component library documentation for media controls

---

**Last Updated**: 2025-08-20
**Project**: POWR Workout PWA
**Environment**: Web Browser
**Estimated Timeline**: 6-8 days total implementation
**Architecture**: Enhanced with POWR custom fields for explicit media purpose classification
