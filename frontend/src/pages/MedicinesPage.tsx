import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Search, Pill, Edit2, Trash2, X, Stethoscope, Clock } from 'lucide-react';
import { Medicine, MealTiming, PillShape, PillColor } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { translations } from '../i18n/translations';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useFeedback } from '../components/ui/Feedback';
import { useMotionPresets } from '../lib/motion';
import { cn } from '../lib/utils';

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Every 6 hours', 'Weekly', 'As needed'];
const MEAL_OPTIONS: { value: MealTiming; labelKey: 'beforeFood' | 'afterFood' | 'withFood' | 'withWater' }[] = [
  { value: 'after_food', labelKey: 'afterFood' },
  { value: 'before_food', labelKey: 'beforeFood' },
  { value: 'with_food', labelKey: 'withFood' },
  { value: 'not_specified', labelKey: 'withWater' },
];
const SHAPES: { value: PillShape; label: string }[] = [
  { value: 'round', label: 'Round tablet' },
  { value: 'oval', label: 'Oval tablet' },
  { value: 'capsule', label: 'Capsule' },
  { value: 'square', label: 'Square' },
];
const COLORS: { value: PillColor; label: string; swatch: string }[] = [
  { value: 'teal', label: 'Teal / green', swatch: '#1B7A78' },
  { value: 'white', label: 'White', swatch: '#F1EFE9' },
  { value: 'yellow', label: 'Yellow', swatch: '#E0B84C' },
  { value: 'blue', label: 'Blue', swatch: '#4A7FB5' },
  { value: 'red', label: 'Red / pink', swatch: '#C0392B' },
];

interface DraftState {
  name: string;
  strength: string;
  dosage: string;
  frequency: string;
  scheduledTimes: string;
  mealTiming: MealTiming;
  instructions: string;
  prescribingDoctor: string;
  pillShape: PillShape;
  pillColor: PillColor;
  isActive: boolean;
}

const BLANK: DraftState = {
  name: '',
  strength: '',
  dosage: '1 tablet',
  frequency: 'Twice daily',
  scheduledTimes: '08:00, 20:00',
  mealTiming: 'after_food',
  instructions: '',
  prescribingDoctor: '',
  pillShape: 'round',
  pillColor: 'teal',
  isActive: true,
};

export const MedicinesPage: React.FC = () => {
  const { language } = useAuth();
  const t = translations[language];
  const { toast, confirm } = useFeedback();
  const { fadeUp, reduced } = useMotionPresets();

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);
  const [draft, setDraft] = useState<DraftState>(BLANK);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const setField = <K extends keyof DraftState>(key: K, value: DraftState[K]) =>
    setDraft(prev => ({ ...prev, [key]: value }));

  const fetchMedicines = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setMedicines(await api.medicines.list(searchQuery, activeOnly));
    } catch (err: any) {
      setLoadError(err?.message || 'We could not load your medicines. Check your connection and retry.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeOnly]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const openAddModal = () => {
    setEditingMed(null);
    setDraft(BLANK);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (med: Medicine) => {
    setEditingMed(med);
    setDraft({
      name: med.name,
      strength: med.strength ?? '',
      dosage: med.dosage,
      frequency: med.frequency,
      scheduledTimes: med.scheduled_times,
      mealTiming: med.meal_timing,
      instructions: med.instructions ?? '',
      prescribingDoctor: med.prescribing_doctor ?? '',
      pillShape: med.pill_shape ?? 'round',
      pillColor: med.pill_color ?? 'teal',
      isActive: med.is_active,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveMedicine = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim()) {
      setFormError('Please enter the medicine name exactly as it appears on your prescription.');
      return;
    }
    if (!/^\s*\d{1,2}:\d{2}(\s*,\s*\d{1,2}:\d{2})*\s*$/.test(draft.scheduledTimes)) {
      setFormError('Times must be listed as 24-hour clock values, for example: 08:00, 20:00');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: draft.name.trim(),
        strength: draft.strength.trim(),
        dosage: draft.dosage.trim(),
        frequency: draft.frequency,
        scheduled_times: draft.scheduledTimes.replace(/\s+/g, ' ').trim(),
        meal_timing: draft.mealTiming,
        start_date: editingMed?.start_date || new Date().toISOString().split('T')[0],
        instructions: draft.instructions.trim(),
        prescribing_doctor: draft.prescribingDoctor.trim(),
        pill_shape: draft.pillShape,
        pill_color: draft.pillColor,
        is_active: draft.isActive,
      };

      if (editingMed) {
        await api.medicines.update(editingMed.id, payload);
        toast(`${payload.name} updated`, 'success');
      } else {
        await api.medicines.create(payload);
        toast(`${payload.name} added to your schedule`, 'success');
      }
      setIsModalOpen(false);
      fetchMedicines();
    } catch (err: any) {
      setFormError(err?.message || 'We could not save this medicine. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMedicine = async (med: Medicine) => {
    const ok = await confirm({
      title: `Remove ${med.name}?`,
      body: 'Its reminders stop immediately and past history is kept. You can add it again later.',
      confirmLabel: 'Remove medicine',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.medicines.delete(med.id);
      toast(`${med.name} removed`, 'success');
      fetchMedicines();
    } catch (err: any) {
      toast(err?.message || 'We could not remove that medicine.', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-[1120px] space-y-6">
      <PageHeader
        eyebrow="Regimen"
        title={t.navMedicines}
        lede="Everything here comes from your prescriptions. Keep it matched to what your doctor wrote."
        actions={
          <Button onClick={openAddModal}>
            <Plus className="h-4 w-4" />
            {t.addNewMedicine}
          </Button>
        }
      />

      {/* Search + filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            placeholder={t.searchMedicines}
            aria-label={t.searchMedicines}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="cn-input pl-9"
          />
        </div>

        <div className="cn-segment" role="group" aria-label="Filter medicines">
          <button onClick={() => setActiveOnly(true)} data-active={activeOnly} aria-pressed={activeOnly} className="cn-segment-item">
            {t.filterActive}
          </button>
          <button onClick={() => setActiveOnly(false)} data-active={!activeOnly} aria-pressed={!activeOnly} className="cn-segment-item">
            {t.filterAll}
          </button>
        </div>
      </div>

      {loadError && (
        <div className="cn-notice" role="alert">
          <AlertIcon />
          <div className="flex-1">
            <p className="text-body font-semibold">{loadError}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={fetchMedicines}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map(i => (
            <li key={i} className="cn-panel p-5">
              <div className="cn-skeleton h-5 w-2/3" />
              <div className="cn-skeleton mt-3 h-4 w-1/3" />
              <div className="cn-skeleton mt-6 h-3 w-full" />
              <div className="cn-skeleton mt-2 h-3 w-4/5" />
            </li>
          ))}
        </ul>
      ) : medicines.length > 0 ? (
        <motion.ul
          className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3"
          initial={reduced ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: reduced ? 0 : 0.05 }}
        >
          {medicines.map(med => (
            <li key={med.id}>
              <div className="flex h-full flex-col rounded-panel border border-line bg-paper-cool p-5 transition-shadow hover:shadow-panel">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <PillGlyph shape={med.pill_shape ?? 'round'} color={med.pill_color ?? 'teal'} />
                      <div className="min-w-0">
                        <h3 className="break-words text-body font-semibold leading-snug text-ink">{med.name}</h3>
                        <p className="mt-0.5 text-micro text-ink-mute">{med.strength || med.frequency}</p>
                      </div>
                    </div>
                    <Badge variant={med.is_active ? 'success' : 'neutral'} dot>
                      {med.is_active ? 'Active' : 'Paused'}
                    </Badge>
                </div>

                  <dl className="mt-4 space-y-2 border-t border-line pt-4 text-micro">
                    <Row label={language === 'en' ? 'Dosage' : t.dosage}>{med.dosage}</Row>
                    <Row label={language === 'en' ? 'Times' : t.scheduledTimes}>
                      <span className="tabular text-teal-deep">{med.scheduled_times}</span>
                    </Row>
                    <Row label={t.mealTiming}>
                      {t[MEAL_OPTIONS.find(o => o.value === med.meal_timing)?.labelKey ?? 'withWater']}
                    </Row>
                    {med.prescribing_doctor && (
                      <Row label={language === 'en' ? 'Prescriber' : t.prescribingDoctor}>{med.prescribing_doctor}</Row>
                    )}
                  </dl>

                  {med.instructions && (
                    <p className="mt-3 rounded-[10px] bg-paper px-3 py-2 text-micro italic leading-snug text-ink-soft">
                      “{med.instructions}”
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-end gap-1.5 border-t border-line pt-4">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(med)}>
                      <Edit2 className="h-4 w-4" />
                      {t.editMedicine}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-ink-faint hover:bg-coral-wash hover:text-coral"
                      onClick={() => handleDeleteMedicine(med)}
                      aria-label={`Remove ${med.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                </div>
            </li>
          ))}
        </motion.ul>
      ) : (
        <div className="cn-empty">
          <Pill className="h-8 w-8 text-ink-faint" />
          <h2 className="mt-1 font-display text-section font-medium text-ink">{t.noMedsTitle}</h2>
          <p className="max-w-md text-body text-ink-mute">{t.noMedsSub}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <Button onClick={openAddModal}>{t.addFirstMed}</Button>
            <Button variant="secondary" onClick={() => (window.location.hash = '#/scan')}>
              {t.actionScan}
            </Button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <MedicineDialog
            draft={draft}
            editing={Boolean(editingMed)}
            formError={formError}
            saving={saving}
            setField={setField}
            onCancel={() => setIsModalOpen(false)}
            onSubmit={handleSaveMedicine}
            t={t}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ---------------- sub-components ---------------- */

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-baseline justify-between gap-3">
    <dt className="max-w-[48%] text-ink-mute">{label}</dt>
    <dd className="min-w-0 break-words text-right font-semibold text-ink-soft">{children}</dd>
  </div>
);

/** Shape + colour are drawn from the stored attributes — no photography invented. */
const PillGlyph: React.FC<{ shape: PillShape; color: PillColor }> = ({ shape, color }) => {
  const hex = COLORS.find(c => c.value === color)?.swatch ?? '#1B7A78';
  const stroke = color === 'white' ? '#C9C4B8' : 'transparent';
  const common = { fill: hex, stroke, strokeWidth: color === 'white' ? 1.5 : 0 };

  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] border border-line bg-paper" aria-hidden>
      <svg viewBox="0 0 24 24" className="h-6 w-6">
        {shape === 'round' && <circle cx="12" cy="12" r="7" {...common} />}
        {shape === 'oval' && <ellipse cx="12" cy="12" rx="8.5" ry="5.5" {...common} />}
        {shape === 'square' && <rect x="5.5" y="5.5" width="13" height="13" rx="3.5" {...common} />}
        {shape === 'capsule' && (
          <>
            <rect x="4" y="9" width="16" height="6.5" rx="3.25" {...common} />
            <path d="M12 9v6.5" stroke={color === 'white' ? '#C9C4B8' : 'rgba(255,255,255,0.55)'} strokeWidth="1.2" />
          </>
        )}
      </svg>
    </span>
  );
};

const AlertIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-brass" fill="none" aria-hidden>
    <path d="M12 9v4m0 3h.01M10.3 4.3 3.6 16a2 2 0 0 0 1.7 3h13.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface DialogProps {
  draft: DraftState;
  editing: boolean;
  formError: string | null;
  saving: boolean;
  setField: <K extends keyof DraftState>(key: K, value: DraftState[K]) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  t: (typeof translations)['en'];
}

const MedicineDialog: React.FC<DialogProps> = ({ draft, editing, formError, saving, setField, onCancel, onSubmit, t }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <motion.div
        className="fixed inset-0 bg-ink-deep/45"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        aria-hidden
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="medicine-dialog-title"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.99 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="cn-panel relative my-4 w-full max-w-xl shadow-raised"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <p className="cn-eyebrow">{editing ? 'Edit entry' : 'New entry'}</p>
            <h2 id="medicine-dialog-title" className="mt-1 font-display text-section font-medium text-ink">
              {editing ? t.editMedicine : t.addNewMedicine}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Close dialog">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 px-5 py-5 sm:px-6">
          {formError && (
            <div className="rounded-control border border-coral/30 bg-coral-wash px-3.5 py-3 text-micro font-semibold text-coral-deep" role="alert">
              {formError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`${t.medicineName} *`} htmlFor="med-name">
              <input
                ref={inputRef}
                id="med-name"
                required
                value={draft.name}
                onChange={e => setField('name', e.target.value)}
                placeholder="Metformin"
                className="cn-input"
              />
            </Field>
            <Field label={t.strength} htmlFor="med-strength" hint="Optional">
              <input
                id="med-strength"
                value={draft.strength}
                onChange={e => setField('strength', e.target.value)}
                placeholder="500 mg"
                className="cn-input"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.dosage} htmlFor="med-dosage">
              <input
                id="med-dosage"
                value={draft.dosage}
                onChange={e => setField('dosage', e.target.value)}
                className="cn-input"
              />
            </Field>
            <Field label={t.frequency} htmlFor="med-frequency">
              <select
                id="med-frequency"
                value={draft.frequency}
                onChange={e => setField('frequency', e.target.value)}
                className="cn-select"
              >
                {FREQUENCIES.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={t.scheduledTimes} htmlFor="med-times" hint="24-hour clock, separated by commas">
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                id="med-times"
                value={draft.scheduledTimes}
                onChange={e => setField('scheduledTimes', e.target.value)}
                className="cn-input pl-9 tabular"
              />
            </div>
          </Field>

          <fieldset>
            <legend className="cn-field-label">{t.mealTiming}</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MEAL_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={cn(
                    'cursor-pointer rounded-control border px-3 py-2 text-center text-micro font-semibold transition-colors',
                    draft.mealTiming === opt.value
                      ? 'border-teal bg-teal-wash text-teal-deep'
                      : 'border-line bg-paper-cool text-ink-mute hover:border-ink-faint hover:text-ink'
                  )}
                >
                  <input
                    type="radio"
                    name="meal-timing"
                    className="sr-only"
                    checked={draft.mealTiming === opt.value}
                    onChange={() => setField('mealTiming', opt.value)}
                  />
                  {t[opt.labelKey]}
                </label>
              ))}
            </div>
          </fieldset>

          <Field label={t.instructions} htmlFor="med-instructions" hint="Copied from your prescription">
            <textarea
              id="med-instructions"
              rows={2}
              value={draft.instructions}
              onChange={e => setField('instructions', e.target.value)}
              placeholder="Take with breakfast, swallow whole"
              className="cn-input resize-y"
            />
          </Field>

          <Field label={t.prescribingDoctor} htmlFor="med-doctor">
            <div className="relative">
              <Stethoscope className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                id="med-doctor"
                value={draft.prescribingDoctor}
                onChange={e => setField('prescribingDoctor', e.target.value)}
                placeholder="Dr. K. Srinivas Rao"
                className="cn-input pl-9"
              />
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.pillShape} htmlFor="med-shape">
              <select
                id="med-shape"
                value={draft.pillShape}
                onChange={e => setField('pillShape', e.target.value as PillShape)}
                className="cn-select"
              >
                {SHAPES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>
            <Field label={t.pillColor} htmlFor="med-color">
              <select
                id="med-color"
                value={draft.pillColor}
                onChange={e => setField('pillColor', e.target.value as PillColor)}
                className="cn-select"
              >
                {COLORS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-panel border border-line bg-paper px-4 py-3">
            <span>
              <span className="block text-body font-semibold text-ink">{t.activeStatus}</span>
              <span className="mt-0.5 block text-micro text-ink-mute">Paused medicines keep their history but stop reminding you.</span>
            </span>
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={e => setField('isActive', e.target.checked)}
              className="h-5 w-5 shrink-0 accent-teal"
            />
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onCancel}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : t.saveMedicine}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const Field: React.FC<{
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, htmlFor, hint, children }) => (
  <div>
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="text-micro font-semibold text-ink-soft">
        {label}
      </label>
      {hint && <span className="text-micro text-ink-faint">{hint}</span>}
    </div>
    {children}
  </div>
);
