// Local data store for everything the backend doesn't have endpoints for yet.
// Saved in this browser (localStorage), so every role sees the same data in the same browser —
// an applicant can apply, then an Admission Officer can log in and grant admission.
//
// When the backend adds endpoints, replace the functions in services.js with API calls.

const KEY = 'bitly.pg.db.v1';

const now = () => new Date().toISOString();
const daysAgo = (d) => new Date(Date.now() - d * 86400000).toISOString();

function seed() {
  const colleges = [
    { id: 1, code: 'COLCIS', name: 'College of Computing and Information Sciences' },
    { id: 2, code: 'COLPHYS', name: 'College of Physical Sciences' },
  ];
  const departments = [
    { id: 1, college: 1, code: 'CSC', name: 'Computer Science' },
    { id: 2, college: 1, code: 'IFT', name: 'Information Technology' },
    { id: 3, college: 1, code: 'CYB', name: 'Cyber Security' },
    { id: 4, college: 2, code: 'MTH', name: 'Mathematics' },
    { id: 5, college: 2, code: 'STA', name: 'Statistics' },
    { id: 6, college: 2, code: 'PHY', name: 'Physics' },
  ];
  const programmes = [
    { id: 1, code: '700', name: 'Computer Science', degree: 'M.Sc.', department: 1, active: true },
    { id: 2, code: '710', name: 'Information Technology', degree: 'M.Sc.', department: 2, active: true },
    { id: 3, code: '720', name: 'Cyber Security', degree: 'M.Sc.', department: 3, active: true },
    { id: 4, code: '730', name: 'Mathematics', degree: 'M.Sc.', department: 4, active: true },
    { id: 5, code: '740', name: 'Statistics', degree: 'M.Sc.', department: 5, active: true },
  ];
  const sessions = [
    { id: 1, name: '2024/2025', current: false },
    { id: 2, name: '2025/2026', current: true },
  ];
  const fees = programmes.flatMap((p, i) => [
    { id: i * 2 + 1, programme: p.id, level: '700', amount: 350000 + i * 10000 },
    { id: i * 2 + 2, programme: p.id, level: '800', amount: 300000 + i * 10000 },
  ]);
  const c = (id, code, title, department, level, semester, units = 3) => ({ id, code, title, department, level, semester, units, session: '2025/2026' });
  const courses = [
    c(1, 'CSC 711', 'Advanced Operating Systems & Distributed Systems', 1, '700', 'first'),
    c(2, 'CSC 745', 'Design and Analysis of Advanced Algorithms', 1, '700', 'first'),
    c(3, 'CSC 748', 'Machine Learning and Advanced Artificial Intelligence', 1, '700', 'first'),
    c(4, 'CSC 752', 'Advanced Database Systems & Big Data Architecture', 1, '700', 'first'),
    c(5, 'CSC 762', 'Research Methods in Computing', 1, '700', 'second', 2),
    c(6, 'CSC 771', 'Cloud Computing and Virtualisation', 1, '700', 'second'),
    c(7, 'CSC 899', 'M.Sc. Dissertation', 1, '800', 'first', 6),
    c(8, 'IFT 701', 'Enterprise Systems Architecture', 2, '700', 'first'),
    c(9, 'IFT 715', 'IT Project and Service Management', 2, '700', 'first'),
    c(10, 'CYB 701', 'Network Security and Cryptography', 3, '700', 'first'),
    c(11, 'CYB 712', 'Digital Forensics and Incident Response', 3, '700', 'first'),
    c(12, 'MTH 701', 'Functional Analysis', 4, '700', 'first'),
    c(13, 'MTH 712', 'Advanced Abstract Algebra', 4, '700', 'first'),
    c(14, 'STA 701', 'Advanced Statistical Inference', 5, '700', 'first'),
    c(15, 'STA 714', 'Multivariate Analysis', 5, '700', 'first'),
  ];
  const staff = (id, email, surname, first_name, role, permissions = []) => ({
    id, email, password: 'Demo@1234', surname, first_name, other_name: '', gender: '', phone: '',
    role, status: 'active', permissions, source: 'demo', created_at: daysAgo(60),
  });
  const users = [
    staff(1, 'ict@bitly.edu.ng', 'Ogunleye', 'Bolaji', 'ICT_ADMIN'),
    staff(2, 'admissions@bitly.edu.ng', 'Nwosu', 'Emeka', 'ADMISSION_OFFICER'),
    staff(3, 'registrar@bitly.edu.ng', 'Adebayo', 'Folake', 'REGISTRAR'),
    staff(4, 'pgstaff@bitly.edu.ng', 'Bello', 'Halima', 'PG_STAFF', ['applications.view', 'students.view']),
    { id: 5, email: 'kwame.mensah@demo.com', password: 'Demo@1234', surname: 'Mensah', first_name: 'Kwame', other_name: '', gender: 'male', phone: '+233240001111', role: 'PG_APPLICANT', status: 'active', source: 'demo', created_at: daysAgo(6) },
    { id: 6, email: 'tolu.adeyemi@demo.com', password: 'Demo@1234', surname: 'Adeyemi', first_name: 'Tolu', other_name: 'Grace', gender: 'female', phone: '08030002222', role: 'STUDENT', status: 'active', matric_number: 'PG/2026/0001', programme: 1, level: '700', department: 1, college: 1, source: 'demo', created_at: daysAgo(20) },
    { id: 7, email: 'chiamaka.obi@demo.com', password: 'Demo@1234', surname: 'Obi', first_name: 'Chiamaka', other_name: '', gender: 'female', phone: '08100004444', role: 'PG_APPLICANT', status: 'active', source: 'demo', created_at: daysAgo(3) },
  ];
  const app = (id, number, user, programme, extra) => ({
    id, application_number: number, user, programme, session: '2025/2026', date_of_birth: '1999-01-20',
    nationality: 'Nigerian', address: '12 Oke-Ilewo Road, Abeokuta, Ogun State', institution: 'University of Lagos',
    qualification: 'B.Sc. Computer Science', class_of_degree: 'Second Class Upper', year_awarded: 2022,
    status: 'submitted', decision: 'pending', created_at: daysAgo(5), ...extra,
  });
  const applications = [
    app(1, 'PG-2026-495D025E', 5, 1, { nationality: 'Ghanaian', institution: 'University of Ghana', address: '56 Ring Road, Accra' }),
    app(2, 'PG-2026-7B5E1F63', 6, 1, { decision: 'admitted', decided_by: 'Folake Adebayo', decided_at: daysAgo(15), created_at: daysAgo(19), institution: 'FUNAAB', class_of_degree: 'First Class' }),
    app(3, 'PG-2026-C19A77F0', 7, 4, { institution: 'University of Nigeria, Nsukka', qualification: 'B.Sc. Mathematics', created_at: daysAgo(2) }),
  ];
  const payments = [
    { id: 1, reference: 'BTU-AF-102938', user: 5, purpose: 'admission_form', amount: 25000, status: 'verified', session: '2025/2026', channel: 'card', created_at: daysAgo(5) },
    { id: 2, reference: 'BTU-AF-102811', user: 6, purpose: 'admission_form', amount: 25000, status: 'verified', session: '2025/2026', channel: 'card', created_at: daysAgo(19) },
    { id: 3, reference: 'BTU-SF-220145', user: 6, purpose: 'school_fees', amount: 280000, status: 'verified', session: '2025/2026', channel: 'card', created_at: daysAgo(12) },
  ];
  return {
    colleges, departments, programmes, sessions, fees, courses, users, applications, payments,
    settings: { form_fee: 25000, min_fee_percent: 70 },
    tokens: [], registrations: [], emails: [],
  };
}

let cache = null;

export function load() {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY));
  } catch {
    cache = null;
  }
  if (!cache) {
    cache = seed();
    save();
  }
  return cache;
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* storage full or blocked — keep working in memory */
  }
}

/** Start over with the sample data (used by the "Reset demo data" button). */
export function reset() {
  cache = seed();
  save();
}

export const nextId = (rows) => rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
export const stamp = now;
export const randomCode = (n = 8) =>
  Array.from(crypto.getRandomValues(new Uint8Array(n)))
    .map((b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32])
    .join('');
