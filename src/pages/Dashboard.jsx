import { useAuth } from '../context/AuthContext';
import { useRouter } from '../lib/router';
import { Logo } from '../components/PublicHeader';
import { CheckIcon, ShieldIcon } from '../components/Icons';

const ROLE_LABELS = {
  ICT_ADMIN: 'ICT Administrator',
  ADMISSION_OFFICER: 'Admission Officer',
  REGISTRAR: 'Registrar',
  PG_APPLICANT: 'PG Applicant',
  STUDENT: 'Student',
  PG_STAFF: 'PG School Staff',
};

// Only "Account created" is known from the auth endpoints; the rest fill in
// once the application endpoints exist.
const JOURNEY = [
  { title: 'Account created', text: 'Your secure portal account is active.', done: true },
  { title: 'Application submitted', text: 'Choose a programme and submit your details.' },
  { title: 'Eligibility confirmed', text: 'Admissions and Registry review your qualifications.' },
  { title: 'Admission granted', text: 'Your offer and activation instructions will appear here.' },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { navigate } = useRouter();
  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="dash">
      <header className="dash-header">
        <div className="container dash-header-inner">
          <Logo compact />
          <div className="dash-user">
            <span className="avatar">{initials}</span>
            <button className="btn-text" onClick={async () => { await logout(); navigate('/login'); }}>Sign out</button>
          </div>
        </div>
      </header>

      <main className="container dash-main">
        <p className="session">2025/2026 admission session</p>
        <h1 className="dash-title">Welcome, {user.first_name}.</h1>
        <p className="sub">Here is the latest status of your postgraduate journey.</p>

        <div className="dash-grid">
          <section className="panel">
            <div className="panel-icon"><ShieldIcon /></div>
            <p className="panel-label">Your account</p>
            <p className="panel-value">{user.first_name} {user.last_name}</p>
            <div className="kv"><span>Email</span><strong>{user.email}</strong></div>
            <div className="kv"><span>Role</span><strong>{ROLE_LABELS[user.role] || user.role}</strong></div>
          </section>

          <section className="panel">
            <h2 className="panel-title">Application journey</h2>
            <ol className="journey">
              {JOURNEY.map((j) => (
                <li key={j.title} className={j.done ? 'done' : ''}>
                  <span className="dot">{j.done ? <CheckIcon width={18} height={18} /> : <i />}</span>
                  <div><strong>{j.title}</strong><p>{j.text}</p></div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </main>
    </div>
  );
}
