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
      if (tag[0] === 'imeta') {
        const imetaData: ImetaTag = {
          url: '',
        };
        
        // Parse imeta tag parameters (NIP-92 format: space-delimited key/value pairs)
        for (let i = 1; i < tag.length; i++) {
          const param = tag[i];
          
          // Each parameter is "key value" format
          if (param.startsWith('url ')) {
            imetaData.url = param.substring(4);
          } else if (param.startsWith('m ')) {
            imetaData.mimeType = param.substring(2);
          } else if (param.startsWith('alt ')) {
            imetaData.alt = param.substring(4);
          } else if (param.startsWith('dim ')) {
            const dimensions = param.substring(4).split('x');
            if (dimensions.length === 2) {
              imetaData.dimensions = {
                width: parseInt(dimensions[0]),
                height: parseInt(dimensions[1])
              };
            }
          }
          // Note: NIP-92 also supports blurhash, x (hash), fallback, etc.
          // We can extend this as needed
        }
        
        if (imetaData.url) {
          images.push(imetaData);
        }
      }
    }
    
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
    // Priority: imeta tags > content URLs > fallback
    if (imetaImages.length > 0 && imetaImages[0].url && isValidImageUrl(imetaImages[0].url)) {
      return {
        src: imetaImages[0].url,
        alt: imetaImages[0].alt || alt,
        width: imetaImages[0].dimensions?.width || width,
        height: imetaImages[0].dimensions?.height || height
      };
    }
    
    if (contentImages.length > 0 && isValidImageUrl(contentImages[0])) {
      return {
        src: contentImages[0],
        alt,
        width,
        height
      };
    }
    
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
    <div className={cn("relative overflow-hidden", className)}>
      {/* Loading placeholder */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center"
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
            'object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
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
            "object-cover object-center transition-opacity duration-300",
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      
    </div>
  );
}

// Helper function to extract images from Nostr event
export function extractImagesFromEvent(tags: string[][], content: string) {
  // Parse imeta tags
  const imetaImages: ImetaTag[] = [];
  for (const tag of tags) {
    if (tag[0] === 'imeta') {
      const imetaData: ImetaTag = { url: '' };
      for (let i = 1; i < tag.length; i++) {
        const param = tag[i];
        if (param.startsWith('url ')) {
          imetaData.url = param.substring(4);
        } else if (param.startsWith('alt ')) {
          imetaData.alt = param.substring(4);
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
  try {
    const urlObj = new URL(url);
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return validExtensions.some(ext => 
      urlObj.pathname.toLowerCase().endsWith(ext)
    );
  } catch {
    return false;
  }
}
