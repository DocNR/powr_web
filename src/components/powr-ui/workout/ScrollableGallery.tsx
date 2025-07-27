'use client';

/**
 * ScrollableGallery Component
 * 
 * Horizontal scrolling container for workout cards and other content.
 * Optimized for mobile touch scrolling with smooth animations.
 */

import { ReactNode, useRef, useState, useEffect } from 'react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrollableGalleryProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showNavigation?: boolean;
  className?: string;
  itemClassName?: string;
  gap?: 'sm' | 'md' | 'lg';
  onSeeAll?: () => void;
}

export function ScrollableGallery({
  children,
  title,
  subtitle,
  showNavigation = true,
  className,
  itemClassName,
  gap = 'md',
  onSeeAll
}: ScrollableGalleryProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Gap classes
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  // Check scroll position and update navigation state
  const updateScrollState = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  // Scroll functions
  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth'
    });
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  };

  // Update scroll state on mount and scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    updateScrollState();

    const handleScroll = () => updateScrollState();
    const handleResize = () => updateScrollState();

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [children]);

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      {(title || subtitle || onSeeAll) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600">
                {subtitle}
              </p>
            )}
          </div>
          
          {onSeeAll && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onSeeAll}
              className="text-primary hover:text-primary/90 hover:bg-primary/10"
            >
              See All
            </Button>
          )}
        </div>
      )}

      {/* Gallery Container */}
      <div className="relative">
        {/* Navigation Buttons */}
        {showNavigation && (
          <>
            {/* Left Navigation */}
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "absolute left-2 top-1/2 -translate-y-1/2 z-10",
                "h-8 w-8 p-0 rounded-full",
                "bg-background/95 backdrop-blur-sm border-border text-muted-foreground",
                "shadow-md hover:shadow-lg",
                "hover:bg-primary hover:border-primary hover:text-primary-foreground",
                "transition-all duration-200",
                !canScrollLeft && "opacity-0 pointer-events-none"
              )}
              onClick={scrollLeft}
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Right Navigation */}
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 z-10",
                "h-8 w-8 p-0 rounded-full",
                "bg-background/95 backdrop-blur-sm border-border text-muted-foreground",
                "shadow-md hover:shadow-lg",
                "hover:bg-primary hover:border-primary hover:text-primary-foreground",
                "transition-all duration-200",
                !canScrollRight && "opacity-0 pointer-events-none"
              )}
              onClick={scrollRight}
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Scrollable Content */}
        <div
          ref={scrollContainerRef}
          className={cn(
            "flex overflow-x-auto scrollbar-hide",
            "scroll-smooth snap-x snap-mandatory",
            gapClasses[gap],
            // Add padding to prevent clipping of shadows and rings - increased left padding even more
            "py-2 pl-8 pr-1",
            // Hide scrollbar
            "[-webkit-overflow-scrolling:touch]",
            "[&::-webkit-scrollbar]:hidden",
            "[-ms-overflow-style:none]",
            "[scrollbar-width:none]",
            // ✅ CRITICAL: Touch isolation for horizontal galleries - IMPROVED
            "horizontal-gallery-permissive"
          )}
        >
          {/* Items - Direct children without wrapper */}
          {Array.isArray(children) ? (
            children.map((child, index) => (
              <div
                key={index}
                className={cn(
                  "flex-shrink-0 snap-start",
                  // Add scroll snap margin to offset snap position from left edge
                  "scroll-ml-4",
                  itemClassName
                )}
              >
                {child}
              </div>
            ))
          ) : (
            <div className={cn("flex-shrink-0 snap-start scroll-ml-4", itemClassName)}>
              {children}
            </div>
          )}
        </div>

        {/* Scroll Indicators (Mobile) */}
        <div className="flex justify-center mt-3 md:hidden">
          <div className="flex gap-1">
            {Array.from({ length: Math.ceil((Array.isArray(children) ? children.length : 1) / 2) }).map((_, index) => (
              <div
                key={index}
                className="h-1.5 w-1.5 rounded-full bg-gray-300"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Specialized gallery for workout cards
interface WorkoutGalleryProps extends Omit<ScrollableGalleryProps, 'itemClassName'> {
  cardSize?: 'sm' | 'md' | 'lg';
}

export function WorkoutGallery({
  cardSize = 'md',
  ...props
}: WorkoutGalleryProps) {
  // Responsive card sizes that prevent horizontal overflow
  const cardSizeClasses = {
    sm: 'w-56 sm:w-64',           // 224px -> 256px
    md: 'w-64 sm:w-72 md:w-80',  // 256px -> 288px -> 320px
    lg: 'w-72 sm:w-80 md:w-96'   // 288px -> 320px -> 384px
  };

  return (
    <ScrollableGallery
      {...props}
      itemClassName={cardSizeClasses[cardSize]}
    />
  );
}

// Specialized gallery for social feed
export function SocialGallery(props: ScrollableGalleryProps) {
  return (
    <ScrollableGallery
      {...props}
      itemClassName="w-60 sm:w-64 md:w-72"  // 240px -> 256px -> 288px
      gap="sm"
    />
  );
}

// Specialized gallery for hero content
export function HeroGallery(props: ScrollableGalleryProps) {
  return (
    <ScrollableGallery
      {...props}
      itemClassName="w-full max-w-md mx-auto"
      showNavigation={false}
      gap="lg"
    />
  );
}
