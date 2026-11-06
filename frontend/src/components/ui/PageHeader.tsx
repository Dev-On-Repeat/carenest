import React from 'react';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  lede?: string;
  actions?: React.ReactNode;
  as?: 'h1' | 'div';
  className?: string;
}

/** Editorial header used by every module so page titles never compete. */
export const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, lede, actions, as = 'h1', className }) => (
  <header
    className={cn(
      'cn-page-header flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between',
      className
    )}
  >
    <div className="min-w-0 space-y-1.5">
      {eyebrow && <p className="cn-eyebrow">{eyebrow}</p>}
      {as === 'h1' ? (
        <h1 className="cn-title">{title}</h1>
      ) : (
        <div className="cn-title" role="heading" aria-level={1}>{title}</div>
      )}
      {lede && <p className="cn-lede mt-2">{lede}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
  </header>
);
