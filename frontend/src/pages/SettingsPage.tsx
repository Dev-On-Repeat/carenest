import React, { useState, useEffect } from 'react';
import { Type, Globe, Volume2, Bell, Cpu, Database, ShieldCheck, LogOut, Check, CircleDot } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReminders } from '../context/ReminderContext';
import { translations } from '../i18n/translations';
import { api } from '../services/api';
import { TextSize } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Toggle } from '../components/Toggle';
import { Badge } from '../components/ui/Badge';
import { useFeedback } from '../components/ui/Feedback';
import { cn } from '../lib/utils';

const SIZE_OPTIONS: { id: TextSize; labelKey: 'textSizeNormal' | 'textSizeLarge' | 'textSizeXLarge'; sample: string }[] = [
  { id: 'normal', labelKey: 'textSizeNormal', sample: 'text-[0.95rem]' },
  { id: 'large', labelKey: 'textSizeLarge', sample: 'text-[1.1rem] font-semibold' },
  { id: 'xlarge', labelKey: 'textSizeXLarge', sample: 'text-[1.3rem] font-semibold' },
];

export const SettingsPage: React.FC = () => {
  const { user, language, textSize, soundEnabled, setLanguage, setTextSize, setSoundEnabled, logout } = useAuth();
  const { requestNotificationPermission, isOnline, refreshSchedule } = useReminders();
  const { toast, confirm } = useFeedback();
  const t = translations[language];

  const [hardware, setHardware] = useState<any>(null);
  const [notificationState, setNotificationState] = useState<string>(() =>
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );
  const [busyButton, setBusyButton] = useState<string | null>(null);

  const loadHardware = async () => {
    try {
      setHardware(await api.hardware.getStatus());
    } catch (_) {
      setHardware(null);
    }
  };

  useEffect(() => {
    loadHardware();
  }, []);

  const simulateButton = async (button: 'TAKEN' | 'REMIND_LATER' | 'SOS') => {
    setBusyButton(button);
    try {
      const res = await api.hardware.triggerButton(button);
      toast(`Smart box responded to ${button}: LED ${res.led_state}`, 'success');
      await Promise.all([loadHardware(), refreshSchedule()]);
    } catch (err: any) {
      toast(err?.message || 'The hardware endpoint did not answer.', 'error');
    } finally {
      setBusyButton(null);
    }
  };

  const askNotifications = async () => {
    const granted = await requestNotificationPermission();
    const next = typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
    setNotificationState(next);
    toast(
      granted
        ? 'Browser notifications are on for this tab.'
        : next === 'denied'
        ? 'Notifications are blocked in your browser settings — reminders will still chime here.'
        : 'We could not switch notifications on.',
      granted ? 'success' : 'info'
    );
  };

  const resetDemoData = async () => {
    const ok = await confirm({
      title: 'Reset demonstration data?',
      body: 'This rewrites the sample patient records for demonstration. Any medicine you added yourself during this session may be removed.',
      confirmLabel: 'Reset demo data',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.demo.seed();
      toast('Demonstration records restored', 'success');
      refreshSchedule();
    } catch (err: any) {
      toast(err?.message || 'The reset failed.', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-[760px] space-y-6">
      <PageHeader eyebrow="Comfort" title={t.settingsTitle} lede="Make CareNest easier to read, hear and trust." />

      {/* Legibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Type className="h-4 w-4 text-teal" />
            {t.textSize}
          </CardTitle>
          <CardDescription>Pick the size that lets you read without leaning in.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <fieldset>
            <legend className="sr-only">{t.textSize}</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {SIZE_OPTIONS.map(option => (
                <label
                  key={option.id}
                  className={cn(
                    'cursor-pointer rounded-panel border px-4 py-4 text-center transition-colors',
                    textSize === option.id
                      ? 'border-teal bg-teal-wash'
                      : 'border-line bg-paper-cool hover:border-ink-faint'
                  )}
                >
                  <input
                    type="radio"
                    name="text-size"
                    className="sr-only"
                    checked={textSize === option.id}
                    onChange={() => setTextSize(option.id)}
                  />
                  <span className={cn('block text-ink', option.sample)}>Aa</span>
                  <span className="mt-2 block text-micro font-semibold text-ink-soft">{t[option.labelKey]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <Globe className="h-4 w-4 text-teal" />
              <div>
                <p className="text-body font-semibold text-ink">{t.languageSetting}</p>
                <p className="text-micro text-ink-mute">English or తెలుగు across the whole app.</p>
              </div>
            </div>
            <div className="cn-segment" role="group" aria-label="Language">
              <button onClick={() => setLanguage('en')} data-active={language === 'en'} aria-pressed={language === 'en'} className="cn-segment-item">
                English
              </button>
              <button onClick={() => setLanguage('te')} data-active={language === 'te'} aria-pressed={language === 'te'} className="cn-segment-item">
                తెలుగు
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Volume2 className="h-4 w-4 text-teal" />
            Reminders
          </CardTitle>
          <CardDescription>How CareNest gets your attention when a dose is due.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Toggle
            checked={soundEnabled}
            onChange={setSoundEnabled}
            label={t.soundSetting}
            description="A short two-note chime when a dose is due, and a soft tick when you record one."
          />

          <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <Bell className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
              <div>
                <p className="text-body font-semibold text-ink">Browser notifications</p>
                <p className="text-micro text-ink-mute">
                  Status:{' '}
                  <span className="font-semibold text-ink-soft capitalize">{notificationState}</span>
                  {' '}· alerts only while this tab is open.
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={askNotifications}
              disabled={notificationState === 'granted' || notificationState === 'unsupported'}
            >
              {notificationState === 'granted' ? (
                <>
                  <Check className="h-4 w-4" /> Enabled
                </>
              ) : notificationState === 'unsupported' ? (
                'Not supported here'
              ) : (
                'Turn on'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <details className="cn-settings-advanced">
        <summary>{language === 'en' ? 'Prototype device tools' : 'ప్రోటోటైప్ పరికర సాధనాలు'}</summary>
      {/* Smart box */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Cpu className="h-4 w-4 text-teal" />
            Smart box hardware
          </CardTitle>
          <CardDescription>
            The physical buttons on the prototype box map to these three actions. Use them to demonstrate the wiring
            without pressing real GPIO keys.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-panel border border-line bg-paper px-4 py-3">
            <CircleDot className={cn('h-4 w-4', hardware ? 'text-leaf' : 'text-ink-faint')} />
            {hardware ? (
              <>
                <Badge variant={hardware.is_raspberry_pi ? 'success' : 'brass'} dot>
                  {hardware.is_raspberry_pi ? 'Raspberry Pi GPIO' : 'Simulation / laptop demo'}
                </Badge>
                <span className="text-micro tabular text-ink-mute">
                  LED {hardware.led_indicator} · buzzer {hardware.buzzer ? 'on' : 'off'} · last button{' '}
                  {hardware.last_event?.button ?? 'none yet'}
                </span>
              </>
            ) : (
              <span className="text-micro text-ink-mute">
                Hardware endpoint not reachable right now — start the backend to demonstrate it.
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                { id: 'TAKEN', pin: 'GPIO 17', result: 'LED turns green', tone: 'leaf' },
                { id: 'REMIND_LATER', pin: 'GPIO 27', result: 'LED pulses yellow', tone: 'brass' },
                { id: 'SOS', pin: 'GPIO 22', result: 'Red light and buzzer', tone: 'coral' },
              ] as const
            ).map(item => (
              <button
                key={item.id}
                onClick={() => simulateButton(item.id)}
                disabled={busyButton !== null}
                className={cn(
                  'rounded-panel border px-4 py-4 text-left transition-all hover:-translate-y-0.5 disabled:opacity-60 cursor-pointer',
                  item.tone === 'leaf' && 'border-leaf/30 bg-leaf-wash hover:border-leaf/50',
                  item.tone === 'brass' && 'border-brass/30 bg-brass-wash hover:border-brass/50',
                  item.tone === 'coral' && 'border-coral/30 bg-coral-wash hover:border-coral/50'
                )}
              >
                <p className="text-micro font-semibold uppercase tracking-wider text-ink-mute">{item.pin}</p>
                <p className="mt-1 text-body font-semibold text-ink">
                  {busyButton === item.id ? 'Firing…' : item.id.replace('_', ' ')}
                </p>
                <p className="mt-1 text-micro text-ink-soft">{item.result}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      </details>

      {/* Where data lives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-4 w-4 text-teal" />
            {t.storageSection}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-panel border border-line bg-paper p-4">
              <p className="flex items-center gap-2 text-body font-semibold text-ink">
                <Check className="h-4 w-4 text-leaf" />
                On this device
              </p>
              <p className="mt-2 text-micro leading-relaxed text-ink-soft">{t.storageLocalNote}</p>
              <p className="mt-2 text-micro font-semibold tabular text-ink-mute">
                Now: <span className="text-ink">{isOnline ? 'online' : 'offline'}</span>
              </p>
            </div>
            <div className="rounded-panel border border-line bg-paper p-4">
              <p className="flex items-center gap-2 text-body font-semibold text-ink">
                <ShieldCheck className="h-4 w-4 text-teal" />
                On the server
              </p>
              <p className="mt-2 text-micro leading-relaxed text-ink-soft">{t.storageCloudNote}</p>
              <p className="mt-2 text-micro font-semibold uppercase tracking-wider text-ink-mute">
                Role: <span className="text-ink">{user?.role}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-body font-semibold text-ink">Restore demonstration data</p>
              <p className="text-micro text-ink-mute">Puts the sample patients and prescriptions back to their starting state.</p>
            </div>
            <Button variant="secondary" onClick={resetDemoData}>
              {t.resetDemoData}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-2 pb-4">
        <Button variant="ghost" onClick={logout} className="gap-2 text-coral-deep hover:bg-coral-wash">
          <LogOut className="h-4 w-4" />
          {t.navLogout}
        </Button>
        {user?.email && <p className="max-w-full break-all text-center text-micro text-ink-mute">{user.email}</p>}
      </div>
    </div>
  );
};
