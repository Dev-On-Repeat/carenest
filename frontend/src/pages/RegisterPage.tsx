import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, UserCheck, Stethoscope } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole, Language } from '../types';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BrandMark } from '../components/BrandMark';
import { AuthStory } from '../components/AuthStory';
import { useMotionPresets } from '../lib/motion';
import { cn } from '../lib/utils';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { fadeUp } = useMotionPresets();

  const [role, setRole] = useState<UserRole>('elderly');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [language, setLanguage] = useState<Language>('en');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!fullName.trim()) return setError('Please tell us the name to show on the screen.');
    if (password.length < 8) return setError('Use at least 8 characters for your password.');
    if (password !== confirmPassword) return setError('The two passwords do not match yet.');

    setBusy(true);
    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        role,
        phone: phone.trim() || undefined,
        emergency_contact: emergencyContact.trim() || undefined,
        emergency_phone: emergencyPhone.trim() || undefined,
        preferred_language: language,
        text_size: 'large',
      });
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'We could not create the account. Please check the details and try again.');
    } finally {
      setBusy(false);
    }
  };

  const roles: { id: UserRole; label: string; hint: string; icon: typeof UserCheck }[] = [
    { id: 'elderly', label: 'For myself', hint: 'I take medicines daily', icon: UserCheck },
    { id: 'caregiver', label: 'For someone I care for', hint: 'I follow their schedule', icon: Stethoscope },
  ];

  return (
    <main className="auth-layout auth-register">
      <AuthStory register />

      <section className="auth-form-side px-5 py-10 sm:px-10">
        <motion.div {...fadeUp} className="mx-auto w-full max-w-[460px] space-y-6">
          <div className="lg:hidden">
            <BrandMark />
          </div>

          <div>
            <p className="cn-eyebrow">Create account</p>
            <h1 className="auth-heading">Make yourself at home.</h1>
            <p className="mt-2 text-body text-ink-soft">
              You can add medicines and pair a family member once you are in.
            </p>
          </div>

          <Card>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <p className="rounded-control border border-coral/30 bg-coral-wash px-3.5 py-2.5 text-micro font-semibold text-coral-deep" role="alert">
                    {error}
                  </p>
                )}

                <fieldset>
                  <legend className="cn-field-label">Who is this account for?</legend>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {roles.map(option => (
                      <label
                        key={option.id}
                        className={cn(
                          'cursor-pointer rounded-panel border px-3.5 py-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-teal has-[:focus-visible]:outline-offset-2',
                          role === option.id
                            ? 'border-teal bg-teal-wash'
                            : 'border-line bg-paper-cool hover:border-ink-faint'
                        )}
                      >
                        <input
                          type="radio"
                          name="role"
                          className="sr-only"
                          checked={role === option.id}
                          onChange={() => setRole(option.id)}
                        />
                        <option.icon className={cn('h-5 w-5', role === option.id ? 'text-teal-deep' : 'text-ink-faint')} />
                        <p className="mt-2 text-body font-semibold leading-tight text-ink">{option.label}</p>
                        <p className="mt-0.5 text-micro text-ink-mute">{option.hint}</p>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <Field htmlFor="reg-name" label="Full name">
                  <input
                    id="reg-name"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    autoComplete="name"
                    required
                    placeholder="Ramakrishna Varma"
                    className="cn-input"
                  />
                </Field>

                <Field htmlFor="reg-email" label="Email address">
                  <input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    className="cn-input"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field htmlFor="reg-password" label="Password" hint="8+ characters">
                    <input
                      id="reg-password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      className="cn-input"
                    />
                  </Field>
                  <Field htmlFor="reg-confirm" label="Repeat password">
                    <input
                      id="reg-confirm"
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      className="cn-input"
                    />
                  </Field>
                </div>

                <Field htmlFor="reg-phone" label="Your phone" hint="Optional">
                  <input
                    id="reg-phone"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="+91 90000 00000"
                    className="cn-input tabular"
                  />
                </Field>

                {role === 'elderly' && (
                  <div className="space-y-4 rounded-panel border border-line bg-paper p-4">
                    <p className="cn-eyebrow">Emergency contact</p>
                    <Field htmlFor="reg-emc" label="Name" hint="Optional">
                      <input
                        id="reg-emc"
                        value={emergencyContact}
                        onChange={e => setEmergencyContact(e.target.value)}
                        placeholder="Priya Varma"
                        className="cn-input"
                      />
                    </Field>
                    <Field htmlFor="reg-emcp" label="Their phone" hint="Optional">
                      <input
                        id="reg-emcp"
                        type="tel"
                        value={emergencyPhone}
                        onChange={e => setEmergencyPhone(e.target.value)}
                        placeholder="+91 90000 00000"
                        className="cn-input tabular"
                      />
                    </Field>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 border-t border-line pt-4">
                  <p className="text-micro text-ink-mute">Reminder language</p>
                  <div className="cn-segment" role="group" aria-label="Preferred language">
                    <button
                      type="button"
                      onClick={() => setLanguage('en')}
                      data-active={language === 'en'}
                      aria-pressed={language === 'en'}
                      className="cn-segment-item"
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('te')}
                      data-active={language === 'te'}
                      aria-pressed={language === 'te'}
                      className="cn-segment-item"
                    >
                      తెలుగు
                    </button>
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={busy}>
                  {busy ? 'Creating your account…' : 'Create account'}
                  {!busy && <ArrowRight className="h-4 w-4" />}
                </Button>

                <p className="text-center text-micro text-ink-mute">
                  Already registered?{' '}
                  <Link to="/login" className="font-semibold text-teal-deep underline decoration-teal/30 hover:decoration-teal">
                    Sign in instead
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </main>
  );
};

const Field: React.FC<{ htmlFor: string; label: string; hint?: string; children: React.ReactNode }> = ({
  htmlFor,
  label,
  hint,
  children,
}) => (
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
