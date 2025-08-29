/**
 * Exercise Modal Data Utility
 * 
 * Centralizes exercise data preparation for ExerciseDetailModal to ensure
 * consistent data structure across all access paths (GlobalWorkoutSearch,
 * Library tab, Workout detail modal).
 * 
 * This eliminates the need to update multiple pathways when modifying
 * ExerciseDetailModal - all pathways use this single preparation function.
 */

import type { NDKEvent } from '@nostr-dev-kit/ndk';

// Standardized interface for ExerciseDetailModal
export interface ExerciseModalData {
  // Core exercise data
  id: string;
  name: string;
  description: string;
  equipment: string;
  difficulty: string;
  muscleGroups: string[];
  
  // NIP-92 media data (preserved from original event)
  eventTags: string[][];
  
  // Additional parsed data
  format?: string[];
  format_units?: string[];
  hashtags?: string[];
  instructions?: string[];
  
  // Metadata
  authorPubkey: string;
  createdAt: number;
  eventId?: string;
  eventKind?: number;
  eventContent?: string;
}

// Video data extracted from NIP-92 imeta tags
export interface VideoData {
  url: string;
  isYouTube: boolean;
  videoId?: string;
  purpose?: string;
  context?: string;
  mimeType?: string;
  isDirectVideo?: boolean;
}

// Union type for all possible exercise data sources
type ExerciseDataSource = NDKEvent | { exercise: Record<string, unknown> } | DirectExerciseData;

// Interface for direct exercise data
interface DirectExerciseData {
  id: string;
  name: string;
  eventTags?: string[][]; // Made optional to handle Exercise type from dependencyResolution
  tags?: string[][]; // Added to handle Exercise type from dependencyResolution
  description?: string;
  equipment?: string;
  difficulty?: string;
  muscleGroups?: string[];
  format?: string[];
  format_units?: string[];
  hashtags?: string[];
  instructions?: string[];
  authorPubkey?: string;
  createdAt?: number;
  eventId?: string;
  eventKind?: number;
  eventContent?: string;
}

/**
 * Main function to prepare exercise data for ExerciseDetailModal
 * Handles all different input formats and returns standardized data
 */
export function prepareExerciseForModal(source: ExerciseDataSource): ExerciseModalData {
  console.log('[prepareExerciseForModal] Processing source:', {
    hasKind: !!(source as NDKEvent).kind,
    hasTags: !!(source as NDKEvent).tags,
    hasPubkey: !!(source as NDKEvent).pubkey,
    hasExercise: !!(source as { exercise: Record<string, unknown> }).exercise,
    hasId: !!(source as DirectExerciseData).id,
    hasName: !!(source as DirectExerciseData).name,
    hasEventTags: !!(source as DirectExerciseData).eventTags,
    sourceKeys: Object.keys(source)
  });

  // Handle NDK Event (GlobalWorkoutSearch path)
  if ('kind' in source && 'tags' in source && 'pubkey' in source) {
    console.log('[prepareExerciseForModal] Detected NDK Event format');
    return prepareFromNDKEvent(source as NDKEvent);
  }
  
  // Handle Service Exercise (Library path)
  if ('exercise' in source) {
    console.log('[prepareExerciseForModal] Detected Service Exercise format');
    return prepareFromServiceExercise(source as { exercise: Record<string, unknown> });
  }
  
  // Handle direct exercise object (ExerciseLibrary → ExerciseDetailModal path)
  if ('id' in source && 'name' in source) {
    console.log('[prepareExerciseForModal] Detected Direct Exercise format');
    return prepareFromDirectExercise(source as DirectExerciseData);
  }
  
  console.error('[prepareExerciseForModal] Unsupported exercise data format:', source);
  throw new Error('Unsupported exercise data format');
}

/**
 * Prepare data from NDK Event (GlobalWorkoutSearch path)
 */
function prepareFromNDKEvent(event: NDKEvent): ExerciseModalData {
  console.log('[prepareFromNDKEvent] Processing NDK event:', {
    kind: event.kind,
    tagCount: event.tags.length,
    pubkey: event.pubkey.slice(0, 8)
  });

  const tagMap = new Map(event.tags.map(tag => [tag[0], tag]));
  
  const id = tagMap.get('d')?.[1] || 'unknown';
  const name = tagMap.get('title')?.[1] || tagMap.get('name')?.[1] || 'Unknown Exercise';
  const description = event.content || 'No description available';
  const equipment = tagMap.get('equipment')?.[1] || 'unknown';
  const difficulty = tagMap.get('difficulty')?.[1] || 'intermediate';
  
  // Extract format and format_units
  const format = tagMap.get('format')?.slice(1) || [];
  const format_units = tagMap.get('format_units')?.slice(1) || [];
  
  // Extract hashtags (t tags)
  const hashtags = event.tags.filter(t => t[0] === 't').map(t => t[1]);
  
  // Extract muscle groups from hashtags
  const muscleGroups = hashtags.filter(tag => 
    ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio'].includes(tag)
  );
  
  // Parse instructions from content if JSON
  let instructions: string[] = [];
  try {
    const contentData = JSON.parse(event.content || '{}');
    instructions = contentData.instructions || [];
  } catch {
    instructions = ['No instructions available'];
  }

  const result: ExerciseModalData = {
    id,
    name,
    description,
    equipment,
    difficulty,
    muscleGroups,
    eventTags: event.tags, // ✅ CRITICAL: Preserve original event tags for NIP-92
    format,
    format_units,
    hashtags,
    instructions,
    authorPubkey: event.pubkey,
    createdAt: event.created_at || Math.floor(Date.now() / 1000),
    eventId: event.id,
    eventKind: event.kind,
    eventContent: event.content
  };

  console.log('[prepareFromNDKEvent] Result:', {
    id: result.id,
    name: result.name,
    eventTagsCount: result.eventTags.length,
    muscleGroups: result.muscleGroups
  });

  return result;
}

/**
 * Prepare data from Service Exercise (Library path)
 */
function prepareFromServiceExercise(source: { exercise: Record<string, unknown> }): ExerciseModalData {
  console.log('[prepareFromServiceExercise] Processing service exercise:', {
    hasExercise: !!source.exercise,
    exerciseKeys: source.exercise ? Object.keys(source.exercise) : []
  });

  const exercise = source.exercise;
  
  if (!exercise) {
    throw new Error('Missing exercise data in service format');
  }

  const result: ExerciseModalData = {
    id: (exercise.id as string) || 'unknown',
    name: (exercise.name as string) || 'Unknown Exercise',
    description: (exercise.description as string) || 'No description available',
    equipment: (exercise.equipment as string) || 'unknown',
    difficulty: (exercise.difficulty as string) || 'intermediate',
    muscleGroups: (exercise.muscleGroups as string[]) || [],
    eventTags: (exercise.eventTags as string[][]) || [], // ✅ CRITICAL: Preserve event tags from service
    format: (exercise.format as string[]) || [],
    format_units: (exercise.format_units as string[]) || [],
    hashtags: (exercise.hashtags as string[]) || [],
    instructions: (exercise.instructions as string[]) || ['No instructions available'],
    authorPubkey: (exercise.authorPubkey as string) || '',
    createdAt: (exercise.createdAt as number) || Math.floor(Date.now() / 1000),
    eventId: exercise.eventId as string | undefined,
    eventKind: 33401, // Exercise template kind
    eventContent: (exercise.description as string) || undefined
  };

  console.log('[prepareFromServiceExercise] Result:', {
    id: result.id,
    name: result.name,
    eventTagsCount: result.eventTags.length,
    muscleGroups: result.muscleGroups
  });

  return result;
}

/**
 * Prepare data from Direct Exercise object (future-proofing)
 */
function prepareFromDirectExercise(source: DirectExerciseData): ExerciseModalData {
  console.log('[prepareFromDirectExercise] Processing direct exercise:', {
    id: source.id,
    name: source.name,
    eventTagsCount: source.eventTags?.length || 0,
    tagsCount: source.tags?.length || 0,
    hasEventTags: !!source.eventTags,
    hasTags: !!source.tags
  });

  // ✅ CRITICAL: Handle both eventTags and tags properties for compatibility
  // dependencyResolutionService returns Exercise with tags?: string[][]
  // while other sources may use eventTags: string[][]
  const eventTags = source.eventTags || source.tags || [];

  const result: ExerciseModalData = {
    id: source.id,
    name: source.name,
    description: source.description || 'No description available',
    equipment: source.equipment || 'unknown',
    difficulty: source.difficulty || 'intermediate',
    muscleGroups: source.muscleGroups || [],
    eventTags, // ✅ CRITICAL: Use resolved eventTags (handles both eventTags and tags)
    format: source.format || [],
    format_units: source.format_units || [],
    hashtags: source.hashtags || [],
    instructions: source.instructions || ['No instructions available'],
    authorPubkey: source.authorPubkey || '',
    createdAt: source.createdAt || Math.floor(Date.now() / 1000),
    eventId: source.eventId,
    eventKind: source.eventKind || 33401,
    eventContent: source.eventContent || source.description
  };

  console.log('[prepareFromDirectExercise] Result:', {
    id: result.id,
    name: result.name,
    eventTagsCount: result.eventTags.length,
    resolvedFromTags: !source.eventTags && !!source.tags
  });

  return result;
}

/**
 * Extract video URLs from NIP-92 imeta tags
 * Supports YouTube, Vimeo, TikTok, Nostr CDNs, and any direct video URLs
 */
export function extractVideoUrls(eventTags: string[][]): VideoData[] {
  const videos: VideoData[] = [];
  
  // Find all imeta tags
  const imetaTags = eventTags.filter(tag => tag[0] === 'imeta');
  
  for (const tag of imetaTags) {
    if (tag.length < 2) continue;
    
    const imetaContent = tag[1];
    const parts = imetaContent.split(' ');
    
    let url = '';
    let purpose = '';
    let context = '';
    let mimeType = '';
    
    // Parse space-delimited key-value pairs
    for (let i = 0; i < parts.length; i += 2) {
      const key = parts[i];
      const value = parts[i + 1];
      
      switch (key) {
        case 'url':
          url = value;
          break;
        case 'purpose':
          purpose = value;
          break;
        case 'context':
          context = value;
          break;
        case 'm':
          mimeType = value;
          break;
      }
    }
    
    // Include video content from any source
    if (url && isVideoContent(url, mimeType, purpose)) {
      const isYouTube = isYouTubeUrl(url);
      const isDirectVideo = mimeType.startsWith('video/') || hasVideoExtension(url) || hasVideoPathSegments(url);
      let videoId: string | undefined;
      
      if (isYouTube) {
        videoId = extractYouTubeVideoId(url);
      }
      
      videos.push({
        url,
        isYouTube,
        videoId,
        purpose,
        context,
        mimeType,
        isDirectVideo
      });
    }
  }
  
  console.log('[extractVideoUrls] Found videos:', videos);
  return videos;
}

/**
 * Determine if content is video-related
 * Uses multiple detection methods to handle any CDN without whitelisting
 */
function isVideoContent(url: string, mimeType: string, purpose: string): boolean {
  // Exclude thumbnail images - they are not video content
  if (purpose === 'thumbnail') {
    return false;
  }
  
  // 1. MIME type is the most reliable indicator (works for any CDN)
  if (mimeType && mimeType.startsWith('video/')) {
    return true;
  }
  
  // 2. File extension detection (works for any CDN)
  if (hasVideoExtension(url)) {
    return true;
  }
  
  // 3. NIP-92 purpose field indicates video content
  if (purpose === 'demonstration') {
    return true;
  }
  
  // 4. Known video platforms (YouTube, Vimeo, TikTok)
  if (isYouTubeUrl(url) || isVimeoUrl(url) || isTikTokUrl(url)) {
    return true;
  }
  
  // 5. Video-related path segments (works for any CDN)
  if (hasVideoPathSegments(url)) {
    return true;
  }
  
  // 6. Known Nostr CDNs with video indicators
  if (isKnownNostrCDNWithVideo(url)) {
    return true;
  }
  
  return false;
}

/**
 * Check if URL is from YouTube
 */
function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

/**
 * Check if URL is from Vimeo
 */
function isVimeoUrl(url: string): boolean {
  return url.includes('vimeo.com');
}

/**
 * Check if URL is from TikTok
 */
function isTikTokUrl(url: string): boolean {
  return url.includes('tiktok.com');
}

/**
 * Check if URL has a video file extension
 */
function hasVideoExtension(url: string): boolean {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.m4v'];
  const urlLower = url.toLowerCase();
  return videoExtensions.some(ext => urlLower.includes(ext));
}

/**
 * Check for video-related path segments (works for any CDN)
 */
function hasVideoPathSegments(url: string): boolean {
  const urlLower = url.toLowerCase();
  const videoPathSegments = [
    '/video/', '/videos/', '/media/', '/v/', '/watch/', '/embed/',
    '/stream/', '/streaming/', '/content/', '/file/', '/files/',
    '/upload/', '/uploads/', '/assets/', '/static/'
  ];
  
  return videoPathSegments.some(segment => urlLower.includes(segment));
}

/**
 * Check if URL is from a known Nostr CDN with video indicators
 * This is a fallback - primary detection uses MIME type and file extensions
 */
function isKnownNostrCDNWithVideo(url: string): boolean {
  const nostrCDNs = [
    'nostr.build',
    'primal.net', 
    'void.cat',
    'nostrimg.com',
    'nostrage.com',
    'nostr.download',
    'cdn.nostr.build',
    'nostrfiles.dev',
    'nostr.wine'
  ];
  
  const urlLower = url.toLowerCase();
  
  // Only return true if it's a known Nostr CDN AND has video indicators
  const isNostrCDN = nostrCDNs.some(cdn => urlLower.includes(cdn));
  
  if (!isNostrCDN) {
    return false;
  }
  
  // For known Nostr CDNs, check for video indicators
  return hasVideoExtension(url) || hasVideoPathSegments(url);
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): string | undefined {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
    /(?:youtu\.be\/)([^&\n?#]+)/,
    /(?:youtube\.com\/embed\/)([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return undefined;
}
