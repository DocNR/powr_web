'use client';

import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
        gradient: "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700",
        "workout-primary": "bg-[var(--workout-primary)] text-white hover:bg-[var(--workout-primary)]/90",
        "workout-success": "bg-[var(--workout-success)] text-white hover:bg-[var(--workout-success)]/90",
        "workout-timer": "bg-[var(--workout-timer)] text-white hover:bg-[var(--workout-timer)]/90",
        "workout-interactive": "text-[var(--workout-primary)] hover:text-[var(--workout-primary)]/80 hover:bg-[var(--workout-primary)]/10",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
        tab: "h-12 px-3 min-h-[44px]", // Touch-optimized for mobile tabs
      },
      gymPersonality: {
        default: "",
        hardcore: "font-black uppercase tracking-wide shadow-2xl border-2",
        zen: "rounded-full font-light shadow-none",
        corporate: "font-semibold rounded-sm",
        boutique: "font-medium italic rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      gymPersonality: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, gymPersonality, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, gymPersonality, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
