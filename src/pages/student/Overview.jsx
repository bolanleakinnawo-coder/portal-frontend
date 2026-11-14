import { Link } from '../../lib/router';
import { useAuth } from '../../context/AuthContext';
import { StudentLayout } from '../../components/StudentLayout';
import { useLoad, Badge } from '../../components/ui';
import { ArrowIcon, BookIcon, CardIcon, CheckIcon, ClockIcon, DocIcon, ShieldIcon } from '../../components/Icons';
import {
  currentSession, feeStatus, getMyApplication, getMyRegistration, hasPaid, naira, programmeById, programmeLabel, settings,
} from '../../api/services';

export default function Overview() {
  const { user } = useAuth();
  const { data } = useLoad(async () => ({
    app: await getMyApplication(user.id),
    reg1: user.role === 'STUDENT' ? await getMyRegistration(user.id, 'first') : null,
  }), [user.id]);

  if (!data) return <StudentLayout><div className="spinner page-spinner" /></StudentLayout>;

  const { app, reg1 } = data;
  const isStudent = user.role === 'STUDENT';
  const formPaid = hasPaid(user.id, 'admission_form');
  const fees = isStudent ? feeStatus(user) : null;
  const active = user.status === 'active';
  const programme = programmeById(user.programme || app?.programme);

  const journey = user.returning
    ? [
        { title: 'Registered for the session', text: 'Your returning-student details were received.', done: true },
        { title: 'Account activated', text: active ? `Matric number ${user.matric_number}` : 'Use the link we emailed you.', done: active },
        { title: `At least ${settings().min_fee_percent}% school fees verified`, text: fees ? `${fees.percent}% verified so far` : '', done: fees?.eligible },
        { title: 'Courses registered', text: reg1 ? reg1.number : 'Choose your courses for the session.', done: !!reg1 },
      ]
    : [
        { title: 'Account created', text: 'Your secure portal account is active.', done: true },
        { title: 'Admission form fee paid', text: formPaid ? 'Payment verified.' : `Pay ${naira(settings().form_fee)} to be considered.`, done: formPaid },
        { title: 'Application submitted', text: app ? app.application_number : 'Choose a programme and submit your details.', done: !!app },
        { title: 'Admission granted', text: app?.decision === 'admitted' ? 'Congratulations on your admission.' : app?.decision === 'revoked' ? 'Admission revoked.' : 'The Admission Officer and Registrar review your application.', done: app?.decision === 'admitted' },
        { title: 'Account activated', text: isStudent && active ? `Matric number ${user.matric_number}` : 'An activation link is emailed after admission.', done: isStudent && active },
        { title: 'Courses registered', text: reg1 ? reg1.number : `Opens after activation and ${settings().min_fee_percent}% verified school fees.`, done: !!reg1 },
      ];

  return (
    <StudentLayout>
      <p className="session">{currentSession()} academic session</p>
      <h1 className="dash-title">Welcome, {user.first_name}.</h1>
      <p className="sub">Here is the latest status of your postgraduate journey.</p>

      <div className="stat-grid">
        {isStudent ? (
          <>
            <section className="panel stat">
              <div className="stat-top"><span className="panel-icon"><ShieldIcon /></span><Badge value={user.status} /></div>
              <p className="panel-label">Matric number</p>
              <p className="stat-value">{user.matric_number || 'Not yet assigned'}</p>
              <p className="stat-foot">{programmeLabel(programme)} · {user.level} level</p>
            </section>
            <section className="panel stat">
              <div className="stat-top"><span className="panel-icon"><CardIcon /></span><span className="tag tag-green">{fees.percent}%</span></div>
              <p className="panel-label">Verified school fees</p>
              <p className="stat-value">{fees.percent}% paid</p>
              <div className="meter"><span style={{ width: `${fees.percent}%` }} /><i style={{ left: `${fees.min}%` }} title={`${fees.min}% minimum`} /></div>
              <p className="stat-foot">{naira(fees.paid)} of {naira(fees.required)}</p>
            </section>
            <section className="panel stat">
              <div className="stat-top"><span className="panel-icon"><BookIcon /></span><Badge value={reg1 ? 'registered' : 'pending'}>{reg1 ? 'Registered' : 'Not registered'}</Badge></div>
              <p className="panel-label">First semester registration</p>
              <p className="stat-value">{reg1 ? `${reg1.total_units} units` : 'Not yet'}</p>
              <p className="stat-foot">{reg1 ? reg1.number : 'Register once the requirements are met'}</p>
            </section>
          </>
        ) : (
          <>
            <section className="panel stat">
              <div className="stat-top"><span className="panel-icon"><CardIcon /></span><Badge value={formPaid ? 'verified' : 'pending'}>{formPaid ? 'Paid' : 'Unpaid'}</Badge></div>
              <p className="panel-label">Admission form fee</p>
              <p className="stat-value">{naira(settings().form_fee)}</p>
              {formPaid ? <p className="stat-foot">Payment verified</p> : <Link to="/dashboard/payments" className="stat-link">Pay now <ArrowIcon /></Link>}
            </section>
            <section className="panel stat">
              <div className="stat-top"><span className="panel-icon"><DocIcon /></span><span className={`tag ${app ? 'tag-amber' : 'tag-grey'}`}>{app ? 'Submitted' : 'Not started'}</span></div>
              <p className="panel-label">Application</p>
              <p className="stat-value">{app ? 'Submitted' : 'Not submitted'}</p>
              {app ? <p className="stat-foot">{app.application_number}</p> : <Link to="/dashboard/application" className="stat-link">Start your application <ArrowIcon /></Link>}
            </section>
            <section className="panel stat">
              <div className="stat-top"><span className="panel-icon"><ShieldIcon /></span><Badge value={app?.decision || 'pending'}>{app ? (app.decision === 'pending' ? 'Under review' : app.decision) : 'Waiting'}</Badge></div>
              <p className="panel-label">Admission status</p>
              <p className="stat-value cap">{app ? (app.decision === 'pending' ? 'Under review' : app.decision) : 'Not started'}</p>
              <p className="stat-foot">Reviewed by the Admission Officer and Registrar</p>
            </section>
          </>
        )}
      </div>

      <div className="lower-grid">
        <section className="panel journey-panel">
          <div className="journey-head">
            <div>
              <h2 className="panel-title">Your journey</h2>
              <p className="panel-label">{programme ? programme.name : 'No programme selected yet'}</p>
            </div>
            <ClockIcon className="muted-icon" />
          </div>
          <ol className="journey">
            {journey.map((j) => (
              <li key={j.title} className={j.done ? 'done' : ''}>
                <span className="dot">{j.done ? <CheckIcon width={18} height={18} /> : <i />}</span>
                <div><strong>{j.title}</strong><p>{j.text}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section className="cta-card">
          <BookIcon className="cta-icon" />
          <h2>Course registration</h2>
          <p>Registration opens after admission, account activation and at least {settings().min_fee_percent}% verified school fee payment.</p>
          <Link to={isStudent ? '/dashboard/courses' : '/dashboard/application'} className="cta-link">{isStudent ? 'Go to courses' : 'Continue application'} <ArrowIcon /></Link>
        </section>
      </div>
    </StudentLayout>
  );
}
