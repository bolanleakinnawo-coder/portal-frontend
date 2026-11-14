import { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { useLoad, Table, Badge, PageHead, Modal, Field, Toast } from '../../components/ui';
import { UploadIcon } from '../../components/Icons';
import { LEVELS, SEMESTERS, currentSession, deleteItem, getLookups, importCourses, listCourses, previewCourseImport, saveCourse } from '../../api/services';
import { readCourseFile, SAMPLE_CSV } from '../../lib/sheet';

const EMPTY = { code: '', title: '', units: 3, department: '', level: '700', semester: 'first', session: '' };

export default function Courses() {
  const { data: lookups } = useLoad(getLookups, []);
  const [f, setF] = useState({ search: '', department: '', level: '', semester: '', session: currentSession() });
  const { data: rows, reload } = useLoad(() => listCourses(f), [f.search, f.department, f.level, f.semester, f.session]);
  const [edit, setEdit] = useState(null);
  const [upload, setUpload] = useState(false);
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  return (
    <AdminLayout>
      <PageHead
        title="Courses"
        sub="Courses are listed by department, level, semester and session. Add them one by one or upload a CSV or Excel file."
        actions={<>
          <button className="btn btn-outline" onClick={() => setUpload(true)}><UploadIcon width={18} height={18} /> Upload CSV / Excel</button>
          <button className="btn btn-primary" onClick={() => setEdit({ ...EMPTY, session: currentSession() })}>Add course</button>
        </>}
      />
      <div className="toolbar">
        <input className="search" placeholder="Search code or title" value={f.search} onChange={set('search')} />
        <select value={f.department} onChange={set('department')}><option value="">All departments</option>{lookups?.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
        <select value={f.level} onChange={set('level')}><option value="">All levels</option>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select>
        <select value={f.semester} onChange={set('semester')}><option value="">Both semesters</option>{SEMESTERS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
        <select value={f.session} onChange={set('session')}><option value="">All sessions</option>{lookups?.sessions.map((s) => <option key={s.id}>{s.name}</option>)}</select>
      </div>
      <Table
        rows={rows}
        empty="No courses for these filters."
        onRowClick={(c) => setEdit(c)}
        columns={[
          { key: 'code', label: 'Code', strong: true },
          { key: 'title', label: 'Title' },
          { key: 'department_name', label: 'Department' },
          { key: 'level', label: 'Level' },
          { key: 'semester', label: 'Semester', render: (c) => <span className="cap">{c.semester}</span> },
          { key: 'units', label: 'Units', right: true },
          { key: 'session', label: 'Session' },
        ]}
      />
      {edit && <CourseForm course={edit} lookups={lookups} onClose={() => setEdit(null)} onSaved={(m) => { setEdit(null); setMsg(m); reload(); }} />}
      {upload && <UploadModal onClose={() => setUpload(false)} onDone={(m) => { setUpload(false); setMsg(m); reload(); }} />}
      <Toast message={msg} onDone={() => setMsg('')} />
    </AdminLayout>
  );
}

function CourseForm({ course, lookups, onClose, onSaved }) {
  const [form, setForm] = useState({ ...course, department: String(course.department || '') });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function save() {
    setErr('');
    try { await saveCourse(form, course.id); onSaved(course.id ? 'Course updated.' : 'Course added.'); } catch (e) { setErr(e.message); }
  }
  async function remove() {
    if (!window.confirm(`Delete ${course.code}?`)) return;
    await deleteItem('courses', course.id);
    onSaved('Course deleted.');
  }

  return (
    <Modal title={course.id ? `Edit ${course.code}` : 'Add course'} onClose={onClose}
      footer={<>{course.id && <button className="btn btn-danger-text" onClick={remove}>Delete</button>}<span className="spacer" /><button className="btn btn-outline" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></>}>
      <div className="two-col">
        <Field id="c-code" label="Course code"><input id="c-code" value={form.code} onChange={set('code')} placeholder="CSC 711" /></Field>
        <Field id="c-units" label="Units"><input id="c-units" type="number" min="1" max="6" value={form.units} onChange={set('units')} /></Field>
      </div>
      <Field id="c-title" label="Title"><input id="c-title" value={form.title} onChange={set('title')} /></Field>
      <Field id="c-dept" label="Department">
        <select id="c-dept" value={form.department} onChange={set('department')}><option value="">Select department</option>{lookups?.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
      </Field>
      <div className="three-col">
        <Field id="c-level" label="Level"><select id="c-level" value={form.level} onChange={set('level')}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></Field>
        <Field id="c-sem" label="Semester"><select id="c-sem" value={form.semester} onChange={set('semester')}>{SEMESTERS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></Field>
        <Field id="c-session" label="Session"><select id="c-session" value={form.session} onChange={set('session')}>{lookups?.sessions.map((s) => <option key={s.id}>{s.name}</option>)}</select></Field>
      </div>
      {err && <div className="alert alert-error">{err}</div>}
    </Modal>
  );
}

function UploadModal({ onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [err, setErr] = useState('');
  const [updateExisting, setUpdateExisting] = useState(false);
  const [busy, setBusy] = useState(false);

  async function pick(e) {
    const fl = e.target.files?.[0];
    setErr(''); setPreview(null); setFile(fl || null);
    if (!fl) return;
    try {
      const { rows, missing } = await readCourseFile(fl);
      if (missing.length) { setErr(`The file is missing these columns: ${missing.join(', ')}. Download the template to see the format.`); return; }
      setPreview(previewCourseImport(rows));
    } catch (x) {
      setErr(x.message.includes('xlsx') ? 'Excel support needs the "xlsx" package. Run npm install, or save the sheet as CSV.' : x.message);
    }
  }

  async function run() {
    setBusy(true);
    const r = await importCourses(preview, { updateExisting });
    setBusy(false);
    onDone(`Import finished: ${r.added} added, ${r.updated} updated, ${r.skipped} skipped.`);
  }

  const count = (s) => preview?.filter((r) => r.state === s).length || 0;
  const template = `data:text/csv;charset=utf-8,${encodeURIComponent(SAMPLE_CSV)}`;

  return (
    <Modal wide title="Upload courses" onClose={onClose}
      footer={<><a className="btn btn-text" href={template} download="course-template.csv">Download template</a><span className="spacer" /><button className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={!preview || busy || count('new') + (updateExisting ? count('exists') : 0) === 0} onClick={run}>{busy ? 'Importing…' : `Import ${count('new') + (updateExisting ? count('exists') : 0)} courses`}</button></>}>
      <p className="muted">Columns: <code>code, title, units, department, level, semester, session</code>. Department is the code (e.g. CSC). Session is optional and defaults to {currentSession()}.</p>
      <label className="dropzone">
        <UploadIcon />
        <span>{file ? file.name : 'Choose a .csv, .xlsx or .xls file'}</span>
        <input type="file" accept=".csv,.xlsx,.xls" onChange={pick} />
      </label>
      {err && <div className="alert alert-error">{err}</div>}
      {preview && (
        <>
          <div className="import-summary">
            <Badge value="verified">{count('new')} new</Badge>
            <Badge value="exists">{count('exists')} already exist</Badge>
            <Badge value="invalid">{count('invalid')} with errors</Badge>
            {count('exists') > 0 && <label className="check"><input type="checkbox" checked={updateExisting} onChange={(e) => setUpdateExisting(e.target.checked)} /> Update existing courses instead of skipping them</label>}
          </div>
          <div className="table-wrap preview-table">
            <table className="table">
              <thead><tr><th>Row</th><th>Code</th><th>Title</th><th>Units</th><th>Dept</th><th>Level</th><th>Semester</th><th>Result</th></tr></thead>
              <tbody>
                {preview.map((r) => (
                  <tr key={r.line} className={r.state === 'invalid' ? 'row-bad' : ''}>
                    <td>{r.line}</td><td>{r.raw.code}</td><td>{r.raw.title}</td><td>{r.raw.units}</td><td>{r.raw.department}</td><td>{r.raw.level}</td><td>{r.raw.semester}</td>
                    <td>{r.state === 'invalid' ? <span className="err-text">{r.errors.join('; ')}</span> : <Badge value={r.state === 'new' ? 'verified' : 'exists'}>{r.state === 'new' ? 'New' : 'Already exists'}</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Modal>
  );
}
