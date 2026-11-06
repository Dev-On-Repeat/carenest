import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { WifiOff, RefreshCw, Volume2, VolumeX, LogOut, Menu, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReminders } from '../context/ReminderContext';
import { translations } from '../i18n/translations';
import { BrandMark } from './BrandMark';
import { Button } from './ui/Button';
import { TextSize } from '../types';
import { cn } from '../lib/utils';
import { NAVIGATION } from '../lib/navigation';
import { DEMO_TOKEN } from '../services/visitSession';

interface NavbarProps {
  onOpenSOS: () => void;
  onOpenBlueprint: () => void;
  onOpenAudit: () => void;
}
const SIZES: { id: TextSize; label: string }[] = [{ id: 'normal', label: 'A' }, { id: 'large', label: 'A+' }, { id: 'xlarge', label: 'A++' }];

export const Navbar: React.FC<NavbarProps> = ({ onOpenSOS, onOpenBlueprint, onOpenAudit }) => {
  const { user, token, language, textSize, soundEnabled, setLanguage, setTextSize, setSoundEnabled, logout } = useAuth();
  const { isOnline, isSyncing, pendingSyncCount } = useReminders();
  const t = translations[language];
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { setSheetOpen(false); }, [location.pathname]);
  const current = NAVIGATION.flatMap(group => [...group.items]).find(item => item.to === location.pathname);
  const initials = user?.full_name?.replace(/\(.*?\)/g, '').replace(/^Dr\.?\s+/i, '').trim().split(/\s+/).slice(0, 2).map(name => name[0]).join('') || 'CN';

  const controls = <div className="cn-display-controls">
    <div className="cn-segment" role="group" aria-label="Text size">{SIZES.map(size => <button key={size.id} onClick={() => setTextSize(size.id)} data-active={textSize === size.id} aria-pressed={textSize === size.id} className="cn-segment-item">{size.label}</button>)}</div>
    <div className="cn-segment" role="group" aria-label="Language"><button onClick={() => setLanguage('en')} data-active={language === 'en'} aria-pressed={language === 'en'} className="cn-segment-item">EN</button><button onClick={() => setLanguage('te')} data-active={language === 'te'} aria-pressed={language === 'te'} className="cn-segment-item">తెలుగు</button></div>
    <Button variant="ghost" size="icon" onClick={() => setSoundEnabled(!soundEnabled)} aria-label={soundEnabled ? 'Turn reminder sounds off' : 'Turn reminder sounds on'} aria-pressed={soundEnabled}>{soundEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}</Button>
    <Button variant="ghost" size="icon" onClick={logout} aria-label={t.navLogout}><LogOut size={18} /></Button>
  </div>;

  return (
    <header className="cn-navbar" onKeyDown={event => { if (event.key === 'Escape' && sheetOpen) { setSheetOpen(false); menuButton.current?.focus(); } }}>
      <div className="cn-navbar-inner">
        <div className="lg:hidden"><BrandMark /></div>
        <div className="cn-navbar-context hidden lg:block"><p>{current ? (language === 'en' ? current.enLabel : t[current.labelKey]) : 'CareNest'}</p><span>{now.toLocaleDateString(language === 'te' ? 'te-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
        <div className="cn-navbar-actions">
          <span className={cn('cn-connection hidden xl:inline-flex', !isOnline && 'text-brass')} title={isOnline ? t.online : t.offline}>{isOnline ? <span /> : <WifiOff size={14} />}{isOnline ? t.online : t.offline}</span>
          {pendingSyncCount > 0 && <span className="hidden items-center gap-1.5 text-micro text-teal sm:inline-flex"><RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />{pendingSyncCount}</span>}
          <div className="hidden lg:block">{controls}</div>
          <Button variant="sos" size="sm" onClick={onOpenSOS} className="cn-topbar-sos" aria-label="Emergency SOS"><ShieldAlert size={16} />SOS</Button>
          <NavLink to="/settings" className="cn-profile-avatar hidden lg:grid" aria-label="Open profile settings" title={user?.full_name}>{initials}</NavLink>
          <Button ref={menuButton} variant="secondary" size="icon" className="lg:hidden" onClick={() => setSheetOpen(!sheetOpen)} aria-label={sheetOpen ? 'Close menu' : 'Open menu'} aria-expanded={sheetOpen} aria-controls="mobile-menu">{sheetOpen ? <X size={20} /> : <Menu size={20} />}</Button>
        </div>
      </div>
      {token === DEMO_TOKEN && <p className="cn-visit-notice">{language === 'en' ? 'Sample visit · your changes clear when you reopen or refresh.' : 'నమూనా సందర్శన · రిఫ్రెష్ చేసినప్పుడు మార్పులు తొలగిపోతాయి.'}</p>}
      {sheetOpen && <div id="mobile-menu" className="cn-mobile-menu lg:hidden">
        <nav aria-label="All pages">{NAVIGATION.map(group => <div key={group.labelKey}><p className="cn-eyebrow">{t[group.labelKey]}</p><ul>{group.items.map(item => <li key={item.to}><NavLink to={item.to} end={item.to === '/'} onClick={() => setSheetOpen(false)}><item.icon size={18} /><span>{language === 'en' ? item.enLabel : t[item.labelKey]}</span></NavLink></li>)}</ul></div>)}</nav>
        <div className="cn-mobile-preferences"><p className="cn-eyebrow">{language === 'en' ? 'Display & sound' : 'ప్రదర్శన & ధ్వని'}</p>{controls}</div>
        <details className="cn-project-tools"><summary>{language === 'en' ? 'Project tools' : 'ప్రాజెక్ట్ సాధనాలు'}</summary><div><button onClick={() => { setSheetOpen(false); onOpenBlueprint(); }}>{t.navBlueprint}</button><button onClick={() => { setSheetOpen(false); onOpenAudit(); }}>{t.navAudit}</button></div></details>
      </div>}
    </header>
  );
};
