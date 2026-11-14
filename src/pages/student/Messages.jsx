import { useAuth } from '../../context/AuthContext';
import { StudentLayout } from '../../components/StudentLayout';
import { useLoad } from '../../components/ui';
import { MailIcon } from '../../components/Icons';
import { emailsFor } from '../../api/email';
import { dateTime } from '../../api/services';

/** Copies of every email the portal sent this user (activation links, receipts, decisions). */
export default function Messages() {
  const { user } = useAuth();
  const { data: emails } = useLoad(async () => emailsFor(user.email), [user.email]);

  return (
    <StudentLayout>
      <h1 className="dash-title">Messages</h1>
      <p className="sub">A copy of every email the portal sent to {user.email}.</p>
      <div className="inbox">
        {emails?.length === 0 && <div className="panel muted-panel">No messages yet.</div>}
        {emails?.map((m) => (
          <article key={m.id} className="mail">
            <span className="panel-icon"><MailIcon /></span>
            <div className="mail-body">
              <div className="mail-top"><strong>{m.subject}</strong><span>{dateTime(m.created_at)}</span></div>
              <p>{m.body.replace(m.link, '').trim()}</p>
              {m.link && <a href={m.link} className="btn btn-primary btn-sm">Activate my account</a>}
            </div>
          </article>
        ))}
      </div>
    </StudentLayout>
  );
}
