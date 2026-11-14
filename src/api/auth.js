// Sign-in for every role.
//
// - Applicants who sign up on the portal use the REAL backend (/api/auth/register/, /login/, /me/, /logout/).
// - Staff (ICT Admin, Admission Officer, Registrar, PG Staff), demo users and returning students are
//   local accounts until the backend has user-management endpoints. Their logins are listed on the sign-in page.
// - Set VITE_AUTH_MODE=demo in .env to keep everything local (no backend needed, e.g. for a presentation).
import { ApiError, request, tokens } from './client';
import { createApplicantRecord, findUserByEmail, upsertBackendUser } from './services';
import { load, save, nextId, stamp } from './db';

export const AUTH_MODE = import.meta.env.VITE_AUTH_MODE === 'demo' ? 'demo' : 'backend';
const SESSION_KEY = 'bitly.session';

export const DEMO_ACCOUNTS = [
  { label: 'ICT Admin', email: 'ict@bitly.edu.ng' },
  { label: 'Admission Officer', email: 'admissions@bitly.edu.ng' },
  { label: 'Registrar', email: 'registrar@bitly.edu.ng' },
  { label: 'PG School Staff', email: 'pgstaff@bitly.edu.ng' },
  { label: 'Applicant', email: 'kwame.mensah@demo.com' },
  { label: 'Student', email: 'tolu.adeyemi@demo.com' },
];
export const DEMO_PASSWORD = 'Demo@1234';

const session = {
  get() { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } },
  set(v) { localStorage.setItem(SESSION_KEY, JSON.stringify(v)); },
  clear() { localStorage.removeItem(SESSION_KEY); },
};

function checkAccess(u) {
  if (u.status === 'revoked') throw new ApiError(403, { detail: 'Your admission has been revoked and portal access is locked. Contact the PG School.' });
  if (u.status === 'suspended') throw new ApiError(403, { detail: 'This account has been suspended. Contact ICT support.' });
}

export async function login(email, password) {
  const local = findUserByEmail(email);
  if (local?.password) {
    if (local.password !== password) throw new ApiError(400, { detail: 'Invalid credentials.' });
    checkAccess(local);
    session.set({ email: local.email, kind: 'local' });
    return local;
  }
  if (AUTH_MODE === 'demo') throw new ApiError(400, { detail: 'Invalid credentials.' });

  const data = await request('/api/auth/login/', { method: 'POST', body: { email, password }, auth: false });
  const u = upsertBackendUser(data.user);
  checkAccess(u);
  tokens.set(data);
  session.set({ email: u.email, kind: 'backend' });
  return u;
}

/** New applicant sign-up. The backend wants first_name, last_name, email, password, confirm_password. */
export async function register({ first_name, last_name, email, password, confirm_password }) {
  if (findUserByEmail(email)) throw new ApiError(400, { email: ['user with this email already exists.'] });
  if (AUTH_MODE === 'demo') {
    const db = load();
    db.users.push({ id: nextId(db.users), email, password, surname: last_name, first_name, other_name: '', gender: '', phone: '', role: 'PG_APPLICANT', status: 'active', source: 'demo', created_at: stamp() });
    save();
    return { email };
  }
  const user = await request('/api/auth/register/', { method: 'POST', body: { first_name, last_name, email, password, confirm_password }, auth: false });
  createApplicantRecord({ first_name, last_name, email });
  return user;
}

export async function getCurrentUser() {
  const s = session.get();
  if (!s) return null;
  if (s.kind === 'backend') {
    if (!tokens.access) { session.clear(); return null; }
    const me = await request('/api/auth/me/');
    const u = upsertBackendUser(me);
    if (u.status === 'revoked' || u.status === 'suspended') { await logout(); return null; }
    return { ...u };
  }
  const u = findUserByEmail(s.email);
  if (!u || u.status === 'revoked' || u.status === 'suspended') { session.clear(); return null; }
  return { ...u };
}

export async function logout() {
  const s = session.get();
  try {
    if (s?.kind === 'backend' && tokens.refresh) await request('/api/auth/logout/', { method: 'POST', body: { refresh: tokens.refresh } });
  } catch {
    /* token may already be expired */
  } finally {
    tokens.clear();
    session.clear();
  }
}
