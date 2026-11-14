import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { useLoad, PageHead, Field, Toast } from '../../components/ui';
import { listFees, naira, saveFee, saveSettings, settings } from '../../api/services';

export default function Fees() {
  const { data: fees, reload } = useLoad(listFees, []);
  const [s, setS] = useState({ form_fee: '', min_fee_percent: '' });
  const [edits, setEdits] = useState({});
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => { const cur = settings(); setS({ form_fee: cur.form_fee, min_fee_percent: cur.min_fee_percent }); }, []);

  async function saveRules(e) {
    e.preventDefault();
    setErr('');
    try { await saveSettings(s); setMsg('Fee rules saved.'); } catch (x) { setErr(x.message); }
  }
  async function saveRow(f) {
    try { await saveFee(f.id, edits[f.id]); setEdits((x) => { const n = { ...x }; delete n[f.id]; return n; }); setMsg('School fee updated.'); reload(); } catch (x) { setErr(x.message); }
  }

  const byProgramme = (fees || []).reduce((m, f) => ({ ...m, [f.programme_label]: [...(m[f.programme_label] || []), f] }), {});

  return (
    <AdminLayout>
      <PageHead title="Fee structure" sub="The admission form fee, the minimum school-fee percentage for registration, and the school fee for each programme and level." />
      <form className="panel form-narrow" onSubmit={saveRules}>
        <h2 className="panel-title">Rules</h2>
        <div className="two-col">
          <Field id="form_fee" label="Admission form fee (₦)" hint="Must be verified before an application is considered."><input id="form_fee" type="number" value={s.form_fee} onChange={(e) => setS({ ...s, form_fee: e.target.value })} /></Field>
          <Field id="min_pct" label="Minimum school fees for registration (%)" hint="Applies to course registration for the session."><input id="min_pct" type="number" min="1" max="100" value={s.min_fee_percent} onChange={(e) => setS({ ...s, min_fee_percent: e.target.value })} /></Field>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        <button className="btn btn-primary">Save rules</button>
      </form>

      <h2 className="section-title">School fees per programme and level</h2>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Programme</th><th>Level</th><th className="right">School fee</th><th /></tr></thead>
          <tbody>
            {Object.entries(byProgramme).map(([label, rows]) => rows.map((f, i) => (
              <tr key={f.id}>
                <td className="strong">{i === 0 ? label : ''}</td>
                <td>{f.level}</td>
                <td className="right">
                  <input className="inline-input" type="number" value={edits[f.id] ?? f.amount} onChange={(e) => setEdits({ ...edits, [f.id]: e.target.value })} aria-label={`School fee for ${label} ${f.level}`} />
                  <small className="cell-sub">{naira(edits[f.id] ?? f.amount)}</small>
                </td>
                <td className="right">{edits[f.id] !== undefined && Number(edits[f.id]) !== f.amount && <button className="btn btn-sm btn-primary" onClick={() => saveRow(f)}>Save</button>}</td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
      <Toast message={msg} onDone={() => setMsg('')} />
    </AdminLayout>
  );
}
