import { useState } from 'react';
import { useRouter } from '../../lib/router';
import { AdminLayout } from '../../components/AdminLayout';
import { useLoad, Table, PageHead } from '../../components/ui';
import { listRegistrations, shortDate } from '../../api/services';

export default function Registrations() {
  const { navigate } = useRouter();
  const [f, setF] = useState({ search: '', semester: '' });
  const { data: rows } = useLoad(() => listRegistrations(f), [f.search, f.semester]);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  return (
    <AdminLayout>
      <PageHead title="Course registrations" sub="Every registration for the session. Click one to open the printable slip." />
      <div className="toolbar">
        <input className="search" placeholder="Search registration number, name or matric number" value={f.search} onChange={set('search')} />
        <select value={f.semester} onChange={set('semester')}><option value="">Both semesters</option><option value="first">First semester</option><option value="second">Second semester</option></select>
      </div>
      <Table
        rows={rows}
        empty="No course registrations yet."
        onRowClick={(r) => navigate(`/slip/${r.id}`)}
        columns={[
          { key: 'number', label: 'Registration', strong: true },
          { key: 'student_name', label: 'Student', render: (r) => <span>{r.student_name}<small className="cell-sub">{r.matric_number}</small></span> },
          { key: 'programme_label', label: 'Programme' },
          { key: 'semester', label: 'Semester', render: (r) => <span className="cap">{r.semester}</span> },
          { key: 'total_units', label: 'Units', right: true },
          { key: 'created_at', label: 'Date', render: (r) => shortDate(r.created_at) },
        ]}
      />
    </AdminLayout>
  );
}
