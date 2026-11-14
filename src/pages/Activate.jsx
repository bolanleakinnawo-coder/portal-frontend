import { useEffect, useState } from 'react';
import { Link, useRouter } from '../lib/router';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/PublicHeader';
import { CheckIcon } from '../components/Icons';
import { activateAccount } from '../api/services';

export default function Activate() {
  const { search } = useRouter();
  const { user, refresh } = useAuth();
  const token = new URLSearchParams(search).get('token');
  const [state, setState] = useState({ status: 'working' });

  useEffect(() => {
    if (!token) { setState({ status: 'error', message: 'This activation link is missing its code.' }); return; }
    activateAccount(token)
      .then(async (u) => { setState({ status: 'done', user: u }); await refresh(); })
      .catch((e) => setState({ status: 'error', message: e.message }));
  }, [token, refresh]);

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <Logo />
        {state.status === 'working' && <div className="spinner page-spinner" />}
        {state.status === 'done' && (
          <>
            <span className="pay-check big"><CheckIcon width={34} height={34} /></span>
            <h1 className="auth-title">Account activated</h1>
            <p className="sub">Welcome, {state.user.first_name}. Your matric number is <strong>{state.user.matric_number}</strong>. You can now pay your school fees and register courses.</p>
            <Link to={user ? '/dashboard' : '/login'} className="btn btn-primary btn-lg btn-block mt">{user ? 'Go to my dashboard' : 'Sign in'}</Link>
          </>
        )}
        {state.status === 'error' && (
          <>
            <h1 className="auth-title">We couldn’t activate your account</h1>
            <div className="alert alert-error">{state.message}</div>
            <Link to="/login" className="btn btn-primary">Go to sign in</Link>
          </>
        )}
      </div>
    </div>
  );
}
