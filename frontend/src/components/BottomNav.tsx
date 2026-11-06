import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Pill, CalendarClock, MessageCircleQuestion, AlertOctagon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { translations } from '../i18n/translations';
import { cn } from '../lib/utils';

/** Five destinations max on a thumb-reachable bar; SOS sits in the middle. */
export const BottomNav: React.FC<{ onOpenSOS: () => void }> = ({ onOpenSOS }) => {
  const { language } = useAuth();
  const t = translations[language];

  const items = [
    { to: '/', icon: Home, label: t.navHome },
    { to: '/medicines', icon: Pill, label: language === 'en' ? 'Medicines' : t.navMedicines },
    { to: '/schedule', icon: CalendarClock, label: language === 'en' ? 'Schedule' : t.navSchedule },
    { to: '/assistant', icon: MessageCircleQuestion, label: language === 'en' ? 'Ask' : t.navAsk },
  ];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex min-w-0 min-h-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-control text-micro font-semibold transition-colors',
      isActive ? 'text-teal-deep' : 'text-ink-mute hover:text-ink'
    );

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper-cool px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {items.slice(0, 2).map(item => (
          <li key={item.to} className="min-w-0 flex-1">
            <NavLink to={item.to} end={item.to === '/'} className={linkClass}>
              <item.icon className="h-5 w-5" strokeWidth={2} />
              <span className="block max-w-full truncate text-[10px]">{item.label}</span>
            </NavLink>
          </li>
        ))}

        <li className="flex w-[62px] shrink-0 justify-center">
          <button
            onClick={onOpenSOS}
            aria-label="Emergency SOS"
            className="-mt-6 flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-full bg-coral text-white shadow-press-coral ring-4 ring-paper-cool transition-transform active:translate-y-[2px] cursor-pointer"
          >
            <AlertOctagon className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-[0.08em]">SOS</span>
          </button>
        </li>

        {items.slice(2).map(item => (
          <li key={item.to} className="min-w-0 flex-1">
            <NavLink to={item.to} className={linkClass}>
              <item.icon className="h-5 w-5" strokeWidth={2} />
              <span className="block max-w-full truncate text-[10px]">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
