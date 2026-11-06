import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ScanSearch, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { PillAnalysisResult } from '../types';
import { useAuth } from '../context/AuthContext';
import { translations } from '../i18n/translations';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ImageCapture } from '../components/ImageCapture';
import { SafetyNotice } from '../components/SafetyNotice';
import { useMotionPresets } from '../lib/motion';

export const PillIdentifyPage: React.FC = () => {
  const { language } = useAuth();
  const { fadeUp } = useMotionPresets();
  const t = translations[language];
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PillAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelect = (picked: File) => {
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
    setResult(null);
    setErrorMsg(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setErrorMsg(null);
    try {
      setResult(await api.identify.uploadPill(file));
    } catch (err: any) {
      setErrorMsg(err?.message || 'We could not analyse that photo. Try again in better light.');
    } finally {
      setAnalyzing(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="mx-auto max-w-[900px] space-y-6">
      <PageHeader eyebrow="Camera" title={t.identifyTitle} lede={t.identifySubtitle} />

      <SafetyNotice heading="This is a visual guess, not an identification" body={t.identifyDisclaimer} />

      {errorMsg && (
        <div className="rounded-control border border-coral/30 bg-coral-wash px-4 py-3 text-micro font-semibold text-coral-deep" role="alert">
          {errorMsg}
        </div>
      )}

      <Card>
        <CardContent>
          <ImageCapture
            file={file}
            previewUrl={previewUrl}
            onSelect={handleSelect}
            onClear={resetAll}
            onProcess={handleAnalyze}
            processing={analyzing}
            processLabel="Compare with reference shapes"
            altText="Pill photo ready to compare"
            hint="Place one tablet or capsule on plain white paper, shoot straight down, and keep the shadow off the edges."
          />
        </CardContent>
      </Card>

      {result && (
        <motion.div {...fadeUp} className="space-y-5">
          <SafetyNotice heading="About this result" body={result.disclaimer} />
          {/* What the pipeline actually measured */}
          <Card>
            <CardContent className="flex flex-wrap gap-x-10 gap-y-4 py-5">
              <Feature label="Outline" value={result.detected_features.shape} />
              <Feature label="Dominant tone" value={result.detected_features.color} />
              <Feature
                label="Length to width"
                value={`${result.detected_features.aspect_ratio.toFixed(2)} : 1`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4 sm:items-end">
              <div className="space-y-1">
                <CardTitle>{t.possibleMatches}</CardTitle>
                <CardDescription>
                  Ranked by how close the outline and tone are to our reference table.
                </CardDescription>
              </div>
              <p className="text-micro font-semibold uppercase tracking-wider text-ink-mute">
                {result.matches.length} candidate{result.matches.length === 1 ? '' : 's'}
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {result.matches.length === 0 ? (
                <div className="cn-empty">
                  <ScanSearch className="h-7 w-7 text-ink-faint" />
                  <p className="text-body font-semibold text-ink">No close reference matches</p>
                  <p className="max-w-sm text-micro text-ink-mute">
                    The photo did not resemble anything in the reference table closely enough to suggest a name.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {result.matches.map((match, index) => (
                    <li key={`${match.name}-${index}`} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-body font-semibold text-ink">{match.name}</h3>
                          <p className="mt-0.5 text-micro text-ink-mute tabular">
                            {match.strength} · {match.shape} · {match.color}
                          </p>
                        </div>
                        <p className="font-display text-lg font-medium tabular text-teal-deep">
                          {Math.round(match.confidence * 100)}%
                        </p>
                      </div>

                      <div className="mt-2 h-1 overflow-hidden rounded-pill bg-paper-sunken">
                        <div
                          className="h-full rounded-pill bg-teal"
                          style={{ width: `${Math.round(match.confidence * 100)}%` }}
                        />
                      </div>

                      <p className="mt-3 text-micro leading-relaxed text-ink-soft">
                        <span className="font-semibold text-ink">Commonly used for: </span>
                        {match.possible_uses}
                      </p>
                      <p className="mt-2 text-micro italic leading-relaxed text-ink-faint">{match.disclaimer}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:justify-between">
            <Button variant="secondary" onClick={resetAll}>
              Compare another pill
            </Button>
            {result.allow_manual_entry && (
              <Button onClick={() => navigate('/medicines')}>
                {t.manualEntry}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          <p className="flex items-start gap-2 text-micro leading-relaxed text-ink-faint">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
            Nothing here should be taken on the strength of this screen alone. Confirm with your pharmacist before
            swallowing an unfamiliar tablet.
          </p>
        </motion.div>
      )}
    </div>
  );
};

const Feature: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="cn-eyebrow">{label}</p>
    <p className="mt-1 font-display text-lg font-medium capitalize text-ink">{value}</p>
  </div>
);
