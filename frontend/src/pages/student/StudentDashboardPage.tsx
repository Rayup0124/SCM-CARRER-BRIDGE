import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const postingsLabel = (n: number) => `${n} ${n === 1 ? 'posting' : 'postings'}`;

interface InternshipInfo {
  _id: string;
  title: string;
  location: string;
  company: {
    _id: string;
    companyName: string;
  };
}

interface Application {
  _id: string;
  internship: InternshipInfo;
  status: string;
  createdAt: string;
}

type SkillStatRow = { skill: string; count: number };

const statusLabels: Record<string, { label: string; color: string }> = {
  Pending: { label: 'Applied', color: 'bg-slate-100 text-slate-700' },
  Reviewed: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-700' },
  Interviewing: { label: 'Interviewing', color: 'bg-sky-100 text-sky-700' },
  Accepted: { label: 'Offered', color: 'bg-emerald-100 text-emerald-700' },
  Rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
};

const getStatusColor = (status: string) => {
  return statusLabels[status]?.color || 'bg-slate-100 text-slate-700';
};

const getStatusLabel = (status: string) => {
  return statusLabels[status]?.label || status;
};

const StudentDashboardPage = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [skillsStats, setSkillsStats] = useState<SkillStatRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  void error;
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const canWithdraw = (status: string) => status === 'Pending' || status === 'Reviewed';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch student's applications
        const appsRes = await api.get('/applications/student/me');
        setApplications(appsRes.data || []);

        // Fetch skills stats
        try {
          const skillsRes = await api.get<SkillStatRow[]>('/internships/skills/stats');
          setSkillsStats(Array.isArray(skillsRes.data) ? skillsRes.data : []);
        } catch {
          setSkillsStats([]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setApplications([]);
        setSkillsStats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate stats from applications
  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'Pending').length,
    reviewed: applications.filter(a => a.status === 'Reviewed').length,
    interviewing: applications.filter(a => a.status === 'Interviewing').length,
    accepted: applications.filter(a => a.status === 'Accepted').length,
    rejected: applications.filter(a => a.status === 'Rejected').length,
  };

  const skills = skillsStats ?? [];
  const maxCount = skills.length > 0 ? Math.max(...skills.map(s => s.count)) : 1;

  return (
    <PageShell 
      title={`Welcome back, ${user?.name || 'Student'}!`} 
      subtitle="Your Student Dashboard - Track applications and discover career insights."
    >
      <div className="space-y-6">
        {/* Academic Info */}
        <div className="text-sm text-slate-600">
          <p>{user?.programme || 'Not specified'}</p>
          <p>Student ID: {user?.studentId || 'N/A'}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Total Applications</p>
            <p className="mt-1 text-2xl font-bold text-sky-600">{loading ? '...' : stats.total}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Under Review</p>
            <p className="mt-1 text-2xl font-bold text-orange-500">{loading ? '...' : (stats.reviewed + stats.pending)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Interviewing</p>
            <p className="mt-1 text-2xl font-bold text-sky-600">{loading ? '...' : stats.interviewing}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Offers Received</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{loading ? '...' : stats.accepted}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
          {/* My Applications */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">My Applications</h2>
              <Link
                to="/student/applications"
                className="text-sm font-semibold text-sky-600 hover:text-sky-700"
              >
                View all
              </Link>
            </div>
            
            {loading ? (
              <div className="py-8 text-center text-slate-500">Loading applications...</div>
            ) : applications.length === 0 ? (
              <div className="py-8" />
            ) : (
              <div className="space-y-4">
                {applications.slice(0, 5).map((app) => {
                  const intId = app.internship?._id;
                  return (
                    <div key={app._id} className="rounded-lg border border-slate-100 p-4">
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
                        {intId ? (
                          <Link
                            to={`/student/internships/${intId}`}
                            className="inline-flex rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
                          >
                            View details
                          </Link>
                        ) : null}
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
            <Link to="/student/internships" className="mt-4 block w-full rounded-lg border border-slate-200 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
              + Browse More Internships
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/student/internships"
                className="block w-full rounded-lg border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Browse Internships
              </Link>
              <Link
                to="/student/profile#resume"
                className="block w-full rounded-lg border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Update Resume
              </Link>
              <Link
                to="/student/profile"
                className="block w-full rounded-lg border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Edit Profile
              </Link>
              <Link
                to="/student/favorites"
                className="block w-full rounded-lg border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                View Saved Internships
              </Link>
              <Link
                to="/student/announcements"
                className="block w-full rounded-lg border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                View Announcements
              </Link>
            </div>
          </div>
        </div>

        {/* Skills Demand Dashboard */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">Skills Demand Dashboard</h2>
          <p className="mb-6 text-sm text-slate-600">
            Data-driven career insights: Top skills employers are seeking in current internship postings.
          </p>
          
          {skills.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-4 text-sm font-semibold text-slate-700">Most In-Demand Skills</h3>
              <div className="space-y-3">
                {skills.slice(0, 8).map(({ skill, count }) => {
                  const pct = Math.round((count / maxCount) * 100);
                  return (
                    <div key={skill}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{skill}</span>
                        <span className="text-slate-500">{postingsLabel(count)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-sky-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold text-slate-700">Career Insights</h3>
              <div className="space-y-4">
                {skills.slice(0, 3).map(({ skill, count }, _idx) => (
                  <div key={skill} className="rounded-lg border border-slate-100 p-4">
                    <p className="font-semibold text-slate-900">{skill} is trending</p>
                    <p className="mt-1 text-sm text-slate-600">Appears in {postingsLabel(count)}</p>
                  </div>
                ))}
              </div>
              <Link
                to="/student/skills-analytics"
                className="mt-4 flex w-full items-center justify-center rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
              >
                View Detailed Analytics
              </Link>
            </div>
          </div>
          ) : (
            <div className="py-8" />
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default StudentDashboardPage;
