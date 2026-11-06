import React from 'react';
import { CheckCircle2, Clock, Utensils, Sun, Coffee, BellRing, Pill, CircleCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useReminders } from '../context/ReminderContext';
import { translations } from '../i18n/translations';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Progress } from './ui/Progress';
import { useMotionPresets } from '../lib/motion';

const MEAL_META: Record<string, { key: 'beforeFood' | 'afterFood' | 'withFood' | 'withWater'; icon: typeof Sun }> = {
  before_food: { key: 'beforeFood', icon: Sun },
  after_food: { key: 'afterFood', icon: Utensils },
  with_food: { key: 'withFood', icon: Coffee },
  not_specified: { key: 'withWater', icon: Clock },
};

export const DoseRingHero: React.FC = () => {
  const { language } = useAuth();
  const { todaySchedule, nextDueDose, markAsTaken, markAsSnoozed } = useReminders();
  const { fadeUp } = useMotionPresets();
  const t = translations[language];
  const total = todaySchedule.length;
  const taken = todaySchedule.filter(slot => slot.status === 'taken').length;
  const percent = total > 0 ? Math.round(taken / total * 100) : 0;
  const meal = nextDueDose ? MEAL_META[nextDueDose.meal_timing] ?? MEAL_META.not_specified : MEAL_META.not_specified;
  const MealIcon = meal.icon;

  return (
    <Card className="cn-dose-card">
      {nextDueDose ? (
        <>
          <div className="cn-dose-heading">
            <div className="cn-dose-heading-top"><span className="cn-dose-state" data-due={nextDueDose.status === 'due'}><span />{nextDueDose.status === 'due' ? t.dueNow : t.nextMedication}</span><span className="cn-dose-glyph"><Pill size={27} strokeWidth={1.4} /></span></div>
            <p className="cn-dose-time"><Clock size={17} />{nextDueDose.scheduled_time}</p>
            <h3>{nextDueDose.medicine_name}</h3>
            <p className="cn-dose-quantity">{nextDueDose.dosage}{nextDueDose.strength ? ` · ${nextDueDose.strength}` : ''}</p>
          </div>
          <motion.div {...fadeUp} className="cn-dose-body">
            <span className="cn-dose-meal"><MealIcon size={16} />{t[meal.key]}</span>
            {nextDueDose.instructions && <p className="cn-dose-instructions">{nextDueDose.instructions}</p>}
            <div className="cn-dose-actions">
              <Button variant="tactile" size="lg" onClick={() => markAsTaken(nextDueDose.medicine_id, nextDueDose.scheduled_time)} aria-label={`Mark ${nextDueDose.medicine_name} as taken`}><CheckCircle2 size={20} />{language === 'en' ? 'Mark as taken' : t.taken}</Button>
              <Button variant="secondary" size="lg" onClick={() => markAsSnoozed(nextDueDose.medicine_id, nextDueDose.scheduled_time)} aria-label="Remind me again in 15 minutes"><BellRing size={18} />{language === 'en' ? 'In 15 min' : t.remindLater}</Button>
            </div>
          </motion.div>
        </>
      ) : (
        <div className="cn-dose-rest"><span><CircleCheck size={34} strokeWidth={1.5} /></span><h3>{total > 0 && taken === total ? t.allDoneToday : total > 0 ? (language === 'en' ? 'Check today’s schedule' : t.navSchedule) : t.noMedsTitle}</h3><p>{total > 0 && taken === total ? t.allDoneSubtitle : total > 0 ? (language === 'en' ? 'Review any missed or snoozed doses in your schedule.' : t.noRemindersToday) : t.noMedsSub}</p></div>
      )}
      <div className="cn-dose-progress"><div><span>{language === 'en' ? 'Today’s progress' : t.todayProgress}</span><strong>{taken} <span>/ {total} {language === 'en' ? 'doses' : 'మోతాదులు'}</span></strong></div><Progress value={percent} label={t.todayProgress} /></div>
    </Card>
  );
};
