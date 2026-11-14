import { useEffect, useState } from 'react';
import { Link } from '../../lib/router';
import { useAuth } from '../../context/AuthContext';
import { StudentLayout } from '../../components/StudentLayout';
import { useLoad, Badge } from '../../components/ui';
import { CheckIcon, LockIcon, PrintIcon } from '../../components/Icons';
import { LEVELS, MAX_UNITS, SEMESTERS, currentSession, feeStatus, getLookups, getMyRegistration, listCourses, naira, registerCourses, shortDate } from '../../api/services';

export default function Courses() {
  const { user } = useAuth();
  const { data: lookups } = useLoad(getLookups, []);
  const [filters, setFilters] = useState({ department: String(user.department || ''), level: user.level || '700', semester: 'first', session: currentSession() });
  const [courses, setCourses] = useState(undefined);
  const [registration, setRegistration] = useState(undefined);
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCourses(undefined);
    setSelected([]);
    setMessage(null);
    listCourses(filters).then(setCourses);
    getMyRegistration(user.id, filters.semester, filters.session).then(setRegistration);
  }, [filters, user.id]);

  const fees = feeStatus(user);
  const locks = [
    user.status !== 'active' && 'Activate your account using the link we emailed you.',
    !fees.eligible && `Pay at least ${fees.min}% of your school fees (${fees.percent}% verified so far).`,
  ].filter(Boolean);

  const setF = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const units = (courses || []).filter((c) => selected.includes(c.id)).reduce((s, c) => s + c.units, 0);

  async function submit() {
    setMessage(null);
    if (filters.session !== currentSession()) return setMessage({ type: 'error', text: `You can only register for the current session (${currentSession()}).` });
    setBusy(true);
    try {
      const reg = await registerCourses(user.id, { semester: filters.semester, courses: selected });
      setRegistration(reg);
      setMessage({ type: 'ok', text: `Courses registered. Registration number ${reg.number}.` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <StudentLayout>
      <p className="session">{currentSession()} session</p>
      <h1 className="dash-title">Course registration</h1>
      <p className="sub">Courses are listed by department, level, semester and session.</p>

      {locks.length > 0 ? (
        <div className="lock-note"><LockIcon width={20} height={20} /><div><strong>Registration is locked</strong>{locks.map((l) => <div key={l}>{l}</div>)}{!fees.eligible && user.status === 'active' && <Link to="/dashboard/payments">Pay school fees →</Link>}</div></div>
      ) : (
        <div className="ok-note"><CheckIcon width={20} height={20} /> You meet the requirements: account active and {fees.percent}% of {naira(fees.required)} school fees verified.</div>
      )}

      <section className="form-card course-card">
        <div className="course-filters">
          <div className="filter-grid">
            <div className="field">
              <label htmlFor="f-dept">Department</label>
              <select id="f-dept" value={filters.department} onChange={setF('department')}>
                <option value="">All departments</option>
                {lookups?.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="f-level">Level</label>
              <select id="f-level" value={filters.level} onChange={setF('level')}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select>
            </div>
            <div className="field">
              <label htmlFor="f-sem">Semester</label>
              <select id="f-sem" value={filters.semester} onChange={setF('semester')}>{SEMESTERS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
            </div>
            <div className="field">
              <label htmlFor="f-session">Session</label>
              <select id="f-session" value={filters.session} onChange={setF('session')}>{lookups?.sessions.map((s) => <option key={s.id}>{s.name}</option>)}</select>
            </div>
          </div>
        </div>

        {registration ? (
          <div className="registered-box">
            <div>
              <Badge value="registered">Registered</Badge>
              <h3>{registration.number}</h3>
              <p className="muted">{registration.course_list.length} courses · {registration.total_units} units · registered {shortDate(registration.created_at)}</p>
            </div>
            <Link to={`/dashboard/slip/${registration.id}`} className="btn btn-outline"><PrintIcon width={18} height={18} /> View & print slip</Link>
          </div>
        ) : null}

        <ul className="course-list">
          {courses === undefined && <li className="course-empty"><span className="spinner small" /></li>}
          {courses?.map((c) => {
            const isReg = registration?.courses.includes(c.id);
            return (
              <li key={c.id}>
                <label className={`course-row ${registration ? 'readonly' : ''}`}>
                  <input type="checkbox" checked={isReg || selected.includes(c.id)} disabled={!!registration} onChange={() => toggle(c.id)} />
                  <span className="course-text"><strong>{c.code}</strong><span>{c.title}</span><small>{c.department_name}</small></span>
                  <span className="units">{c.units} units</span>
                </label>
              </li>
            );
          })}
          {courses?.length === 0 && <li className="course-empty">No courses published for these filters.</li>}
        </ul>
      </section>

      {message && <div className={`alert ${message.type === 'ok' ? 'alert-ok' : 'alert-error'}`}>{message.text}</div>}

      {!registration && (
        <div className="course-actions">
          <span className={`units-total ${units > MAX_UNITS ? 'over' : ''}`}>{selected.length} selected · {units} of {MAX_UNITS} units max</span>
          <button className="btn btn-primary btn-lg" onClick={submit} disabled={busy || !selected.length}>{busy ? 'Registering…' : 'Register selected courses'}</button>
        </div>
      )}
    </StudentLayout>
  );
}
