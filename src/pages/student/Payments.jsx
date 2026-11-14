import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StudentLayout } from '../../components/StudentLayout';
import { PaymentModal } from '../../components/PaymentModal';
import { useLoad, Table, Badge, Field } from '../../components/ui';
import { CardIcon, LockIcon } from '../../components/Icons';
import { currentSession, dateTime, feeStatus, hasPaid, listMyPayments, naira, settings } from '../../api/services';

export default function Payments() {
  const { user, refresh } = useAuth();
  const { data: payments, reload } = useLoad(() => listMyPayments(user.id), [user.id]);
  const [paying, setPaying] = useState(null); // { purpose, amount, title }
  const [option, setOption] = useState('min');
  const [custom, setCustom] = useState('');
  const [error, setError] = useState('');

  const isStudent = user.role === 'STUDENT';
  const formPaid = hasPaid(user.id, 'admission_form');
  const fees = isStudent ? feeStatus(user) : null;
  const toMinimum = fees ? Math.max(0, Math.ceil((fees.required * fees.min) / 100) - fees.paid) : 0;
  const opt = option === 'min' && toMinimum === 0 ? 'full' : option;

  function startSchoolFees() {
    setError('');
    const amount = opt === 'full' ? fees.balance : opt === 'min' ? toMinimum : Number(custom);
    if (!amount || amount < 1000) return setError('Enter an amount of at least ₦1,000.');
    if (amount > fees.balance) return setError(`The amount is more than your balance of ${naira(fees.balance)}.`);
    setPaying({ purpose: 'school_fees', amount, title: 'School fees' });
  }

  const done = async () => { setPaying(null); await reload(); await refresh(); };

  return (
    <StudentLayout>
      <p className="session">{currentSession()} session</p>
      <h1 className="dash-title">Payments</h1>
      <p className="sub">Pay your fees securely and keep track of every verified payment.</p>

      <div className="pay-grid">
        {!user.returning && (
          <section className="panel">
            <div className="stat-top"><span className="panel-icon"><CardIcon /></span><Badge value={formPaid ? 'verified' : 'pending'}>{formPaid ? 'Paid' : 'Unpaid'}</Badge></div>
            <p className="panel-label">Admission form fee</p>
            <p className="stat-value">{naira(settings().form_fee)}</p>
            <p className="stat-foot">Must be verified before your application is considered.</p>
            {!formPaid && <button className="btn btn-primary btn-block mt" onClick={() => setPaying({ purpose: 'admission_form', amount: settings().form_fee, title: 'Admission form fee' })}>Pay admission form fee</button>}
          </section>
        )}

        {isStudent ? (
          <section className="panel fees-panel">
            <div className="stat-top"><span className="panel-icon"><CardIcon /></span><span className="tag tag-green">{fees.percent}% paid</span></div>
            <p className="panel-label">School fees · {user.level} level</p>
            <p className="stat-value">{naira(fees.required)}</p>
            <div className="meter big"><span style={{ width: `${fees.percent}%` }} /><i style={{ left: `${fees.min}%` }} /></div>
            <div className="fee-row"><span>Paid</span><strong>{naira(fees.paid)}</strong></div>
            <div className="fee-row"><span>Balance</span><strong>{naira(fees.balance)}</strong></div>
            <p className={`fee-rule ${fees.eligible ? 'ok' : ''}`}>
              {fees.eligible ? `You have met the ${fees.min}% minimum for course registration.` : `At least ${fees.min}% (${naira(Math.ceil((fees.required * fees.min) / 100))}) must be verified before course registration.`}
            </p>

            {user.status !== 'active' ? (
              <div className="lock-note small"><LockIcon width={18} height={18} /> Activate your account to pay school fees.</div>
            ) : fees.balance > 0 ? (
              <div className="fee-options">
                {toMinimum > 0 && (
                  <label className="radio"><input type="radio" name="opt" checked={opt === 'min'} onChange={() => setOption('min')} /> Reach {fees.min}% — {naira(toMinimum)}</label>
                )}
                <label className="radio"><input type="radio" name="opt" checked={opt === 'full'} onChange={() => setOption('full')} /> Full balance — {naira(fees.balance)}</label>
                <label className="radio"><input type="radio" name="opt" checked={opt === 'custom'} onChange={() => setOption('custom')} /> Another amount</label>
                {opt === 'custom' && (
                  <Field id="custom" label="Amount (₦)">
                    <input id="custom" type="number" min="1000" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. 100000" />
                  </Field>
                )}
                {error && <div className="alert alert-error">{error}</div>}
                <button className="btn btn-primary btn-block" onClick={startSchoolFees}>Pay school fees</button>
              </div>
            ) : (
              <p className="fee-rule ok">Your school fees are fully paid.</p>
            )}
          </section>
        ) : (
          <section className="panel muted-panel">
            <p className="panel-label">School fees</p>
            <p className="stat-foot">School fees become payable after you are admitted and activate your student account.</p>
          </section>
        )}
      </div>

      <h2 className="section-title">Payment history</h2>
      <Table
        rows={payments}
        empty="No payments yet."
        columns={[
          { key: 'reference', label: 'Reference', strong: true },
          { key: 'purpose', label: 'Purpose', render: (p) => <Badge value={p.purpose} /> },
          { key: 'amount', label: 'Amount', right: true, render: (p) => naira(p.amount) },
          { key: 'status', label: 'Status', render: (p) => <Badge value={p.status} /> },
          { key: 'created_at', label: 'Date', render: (p) => dateTime(p.created_at) },
        ]}
      />

      {paying && <PaymentModal user={user} {...paying} onClose={() => setPaying(null)} onPaid={done} />}
    </StudentLayout>
  );
}
