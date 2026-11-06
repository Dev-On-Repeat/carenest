import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PhoneCall, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { translations } from '../i18n/translations';
import { api } from '../services/api';
import { audioChime } from '../utils/audioChime';
import { Button } from './ui/Button';
import { useMotionPresets } from '../lib/motion';
import { visitSession } from '../services/visitSession';

/** Emergency path: confirm, then a clear "who to call" card. Nothing here is decorative. */
export const SOSModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user, language, soundEnabled } = useAuth();
  const { reduced } = useMotionPresets();
  const t = translations[language];

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [delivery, setDelivery] = useState<{ external: boolean; notice: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const trigger = async () => {
    setSending(true);
    setError(null);
    try {
      if (soundEnabled) audioChime.playSOSAlert();

      let lat: number | undefined;
      let lng: number | undefined;
      if (!visitSession.isDemo && 'geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 })
          );
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        } catch (_) {
          /* Location is optional — the alert still goes out. */
        }
      }

      const result = await api.sos.trigger('User pressed the SOS button in the app', lat, lng);
      setDelivery({ external: result.external_notified, notice: result.notice });
      setSent(true);
    } catch (err: any) {
      setError(err?.message || 'The alert did not reach the server. Call your emergency number now.');
    } finally {
      setSending(false);
    }
  };

  const close = () => {
    setSent(false);
    setDelivery(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-ink-deep/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={close}
        aria-hidden
      />

      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="sos-title"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="cn-panel relative w-full max-w-lg overflow-hidden shadow-raised"
      >
        <span aria-hidden className="block h-1.5 w-full bg-coral" />

        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-5 grid h-9 w-9 place-items-center rounded-full text-ink-faint transition-colors hover:bg-paper-sunken hover:text-ink cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {!sent ? (
          <div className="px-6 py-7 text-center sm:px-8">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-coral/30 bg-coral-wash text-coral">
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden>
                <path d="M12 9v4m0 3h.01M10.3 4.3 3.6 16a2 2 0 0 0 1.7 3h13.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>

            <h2 id="sos-title" className="mt-5 font-display text-section font-medium text-ink">
              {t.sosConfirmQuestion}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-body leading-relaxed text-ink-soft">{t.sosConfirmNotice}</p>

            {user?.emergency_contact && (
              <div className="mt-5 rounded-panel border border-line bg-paper px-4 py-3 text-left">
                <p className="cn-eyebrow">Who gets the alert</p>
                <p className="mt-1 text-body font-semibold text-ink">{user.emergency_contact}</p>
                {user.emergency_phone && (
                  <p className="text-micro tabular text-ink-mute">{user.emergency_phone}</p>
                )}
              </div>
            )}

            {error && (
              <p className="mt-4 rounded-control border border-coral/30 bg-coral-wash px-3.5 py-2.5 text-micro font-semibold text-coral-deep" role="alert">
                {error}
              </p>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button variant="secondary" size="lg" className="h-auto min-h-12 whitespace-normal py-3" onClick={close}>
                {t.cancelSOS}
              </Button>
              <Button variant="sos" size="lg" className="h-auto min-h-12 whitespace-normal py-3" onClick={trigger} disabled={sending}>
                {sending ? 'Sending…' : t.sendSOSButton}
              </Button>
            </div>

            <p className="mt-5 border-t border-line pt-4 text-micro leading-relaxed text-ink-faint">{t.sosDisclaimer}</p>
          </div>
        ) : (
          <div className="px-6 py-8 text-center sm:px-8">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-leaf text-white">
              <CheckCircle2 className="h-8 w-8" />
            </span>

            <h2 className="mt-5 font-display text-section font-medium text-ink">{language === 'en' ? (delivery?.external ? 'Alert sent' : 'Alert recorded in CareNest') : (delivery?.external ? 'హెచ్చరిక పంపబడింది' : 'హెచ్చరిక నమోదు చేయబడింది')}</h2>
            <p className="mx-auto mt-2 max-w-sm text-body text-ink-soft">{delivery?.notice || 'The alert was recorded. Contact emergency services directly if you need urgent help.'}</p>

            <div className="mt-6 space-y-2 rounded-panel border border-brass/30 bg-brass-wash px-4 py-4 text-left">
              <p className="flex items-center gap-2 text-micro font-semibold uppercase tracking-wider text-ink">
                <PhoneCall className="h-4 w-4 text-brass" />
                Call for help yourself as well
              </p>
              <p className="text-body text-ink-soft tabular">
                Ambulance and medical emergency: <span className="font-bold text-ink">108</span>
              </p>
              <p className="text-body text-ink-soft tabular">
                All-in-one emergency number: <span className="font-bold text-ink">112</span>
              </p>
            </div>

            <Button className="mt-6 w-full" size="lg" onClick={close}>
              Close
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
