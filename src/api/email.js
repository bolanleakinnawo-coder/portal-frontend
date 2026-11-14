// Email notifications.
// Every email is recorded in the Email Log (visible to staff, and to students on their own page),
// so activation links work in a demo even without a mail service.
// If EmailJS keys are set in .env, the email is also really sent.
import { load, save, nextId, stamp } from './db';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const TEMPLATE = import.meta.env.VITE_EMAILJS_TEMPLATE;

async function sendWithEmailJS(params) {
  if (!SERVICE_ID || !PUBLIC_KEY || !TEMPLATE) return false;
  try {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_id: SERVICE_ID, template_id: TEMPLATE, user_id: PUBLIC_KEY, template_params: params }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Record an email and send it if EmailJS is set up.
 * EmailJS template variables: {{to_email}}, {{to_name}}, {{subject}}, {{message}}, {{link}}
 */
export function notifyByEmail({ to, name, subject, body, link = '' }) {
  const db = load();
  const entry = { id: nextId(db.emails), to, name, subject, body, link, created_at: stamp(), sent: false };
  db.emails.push(entry);
  save();
  sendWithEmailJS({ to_email: to, to_name: name, subject, message: body, link }).then((ok) => {
    if (ok) {
      entry.sent = true;
      save();
    }
  });
  return entry;
}

export function emailsFor(address) {
  return load().emails.filter((e) => e.to.toLowerCase() === String(address).toLowerCase()).sort((a, b) => b.created_at.localeCompare(a.created_at));
}
