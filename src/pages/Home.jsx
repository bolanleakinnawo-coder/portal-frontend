import { Link } from '../lib/router';
import { PublicHeader } from '../components/PublicHeader';
import { ArrowIcon, CardIcon, CheckIcon, DocIcon, LockIcon, UserIcon } from '../components/Icons';

const STEPS = [
  { title: 'Create your account', text: 'Use a valid email address and secure password to open your applicant profile.' },
  { title: 'Complete application', text: 'Choose a programme and submit your personal and academic information.' },
  { title: 'Track your decision', text: 'Follow eligibility, admission, payment and account activation from one dashboard.' },
  { title: 'Register courses', text: 'After admission and verified fee payment, select courses and print your registration slip.' },
];

const REQUIREMENTS = [
  { icon: DocIcon, title: 'Academic records', text: 'Institution, qualification, and year awarded' },
  { icon: UserIcon, title: 'Personal details', text: 'Legal name, date of birth, and contact information' },
  { icon: CardIcon, title: 'Application fee', text: 'Payment must be verified before review' },
  { icon: LockIcon, title: 'Secure credentials', text: 'A private password for your portal account' },
];

export default function Home() {
  return (
    <div className="public">
      <PublicHeader />

      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="pill"><i /> 2025/2026 Admissions</span>
            <h1>Your postgraduate journey, <span className="accent">all in one place.</span></h1>
            <p className="lead">
              Apply for admission, track your status, manage verified payments, and register courses through one secure portal.
            </p>
            <div className="hero-cta">
              <Link to="/register" className="btn btn-primary btn-lg">Begin your application <ArrowIcon /></Link>
              <Link to="/login" className="btn btn-outline btn-lg">Continue an application</Link>
            </div>
            <ul className="hero-points">
              <li><CheckIcon width={18} height={18} /> Secure applicant account</li>
              <li><CheckIcon width={18} height={18} /> Mobile friendly</li>
              <li><CheckIcon width={18} height={18} /> Real-time status</li>
            </ul>
            <p className="returning-link">Returning student? <Link to="/returning">Register for the session →</Link></p>
          </div>

          <div className="preview-wrap" aria-label="Applicant dashboard preview">
            <span className="preview-deco" />
            <div className="preview-frame">
              <div className="preview-card">
                <div className="preview-top">
                  <div>
                    <p className="overline mint">Applicant dashboard</p>
                    <p className="preview-greet">Good morning, Applicant</p>
                  </div>
                  <span className="preview-avatar"><UserIcon /></span>
                </div>
                <div className="preview-progress">
                  <div className="preview-progress-head">
                    <div>
                      <span className="dim">Application progress</span>
                      <strong>3 of 4 steps</strong>
                    </div>
                    <span className="chip-review">Under review</span>
                  </div>
                  <div className="bar"><span style={{ width: '75%' }} /></div>
                </div>
                <div className="preview-tiles">
                  <div className="tile tile-light"><DocIcon /><span>Application</span><strong>Submitted</strong></div>
                  <div className="tile tile-green"><CardIcon /><span>Payment</span><strong>Verified</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="process" className="band">
        <div className="container">
          <p className="overline">A clear path forward</p>
          <h2 className="h2">From applicant to registered student</h2>
          <p className="sub">Every important step is visible, secure, and easy to complete on any device.</p>
          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div className="step-card" key={s.title}>
                <span className="step-num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="requirements" className="band band-grey">
        <div className="container req-layout">
          <div>
            <p className="overline">Before you begin</p>
            <h2 className="h2">Prepare your application details</h2>
            <p className="sub">Have your academic history and programme choice ready. You can sign back in to track the review process at any time.</p>
          </div>
          <div className="req-grid">
            {REQUIREMENTS.map(({ icon: Icon, title, text }) => (
              <div className="req-card" key={title}>
                <Icon className="req-icon" />
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer id="support" className="pub-footer">
        <div className="container footer-inner">
          <div>
            <p className="footer-title">Bitly University · Postgraduate School</p>
            <p className="footer-sub">Secure admission and course registration services.</p>
          </div>
          <div className="footer-links">
            <a href="mailto:pgsupport@university.edu">pgsupport@university.edu</a>
            <Link to="/admin/login" className="footer-staff">Staff sign-in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
