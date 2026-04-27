import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { canonicalProgrammeLabel, internshipMatchesStudentProgramme } from '../../utils/programmeMatch';
import { normalizeSkillLabel, skillCanonicalKey } from '../../utils/skillNormalize';

type SkillRow = { skill: string; count: number };

type InternshipRaw = {
  _id: string;
  skills: string[];
  targetedProgrammes: string[];
  isPublished: boolean;
  status: string;
  company?: { status: string };
};

type Suggestion = { text: string; relatedSkill?: string };

const PROGRAMMES = [
  'Bachelor of Computer Science (Hons)',
  'Bachelor of Arts in Industrial Design (Honours)',
  'Bachelor of Arts (Hons.) in Creative Digital Media',
  'Bachelor of Mobile Game Development (Honours)',
];

const generateSuggestions = (gaps: SkillRow[], matched: SkillRow[], allRows: SkillRow[]): Suggestion[] => {
  const suggestions: Suggestion[] = [];

  if (gaps.length === 0 && matched.length > 0) {
    suggestions.push({
      text: `You already cover ${matched.length} of the most in-demand skills—strong alignment. Keep checking new postings to see how skill demand shifts over time.`,
    });
    return suggestions;
  }

  const topGap = gaps[0];
  if (topGap) {
    const n = topGap.count;
    const postingPhrase = n === 1 ? '1 posting' : `${n} postings`;
    suggestions.push({
      text: `${topGap.skill} is among the hottest skills right now, with ${postingPhrase} asking for it. Consider adding it to your profile.`,
      relatedSkill: topGap.skill,
    });
  }

  const topCount = allRows[0]?.count ?? 1;
  const highDemand = gaps.find((g) => g.count >= topCount * 0.6);
  if (highDemand && highDemand.skill !== topGap?.skill) {
    suggestions.push({
      text: `${highDemand.skill} shows up often (${highDemand.count} mentions). Building it can make your profile easier for employers to find.`,
      relatedSkill: highDemand.skill,
    });
  }

  const midGaps = gaps.slice(1, 4);
  if (midGaps.length > 0) {
    const names = midGaps.map((g) => `"${g.skill}"`).join(', ');
    suggestions.push({
      text: `${names} also see steady demand in the internship market—worth exploring.`,
    });
  }

  if (matched.length > 0) {
    const totalMatched = matched.reduce((s, g) => s + g.count, 0);
    suggestions.push({
      text: `Your profile lists ${matched.length} of these in-demand skills; together they appear across ${totalMatched} postings—keep building in this direction.`,
    });
  }

  return suggestions;
};

const positionsLabel = (n: number) => `${n} ${n === 1 ? 'posting' : 'postings'}`;

const StudentSkillsAnalyticsPage = () => {
  const { user } = useAuth();
  const [allInternships, setAllInternships] = useState<InternshipRaw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterByOwnProgramme, setFilterByOwnProgramme] = useState(false);

  const studentProgramme = user?.programme ?? '';

  const rows = useMemo<SkillRow[]>(() => {
    let pool = allInternships.filter((i) => {
      if (!i.isPublished || i.status !== 'Open') return false;
      if (i.company?.status !== 'Approved') return false;
      if (!filterByOwnProgramme || !studentProgramme) return true;
      return internshipMatchesStudentProgramme(studentProgramme, i.targetedProgrammes);
    });

    const tally: Record<string, number> = {};
    pool.forEach((i) => {
      (i.skills ?? []).forEach((s) => {
        const label = normalizeSkillLabel(s);
        if (!label) return;
        tally[label] = (tally[label] ?? 0) + 1;
      });
    });

    return Object.entries(tally)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count);
  }, [allInternships, filterByOwnProgramme, studentProgramme]);

  const matchedProgramme = useMemo(() => {
    const canon = canonicalProgrammeLabel(studentProgramme);
    if (canon) return canon;
    return (
      PROGRAMMES.find((p) => p.toLowerCase() === studentProgramme.trim().toLowerCase()) ?? null
    );
  }, [studentProgramme]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get<InternshipRaw[]>('/internships');
        if (!cancelled) {
          setAllInternships(Array.isArray(res.data) ? res.data : []);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setAllInternships([]);
          setError('Could not load skills data. Try again later.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const maxCount = useMemo(
    () => (rows.length ? Math.max(...rows.map((r) => r.count), 1) : 1),
    [rows],
  );
  const totalTaggings = useMemo(() => rows.reduce((s, r) => s + r.count, 0), [rows]);

  const profileSkills = user?.skills ?? [];
  const profileKeys = new Set(profileSkills.map((s) => skillCanonicalKey(s)).filter(Boolean));
  const topSkills = rows.slice(0, 15);
  const matched = topSkills.filter((r) => profileKeys.has(skillCanonicalKey(r.skill)));
  const gaps = topSkills
    .filter((r) => !profileKeys.has(skillCanonicalKey(r.skill)))
    .slice(0, 8);

  const suggestions = useMemo(
    () => generateSuggestions(gaps, matched, rows),
    [gaps, matched, rows],
  );

  return (
    <PageShell
      title="Skills analytics"
      subtitle="Deeper view of what employers are asking for in internship postings — use it to plan learning and profile updates."
    >
      <div className="mb-6">
        <Link
          to="/student/dashboard"
          className="text-sm font-semibold text-sky-600 hover:text-sky-800"
        >
          ← Back to dashboard
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-600">Loading analytics…</p>
      ) : rows.length === 0 ? (
        <p className="text-slate-600">
          No skills data yet. When companies publish internships with skill tags,
          charts will appear here.
        </p>
      ) : (
        <div className="space-y-8">
          {/* Filter toggle */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-slate-800">Filter by your programme</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {filterByOwnProgramme && matchedProgramme
                  ? `Showing skills only from internships targeting your programme (${matchedProgramme})`
                  : 'Showing skills from all published internships across all programmes'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFilterByOwnProgramme((v) => !v)}
              disabled={!matchedProgramme}
              title={
                !matchedProgramme
                  ? 'Your profile does not have a recognised programme — switch is disabled'
                  : undefined
              }
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40 ${
                filterByOwnProgramme ? 'bg-sky-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  filterByOwnProgramme ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Distinct skills</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{rows.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Skill mentions</p>
              <p className="mt-1 text-2xl font-bold text-sky-600">{totalTaggings}</p>
              <p className="mt-1 text-xs text-slate-500">
                {filterByOwnProgramme ? 'Filtered by your programme' : 'All postings'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Top skill</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{rows[0]?.skill ?? '—'}</p>
              <p className="mt-1 text-sm text-slate-600">
                {rows[0] ? positionsLabel(rows[0].count) : ''}
              </p>
            </div>
          </div>

          {suggestions.length > 0 && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/80 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-indigo-900">Smart suggestions</h2>
              <ul className="mt-3 space-y-2">
                {suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-indigo-900/90">
                    <span className="mt-1 text-indigo-400">•</span>
                    <span>{s.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {profileSkills.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Your profile vs top demand</h2>
              <p className="mt-1 text-sm text-slate-600">
                Comparing your profile skills to the top 15 skills in the
                {filterByOwnProgramme ? ' filtered' : ' market'} snapshot.
              </p>
              <div className="mt-4 grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Overlap
                  </h3>
                  {matched.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-600">
                      None of your skills match the current top 15. Consider adding
                      relevant tags on your profile.
                    </p>
                  ) : (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {matched.map((r) => (
                        <li
                          key={r.skill}
                          className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800"
                        >
                          {r.skill} ({r.count})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                    Popular skills you have not listed
                  </h3>
                  {gaps.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-600">
                      You cover most of the top skills — great alignment.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-1 text-sm text-slate-700">
                      {gaps.map((r) => (
                        <li key={r.skill}>
                          <span className="font-medium">{r.skill}</span> —{' '}
                          {positionsLabel(r.count)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <Link
                to="/student/profile"
                className="mt-4 inline-block text-sm font-semibold text-sky-600 hover:text-sky-800"
              >
                Edit profile skills →
              </Link>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Full ranking</h2>
            <p className="mt-1 text-sm text-slate-600">
              Every skill tag from{filterByOwnProgramme ? ' filtered' : ' all'} published
              internships, most frequent first. Similar spellings (e.g. html / HTML) and overlapping
              terms (e.g. SQL vs database) are grouped where configured. Word and Excel stay separate;
              hardware and software are different skills and are not merged.
            </p>
            <div className="mt-6 space-y-3">
              {rows.map(({ skill, count }) => {
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={skill}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-800">{skill}</span>
                      <span className="text-slate-500">{positionsLabel(count)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-sky-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/student/internships"
              className="inline-flex rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Browse internships
            </Link>
            <Link
              to="/student/dashboard"
              className="inline-flex rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default StudentSkillsAnalyticsPage;
