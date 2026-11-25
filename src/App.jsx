import { Link, Redirect, matchPath, useRouter } from './lib/router';
import { useAuth } from './context/AuthContext';
import { can, homeFor, isStaff } from './config/roles';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Returning from './pages/Returning';
import Activate from './pages/Activate';

import Overview from './pages/student/Overview';
import Application from './pages/student/Application';
import StudentPayments from './pages/student/Payments';
import StudentCourses from './pages/student/Courses';
import Messages from './pages/student/Messages';
import Slip from './pages/student/Slip';

import Dashboard from './pages/admin/Dashboard';
import Applications from './pages/admin/Applications';
import ApplicationDetail from './pages/admin/ApplicationDetail';
import Students from './pages/admin/Students';
import AdminPayments from './pages/admin/Payments';
import Fees from './pages/admin/Fees';
import AdminCourses from './pages/admin/Courses';
import Registrations from './pages/admin/Registrations';
import Academics from './pages/admin/Academics';
import Users from './pages/admin/Users';
import Emails from './pages/admin/Emails';

const STUDENT_PAGES = {
  '/dashboard': Overview,
  '/dashboard/application': Application,
  '/dashboard/payments': StudentPayments,
  '/dashboard/courses': StudentCourses,
  '/dashboard/messages': Messages,
};

const ADMIN_PAGES = {
  '/admin': [Dashboard, null],
  '/admin/applications': [Applications, 'applications.view'],
  '/admin/students': [Students, 'students.view'],
  '/admin/payments': [AdminPayments, 'payments.view'],
  '/admin/fees': [Fees, 'fees.manage'],
  '/admin/courses': [AdminCourses, 'courses.manage'],
  '/admin/registrations': [Registrations, 'registrations.view'],
  '/admin/academics': [Academics, 'academics.manage'],
  '/admin/users': [Users, 'users.manage'],
  '/admin/emails': [Emails, 'emails.view'],
};

function Loading() {
  return <div className="center-screen"><div className="spinner" /></div>;
}

function NoAccess() {
  return (
    <div className="center-screen">
      <h1>You don’t have access to this page</h1>
      <p className="muted">Ask the ICT Administrator to assign the permission to your account.</p>
      <Link to="/admin" className="btn btn-primary">Back to dashboard</Link>
    </div>
  );
}

export default function App() {
  const { path } = useRouter();
  const { user, loading } = useAuth();

  if (path === '/') return <Home />;
  if (path === '/activate') return <Activate />;
  if (loading) return <Loading />;

  if (['/login', '/admin/login', '/register', '/returning'].includes(path)) {
    if (user) return <Redirect to={homeFor(user)} />;
    if (path === '/admin/login') return <Login staff />;
    return path === '/login' ? <Login /> : path === '/register' ? <Register /> : <Returning />;
  }

  // Not signed in: staff pages go to the staff sign-in, everything else to the student sign-in.
  if (!user) return <Redirect to={path.startsWith('/admin') ? '/admin/login' : '/login'} />;

  const slip = matchPath('/dashboard/slip/:id', path) || matchPath('/slip/:id', path);
  if (slip) return <Slip id={slip.id} />;

  if (path === '/dashboard' || path.startsWith('/dashboard/')) {
    if (isStaff(user)) return <Redirect to="/admin" />;
    const Page = STUDENT_PAGES[path];
    if (Page) return <Page />;
  }

  if (path === '/admin' || path.startsWith('/admin/')) {
    if (!isStaff(user)) return <Redirect to="/dashboard" />;
    const detail = matchPath('/admin/applications/:id', path);
    if (detail) return can(user, 'applications.view') ? <ApplicationDetail id={detail.id} /> : <NoAccess />;
    const entry = ADMIN_PAGES[path];
    if (entry) {
      const [Page, perm] = entry;
      return !perm || can(user, perm) ? <Page /> : <NoAccess />;
    }
  }

  return (
    <div className="center-screen">
      <h1>Page not found</h1>
      <Link to={homeFor(user)} className="btn btn-primary">Go to my dashboard</Link>
    </div>
  );
}
