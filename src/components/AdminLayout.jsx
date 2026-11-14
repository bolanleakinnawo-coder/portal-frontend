import { useState } from 'react';
import { Link, useRouter } from '../lib/router';
import { useAuth } from '../context/AuthContext';
import { CapIcon, MenuIcon } from './Icons';
import { ADMIN_NAV, ROLE_LABELS, can } from '../config/roles';
import { reset } from '../api/db';

export function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const { path, navigate } = useRouter();
  const [open, setOpen] = useState(false);
  const initials = `${user.first_name?.[0] || ''}${user.surname?.[0] || ''}`.toUpperCase();

  const nav = ADMIN_NAV.map((g) => ({ ...g, items: g.items.filter((i) => !i.perm || can(user, i.perm)) })).filter((g) => g.items.length);

  return (
    <div className={`admin ${open ? 'nav-open' : ''}`}>
      <aside className="side no-print">
        <Link to="/admin" className="side-brand">
          <span className="logo-mark sm"><CapIcon /></span>
          <span><small>Bitly University</small><strong>PG School Admin</strong></span>
        </Link>
        <nav className="side-nav" onClick={() => setOpen(false)}>
          {nav.map((g) => (
            <div key={g.group || 'main'} className="side-group">
              {g.group && <p className="side-label">{g.group}</p>}
              {g.items.map((i) => {
                const active = i.to === '/admin' ? path === '/admin' : path.startsWith(i.to);
                return <Link key={i.to} to={i.to} className={`side-link ${active ? 'active' : ''}`}>{i.label}</Link>;
              })}
            </div>
          ))}
        </nav>
        <div className="side-foot">
          <button className="btn-text small" onClick={() => { if (window.confirm('Reset all demo data back to the sample data?')) { reset(); window.location.href = '/login'; } }}>
            Reset demo data
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-top no-print">
          <button className="icon-btn mobile-only" onClick={() => setOpen((o) => !o)} aria-label="Menu"><MenuIcon /></button>
          <div className="spacer" />
          <div className="dash-user">
            <div className="dash-user-text hide-sm">
              <strong>{user.first_name} {user.surname}</strong>
              <span>{ROLE_LABELS[user.role]}</span>
            </div>
            <span className="avatar">{initials}</span>
            <button className="btn-text" onClick={async () => { await logout(); navigate('/login'); }}>Sign out</button>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
    </div>
  );
}
