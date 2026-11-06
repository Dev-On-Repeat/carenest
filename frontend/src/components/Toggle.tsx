import React from 'react';
import { cn } from '../lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  id?: string;
}

/** Accessible switch: real checkbox under the hood, so space/enter work. */
export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, description, id }) => {
  const inputId = id ?? `toggle-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="flex items-center justify-between gap-5">
      <div className="min-w-0">
        <label htmlFor={inputId} className="block cursor-pointer text-body font-semibold text-ink">
          {label}
        </label>
        {description && <p className="mt-0.5 text-micro leading-snug text-ink-mute">{description}</p>}
      </div>
      <span className="relative shrink-0">
        <input
          id={inputId}
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          onClick={() => onChange(!checked)}
          className={cn(
            'block h-7 w-[52px] cursor-pointer rounded-pill border transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-teal',
            checked ? 'border-teal bg-teal' : 'border-line bg-paper-sunken'
          )}
        >
          <span
            className={cn(
              'mt-[3px] block h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-transform duration-200 ease-out',
              checked ? 'translate-x-[26px]' : 'translate-x-[3px]'
            )}
          />
        </span>
      </span>
    </div>
  );
};
