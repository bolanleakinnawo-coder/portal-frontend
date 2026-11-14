import { useState } from 'react';
import { useRouter } from '../../lib/router';
import { AdminLayout } from '../../components/AdminLayout';
import { useLoad, Table, Badge, PageHead } from '../../components/ui';
import { getLookups, listApplications, shortDate } from '../../api/services';

export default function Applications() {
  const { navigate } = useRouter();
  const [f, setF] = useState({ search: '', decision: '', programme: '', paid: '' });
  const { data: lookups } = useLoad(getLookups, []);
  const { data: rows } = useLoad(() => listApplications(f), [f.search, f.decision, f.programme, f.paid]);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  return (
    <AdminLayout>
      <PageHead title="Applications" sub="Review applications and grant or revoke admission. An application is considered only after its admission form fee is verified." />
      <div className="toolbar">
        <input className="search" placeholder="Search name, email or application number" value={f.search} onChange={set('search')} />
        <select value={f.decision} onChange={set('decision')}><option value="">All decisions</option><option value="pending">Pending</option><option value="admitted">Admitted</option><option value="revoked">Revoked</option></select>
        <select value={f.paid} onChange={set('paid')}><option value="">Form fee: any</option><option value="true">Paid</option><option value="false">Unpaid</option></select>
        <select value={f.programme} onChange={set('programme')}><option value="">All programmes</option>{lookups?.programmes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      </div>
      <Table
        rows={rows}
        empty="No applications match these filters."
        onRowClick={(a) => navigate(`/admin/applications/${a.id}`)}
        columns={[
          { key: 'application_number', label: 'Application', strong: true },
          { key: 'applicant_name', label: 'Applicant', render: (a) => <span>{a.applicant_name}<small className="cell-sub">{a.applicant_email}</small></span> },
          { key: 'programme_name', label: 'Programme' },
          { key: 'form_paid', label: 'Form fee', render: (a) => <Badge value={a.form_paid ? 'verified' : 'pending'}>{a.form_paid ? 'Paid' : 'Unpaid'}</Badge> },
          { key: 'decision', label: 'Decision', render: (a) => <Badge value={a.decision} /> },
          { key: 'created_at', label: 'Submitted', render: (a) => shortDate(a.created_at) },
        ]}
      />
    </AdminLayout>
  );
}
