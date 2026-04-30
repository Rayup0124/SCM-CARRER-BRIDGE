import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import api from '../../services/api';

type Internship = {
  _id: string;
  title: string;
  description: string;
  location: string;
  duration: string;
  skills: string[];
  targetedProgrammes: string[];
  company: {
    _id: string;
    companyName: string;
  };
  createdAt: string;
  status: string;
};

const programmes = [
  'Bachelor of Computer Science (Hons)',
  'Bachelor of Arts in Industrial Design (Honours)',
  'Bachelor of Arts (Hons.) in Creative Digital Media',
  'Bachelor of Mobile Game Development (Honours)',
];

const skills = ['SQL', 'Database', 'Git', 'Figma', 'Machine Learning', 'Mobile Development'];

const StudentInternshipsPage = () => {
  const navigate = useNavigate();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProgrammes, setSelectedProgrammes] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [applyingId, setApplyingId] = useState<string | null>(null);
  void setApplyingId;
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [togglingFav, setTogglingFav] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  void setSuccessMessage;

  useEffect(() => {
    let cancelled = false;
    api
      .get<Internship[]>('/internships')
      .then((res) => {
        if (!cancelled) {
          setInternships(res.data || []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load internships');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    api
      .get<string[]>('/applications/favorites/me/ids')
      .then((res) => setFavoriteIds(new Set(res.data || [])))
      .catch(() => {});
  }, []);

  useEffect(() => {
    api
      .get('/applications/student/me')
      .then((res) => {
        const ids = (res.data || []).map(
          (a: { internship?: { _id?: string } }) => a.internship?._id,
        ).filter(Boolean) as string[];
        setAppliedIds(ids);
      })
      .catch(() => {});
  }, []);

  const filteredInternships = useMemo(() => {
    return internships.filter((internship) => {
      const matchesSearch =
        searchQuery === '' ||
        internship.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        internship.company?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        internship.skills?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesProgramme =
        selectedProgrammes.length === 0 ||
        internship.targetedProgrammes?.some((p) => selectedProgrammes.includes(p));

      const matchesSkill =
        selectedSkills.length === 0 ||
        internship.skills?.some((s) => selectedSkills.includes(s));

      return matchesSearch && matchesProgramme && matchesSkill;
    });
  }, [internships, searchQuery, selectedProgrammes, selectedSkills]);

  const toggleProgramme = (programme: string) => {
    setSelectedProgrammes((prev) =>
      prev.includes(programme) ? prev.filter((p) => p !== programme) : [...prev, programme]
    );
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
  };

  const clearFilters = () => {
    setSelectedProgrammes([]);
    setSelectedSkills([]);
    setSearchQuery('');
  };

  const handleApply = async (internshipId: string) => {
    navigate(`/student/internships/${internshipId}/apply`);
  };

  const handleToggleFavorite = async (internshipId: string) => {
    setTogglingFav(internshipId);
    try {
      const res = await api.post('/applications/favorites/toggle', { internshipId });
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (res.data.saved) {
          next.add(internshipId);
        } else {
          next.delete(internshipId);
        }
        return next;
      });
    } catch {
      console.error('Failed to toggle favorite');
    } finally {
      setTogglingFav(null);
    }
  };

  return (
    <PageShell title="Internship Market" subtitle="Discover opportunities tailored for SCM students">
      {successMessage && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-600">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600">
          {error}
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-[280px,1fr]">
        {/* Left Sidebar - Filters */}
        <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Search & Filter</h2>
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-700">Search Keywords</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Title, company, skills..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-700">Your Programme</label>
              <div className="space-y-2">
                {programmes.map((programme) => (
                  <label key={programme} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedProgrammes.includes(programme)}
                      onChange={() => toggleProgramme(programme)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>{programme}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-700">Desired Skills</label>
              <div className="space-y-2">
                {skills.map((skill) => (
                  <label key={skill} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedSkills.includes(skill)}
                      onChange={() => toggleSkill(skill)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>{skill}</span>
                  </label>
                ))}
              </div>
            </div>
            <button
              onClick={clearFilters}
              className="w-full rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear All Filters
            </button>
          </div>
        </aside>

        {/* Right Section - Internship Listings */}
        <div>
          {loading && (
            <p className="py-12 text-center text-slate-500">Loading internships...</p>
          )}
          {error && (
            <p className="py-12 text-center text-red-600">{error}</p>
          )}
          {!loading && !error && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-600">Showing {filteredInternships.length} internships</p>
                <select className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-sky-500">
                  <option>Sort by: Most Recent</option>
                  <option>Sort by: Most Applicants</option>
                  <option>Sort by: Deadline</option>
                </select>
              </div>
              {filteredInternships.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                  <p className="text-slate-600">No internships found.</p>
                  <p className="mt-2 text-sm text-slate-500">Try adjusting your filters.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInternships.map((internship) => {
                    const postedDate = internship.createdAt
                      ? new Date(internship.createdAt).toISOString().slice(0, 10)
                      : '—';
                    return (
                      <div key={internship._id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4">
                          <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{internship.title}</h3>
                          <p className="mt-1 text-sm font-medium text-slate-600">{internship.company?.companyName || 'Unknown Company'}</p>
                          <p className="mt-2 text-sm text-slate-600 line-clamp-2">{internship.description}</p>
                        </div>
                        <div className="mb-4 flex flex-wrap gap-4 text-xs text-slate-500">
                          <span>📍 {internship.location || '—'}</span>
                          <span>📅 Posted {postedDate}</span>
                          <span>⏰ {internship.duration || '—'}</span>
                        </div>
                        <div className="mb-4 flex flex-wrap gap-2">
                          {(internship.skills || []).map((skill) => (
                            <span key={skill} className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
                              {skill}
                            </span>
                          ))}
                        </div>
                        <div className="mb-4 flex flex-wrap gap-2">
                          {(internship.targetedProgrammes || []).map((programme) => (
                            <span key={programme} className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                              {programme}
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-3 items-center flex-wrap">
                          <Link
                            to={`/student/internships/${internship._id}`}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Details
                          </Link>
                          <button
                            onClick={() => handleToggleFavorite(internship._id)}
                            disabled={togglingFav === internship._id}
                            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                              favoriteIds.has(internship._id)
                                ? 'border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100'
                                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {togglingFav === internship._id
                              ? '...'
                              : favoriteIds.has(internship._id)
                                ? '★ Saved'
                                : '☆ Save for Later'}
                          </button>
                          {appliedIds.includes(internship._id) ? (
                            <button
                              disabled
                              className="rounded-lg bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 cursor-not-allowed"
                            >
                              Applied
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApply(internship._id)}
                              disabled={applyingId === internship._id}
                              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:bg-sky-400"
                            >
                              {applyingId === internship._id ? 'Applying...' : 'Apply Now'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default StudentInternshipsPage;
