import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/** Status is communicated with a dot + words, never colour alone. */
export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-micro font-semibold whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-teal text-white',
        neutral: 'bg-paper-sunken text-ink-soft',
        outline: 'border border-line bg-transparent text-ink-soft',
        mint: 'bg-teal-wash text-teal-deep',
        brass: 'bg-brass-wash text-brass',
        success: 'bg-leaf-wash text-leaf',
        warning: 'bg-brass-wash text-brass',
        destructive: 'bg-coral-wash text-coral-deep',
      },
    },
    defaultVariants: { variant: 'neutral' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
