// Tiny router (no extra dependency). Works like a stripped-down react-router.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const RouterContext = createContext(null);

export function Router({ children }) {
  const [location, setLocation] = useState(() => ({
    path: window.location.pathname,
    search: window.location.search,
  }));

  useEffect(() => {
    const onPop = () => setLocation({ path: window.location.pathname, search: window.location.search });
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to, { replace = false } = {}) => {
    if (replace) window.history.replaceState(null, '', to);
    else window.history.pushState(null, '', to);
    const url = new URL(to, window.location.origin);
    setLocation({ path: url.pathname, search: url.search });
    window.scrollTo(0, 0);
  }, []);

  return <RouterContext.Provider value={{ ...location, navigate }}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  return useContext(RouterContext);
}

export function Link({ to, children, onClick, ...rest }) {
  const { navigate } = useRouter();
  return (
    <a
      href={to}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

export function Redirect({ to }) {
  const { navigate } = useRouter();
  useEffect(() => navigate(to, { replace: true }), [to, navigate]);
  return null;
}

/** matchPath('/admin/applications/:id', '/admin/applications/4') → { id: '4' } or null */
export function matchPath(pattern, path) {
  const p = pattern.split('/').filter(Boolean);
  const a = path.split('/').filter(Boolean);
  if (p.length !== a.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(a[i]);
    else if (p[i] !== a[i]) return null;
  }
  return params;
}
