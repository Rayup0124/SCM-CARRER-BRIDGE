import { useState, useEffect } from 'react';
import PageShell from '../../components/PageShell';
import api from '../../services/api';

type StudentRef = { _id: string; name: string; email: string; programme?: string };
type CompanyRef = { _id: string; companyName: string };
type InternshipRef = {
  _id: string;
  title: string;
  location?: string;
  status?: string;
  company?: CompanyRef;
};
type Application = {
  _id: string;
  student: StudentRef;
  internship: InternshipRef;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const STATUS_OPTIONS = ['Pending', 'Reviewed', 'Interviewing', 'Accepted', 'Rejected'];
const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Reviewed: 'bg-sky-100 text-sky-700',
  Interviewing: 'bg-violet-100 text-violet-700',
  Accepted: 'bg-emerald-100 text-emerald-700',
  Rejected: 'bg-red-100 text-red-700',
};

const AdminApplicationsPage = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState('');

  useEffect(() => {
    api
      .get<Application[]>('/admin/applications/all')
      .then((r) => setApplications(r.data || []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, []);

  const companies = [...new Map(
    applications
      .map((a) => a.internship?.company)
      .filter(Boolean)
      .map((c) => [c!._id, c!]),
  ).values()].sort((a, b) => a.companyName.localeCompare(b.companyName));

  const filtered = applications.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (a.student?.name || '').toLowerCase().includes(q) ||
      (a.student?.email || '').toLowerCase().includes(q) ||
      (a.internship?.title || '').toLowerCase().includes(q) ||
      (a.internship?.company?.companyName || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchCompany = !companyFilter || a.internship?.company?._id === companyFilter;
    return matchSearch && matchStatus && matchCompany;
  });

  const countsByStatus = STATUS_OPTIONS.reduce(
    (acc, s) => {
      acc[s] = applications.filter((a) => a.status === s).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <PageShell
      title="Application Management"
      subtitle="View and manage all student applications across the platform."
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-3 md:grid-cols-6">
        <button
          onClick={() => setStatusFilter('all')}
          className={`rounded-xl border p-4 text-left shadow-sm transition-all ${
            statusFilter === 'all'
              ? 'border-sky-400 bg-sky-50 ring-2 ring-sky-200'
              : 'border-slate-200 bg-white hover:border-sky-300'
          }`}
        >
          <p className="text-xs text-slate-500">Total</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{applications.length}</p>
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
            className={`rounded-xl border p-4 text-left shadow-sm transition-all ${
              statusFilter === s
                ? 'border-sky-400 bg-sky-50 ring-2 ring-sky-200'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <p className={`text-xs font-medium ${STATUS_COLORS[s]}`}>{s}</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{countsByStatus[s]}</p>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search student, company, internship..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        />
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 outline-none focus:border-sky-500"
        >
          <option value="">All Companies</option>
          {companies.map((c) => (
            <option key={c._id} value={c._id}>{c.companyName}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-slate-600">No applications found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-4 py-3 font-semibold text-slate-600">Student</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Email</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Internship</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Company</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Applied</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((app) => (
                <tr key={app._id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-900">{app.student?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-600">{app.student?.email || '—'}</span>
                      <button
                        onClick={() => window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(app.student?.email || '')}`, '_blank')}
                        className="w-fit rounded-lg border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 hover:bg-purple-100"
                      >
                        Send Email
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-900">{app.internship?.title || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{app.internship?.company?.companyName || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[app.status] || 'bg-slate-100 text-slate-600'}`}>
                      {app.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
};

export default AdminApplicationsPage;
