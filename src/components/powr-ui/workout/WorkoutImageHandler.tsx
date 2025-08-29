'use client';

/**
 * WorkoutImageHandler Component
 * 
 * Handles imeta tag parsing from Nostr events and provides fallback images.
 * Supports lazy loading and optimized image display for workout content.
 */

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ImetaTag {
  url: string;
  mimeType?: string;
  alt?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  // POWR custom fields (NIP-92 compliant extensions)
  purpose?: 'cover' | 'icon' | 'demonstration' | 'thumbnail' | 'progress' | 'gallery';
  context?: 'workout' | 'exercise' | 'user' | 'system';
  blurhash?: string;
  fallback?: string;
}

interface WorkoutImageHandlerProps {
  /** Nostr event tags array */
  tags?: string[][];
  /** Event content for additional image parsing */
  content?: string;
  /** Event kind to determine fallback image */
  eventKind?: number;
  /** Custom fallback image URL */
  fallbackSrc?: string;
  /** Alt text for the image */
  alt?: string;
  /** Image dimensions */
  width?: number;
  height?: number;
  /** CSS classes */
  className?: string;
  /** Whether to use lazy loading */
  lazy?: boolean;
  /** Image priority for above-the-fold content */
  priority?: boolean;
  /** Whether image should fill its container */
  fill?: boolean;
}

export function WorkoutImageHandler({
  tags = [],
  content = '',
  eventKind,
  fallbackSrc,
  alt = 'Workout image',
  width = 200,
  height = 150,
  className,
  lazy = true,
  priority = false,
  fill = false
}: WorkoutImageHandlerProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Parse imeta tags from Nostr event (NIP-92 compliant)
  const imetaImages = useMemo(() => {
    const images: ImetaTag[] = [];
    
    // Find imeta tags in the tags array
    for (const tag of tags) {
      if (tag[0] === 'imeta' && tag[1]) {
        
        const imetaData: ImetaTag = {
          url: '',
        };
        
        // NIP-92 format: single string with space-delimited key/value pairs
        const imetaString = tag[1];
        const parts = imetaString.split(' ');
        
        console.log('[WorkoutImageHandler] Parsing imeta string:', imetaString);
        console.log('[WorkoutImageHandler] Split parts:', parts);
        
        // Parse key/value pairs
        for (let i = 0; i < parts.length; i += 2) {
          const key = parts[i];
          const value = parts[i + 1];
          
          if (!key || !value) continue;
          
          switch (key) {
            case 'url':
              imetaData.url = value;
              break;
            case 'm':
              imetaData.mimeType = value;
              break;
            case 'alt':
              imetaData.alt = value;
              break;
            case 'dim':
              const dimensions = value.split('x');
              if (dimensions.length === 2) {
                imetaData.dimensions = {
                  width: parseInt(dimensions[0]),
                  height: parseInt(dimensions[1])
                };
              }
              break;
            case 'blurhash':
              imetaData.blurhash = value;
              break;
            case 'fallback':
              imetaData.fallback = value;
              break;
            // POWR custom fields (NIP-92 compliant extensions)
            case 'purpose':
              imetaData.purpose = value as ImetaTag['purpose'];
              break;
            case 'context':
              imetaData.context = value as ImetaTag['context'];
              break;
          }
        }
        
        if (imetaData.url) {
          console.log('[WorkoutImageHandler] Parsed imeta data:', imetaData);
          images.push(imetaData);
        }
      }
    }
    
    console.log('[WorkoutImageHandler] Final parsed images:', images);
    return images;
  }, [tags]);

  // Parse images from content (URLs in text)
  const contentImages = useMemo(() => {
    const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/gi;
    const matches = content.match(urlRegex);
    return matches || [];
  }, [content]);

  // Determine the best image to use
  const primaryImage = useMemo(() => {
    console.log('[WorkoutImageHandler] Determining primary image...');
    console.log('[WorkoutImageHandler] imetaImages:', imetaImages);
    console.log('[WorkoutImageHandler] contentImages:', contentImages);
    
    // Priority: image-compatible imeta tags > content URLs > fallback
    if (imetaImages.length > 0) {
      // First, try to find image-compatible media (thumbnails, covers, etc.)
      const imageCompatibleMedia = imetaImages.filter(img => {
        const isValid = isValidImageUrl(img.url);
        const isImageType = img.mimeType?.startsWith('image/') || 
                           img.purpose === 'thumbnail' || 
                           img.purpose === 'cover' ||
                           img.purpose === 'icon';
        console.log('[WorkoutImageHandler] Checking media:', {
          url: img.url,
          mimeType: img.mimeType,
          purpose: img.purpose,
          isValid,
          isImageType
        });
        return isValid && isImageType;
      });
      
      if (imageCompatibleMedia.length > 0) {
        // Prioritize by purpose: thumbnail > cover > icon > others
        const priorityOrder = ['thumbnail', 'cover', 'icon', 'demonstration', 'progress', 'gallery'];
        const sortedMedia = imageCompatibleMedia.sort((a, b) => {
          const aIndex = priorityOrder.indexOf(a.purpose || '');
          const bIndex = priorityOrder.indexOf(b.purpose || '');
          return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
        });
        
        const selectedImage = sortedMedia[0];
        const result = {
          src: selectedImage.url,
          alt: selectedImage.alt || alt,
          width: selectedImage.dimensions?.width || width,
          height: selectedImage.dimensions?.height || height
        };
        console.log('[WorkoutImageHandler] Selected image-compatible media:', result);
        return result;
      }
      
      // Fallback to any valid imeta URL (including videos if no images available)
      for (const img of imetaImages) {
        if (isValidImageUrl(img.url)) {
          const result = {
            src: img.url,
            alt: img.alt || alt,
            width: img.dimensions?.width || width,
            height: img.dimensions?.height || height
          };
          console.log('[WorkoutImageHandler] Selected fallback imeta media:', result);
          return result;
        }
      }
    }
    
    if (contentImages.length > 0 && isValidImageUrl(contentImages[0])) {
      console.log('[WorkoutImageHandler] Using content image:', contentImages[0]);
      return {
        src: contentImages[0],
        alt,
        width,
        height
      };
    }
    
    console.log('[WorkoutImageHandler] No valid images found, returning null');
    return null;
  }, [imetaImages, contentImages, alt, width, height]);

  // Get fallback image based on event kind
  const getFallbackImage = () => {
    if (fallbackSrc) return fallbackSrc;
    
    // Use different fallbacks based on event kind
    switch (eventKind) {
      case 33402: // Workout template
        return '/assets/workout-template-fallback.jpg';
      case 1301: // Workout record
        return '/assets/workout-record-fallback.jpg';
      default:
        return '/assets/workout-template-fallback.jpg';
    }
  };

  const finalImageSrc = imageError || !primaryImage 
    ? getFallbackImage() 
    : primaryImage.src;

  console.log('[WorkoutImageHandler] Final image selection:');
  console.log('[WorkoutImageHandler] - imageError:', imageError);
  console.log('[WorkoutImageHandler] - primaryImage:', primaryImage);
  console.log('[WorkoutImageHandler] - finalImageSrc:', finalImageSrc);

  const finalAlt = primaryImage?.alt || alt;
  const finalWidth = primaryImage?.width || width;
  const finalHeight = primaryImage?.height || height;

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      {/* Loading placeholder */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center rounded-lg"
          style={{ width: finalWidth, height: finalHeight }}
        >
          <div className="text-muted-foreground text-sm">Loading...</div>
        </div>
      )}
      
      {/* Main image */}
      {fill ? (
        <Image
          src={finalImageSrc}
          alt={finalAlt}
          fill
          priority={priority}
          className={cn(
            'object-cover transition-opacity duration-300 rounded-lg',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          onLoad={handleImageLoad}
          onError={handleImageError}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <Image
          src={finalImageSrc}
          alt={finalAlt}
          width={finalWidth}
          height={finalHeight}
          className={cn(
            "object-cover object-center transition-opacity duration-300 rounded-lg",
            "scale-105", // Slight zoom to ensure full coverage
            isLoading ? "opacity-0" : "opacity-100"
          )}
          onLoad={handleImageLoad}
          onError={handleImageError}
          priority={priority}
          loading={lazy ? "lazy" : "eager"}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      )}
      
      {/* Image overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none rounded-lg" />
      
    </div>
  );
}

// Helper function to extract images from Nostr event
export function extractImagesFromEvent(tags: string[][], content: string) {
  // Parse imeta tags using correct NIP-92 format
  const imetaImages: ImetaTag[] = [];
  for (const tag of tags) {
    if (tag[0] === 'imeta' && tag[1]) {
      const imetaData: ImetaTag = { url: '' };
      
      // NIP-92 format: single string with space-delimited key/value pairs
      const imetaString = tag[1];
      const parts = imetaString.split(' ');
      
      // Parse key/value pairs
      for (let i = 0; i < parts.length; i += 2) {
        const key = parts[i];
        const value = parts[i + 1];
        
        if (!key || !value) continue;
        
        switch (key) {
          case 'url':
            imetaData.url = value;
            break;
          case 'alt':
            imetaData.alt = value;
            break;
          case 'm':
            imetaData.mimeType = value;
            break;
          case 'purpose':
            imetaData.purpose = value as ImetaTag['purpose'];
            break;
          case 'context':
            imetaData.context = value as ImetaTag['context'];
            break;
        }
      }
      
      if (imetaData.url) {
        imetaImages.push(imetaData);
      }
    }
  }
  
  // Parse content images
  const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/gi;
  const contentImages = content.match(urlRegex) || [];
  
  return {
    imetaImages,
    contentImages,
    hasImages: imetaImages.length > 0 || contentImages.length > 0
  };
}

// Helper function to validate image URLs
export function isValidImageUrl(url: string): boolean {
  console.log('[isValidImageUrl] Validating URL:', url);
  
  try {
    const urlObj = new URL(url);
    console.log('[isValidImageUrl] Parsed URL - hostname:', urlObj.hostname, 'pathname:', urlObj.pathname);
    
    // Check for standard image extensions
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const hasValidExtension = validExtensions.some(ext => urlObj.pathname.toLowerCase().endsWith(ext));
    console.log('[isValidImageUrl] Has valid extension:', hasValidExtension);
    
    if (hasValidExtension) {
      console.log('[isValidImageUrl] Valid - standard image extension');
      return true;
    }
    
    // Special handling for YouTube thumbnail URLs
    const isYouTubeThumbnail = urlObj.hostname === 'img.youtube.com' && urlObj.pathname.includes('/vi/');
    console.log('[isValidImageUrl] Is YouTube thumbnail:', isYouTubeThumbnail);
    
    if (isYouTubeThumbnail) {
      console.log('[isValidImageUrl] Valid - YouTube thumbnail');
      return true;
    }
    
    // Special handling for other known image hosting services
    const imageHosts = ['imgur.com', 'i.imgur.com', 'nostr.build', 'void.cat', 'nostrcheck.me'];
    const isKnownImageHost = imageHosts.some(host => urlObj.hostname.includes(host));
    console.log('[isValidImageUrl] Is known image host:', isKnownImageHost);
    
    if (isKnownImageHost) {
      console.log('[isValidImageUrl] Valid - known image host');
      return true;
    }
    
    console.log('[isValidImageUrl] Invalid - no matching criteria');
    return false;
  } catch (error) {
    console.log('[isValidImageUrl] Invalid - URL parsing error:', error);
    return false;
  }
}
