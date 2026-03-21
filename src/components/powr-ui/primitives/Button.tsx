'use client';

import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-[var(--radius)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border-none",
  {
    variants: {
      variant: {
        default: "text-[#0e0e0e] font-bold" ,
        destructive: "bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]/90",
        outline: "bg-[rgba(255,145,83,0.1)] text-[var(--color-primary)] font-semibold hover:bg-[rgba(255,145,83,0.15)]",
        secondary: "bg-[rgba(255,145,83,0.1)] text-[var(--color-primary)] font-semibold hover:bg-[rgba(255,145,83,0.15)]",
        ghost: "bg-transparent text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-on-surface)]",
        link: "underline-offset-4 hover:underline text-primary",
        gradient: "text-[#0e0e0e] font-bold",
        "primary-gradient": "text-[#0e0e0e] font-bold shadow-lg hover:shadow-xl transition-all duration-200",
        "workout-primary": "text-[#0e0e0e] font-bold",
        "workout-success": "bg-[var(--color-secondary)] text-white hover:bg-[var(--color-secondary)]/90",
        "workout-timer": "text-[#0e0e0e] font-bold",
        "workout-interactive": "text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 hover:bg-[rgba(255,145,83,0.1)]",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
        tab: "h-12 px-3 min-h-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const GRADIENT_VARIANTS = new Set(['default', 'gradient', 'primary-gradient', 'workout-primary', 'workout-timer']);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const useGradient = GRADIENT_VARIANTS.has(variant ?? 'default');
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={useGradient ? { background: 'linear-gradient(135deg, #ff9153 0%, #f06c0b 100%)', ...style } : style}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
