import { useMemo, useState } from 'react';
import { Link } from '../lib/router';
import { Logo } from '../components/PublicHeader';
import { Field, useLoad } from '../components/ui';
import { CheckIcon } from '../components/Icons';
import { rules } from '../lib/validate';
import { LEVELS, getLookups, programmeLabel, registerReturningStudent } from '../api/services';
import { registerReturningAccount } from '../api/auth';
import { backendErrors } from '../lib/validate';

// The 14 fields from the project brief for returning students.
const EMPTY = {
  surname: '', first_name: '', other_name: '', gender: '', phone: '', email: '', password: '', confirm_password: '',
  id_type: 'matric', id_value: '', college: '', department: '', programme: '', level: '', session: '',
};

function check(f) {
  const e = {};
  const name = (v, label) => (!v.trim() ? `Enter your ${label}.` : !/^[\p{L}' -]{2,}$/u.test(v.trim()) ? `Use letters only for your ${label}.` : '');
  e.surname = name(f.surname, 'surname');
  e.first_name = name(f.first_name, 'first name');
  if (f.other_name.trim() && !/^[\p{L}' -]{2,}$/u.test(f.other_name.trim())) e.other_name = 'Use letters only.';
  if (!f.gender) e.gender = 'Select your gender.';
  if (!/^\+?\d[\d\s-]{9,15}$/.test(f.phone.trim())) e.phone = 'Enter a valid phone number, e.g. 08012345678.';
  e.email = rules.email(f.email);
  e.password = rules.password(f.password);
  e.confirm_password = rules.confirm_password(f.confirm_password, f);
  if (!f.id_value.trim()) e.id_value = f.id_type === 'matric' ? 'Enter your matric number.' : 'Enter your application number.';
  else if (f.id_type === 'matric' && !/^[A-Z]{2,4}\/\d{4}\/\d{3,6}$/i.test(f.id_value.trim())) e.id_value = 'Matric number should look like PG/2025/0123.';
  else if (f.id_type === 'application' && !/^PG-\d{4}-[A-Z0-9]{6,10}$/i.test(f.id_value.trim())) e.id_value = 'Application number should look like PG-2025-AB12CD34.';
  if (!f.college) e.college = 'Select your college.';
  if (!f.department) e.department = 'Select your department.';
  if (!f.programme) e.programme = 'Select your programme.';
  if (!f.level) e.level = 'Select your level.';
  if (!f.session) e.session = 'Select the session.';
  Object.keys(e).forEach((k) => !e[k] && delete e[k]);
  return e;
}

export default function Returning() {
  const { data: lookups } = useLoad(getLookups, []);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  const departments = useMemo(() => (lookups?.departments || []).filter((d) => d.college === Number(form.college)), [lookups, form.college]);
  const programmes = useMemo(() => (lookups?.programmes || []).filter((p) => p.department === Number(form.department) && p.active), [lookups, form.department]);

  const set = (k) => (e) => {
    const value = e.target.value;
    setForm((f) => {
      const next = { ...f, [k]: value };
      if (k === 'college') { next.department = ''; next.programme = ''; }
      if (k === 'department') next.programme = '';
      return next;
    });
    if (errors[k]) setErrors((er) => ({ ...er, [k]: '' }));
  };
  const inv = (k) => (errors[k] ? 'invalid' : '');

  async function submit(e) {
    e.preventDefault();
    const found = check(form);
    setErrors(found);
    if (Object.keys(found).length) { document.getElementById(Object.keys(found)[0])?.focus(); return; }
    setBusy(true);
    try {
      await registerReturningAccount(form);
      const u = await registerReturningStudent(form);
      setDone(u);
      window.scrollTo(0, 0);
    } catch (err) {
      const mapped = backendErrors(err.data);
      setErrors(Object.keys(mapped).length ? { ...mapped, form: mapped.form || (mapped.email ? '' : err.message) } : { form: err.message });
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-shell">
          <Logo />
          <span className="pay-check big"><CheckIcon width={34} height={34} /></span>
          <h1 className="auth-title">Check your email</h1>
          <p className="sub">We sent an activation link to <strong>{done.email}</strong>. You must activate your account before you can access course registration.</p>
          <p className="sub mt">You can also sign in and open <strong>Messages</strong> to find the link.</p>
          <Link to="/login" className="btn btn-primary btn-lg btn-block">Go to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-shell wide">
        <Logo />
        <p className="overline">Returning student</p>
        <h1 className="auth-title">Register for the session</h1>
        <p className="sub">For students already in the PG School. We’ll email you a link to activate your account before registration.</p>

        <form onSubmit={submit} noValidate className="auth-form">
          <p className="form-section">Personal details</p>
          <div className="three-col">
            <Field id="surname" label="Surname" error={errors.surname}><input id="surname" value={form.surname} onChange={set('surname')} className={inv('surname')} autoComplete="family-name" /></Field>
            <Field id="first_name" label="First name" error={errors.first_name}><input id="first_name" value={form.first_name} onChange={set('first_name')} className={inv('first_name')} autoComplete="given-name" /></Field>
            <Field id="other_name" label="Other name" error={errors.other_name} hint="Optional"><input id="other_name" value={form.other_name} onChange={set('other_name')} className={inv('other_name')} /></Field>
          </div>
          <div className="three-col">
            <Field id="gender" label="Gender" error={errors.gender}>
              <select id="gender" value={form.gender} onChange={set('gender')} className={inv('gender')}><option value="">Select</option><option value="female">Female</option><option value="male">Male</option></select>
            </Field>
            <Field id="phone" label="Phone number" error={errors.phone}><input id="phone" type="tel" value={form.phone} onChange={set('phone')} className={inv('phone')} placeholder="08012345678" /></Field>
            <Field id="email" label="Email address" error={errors.email}><input id="email" type="email" value={form.email} onChange={set('email')} className={inv('email')} placeholder="you@example.com" /></Field>
          </div>
          <div className="two-col">
            <Field id="password" label="Password" error={errors.password} hint="At least 8 characters, with a letter and a number."><input id="password" type="password" value={form.password} onChange={set('password')} className={inv('password')} autoComplete="new-password" /></Field>
            <Field id="confirm_password" label="Confirm password" error={errors.confirm_password}><input id="confirm_password" type="password" value={form.confirm_password} onChange={set('confirm_password')} className={inv('confirm_password')} autoComplete="new-password" /></Field>
          </div>

          <p className="form-section">Academic details</p>
          <div className="field">
            <label>Identify yourself with</label>
            <div className="segmented">
              <label className={form.id_type === 'matric' ? 'on' : ''}><input type="radio" name="id_type" value="matric" checked={form.id_type === 'matric'} onChange={set('id_type')} /> Matric number</label>
              <label className={form.id_type === 'application' ? 'on' : ''}><input type="radio" name="id_type" value="application" checked={form.id_type === 'application'} onChange={set('id_type')} /> Application number</label>
            </div>
          </div>
          <Field id="id_value" label={form.id_type === 'matric' ? 'Matric number' : 'Application number'} error={errors.id_value}>
            <input id="id_value" value={form.id_value} onChange={set('id_value')} className={inv('id_value')} placeholder={form.id_type === 'matric' ? 'PG/2025/0123' : 'PG-2025-AB12CD34'} />
          </Field>
          <div className="two-col">
            <Field id="college" label="College" error={errors.college}>
              <select id="college" value={form.college} onChange={set('college')} className={inv('college')}>
                <option value="">Select college</option>{lookups?.colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field id="department" label="Department" error={errors.department}>
              <select id="department" value={form.department} onChange={set('department')} className={inv('department')} disabled={!form.college}>
                <option value="">{form.college ? 'Select department' : 'Select a college first'}</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
          </div>
          <Field id="programme" label="Programme" error={errors.programme}>
            <select id="programme" value={form.programme} onChange={set('programme')} className={inv('programme')} disabled={!form.department}>
              <option value="">{form.department ? (programmes.length ? 'Select programme' : 'No programme in this department yet') : 'Select a department first'}</option>
              {programmes.map((p) => <option key={p.id} value={p.id}>{programmeLabel(p)}</option>)}
            </select>
          </Field>
          <div className="two-col">
            <Field id="level" label="Level" error={errors.level}>
              <select id="level" value={form.level} onChange={set('level')} className={inv('level')}><option value="">Select level</option>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select>
            </Field>
            <Field id="session" label="Session" error={errors.session}>
              <select id="session" value={form.session} onChange={set('session')} className={inv('session')}>
                <option value="">Select session</option>{lookups?.sessions.filter((s) => s.current).map((s) => <option key={s.id}>{s.name}</option>)}
              </select>
            </Field>
          </div>

          {errors.form && <div className="alert alert-error">{errors.form}</div>}
          {!errors.form && Object.values(errors).some(Boolean) && <div className="alert alert-error">Please fix the highlighted fields.</div>}
          <button className="btn btn-primary btn-block btn-lg" disabled={busy}>{busy ? 'Registering…' : 'Register for the Session'}</button>
        </form>

        <p className="auth-links">Already registered? <Link to="/login">Sign in</Link> · New applicant? <Link to="/register">Apply here</Link></p>
        <Link to="/" className="back-link">← Back to portal home</Link>
      </div>
    </div>
  );
}
