import { Link } from '../lib/router';
import { useAuth } from '../context/AuthContext';
import { CapIcon } from './Icons';
import { homeFor } from '../config/roles';

export function Logo({ compact = false }) {
  return (
    <Link to="/" className="logo">
      <span className="logo-mark"><CapIcon /></span>
      {!compact && (
        <span className="logo-text">
          <small>Postgraduate School</small>
          <strong>Admissions Portal</strong>
        </span>
      )}
    </Link>
  );
}

export function PublicHeader({ minimal = false }) {
  const { user } = useAuth();
  return (
    <header className="pub-header">
      <div className="container pub-header-inner">
        <Logo />
        {!minimal && (
          <>
            <nav className="pub-nav">
              <a href="#process">How it works</a>
              <a href="#requirements">Requirements</a>
              <a href="#support">Support</a>
            </nav>
            <div className="pub-actions">
              {user ? (
                <Link to={homeFor(user)} className="btn btn-primary">Go to dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-text hide-sm">Sign in</Link>
                  <Link to="/register" className="btn btn-primary">Start application</Link>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
