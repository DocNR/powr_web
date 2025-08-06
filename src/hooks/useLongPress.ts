'use client';

import { useCallback, useRef, useState } from 'react';

interface UseLongPressOptions {
  delay?: number;
  onStart?: () => void;
  onFinish?: () => void;
  onCancel?: () => void;
}

interface UseLongPressReturn {
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchCancel: (e: React.TouchEvent) => void;
  isPressed: boolean;
}

export const useLongPress = (
  callback: () => void,
  options: UseLongPressOptions = {}
): UseLongPressReturn => {
  const { delay = 500, onStart, onFinish, onCancel } = options;
  const [isPressed, setIsPressed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const preventClickRef = useRef(false);

  const start = useCallback(() => {
    if (timeoutRef.current) return;
    
    setIsPressed(true);
    onStart?.();
    
    timeoutRef.current = setTimeout(() => {
      callback();
      onFinish?.();
      preventClickRef.current = true;
      setIsPressed(false);
      timeoutRef.current = null;
    }, delay);
  }, [callback, delay, onStart, onFinish]);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      onCancel?.();
    }
    setIsPressed(false);
    
    // Reset prevent click after a short delay
    setTimeout(() => {
      preventClickRef.current = false;
    }, 100);
  }, [onCancel]);

  return {
    onMouseDown: useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      start();
    }, [start]),
    
    onMouseUp: useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      clear();
    }, [clear]),
    
    onMouseLeave: useCallback(() => {
      clear();
    }, [clear]),
    
    onTouchStart: useCallback((e: React.TouchEvent) => {
      e.preventDefault();
      start();
    }, [start]),
    
    onTouchEnd: useCallback((e: React.TouchEvent) => {
      e.preventDefault();
      clear();
    }, [clear]),
    
    onTouchCancel: useCallback(() => {
      clear();
    }, [clear]),
    
    isPressed
  };
};

export default useLongPress;
