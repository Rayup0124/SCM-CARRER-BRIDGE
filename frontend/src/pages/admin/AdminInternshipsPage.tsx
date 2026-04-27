import { useState, useEffect } from 'react';
import PageShell from '../../components/PageShell';
import api from '../../services/api';

type CompanyRef = {
  _id: string;
  companyName: string;
  status: string;
};

type Internship = {
  _id: string;
  title: string;
  description: string;
  location: string;
  duration: string;
  skills: string[];
  targetedProgrammes: string[];
  status: string;
  isPublished: boolean;
  company: CompanyRef;
  applicantCount: number;
  applicantCountByStatus: Record<string, number>;
  createdAt: string;
};

const statusColor = (s: string) =>
  s === 'Open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600';

const AdminInternshipsPage = () => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Open' | 'Closed'>('all');
  const [filterCompany, setFilterCompany] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Internship[]>('/admin/internships/all')
      .then((r) => setInternships(r.data || []))
      .catch(() => setInternships([]))
      .finally(() => setLoading(false));
  }, []);

  const companies = [...new Map(internships.map((i) => [i.company?._id, i.company])).values()]
    .filter(Boolean)
    .sort((a, b) => (a?.companyName || '').localeCompare(b?.companyName || ''));

  const filtered = internships.filter((i) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      i.title.toLowerCase().includes(q) ||
      (i.company?.companyName || '').toLowerCase().includes(q) ||
      (i.location || '').toLowerCase().includes(q) ||
      (i.skills || []).some((s) => s.toLowerCase().includes(q));
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    const matchCompany = !filterCompany || i.company?._id === filterCompany;
    return matchSearch && matchStatus && matchCompany;
  });

  const toggleStatus = async (id: string, currentStatus: string) => {
    const next = currentStatus === 'Open' ? 'Closed' : 'Open';
    try {
      const res = await api.put(`/admin/internships/${id}/status`, { status: next });
      setInternships((prev) =>
        prev.map((i) => (i._id === id ? { ...i, status: res.data.internship.status } : i)),
      );
    } catch {
      console.error('Failed to toggle status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this internship and all its applications? This cannot be undone.'))
      return;
    setDeleting(id);
    try {
      await api.delete(`/admin/internships/${id}`);
      setInternships((prev) => prev.filter((i) => i._id !== id));
    } catch {
      console.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const openCount = internships.filter((i) => i.status === 'Open').length;
  const closedCount = internships.filter((i) => i.status === 'Closed').length;
  const totalApplicants = internships.reduce((s, i) => s + (i.applicantCount || 0), 0);

  return (
    <PageShell
      title="Internship Management"
      subtitle="View, open/close, or remove all internship listings on the platform."
    >
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Listings</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{internships.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm text-emerald-600">Open</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{openCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <p className="text-sm text-slate-600">Closed</p>
          <p className="mt-1 text-2xl font-bold text-slate-700">{closedCount}</p>
        </div>
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
          <p className="text-sm text-violet-600">Total Applications</p>
          <p className="mt-1 text-2xl font-bold text-violet-700">{totalApplicants}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search title, company, location, skill..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 outline-none focus:border-sky-500"
        >
          <option value="all">All Status</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
        </select>
        <select
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 outline-none focus:border-sky-500"
        >
          <option value="">All Companies</option>
          {companies.map((c) =>
            c ? (
              <option key={c._id} value={c._id}>
                {c.companyName}
              </option>
            ) : null,
          )}
        </select>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-slate-600">No internships found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((intern) => (
            <div key={intern._id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{intern.title}</h3>
                    {intern.isDraft ? (
                      <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-700">
                        Draft
                      </span>
                    ) : (
                      <>
                        <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${statusColor(intern.status)}`}>
                          {intern.status}
                        </span>
                        {!intern.isPublished && (
                          <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-700">
                            Unpublished
                          </span>
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          intern.company?.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {intern.company?.status === 'Approved' ? 'Approved Co.' : 'Pending Co.'}
                        </span>
                      </>
                    )}
                  </div>
                  {!intern.isDraft && (
                    <p className="text-sm text-slate-600">
                      {intern.company?.companyName || 'Unknown'} · {intern.location || 'No location'} ·{' '}
                      {intern.duration || 'No duration set'}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {!intern.isDraft && (
                    <button
                      onClick={() => toggleStatus(intern._id, intern.status)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          intern.status === 'Open'
                            ? 'border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600'
                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {intern.status === 'Open' ? 'Close' : 'Reopen'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(intern._id)}
                    disabled={deleting === intern._id}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                  >
                    {deleting === intern._id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>

              <p className="mt-2 text-sm text-slate-600 line-clamp-2">{intern.description}</p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {intern.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {intern.skills.slice(0, 6).map((skill) => (
                      <span key={skill} className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                        {skill}
                      </span>
                    ))}
                    {intern.skills.length > 6 && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">
                        +{intern.skills.length - 6}
                      </span>
                    )}
                  </div>
                )}
                <div className="ml-auto flex items-center gap-4 text-xs text-slate-500">
                  {intern.isDraft
                    ? <span className="italic text-amber-600">Draft — not visible to students</span>
                    : <>
                        <span>
                          Posted {intern.createdAt ? new Date(intern.createdAt).toLocaleDateString() : '—'}
                        </span>
                        <span className="rounded-full bg-violet-100 px-2.5 py-0.5 font-semibold text-violet-700">
                          {intern.applicantCount || 0} applicant{intern.applicantCount !== 1 ? 's' : ''}
                        </span>
                        {Object.keys(intern.applicantCountByStatus || {}).length > 0 && (
                          <div className="flex gap-1.5">
                            {Object.entries(intern.applicantCountByStatus).map(([s, cnt]) => (
                              <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                                {s}: {cnt}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
};

export default AdminInternshipsPage;
