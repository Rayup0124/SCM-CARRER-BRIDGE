import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import api from '../../services/api';

interface InternshipInfo {
  _id: string;
  title: string;
  location: string;
  company: { _id: string; companyName: string };
}

interface Application {
  _id: string;
  internship: InternshipInfo;
  status: string;
  createdAt: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  Pending: { label: 'Applied', color: 'bg-slate-100 text-slate-700' },
  Reviewed: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-700' },
  Interviewing: { label: 'Interviewing', color: 'bg-sky-100 text-sky-700' },
  Accepted: { label: 'Offered', color: 'bg-emerald-100 text-emerald-700' },
  Rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
};

const getStatusColor = (status: string) => statusLabels[status]?.color || 'bg-slate-100 text-slate-700';
const getStatusLabel = (status: string) => statusLabels[status]?.label || status;

const StudentApplicationsPage = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api
      .get<Application[]>('/applications/student/me')
      .then((res) => {
        setApplications(res.data || []);
        setError(null);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load applications');
        setApplications([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleWithdraw = async (applicationId: string) => {
    if (
      !window.confirm(
        'Withdraw this application? You can apply again later if the position is still open.',
      )
    ) {
      return;
    }
    setWithdrawingId(applicationId);
    try {
      await api.delete(`/applications/${applicationId}`);
      setApplications((prev) => prev.filter((a) => a._id !== applicationId));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      alert(axiosErr.response?.data?.message || 'Could not withdraw. Please try again.');
    } finally {
      setWithdrawingId(null);
    }
  };

  const canWithdraw = (status: string) => status === 'Pending' || status === 'Reviewed';

  return (
    <PageShell title="My applications" subtitle="All internships you have applied for.">
      <div className="mb-6">
        <Link to="/student/dashboard" className="text-sm font-semibold text-sky-600 hover:text-sky-800">
          ← Back to dashboard
        </Link>
      </div>

      {loading ? (
        <p className="py-12 text-center text-slate-500">Loading…</p>
      ) : error ? (
        <p className="py-12 text-center text-red-600">{error}</p>
      ) : applications.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-slate-600">You have not applied to any internships yet.</p>
          <Link
            to="/student/internships"
            className="mt-4 inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Browse internships
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const intId = app.internship?._id;
            return (
              <div key={app._id} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{app.internship?.title || 'Internship'}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {app.internship?.company?.companyName || 'Company'} · {app.internship?.location || 'N/A'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Applied: {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(app.status)}`}>
                    {getStatusLabel(app.status)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {intId && (
                    <Link
                      to={`/student/internships/${intId}`}
                      className="inline-flex rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
                    >
                      View details
                    </Link>
                  )}
                  <button
                    type="button"
                    disabled={!canWithdraw(app.status) || withdrawingId === app._id}
                    onClick={() => handleWithdraw(app._id)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    title={
                      canWithdraw(app.status)
                        ? 'Withdraw application'
                        : 'Withdraw is only available for Applied or Under Review'
                    }
                  >
                    {withdrawingId === app._id ? 'Withdrawing…' : 'Withdraw'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
};

export default StudentApplicationsPage;
