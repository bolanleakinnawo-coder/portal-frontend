// Everything the portal does besides login. Each function is async, like an API call,
// so pages won't change when these are swapped for real backend requests.
// Business rules from the project brief are enforced here (and must also be enforced by the backend).
import { load, save, nextId, stamp, randomCode } from './db';
import { notifyByEmail } from './email';

const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms));
const fail = (message) => { throw new Error(message); };
const db = () => load();

export const fullName = (u) => (u ? [u.surname, u.first_name, u.other_name].filter(Boolean).join(' ') : '');
export const displayName = (u) => (u ? `${u.first_name} ${u.surname}`.trim() : '');

// ---------------------------------------------------------------- lookups
export const currentSession = () => db().sessions.find((s) => s.current)?.name || '2025/2026';
export const settings = () => db().settings;
export const LEVELS = ['700', '800'];
export const SEMESTERS = [{ value: 'first', label: 'First semester' }, { value: 'second', label: 'Second semester' }];

export async function getLookups() {
  await wait(40);
  const d = db();
  return { colleges: d.colleges, departments: d.departments, programmes: d.programmes, sessions: d.sessions, settings: d.settings };
}
export const programmeLabel = (p) => (p ? `${p.code} — ${p.name} (${p.degree})` : '');
export function programmeById(id) { return db().programmes.find((p) => p.id === Number(id)); }
export function departmentById(id) { return db().departments.find((x) => x.id === Number(id)); }
export function collegeById(id) { return db().colleges.find((x) => x.id === Number(id)); }

// ---------------------------------------------------------------- users
export function findUserByEmail(email) {
  return db().users.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());
}
export function userById(id) { return db().users.find((u) => u.id === Number(id)); }

const STAFF = ['ICT_ADMIN', 'ADMISSION_OFFICER', 'REGISTRAR', 'PG_STAFF'];

/** Create or update the portal record for a user who signed in through the backend. */
export function upsertBackendUser(apiUser) {
  const d = db();
  let u = findUserByEmail(apiUser.email);
  if (!u) {
    u = {
      id: nextId(d.users), email: apiUser.email, surname: apiUser.last_name || '', first_name: apiUser.first_name || '',
      other_name: '', gender: '', phone: '', role: STAFF.includes(apiUser.role) ? apiUser.role : 'PG_APPLICANT',
      status: 'active', source: 'backend', created_at: stamp(),
    };
    d.users.push(u);
    save();
  } else if (STAFF.includes(apiUser.role) && u.role !== apiUser.role && !STAFF.includes(u.role)) {
    // A staff role set by the backend team takes effect on the next sign-in.
    u.role = apiUser.role;
    save();
  }
  return u;
}

export function createApplicantRecord({ first_name, last_name, email }) {
  const d = db();
  if (findUserByEmail(email)) return findUserByEmail(email);
  const u = { id: nextId(d.users), email, surname: last_name, first_name, other_name: '', gender: '', phone: '', role: 'PG_APPLICANT', status: 'active', source: 'backend', created_at: stamp() };
  d.users.push(u);
  save();
  notifyByEmail({ to: email, name: first_name, subject: 'Your applicant account has been created', body: 'You can now sign in, pay the admission form fee and submit your application.' });
  return u;
}

export async function listUsers({ role, status, search } = {}) {
  await wait();
  const q = (search || '').toLowerCase();
  return db().users
    .filter((u) => (!role || u.role === role) && (!status || u.status === status))
    .filter((u) => !q || [fullName(u), u.email, u.matric_number, u.phone].some((v) => String(v || '').toLowerCase().includes(q)))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function saveStaffUser(data, id) {
  await wait();
  const d = db();
  if (!data.email || !data.surname || !data.first_name || !data.role) fail('Fill in surname, first name, email and role.');
  const clash = findUserByEmail(data.email);
  if (clash && clash.id !== Number(id)) fail('A user with this email already exists.');
  if (id) {
    const u = userById(id);
    const changes = { ...data };
    delete changes.password;
    Object.assign(u, changes, { permissions: data.role === 'PG_STAFF' ? data.permissions || [] : [] });
    save();
    return u;
  }
  delete data.password;
  const u = { id: nextId(d.users), status: 'active', source: 'portal', created_at: stamp(), other_name: '', gender: '', phone: '', ...data, permissions: data.role === 'PG_STAFF' ? data.permissions || [] : [] };
  d.users.push(u);
  save();
  notifyByEmail({ to: u.email, name: u.first_name, subject: 'Your PG School staff account', body: `You have been given the role ${u.role} on the PG School portal. Sign in with your portal account to start.` });
  return u;
}

export async function setUserStatus(id, status) {
  await wait();
  const u = userById(id);
  u.status = status;
  save();
  return u;
}

// ---------------------------------------------------------------- returning students + activation
function issueActivation(user, reason) {
  const d = db();
  const token = randomCode(24);
  d.tokens = d.tokens.filter((t) => !(t.user === user.id && !t.used));
  d.tokens.push({ token, user: user.id, purpose: 'activation', used: false, created_at: stamp() });
  save();
  const link = `${window.location.origin}/activate?token=${token}`;
  notifyByEmail({
    to: user.email, name: user.first_name, subject: 'Activate your Bitly University student account',
    body: `${reason} Click the link to activate your account before course registration: ${link}`, link,
  });
  return link;
}

export async function registerReturningStudent(form) {
  await wait(250);
  const d = db();
  if (findUserByEmail(form.email)) fail('An account with this email already exists. Sign in instead.');
  const idValue = form.id_value.trim().toUpperCase();
  if (form.id_type === 'matric' && d.users.some((u) => (u.matric_number || '').toUpperCase() === idValue)) fail('This matric number is already registered.');
  const u = {
    id: nextId(d.users), email: form.email.trim(), surname: form.surname.trim(), first_name: form.first_name.trim(),
    other_name: form.other_name.trim(), gender: form.gender, phone: form.phone.trim(), role: 'STUDENT', status: 'pending_activation',
    matric_number: form.id_type === 'matric' ? idValue : '', application_number: form.id_type === 'application' ? idValue : '',
    college: Number(form.college), department: Number(form.department), programme: Number(form.programme), level: form.level,
    session: form.session, returning: true, source: 'backend', created_at: stamp(),
  };
  d.users.push(u);
  save();
  issueActivation(u, 'Thank you for registering for the session.');
  return u;
}

export async function activateAccount(token) {
  await wait(200);
  const d = db();
  const t = d.tokens.find((x) => x.token === token);
  if (!t) fail('This activation link is invalid.');
  if (t.used) fail('This activation link has already been used. You can sign in.');
  const u = userById(t.user);
  if (u.status === 'revoked') fail('This account has been revoked. Contact the PG School.');
  t.used = true;
  u.status = 'active';
  if (!u.matric_number) u.matric_number = `PG/${new Date().getFullYear()}/${String(u.id).padStart(4, '0')}`;
  save();
  notifyByEmail({ to: u.email, name: u.first_name, subject: 'Your account is active', body: `Your student account is active. Your matric number is ${u.matric_number}. You can now pay school fees and register courses.` });
  return u;
}

export async function resendActivation(userId) {
  await wait(200);
  const u = userById(userId);
  if (u.status !== 'pending_activation') fail('This account is already active.');
  issueActivation(u, 'Here is your new activation link.');
  return true;
}

// ---------------------------------------------------------------- applications
export async function getMyApplication(userId) {
  await wait(60);
  return db().applications.find((a) => a.user === Number(userId)) || null;
}

export async function submitApplication(userId, data) {
  await wait(250);
  const d = db();
  const session = currentSession();
  if (d.applications.some((a) => a.user === Number(userId) && a.session === session)) fail('You have already submitted an application for this session.');
  if (!hasPaid(userId, 'admission_form')) fail('Pay the admission form fee before submitting your application.');
  const app = {
    id: nextId(d.applications), application_number: `PG-${new Date().getFullYear()}-${randomCode(8)}`, user: Number(userId),
    session, status: 'submitted', decision: 'pending', created_at: stamp(), ...data, programme: Number(data.programme),
  };
  d.applications.push(app);
  const u = userById(userId);
  Object.assign(u, { gender: data.gender || u.gender, phone: data.phone || u.phone });
  save();
  notifyByEmail({ to: u.email, name: u.first_name, subject: `Application ${app.application_number} received`, body: 'Your application has been received and will be reviewed by the Admission Officer and Registrar.' });
  return app;
}

export async function listApplications({ decision, programme, search, paid } = {}) {
  await wait();
  const q = (search || '').toLowerCase();
  return db().applications
    .map((a) => enrichApplication(a))
    .filter((a) => (!decision || a.decision === decision) && (!programme || a.programme === Number(programme)))
    .filter((a) => paid === undefined || paid === '' || String(a.form_paid) === paid)
    .filter((a) => !q || [a.application_number, a.applicant_name, a.applicant_email].some((v) => v.toLowerCase().includes(q)))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function enrichApplication(a) {
  const u = userById(a.user);
  const p = programmeById(a.programme);
  return { ...a, applicant_name: fullName(u), applicant_email: u?.email || '', applicant: u, programme_name: p?.name || '', programme_label: programmeLabel(p), form_paid: hasPaid(a.user, 'admission_form') };
}

export async function getApplication(id) {
  await wait(60);
  const a = db().applications.find((x) => x.id === Number(id));
  if (!a) fail('Application not found.');
  return enrichApplication(a);
}

/** Admission Officer or Registrar. Only after the admission form fee is verified. */
export async function decideAdmission(id, decision, staff) {
  await wait(250);
  const a = db().applications.find((x) => x.id === Number(id));
  const u = userById(a.user);
  if (decision === 'admitted') {
    if (!hasPaid(a.user, 'admission_form')) fail('The admission form fee has not been verified, so this application cannot be considered yet.');
    a.decision = 'admitted';
    const p = programmeById(a.programme);
    Object.assign(u, { role: 'STUDENT', status: 'pending_activation', programme: a.programme, department: p?.department, college: departmentById(p?.department)?.college, level: '700', session: a.session });
    a.decided_by = displayName(staff);
    a.decided_at = stamp();
    save();
    issueActivation(u, `Congratulations! You have been offered admission into ${programmeLabel(p)}.`);
  } else if (decision === 'revoked') {
    a.decision = 'revoked';
    a.decided_by = displayName(staff);
    a.decided_at = stamp();
    u.status = 'revoked';
    save();
    notifyByEmail({ to: u.email, name: u.first_name, subject: 'Update on your admission', body: 'Your admission has been revoked. Your portal access has been locked. Contact the PG School for more information.' });
  }
  return enrichApplication(a);
}

// ---------------------------------------------------------------- payments & fees
function verifiedPayments(userId, purpose, session = currentSession()) {
  return db().payments.filter((p) => p.user === Number(userId) && p.purpose === purpose && p.status === 'verified' && p.session === session);
}
export function hasPaid(userId, purpose) { return verifiedPayments(userId, purpose).length > 0; }

export function requiredSchoolFee(user) {
  const f = db().fees.find((x) => x.programme === Number(user?.programme) && x.level === user?.level);
  return f?.amount || 0;
}

export function feeStatus(user) {
  const required = requiredSchoolFee(user);
  const paid = verifiedPayments(user.id, 'school_fees').reduce((s, p) => s + p.amount, 0);
  const percent = required ? Math.min(100, Math.round((paid / required) * 100)) : 0;
  return { required, paid, balance: Math.max(0, required - paid), percent, min: settings().min_fee_percent, eligible: percent >= settings().min_fee_percent };
}

export async function listMyPayments(userId) {
  await wait(60);
  return db().payments.filter((p) => p.user === Number(userId)).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Simulated payment gateway: a successful card payment is verified automatically. */
export async function makePayment(userId, { purpose, amount }) {
  await wait(900);
  const d = db();
  const u = userById(userId);
  amount = Math.round(Number(amount));
  if (purpose === 'admission_form') {
    if (hasPaid(userId, 'admission_form')) fail('You have already paid the admission form fee.');
    amount = d.settings.form_fee;
  } else {
    if (u.status !== 'active') fail('Activate your account before paying school fees.');
    const { balance } = feeStatus(u);
    if (!amount || amount < 1000) fail('Enter an amount of at least ₦1,000.');
    if (amount > balance) fail(`The amount is more than your outstanding balance of ${naira(balance)}.`);
  }
  const p = { id: nextId(d.payments), reference: `BTU-${purpose === 'admission_form' ? 'AF' : 'SF'}-${randomCode(6)}`, user: Number(userId), purpose, amount, status: 'verified', session: currentSession(), channel: 'card', created_at: stamp() };
  d.payments.push(p);
  save();
  notifyByEmail({ to: u.email, name: u.first_name, subject: `Payment receipt ${p.reference}`, body: `We received ${naira(amount)} for ${purpose === 'admission_form' ? 'the admission form' : 'school fees'}.` });
  return p;
}

export async function listPayments({ purpose, status, search } = {}) {
  await wait();
  const q = (search || '').toLowerCase();
  return db().payments
    .map((p) => ({ ...p, payer: fullName(userById(p.user)), payer_email: userById(p.user)?.email || '' }))
    .filter((p) => (!purpose || p.purpose === purpose) && (!status || p.status === status))
    .filter((p) => !q || [p.reference, p.payer, p.payer_email].some((v) => v.toLowerCase().includes(q)))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function recordManualPayment({ email, purpose, amount, reference }) {
  await wait();
  const d = db();
  const u = findUserByEmail(email);
  if (!u) fail('No user with that email.');
  if (!reference?.trim()) fail('Enter the bank or teller reference.');
  if (d.payments.some((p) => p.reference.toLowerCase() === reference.trim().toLowerCase())) fail('A payment with this reference already exists.');
  const p = { id: nextId(d.payments), reference: reference.trim(), user: u.id, purpose, amount: Math.round(Number(amount)), status: 'pending', session: currentSession(), channel: 'bank', created_at: stamp() };
  d.payments.push(p);
  save();
  return p;
}

export async function setPaymentStatus(id, status) {
  await wait();
  const p = db().payments.find((x) => x.id === Number(id));
  p.status = status;
  save();
  return p;
}

export async function listFees() {
  await wait(60);
  return db().fees.map((f) => ({ ...f, programme_label: programmeLabel(programmeById(f.programme)) }));
}
export async function saveFee(id, amount) {
  await wait();
  const f = db().fees.find((x) => x.id === Number(id));
  if (!(Number(amount) > 0)) fail('Enter a valid amount.');
  f.amount = Math.round(Number(amount));
  save();
}
export async function saveSettings({ form_fee, min_fee_percent }) {
  await wait();
  const s = db().settings;
  if (!(Number(form_fee) > 0)) fail('Enter a valid admission form fee.');
  if (!(Number(min_fee_percent) >= 1 && Number(min_fee_percent) <= 100)) fail('The minimum percentage must be between 1 and 100.');
  s.form_fee = Math.round(Number(form_fee));
  s.min_fee_percent = Math.round(Number(min_fee_percent));
  save();
}

// ---------------------------------------------------------------- academics (colleges, departments, programmes)
export async function saveCollege(data, id) {
  await wait();
  const d = db();
  if (!data.code?.trim() || !data.name?.trim()) fail('Enter a code and a name.');
  if (d.colleges.some((c) => c.code.toLowerCase() === data.code.trim().toLowerCase() && c.id !== Number(id))) fail('A college with this code already exists.');
  if (id) Object.assign(d.colleges.find((c) => c.id === Number(id)), data);
  else d.colleges.push({ id: nextId(d.colleges), ...data });
  save();
}
export async function saveDepartment(data, id) {
  await wait();
  const d = db();
  if (!data.code?.trim() || !data.name?.trim() || !data.college) fail('Enter a code, a name and a college.');
  if (d.departments.some((x) => x.code.toLowerCase() === data.code.trim().toLowerCase() && x.id !== Number(id))) fail('A department with this code already exists.');
  const row = { ...data, college: Number(data.college) };
  if (id) Object.assign(d.departments.find((x) => x.id === Number(id)), row);
  else d.departments.push({ id: nextId(d.departments), ...row });
  save();
}
export async function saveProgramme(data, id) {
  await wait();
  const d = db();
  if (!data.code?.trim() || !data.name?.trim() || !data.department) fail('Enter a code, a name and a department.');
  if (d.programmes.some((x) => x.code === data.code.trim() && x.id !== Number(id))) fail('A programme with this code already exists.');
  const row = { ...data, department: Number(data.department) };
  if (id) Object.assign(d.programmes.find((x) => x.id === Number(id)), row);
  else {
    const p = { id: nextId(d.programmes), active: true, ...row };
    d.programmes.push(p);
    LEVELS.forEach((level) => d.fees.push({ id: nextId(d.fees), programme: p.id, level, amount: 300000 }));
  }
  save();
}
export async function deleteItem(collection, id) {
  await wait();
  const d = db();
  const n = Number(id);
  if (collection === 'colleges' && d.departments.some((x) => x.college === n)) fail('Move or delete this college’s departments first.');
  if (collection === 'departments' && (d.programmes.some((x) => x.department === n) || d.courses.some((x) => x.department === n))) fail('This department still has programmes or courses.');
  if (collection === 'programmes' && d.applications.some((x) => x.programme === n)) fail('This programme has applications, so it cannot be deleted. Mark it inactive instead.');
  d[collection] = d[collection].filter((x) => x.id !== n);
  if (collection === 'programmes') d.fees = d.fees.filter((f) => f.programme !== n);
  save();
}

// ---------------------------------------------------------------- courses
export async function listCourses({ department, level, semester, session, search } = {}) {
  await wait(60);
  const q = (search || '').toLowerCase();
  return db().courses
    .filter((c) => (!department || c.department === Number(department)) && (!level || c.level === level) && (!semester || c.semester === semester) && (!session || c.session === session))
    .filter((c) => !q || `${c.code} ${c.title}`.toLowerCase().includes(q))
    .map((c) => ({ ...c, department_name: departmentById(c.department)?.name || '' }))
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
}

function courseKey(c) { return `${c.code.replace(/\s+/g, '').toUpperCase()}|${c.session}|${c.semester}`; }

export function validateCourse(row) {
  const errs = [];
  const code = String(row.code || '').trim();
  if (!/^[A-Za-z]{3}\s?\d{3}$/.test(code)) errs.push('Code must look like CSC 711');
  if (!String(row.title || '').trim()) errs.push('Title is required');
  const units = Number(row.units);
  if (!Number.isInteger(units) || units < 1 || units > 6) errs.push('Units must be a whole number from 1 to 6');
  if (!LEVELS.includes(String(row.level).trim())) errs.push(`Level must be ${LEVELS.join(' or ')}`);
  if (!['first', 'second'].includes(String(row.semester).trim().toLowerCase())) errs.push('Semester must be first or second');
  const dept = db().departments.find((x) => x.code.toLowerCase() === String(row.department || '').trim().toLowerCase() || x.name.toLowerCase() === String(row.department || '').trim().toLowerCase());
  if (!dept) errs.push('Department not found (use the department code, e.g. CSC)');
  const session = String(row.session || '').trim() || currentSession();
  if (!db().sessions.some((s) => s.name === session)) errs.push('Session not found');
  return {
    errors: errs,
    course: { code: code.toUpperCase().replace(/^([A-Z]{3})\s?(\d{3})$/, '$1 $2'), title: String(row.title || '').trim(), units, level: String(row.level).trim(), semester: String(row.semester).trim().toLowerCase(), department: dept?.id, session },
  };
}

/** Check rows from a CSV/Excel file. Marks invalid rows, duplicates inside the file, and courses that already exist. */
export function previewCourseImport(rows) {
  const existing = new Set(db().courses.map(courseKey));
  const seen = new Set();
  return rows.map((row, i) => {
    const { errors, course } = validateCourse(row);
    let state = errors.length ? 'invalid' : 'new';
    if (!errors.length) {
      const k = courseKey(course);
      if (seen.has(k)) { state = 'invalid'; errors.push('Duplicate of an earlier row in this file'); }
      else if (existing.has(k)) state = 'exists';
      seen.add(k);
    }
    return { line: i + 2, raw: row, course, errors, state };
  });
}

export async function importCourses(preview, { updateExisting }) {
  await wait(300);
  const d = db();
  let added = 0, updated = 0, skipped = 0;
  preview.forEach((r) => {
    if (r.state === 'invalid') { skipped++; return; }
    const k = courseKey(r.course);
    const found = d.courses.find((c) => courseKey(c) === k);
    if (found) {
      if (updateExisting) { Object.assign(found, r.course); updated++; } else skipped++;
    } else {
      d.courses.push({ id: nextId(d.courses), ...r.course });
      added++;
    }
  });
  save();
  return { added, updated, skipped };
}

export async function saveCourse(data, id) {
  await wait();
  const d = db();
  const dept = departmentById(data.department);
  const { errors, course } = validateCourse({ ...data, department: dept?.code });
  if (errors.length) fail(errors.join('. ') + '.');
  if (d.courses.some((c) => courseKey(c) === courseKey(course) && c.id !== Number(id))) fail('This course already exists for that session and semester.');
  if (id) Object.assign(d.courses.find((c) => c.id === Number(id)), course);
  else d.courses.push({ id: nextId(d.courses), ...course });
  save();
}

// ---------------------------------------------------------------- course registration
export async function getMyRegistration(userId, semester, session = currentSession()) {
  await wait(60);
  const r = db().registrations.find((x) => x.user === Number(userId) && x.session === session && x.semester === semester);
  return r ? enrichRegistration(r) : null;
}

function enrichRegistration(r) {
  const u = userById(r.user);
  const courses = r.courses.map((id) => db().courses.find((c) => c.id === id)).filter(Boolean);
  return { ...r, student: u, student_name: fullName(u), matric_number: u?.matric_number, programme_label: programmeLabel(programmeById(u?.programme)), department_name: departmentById(u?.department)?.name, course_list: courses, total_units: courses.reduce((s, c) => s + c.units, 0) };
}

export const MAX_UNITS = 24;

export async function registerCourses(userId, { semester, courses }) {
  await wait(300);
  const d = db();
  const u = userById(userId);
  const session = currentSession();
  if (u.status === 'pending_activation') fail('Activate your account before registering courses. Check your email for the activation link.');
  if (u.status !== 'active') fail('Your account cannot register courses. Contact the PG School.');
  const fees = feeStatus(u);
  if (!fees.eligible) fail(`You have paid ${fees.percent}% of your school fees. At least ${fees.min}% must be verified before you can register for the session.`);
  if (!courses.length) fail('Select at least one course.');
  const picked = courses.map((id) => d.courses.find((c) => c.id === id));
  const units = picked.reduce((s, c) => s + c.units, 0);
  if (units > MAX_UNITS) fail(`You selected ${units} units. The maximum per semester is ${MAX_UNITS}.`);
  if (d.registrations.some((r) => r.user === u.id && r.session === session && r.semester === semester)) fail('You have already registered for this semester.');
  const r = { id: nextId(d.registrations), number: `REG-${new Date().getFullYear()}-${randomCode(6)}`, user: u.id, session, semester, level: u.level, courses, created_at: stamp() };
  d.registrations.push(r);
  save();
  notifyByEmail({ to: u.email, name: u.first_name, subject: `Course registration ${r.number}`, body: `You registered ${courses.length} courses (${units} units) for the ${semester} semester, ${session}.` });
  return enrichRegistration(r);
}

export async function listRegistrations({ semester, search } = {}) {
  await wait();
  const q = (search || '').toLowerCase();
  return db().registrations.map(enrichRegistration)
    .filter((r) => !semester || r.semester === semester)
    .filter((r) => !q || [r.number, r.student_name, r.matric_number || ''].some((v) => v.toLowerCase().includes(q)))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getRegistration(id) {
  await wait(60);
  const r = db().registrations.find((x) => x.id === Number(id));
  if (!r) fail('Registration not found.');
  return enrichRegistration(r);
}

// ---------------------------------------------------------------- students, emails, stats
export async function listStudents({ status, programme, search } = {}) {
  await wait();
  const q = (search || '').toLowerCase();
  return db().users.filter((u) => u.role === 'STUDENT')
    .filter((u) => (!status || u.status === status) && (!programme || u.programme === Number(programme)))
    .filter((u) => !q || [fullName(u), u.email, u.matric_number || ''].some((v) => v.toLowerCase().includes(q)))
    .map((u) => ({ ...u, name: fullName(u), programme_label: programmeLabel(programmeById(u.programme)), fees: feeStatus(u) }));
}

export async function listEmails() {
  await wait(60);
  return [...db().emails].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getStats() {
  await wait();
  const d = db();
  const apps = d.applications;
  return {
    applications: apps.length,
    pending: apps.filter((a) => a.decision === 'pending').length,
    admitted: apps.filter((a) => a.decision === 'admitted').length,
    revoked: apps.filter((a) => a.decision === 'revoked').length,
    students: d.users.filter((u) => u.role === 'STUDENT').length,
    pending_activation: d.users.filter((u) => u.status === 'pending_activation').length,
    revenue: d.payments.filter((p) => p.status === 'verified').reduce((s, p) => s + p.amount, 0),
    pending_payments: d.payments.filter((p) => p.status === 'pending').length,
    registrations: d.registrations.length,
    courses: d.courses.length,
    programmes: d.programmes.length,
    staff: d.users.filter((u) => ['ICT_ADMIN', 'ADMISSION_OFFICER', 'REGISTRAR', 'PG_STAFF'].includes(u.role)).length,
    recent: apps.map(enrichApplication).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5),
  };
}

export const naira = (n) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(n || 0));
export const shortDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
export const dateTime = (iso) => (iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
