import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, UserRound, HeartHandshake, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { BrandMark } from '../components/BrandMark';
import { AuthStory } from '../components/AuthStory';
import { useMotionPresets } from '../lib/motion';

export const LoginPage: React.FC = () => {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const { fadeUp } = useMotionPresets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const signIn = async (run: () => Promise<void>) => {
    setError(null);
    setBusy(true);
    try {
      await run();
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'We could not sign you in. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-layout">
      <AuthStory />
      <section className="auth-form-side" aria-labelledby="login-heading">
        <div className="auth-mobile-brand"><BrandMark /><span className="auth-mobile-label">DAILY CARE, TOGETHER</span></div>
        <div className="auth-form-top"><span>NEW TO CARENEST?</span><Link to="/register">Create a profile <ArrowRight size={14} /></Link></div>
        <motion.div {...fadeUp} className="auth-form-content">
          <p className="cn-eyebrow">A MOMENT FOR YOU</p>
          <h1 id="login-heading" className="auth-heading">Welcome back<span>.</span></h1>
          <p className="auth-intro">Let’s take care of today, one small step at a time.</p>
          <form onSubmit={event => { event.preventDefault(); void signIn(() => login(email.trim(), password)); }} className="auth-login-form" aria-busy={busy}>
            {error && <p className="rounded-control border border-coral/30 bg-coral-wash p-3 text-body text-coral-deep" role="alert">{error}</p>}
            <div>
              <label htmlFor="login-email" className="cn-field-label">Email address</label>
              <input id="login-email" type="email" autoComplete="email" required disabled={busy} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="cn-input" />
            </div>
            <div>
              <label htmlFor="login-password" className="cn-field-label">Password</label>
              <div className="auth-password">
                <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required disabled={busy} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" className="cn-input pr-14" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
              </div>
            </div>
            <Button type="submit" size="lg" disabled={busy} className="auth-submit">{busy ? <><LoaderCircle className="animate-spin h-4 w-4" /> Signing in…</> : <>Sign in <ArrowRight size={18} /></>}</Button>
          </form>
          <div className="auth-demo">
            <div className="auth-divider"><span /> <p>JUST LOOKING AROUND?</p> <span /></div>
            <p className="auth-demo-intro">Try CareNest with a sample profile.</p>
            <div className="auth-personas">
              <button disabled={busy} onClick={() => signIn(() => demoLogin('elderly'))}><UserRound size={20} /><span><strong>For myself</strong><small>Patient demo</small></span><ArrowRight size={16} /></button>
              <button disabled={busy} onClick={() => signIn(() => demoLogin('caregiver'))}><HeartHandshake size={21} /><span><strong>For a loved one</strong><small>Caregiver demo</small></span><ArrowRight size={16} /></button>
            </div>
            <p className="auth-demo-disclosure">Sample records reset when you reopen or refresh this page.</p>
          </div>
        </motion.div>
        <footer className="auth-footer"><span>DESIGNED AROUND PEOPLE.</span><p>An academic care companion. Always follow your clinician’s advice.</p></footer>
      </section>
    </main>
  );
};
