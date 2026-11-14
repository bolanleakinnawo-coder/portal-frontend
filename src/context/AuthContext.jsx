import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as auth from '../api/auth';

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

  const login = useCallback(async (email, password) => {
    const u = await auth.login(email, password);
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
