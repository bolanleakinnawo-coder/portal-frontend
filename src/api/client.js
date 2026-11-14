// Fetch wrapper: adds the JWT, refreshes the access token once on 401, and turns
// Django REST Framework errors into readable messages.

export const API_URL = (import.meta.env.VITE_API_URL || 'https://portal-backend-pqub.onrender.com').replace(/\/$/, '');

const ACCESS_KEY = 'portal.access';
const REFRESH_KEY = 'portal.refresh';

export const tokens = {
  get access() { return localStorage.getItem(ACCESS_KEY); },
  get refresh() { return localStorage.getItem(REFRESH_KEY); },
  set({ access, refresh }) {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  constructor(status, data) {
    super(formatError(data) || `Request failed (${status})`);
    this.status = status;
    this.data = data; // e.g. { email: ["user with this email already exists."] }
  }
}

function formatError(data) {
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (data.detail) return String(data.detail);
  if (Array.isArray(data)) return data.join(' ');
  return Object.entries(data)
    .map(([field, msgs]) => {
      const text = Array.isArray(msgs) ? msgs.join(' ') : String(msgs);
      return field === 'non_field_errors' ? text : `${field.replace(/_/g, ' ')}: ${text}`;
    })
    .join(' ');
}

let refreshing = null; // share one refresh call between parallel requests

async function refreshAccessToken() {
  if (!refreshing) {
    refreshing = fetch(`${API_URL}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: tokens.refresh }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('refresh failed');
        const data = await res.json();
        tokens.set(data); // { access } (and a new refresh if rotation is on)
        return true;
      })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

export async function request(path, { method = 'GET', body, auth = true, retry = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && tokens.access) headers.Authorization = `Bearer ${tokens.access}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, { detail: 'Cannot reach the server. Check your connection (or CORS settings on the backend).' });
  }

  if (res.status === 401 && auth && retry && tokens.refresh) {
    try {
      await refreshAccessToken();
      return request(path, { method, body, auth, retry: false });
    } catch {
      tokens.clear();
      window.dispatchEvent(new Event('auth:expired'));
    }
  }

  const data = res.status === 204 || res.status === 205 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export function toQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}
