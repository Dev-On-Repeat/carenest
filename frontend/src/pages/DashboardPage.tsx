import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, ScanSearch, MessageCircleQuestion, Pill, Users, ArrowUpRight, ArrowRight, CalendarDays, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReminders } from '../context/ReminderContext';
import { translations } from '../i18n/translations';
import { DoseRingHero } from '../components/DoseRingHero';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useMotionPresets } from '../lib/motion';
import { DoseStatus } from '../types';

const STATUS: Record<DoseStatus, { en: string; te: string }> = {
  taken: { en: 'Taken', te: 'తీసుకున్నారు' },
  due: { en: 'Due now', te: 'ఇప్పుడు తీసుకోవాలి' },
  upcoming: { en: 'Upcoming', te: 'రాబోయే' },
  snoozed: { en: 'Snoozed', te: 'వాయిదా' },
  missed: { en: 'Missed', te: 'తీసుకోలేదు' },
};

export const DashboardPage: React.FC = () => {
  const { user, language } = useAuth();
  const { todaySchedule } = useReminders();
  const { fadeUp, staggerChildren, reduced } = useMotionPresets();
  const t = translations[language];
  const navigate = useNavigate();
  const firstName = user?.full_name?.replace(/^(Dr\.?|Mr\.?|Mrs\.?)\s+/i, '').trim().split(' ')[0] ?? '';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t.greetingMorning : hour < 17 ? t.greetingAfternoon : hour < 21 ? t.greetingEvening : t.greetingNight;
  const taken = todaySchedule.filter(slot => slot.status === 'taken').length;
  const date = new Date().toLocaleDateString(language === 'te' ? 'te-IN' : 'en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const tools = [
    { title: t.actionScan, hint: language === 'en' ? 'Turn your prescription into a routine.' : t.actionScanSub, icon: Camera, to: '/scan', tone: 'blue' },
    { title: t.actionIdentify, hint: language === 'en' ? 'Check a pill’s visible features.' : t.actionIdentifySub, icon: ScanSearch, to: '/identify', tone: 'peach' },
    { title: t.actionAsk, hint: language === 'en' ? 'Find an answer in your saved records.' : t.actionAskSub, icon: MessageCircleQuestion, to: '/assistant', tone: 'violet' },
  ];

  return (
    <div className="cn-dashboard mx-auto max-w-[1180px]">
      <PageHeader
        eyebrow={language === 'en' ? 'YOUR DAILY OVERVIEW' : 'మీ రోజువారీ వివరాలు'}
        title={`${greeting}${firstName ? `, ${firstName}` : ''}.`}
        lede={language === 'en' ? 'A clear plan for your medicines. More room for your day.' : 'మీ మందుల కోసం స్పష్టమైన ప్రణాళిక.'}
        actions={<span className="cn-date-chip"><CalendarDays size={17} />{date}</span>}
      />

      <div className="cn-overview-grid">
        <motion.section {...fadeUp} aria-labelledby="next-dose-heading" className="min-w-0">
          <div className="cn-section-heading"><h2 id="next-dose-heading">{language === 'en' ? 'Your next step' : 'మీ తదుపరి మందు'}</h2><Pill size={18} aria-hidden="true" /></div>
          <DoseRingHero />
        </motion.section>

        <motion.section {...fadeUp} aria-labelledby="agenda-heading" className="cn-agenda-section min-w-0">
          <div className="cn-section-heading"><h2 id="agenda-heading">{language === 'en' ? 'Today’s schedule' : 'ఈ రోజు షెడ్యూల్'}</h2><span>{taken}/{todaySchedule.length} {language === 'en' ? 'taken' : 'తీసుకున్నారు'}</span></div>
          <Card className="cn-agenda">
            {todaySchedule.length > 0 ? (
              <ol>
                {todaySchedule.slice(0, 4).map((slot, index) => (
                  <li key={`${slot.medicine_id}-${slot.scheduled_time}-${index}`} data-status={slot.status}>
                    <span className="cn-agenda-marker" aria-hidden="true">{slot.status === 'taken' && <Check size={12} />}</span>
                    <div className="cn-agenda-detail"><div><span className="cn-agenda-time">{slot.scheduled_time}</span><span className="cn-agenda-status">{STATUS[slot.status][language]}</span></div><h3>{slot.medicine_name}</h3><p>{slot.dosage}{slot.strength ? ` · ${slot.strength}` : ''}</p></div>
                  </li>
                ))}
              </ol>
            ) : <div className="cn-agenda-empty"><CalendarDays size={28} /><h3>{language === 'en' ? 'A fresh start' : 'కొత్త ప్రారంభం'}</h3><p>{t.noRemindersToday}</p><Button variant="secondary" size="sm" onClick={() => navigate('/medicines')}>{t.addNewMedicine}</Button></div>}
            <button className="cn-agenda-link" onClick={() => navigate('/schedule')}>{language === 'en' ? 'View full schedule' : t.navSchedule}<ArrowRight size={16} /></button>
          </Card>
        </motion.section>
      </div>

      <section className="cn-dashboard-tools" aria-labelledby="tools-heading">
        <div className="cn-section-heading"><h2 id="tools-heading">{language === 'en' ? 'A little help, when you need it' : t.quickActions}</h2></div>
        <ul className="cn-tool-cards">
          {tools.map((tool, index) => (
            <motion.li key={tool.to} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35, delay: index * staggerChildren }}>
              <button onClick={() => navigate(tool.to)} className="cn-tool-card" data-tone={tool.tone}>
                <span className="cn-tool-icon"><tool.icon size={23} strokeWidth={1.7} /></span><ArrowUpRight size={18} className="cn-tool-arrow" /><span className="cn-tool-title">{tool.title}</span><p>{tool.hint}</p>
              </button>
            </motion.li>
          ))}
        </ul>
      </section>

      <section className="cn-care-circle" aria-labelledby="care-circle-heading">
        <span className="cn-care-circle-icon"><Users size={25} strokeWidth={1.6} /></span>
        <div><h2 id="care-circle-heading">{language === 'en' ? 'Care works better together.' : t.navCaregiver}</h2><p>{language === 'en' ? 'Connect a family member so they can follow your routine.' : t.navFamilyCodeHint}</p></div>
        <Button variant="outline" onClick={() => navigate('/caregiver')}>{language === 'en' ? 'Your care circle' : t.navCaregiver}<ArrowRight size={16} /></Button>
      </section>
    </div>
  );
};
