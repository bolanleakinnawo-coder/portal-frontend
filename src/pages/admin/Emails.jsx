import { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { useLoad, Table, Badge, PageHead, Modal } from '../../components/ui';
import { dateTime, listEmails } from '../../api/services';

export default function Emails() {
  const { data: rows } = useLoad(listEmails, []);
  const [open, setOpen] = useState(null);
  const [q, setQ] = useState('');
  const shown = rows?.filter((e) => !q || `${e.to} ${e.subject}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <AdminLayout>
      <PageHead title="Email log" sub="Every email the portal sent: activation links, receipts and admission decisions. “Sent” means it was also delivered through the email service." />
      <div className="toolbar"><input className="search" placeholder="Search recipient or subject" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <Table
        rows={shown}
        empty="No emails sent yet."
        onRowClick={setOpen}
        columns={[
          { key: 'to', label: 'To', strong: true },
          { key: 'subject', label: 'Subject' },
          { key: 'link', label: 'Activation link', render: (e) => (e.link ? 'Yes' : '') },
          { key: 'sent', label: 'Delivery', render: (e) => <Badge value={e.sent ? 'sent' : 'logged'}>{e.sent ? 'Sent' : 'Logged only'}</Badge> },
          { key: 'created_at', label: 'Date', render: (e) => dateTime(e.created_at) },
        ]}
      />
      {open && (
        <Modal title={open.subject} onClose={() => setOpen(null)}>
          <p className="muted small">To {open.to} · {dateTime(open.created_at)}</p>
          <p>Hi {open.name},</p>
          <p>{open.body}</p>
          {open.link && <p className="break"><a href={open.link}>{open.link}</a></p>}
        </Modal>
      )}
    </AdminLayout>
  );
}
