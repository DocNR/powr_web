# NIP-92 Media-Rich Events Rule

## Brief overview
This rule establishes comprehensive patterns for creating media-rich Nostr events using NIP-92 media attachments with POWR custom fields extension, ensuring proper imeta tag formatting for exercise templates (33401), workout templates (33402), and workout records (1301).

## Core Principles

### 1. **NIP-92 Compliance (CRITICAL)**
- **REQUIRED**: All imeta tags must include `url` + at least one other standard field
- **REQUIRED**: Use space-delimited key/value pairs for all imeta tag content
- **REQUIRED**: Follow NIP-92 specification exactly for core fields
- **EXTENSIBLE**: POWR custom fields are fully NIP-92 compliant through variadic key/value pairs

### 2. **POWR Custom Fields Extension**
- **purpose**: Defines media role (cover/icon/demonstration/thumbnail/progress/gallery)
- **context**: Defines media scope (workout/exercise/user/system)
- **Enhanced UX**: Enables purpose-aware media display and interaction
- **Future-Proof**: Extensible for advanced features (video players, galleries, progress tracking)

### 3. **Event Type Integration**
- **Kind 33401**: Exercise templates with demonstration media and thumbnails
- **Kind 33402**: Workout templates with cover images and preview media
- **Kind 1301**: Workout records with progress photos and completion media

## POWR Custom Fields Specification

### MediaPurpose Enum
```typescript
type MediaPurpose = 
  | 'cover'         // Primary visual representation
  | 'icon'          // Small identifier image
  | 'demonstration' // How-to or instructional media
  | 'thumbnail'     // Preview or summary image
  | 'progress'      // Before/after or progress tracking
  | 'gallery';      // Additional supporting media
```

### MediaContext Enum
```typescript
type MediaContext = 
  | 'workout'   // Workout-level media
  | 'exercise'  // Exercise-specific media
  | 'user'      // User-generated content
  | 'system';   // System-provided media
```

### Enhanced imeta Tag Structure
```
["imeta", "url https://example.com/image.jpg m image/jpeg blurhash LKO2?U%2Tw=w]~RBVZRi};RPxuwH purpose cover context exercise"]
```

## Event Generation Patterns

### Pattern 1: Exercise Template (Kind 33401) with Media
```typescript
// ✅ CORRECT: Exercise template with demonstration video and thumbnail
const exerciseTemplateWithMedia = {
  kind: 33401,
  content: "Push-up exercise with proper form demonstration",
  tags: [
    ["d", "pushup-standard"],
    ["title", "Standard Push-up"],
    ["format", "weight", "reps", "rpe", "set_type"],
    ["format_units", "bodyweight", "count", "0-10", "enum"],
    ["equipment", "bodyweight"],
    ["difficulty", "beginner"],
    ["t", "chest"],
    ["t", "push"],
    ["t", "fitness"],
    
    // ✅ CORRECT: Demonstration video with POWR custom fields
    ["imeta", "url https://cdn.powr.app/exercises/pushup-demo.mp4 m video/mp4 duration 45 purpose demonstration context exercise"],
    
    // ✅ CORRECT: Thumbnail image with blurhash
    ["imeta", "url https://cdn.powr.app/exercises/pushup-thumb.jpg m image/jpeg blurhash LKO2?U%2Tw=w]~RBVZRi};RPxuwH purpose thumbnail context exercise"],
    
    // ✅ CORRECT: Icon for UI display
    ["imeta", "url https://cdn.powr.app/exercises/pushup-icon.svg m image/svg+xml purpose icon context exercise"]
  ],
  created_at: Math.floor(Date.now() / 1000),
  pubkey: userPubkey
};
```

### Pattern 2: Workout Template (Kind 33402) with Media
```typescript
// ✅ CORRECT: Workout template with cover image and preview media
const workoutTemplateWithMedia = {
  kind: 33402,
  content: "Upper body strength workout for intermediate athletes",
  tags: [
    ["d", "upper-body-strength"],
    ["title", "Upper Body Power"],
    ["type", "strength"],
    ["duration", "2700"], // 45 minutes
    ["difficulty", "intermediate"],
    
    // Exercise references
    ["exercise", "33401:pubkey:pushup-standard", "", "0", "12", "7", "normal", "1"],
    ["exercise", "33401:pubkey:pullup-assisted", "", "0", "8", "8", "normal", "1"],
    
    // ✅ CORRECT: Cover image for workout template
    ["imeta", "url https://cdn.powr.app/workouts/upper-body-cover.jpg m image/jpeg blurhash LKO2?U%2Tw=w]~RBVZRi};RPxuwH purpose cover context workout"],
    
    // ✅ CORRECT: Preview gallery images
    ["imeta", "url https://cdn.powr.app/workouts/upper-body-preview1.jpg m image/jpeg purpose gallery context workout"],
    ["imeta", "url https://cdn.powr.app/workouts/upper-body-preview2.jpg m image/jpeg purpose gallery context workout"],
    
    ["t", "fitness"],
    ["t", "strength"]
  ],
  created_at: Math.floor(Date.now() / 1000),
  pubkey: userPubkey
};
```

### Pattern 3: Workout Record (Kind 1301) with Progress Media
```typescript
// ✅ CORRECT: Workout record with progress photos
const workoutRecordWithMedia = {
  kind: 1301,
  content: "Completed upper body workout with personal records!",
  tags: [
    ["d", `workout_${workoutId}`],
    ["title", "Upper Body Power Session"],
    ["type", "strength"],
    ["start", startTimestamp.toString()],
    ["end", endTimestamp.toString()],
    ["completed", "true"],
    
    // Template reference
    ["template", "33402:pubkey:upper-body-strength", ""],
    
    // Completed exercises
    ["exercise", "33401:pubkey:pushup-standard", "", "0", "15", "6", "normal", "1"],
    ["exercise", "33401:pubkey:pullup-assisted", "", "0", "10", "7", "normal", "1"],
    
    // ✅ CORRECT: Progress photos with user context
    ["imeta", "url https://cdn.powr.app/progress/user123/workout-before.jpg m image/jpeg purpose progress context user"],
    ["imeta", "url https://cdn.powr.app/progress/user123/workout-after.jpg m image/jpeg purpose progress context user"],
    
    // ✅ CORRECT: Workout completion celebration
    ["imeta", "url https://cdn.powr.app/progress/user123/pr-celebration.jpg m image/jpeg purpose gallery context user"],
    
    ["t", "fitness"]
  ],
  created_at: Math.floor(Date.now() / 1000),
  pubkey: userPubkey
};
```

## Media Service Integration Patterns

### Enhanced Media Service with POWR Fields
```typescript
// ✅ CORRECT: Enhanced media service with purpose/context support
export interface POWRMediaAttachment {
  url: string;
  mimeType: string;
  purpose: MediaPurpose;
  context: MediaContext;
  blurhash?: string;
  duration?: number;
  dimensions?: { width: number; height: number };
  size?: number;
  alt?: string;
}

export class POWRMediaService {
  generateImetaTag(media: POWRMediaAttachment): string[] {
    const parts = [
      `url ${media.url}`,
      `m ${media.mimeType}`,
      `purpose ${media.purpose}`,
      `context ${media.context}`
    ];
    
    // Add optional NIP-92 fields
    if (media.blurhash) parts.push(`blurhash ${media.blurhash}`);
    if (media.duration) parts.push(`duration ${media.duration}`);
    if (media.dimensions) parts.push(`dim ${media.dimensions.width}x${media.dimensions.height}`);
    if (media.size) parts.push(`size ${media.size}`);
    if (media.alt) parts.push(`alt ${media.alt}`);
    
    return ["imeta", parts.join(" ")];
  }
  
  parseImetaTag(tag: string[]): POWRMediaAttachment | null {
    if (tag[0] !== "imeta" || !tag[1]) return null;
    
    const parts = tag[1].split(" ");
    const parsed: Partial<POWRMediaAttachment> = {};
    
    for (let i = 0; i < parts.length; i += 2) {
      const key = parts[i];
      const value = parts[i + 1];
      
      switch (key) {
        case 'url':
          parsed.url = value;
          break;
        case 'm':
          parsed.mimeType = value;
          break;
        case 'purpose':
          parsed.purpose = value as MediaPurpose;
          break;
        case 'context':
          parsed.context = value as MediaContext;
          break;
        case 'blurhash':
          parsed.blurhash = value;
          break;
        case 'duration':
          parsed.duration = parseInt(value);
          break;
        case 'dim':
          const [width, height] = value.split('x').map(Number);
          parsed.dimensions = { width, height };
          break;
        case 'size':
          parsed.size = parseInt(value);
          break;
        case 'alt':
          parsed.alt = value;
          break;
      }
    }
    
    // Validate required fields
    if (!parsed.url || !parsed.mimeType || !parsed.purpose || !parsed.context) {
      return null;
    }
    
    return parsed as POWRMediaAttachment;
  }
}

export const powrMediaService = new POWRMediaService();
```

### XState Integration for Media-Rich Events
```typescript
// ✅ CORRECT: XState actor for publishing media-rich events
import { fromPromise } from 'xstate';
import { publishEvent } from '@/lib/actors/globalNDKActor';
import { powrMediaService } from '@/lib/services/powrMediaService';

const publishMediaRichExerciseActor = fromPromise(async ({ input }: {
  input: {
    exerciseData: ExerciseTemplateData;
    mediaAttachments: POWRMediaAttachment[];
    userPubkey: string;
  }
}) => {
  const { exerciseData, mediaAttachments, userPubkey } = input;
  
  // Generate base event tags
  const baseTags = [
    ["d", exerciseData.id],
    ["title", exerciseData.name],
    ["format", ...exerciseData.format],
    ["format_units", ...exerciseData.formatUnits],
    ["equipment", exerciseData.equipment],
    ["difficulty", exerciseData.difficulty],
    ...exerciseData.muscleGroups.map(muscle => ["t", muscle]),
    ["t", "fitness"]
  ];
  
  // Add media tags using POWR service
  const mediaTags = mediaAttachments.map(media => 
    powrMediaService.generateImetaTag(media)
  );
  
  const eventData = {
    kind: 33401,
    content: exerciseData.description,
    tags: [...baseTags, ...mediaTags],
    created_at: Math.floor(Date.now() / 1000),
    pubkey: userPubkey
  };
  
  const requestId = `exercise_${exerciseData.id}_${Date.now()}`;
  publishEvent(eventData, requestId);
  
  return { success: true, requestId, eventId: eventData.id };
});
```

## UI Component Enhancement Patterns

### Enhanced WorkoutImageHandler with Purpose Support
```typescript
// ✅ CORRECT: Enhanced image handler with purpose-aware display
interface WorkoutImageHandlerProps {
  tags: string[][];
  preferredPurpose?: MediaPurpose;
  fallbackPurpose?: MediaPurpose;
  className?: string;
  alt?: string;
}

export const WorkoutImageHandler: React.FC<WorkoutImageHandlerProps> = ({
  tags,
  preferredPurpose = 'cover',
  fallbackPurpose = 'thumbnail',
  className,
  alt
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const findBestImage = () => {
      const mediaAttachments = tags
        .filter(tag => tag[0] === 'imeta')
        .map(tag => powrMediaService.parseImetaTag(tag))
        .filter(Boolean) as POWRMediaAttachment[];
      
      // Try preferred purpose first
      let bestImage = mediaAttachments.find(media => 
        media.purpose === preferredPurpose && 
        media.mimeType.startsWith('image/')
      );
      
      // Fallback to fallback purpose
      if (!bestImage && fallbackPurpose) {
        bestImage = mediaAttachments.find(media => 
          media.purpose === fallbackPurpose && 
          media.mimeType.startsWith('image/')
        );
      }
      
      // Final fallback to any image
      if (!bestImage) {
        bestImage = mediaAttachments.find(media => 
          media.mimeType.startsWith('image/')
        );
      }
      
      return bestImage?.url || null;
    };

    const url = findBestImage();
    setImageUrl(url);
    setIsLoading(false);
  }, [tags, preferredPurpose, fallbackPurpose]);

  if (isLoading) {
    return <div className={`bg-gray-200 animate-pulse ${className}`} />;
  }

  if (error || !imageUrl) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-sm">No image</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt || 'Workout image'}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
};
```

### Purpose-Aware Media Gallery Component
```typescript
// ✅ CORRECT: Media gallery with purpose filtering
interface MediaGalleryProps {
  tags: string[][];
  purposes?: MediaPurpose[];
  maxItems?: number;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  tags,
  purposes = ['gallery', 'demonstration'],
  maxItems = 6
}) => {
  const mediaItems = useMemo(() => {
    return tags
      .filter(tag => tag[0] === 'imeta')
      .map(tag => powrMediaService.parseImetaTag(tag))
      .filter(Boolean)
      .filter(media => purposes.includes(media.purpose))
      .slice(0, maxItems);
  }, [tags, purposes, maxItems]);

  if (mediaItems.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {mediaItems.map((media, index) => (
        <div key={index} className="aspect-square relative">
          {media.mimeType.startsWith('image/') ? (
            <img
              src={media.url}
              alt={media.alt || `Media ${index + 1}`}
              className="w-full h-full object-cover rounded-lg"
              loading="lazy"
            />
          ) : media.mimeType.startsWith('video/') ? (
            <video
              src={media.url}
              className="w-full h-full object-cover rounded-lg"
              controls
              preload="metadata"
            />
          ) : null}
          
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-xs">
              {media.purpose}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
};
```

## Content Creation Patterns

### Media Upload with Purpose Selection
```typescript
// ✅ CORRECT: Content creation with purpose selection
interface MediaUploadProps {
  onMediaSelected: (media: POWRMediaAttachment) => void;
  allowedPurposes: MediaPurpose[];
  context: MediaContext;
}

export const MediaUploadComponent: React.FC<MediaUploadProps> = ({
  onMediaSelected,
  allowedPurposes,
  context
}) => {
  const [selectedPurpose, setSelectedPurpose] = useState<MediaPurpose>(allowedPurposes[0]);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    
    try {
      // Upload file to CDN/storage service
      const uploadResult = await uploadToStorage(file);
      
      // Generate blurhash for images
      let blurhash: string | undefined;
      if (file.type.startsWith('image/')) {
        blurhash = await generateBlurhash(file);
      }
      
      const mediaAttachment: POWRMediaAttachment = {
        url: uploadResult.url,
        mimeType: file.type,
        purpose: selectedPurpose,
        context,
        blurhash,
        size: file.size,
        dimensions: uploadResult.dimensions,
        alt: `${selectedPurpose} for ${context}`
      };
      
      onMediaSelected(mediaAttachment);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Media Purpose
        </label>
        <select
          value={selectedPurpose}
          onChange={(e) => setSelectedPurpose(e.target.value as MediaPurpose)}
          className="w-full p-2 border rounded-md"
        >
          {allowedPurposes.map(purpose => (
            <option key={purpose} value={purpose}>
              {purpose.charAt(0).toUpperCase() + purpose.slice(1)}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <input
          type="file"
          accept="image/*,video/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
          disabled={uploading}
          className="w-full p-2 border rounded-md"
        />
      </div>
      
      {uploading && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Uploading...</p>
        </div>
      )}
    </div>
  );
};
```

## Validation and Error Handling

### Media Validation Service
```typescript
// ✅ CORRECT: Comprehensive media validation
export class MediaValidationService {
  validateImetaTag(tag: string[]): ValidationResult {
    if (tag[0] !== 'imeta') {
      return { valid: false, error: 'Not an imeta tag' };
    }
    
    if (!tag[1]) {
      return { valid: false, error: 'Empty imeta content' };
    }
    
    const parts = tag[1].split(' ');
    const fields = new Map<string, string>();
    
    // Parse key/value pairs
    for (let i = 0; i < parts.length; i += 2) {
      if (i + 1 >= parts.length) {
        return { valid: false, error: `Missing value for key: ${parts[i]}` };
      }
      fields.set(parts[i], parts[i + 1]);
    }
    
    // Validate required NIP-92 fields
    if (!fields.has('url')) {
      return { valid: false, error: 'Missing required url field' };
    }
    
    if (!fields.has('m')) {
      return { valid: false, error: 'Missing required mime type field' };
    }
    
    // Validate POWR custom fields
    const purpose = fields.get('purpose');
    const context = fields.get('context');
    
    if (purpose && !['cover', 'icon', 'demonstration', 'thumbnail', 'progress', 'gallery'].includes(purpose)) {
      return { valid: false, error: `Invalid purpose: ${purpose}` };
    }
    
    if (context && !['workout', 'exercise', 'user', 'system'].includes(context)) {
      return { valid: false, error: `Invalid context: ${context}` };
    }
    
    // Validate URL format
    try {
      new URL(fields.get('url')!);
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
    
    return { valid: true };
  }
  
  validateEventMedia(event: NostrEvent): ValidationResult {
    const imetaTags = event.tags.filter(tag => tag[0] === 'imeta');
    
    for (const tag of imetaTags) {
      const validation = this.validateImetaTag(tag);
      if (!validation.valid) {
        return {
          valid: false,
          error: `Invalid imeta tag: ${validation.error}`
        };
      }
    }
    
    return { valid: true };
  }
}

export const mediaValidationService = new MediaValidationService();
```

## Testing Patterns

### Media-Rich Event Testing
```typescript
// ✅ CORRECT: Comprehensive testing for media-rich events
describe('POWR Media-Rich Events', () => {
  describe('Exercise Template with Media', () => {
    it('should generate valid imeta tags with POWR custom fields', () => {
      const media: POWRMediaAttachment = {
        url: 'https://cdn.powr.app/demo.jpg',
        mimeType: 'image/jpeg',
        purpose: 'demonstration',
        context: 'exercise',
        blurhash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH'
      };
      
      const imetaTag = powrMediaService.generateImetaTag(media);
      
      expect(imetaTag[0]).toBe('imeta');
      expect(imetaTag[1]).toContain('url https://cdn.powr.app/demo.jpg');
      expect(imetaTag[1]).toContain('m image/jpeg');
      expect(imetaTag[1]).toContain('purpose demonstration');
      expect(imetaTag[1]).toContain('context exercise');
      expect(imetaTag[1]).toContain('blurhash LKO2?U%2Tw=w]~RBVZRi};RPxuwH');
    });
    
    it('should parse imeta tags correctly', () => {
      const imetaTag = [
        'imeta',
        'url https://cdn.powr.app/demo.jpg m image/jpeg purpose demonstration context exercise blurhash LKO2?U%2Tw=w]~RBVZRi};RPxuwH'
      ];
      
      const parsed = powrMediaService.parseImetaTag(imetaTag);
      
      expect(parsed).toEqual({
        url: 'https://cdn.powr.app/demo.jpg',
        mimeType: 'image/jpeg',
        purpose: 'demonstration',
        context: 'exercise',
        blurhash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH'
      });
    });
    
    it('should validate media-rich events', () => {
      const event = {
        kind: 33401,
        tags: [
          ['d', 'test-exercise'],
          ['imeta', 'url https://cdn.powr.app/demo.jpg m image/jpeg purpose demonstration context exercise']
        ]
      };
      
      const validation = mediaValidationService.validateEventMedia(event);
      expect(validation.valid).toBe(true);
    });
  });
  
  describe('UI Component Integration', () => {
    it('should display purpose-specific images', () => {
      const tags = [
        ['imeta', 'url https://cdn.powr.app/cover.jpg m image/jpeg purpose cover context workout'],
        ['imeta', 'url https://cdn.powr.app/thumb.jpg m image/jpeg purpose thumbnail context workout']
      ];
      
      const { getByRole } = render(
        <WorkoutImageHandler 
          tags={tags} 
          preferredPurpose="cover"
          alt="Test workout"
        />
      );
      
      const img = getByRole('img');
      expect(img).toHaveAttribute('src', 'https://cdn.powr.app/cover.jpg');
      expect(img).toHaveAttribute('alt', 'Test workout');
    });
  });
});
```

## Integration with Existing Architecture

### NDK Publishing Integration
```typescript
// ✅ CORRECT: Integration with Global NDK Actor
import { publishEvent } from '@/lib/actors/globalNDKActor';

const publishMediaRichEvent = async (
  eventData: any,
  mediaAttachments: POWRMediaAttachment[]
) => {
  // Add media tags to event
  const mediaTags = mediaAttachments.map(media => 
    powrMediaService.generateImetaTag(media)
  );
  
  const enrichedEvent = {
    ...eventData,
    tags: [...eventData.tags, ...mediaTags]
  };
  
  // Validate before publishing
  const validation = mediaValidationService.validateEventMedia(enrichedEvent);
  if (!validation.valid) {
    throw new Error(`Media validation failed: ${validation.error}`);
  }
  
  const requestId = `media_event_${Date.now()}`;
  publishEvent(enrichedEvent, requestId);
  
  return { success: true, requestId };
};
```

### Service Layer Integration
```typescript
// ✅ CORRECT: Integration with existing service architecture
export class EnhancedTemplateManagementService {
  generateMediaRichTemplate(
    templateData: WorkoutTemplateData,
    mediaAttachments: POWRMediaAttachment[]
  ): WorkoutEventData {
    // Use existing template generation logic
    const baseEvent = this.buildTemplateFromWorkoutStructure(templateData);
    
    // Add media tags
    const mediaTags = mediaAttachments.map(media => 
      powrMediaService.generateImetaTag(media)
    );
    
    return {
      ...baseEvent,
      tags: [...baseEvent.tags, ...mediaTags]
    };
  }
}
```

## When to Apply This Rule

### Always Apply For
- Creating exercise templates (33401) with demonstration media
- Creating workout templates (33402) with cover images
- Publishing workout records (1301) with progress photos
- Any Nostr event that includes media attachments
- Content creation interfaces with media upload

### Especially Important When
- Building content creation tools
- Implementing media galleries or carousels
- Creating purpose-specific media displays
- Integrating with external media storage services
- Ensuring NIP-92 compliance across all media features

### Success Metrics
- **100% NIP-92 Compliance**: All imeta tags follow specification exactly
- **Purpose-Aware Display**: UI components respect media purpose and context
- **Validation Coverage**: All media attachments validated before publishing
- **Enhanced UX**: Users can select appropriate media purposes during creation
- **Future-Proof Architecture**: Easy to extend with new purposes and contexts

## Common Pitfalls to Avoid

### ❌ FORBIDDEN Patterns
```typescript
// DON'T: Invalid imeta tag format
["imeta", "https://example.com/image.jpg"] // Missing required fields

// DON'T: Non-space-delimited format
["imeta", "url=https://example.com/image.jpg,m=image/jpeg"] // Wrong delimiter

// DON'T: Missing required NIP-92 fields
["imeta", "purpose cover context workout"] // Missing url and mime type

// DON'T: Invalid POWR custom field values
["imeta", "url https://example.com/image.jpg m image/jpeg purpose invalid context unknown"]
```

### ✅ CORRECT Alternatives
```typescript
// DO: Proper NIP-92 compliant imeta tags
["imeta", "url https://example.com/image.jpg m image/jpeg purpose cover context workout"]

// DO: Include optional NIP-92 fields when available
["imeta", "url https://example.com/image.jpg m image/jpeg blurhash LKO2?U%2Tw=w]~RBVZRi};RPxuwH purpose cover context workout"]

// DO: Validate all media before publishing
const validation = mediaValidationService.validateImetaTag(imetaTag);
if (!validation.valid) throw new Error(validation.error);
```

## References

### NIP Specifications
- **NIP-92**: Media Attachments - https://github.com/nostr-protocol/nips/blob/master/92.md
- **NIP-94**: File Metadata - https://github.com/nostr-protocol/nips/blob/master/94.md
- **NIP-101e**: Workout Events - `docs/nip-101e-specification.md`

### Implementation Files
- **Media Service**: `src/lib/services/powrMediaService.ts` (to be created)
- **Image Handler**: `src/components/powr-ui/workout/WorkoutImageHandler.tsx`
- **Event Generation**: XState actors with media support
- **Validation**: `src/lib/services/mediaValidationService.ts` (to be created)

### Related .clinerules
- **nip-101e-standards.md**: Event structure and validation requirements
- **service-layer-architecture.md**: Service integration patterns
- **web-ndk-actor-integration.md**: NDK publishing patterns

This rule ensures all media-rich events in the POWR Workout PWA maintain NIP-92 compliance while leveraging POWR custom fields for enhanced user experience and future extensibility.

---

**Last Updated**: 2025-08-27
**Project**: POWR Workout PWA
**Environment**: Web Browser
**NIP Compliance**: NIP-92, NIP-94, NIP-101e
