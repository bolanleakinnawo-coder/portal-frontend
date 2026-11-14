import { useState } from 'react';
import { Link, useRouter } from '../lib/router';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/PublicHeader';
import { validate } from '../lib/validate';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../api/auth';
import { homeFor } from '../config/roles';

const SHOW_DEMO = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS !== 'false';

const CHECKS = [['email'], ['password', 'login_password']];

export default function Login() {
  const { login } = useAuth();
  const { navigate, search } = useRouter();
  const justRegistered = new URLSearchParams(search).get('registered');
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k] || errors.form) setErrors((er) => ({ ...er, [k]: '', form: '' }));
  };

  async function submit(e) {
    e.preventDefault();
    const found = validate(form, CHECKS);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }

    setBusy(true);
    // Render free servers sleep; the first request can take ~30-50 seconds.
    const timer = setTimeout(() => setSlow(true), 5000);
    try {
      const u = await login(form.email.trim(), form.password);
      navigate(homeFor(u), { replace: true });
    } catch (err) {
      setErrors({ form: err.status === 400 || err.status === 401 ? 'Incorrect email or password.' : err.message });
    } finally {
      clearTimeout(timer);
      setSlow(false);
      setBusy(false);
    }
  }

  const err = (k) => (errors[k] ? <div className="field-error" role="alert">{errors[k]}</div> : null);

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <Logo />
        <p className="overline">Welcome back</p>
        <h1 className="auth-title">Sign in to your portal</h1>
        <p className="sub">Track your application, verify your admission status, and continue registration.</p>

        {justRegistered && <div className="alert alert-ok">Account created. Sign in to continue.</div>}

        <form onSubmit={submit} className="auth-form" noValidate>
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@example.com" className={errors.email ? 'invalid' : ''} aria-invalid={!!errors.email} />
            {err('email')}
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="current-password" value={form.password} onChange={set('password')} placeholder="Your password" className={errors.password ? 'invalid' : ''} aria-invalid={!!errors.password} />
            {err('password')}
          </div>
          {errors.form && <div className="alert alert-error">{errors.form}</div>}
          {slow && <div className="alert alert-warn">Waking up the server — the first sign-in can take up to a minute.</div>}
          <button className="btn btn-primary btn-block btn-lg" disabled={busy}>{busy ? 'Signing in…' : 'Sign in to portal'}</button>
        </form>

        <p className="auth-links">New applicant? <Link to="/register">Create account</Link> · Returning student? <Link to="/returning">Register for the session</Link></p>

        {SHOW_DEMO && (
          <details className="demo-box">
            <summary>Demo accounts (staff and sample users)</summary>
            <p className="field-hint">Password for all: <code>{DEMO_PASSWORD}</code>. Click one to fill the form.</p>
            <div className="demo-chips">
              {DEMO_ACCOUNTS.map((a) => (
                <button key={a.email} type="button" className="chip" onClick={() => { setForm({ email: a.email, password: DEMO_PASSWORD }); setErrors({}); }}>{a.label}</button>
              ))}
            </div>
          </details>
        )}
        <Link to="/" className="back-link">← Back to portal home</Link>
      </div>
    </div>
  );
}
