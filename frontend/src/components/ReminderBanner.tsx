import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BellRing, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReminders } from '../context/ReminderContext';
import { translations } from '../i18n/translations';
import { Button } from './ui/Button';
import { useMotionPresets } from '../lib/motion';

/** Surfaces the dose the reminder engine flagged as due — the reason the chime fired. */
export const ReminderBanner: React.FC = () => {
  const { language } = useAuth();
  const { activeReminder, markAsTaken, markAsSnoozed, dismissActiveReminder } = useReminders();
  const { reduced } = useMotionPresets();
  const t = translations[language];

  return (
    <AnimatePresence>
      {activeReminder && (
        <motion.div
          role="alert"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-4 top-4 z-[60] lg:left-auto lg:right-6 lg:w-[448px]"
        >
          <div className="cn-panel border-coral/40 p-4 shadow-raised">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-coral-wash text-coral">
                <BellRing className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="cn-eyebrow text-coral-deep">{t.dueNow}</p>
                <p className="mt-0.5 break-words text-body font-semibold text-ink">
                  {activeReminder.medicine_name}
                </p>
                <p className="text-micro tabular text-ink-mute">
                  {activeReminder.dosage} · scheduled {activeReminder.scheduled_time}
                </p>
              </div>
              <button
                onClick={dismissActiveReminder}
                aria-label="Dismiss this reminder"
                className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-faint hover:bg-paper-sunken hover:text-ink cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => markAsTaken(activeReminder.medicine_id, activeReminder.scheduled_time)}
              >
                {t.taken}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={() => markAsSnoozed(activeReminder.medicine_id, activeReminder.scheduled_time)}
              >
                {t.remindLater}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
