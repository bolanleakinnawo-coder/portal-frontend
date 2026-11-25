import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as auth from '../api/auth';
import { isStaff } from '../config/roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const u = await auth.getCurrentUser();
      setUser(u);
      return u;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [refresh]);

  /** portal: 'staff' for /admin/login, 'student' for /login. Accounts can only use their own sign-in page. */
  const login = useCallback(async (email, password, portal = 'student') => {
    const u = await auth.login(email, password);
    if (portal === 'staff' && !isStaff(u)) {
      await auth.logout();
      throw Object.assign(new Error('This sign-in page is for PG School staff. Applicants and students should use the student sign-in page.'), { status: 403, wrongPortal: 'student' });
    }
    if (portal === 'student' && isStaff(u)) {
      await auth.logout();
      throw Object.assign(new Error('Staff accounts sign in on the Staff sign-in page.'), { status: 403, wrongPortal: 'staff' });
    }
    setUser({ ...u });
    return u;
  }, []);

  const logout = useCallback(async () => {
    await auth.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh, register: auth.register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
