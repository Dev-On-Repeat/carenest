import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, Sun, Utensils, Coffee, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReminders } from '../context/ReminderContext';
import { translations } from '../i18n/translations';
import { api } from '../services/api';
import { Medicine } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { DoseTimeline } from '../components/DoseTimeline';
import { useMotionPresets } from '../lib/motion';
import { cn } from '../lib/utils';

type View = 'today' | 'week' | 'upcoming';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const UPCOMING_DAYS = 7;

/** Bucket a 24-hour time into the part of day your doctor wrote it under. */
const bucketFor = (time: string) => {
  const hour = Number(time.split(':')[0]);
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
};

const BUCKETS: { key: string; label: string; icon: typeof Sun }[] = [
  { key: 'morning', label: 'Morning', icon: Sun },
  { key: 'afternoon', label: 'Afternoon', icon: Utensils },
  { key: 'evening', label: 'Evening', icon: Coffee },
  { key: 'night', label: 'Night', icon: Moon },
];

export const SchedulePage: React.FC = () => {
  const { language } = useAuth();
  const { todaySchedule } = useReminders();
  const { fadeUp } = useMotionPresets();
  const t = translations[language];

  const [view, setView] = useState<View>('today');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loadingMeds, setLoadingMeds] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.medicines
      .list('', true)
      .then(data => !cancelled && setMedicines(data))
      .catch(() => !cancelled && setMedicines([]))
      .finally(() => !cancelled && setLoadingMeds(false));
    return () => {
      cancelled = true;
    };
  }, []);

  /* Week view runs to Sunday; upcoming view is a rolling seven-day horizon. */
  const days = useMemo(() => {
    const start = new Date();
    const last = view === 'week' ? 6 - ((start.getDay() + 6) % 7) : UPCOMING_DAYS - 1;
    const list: Date[] = [];
    for (let i = 0; i <= last; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      list.push(d);
    }
    return list;
  }, [view]);

  /** Prescriptions recur daily inside their date window — nothing else is assumed. */
  const dosesForDate = (date: Date) => {
    const iso = date.toISOString().split('T')[0];
    const rows: { time: string; med: Medicine }[] = [];
    medicines.forEach(med => {
      if (med.start_date && iso < med.start_date) return;
      if (med.end_date && iso > med.end_date) return;
      med.scheduled_times
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .forEach(time => rows.push({ time, med }));
    });
    return rows.sort((a, b) => a.time.localeCompare(b.time));
  };

  const takenCount = todaySchedule.filter(s => s.status === 'taken').length;
  const pendingCount = todaySchedule.length - takenCount;

  const lede =
    todaySchedule.length === 0
      ? 'No doses are scheduled for today.'
      : pendingCount === 0
      ? 'Every dose for today is recorded.'
      : `${takenCount} taken, ${pendingCount} still to come today.`;

  const views: { id: View; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This week' },
    { id: 'upcoming', label: 'Next 7 days' },
  ];

  return (
    <div className="mx-auto max-w-[1120px] space-y-6">
      <PageHeader
        eyebrow="Routine"
        title={t.navSchedule}
        lede={lede}
        actions={
          <div className="cn-segment" role="tablist" aria-label="Schedule view">
            {views.map(v => (
              <button
                key={v.id}
                role="tab"
                aria-selected={view === v.id}
                onClick={() => setView(v.id)}
                className="cn-segment-item"
              >
                {v.label}
              </button>
            ))}
          </div>
        }
      />

      {view === 'today' ? (
        <motion.div {...fadeUp}>
          {todaySchedule.length > 0 ? (
            <Card>
              <CardContent>
                <DoseTimeline slots={todaySchedule} />
              </CardContent>
            </Card>
          ) : (
            <div className="cn-empty">
              <CalendarClock className="h-8 w-8 text-ink-faint" />
              <h2 className="mt-1 font-display text-section font-medium text-ink">{t.noMedsTitle}</h2>
              <p className="max-w-md text-body text-ink-mute">{t.noRemindersToday}</p>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div {...fadeUp} className="space-y-5">
          {loadingMeds ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="cn-panel p-4">
                  <div className="cn-skeleton h-4 w-1/2" />
                  <div className="cn-skeleton mt-4 h-3 w-full" />
                  <div className="cn-skeleton mt-2 h-3 w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {days.map(date => {
                const rows = dosesForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();
                const dayIndex = (date.getDay() + 6) % 7;

                const grouped: Record<string, { time: string; med: Medicine }[]> = {};
                rows.forEach(r => (grouped[bucketFor(r.time)] ||= []).push(r));

                return (
                  <li
                    key={date.toISOString()}
                    className={cn(
                      'rounded-panel border bg-paper-cool p-4 transition-colors',
                      isToday && 'border-teal/45 bg-teal-tint'
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-micro font-semibold uppercase tracking-wider text-ink-mute">
                        {DAY_LABELS[dayIndex]}
                      </p>
                      <p className="font-display text-lg font-medium tabular text-ink">{date.getDate()}</p>
                    </div>
                    <p className="text-micro text-ink-faint">
                      {isToday
                        ? 'Today'
                        : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>

                    {rows.length === 0 ? (
                      <p className="mt-4 text-micro italic text-ink-faint">Rest day — no doses</p>
                    ) : (
                      <>
                        <p className="mt-3 text-micro font-semibold tabular text-teal-deep">
                          {rows.length} dose{rows.length === 1 ? '' : 's'}
                        </p>
                        <ul className="mt-3 space-y-3">
                          {BUCKETS.filter(b => grouped[b.key]?.length).map(bucket => (
                            <li key={bucket.key}>
                              <p className="flex items-center gap-1.5 text-micro font-semibold text-ink-mute">
                                <bucket.icon className="h-3.5 w-3.5" />
                                {bucket.label}
                              </p>
                              <ul className="mt-1 space-y-1">
                                {grouped[bucket.key].map(row => (
                                  <li
                                    key={`${row.med.id}-${row.time}`}
                                    className="flex items-baseline justify-between gap-2 text-micro"
                                  >
                                    <span className="min-w-0 truncate text-ink-soft">{row.med.name}</span>
                                    <span className="shrink-0 font-semibold tabular text-ink">{row.time}</span>
                                  </li>
                                ))}
                              </ul>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <p className="text-micro leading-relaxed text-ink-faint">
            Prescriptions repeat every day between their start and end dates. This outlook is built from your{' '}
            {medicines.length} active medicine{medicines.length === 1 ? '' : 's'} — change timings only when your doctor
            tells you to.
          </p>
        </motion.div>
      )}
    </div>
  );
};
