import { useState } from 'react';
import { Link } from '../../lib/router';
import { useAuth } from '../../context/AuthContext';
import { StudentLayout } from '../../components/StudentLayout';
import { PaymentModal } from '../../components/PaymentModal';
import { useLoad, Field, Badge } from '../../components/ui';
import { CardIcon } from '../../components/Icons';
import { currentSession, getLookups, getMyApplication, hasPaid, naira, programmeById, programmeLabel, settings, shortDate, submitApplication } from '../../api/services';

const EMPTY = { programme: '', date_of_birth: '', gender: '', phone: '', nationality: '', address: '', institution: '', qualification: '', class_of_degree: '', year_awarded: '' };
const THIS_YEAR = new Date().getFullYear();
const CLASSES = ['First Class', 'Second Class Upper', 'Second Class Lower', 'Third Class', 'Pass', 'Distinction (HND)', 'Upper Credit (HND)'];

function check(f) {
  const e = {};
  if (!f.programme) e.programme = 'Select a programme.';
  if (!f.date_of_birth) e.date_of_birth = 'Enter your date of birth.';
  else {
    const age = (Date.now() - new Date(f.date_of_birth)) / 31557600000;
    if (age < 18) e.date_of_birth = 'You must be at least 18 years old.';
    else if (age > 100) e.date_of_birth = 'Enter a valid date of birth.';
  }
  if (!f.gender) e.gender = 'Select your gender.';
  if (!/^\+?\d[\d\s-]{9,15}$/.test(f.phone.trim())) e.phone = 'Enter a valid phone number, e.g. 08012345678.';
  if (!f.nationality.trim()) e.nationality = 'Enter your nationality.';
  if (f.address.trim().length < 10) e.address = f.address.trim() ? 'Enter your full residential address.' : 'Enter your residential address.';
  if (!f.institution.trim()) e.institution = 'Enter the name of your institution.';
  if (!f.qualification.trim()) e.qualification = 'Enter your qualification, e.g. B.Sc. Computer Science.';
  if (!f.class_of_degree) e.class_of_degree = 'Select your class of degree.';
  const y = Number(f.year_awarded);
  if (!f.year_awarded) e.year_awarded = 'Enter the year your qualification was awarded.';
  else if (!Number.isInteger(y) || y < 1960 || y > THIS_YEAR) e.year_awarded = `Enter a year between 1960 and ${THIS_YEAR}.`;
  return e;
}

export default function Application() {
  const { user, refresh } = useAuth();
  const { data, reload } = useLoad(async () => ({ app: await getMyApplication(user.id), lookups: await getLookups() }), [user.id]);
  const [form, setForm] = useState({ ...EMPTY, gender: user.gender || '', phone: user.phone || '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [paying, setPaying] = useState(false);

  if (!data) return <StudentLayout><div className="spinner page-spinner" /></StudentLayout>;
  const { app, lookups } = data;
  const formPaid = hasPaid(user.id, 'admission_form');

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
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
      await submitApplication(user.id, { ...form, year_awarded: Number(form.year_awarded) });
      setJustSubmitted(true);
      await reload();
      await refresh();
      window.scrollTo(0, 0);
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setBusy(false);
    }
  }

  if (app) {
    const rows = [
      ['Application number', app.application_number], ['Programme', programmeLabel(programmeById(app.programme))], ['Session', app.session],
      ['Submitted', shortDate(app.created_at)], ['Date of birth', shortDate(app.date_of_birth)], ['Gender', app.gender], ['Phone', app.phone],
      ['Nationality', app.nationality], ['Residential address', app.address], ['Institution', app.institution], ['Qualification', app.qualification],
      ['Class of degree', app.class_of_degree], ['Year awarded', app.year_awarded],
    ];
    return (
      <StudentLayout>
        <p className="session">{app.session} session</p>
        <h1 className="dash-title">Postgraduate application</h1>
        {justSubmitted && <div className="alert alert-ok form-card-gap">Application submitted. Your application number is now on the dashboard.</div>}
        <p className="sub">Admission status: <Badge value={app.decision}>{app.decision === 'pending' ? 'Under review' : app.decision}</Badge></p>
        <section className="form-card">
          <p className="overline">Submitted application</p>
          {rows.map(([k, v]) => <div className="kv" key={k}><span>{k}</span><strong className={k === 'Gender' ? 'cap' : ''}>{v || '—'}</strong></div>)}
        </section>
        <Link to="/dashboard" className="btn btn-primary">Back to overview</Link>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <p className="session">{currentSession()} session</p>
      <h1 className="dash-title">Postgraduate application</h1>
      <p className="sub">Complete all sections carefully. Your information is stored securely and can only be reviewed by authorized staff.</p>

      {!formPaid && (
        <section className="form-card pay-gate">
          <span className="panel-icon"><CardIcon /></span>
          <div>
            <h2 className="form-card-title">Pay the admission form fee first</h2>
            <p className="form-card-sub">Your application can only be considered after the {naira(settings().form_fee)} admission form fee is verified.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setPaying(true)}>Pay {naira(settings().form_fee)}</button>
        </section>
      )}

      <form onSubmit={submit} noValidate className={`app-form ${!formPaid ? 'is-locked' : ''}`}>
        <fieldset disabled={!formPaid}>
          <section className="form-card">
            <p className="overline">01 · Programme</p>
            <h2 className="form-card-title">Choose your programme</h2>
            <p className="form-card-sub">Only active programmes for the current admission session are shown.</p>
            <Field id="programme" label="Programme" error={errors.programme}>
              <select id="programme" value={form.programme} onChange={set('programme')} className={inv('programme')}>
                <option value="">Select a programme</option>
                {lookups.programmes.filter((p) => p.active).map((p) => <option key={p.id} value={p.id}>{programmeLabel(p)}</option>)}
              </select>
            </Field>
          </section>

          <section className="form-card">
            <p className="overline">02 · Personal details</p>
            <h2 className="form-card-title">Tell us about yourself</h2>
            <div className="two-col">
              <Field id="date_of_birth" label="Date of birth" error={errors.date_of_birth}>
                <input id="date_of_birth" type="date" value={form.date_of_birth} onChange={set('date_of_birth')} className={inv('date_of_birth')} max={new Date().toISOString().slice(0, 10)} />
              </Field>
              <Field id="gender" label="Gender" error={errors.gender}>
                <select id="gender" value={form.gender} onChange={set('gender')} className={inv('gender')}>
                  <option value="">Select</option><option value="female">Female</option><option value="male">Male</option>
                </select>
              </Field>
            </div>
            <div className="two-col">
              <Field id="phone" label="Phone number" error={errors.phone}>
                <input id="phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="e.g. 08012345678" className={inv('phone')} />
              </Field>
              <Field id="nationality" label="Nationality" error={errors.nationality}>
                <input id="nationality" value={form.nationality} onChange={set('nationality')} placeholder="e.g. Nigerian" className={inv('nationality')} />
              </Field>
            </div>
            <Field id="address" label="Residential address" error={errors.address}>
              <textarea id="address" rows={3} value={form.address} onChange={set('address')} placeholder="Current residential address" className={inv('address')} />
            </Field>
          </section>

          <section className="form-card">
            <p className="overline">03 · Qualification</p>
            <h2 className="form-card-title">Highest relevant qualification</h2>
            <Field id="institution" label="Institution" error={errors.institution}>
              <input id="institution" value={form.institution} onChange={set('institution')} placeholder="Name of institution" className={inv('institution')} />
            </Field>
            <Field id="qualification" label="Qualification" error={errors.qualification}>
              <input id="qualification" value={form.qualification} onChange={set('qualification')} placeholder="e.g. B.Sc. Computer Science" className={inv('qualification')} />
            </Field>
            <div className="two-col">
              <Field id="class_of_degree" label="Class of degree" error={errors.class_of_degree}>
                <select id="class_of_degree" value={form.class_of_degree} onChange={set('class_of_degree')} className={inv('class_of_degree')}>
                  <option value="">Select</option>{CLASSES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field id="year_awarded" label="Year awarded" error={errors.year_awarded}>
                <input id="year_awarded" type="number" inputMode="numeric" value={form.year_awarded} onChange={set('year_awarded')} placeholder="2022" className={inv('year_awarded')} />
              </Field>
            </div>
          </section>

          {errors.form && <div className="alert alert-error">{errors.form}</div>}
          {!errors.form && Object.values(errors).some(Boolean) && <div className="alert alert-error">Please fix the highlighted fields above.</div>}

          <section className="form-card submit-card">
            <button className="btn btn-primary btn-block btn-lg" disabled={busy || !formPaid}>{busy ? 'Submitting…' : 'Submit application'}</button>
            <p className="form-card-sub">By submitting, you confirm that the information provided is accurate.</p>
          </section>
        </fieldset>
      </form>

      {paying && (
        <PaymentModal user={user} purpose="admission_form" amount={settings().form_fee} title="Admission form fee"
          onClose={() => setPaying(false)} onPaid={async () => { setPaying(false); await reload(); await refresh(); }} />
      )}
    </StudentLayout>
  );
}
