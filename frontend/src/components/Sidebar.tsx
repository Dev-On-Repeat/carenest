import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Copy, Check, HeartPulse, ScrollText, ChevronDown, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { translations } from '../i18n/translations';
import { BrandMark } from './BrandMark';
import { NAVIGATION } from '../lib/navigation';
import { cn } from '../lib/utils';

interface SidebarProps {
  onOpenSOS: () => void;
  onOpenBlueprint: () => void;
  onOpenAudit: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSOS, onOpenBlueprint, onOpenAudit }) => {
  const { user, language } = useAuth();
  const t = translations[language];
  const [copied, setCopied] = useState(false);
  const copyCode = async () => {
    if (!user?.caregiver_code) return;
    try {
      await navigator.clipboard.writeText(user.caregiver_code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { /* The code remains readable when clipboard access is unavailable. */ }
  };

  return (
    <aside className="cn-sidebar hidden lg:flex">
      <div className="cn-sidebar-brand"><BrandMark /><span className="cn-workspace-label">{language === 'en' ? 'YOUR CARE COMPANION' : 'మీ సంరక్షణ సహాయకుడు'}</span></div>
      <nav aria-label="Main navigation" className="cn-sidebar-nav">
        {NAVIGATION.map(group => (
          <div className="cn-nav-group" key={group.labelKey}>
            <p className="cn-eyebrow">{t[group.labelKey]}</p>
            <ul>
              {group.items.map(item => (
                <li key={item.to}><NavLink to={item.to} end={item.to === '/'} className={({ isActive }) => cn('cn-nav-link', isActive && 'cn-nav-link-active')}><item.icon size={19} strokeWidth={1.8} /><span>{language === 'en' ? item.enLabel : t[item.labelKey]}</span></NavLink></li>
              ))}
            </ul>
          </div>
        ))}
        <details className="cn-project-tools"><summary>{language === 'en' ? 'Project tools' : 'ప్రాజెక్ట్ సాధనాలు'}<ChevronDown size={14} /></summary><div><button onClick={onOpenBlueprint}><HeartPulse size={16} />{t.navBlueprint}</button><button onClick={onOpenAudit}><ScrollText size={16} />{t.navAudit}</button></div></details>
      </nav>
      <div className="cn-sidebar-bottom">
        {user?.role === 'elderly' && user.caregiver_code && <div className="cn-family-code"><span className="cn-eyebrow">{t.navFamilyCode}</span><div><code>{user.caregiver_code}</code><button onClick={copyCode} aria-label={copied ? 'Link code copied' : 'Copy caregiver pairing code'}>{copied ? <Check size={16} /> : <Copy size={16} />}</button></div><p>{language === 'en' ? 'Share with someone you trust.' : t.navFamilyCodeHint}</p></div>}
        <button onClick={onOpenSOS} className="cn-sidebar-sos" aria-label="Emergency SOS — alert your caregiver"><ShieldAlert size={19} />{language === 'en' ? 'Emergency help' : t.actionSOS}</button>
        <p className="cn-sidebar-footnote">{language === 'en' ? 'CareNest · Academic prototype' : 'CareNest · విద్యా నమూనా'}</p>
      </div>
    </aside>
  );
};
