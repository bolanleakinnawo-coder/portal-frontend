// Small shared building blocks used across student and admin pages.
import { useCallback, useEffect, useState } from 'react';

/** Load data from a service function; re-runs when deps change. */
export function useLoad(fn, deps = []) {
  const [data, setData] = useState(undefined);
  const [error, setError] = useState('');
  const reload = useCallback(() => {
    setError('');
    return fn().then(setData).catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { reload(); }, [reload]);
  return { data, error, reload, loading: data === undefined && !error };
}

export function Field({ id, label, error, hint, children, required }) {
  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}{required && <span className="req"> *</span>}</label>}
      {children}
      {error ? <div className="field-error" role="alert">{error}</div> : hint ? <div className="field-hint">{hint}</div> : null}
    </div>
  );
}

const TONES = {
  good: ['active', 'admitted', 'verified', 'registered', 'yes', 'sent'],
  warn: ['pending', 'pending_activation', 'submitted', 'logged'],
  bad: ['revoked', 'failed', 'suspended', 'rejected', 'no', 'invalid'],
  info: ['exists'],
};
const LABELS = { pending_activation: 'Awaiting activation', admission_form: 'Admission form', school_fees: 'School fees', exists: 'Already exists', new: 'New' };

export function Badge({ value, children }) {
  const v = String(value ?? '');
  const tone = Object.keys(TONES).find((t) => TONES[t].includes(v)) || 'neutral';
  return <span className={`badge badge-${tone}`}>{children || LABELS[v] || v.replace(/_/g, ' ')}</span>;
}

export function Modal({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Table({ columns, rows, onRowClick, empty = 'Nothing here yet.' }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>{columns.map((c) => <th key={c.key} className={c.right ? 'right' : ''}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows === undefined ? (
            <tr><td colSpan={columns.length} className="empty"><span className="spinner small" /></td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="empty">{empty}</td></tr>
          ) : (
            rows.map((r, i) => (
              <tr key={r.id ?? i} className={onRowClick ? 'clickable' : ''} onClick={() => onRowClick?.(r)}>
                {columns.map((c) => (
                  <td key={c.key} data-label={c.label} className={`${c.strong ? 'strong' : ''} ${c.right ? 'right' : ''}`}>
                    {c.render ? c.render(r) : (r[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function PageHead({ eyebrow, title, sub, actions }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <p className="session">{eyebrow}</p>}
        <h1 className="dash-title">{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return undefined;
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [message, onDone]);
  return message ? <div className="toast" role="status">{message}</div> : null;
}

export function Select({ id, value, onChange, options, placeholder, invalid, disabled }) {
  return (
    <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={invalid ? 'invalid' : ''} disabled={disabled}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
