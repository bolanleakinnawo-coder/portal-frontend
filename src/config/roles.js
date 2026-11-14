// Roles, permissions and the admin sidebar.
// Assumption (SRS review): "ICT Officer" and "ICT Administrator" are the same role, ICT_ADMIN.
// Assumption: both the Admission Officer and the Registrar can grant or revoke admission (as in the brief).

export const ROLE_LABELS = {
  ICT_ADMIN: 'ICT Administrator',
  ADMISSION_OFFICER: 'Admission Officer',
  REGISTRAR: 'Registrar',
  PG_STAFF: 'PG School Staff',
  PG_APPLICANT: 'PG Applicant',
  STUDENT: 'Student',
};

export const STAFF_ROLES = ['ICT_ADMIN', 'ADMISSION_OFFICER', 'REGISTRAR', 'PG_STAFF'];
export const isStaff = (u) => !!u && STAFF_ROLES.includes(u.role);
export const homeFor = (u) => (isStaff(u) ? '/admin' : '/dashboard');

export const PERMISSIONS = [
  { key: 'applications.view', label: 'View applications' },
  { key: 'admissions.decide', label: 'Grant or revoke admission' },
  { key: 'students.view', label: 'View students' },
  { key: 'payments.view', label: 'View payments' },
  { key: 'payments.verify', label: 'Record and verify payments' },
  { key: 'registrations.view', label: 'View course registrations' },
  { key: 'courses.manage', label: 'Manage courses (incl. CSV/Excel upload)' },
  { key: 'academics.manage', label: 'Manage colleges, departments and programmes' },
  { key: 'fees.manage', label: 'Manage fee structure' },
  { key: 'users.manage', label: 'Manage users and permissions' },
  { key: 'emails.view', label: 'View email log' },
];

const ROLE_PERMISSIONS = {
  ICT_ADMIN: ['users.manage', 'academics.manage', 'courses.manage', 'fees.manage', 'emails.view', 'students.view', 'registrations.view', 'applications.view', 'payments.view'],
  ADMISSION_OFFICER: ['applications.view', 'admissions.decide', 'payments.view', 'students.view'],
  REGISTRAR: ['applications.view', 'admissions.decide', 'students.view', 'payments.view', 'payments.verify', 'registrations.view', 'courses.manage', 'fees.manage', 'emails.view'],
};

/** PG School Staff only get the permissions the ICT Admin assigned to them. */
export function permissionsFor(user) {
  if (!user) return [];
  if (user.role === 'PG_STAFF') return user.permissions || [];
  return ROLE_PERMISSIONS[user.role] || [];
}
export const can = (user, perm) => permissionsFor(user).includes(perm);

export const ADMIN_NAV = [
  { group: '', items: [{ to: '/admin', label: 'Dashboard', perm: null }] },
  { group: 'Admissions', items: [
    { to: '/admin/applications', label: 'Applications', perm: 'applications.view' },
    { to: '/admin/students', label: 'Students', perm: 'students.view' },
  ] },
  { group: 'Finance', items: [
    { to: '/admin/payments', label: 'Payments', perm: 'payments.view' },
    { to: '/admin/fees', label: 'Fee structure', perm: 'fees.manage' },
  ] },
  { group: 'Academics', items: [
    { to: '/admin/courses', label: 'Courses', perm: 'courses.manage' },
    { to: '/admin/registrations', label: 'Course registrations', perm: 'registrations.view' },
    { to: '/admin/academics', label: 'Colleges & programmes', perm: 'academics.manage' },
  ] },
  { group: 'System', items: [
    { to: '/admin/users', label: 'Users & permissions', perm: 'users.manage' },
    { to: '/admin/emails', label: 'Email log', perm: 'emails.view' },
  ] },
];
