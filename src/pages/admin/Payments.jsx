import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminLayout } from '../../components/AdminLayout';
import { useLoad, Table, Badge, PageHead, Modal, Field, Toast } from '../../components/ui';
import { dateTime, listPayments, naira, recordManualPayment, setPaymentStatus } from '../../api/services';
import { can } from '../../config/roles';

export default function Payments() {
  const { user } = useAuth();
  const canVerify = can(user, 'payments.verify');
  const [f, setF] = useState({ search: '', purpose: '', status: '' });
  const { data: rows, reload } = useLoad(() => listPayments(f), [f.search, f.purpose, f.status]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ email: '', purpose: 'school_fees', amount: '', reference: '' });
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const total = (rows || []).filter((p) => p.status === 'verified').reduce((s, p) => s + p.amount, 0);

  async function add() {
    setErr('');
    try {
      await recordManualPayment(form);
      setAdding(false);
      setForm({ email: '', purpose: 'school_fees', amount: '', reference: '' });
      setMsg('Payment recorded as pending. Verify it once the bank confirms.');
      reload();
    } catch (e) { setErr(e.message); }
  }

  async function change(p, status) {
    await setPaymentStatus(p.id, status);
    setMsg(`Payment ${p.reference} marked ${status}.`);
    reload();
  }

  return (
    <AdminLayout>
      <PageHead
        title="Payments"
        sub="Card payments are verified automatically by the gateway. Bank or teller payments are recorded here and verified manually."
        actions={canVerify && <button className="btn btn-primary" onClick={() => setAdding(true)}>Record bank payment</button>}
      />
      <div className="toolbar">
        <input className="search" placeholder="Search reference, name or email" value={f.search} onChange={set('search')} />
        <select value={f.purpose} onChange={set('purpose')}><option value="">All purposes</option><option value="admission_form">Admission form</option><option value="school_fees">School fees</option></select>
        <select value={f.status} onChange={set('status')}><option value="">All statuses</option><option value="verified">Verified</option><option value="pending">Pending</option><option value="failed">Failed</option></select>
        <span className="toolbar-note">Verified in view: <strong>{naira(total)}</strong></span>
      </div>
      <Table
        rows={rows}
        empty="No payments match these filters."
        columns={[
          { key: 'reference', label: 'Reference', strong: true },
          { key: 'payer', label: 'Payer', render: (p) => <span>{p.payer}<small className="cell-sub">{p.payer_email}</small></span> },
          { key: 'purpose', label: 'Purpose', render: (p) => <Badge value={p.purpose} /> },
          { key: 'amount', label: 'Amount', right: true, render: (p) => naira(p.amount) },
          { key: 'channel', label: 'Channel', render: (p) => <span className="cap">{p.channel}</span> },
          { key: 'status', label: 'Status', render: (p) => <Badge value={p.status} /> },
          { key: 'created_at', label: 'Date', render: (p) => dateTime(p.created_at) },
          ...(canVerify ? [{ key: 'act', label: '', render: (p) => p.status === 'pending' && (
            <span className="row-actions">
              <button className="btn btn-sm btn-primary" onClick={() => change(p, 'verified')}>Verify</button>
              <button className="btn btn-sm btn-outline" onClick={() => change(p, 'failed')}>Reject</button>
            </span>
          ) }] : []),
        ]}
      />
      {adding && (
        <Modal title="Record bank payment" onClose={() => setAdding(false)} footer={<><button className="btn btn-outline" onClick={() => setAdding(false)}>Cancel</button><button className="btn btn-primary" onClick={add}>Save as pending</button></>}>
          <Field id="p-email" label="Student or applicant email"><input id="p-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <div className="two-col">
            <Field id="p-purpose" label="Purpose"><select id="p-purpose" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}><option value="admission_form">Admission form</option><option value="school_fees">School fees</option></select></Field>
            <Field id="p-amount" label="Amount (₦)"><input id="p-amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
          </div>
          <Field id="p-ref" label="Bank / teller reference"><input id="p-ref" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></Field>
          {err && <div className="alert alert-error">{err}</div>}
        </Modal>
      )}
      <Toast message={msg} onDone={() => setMsg('')} />
    </AdminLayout>
  );
}
