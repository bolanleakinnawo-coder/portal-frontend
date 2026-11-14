# Bitly University — PG School Portal (Frontend)

React + Vite frontend for the Web-Based Admission and Course Registration System.
Green design from the Figma file; covers every role in the project brief.

## Run it (Windows, Mac or Linux)

1. Install **Node.js LTS** from https://nodejs.org (once).
2. Open this folder in VS Code → **Terminal → New Terminal**.
3. `npm install` (once — also installs `xlsx` for Excel uploads)
4. `npm run dev` → open **http://localhost:5173**

PowerShell says "running scripts is disabled"? Run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## Sign in

The sign-in page has a **Demo accounts** box. Password for all: `Demo@1234`.

| Role | Email |
|---|---|
| ICT Administrator | ict@bitly.edu.ng |
| Admission Officer | admissions@bitly.edu.ng |
| Registrar | registrar@bitly.edu.ng |
| PG School Staff (limited permissions) | pgstaff@bitly.edu.ng |
| Applicant (paid, pending decision) | kwame.mensah@demo.com |
| Student (admitted, 76% fees paid) | tolu.adeyemi@demo.com |

New applicants sign up with **Start application** (uses the real backend). Returning students use
**Register for the session**.

## Demo walkthrough (shows every rule in the brief)

1. **Applicant:** sign up → sign in → Application tab → pay the ₦25,000 admission form fee (test card is pre-filled) → submit the application.
2. **Admission Officer** (or Registrar): Applications → open it → **Grant admission**. Grant is disabled while the form fee is unpaid.
3. **Applicant again:** now a Student "awaiting activation" → **Messages** → **Activate my account** → gets a matric number.
4. **Payments:** pay at least **70%** of school fees → **Course registration** unlocks → courses filtered by department, level, semester and session → register → **print the slip**.
5. **Registrar:** revoke an admission → that student can no longer sign in.
6. **ICT Admin:** upload courses from CSV/Excel (preview shows errors and duplicates before import), manage colleges/departments/programmes, fee structure, staff users and PG Staff permissions, email log.
7. **Returning student:** the 14-field form → activation email → activate → pay fees → register.

**Reset demo data** (bottom of the admin sidebar) restores the sample data.

## What talks to the backend

| Part | Where the data lives now |
|---|---|
| Applicant sign-up, sign-in, sign-out, token refresh | **Real backend** (`/api/auth/*`) |
| Everything else (applications, payments, courses, users, emails…) | `src/api/services.js` → saved in the browser (localStorage) |

All pages call functions in `src/api/services.js`. When the backend group adds an endpoint, replace that
function's body with a `request()` call from `src/api/client.js`; pages don't change. Business rules
(form fee before review, 70% rule, activation before registration, revoked = locked out, duplicate checks)
are enforced there and **must also be enforced by the backend**.

Set `VITE_AUTH_MODE=demo` in `.env` to run with no backend at all (e.g. presenting offline).

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
- 2 colleges × 3 departments, 5 programmes, levels 700/800, max 24 units per semester (all editable in the seed in `src/api/db.js`).

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
