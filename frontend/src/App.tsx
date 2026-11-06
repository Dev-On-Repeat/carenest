import React from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ReminderProvider } from './context/ReminderContext';
import { FeedbackProvider } from './components/ui/Feedback';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { SOSModal } from './components/SOSModal';
import { HardwareBlueprintModal } from './components/HardwareBlueprintModal';
import { SystemAuditModal } from './components/SystemAuditModal';
import { ReminderBanner } from './components/ReminderBanner';
import { useMotionPresets } from './lib/motion';
import { cn } from './lib/utils';

import { DashboardPage } from './pages/DashboardPage';
import { MedicinesPage } from './pages/MedicinesPage';
import { SchedulePage } from './pages/SchedulePage';
import { PrescriptionScanPage } from './pages/PrescriptionScanPage';
import { PillIdentifyPage } from './pages/PillIdentifyPage';
import { AssistantPage } from './pages/AssistantPage';
import { CaregiverPage } from './pages/CaregiverPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

const AppLoading: React.FC = () => (
  <div className="cn-app grid min-h-screen place-items-center bg-paper px-6">
    <div className="w-full max-w-xs space-y-5 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-[14px] bg-ink text-paper-cool">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
          <path d="M4 14.5c0-3.6 3.6-6.5 8-6.5s8 2.9 8 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="12" cy="11.6" r="2.4" fill="#5FA9A4" />
        </svg>
      </div>
      <p className="font-display text-lg text-ink">CareNest is waking up</p>
      <div className="mx-auto flex justify-center gap-1.5" role="status" aria-live="polite">
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="h-1.5 w-6 rounded-pill bg-teal/30"
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </div>
    </div>
  </div>
);

/** The authenticated shell owns every modal so any surface can raise them. */
const ProtectedLayout: React.FC<{ children: (ctx: { openSOS: () => void }) => React.ReactNode }> = ({
  children,
}) => {
  const { user, isLoading, textSize } = useAuth();
  const location = useLocation();
  const { pageTransition } = useMotionPresets();
  const [isSOSOpen, setIsSOSOpen] = React.useState(false);
  const [isBlueprintOpen, setIsBlueprintOpen] = React.useState(false);
  const [isAuditOpen, setIsAuditOpen] = React.useState(false);

  React.useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  if (isLoading) return <AppLoading />;
  if (!user) return <Navigate to="/login" replace />;

  const textSizeClass =
    textSize === 'xlarge' ? 'text-scale-xlarge' : textSize === 'large' ? 'text-scale-large' : 'text-scale-normal';

  const openSOS = () => setIsSOSOpen(true);

  return (
    <div className={cn('cn-app min-h-screen bg-paper text-ink', textSizeClass)}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[90] focus:rounded-control focus:bg-ink focus:px-4 focus:py-2 focus:text-paper-cool"
      >
        Skip to content
      </a>

      <div className="cn-app-layout mx-auto w-full max-w-[1680px] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
        <Sidebar
          onOpenSOS={openSOS}
          onOpenBlueprint={() => setIsBlueprintOpen(true)}
          onOpenAudit={() => setIsAuditOpen(true)}
        />

        <div className="min-w-0">
          <Navbar
            onOpenSOS={openSOS}
            onOpenBlueprint={() => setIsBlueprintOpen(true)}
            onOpenAudit={() => setIsAuditOpen(true)}
          />


          <main id="main-content" tabIndex={-1} className="cn-main px-4 pb-28 pt-6 sm:px-7 lg:px-9 lg:pb-10 lg:pt-8">
            <AnimatePresence mode="wait">
              <motion.div key={location.pathname} {...pageTransition}>
                {children({ openSOS })}
              </motion.div>
            </AnimatePresence>
          </main>

          <footer className="hidden border-t border-line px-8 py-5 text-micro leading-relaxed text-ink-faint lg:block">
            CareNest AI supports your prescription — it never replaces your doctor. In an emergency, call your local
            emergency number.
          </footer>
        </div>
      </div>

      <ReminderBanner />
      <BottomNav onOpenSOS={openSOS} />

      <SOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />
      <HardwareBlueprintModal isOpen={isBlueprintOpen} onClose={() => setIsBlueprintOpen(false)} />
      <SystemAuditModal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />
    </div>
  );
};

export const AppContent: React.FC = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/" element={<ProtectedLayout>{() => <DashboardPage />}</ProtectedLayout>} />
    <Route path="/medicines" element={<ProtectedLayout>{() => <MedicinesPage />}</ProtectedLayout>} />
    <Route path="/schedule" element={<ProtectedLayout>{() => <SchedulePage />}</ProtectedLayout>} />
    <Route path="/scan" element={<ProtectedLayout>{() => <PrescriptionScanPage />}</ProtectedLayout>} />
    <Route path="/identify" element={<ProtectedLayout>{() => <PillIdentifyPage />}</ProtectedLayout>} />
    <Route path="/assistant" element={<ProtectedLayout>{() => <AssistantPage />}</ProtectedLayout>} />
    <Route path="/caregiver" element={<ProtectedLayout>{() => <CaregiverPage />}</ProtectedLayout>} />
    <Route path="/history" element={<ProtectedLayout>{() => <HistoryPage />}</ProtectedLayout>} />
    <Route path="/settings" element={<ProtectedLayout>{() => <SettingsPage />}</ProtectedLayout>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export const App: React.FC = () => (
  <HashRouter>
    <AuthProvider>
      <ReminderProvider>
        <FeedbackProvider>
          <AppContent />
        </FeedbackProvider>
      </ReminderProvider>
    </AuthProvider>
  </HashRouter>
);

export default App;
