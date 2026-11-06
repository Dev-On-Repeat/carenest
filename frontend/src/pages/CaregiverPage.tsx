import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Phone, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { CaregiverPatientSummary, SOSEvent, DoseSlot } from '../types';
import { useAuth } from '../context/AuthContext';
import { translations } from '../i18n/translations';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import { useFeedback } from '../components/ui/Feedback';
import { useMotionPresets } from '../lib/motion';
import { cn } from '../lib/utils';

const DEMO_LINK_CODE = 'RAMA-7890';

export const CaregiverPage: React.FC = () => {
  const { user, language, demoLogin } = useAuth();
  const { toast } = useFeedback();
  const { fadeUp } = useMotionPresets();
  const t = translations[language];

  const [patients, setPatients] = useState<CaregiverPatientSummary[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SOSEvent[]>([]);
  const [code, setCode] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [schedule, setSchedule] = useState<DoseSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkError, setLinkError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [people, alerts] = await Promise.all([api.caregiver.listPatients(), api.sos.getEvents()]);
      setPatients(people);
      setSosAlerts(alerts);
      setSelectedId(prev => (prev && people.some(p => p.elderly_id === prev) ? prev : people[0]?.elderly_id ?? null));
    } catch (err: any) {
      toast(err?.message || 'We could not load the care circle.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!selectedId) {
      setSchedule([]);
      return;
    }
    let cancelled = false;
    api.caregiver
      .getPatientSchedule(selectedId)
      .then(data => !cancelled && setSchedule(data))
      .catch(() => !cancelled && setSchedule([]));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const handleLink = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLinkError(null);
    try {
      const res = await api.caregiver.link(trimmed);
      toast(res.message || 'Patient linked', 'success');
      setCode('');
      load();
    } catch (err: any) {
      setLinkError(err?.message || 'That code did not match any patient.');
    }
  };

  const handleResolveSOS = async (sosId: number) => {
    try {
      await api.sos.resolve(sosId);
      toast('Emergency alert marked as resolved', 'success');
      load();
    } catch (err: any) {
      toast(err?.message || 'We could not resolve that alert.', 'error');
    }
  };

  const activeAlerts = sosAlerts.filter(a => a.status === 'triggered');
  const selected = patients.find(p => p.elderly_id === selectedId) ?? null;

  return (
    <div className="mx-auto max-w-[1120px] space-y-6">
      <PageHeader
        eyebrow="Care circle"
        title={t.caregiverTitle}
        lede={t.caregiverSubtitle}
        actions={
          user?.role !== 'caregiver' ? (
            <Button variant="secondary" className="h-auto min-h-11 whitespace-normal py-3" onClick={() => demoLogin('caregiver')}>
              Sign in as demo caregiver
            </Button>
          ) : undefined
        }
      />

      {activeAlerts.length > 0 && (
        <motion.div {...fadeUp}>
          <Card className="border-coral/40 bg-coral-wash">
            <CardContent className="space-y-3 py-5">
              <p className="flex items-center gap-2 text-body font-semibold uppercase tracking-wider text-coral-deep">
                <span className="h-2 w-2 rounded-full bg-coral" />
                {activeAlerts.length} emergency alert{activeAlerts.length === 1 ? '' : 's'} open
              </p>
              <ul className="divide-y divide-coral/20">
                {activeAlerts.map(alert => (
                  <li key={alert.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-body font-semibold text-ink">{alert.user_name || 'Elderly patient'}</p>
                      <p className="mt-0.5 text-micro text-ink-soft tabular">
                        Triggered {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {alert.notes ? ` · ${alert.notes}` : ''}
                      </p>
                      {alert.external_notified && (
                        <p className="mt-1 text-micro italic text-coral-deep">{alert.notice}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {alert.user_name && (
                        <a
                          href="tel:"
                          className="inline-flex h-9 items-center gap-1.5 rounded-control border border-coral/35 bg-paper-cool px-3 text-micro font-semibold text-coral-deep hover:bg-white"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          Call
                        </a>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => handleResolveSOS(alert.id)}>
                        {t.resolveAlert}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pairing */}
        <Card className="min-w-0 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-4 w-4 text-teal" />
              {t.linkPatient}
            </CardTitle>
            <CardDescription>
              Use the code shared by the person you care for.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={handleLink} className="space-y-3">
              <label htmlFor="link-code" className="cn-field-label">
                {t.enterCode}
              </label>
              <input
                id="link-code"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder={DEMO_LINK_CODE}
                autoComplete="off"
                className="cn-input font-semibold uppercase tracking-[0.12em]"
              />
              {linkError && (
                <p className="rounded-control border border-coral/30 bg-coral-wash px-3 py-2 text-micro font-semibold text-coral-deep" role="alert">
                  {linkError}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={!code.trim()}>
                {t.linkButton}
              </Button>
            </form>

            <div className="rounded-panel border border-line bg-paper px-3.5 py-3">
              <p className="text-micro leading-relaxed text-ink-soft">
                <span className="font-semibold text-ink">Demonstration data: </span>
                link the sample patient with code{' '}
                <button
                  type="button"
                  onClick={() => setCode(DEMO_LINK_CODE)}
                  className="rounded bg-paper-cool px-1.5 py-0.5 font-semibold tracking-[0.1em] text-teal-deep underline decoration-teal/30 cursor-pointer hover:decoration-teal"
                >
                  {DEMO_LINK_CODE}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Patients */}
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
            <h2 className="font-display text-section font-medium text-ink">
              {t.linkedPatients}
            </h2>
            <p className="text-micro tabular text-ink-mute">{patients.length} followed</p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1].map(i => (
                <div key={i} className="cn-panel p-5">
                  <div className="cn-skeleton h-5 w-1/3" />
                  <div className="cn-skeleton mt-3 h-3 w-1/2" />
                  <div className="cn-skeleton mt-5 h-2 w-full" />
                </div>
              ))}
            </div>
          ) : patients.length === 0 ? (
            <div className="cn-empty">
              <Users className="h-8 w-8 text-ink-faint" />
              <h3 className="mt-1 font-display text-lg font-medium text-ink">No one is linked yet</h3>
              <p className="max-w-sm text-body text-ink-mute">
                Use the code your family member reads out to you, and their day will appear here.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {patients.map(patient => {
                const isSelected = patient.elderly_id === selectedId;
                return (
                  <motion.li key={patient.elderly_id} {...fadeUp}>
                    <Card
                      className={cn('cursor-pointer transition-shadow hover:shadow-panel', isSelected && 'border-teal/50')}
                      onClick={() => setSelectedId(patient.elderly_id)}
                    >
                      <CardContent className="py-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-display text-lg font-medium text-ink">{patient.full_name}</h3>
                              {patient.sos_active && <Badge variant="destructive" dot>SOS open</Badge>}
                            </div>
                            <p className="mt-1 text-micro text-ink-mute tabular">
                              {patient.active_medicines_count} active medicines · last action{' '}
                              {patient.last_action
                                ? `${patient.last_action.toLowerCase()} at ${
                                    patient.last_action_time
                                      ? new Date(patient.last_action_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                      : '--:--'
                                  }`
                                : 'not recorded today'}
                            </p>
                          </div>

                          <div className="w-full max-w-[190px]">
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="cn-eyebrow">{t.adherenceRate}</p>
                              <p className="font-display text-lg font-medium tabular text-teal-deep">
                                {patient.today_adherence_percent}%
                              </p>
                            </div>
                            <Progress
                              className="mt-1.5"
                              value={patient.today_adherence_percent}
                              label={`${patient.full_name} adherence today`}
                              indicatorColor={
                                patient.today_adherence_percent >= 75
                                  ? 'bg-leaf'
                                  : patient.today_adherence_percent >= 40
                                  ? 'bg-brass'
                                  : 'bg-coral'
                              }
                            />
                            {patient.missed_doses_today > 0 && (
                              <p className="mt-1.5 text-micro font-semibold text-coral-deep">
                                {patient.missed_doses_today} missed today
                              </p>
                            )}
                          </div>
                        </div>

                        {(patient.emergency_phone || isSelected) && (
                          <div className="mt-4 space-y-4 border-t border-line pt-4">
                            {patient.emergency_phone && (
                              <a
                                href={`tel:${patient.emergency_phone}`}
                                className="inline-flex items-center gap-2 text-micro font-semibold text-teal-deep hover:underline"
                              >
                                <Phone className="h-4 w-4" />
                                {patient.emergency_phone}
                              </a>
                            )}

                            {isSelected && (
                              <div>
                                <p className="cn-eyebrow mb-2">Today for {patient.full_name}</p>
                                {schedule.length === 0 ? (
                                  <p className="text-micro italic text-ink-faint">
                                    No doses are scheduled for this patient today.
                                  </p>
                                ) : (
                                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    {schedule.map(slot => (
                                      <li
                                        key={`${slot.medicine_id}-${slot.scheduled_time}`}
                                        className="flex min-w-0 items-center justify-between gap-3 rounded-control border border-line bg-paper px-3 py-2"
                                      >
                                        <span className="min-w-0 flex-1">
                                          <span className="block break-words text-micro font-semibold text-ink">
                                            {slot.medicine_name}
                                          </span>
                                          <span className="block text-micro tabular text-ink-mute">
                                            {slot.scheduled_time} · {slot.dosage}
                                          </span>
                                        </span>
                                        <span
                                          className={cn(
                                            'shrink-0 text-micro font-semibold capitalize',
                                            slot.status === 'taken'
                                              ? 'text-leaf'
                                              : slot.status === 'due'
                                              ? 'text-coral'
                                              : 'text-ink-faint'
                                          )}
                                        >
                                          {slot.status === 'taken' ? (
                                            <CheckCircle2 className="h-4 w-4" />
                                          ) : slot.status === 'due' ? (
                                            <Clock className="h-4 w-4" />
                                          ) : (
                                            slot.status
                                          )}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.li>
                );
              })}
            </ul>
          )}

          <p className="flex items-start gap-2 text-micro leading-relaxed text-ink-faint">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
            You are seeing this person&rsquo;s medication routine because they shared their link code with you. Please
            use it to help, not to monitor anything else.
          </p>
        </div>
      </div>
    </div>
  );
};
