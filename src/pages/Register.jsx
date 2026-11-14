import { useState } from 'react';
import { Link, useRouter } from '../lib/router';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/PublicHeader';
import { backendErrors, rules, validate } from '../lib/validate';

const EMPTY = { full_name: '', email: '', password: '', confirm_password: '' };
const CHECKS = [['full_name'], ['email'], ['password'], ['confirm_password']];

// The design has one "Full legal name" box; the backend wants first_name + last_name.
// First word = first name, the rest = last name.
function splitName(full) {
  const parts = full.trim().split(/\s+/);
  return { first_name: parts[0] || '', last_name: parts.slice(1).join(' ') };
}

export default function Register() {
  const { register } = useAuth();
  const { navigate } = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => {
    const value = e.target.value;
    setForm((f) => {
      const next = { ...f, [k]: value };
      // once a field has been visited, re-check it as the user types
      if (touched[k]) setErrors((er) => ({ ...er, [k]: rules[k](value, next), form: '' }));
      if (k === 'password' && touched.confirm_password) {
        setErrors((er) => ({ ...er, confirm_password: rules.confirm_password(next.confirm_password, next) }));
      }
      return next;
    });
  };
  const blur = (k) => () => {
    setTouched((t) => ({ ...t, [k]: true }));
    setErrors((er) => ({ ...er, [k]: rules[k](form[k], form) }));
  };

  async function submit(e) {
    e.preventDefault();
    const found = validate(form, CHECKS);
    setTouched({ full_name: true, email: true, password: true, confirm_password: true });
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }

    setBusy(true);
    try {
      const { first_name, last_name } = splitName(form.full_name);
      await register({ first_name, last_name, email: form.email.trim(), password: form.password, confirm_password: form.confirm_password });
      navigate('/login?registered=1', { replace: true });
    } catch (err) {
      const mapped = backendErrors(err.data);
      if (!Object.keys(mapped).length) mapped.form = err.message;
      setErrors(mapped);
    } finally {
      setBusy(false);
    }
  }

  const fieldProps = (k) => ({
    id: k,
    value: form[k],
    onChange: set(k),
    onBlur: blur(k),
    'aria-invalid': !!errors[k],
    className: errors[k] ? 'invalid' : '',
  });
  const err = (k) => (errors[k] ? <div className="field-error" role="alert">{errors[k]}</div> : null);

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <Logo />
        <p className="overline">New applicant</p>
        <h1 className="auth-title">Create your account</h1>
        <p className="sub">Your account lets you save an application and receive your admission decision securely.</p>

        <form onSubmit={submit} className="auth-form" noValidate>
          <div className="field">
            <label htmlFor="full_name">Full legal name</label>
            <input {...fieldProps('full_name')} autoComplete="name" placeholder="e.g. Adaeze Nwosu" />
            {err('full_name')}
          </div>
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input {...fieldProps('email')} type="email" autoComplete="email" placeholder="you@example.com" />
            {err('email')}
            {errors.email?.startsWith('This email is already registered') && (
              <Link to="/login" className="field-link">Go to sign in →</Link>
            )}
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input {...fieldProps('password')} type="password" autoComplete="new-password" placeholder="Minimum 8 characters" />
            {err('password') || <div className="field-hint">At least 8 characters, with a letter and a number.</div>}
          </div>
          <div className="field">
            <label htmlFor="confirm_password">Confirm password</label>
            <input {...fieldProps('confirm_password')} type="password" autoComplete="new-password" placeholder="Repeat your password" />
            {err('confirm_password')}
          </div>
          {errors.form && <div className="alert alert-error">{errors.form}</div>}
          <button className="btn btn-primary btn-block btn-lg" disabled={busy}>{busy ? 'Creating account…' : 'Create applicant account'}</button>
        </form>

        <p className="auth-links">Already have an account? <Link to="/login">Sign in</Link></p>
        <Link to="/" className="back-link">← Back to portal home</Link>
      </div>
    </div>
  );
}
