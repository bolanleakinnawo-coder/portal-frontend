import { useState } from 'react';
import { Link } from '../../lib/router';
import { useAuth } from '../../context/AuthContext';
import { AdminLayout } from '../../components/AdminLayout';
import { useLoad, Badge, Modal, Toast } from '../../components/ui';
import { dateTime, decideAdmission, getApplication, listMyPayments, naira, shortDate } from '../../api/services';
import { can } from '../../config/roles';

export default function ApplicationDetail({ id }) {
  const { user } = useAuth();
  const { data, error, reload } = useLoad(async () => {
    const app = await getApplication(id);
    return { app, payments: await listMyPayments(app.user) };
  }, [id]);
  const [confirm, setConfirm] = useState(null); // 'admitted' | 'revoked'
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  if (error) return <AdminLayout><div className="alert alert-error">{error}</div></AdminLayout>;
  if (!data) return <AdminLayout><div className="spinner page-spinner" /></AdminLayout>;
  const { app, payments } = data;
  const u = app.applicant;
  const canDecide = can(user, 'admissions.decide');

  async function decide() {
    setBusy(true);
    setErr('');
    try {
      await decideAdmission(app.id, confirm, user);
      setMsg(confirm === 'admitted' ? 'Admission granted. An activation email was sent to the student.' : 'Admission revoked. The student’s access is now locked.');
      setConfirm(null);
      await reload();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const rows = (pairs) => pairs.map(([k, v]) => <div className="kv" key={k}><span>{k}</span><strong className={k === 'Gender' ? 'cap' : ''}>{v || '—'}</strong></div>);

  return (
    <AdminLayout>
      <Link to="/admin/applications" className="back-link">← Applications</Link>
      <div className="page-head">
        <div>
          <p className="session">{app.session} session</p>
          <h1 className="dash-title">{app.application_number}</h1>
          <p className="sub">{app.applicant_name} · <Badge value={app.decision} /></p>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel">
            <h2 className="panel-title">Applicant</h2>
            {rows([['Full name', app.applicant_name], ['Email', u?.email], ['Phone', app.phone || u?.phone], ['Gender', app.gender], ['Date of birth', shortDate(app.date_of_birth)], ['Nationality', app.nationality], ['Address', app.address]])}
          </section>
          <section className="panel">
            <h2 className="panel-title">Programme and qualification</h2>
            {rows([['Programme', app.programme_label], ['Institution', app.institution], ['Qualification', app.qualification], ['Class of degree', app.class_of_degree], ['Year awarded', app.year_awarded], ['Submitted', dateTime(app.created_at)]])}
          </section>
          <section className="panel">
            <h2 className="panel-title">Payments</h2>
            {payments.length === 0 && <p className="muted">No payments yet.</p>}
            {payments.map((p) => (
              <div className="kv" key={p.id}><span><Badge value={p.purpose} /> {p.reference}</span><strong>{naira(p.amount)} <Badge value={p.status} /></strong></div>
            ))}
          </section>
        </div>

        <aside className="panel decision-panel">
          <h2 className="panel-title">Admission decision</h2>
          <div className="kv"><span>Admission form fee</span><strong><Badge value={app.form_paid ? 'verified' : 'pending'}>{app.form_paid ? 'Verified' : 'Not paid'}</Badge></strong></div>
          <div className="kv"><span>Current decision</span><strong><Badge value={app.decision} /></strong></div>
          {app.decided_by && <div className="kv"><span>Decided by</span><strong>{app.decided_by}<small className="cell-sub">{dateTime(app.decided_at)}</small></strong></div>}
          {u && app.decision === 'admitted' && <div className="kv"><span>Student account</span><strong><Badge value={u.status} /></strong></div>}

          {!canDecide ? (
            <p className="field-hint mt">You can view this application but not change the decision.</p>
          ) : (
            <div className="decision-actions">
              {!app.form_paid && app.decision === 'pending' && <div className="alert alert-warn">The admission form fee has not been verified. This application can’t be considered yet.</div>}
              {app.decision !== 'admitted' && (
                <button className="btn btn-primary btn-block" disabled={!app.form_paid} onClick={() => setConfirm('admitted')}>Grant admission</button>
              )}
              {app.decision === 'admitted' && (
                <button className="btn btn-danger btn-block" onClick={() => setConfirm('revoked')}>Revoke admission</button>
              )}
              {app.decision === 'revoked' && <p className="field-hint">Granting again restores access and sends a new activation email.</p>}
            </div>
          )}
        </aside>
      </div>

      {confirm && (
        <Modal
          title={confirm === 'admitted' ? 'Grant admission?' : 'Revoke admission?'}
          onClose={() => setConfirm(null)}
          footer={<>
            <button className="btn btn-outline" onClick={() => setConfirm(null)}>Cancel</button>
            <button className={`btn ${confirm === 'admitted' ? 'btn-primary' : 'btn-danger'}`} disabled={busy} onClick={decide}>{busy ? 'Saving…' : confirm === 'admitted' ? 'Grant admission' : 'Revoke admission'}</button>
          </>}
        >
          <p>{confirm === 'admitted'
            ? `${app.applicant_name} will be admitted into ${app.programme_label}. An email with an activation link will be sent to ${u?.email}. They must activate before they can register courses.`
            : `${app.applicant_name} will lose access to the portal immediately and will be notified by email.`}</p>
          {err && <div className="alert alert-error">{err}</div>}
        </Modal>
      )}
      <Toast message={msg} onDone={() => setMsg('')} />
    </AdminLayout>
  );
}
