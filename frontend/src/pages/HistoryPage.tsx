import React, { useState, useEffect, useMemo } from 'react';
import { Download, CheckCircle2, Clock, AlertCircle, ScrollText } from 'lucide-react';
import { api } from '../services/api';
import { MedicationEvent } from '../types';
import { useAuth } from '../context/AuthContext';
import { translations } from '../i18n/translations';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useFeedback } from '../components/ui/Feedback';
import { cn } from '../lib/utils';

type Filter = '' | 'taken' | 'snoozed' | 'missed';

const FILTERS: { id: Filter; label: string }[] = [
  { id: '', label: 'All activity' },
  { id: 'taken', label: 'Taken' },
  { id: 'snoozed', label: 'Snoozed' },
  { id: 'missed', label: 'Missed' },
];

const STATUS_ICON = { taken: CheckCircle2, snoozed: Clock, missed: AlertCircle } as const;

/** Group events by calendar day so the log reads like a diary. */
const dayKey = (iso: string) => new Date(iso).toDateString();

export const HistoryPage: React.FC = () => {
  const { language } = useAuth();
  const { toast } = useFeedback();
  const t = translations[language];

  const [events, setEvents] = useState<MedicationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setEvents(await api.events.getHistory(filter || undefined));
    } catch (err: any) {
      setError(err?.message || 'We could not load your history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, MedicationEvent[]>();
    events.forEach(event => {
      const key = dayKey(event.action_time);
      const bucket = map.get(key) ?? [];
      bucket.push(event);
      map.set(key, bucket);
    });
    return [...map.entries()].sort(
      (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  }, [events]);

  const summary = useMemo(() => {
    const taken = events.filter(e => e.status === 'taken').length;
    const snoozed = events.filter(e => e.status === 'snoozed').length;
    const missed = events.filter(e => e.status === 'missed').length;
    return { taken, snoozed, missed };
  }, [events]);

  const exportCSV = () => {
    if (events.length === 0) return;
    const headers = ['Medicine', 'Scheduled time', 'Recorded at', 'Status', 'Source', 'Notes'];
    const escape = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
    const rows = events.map(event => [
      escape(event.medicine?.name ?? 'Prescription medicine'),
      escape(event.scheduled_time),
      escape(new Date(event.action_time).toLocaleString()),
      escape(event.status.toUpperCase()),
      escape(event.device_source),
      escape(event.notes ?? ''),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `carenest_history_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast(`Exported ${events.length} records as CSV`, 'success');
  };

  return (
    <div className="mx-auto max-w-[900px] space-y-6">
      <PageHeader
        eyebrow="Records"
        title={t.navHistory}
        lede="Every dose you confirm is written here, with the time it was recorded."
        actions={
          <Button variant="secondary" onClick={exportCSV} disabled={events.length === 0}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      {/* Counts for the loaded window */}
      {!loading && events.length > 0 && (
        <dl className="grid grid-cols-3 gap-3 border-b border-line pb-5">
          {(
            [
              { label: 'Taken', value: summary.taken, tone: 'text-leaf' },
              { label: 'Snoozed', value: summary.snoozed, tone: 'text-brass' },
              { label: 'Missed', value: summary.missed, tone: 'text-coral' },
            ] as const
          ).map(stat => (
            <div key={stat.label}>
              <dt className="cn-eyebrow">{stat.label}</dt>
              <dd className={cn('mt-1 font-display text-digit font-medium tabular', stat.tone)}>{stat.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="cn-segment" role="group" aria-label="Filter history">
        {FILTERS.map(option => (
          <button
            key={option.id || 'all'}
            onClick={() => setFilter(option.id)}
            data-active={filter === option.id}
            aria-pressed={filter === option.id}
            className="cn-segment-item"
          >
            {option.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="cn-notice" role="alert">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-coral" />
          <p className="flex-1 text-body font-semibold">{error}</p>
          <Button size="sm" variant="secondary" onClick={load}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map(i => (
            <div key={i} className="cn-panel p-4">
              <div className="cn-skeleton h-4 w-1/3" />
              <div className="cn-skeleton mt-3 h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : grouped.length === 0 && !error ? (
        <div className="cn-empty">
          <ScrollText className="h-8 w-8 text-ink-faint" />
          <h2 className="mt-1 font-display text-section font-medium text-ink">No medication history yet</h2>
          <p className="max-w-md text-body text-ink-mute">
            When you mark a dose as taken or snoozed, that record appears here — and can be exported for your doctor.
          </p>
        </div>
      ) : (
        <div className="space-y-7">
          {grouped.map(([day, dayEvents]) => (
            <section key={day}>
              <div className="mb-3 flex items-baseline justify-between gap-4 border-b border-line pb-2">
                <h2 className="font-display text-lg font-medium text-ink">
                  {new Date(day).toLocaleDateString(undefined, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </h2>
                <p className="text-micro tabular text-ink-mute">
                  {dayEvents.length} record{dayEvents.length === 1 ? '' : 's'}
                </p>
              </div>

              <Card>
                <CardContent className="divide-y divide-line px-0 py-0">
                  {dayEvents.map(event => {
                    const Icon = STATUS_ICON[event.status as keyof typeof STATUS_ICON] ?? Clock;
                    const tone =
                      event.status === 'taken'
                        ? 'text-leaf'
                        : event.status === 'snoozed'
                        ? 'text-brass'
                        : 'text-coral';
                    return (
                      <div
                        key={event.id}
                        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-paper sm:px-6"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Icon className={cn('h-4 w-4 shrink-0', tone)} />
                          <div className="min-w-0">
                            <p className="truncate text-body font-semibold text-ink">
                              {event.medicine?.name || 'Prescription medicine'}
                            </p>
                            <p className="text-micro tabular text-ink-mute">
                              Due {event.scheduled_time} · recorded{' '}
                              {new Date(event.action_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {' · via '}
                              <span className="font-semibold text-ink-soft">{event.device_source}</span>
                            </p>
                            {event.notes && (
                              <p className="mt-0.5 text-micro italic text-ink-faint">“{event.notes}”</p>
                            )}
                          </div>
                        </div>
                        <p className={cn('shrink-0 text-micro font-semibold uppercase tracking-wider', tone)}>
                          {event.status}
                        </p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
