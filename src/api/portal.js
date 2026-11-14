// Student data: application, school fees, course registration.
//
// The backend only has auth endpoints so far, so this file keeps the student's
// application in this browser (localStorage). When the backend group adds the
// endpoints, replace the body of each function with a request() call — the
// pages don't need to change.

export const SESSION = '2025/2026';
export const FEE_MINIMUM = 70; // % of school fees that must be verified before course registration

export const PROGRAMMES = [
  { id: 1, code: '700', name: 'Computer Science', degree: 'MSc' },
  { id: 2, code: '710', name: 'Information Technology', degree: 'MSc' },
  { id: 3, code: '720', name: 'Mathematics', degree: 'MSc' },
];

export const COURSES = [
  { id: 1, programme: 1, semester: 'first', code: 'CSC 711', title: 'Advanced Operating Systems & Distributed Systems', units: 3 },
  { id: 2, programme: 1, semester: 'first', code: 'CSC 745', title: 'Design and Analysis of Advanced Algorithms', units: 3 },
  { id: 3, programme: 1, semester: 'first', code: 'CSC 748', title: 'Machine Learning and Advanced Artificial Intelligence', units: 3 },
  { id: 4, programme: 1, semester: 'first', code: 'CSC 752', title: 'Advanced Database Systems & Big Data Architecture', units: 3 },
  { id: 5, programme: 1, semester: 'second', code: 'CSC 762', title: 'Research Methods in Computing', units: 2 },
  { id: 6, programme: 1, semester: 'second', code: 'CSC 771', title: 'Cloud Computing and Virtualisation', units: 3 },
  { id: 7, programme: 2, semester: 'first', code: 'ITE 701', title: 'Enterprise Systems Architecture', units: 3 },
  { id: 8, programme: 2, semester: 'first', code: 'ITE 715', title: 'Information Security Management', units: 3 },
  { id: 9, programme: 3, semester: 'first', code: 'MTH 701', title: 'Functional Analysis', units: 3 },
  { id: 10, programme: 3, semester: 'first', code: 'MTH 712', title: 'Advanced Abstract Algebra', units: 3 },
];

const key = (user) => `portal.application.${user.email}`;
const wait = (ms = 300) => new Promise((r) => setTimeout(r, ms));

function read(user) {
  try {
    return JSON.parse(localStorage.getItem(key(user))) || null;
  } catch {
    return null;
  }
}

/** Later: GET /api/applications/me/ */
export async function getMyApplication(user) {
  await wait(150);
  return read(user);
}

/** Later: POST /api/applications/ */
export async function submitApplication(user, data) {
  await wait();
  if (read(user)) throw new Error('You have already submitted an application for this session.');
  const programme = PROGRAMMES.find((p) => p.id === Number(data.programme));
  const app = {
    ...data,
    programme: Number(data.programme),
    programme_name: programme?.name || '',
    session: SESSION,
    application_number: `PG-2026-${Math.random().toString(16).slice(2, 10).toUpperCase().padEnd(8, '0')}`,
    status: 'submitted',
    eligibility: 'pending',
    decision: 'pending',
    created_at: new Date().toISOString(),
  };
  localStorage.setItem(key(user), JSON.stringify(app));
  return app;
}

/** Later: sum of verified school-fee payments from GET /api/payments/ */
export async function getVerifiedFeePercent() {
  await wait(100);
  return 0;
}

/** Later: GET /api/courses/?programme=&semester= */
export async function getCourses({ programme, semester }) {
  await wait(150);
  return COURSES.filter((c) => c.programme === Number(programme) && c.semester === semester);
}

/** Later: POST /api/registrations/ (the backend must also enforce these rules) */
export async function registerCourses(user, { courses }) {
  await wait();
  const app = read(user);
  const fees = await getVerifiedFeePercent();
  if (!app || app.decision !== 'admitted') throw new Error('Course registration opens after you are admitted.');
  if (fees < FEE_MINIMUM) throw new Error(`You need at least ${FEE_MINIMUM}% verified school fees to register courses.`);
  if (!courses.length) throw new Error('Select at least one course.');
  return { ok: true };
}
