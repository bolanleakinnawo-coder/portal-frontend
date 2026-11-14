import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminLayout } from '../../components/AdminLayout';
import { useLoad, Table, Badge, PageHead, Modal, Field, Toast } from '../../components/ui';
import { fullName, listUsers, saveStaffUser, setUserStatus, shortDate } from '../../api/services';
import { PERMISSIONS, ROLE_LABELS, STAFF_ROLES, permissionsFor } from '../../config/roles';

const EMPTY = { surname: '', first_name: '', email: '', phone: '', role: 'PG_STAFF', password: '', permissions: ['applications.view'] };

export default function Users() {
  const { user: me } = useAuth();
  const [f, setF] = useState({ search: '', role: '', status: '' });
  const { data: rows, reload } = useLoad(() => listUsers(f), [f.search, f.role, f.status]);
  const [edit, setEdit] = useState(null);
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function toggle(u) {
    const next = u.status === 'suspended' ? 'active' : 'suspended';
    if (!window.confirm(`${next === 'suspended' ? 'Suspend' : 'Reactivate'} ${fullName(u)}?`)) return;
    await setUserStatus(u.id, next);
    setMsg(`${fullName(u)} ${next === 'suspended' ? 'suspended' : 'reactivated'}.`);
    reload();
  }

  return (
    <AdminLayout>
      <PageHead title="Users & permissions" sub="Create staff accounts, change roles, and choose exactly what each PG School Staff member can do." actions={<button className="btn btn-primary" onClick={() => setEdit({ ...EMPTY })}>Add staff user</button>} />
      <div className="toolbar">
        <input className="search" placeholder="Search name, email or matric number" value={f.search} onChange={set('search')} />
        <select value={f.role} onChange={set('role')}><option value="">All roles</option>{Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select value={f.status} onChange={set('status')}><option value="">All statuses</option><option value="active">Active</option><option value="pending_activation">Awaiting activation</option><option value="suspended">Suspended</option><option value="revoked">Revoked</option></select>
      </div>
      <Table
        rows={rows}
        columns={[
          { key: 'name', label: 'Name', strong: true, render: (u) => <span>{fullName(u)}<small className="cell-sub">{u.email}</small></span> },
          { key: 'role', label: 'Role', render: (u) => ROLE_LABELS[u.role] },
          { key: 'perms', label: 'Permissions', render: (u) => (STAFF_ROLES.includes(u.role) ? `${permissionsFor(u).length} of ${PERMISSIONS.length}` : '—') },
          { key: 'status', label: 'Status', render: (u) => <Badge value={u.status} /> },
          { key: 'created_at', label: 'Created', render: (u) => shortDate(u.created_at) },
          { key: 'act', label: '', render: (u) => (
            <span className="row-actions">
              {STAFF_ROLES.includes(u.role) && <button className="btn btn-sm btn-outline" onClick={() => setEdit({ ...u, password: '' })}>Edit</button>}
              {u.id !== me.id && ['active', 'suspended'].includes(u.status) && <button className="btn btn-sm btn-outline" onClick={() => toggle(u)}>{u.status === 'suspended' ? 'Reactivate' : 'Suspend'}</button>}
            </span>
          ) },
        ]}
      />
      {edit && <UserForm item={edit} isSelf={edit.id === me.id} onClose={() => setEdit(null)} onSaved={(m) => { setEdit(null); setMsg(m); reload(); }} />}
      <Toast message={msg} onDone={() => setMsg('')} />
    </AdminLayout>
  );
}

function UserForm({ item, isSelf, onClose, onSaved }) {
  const [form, setForm] = useState({ ...item, permissions: item.permissions || [] });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const togglePerm = (k) => setForm((x) => ({ ...x, permissions: x.permissions.includes(k) ? x.permissions.filter((p) => p !== k) : [...x.permissions, k] }));
  const fixed = form.role !== 'PG_STAFF' ? permissionsFor({ role: form.role }) : null;

  async function save() {
    setErr('');
    const data = { surname: form.surname.trim(), first_name: form.first_name.trim(), email: form.email.trim(), phone: form.phone || '', role: form.role, password: form.password, permissions: form.permissions };
    try { await saveStaffUser(data, item.id); onSaved(item.id ? 'User updated.' : 'Staff user created. A welcome email was sent.'); } catch (e) { setErr(e.message); }
  }

  return (
    <Modal title={item.id ? `Edit ${item.first_name} ${item.surname}` : 'Add staff user'} onClose={onClose}
      footer={<><button className="btn btn-outline" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></>}>
      <div className="two-col">
        <Field id="u-sur" label="Surname"><input id="u-sur" value={form.surname} onChange={set('surname')} /></Field>
        <Field id="u-first" label="First name"><input id="u-first" value={form.first_name} onChange={set('first_name')} /></Field>
      </div>
      <Field id="u-email" label="Email"><input id="u-email" type="email" value={form.email} onChange={set('email')} placeholder="name@bitly.edu.ng" /></Field>
      <div className="two-col">
        <Field id="u-role" label="Role">
          <select id="u-role" value={form.role} onChange={set('role')} disabled={isSelf}>{STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select>
        </Field>
        <Field id="u-pass" label={item.id ? 'New password' : 'Temporary password'} hint={item.id ? 'Leave empty to keep the current one.' : 'At least 8 characters.'}>
          <input id="u-pass" type="text" value={form.password} onChange={set('password')} autoComplete="off" />
        </Field>
      </div>
      <div className="field">
        <label>Permissions</label>
        {fixed && <p className="field-hint">{ROLE_LABELS[form.role]} has a fixed set of permissions. Choose “PG School Staff” to assign permissions one by one.</p>}
        <div className="perm-grid">
          {PERMISSIONS.map((p) => (
            <label key={p.key} className={`check perm ${fixed ? 'fixed' : ''}`}>
              <input type="checkbox" checked={fixed ? fixed.includes(p.key) : form.permissions.includes(p.key)} disabled={!!fixed} onChange={() => togglePerm(p.key)} />
              {p.label}
            </label>
          ))}
        </div>
      </div>
      {err && <div className="alert alert-error">{err}</div>}
    </Modal>
  );
}
