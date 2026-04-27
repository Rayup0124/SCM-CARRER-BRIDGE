import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import api from '../../services/api';

type Company = { _id: string; companyName: string };
type Internship = {
  _id: string;
  title: string;
  description: string;
  location: string;
  duration: string;
  skills: string[];
  targetedProgrammes: string[];
  company: Company;
  createdAt: string;
};

const StudentFavoritesPage = () => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get<Internship[]>('/applications/favorites/me')
      .then((res) => setInternships(res.data || []))
      .catch(() => setInternships([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api
      .get('/applications/student/me')
      .then((res) => {
        const ids = (res.data || []).map(
          (a: { internship?: { _id?: string } }) => a.internship?._id,
        );
        setAppliedIds(new Set(ids));
      })
      .catch(() => {});
  }, []);

  const handleRemove = async (internshipId: string) => {
    setRemovingId(internshipId);
    try {
      await api.post('/applications/favorites/toggle', { internshipId });
      setInternships((prev) => prev.filter((i) => i._id !== internshipId));
    } catch {
      console.error('Failed to remove');
    } finally {
      setRemovingId(null);
    }
  };

  const handleApply = async (internshipId: string) => {
    try {
      await api.post('/applications', { internshipId });
      setAppliedIds((prev) => new Set([...prev, internshipId]));
      navigate('/student/applications');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Failed to apply');
    }
  };

  return (
    <PageShell title="Saved Internships" subtitle="Review your saved internship opportunities">
      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading...</div>
      ) : internships.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-slate-600">No saved internships yet.</p>
          <p className="mt-2 text-sm text-slate-500">Browse opportunities and click "Save for Later" to keep track.</p>
          <Link
            to="/student/internships"
            className="mt-4 inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Browse Internships
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {internships.map((intern) => (
            <div key={intern._id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{intern.title}</h3>
                <p className="mt-1 text-sm font-medium text-slate-600">{intern.company?.companyName || '—'}</p>
                <p className="mt-2 text-sm text-slate-600 line-clamp-2">{intern.description}</p>
              </div>
              <div className="mb-4 flex flex-wrap gap-4 text-xs text-slate-500">
                <span>📍 {intern.location || '—'}</span>
                <span>📅 Posted {intern.createdAt ? new Date(intern.createdAt).toLocaleDateString() : '—'}</span>
                <span>⏰ {intern.duration || '—'}</span>
              </div>
              <div className="mb-4 flex flex-wrap gap-2">
                {(intern.skills || []).map((skill) => (
                  <span key={skill} className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
                    {skill}
                  </span>
                ))}
              </div>
              <div className="mb-4 flex flex-wrap gap-2">
                {(intern.targetedProgrammes || []).map((p) => (
                  <span key={p} className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                    {p}
                  </span>
                ))}
              </div>
              <div className="flex gap-3">
                <Link
                  to={`/student/internships/${intern._id}`}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Details
                </Link>
                {appliedIds.has(intern._id) ? (
                  <button
                    disabled
                    className="rounded-lg bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 cursor-not-allowed"
                  >
                    Already Applied
                  </button>
                ) : (
                  <button
                    onClick={() => handleApply(intern._id)}
                    className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                  >
                    Apply Now
                  </button>
                )}
                <button
                  onClick={() => handleRemove(intern._id)}
                  disabled={removingId === intern._id}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {removingId === intern._id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
};

export default StudentFavoritesPage;
