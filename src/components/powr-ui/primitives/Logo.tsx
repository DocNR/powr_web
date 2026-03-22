import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function Logo({ width = 160, height = 54, className, priority = false }: LogoProps) {
  return (
    <Image
      src="/assets/logos/logo-full-transparent-nobuffer.png"
      alt="POWR"
      width={width}
      height={height}
      priority={priority}
      className={cn('object-contain', className)}
    />
  );
}
