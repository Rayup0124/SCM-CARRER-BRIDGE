import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import api from '../../services/api';

type Company = { _id: string; companyName: string; website?: string };

type InternshipDetail = {
  _id: string;
  title: string;
  description: string;
  location: string;
  duration: string;
  skills: string[];
  targetedProgrammes: string[];
  requiredAttachments: string[];
  company: Company;
  createdAt?: string;
};

const StudentInternshipDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [internship, setInternship] = useState<InternshipDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [togglingFav, setTogglingFav] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api
      .get<InternshipDetail>(`/internships/${id}`)
      .then((res) => {
        if (!cancelled) {
          setInternship(res.data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setInternship(null);
          setError(err.response?.data?.message || 'Could not load this internship.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api
      .get<string[]>('/applications/favorites/me/ids')
      .then((res) => setIsFavorite((res.data || []).includes(id)))
      .catch(() => {});
    api
      .get(`/applications/student/me`)
      .then((res) => {
        const apps = res.data || [];
        setIsApplied(apps.some((a: { internship?: { _id?: string } }) => a.internship?._id === id));
      })
      .catch(() => {});
  }, [id]);

  const handleToggleFavorite = async () => {
    if (!id) return;
    setTogglingFav(true);
    try {
      const res = await api.post('/applications/favorites/toggle', { internshipId: id });
      setIsFavorite(res.data.saved);
    } catch {
      console.error('Failed to toggle favorite');
    } finally {
      setTogglingFav(false);
    }
  };

  const handleApply = async () => {
    if (!id) return;
    navigate(`/student/internships/${id}/apply`);
  };

  if (loading) {
    return (
      <PageShell title="Internship" subtitle="Loading…">
        <p className="py-12 text-center text-slate-500">Loading…</p>
      </PageShell>
    );
  }

  if (error || !internship) {
    return (
      <PageShell title="Internship" subtitle="">
        <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-4 text-sm font-semibold text-sky-600 hover:text-sky-800"
        >
          ← Go back
        </button>
      </PageShell>
    );
  }

  const posted = internship.createdAt ? new Date(internship.createdAt).toISOString().slice(0, 10) : '—';

  return (
    <PageShell title={internship.title} subtitle={internship.company?.companyName || 'Company'}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <button type="button" onClick={() => navigate(-1)} className="text-sm font-semibold text-sky-600 hover:text-sky-800">
            ← Back
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap gap-4 text-sm text-slate-600">
            <span>📍 {internship.location || '—'}</span>
            <span>⏰ {internship.duration || '—'}</span>
            <span>📅 Posted {posted}</span>
          </div>
          {internship.company?.website && (
            <p className="mb-4 text-sm">
              <a
                href={internship.company.website.startsWith('http') ? internship.company.website : `https://${internship.company.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-sky-600 hover:underline"
              >
                Company website
              </a>
            </p>
          )}
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Description</h2>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{internship.description || '—'}</p>

          <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {(internship.skills || []).length === 0 ? (
              <span className="text-sm text-slate-500">—</span>
            ) : (
              internship.skills.map((s) => (
                <span key={s} className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800">
                  {s}
                </span>
              ))
            )}
          </div>

          <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">Target programmes</h2>
          <div className="flex flex-wrap gap-2">
            {(internship.targetedProgrammes || []).length === 0 ? (
              <span className="text-sm text-slate-500">Open to all SCM programmes</span>
            ) : (
              internship.targetedProgrammes.map((p) => (
                <span key={p} className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
                  {p}
                </span>
              ))
            )}
          </div>

          {internship.requiredAttachments && internship.requiredAttachments.length > 0 && (
            <>
              <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">Required Documents</h2>
              <div className="flex flex-wrap gap-2">
                {internship.requiredAttachments.map((t) => (
                  <span key={t} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                    {t}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <Link
          to="/student/internships"
          className="inline-block rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Browse more internships
        </Link>

        {isApplied ? (
          <button
            disabled
            className="rounded-lg bg-emerald-100 px-6 py-2 text-sm font-semibold text-emerald-700 cursor-not-allowed"
          >
            ✓ Already Applied
          </button>
        ) : (
          <button
            onClick={handleApply}
            disabled={applying}
            className="rounded-lg bg-sky-600 px-6 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:bg-sky-400"
          >
            {applying ? 'Applying...' : 'Apply Now'}
          </button>
        )}

        <button
          onClick={handleToggleFavorite}
          disabled={togglingFav}
          className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
            isFavorite
              ? 'border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {togglingFav ? '...' : isFavorite ? '★ Saved' : '☆ Save for Later'}
        </button>
      </div>
    </PageShell>
  );
};

export default StudentInternshipDetailPage;
