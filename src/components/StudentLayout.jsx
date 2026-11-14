import { useState } from 'react';
import { Link, useRouter } from '../lib/router';
import { useAuth } from '../context/AuthContext';
import { Logo } from './PublicHeader';
import { resendActivation } from '../api/services';
import { ROLE_LABELS } from '../config/roles';

export function StudentLayout({ children }) {
  const { user, logout } = useAuth();
  const { path, navigate } = useRouter();
  const [resent, setResent] = useState('');
  const initials = `${user.first_name?.[0] || ''}${user.surname?.[0] || ''}`.toUpperCase();
  const isStudent = user.role === 'STUDENT';

  const tabs = [
    { to: '/dashboard', label: 'Overview' },
    ...(user.returning ? [] : [{ to: '/dashboard/application', label: 'Application' }]),
    { to: '/dashboard/payments', label: 'Payments' },
    ...(isStudent ? [{ to: '/dashboard/courses', label: 'Course registration' }] : []),
    { to: '/dashboard/messages', label: 'Messages' },
  ];

  async function resend() {
    try {
      await resendActivation(user.id);
      setResent('A new activation link has been sent. Check Messages or your email.');
    } catch (e) {
      setResent(e.message);
    }
  }

  return (
    <div className="dash">
      <header className="dash-header no-print">
        <div className="container">
          <div className="dash-header-inner">
            <Logo compact />
            <div className="dash-user">
              <div className="dash-user-text hide-sm">
                <strong>{user.first_name} {user.surname}</strong>
                <span>{ROLE_LABELS[user.role]}</span>
              </div>
              <span className="avatar" title={`${user.first_name} ${user.surname}`}>{initials}</span>
              <button className="btn-text" onClick={async () => { await logout(); navigate('/login'); }}>Sign out</button>
            </div>
          </div>
          <nav className="tabs">
            {tabs.map((t) => (
              <Link key={t.to} to={t.to} className={`tab ${path === t.to || (t.to !== '/dashboard' && path.startsWith(t.to)) ? 'active' : ''}`}>{t.label}</Link>
            ))}
          </nav>
        </div>
      </header>

      {user.status === 'pending_activation' && (
        <div className="activation-banner no-print">
          <div className="container">
            <strong>Activate your account.</strong> We sent an activation link to {user.email}. You must activate before paying school fees and registering courses.{' '}
            <Link to="/dashboard/messages">Open messages</Link> · <button className="link-btn" onClick={resend}>Resend link</button>
            {resent && <span className="banner-note"> {resent}</span>}
          </div>
        </div>
      )}

      <main className="container dash-main">{children}</main>
    </div>
  );
}
