import { Link, useRouter } from '../../lib/router';
import { useAuth } from '../../context/AuthContext';
import { AdminLayout } from '../../components/AdminLayout';
import { useLoad, Table, Badge, PageHead } from '../../components/ui';
import { getStats, naira, currentSession, shortDate } from '../../api/services';
import { ROLE_LABELS, can } from '../../config/roles';

export default function Dashboard() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const { data: s } = useLoad(getStats, []);

  const cards = s ? [
    can(user, 'applications.view') && { to: '/admin/applications', label: 'Applications', value: s.applications, sub: `${s.pending} awaiting a decision` },
    can(user, 'applications.view') && { to: '/admin/applications', label: 'Admitted', value: s.admitted, sub: `${s.revoked} revoked` },
    can(user, 'students.view') && { to: '/admin/students', label: 'Students', value: s.students, sub: `${s.pending_activation} awaiting activation` },
    can(user, 'payments.view') && { to: '/admin/payments', label: 'Verified payments', value: naira(s.revenue), sub: `${s.pending_payments} waiting for verification` },
    can(user, 'registrations.view') && { to: '/admin/registrations', label: 'Course registrations', value: s.registrations, sub: currentSession() },
    can(user, 'courses.manage') && { to: '/admin/courses', label: 'Courses', value: s.courses, sub: `${s.programmes} programmes` },
    can(user, 'users.manage') && { to: '/admin/users', label: 'Staff accounts', value: s.staff, sub: 'Users & permissions' },
  ].filter(Boolean) : [];

  return (
    <AdminLayout>
      <PageHead eyebrow={`${currentSession()} session · ${ROLE_LABELS[user.role]}`} title={`Good day, ${user.first_name}.`} sub="Here is what needs your attention in the PG School portal." />
      {!s ? <div className="spinner page-spinner" /> : (
        <>
          {cards.length === 0 && <div className="panel muted-panel">No permissions have been assigned to your account yet. Ask the ICT Administrator.</div>}
          <div className="admin-stats">
            {cards.map((c) => (
              <Link key={c.label} to={c.to} className="panel stat-link-card">
                <p className="panel-label">{c.label}</p>
                <p className="stat-value">{c.value}</p>
                <p className="stat-foot">{c.sub}</p>
              </Link>
            ))}
          </div>
          {can(user, 'applications.view') && (
            <>
              <div className="section-row"><h2 className="section-title">Latest applications</h2><Link to="/admin/applications" className="link">View all →</Link></div>
              <Table
                rows={s.recent}
                onRowClick={(a) => navigate(`/admin/applications/${a.id}`)}
                columns={[
                  { key: 'application_number', label: 'Application', strong: true },
                  { key: 'applicant_name', label: 'Applicant' },
                  { key: 'programme_name', label: 'Programme' },
                  { key: 'form_paid', label: 'Form fee', render: (a) => <Badge value={a.form_paid ? 'verified' : 'pending'}>{a.form_paid ? 'Paid' : 'Unpaid'}</Badge> },
                  { key: 'decision', label: 'Decision', render: (a) => <Badge value={a.decision} /> },
                  { key: 'created_at', label: 'Submitted', render: (a) => shortDate(a.created_at) },
                ]}
              />
            </>
          )}
        </>
      )}
    </AdminLayout>
  );
}
