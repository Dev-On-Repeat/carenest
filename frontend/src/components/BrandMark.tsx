import React from 'react';
import { cn } from '../lib/utils';

/** Wordmark + monogram. The mark is a nest arc holding a dose — drawn inline so
 *  it stays crisp at every size and needs no icon font. */
export const BrandMark: React.FC<{ compact?: boolean; className?: string }> = ({ compact, className }) => (
  <span className={cn('cn-brand flex items-center gap-2.5', className)}>
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-ink text-paper-cool">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
        <path d="M4 14.5c0-3.6 3.6-6.5 8-6.5s8 2.9 8 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M6.5 18.5c1.4-1.9 3.2-2.9 5.5-2.9s4.1 1 5.5 2.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="12" cy="11.6" r="2.4" fill="#C3CAA5" />
      </svg>
    </span>
    {!compact && (
      <span className="min-w-0 leading-tight">
        <span className="block font-display text-[1.5rem] font-medium tracking-tight text-ink">CareNest</span>
        <span className="block text-eyebrow font-semibold uppercase text-teal">Daily care, together</span>
      </span>
    )}
  </span>
);
