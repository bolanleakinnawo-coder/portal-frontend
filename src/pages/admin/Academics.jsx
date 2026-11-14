import { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { useLoad, Table, Badge, PageHead, Modal, Field, Toast } from '../../components/ui';
import { deleteItem, getLookups, saveCollege, saveDepartment, saveProgramme } from '../../api/services';

const TABS = [
  { key: 'colleges', label: 'Colleges' },
  { key: 'departments', label: 'Departments' },
  { key: 'programmes', label: 'Programmes' },
];

export default function Academics() {
  const { data: lk, reload } = useLoad(getLookups, []);
  const [tab, setTab] = useState('colleges');
  const [edit, setEdit] = useState(null);
  const [msg, setMsg] = useState('');

  const college = (id) => lk?.colleges.find((c) => c.id === id);
  const dept = (id) => lk?.departments.find((d) => d.id === id);

  const config = {
    colleges: {
      rows: lk?.colleges.map((c) => ({ ...c, count: lk.departments.filter((d) => d.college === c.id).length })),
      columns: [{ key: 'code', label: 'Code', strong: true }, { key: 'name', label: 'Name' }, { key: 'count', label: 'Departments', right: true }],
      empty: { code: '', name: '' },
      fields: [{ k: 'code', label: 'Code', ph: 'COLCIS' }, { k: 'name', label: 'Name', ph: 'College of Computing and Information Sciences' }],
      save: saveCollege,
    },
    departments: {
      rows: lk?.departments.map((d) => ({ ...d, college_name: college(d.college)?.code, count: lk.programmes.filter((p) => p.department === d.id).length })),
      columns: [{ key: 'code', label: 'Code', strong: true }, { key: 'name', label: 'Name' }, { key: 'college_name', label: 'College' }, { key: 'count', label: 'Programmes', right: true }],
      empty: { code: '', name: '', college: '' },
      fields: [{ k: 'code', label: 'Code', ph: 'CSC' }, { k: 'name', label: 'Name', ph: 'Computer Science' }, { k: 'college', label: 'College', options: lk?.colleges.map((c) => ({ value: c.id, label: c.name })) }],
      save: saveDepartment,
    },
    programmes: {
      rows: lk?.programmes.map((p) => ({ ...p, dept_name: dept(p.department)?.name })),
      columns: [{ key: 'code', label: 'Code', strong: true }, { key: 'name', label: 'Name' }, { key: 'degree', label: 'Degree' }, { key: 'dept_name', label: 'Department' }, { key: 'active', label: 'Status', render: (p) => <Badge value={p.active ? 'active' : 'suspended'}>{p.active ? 'Open' : 'Closed'}</Badge> }],
      empty: { code: '', name: '', degree: 'M.Sc.', department: '', active: true },
      fields: [{ k: 'code', label: 'Code', ph: '700' }, { k: 'name', label: 'Name', ph: 'Computer Science' }, { k: 'degree', label: 'Degree', options: ['PGD', 'M.Sc.', 'M.Phil.', 'Ph.D.'].map((d) => ({ value: d, label: d })) }, { k: 'department', label: 'Department', options: lk?.departments.map((d) => ({ value: d.id, label: d.name })) }, { k: 'active', label: 'Open for applications', check: true }],
      save: saveProgramme,
    },
  }[tab];

  return (
    <AdminLayout>
      <PageHead title="Colleges & programmes" sub="Colleges contain departments, and departments offer programmes. Applicants only see programmes that are open." actions={<button className="btn btn-primary" onClick={() => setEdit({ ...config.empty })}>Add {tab.slice(0, -1)}</button>} />
      <div className="seg-tabs">
        {TABS.map((t) => <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>
      <Table rows={config.rows} columns={config.columns} onRowClick={(r) => setEdit(r)} />
      {edit && <EditModal tab={tab} config={config} item={edit} onClose={() => setEdit(null)} onSaved={(m) => { setEdit(null); setMsg(m); reload(); }} />}
      <Toast message={msg} onDone={() => setMsg('')} />
    </AdminLayout>
  );
}

function EditModal({ tab, config, item, onClose, onSaved }) {
  const [form, setForm] = useState(item);
  const [err, setErr] = useState('');
  const noun = tab.slice(0, -1);

  async function save() {
    setErr('');
    const data = Object.fromEntries(config.fields.map((f) => [f.k, form[f.k]]));
    try { await config.save(data, item.id); onSaved(`${noun[0].toUpperCase() + noun.slice(1)} saved.`); } catch (e) { setErr(e.message); }
  }
  async function remove() {
    if (!window.confirm(`Delete this ${noun}?`)) return;
    try { await deleteItem(tab, item.id); onSaved(`${noun[0].toUpperCase() + noun.slice(1)} deleted.`); } catch (e) { setErr(e.message); }
  }

  return (
    <Modal title={item.id ? `Edit ${noun}` : `Add ${noun}`} onClose={onClose}
      footer={<>{item.id && <button className="btn btn-danger-text" onClick={remove}>Delete</button>}<span className="spacer" /><button className="btn btn-outline" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></>}>
      {config.fields.map((f) => f.check ? (
        <label key={f.k} className="check field"><input type="checkbox" checked={!!form[f.k]} onChange={(e) => setForm({ ...form, [f.k]: e.target.checked })} /> {f.label}</label>
      ) : (
        <Field key={f.k} id={`a-${f.k}`} label={f.label}>
          {f.options ? (
            <select id={`a-${f.k}`} value={form[f.k] ?? ''} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}>
              <option value="">Select</option>{f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <input id={`a-${f.k}`} value={form[f.k] ?? ''} placeholder={f.ph} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} />
          )}
        </Field>
      ))}
      {err && <div className="alert alert-error">{err}</div>}
    </Modal>
  );
}
