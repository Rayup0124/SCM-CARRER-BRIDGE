import type { PropsWithChildren } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type PageShellProps = {
  title: string;
  subtitle: string;
};

const PageShell = ({ title, subtitle, children }: PropsWithChildren<PageShellProps>) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar - White background like Landing Page */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <nav className="flex items-center gap-1">
                <Link
                  to="/admin/overview"
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    location.pathname === '/admin/overview'
                      ? 'bg-sky-100 text-sky-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Overview
                </Link>
                <Link
                  to="/admin/approvals"
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    location.pathname === '/admin/approvals'
                      ? 'bg-sky-100 text-sky-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Approvals
                </Link>
                <Link
                  to="/admin/companies"
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    location.pathname === '/admin/companies'
                      ? 'bg-sky-100 text-sky-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Companies
                </Link>
                <Link
                  to="/admin/students"
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    location.pathname === '/admin/students'
                      ? 'bg-sky-100 text-sky-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Students
                </Link>
                <Link
                  to="/admin/announcements"
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    location.pathname === '/admin/announcements'
                      ? 'bg-sky-100 text-sky-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Announcements
                </Link>
                <Link
                  to="/admin/internships"
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    location.pathname === '/admin/internships'
                      ? 'bg-sky-100 text-sky-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Internships
                </Link>
                <Link
                  to="/admin/applications"
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    location.pathname === '/admin/applications'
                      ? 'bg-sky-100 text-sky-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Applications
                </Link>
              </nav>
            )}
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  {user.name} ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

    {/* Page Title Section - White background */}
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      </div>
    </div>

    {/* Main Content - Light gray background */}
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      {children}
    </main>
  </div>
);
};

export default PageShell;

