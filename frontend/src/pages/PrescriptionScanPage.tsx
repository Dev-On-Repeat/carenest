import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Plus, Trash2, FileText, UserRound, Building2 } from 'lucide-react';
import { api } from '../services/api';
import { OCRResult, ExtractedMedicine, MealTiming } from '../types';
import { useAuth } from '../context/AuthContext';
import { useReminders } from '../context/ReminderContext';
import { translations } from '../i18n/translations';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ImageCapture } from '../components/ImageCapture';
import { SafetyNotice } from '../components/SafetyNotice';
import { useFeedback } from '../components/ui/Feedback';
import { useMotionPresets } from '../lib/motion';

const MEAL_OPTIONS: { value: MealTiming; labelKey: 'beforeFood' | 'afterFood' | 'withFood' | 'withWater' }[] = [
  { value: 'after_food', labelKey: 'afterFood' },
  { value: 'before_food', labelKey: 'beforeFood' },
  { value: 'with_food', labelKey: 'withFood' },
  { value: 'not_specified', labelKey: 'withWater' },
];

const STEPS = ['Photograph', 'Review', 'Confirm'];

export const PrescriptionScanPage: React.FC = () => {
  const { language } = useAuth();
  const { refreshSchedule } = useReminders();
  const { toast } = useFeedback();
  const { fadeUp } = useMotionPresets();
  const t = translations[language];

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [rows, setRows] = useState<ExtractedMedicine[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const step = confirmed ? 2 : result ? 1 : 0;

  const handleSelect = (picked: File) => {
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
    setResult(null);
    setRows([]);
    setConfirmed(false);
    setErrorMsg(null);
  };

  const handleProcessOCR = async () => {
    if (!file) return;
    setProcessing(true);
    setErrorMsg(null);
    try {
      const ocr = await api.prescriptions.upload(file);
      setResult(ocr);
      setRows(ocr.medicines ?? []);
      if (!ocr.medicines?.length) {
        toast('No medicines could be read from that photo. Add them manually or retake it.', 'info');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'We could not read that prescription. Try a clearer photo.');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (rows.length === 0) return;
    setProcessing(true);
    setErrorMsg(null);
    try {
      await api.prescriptions.confirm(rows, result?.doctor_name, result?.clinic_name);
      setConfirmed(true);
      await refreshSchedule();
      toast(`${rows.length} medicine${rows.length === 1 ? '' : 's'} added to your schedule`, 'success');
    } catch (err: any) {
      setErrorMsg(err?.message || 'We could not save these medicines.');
    } finally {
      setProcessing(false);
    }
  };

  const updateRow = (index: number, patch: Partial<ExtractedMedicine>) =>
    setRows(prev => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const removeRow = (index: number) => setRows(prev => prev.filter((_, i) => i !== index));

  const addManualRow = () =>
    setRows(prev => [
      ...prev,
      {
        name: '',
        strength: '',
        dosage: '1 tablet',
        frequency: 'Once daily',
        meal_timing: 'after_food',
        instructions: '',
        confidence: 1,
      },
    ]);

  const resetAll = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setRows([]);
    setConfirmed(false);
    setErrorMsg(null);
  };

  return (
    <div className="mx-auto max-w-[900px] space-y-6">
      <PageHeader eyebrow="Camera" title={t.scanTitle} lede={t.scanSubtitle} />

      <SafetyNotice heading="Check every line against the paper copy" body={t.ocrDisclaimer} />

      {/* Progress rail — real steps, no decoration */}
      <ol className="cn-scan-steps flex items-center gap-3 border-b border-line pb-4">
        {STEPS.map((label, index) => (
          <li key={label} className="flex flex-1 items-center gap-3">
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-micro font-semibold tabular ${
                index < step
                  ? 'border-teal bg-teal text-white'
                  : index === step
                  ? 'border-teal bg-teal-wash text-teal-deep'
                  : 'border-line bg-paper text-ink-faint'
              }`}
              aria-current={index === step ? 'step' : undefined}
            >
              {index < step ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
            </span>
            <span className={`truncate text-micro font-semibold ${index <= step ? 'text-ink' : 'text-ink-faint'}`}>
              {label}
            </span>
            {index < STEPS.length - 1 && <span aria-hidden className="hidden h-px flex-1 bg-line sm:block" />}
          </li>
        ))}
      </ol>

      {errorMsg && (
        <div className="rounded-control border border-coral/30 bg-coral-wash px-4 py-3 text-micro font-semibold text-coral-deep" role="alert">
          {errorMsg}
        </div>
      )}

      {step === 0 && (
        <Card>
          <CardContent>
            <ImageCapture
              file={file}
              previewUrl={previewUrl}
              onSelect={handleSelect}
              onClear={resetAll}
              onProcess={handleProcessOCR}
              processing={processing}
              processLabel="Read prescription"
              altText="Prescription photo ready to read"
              hint="Hold the page flat, fill the frame with the writing, and keep the light even so the reading is accurate."
            />
          </CardContent>
        </Card>
      )}

      {result && <SafetyNotice heading="Review the result" body={result.disclaimer} />}

      {step === 1 && result && (
        <motion.div {...fadeUp} className="space-y-5">
          {(result.doctor_name || result.clinic_name || result.date) && (
            <Card>
              <CardContent className="flex flex-wrap gap-x-8 gap-y-3 py-4">
                {result.doctor_name && (
                  <Detail icon={UserRound} label={t.doctorDetected} value={result.doctor_name} />
                )}
                {result.clinic_name && (
                  <Detail icon={Building2} label={t.clinicDetected} value={result.clinic_name} />
                )}
                {result.date && <Detail icon={FileText} label="Date on page" value={result.date} />}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div className="space-y-1">
                <CardTitle>{t.possibleMatches}</CardTitle>
                <CardDescription>
                  Correct anything that looks wrong before saving — this becomes your reminder schedule.
                </CardDescription>
              </div>
              <Badge variant="mint">{rows.length} lines</Badge>
            </CardHeader>

            <CardContent className="space-y-4">
              {rows.length === 0 ? (
                <div className="cn-empty">
                  <FileText className="h-7 w-7 text-ink-faint" />
                  <p className="text-body font-semibold text-ink">Nothing was readable in that photo</p>
                  <p className="max-w-sm text-micro text-ink-mute">
                    Add each medicine yourself, or take the photo again closer to the page.
                  </p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {rows.map((row, index) => (
                    <li key={index} className="rounded-panel border border-line bg-paper p-4">
                      <div className="flex items-start justify-between gap-3">
                        <ConfidenceMeter value={row.confidence} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-ink-faint hover:bg-coral-wash hover:text-coral"
                          onClick={() => removeRow(index)}
                          aria-label={`Remove ${row.name || 'this line'}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <Cell label={t.medicineName}>
                          <input
                            value={row.name}
                            onChange={e => updateRow(index, { name: e.target.value })}
                            className="cn-input"
                            placeholder="Metformin"
                          />
                        </Cell>
                        <Cell label={t.strength}>
                          <input
                            value={row.strength ?? ''}
                            onChange={e => updateRow(index, { strength: e.target.value })}
                            className="cn-input"
                            placeholder="500 mg"
                          />
                        </Cell>
                        <Cell label={t.dosage}>
                          <input
                            value={row.dosage}
                            onChange={e => updateRow(index, { dosage: e.target.value })}
                            className="cn-input"
                          />
                        </Cell>
                        <Cell label={t.frequency}>
                          <input
                            value={row.frequency}
                            onChange={e => updateRow(index, { frequency: e.target.value })}
                            className="cn-input"
                          />
                        </Cell>
                        <Cell label={t.mealTiming}>
                          <select
                            value={row.meal_timing}
                            onChange={e => updateRow(index, { meal_timing: e.target.value as MealTiming })}
                            className="cn-select"
                          >
                            {MEAL_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {t[opt.labelKey]}
                              </option>
                            ))}
                          </select>
                        </Cell>
                        <Cell label={t.instructions}>
                          <input
                            value={row.instructions ?? ''}
                            onChange={e => updateRow(index, { instructions: e.target.value })}
                            className="cn-input"
                          />
                        </Cell>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <Button variant="outline" onClick={addManualRow}>
                <Plus className="h-4 w-4" />
                Add another medicine
              </Button>

              <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:justify-between">
                <Button variant="secondary" onClick={resetAll}>
                  {t.rescan}
                </Button>
                <Button
                  size="lg"
                  onClick={handleConfirm}
                  disabled={processing || rows.length === 0 || rows.some(r => !r.name.trim())}
                >
                  <CheckCircle2 className="h-5 w-5" />
                  {t.confirmAndSave}
                </Button>
              </div>
              {rows.some(r => !r.name.trim()) && (
                <p className="text-right text-micro font-semibold text-brass">
                  Every line needs a medicine name before you can save.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div {...fadeUp}>
          <Card className="border-leaf/35 bg-leaf-wash">
            <CardContent className="py-10 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-leaf text-white">
                <CheckCircle2 className="h-7 w-7" />
              </span>
              <h2 className="mt-4 font-display text-section font-medium text-ink">
                Added to your medication list
              </h2>
              <p className="mx-auto mt-2 max-w-md text-body text-ink-soft">
                Reminders are set for the times you confirmed. Please glance at today&rsquo;s schedule to make sure they
                match your prescription.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button onClick={resetAll}>{t.rescan}</Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    window.location.hash = '#/schedule';
                  }}
                >
                  See today&rsquo;s schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

const Detail: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3">
    <span className="grid h-9 w-9 place-items-center rounded-[10px] border border-line bg-paper text-ink-soft">
      <Icon className="h-4 w-4" />
    </span>
    <div>
      <p className="cn-eyebrow">{label}</p>
      <p className="text-body font-semibold text-ink">{value}</p>
    </div>
  </div>
);

const Cell: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="cn-field-label">{label}</span>
    {children}
  </label>
);

/** Honest reporting of the OCR confidence the backend returned. */
const ConfidenceMeter: React.FC<{ value: number }> = ({ value }) => {
  const percent = Math.round(Math.min(1, Math.max(0, value || 0)) * 100);
  const tone = percent >= 75 ? 'text-leaf' : percent >= 45 ? 'text-brass' : 'text-coral';
  const word = percent >= 75 ? 'read clearly' : percent >= 45 ? 'check this line' : 'hard to read';

  return (
    <div>
      <p className={`text-micro font-semibold uppercase tracking-wider ${tone}`}>{percent}% · {word}</p>
      <div className="mt-1.5 h-1 w-28 overflow-hidden rounded-pill bg-paper-sunken">
        <div
          className={percent >= 75 ? 'h-full bg-leaf' : percent >= 45 ? 'h-full bg-brass' : 'h-full bg-coral'}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
