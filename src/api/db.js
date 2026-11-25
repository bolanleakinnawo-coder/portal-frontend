// Data store for the parts of the portal that the backend does not expose yet
// (applications, payments, courses, registrations, emails, staff permissions).
// Starts with the university's academic setup (colleges, departments, programmes, fees, courses),
// which the ICT Administrator can edit. People, applications and payments start empty.
//
// When the backend adds these endpoints, replace the functions in services.js with API calls.

const KEY = 'bitly.pg.db.v2';

const now = () => new Date().toISOString();

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
  return {
    colleges, departments, programmes, sessions, fees, courses,
    settings: { form_fee: 25000, min_fee_percent: 70 },
    users: [], applications: [], payments: [], tokens: [], registrations: [], emails: [],
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

export const nextId = (rows) => rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
export const stamp = now;
export const randomCode = (n = 8) =>
  Array.from(crypto.getRandomValues(new Uint8Array(n)))
    .map((b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32])
    .join('');
