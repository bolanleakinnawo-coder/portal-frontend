# Bitly University — PG School Portal (Frontend)

React + Vite frontend for the Web-Based Admission and Course Registration System.
Green design from the Figma file; covers every role in the project brief.

## Run it (Windows, Mac or Linux)

1. Install **Node.js LTS** from https://nodejs.org (once).
2. Open this folder in VS Code → **Terminal → New Terminal**.
3. `npm install` (once — also installs `xlsx` for Excel uploads)
4. `npm run dev` → open **http://localhost:5173**

PowerShell says "running scripts is disabled"? Run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## Sign-in pages

| Who | Sign-in page | After sign-in |
|---|---|---|
| Applicants and students | `/login` | `/dashboard` |
| ICT Admin, Admission Officer, Registrar, PG School Staff | `/admin/login` (**Staff sign-in**, linked in the footer and under the student sign-in) | `/admin` |

Each page only accepts its own kind of account: a staff account is turned away from `/login` and a student
account from `/admin/login`. Opening any `/admin` page while signed out goes to the staff sign-in.
There is no staff sign-up; staff accounts are created by ICT / the backend.

## Accounts and roles

- **Applicants** sign up on the portal (**Start application**) — this creates their account on the backend.
- **Returning students** use **Register for the session** — also creates a backend account, then an activation email is sent.
- **Staff** (ICT Administrator, Admission Officer, Registrar, PG School Staff) sign in with accounts the
  backend team creates with that role. The role comes from `/api/auth/login/`. The ICT Administrator can
  also give a staff role to an email on **Users & permissions**, and choose what each PG School Staff member can do.
- The portal starts with no applicants, students or payments — only the academic setup
  (colleges, departments, programmes, fees, courses), which the ICT Administrator can edit.

## The flow

1. **Applicant:** sign up → sign in → pay the admission form fee → submit the application.
2. **Admission Officer / Registrar:** Applications → open → **Grant admission** (disabled until the form fee is verified) or **Revoke**.
3. **Admitted student:** activation email → activate → matric number assigned.
4. **School fees:** at least **70%** verified → **Course registration** unlocks → courses by department, level, semester and session → **printable slip**.
5. **Revoked students** can no longer sign in.
6. **ICT Admin:** CSV/Excel course upload with validation and duplicate checks, colleges/departments/programmes, fee structure, users & permissions, email log.

## What talks to the backend

| Part | Where the data lives now |
|---|---|
| Sign-up, sign-in, sign-out, roles, token refresh (all users) | **Backend** (`/api/auth/*`) |
| Applications, payments, courses, registrations, permissions, emails | `src/api/services.js` (browser storage until the backend adds these endpoints) |

All pages call functions in `src/api/services.js`. When the backend group adds an endpoint, replace that
function's body with a `request()` call from `src/api/client.js`; pages don't change. Business rules
(form fee before review, 70% rule, activation before registration, revoked = locked out, duplicate checks)
are enforced there and **must also be enforced by the backend**.

**Payments:** the card form records the payment as verified. For live use, the backend must confirm each
payment with the gateway (e.g. Korapay/Paystack webhook) before marking it verified.

## Email notifications

Every email (activation links, receipts, admission decisions) is saved in the **Email Log** (staff) and
the student's **Messages** tab. To also really send them, create an EmailJS template with
`{{to_email}} {{to_name}} {{subject}} {{message}} {{link}}` and fill the `VITE_EMAILJS_*` values in `.env`.

## Assumptions (from the SRS review)

- ICT Officer = ICT Administrator (one role).
- Both the Admission Officer and the Registrar can grant or revoke admission.
- The 70% rule applies to course registration for the whole session.
- Activation is required before course registration (applicants can sign in to apply before admission).
- PG School Staff get only the permissions the ICT Admin ticks for them.
- Initial setup: 2 colleges × 3 departments, 5 programmes, levels 700/800, max 24 units per semester (editable by the ICT Admin; starting values in `src/api/db.js`).

## Folder map

```
src/api/        client.js (fetch + JWT refresh) · auth.js · services.js (all features) · db.js (seed + storage) · email.js
src/config/     roles.js (roles, permissions, admin menu)
src/pages/      Home, Login, Register, Returning, Activate
src/pages/student/  Overview, Application, Payments, Courses, Slip, Messages
src/pages/admin/    Dashboard, Applications, ApplicationDetail, Students, Payments, Fees,
                    Courses (CSV/Excel upload), Registrations, Academics, Users, Emails
src/components/ AdminLayout, StudentLayout, PaymentModal, ui.jsx (table, modal, badge…)
```
