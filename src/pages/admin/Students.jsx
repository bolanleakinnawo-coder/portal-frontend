import { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { useLoad, Table, Badge, PageHead, Modal } from '../../components/ui';
import { getLookups, listStudents, naira, shortDate, collegeById, departmentById } from '../../api/services';

export default function Students() {
  const [f, setF] = useState({ search: '', status: '', programme: '' });
  const [open, setOpen] = useState(null);
  const { data: lookups } = useLoad(getLookups, []);
  const { data: rows } = useLoad(() => listStudents(f), [f.search, f.status, f.programme]);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  return (
    <AdminLayout>
      <PageHead title="Students" sub="Admitted and returning students, their activation status and school fee progress." />
      <div className="toolbar">
        <input className="search" placeholder="Search name, email or matric number" value={f.search} onChange={set('search')} />
        <select value={f.status} onChange={set('status')}><option value="">All statuses</option><option value="active">Active</option><option value="pending_activation">Awaiting activation</option><option value="revoked">Revoked</option><option value="suspended">Suspended</option></select>
        <select value={f.programme} onChange={set('programme')}><option value="">All programmes</option>{lookups?.programmes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      </div>
      <Table
        rows={rows}
        empty="No students match these filters."
        onRowClick={setOpen}
        columns={[
          { key: 'name', label: 'Student', strong: true, render: (s) => <span>{s.name}<small className="cell-sub">{s.email}</small></span> },
          { key: 'matric_number', label: 'Matric number', render: (s) => s.matric_number || <span className="muted">Not assigned</span> },
          { key: 'programme_label', label: 'Programme' },
          { key: 'level', label: 'Level' },
          { key: 'fees', label: 'Fees paid', render: (s) => <span className={s.fees.eligible ? 'ok-text' : ''}>{s.fees.percent}%</span> },
          { key: 'status', label: 'Status', render: (s) => <Badge value={s.status} /> },
        ]}
      />
      {open && (
        <Modal title={open.name} onClose={() => setOpen(null)}>
          {[
            ['Email', open.email], ['Phone', open.phone], ['Gender', open.gender], ['Matric number', open.matric_number],
            ['Application number', open.application_number], ['College', collegeById(open.college)?.name], ['Department', departmentById(open.department)?.name],
            ['Programme', open.programme_label], ['Level', open.level], ['Type', open.returning ? 'Returning student' : 'Newly admitted'],
            ['School fees', `${naira(open.fees.paid)} of ${naira(open.fees.required)} (${open.fees.percent}%)`], ['Registered on portal', shortDate(open.created_at)],
          ].map(([k, v]) => <div className="kv" key={k}><span>{k}</span><strong className={k === 'Gender' ? 'cap' : ''}>{v || '—'}</strong></div>)}
          <div className="kv"><span>Status</span><strong><Badge value={open.status} /></strong></div>
        </Modal>
      )}
    </AdminLayout>
  );
}
