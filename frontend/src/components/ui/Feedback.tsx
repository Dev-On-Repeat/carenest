import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { useAuth } from '../../context/AuthContext';

/**
 * App-level feedback layer: replaces window.alert / window.confirm with
 * keyboard-accessible toasts and a confirm dialog. Both are announced to
 * screen readers and honour reduced-motion.
 */
type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ConfirmRequest {
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  resolve: (ok: boolean) => void;
}

interface FeedbackApi {
  toast: (message: string, kind?: ToastKind) => void;
  confirm: (request: Omit<ConfirmRequest, 'resolve'>) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackApi | undefined>(undefined);

let nextId = 1;

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { textSize } = useAuth();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = nextId++;
      setToasts(prev => [...prev.slice(-2), { id, kind, message }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss]
  );

  const confirm = useCallback((request: Omit<ConfirmRequest, 'resolve'>) => {
    return new Promise<boolean>(resolve => setConfirmRequest({ ...request, resolve }));
  }, []);

  const closeConfirm = useCallback(
    (ok: boolean) => {
      confirmRequest?.resolve(ok);
      setConfirmRequest(null);
    },
    [confirmRequest]
  );

  const api = useMemo<FeedbackApi>(() => ({ toast, confirm }), [toast, confirm]);

  const iconFor: Record<ToastKind, React.ReactNode> = {
    success: <CheckCircle2 className="h-5 w-5 text-leaf" />,
    error: <AlertTriangle className="h-5 w-5 text-coral" />,
    info: <Info className="h-5 w-5 text-teal" />,
  };

  return (
    <FeedbackContext.Provider value={api}>
      {children}

      <div className={`cn-app text-scale-${textSize}`}>
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-24 left-1/2 z-[70] flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4 md:bottom-6 md:left-auto md:right-6 md:translate-x-0 md:px-0"
      >
        <AnimatePresence initial={false}>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              role="status"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="cn-panel pointer-events-auto flex items-start gap-3 px-4 py-3 shadow-raised"
            >
              <span className="mt-0.5 shrink-0">{iconFor[t.kind]}</span>
              <p className="flex-1 text-micro font-medium leading-snug text-ink">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="-mr-1 shrink-0 rounded p-1 text-ink-faint hover:bg-paper-sunken hover:text-ink cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {confirmRequest && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div
              className="absolute inset-0 bg-ink-deep/45"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => closeConfirm(false)}
            />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="cn-confirm-title"
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="cn-panel relative w-full max-w-md p-6 shadow-raised"
            >
              <h2 id="cn-confirm-title" className="font-display text-section font-medium text-ink">
                {confirmRequest.title}
              </h2>
              <p className="mt-2 text-body text-ink-soft">{confirmRequest.body}</p>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="secondary" onClick={() => closeConfirm(false)}>
                  {confirmRequest.cancelLabel ?? 'Cancel'}
                </Button>
                <Button
                  autoFocus
                  variant={confirmRequest.danger ? 'destructive' : 'default'}
                  onClick={() => closeConfirm(true)}
                >
                  {confirmRequest.confirmLabel ?? 'Confirm'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </FeedbackContext.Provider>
  );
};

export const useFeedback = (): FeedbackApi => {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used within FeedbackProvider');
  return ctx;
};

/** Convenience class helper for inline notice banners. */
export const noticeClass = cn('cn-notice');
