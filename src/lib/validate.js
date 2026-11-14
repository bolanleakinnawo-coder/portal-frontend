// Form checks shown under each field. Each returns an error message or ''.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const rules = {
  full_name(v) {
    const parts = v.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'Enter your full legal name.';
    if (parts.length < 2) return 'Enter both your first name and last name.';
    if (parts.some((p) => p.length < 2)) return 'Each name must be at least 2 letters.';
    if (!/^[\p{L}' -]+$/u.test(v.trim())) return 'Use letters only (hyphens and apostrophes are allowed).';
    return '';
  },
  email(v) {
    if (!v.trim()) return 'Enter your email address.';
    if (!EMAIL_RE.test(v.trim())) return 'Enter a valid email address, e.g. you@example.com.';
    return '';
  },
  password(v) {
    if (!v) return 'Enter a password.';
    if (v.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return 'Use at least one letter and one number.';
    return '';
  },
  confirm_password(v, form) {
    if (!v) return 'Confirm your password.';
    if (v !== form.password) return 'Passwords do not match.';
    return '';
  },
  login_password(v) {
    return v ? '' : 'Enter your password.';
  },
};

/** Run the listed rules; returns { field: message } for fields that fail. */
export function validate(form, fields) {
  const errors = {};
  fields.forEach(([field, rule]) => {
    const msg = rules[rule || field](form[field] || '', form);
    if (msg) errors[field] = msg;
  });
  return errors;
}

/** Turn Django REST Framework errors into friendly messages per field. */
export function backendErrors(data) {
  if (!data || typeof data !== 'object') return {};
  const out = {};
  const text = (v) => [].concat(v).join(' ');
  if (data.email) {
    const t = text(data.email);
    out.email = /exist|taken|already|unique/i.test(t) ? 'This email is already registered. Sign in instead.' : t;
  }
  if (data.first_name || data.last_name) out.full_name = text([...[].concat(data.first_name || []), ...[].concat(data.last_name || [])]);
  if (data.password) out.password = text(data.password);
  if (data.confirm_password) out.confirm_password = text(data.confirm_password);
  if (data.non_field_errors) out.form = text(data.non_field_errors);
  if (data.detail) out.form = text(data.detail);
  return out;
}
