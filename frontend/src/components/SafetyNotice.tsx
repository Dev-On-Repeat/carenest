import React from 'react';
import { ShieldAlert } from 'lucide-react';

/** The clinical-boundary notice used wherever OCR or identification is shown.
 *  Copy comes from i18n so the disclaimer stays truthful in both languages. */
export const SafetyNotice: React.FC<{ heading: string; body: string }> = ({ heading, body }) => (
  <div className="cn-notice" role="note">
    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-brass" />
    <div className="min-w-0">
      <p className="text-body font-semibold text-ink">{heading}</p>
      <p className="mt-1 text-micro leading-relaxed text-ink-soft">{body}</p>
    </div>
  </div>
);
