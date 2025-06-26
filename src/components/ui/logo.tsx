'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function Logo({ width = 120, height = 40, className, priority = false }: LogoProps) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Only run on client side to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Determine if we're in dark mode, but only after mounting
  const isDark = mounted && (theme === 'dark' || (theme === 'system' && systemTheme === 'dark'));
  
  // For dark mode, we'll need a white version of the logo
  // For now, we'll use the black version and invert it in dark mode
  const logoSrc = '/assets/logos/powr-logo-black.png';
  
  return (
    <Image
      src={logoSrc}
      alt="POWR Logo"
      width={width}
      height={height}
      priority={priority}
      className={cn(
        'object-contain',
        isDark && 'invert', // Invert colors in dark mode (only after mounting)
        className
      )}
    />
  );
}
