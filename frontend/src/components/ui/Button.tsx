import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * Single button language for the product.
 * `tactile` is the geriatric primary action (visible 3px press ledge).
 * Variants are intentionally few: primary, quiet, outline, danger, SOS.
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control font-semibold transition-all duration-150 ease-out cursor-pointer select-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-teal text-white shadow-press hover:bg-teal-deep hover:-translate-y-px active:translate-y-[2px] active:shadow-[0_1px_0_#244A38]',
        tactile:
          'bg-teal text-white shadow-press hover:bg-teal-deep active:translate-y-[2px] active:shadow-[0_1px_0_#244A38]',
        secondary:
          'border border-line bg-paper-cool text-ink hover:border-ink-faint hover:bg-white active:bg-paper-sunken',
        outline:
          'border border-ink/15 bg-transparent text-ink hover:border-teal hover:text-teal active:bg-teal-wash',
        ghost:
          'text-ink-soft hover:bg-paper-sunken hover:text-ink active:bg-paper-line',
        destructive:
          'bg-coral text-white shadow-press-coral hover:bg-[#cb4436] active:translate-y-[2px] active:shadow-[0_1px_0_#9C2C20]',
        sos:
          'bg-coral text-white shadow-press-coral hover:bg-[#cb4436] uppercase tracking-[0.08em] active:translate-y-[2px] active:shadow-[0_1px_0_#9C2C20]',
        mint: 'bg-teal-wash text-teal-deep border border-teal/20 hover:bg-mint-pale',
      },
      size: {
        default: 'h-11 px-5 text-body',
        sm: 'h-9 px-3.5 text-micro rounded-[10px]',
        lg: 'h-12 px-6 text-lead',
        xl: 'h-16 px-7 text-lead min-h-[64px] rounded-panel',
        icon: 'h-10 w-10 p-0',
        iconLg: 'h-12 w-12 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = 'Button';
