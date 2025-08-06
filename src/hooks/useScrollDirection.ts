'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseScrollDirectionOptions {
  threshold?: number;
  target?: HTMLElement | null;
}

interface UseScrollDirectionReturn {
  isScrollingDown: boolean;
  isScrollingUp: boolean;
  isAtTop: boolean;
  scrollY: number;
}

export function useScrollDirection(options: UseScrollDirectionOptions = {}): UseScrollDirectionReturn {
  const { threshold = 10, target } = options;
  
  const [scrollY, setScrollY] = useState(0);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const updateScrollDirection = useCallback(() => {
    const currentScrollY = target ? target.scrollTop : window.scrollY;
    
    setScrollY(currentScrollY);
    setIsAtTop(currentScrollY <= threshold);
    
    // Only update direction if we've scrolled past the threshold
    if (Math.abs(currentScrollY - lastScrollY.current) > threshold) {
      const scrollingDown = currentScrollY > lastScrollY.current;
      const scrollingUp = currentScrollY < lastScrollY.current;
      
      setIsScrollingDown(scrollingDown);
      setIsScrollingUp(scrollingUp);
      
      lastScrollY.current = currentScrollY;
    }
    
    ticking.current = false;
  }, [threshold, target]);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(updateScrollDirection);
      ticking.current = true;
    }
  }, [updateScrollDirection]);

  useEffect(() => {
    const scrollTarget = target || window;
    
    // Set initial values
    const initialScrollY = target ? target.scrollTop : window.scrollY;
    setScrollY(initialScrollY);
    setIsAtTop(initialScrollY <= threshold);
    lastScrollY.current = initialScrollY;
    
    // Add passive event listener for better performance
    scrollTarget.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollTarget.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, threshold, target]);

  return {
    isScrollingDown,
    isScrollingUp,
    isAtTop,
    scrollY
  };
}
