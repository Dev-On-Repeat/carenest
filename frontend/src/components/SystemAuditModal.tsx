import React, { useState } from 'react';
import { X, Play, CircleDot, TriangleAlert, Loader2, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { offlineStorage } from '../services/offlineStorage';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

type AuditStatus = 'idle' | 'running' | 'passed' | 'failed' | 'unverified';

interface TestItem {
  id: number;
  category: string;
  focus: string;
  status: AuditStatus;
  latency?: string;
  evidence: string;
}

const INITIAL: TestItem[] = [
  { id: 1, category: 'Backend reachability', focus: 'FastAPI /api/health responds', status: 'idle', evidence: 'Not run yet' },
  { id: 2, category: 'Authenticated session', focus: 'Token accepted by /auth/me', status: 'idle', evidence: 'Not run yet' },
  { id: 3, category: 'Medicine records', focus: 'List query returns your regimen', status: 'idle', evidence: 'Not run yet' },
  { id: 4, category: 'Dose schedule', focus: 'Today slots computed with live status', status: 'idle', evidence: 'Not run yet' },
  { id: 5, category: 'Caregiver portal', focus: 'Linked patients and SOS feed readable', status: 'idle', evidence: 'Not run yet' },
  { id: 6, category: 'Offline cache', focus: 'IndexedDB store available', status: 'idle', evidence: 'Not run yet' },
  { id: 7, category: 'Reminder audio', focus: 'Web Audio context can be created', status: 'idle', evidence: 'Not run yet' },
  { id: 8, category: 'Hardware endpoint', focus: 'Smart box HAL answers /hardware/status', status: 'idle', evidence: 'Not run yet' },
];

/** Checks that need a manual walkthrough are listed as unverified, never faked. */
const MANUAL_ITEMS = [
  'Prescription OCR accuracy — needs a real prescription photo reviewed line by line',
  'Pill identification ranking — needs a photographed tablet compared with the reference table',
  'Voice input and spoken answers — needs a microphone and a browser with Web Speech support',
  'Physical Raspberry Pi GPIO buttons, LED and buzzer — needs the assembled prototype',
  'Cloud PostgreSQL mode — this run uses the local SQLite database unless DATABASE_URL is set',
];

export const SystemAuditModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [tests, setTests] = useState<TestItem[]>(INITIAL);
  const [running, setRunning] = useState(false);

  const patch = (id: number, next: Partial<TestItem>) =>
    setTests(prev => prev.map(item => (item.id === id ? { ...item, ...next } : item)));

  const runCheck = async (id: number, label: string, probe: () => Promise<string>) => {
    patch(id, { status: 'running', evidence: label });
    const started = performance.now();
    try {
      const evidence = await probe();
      patch(id, { status: 'passed', evidence, latency: `${Math.round(performance.now() - started)} ms` });
    } catch (err: any) {
      patch(id, {
        status: 'failed',
        evidence: err?.message || `${label} did not respond`,
        latency: `${Math.round(performance.now() - started)} ms`,
      });
    }
  };

  const runAudit = async () => {
    setRunning(true);
    setTests(prev => prev.map(item => ({ ...item, status: 'idle', latency: undefined, evidence: 'Queued' })));

    await runCheck(1, 'Health endpoint', async () => {
      const res = await fetch('/api/health').then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))));
      return `status ${res.status} · ${res.service} v${res.version}`;
    });

    await runCheck(2, 'Session token', async () => {
      const me = await api.auth.getMe();
      return `Signed in as ${me.full_name} (${me.role})`;
    });

    await runCheck(3, 'Medicine list', async () => {
      const meds = await api.medicines.list();
      return `${meds.length} medicine record(s) returned`;
    });

    await runCheck(4, 'Today schedule', async () => {
      const slots = await api.schedules.getToday();
      const due = slots.filter(s => s.status === 'due').length;
      const taken = slots.filter(s => s.status === 'taken').length;
      return `${slots.length} dose slot(s) · ${taken} taken · ${due} due`;
    });

    await runCheck(5, 'Caregiver feed', async () => {
      const patients = await api.caregiver.listPatients();
      const alerts = await api.sos.getEvents();
      return `${patients.length} linked patient(s) · ${alerts.length} alert record(s)`;
    });

    await runCheck(6, 'IndexedDB cache', async () => {
      const cached = await offlineStorage.getCachedTodaySchedule();
      return `Cache readable (${cached.length} cached slot(s))`;
    });

    await runCheck(7, 'Audio chimes', () =>
      new Promise<string>((resolve, reject) => {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return reject(new Error('This browser has no Web Audio support'));
        const ctx = new AudioCtx();
        // A silent one-frame buffer proves the device can actually start.
        const buffer = ctx.createBuffer(1, 1, 22050);
        buffer.copyToChannel(new Float32Array(1), 0);
        ctx.resume().then(() => {
          resolve(`Audio context ${ctx.state}`);
          ctx.close();
        }).catch(() => reject(new Error('Audio device blocked until user interaction')));
      })
    );

    await runCheck(8, 'Hardware endpoint', async () => {
      const hw = await api.hardware.getStatus();
      return `${hw.mode} · LED ${hw.led_indicator}`;
    });

    setRunning(false);
  };

  if (!isOpen) return null;

  const passed = tests.filter(t => t.status === 'passed').length;
  const failed = tests.filter(t => t.status === 'failed').length;

  const dotFor: Record<AuditStatus, string> = {
    idle: 'bg-paper-sunken text-ink-faint',
    running: 'bg-teal-wash text-teal-deep',
    passed: 'bg-leaf-wash text-leaf',
    failed: 'bg-coral-wash text-coral',
    unverified: 'bg-brass-wash text-brass',
  };

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
        aria-labelledby="audit-title"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
        className="cn-panel relative my-4 w-full max-w-3xl shadow-raised"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <p className="cn-eyebrow">Verification</p>
            <h2 id="audit-title" className="mt-1 font-display text-section font-medium text-ink">
              Live system checks
            </h2>
            <p className="mt-1 text-micro text-ink-mute">
              Each row calls the real endpoint. Failures stay visible rather than being marked green.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-micro tabular text-ink-soft">
              {passed}/{tests.length} checks passed
              {failed > 0 && <span className="ml-2 font-semibold text-coral">{failed} failed</span>}
            </p>
            <Button onClick={runAudit} disabled={running}>
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {running ? 'Running…' : passed ? 'Run again' : 'Run checks'}
            </Button>
          </div>

          <ul className="divide-y divide-line rounded-panel border border-line">
            {tests.map(test => (
              <li key={test.id} className="flex items-start gap-3.5 px-4 py-3">
                <span className={cn('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full', dotFor[test.status])}>
                  {test.status === 'running' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : test.status === 'passed' ? (
                    <CircleDot className="h-3.5 w-3.5" />
                  ) : test.status === 'failed' ? (
                    <TriangleAlert className="h-3.5 w-3.5" />
                  ) : (
                    <Info className="h-3.5 w-3.5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="text-body font-semibold text-ink">{test.category}</p>
                    {test.latency && <p className="text-micro tabular text-ink-faint">{test.latency}</p>}
                  </div>
                  <p className="text-micro text-ink-mute">{test.focus}</p>
                  <p
                    className={cn(
                      'mt-1 break-words text-micro',
                      test.status === 'failed' ? 'font-semibold text-coral-deep' : 'text-ink-soft'
                    )}
                  >
                    {test.evidence}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-panel border border-brass/25 bg-brass-wash px-4 py-3.5">
            <p className="flex items-center gap-2 text-micro font-semibold uppercase tracking-wider text-ink">
              <TriangleAlert className="h-4 w-4 text-brass" />
              Needs a human to confirm
            </p>
            <ul className="mt-2 space-y-1.5">
              {MANUAL_ITEMS.map(item => (
                <li key={item} className="flex gap-2 text-micro leading-relaxed text-ink-soft">
                  <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brass" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
