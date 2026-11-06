import React from 'react';
import { cn } from '../../lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  indicatorColor?: string;
  label?: string;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, indicatorColor = 'bg-teal', label = 'Progress', ...props }, ref) => {
    const clamped = Math.min(100, Math.max(0, value || 0));
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-label={label}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn('h-2 w-full overflow-hidden rounded-pill bg-paper-sunken', className)}
        {...props}
      >
        <div
          className={cn('h-full rounded-pill transition-[width] duration-500 ease-out', indicatorColor)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';
