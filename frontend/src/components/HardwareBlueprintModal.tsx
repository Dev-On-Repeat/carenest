import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Box, Camera, Mic, Volume2, CheckCircle2, Clock, X, Layers, Wrench, TriangleAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReminders } from '../context/ReminderContext';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

type Tab = 'front' | 'internal' | 'cardboard';

const GPIO_MAP = [
  { pin: 'GPIO 17 (Pin 11)', role: 'Green TAKEN pushbutton', tone: 'text-leaf' },
  { pin: 'GPIO 27 (Pin 13)', role: 'Yellow SNOOZE pushbutton', tone: 'text-brass' },
  { pin: 'GPIO 22 (Pin 15)', role: 'Red EMERGENCY SOS button', tone: 'text-coral' },
  { pin: 'GPIO 23 & 24', role: 'RGB status LED behind 220Ω resistors', tone: 'text-ink-soft' },
  { pin: 'GPIO 25 (Pin 22)', role: 'Active piezo buzzer', tone: 'text-ink-soft' },
];

const BUILD_STEPS = [
  { step: '1', title: 'Measure the touchscreen', desc: 'Record the outer bezel and active area of the 7-inch LCD panel.' },
  { step: '2', title: 'Cut the frame', desc: 'Cut rigid corrugated cardboard into front, side and rear panels.' },
  { step: '3', title: 'Display opening', desc: 'Leave a 2 mm border tolerance so the panel presses in snugly.' },
  { step: '4', title: 'Camera opening', desc: 'Centre the lens hole so the CSI ribbon reaches without strain.' },
  { step: '5', title: 'Button openings', desc: 'Drill three 12 mm holes for the green, yellow and red buttons.' },
  { step: '6', title: 'Speaker and vents', desc: 'Perforate the grille and cut ventilation slots for the Pi.' },
  { step: '7', title: 'Mount the controller', desc: 'Fasten the Raspberry Pi 4 to the base with M2.5 nylon standoffs.' },
  { step: '8', title: 'Secure the cabling', desc: 'Route CSI, DSI and jumpers with ties away from the moving parts.' },
  { step: '9', title: 'Test before closing', desc: 'Power over 5V 3A USB-C and verify touch plus each button event.' },
];

/** Prototype enclosure walkthrough. The three buttons really call the HAL and
 *  really record a dose, so this stays useful during the demonstration. */
export const HardwareBlueprintModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { soundEnabled } = useAuth();
  const { markAsTaken, markAsSnoozed, nextDueDose } = useReminders();
  const [tab, setTab] = useState<Tab>('front');
  const [ledState, setLedState] = useState<'green' | 'yellow' | 'red'>('green');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const pressButton = async (button: 'TAKEN' | 'REMIND_LATER' | 'SOS') => {
    try {
      await api.hardware.triggerButton(button);
      if (button === 'TAKEN') {
        setLedState('green');
        setFeedback('GPIO 17 — current dose recorded as taken.');
        if (nextDueDose) markAsTaken(nextDueDose.medicine_id, nextDueDose.scheduled_time);
      } else if (button === 'REMIND_LATER') {
        setLedState('yellow');
        setFeedback('GPIO 27 — reminder snoozed for fifteen minutes.');
        if (nextDueDose) markAsSnoozed(nextDueDose.medicine_id, nextDueDose.scheduled_time);
      } else {
        setLedState('red');
        setFeedback('GPIO 22 — emergency alert dispatched to the caregiver.');
      }
      window.setTimeout(() => setFeedback(null), 4000);
    } catch (_) {
      setFeedback('The hardware endpoint did not answer. Start the backend to demonstrate the box.');
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof Box }[] = [
    { id: 'front', label: 'Front kiosk view', icon: Box },
    { id: 'internal', label: 'Inside and GPIO', icon: Cpu },
    { id: 'cardboard', label: 'Build steps', icon: Wrench },
  ];

  return (
    <div className="fixed inset-0 z-[65] flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <motion.div
        className="fixed inset-0 bg-ink-deep/55"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="blueprint-title"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
        className="cn-panel relative my-4 w-full max-w-3xl shadow-raised"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <p className="cn-eyebrow">Prototype hardware architecture</p>
            <h2 id="blueprint-title" className="mt-1 font-display text-section font-medium text-ink">
              CareNest Smart Box
            </h2>
            <p className="mt-1 text-micro text-ink-mute">
              Raspberry Pi 4 edge device with a 7-inch touchscreen, camera, microphone and three tactile GPIO buttons.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close blueprint">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <div className="cn-segment mb-5 flex-wrap" role="tablist" aria-label="Blueprint section">
            {tabs.map(item => (
              <button
                key={item.id}
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className="cn-segment-item inline-flex items-center gap-1.5"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            ))}
          </div>

          {feedback && (
            <p className="mb-4 rounded-control border border-teal/30 bg-teal-wash px-3.5 py-2.5 text-micro font-semibold text-teal-deep" role="status">
              {feedback}
            </p>
          )}

          {tab === 'front' && (
            <div className="rounded-panel border border-line bg-paper p-5 sm:p-6">
              {/* Bezel */}
              <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
                <Port icon={Camera} label="Camera" />
                <div className="flex items-center gap-2 rounded-pill border border-line bg-paper-cool px-3 py-1">
                  <span className="text-micro font-semibold uppercase tracking-wider text-ink-mute">Status LED</span>
                  <span
                    aria-hidden
                    className={cn(
                      'h-3 w-3 rounded-full',
                      ledState === 'green' && 'bg-leaf',
                      ledState === 'yellow' && 'animate-pulse bg-brass',
                      ledState === 'red' && 'animate-pulse bg-coral'
                    )}
                  />
                  <span className="text-micro font-semibold uppercase tabular text-ink">{ledState}</span>
                </div>
                <Port icon={Mic} label="Microphone" />
              </div>

              {/* Screen */}
              <div className="mt-4 rounded-panel border border-line bg-paper-cool p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="cn-eyebrow">On the kiosk screen</p>
                  <p className="text-micro tabular text-ink-faint">1024 × 600 DSI</p>
                </div>
                <p className="mt-3 font-display text-xl font-medium text-ink">
                  {nextDueDose ? nextDueDose.medicine_name : 'No dose queued'}
                </p>
                <p className="mt-1 text-body text-ink-soft tabular">
                  {nextDueDose
                    ? `${nextDueDose.dosage} · due ${nextDueDose.scheduled_time}`
                    : 'Every dose for today is recorded.'}
                </p>
              </div>

              {/* Buttons */}
              <p className="mt-5 text-micro font-semibold uppercase tracking-wider text-ink-mute">
                Press to simulate the physical buttons
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <BoxButton onClick={() => pressButton('TAKEN')} pin="GPIO 17" label="Taken" tone="leaf" icon={CheckCircle2} />
                <BoxButton onClick={() => pressButton('REMIND_LATER')} pin="GPIO 27" label="Snooze" tone="brass" icon={Clock} />
                <BoxButton onClick={() => pressButton('SOS')} pin="GPIO 22" label="Emergency" tone="coral" icon={TriangleAlert} />
              </div>

              <p className="mt-5 flex items-center justify-center gap-2 text-micro text-ink-faint">
                <Volume2 className="h-4 w-4" />
                Dual piezo speaker grille{soundEnabled ? '' : ' · app chimes are muted'}
              </p>
            </div>
          )}

          {tab === 'internal' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-panel border border-line bg-paper p-5">
                <h3 className="flex items-center gap-2 font-display text-lg font-medium text-ink">
                  <Cpu className="h-4 w-4 text-teal" />
                  Raspberry Pi 4 Model B
                </h3>
                <dl className="mt-3 space-y-2 text-micro">
                  {[
                    ['Processor', 'Broadcom BCM2711, quad-core Cortex-A72 (ARM v8) 64-bit @ 1.5 GHz'],
                    ['Memory', '4 GB LPDDR4-3200 SDRAM'],
                    ['Wireless', '2.4 / 5.0 GHz IEEE 802.11ac, Bluetooth 5.0'],
                    ['Camera port', '2-lane MIPI CSI (ribbon cable)'],
                    ['Display port', '2-lane MIPI DSI for the 7-inch touchscreen'],
                  ].map(([term, value]) => (
                    <div key={term} className="flex gap-3 border-b border-line pb-2 last:border-0 last:pb-0">
                      <dt className="w-24 shrink-0 font-semibold text-ink">{term}</dt>
                      <dd className="min-w-0 leading-snug text-ink-soft">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="rounded-panel border border-line bg-paper p-5">
                <h3 className="flex items-center gap-2 font-display text-lg font-medium text-ink">
                  <Layers className="h-4 w-4 text-teal" />
                  GPIO allocation
                </h3>
                <ul className="mt-3 space-y-2 text-micro">
                  {GPIO_MAP.map(entry => (
                    <li key={entry.pin} className="flex flex-wrap items-baseline justify-between gap-x-3 border-b border-line pb-2 last:border-0 last:pb-0">
                      <span className={cn('font-semibold tabular', entry.tone)}>{entry.pin}</span>
                      <span className="min-w-0 flex-1 text-right text-ink-soft">{entry.role}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 rounded-control bg-brass-wash px-3 py-2 text-micro leading-relaxed text-ink-soft">
                  Inputs use software pull-ups (<code className="font-semibold">pull_up=True</code>); each LED channel is
                  protected by a 220Ω resistor.
                </p>
              </div>
            </div>
          )}

          {tab === 'cardboard' && (
            <div>
              <h3 className="flex items-center gap-2 font-display text-lg font-medium text-ink">
                <Wrench className="h-4 w-4 text-teal" />
                Nine-step cardboard build
              </h3>
              <ol className="mt-4 space-y-2.5">
                {BUILD_STEPS.map(item => (
                  <li key={item.step} className="flex gap-3.5 rounded-panel border border-line bg-paper px-4 py-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-micro font-semibold tabular text-paper-cool">
                      {item.step}
                    </span>
                    <div className="min-w-0">
                      <p className="text-body font-semibold text-ink">{item.title}</p>
                      <p className="mt-0.5 text-micro leading-relaxed text-ink-soft">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="mt-5 flex justify-end border-t border-line pt-4">
            <Button variant="secondary" onClick={onClose}>
              Close blueprint
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Port: React.FC<{ icon: React.ElementType; label: string }> = ({ icon: Icon, label }) => (
  <span className="flex items-center gap-2">
    <span className="grid h-8 w-8 place-items-center rounded-full border border-line bg-paper-cool text-ink-soft">
      <Icon className="h-4 w-4" />
    </span>
    <span className="text-micro font-semibold text-ink-mute">{label}</span>
  </span>
);

const BoxButton: React.FC<{
  onClick: () => void;
  pin: string;
  label: string;
  tone: 'leaf' | 'brass' | 'coral';
  icon: React.ElementType;
}> = ({ onClick, pin, label, tone, icon: Icon }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex flex-col items-center gap-1.5 rounded-panel border px-3 py-4 transition-all hover:-translate-y-0.5 cursor-pointer',
      tone === 'leaf' && 'border-leaf/35 bg-leaf-wash hover:border-leaf/60',
      tone === 'brass' && 'border-brass/35 bg-brass-wash hover:border-brass/60',
      tone === 'coral' && 'border-coral/35 bg-coral-wash hover:border-coral/60'
    )}
  >
    <Icon
      className={cn('h-5 w-5', tone === 'leaf' && 'text-leaf', tone === 'brass' && 'text-brass', tone === 'coral' && 'text-coral')}
    />
    <span className="text-body font-semibold text-ink">{label}</span>
    <span className="text-micro tabular text-ink-mute">{pin}</span>
  </button>
);
