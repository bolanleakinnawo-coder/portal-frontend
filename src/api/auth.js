// Sign-in for every role, through the backend's auth endpoints:
// /api/auth/register/, /login/, /me/, /logout/, /token/refresh/ (refresh is in client.js).
//
// The backend decides the role. Staff accounts (ICT_ADMIN, ADMISSION_OFFICER, REGISTRAR, PG_STAFF)
// are created by the backend team; everyone who signs up on the portal starts as an applicant.
import { ApiError, request, tokens } from './client';
import { createApplicantRecord, findUserByEmail, upsertBackendUser } from './services';

const SESSION_KEY = 'bitly.session';

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
  const data = await request('/api/auth/login/', { method: 'POST', body: { email, password }, auth: false });
  const u = upsertBackendUser(data.user);
  checkAccess(u);
  tokens.set(data);
  session.set({ email: u.email });
  return u;
}

/** Backend sign-up: first_name, last_name, email, password, confirm_password. */
async function backendRegister({ first_name, last_name, email, password, confirm_password }) {
  return request('/api/auth/register/', { method: 'POST', body: { first_name, last_name, email, password, confirm_password }, auth: false });
}

/** New applicant sign-up. */
export async function register(data) {
  const user = await backendRegister(data);
  createApplicantRecord(data);
  return user;
}

/** Returning student: create the login on the backend; the extra details are saved by services.registerReturningStudent. */
export async function registerReturningAccount(form) {
  if (findUserByEmail(form.email)) throw new ApiError(400, { email: ['user with this email already exists.'] });
  return backendRegister({
    first_name: form.first_name.trim(),
    last_name: [form.surname.trim(), form.other_name.trim()].filter(Boolean).join(' '),
    email: form.email.trim(),
    password: form.password,
    confirm_password: form.confirm_password,
  });
}

export async function getCurrentUser() {
  const s = session.get();
  if (!s || !tokens.access) { session.clear(); return null; }
  const me = await request('/api/auth/me/');
  const u = upsertBackendUser(me);
  if (u.status === 'revoked' || u.status === 'suspended') { await logout(); return null; }
  return { ...u };
}

export async function logout() {
  try {
    if (tokens.refresh) await request('/api/auth/logout/', { method: 'POST', body: { refresh: tokens.refresh } });
  } catch {
    /* token may already be expired */
  } finally {
    tokens.clear();
    session.clear();
  }
}
