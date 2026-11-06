import React from 'react';
import { CheckCircle2, Clock, BellRing } from 'lucide-react';
import { DoseSlot } from '../types';
import { useAuth } from '../context/AuthContext';
import { useReminders } from '../context/ReminderContext';
import { translations } from '../i18n/translations';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

const STATUS_LABEL: Record<string, string> = {
  taken: 'Taken',
  due: 'Due now',
  upcoming: 'Upcoming',
  snoozed: 'Snoozed',
  missed: 'Missed',
};

/** One chronological column: time on the rail, dose on the right. */
export const DoseTimeline: React.FC<{ slots: DoseSlot[]; limit?: number }> = ({ slots, limit }) => {
  const { language } = useAuth();
  const { markAsTaken, markAsSnoozed } = useReminders();
  const t = translations[language];

  const visible = limit ? slots.slice(0, limit) : slots;

  return (
    <ol className="relative">
      {visible.map((slot, index) => {
        const taken = slot.status === 'taken';
        const due = slot.status === 'due';
        const last = index === visible.length - 1;

        return (
          <li key={`${slot.medicine_id}-${slot.scheduled_time}-${index}`} className="relative flex gap-4 pb-5 last:pb-0">
            {!last && (
              <span aria-hidden className="absolute left-[7px] top-6 h-full w-px bg-line" />
            )}

            <span
              aria-hidden
              className={cn(
                'relative z-10 mt-2 h-[15px] w-[15px] shrink-0 rounded-full border-2 bg-paper-cool',
                taken && 'border-leaf bg-leaf',
                due && 'border-coral bg-coral',
                !taken && !due && 'border-ink-faint'
              )}
            />

            <div
              className={cn(
                'min-w-0 flex-1 rounded-panel border px-4 py-3.5 transition-colors',
                due ? 'border-coral/35 bg-coral-wash' : taken ? 'border-line bg-paper' : 'border-line bg-paper-cool'
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-body font-semibold text-ink">{slot.medicine_name}</p>
                  <p className="mt-0.5 text-micro text-ink-mute tabular">
                    {slot.dosage}
                    {slot.strength ? ` · ${slot.strength}` : ''} · {STATUS_LABEL[slot.status] ?? slot.status}
                  </p>
                </div>

                <span className="shrink-0 font-display text-lg font-medium text-ink tabular">
                  {slot.scheduled_time}
                </span>
              </div>

              {!taken && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant={due ? 'default' : 'secondary'} onClick={() => markAsTaken(slot.medicine_id, slot.scheduled_time)}>
                    <CheckCircle2 className="h-4 w-4" />
                    {t.taken}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => markAsSnoozed(slot.medicine_id, slot.scheduled_time)}>
                    <BellRing className="h-4 w-4" />
                    {t.remindLater}
                  </Button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};
