import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageShell from '../../components/PageShell';
import api from '../../services/api';

type Stats = {
  totalStudents: number;
  totalCompanies: number;
  totalApproved: number;
  totalPending: number;
  totalInternships: number;
  totalApplications: number;
  applicationsByStatus: Record<string, number>;
};

type SkillRow = { skill: string; count: number };

type SkillsStats = {
  rows: SkillRow[];
  totalInternships: number;
};

const STATUS_CONFIG = [
  { key: 'Pending', label: 'Pending', color: '#94a3b8' },
  { key: 'Reviewed', label: 'Under Review', color: '#facc15' },
  { key: 'Interviewing', label: 'Interviewing', color: '#a78bfa' },
  { key: 'Accepted', label: 'Offered', color: '#34d399' },
  { key: 'Rejected', label: 'Rejected', color: '#f87171' },
];

const AdminDashboardPage = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [skillsStats, setSkillsStats] = useState<SkillsStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Stats>('/admin/stats'),
      api.get<SkillsStats>('/admin/skills/stats'),
    ])
      .then(([statsRes, skillsRes]) => {
        setStats(statsRes.data);
        setSkillsStats(skillsRes.data);
      })
      .catch(() => {
        setStats(null);
        setSkillsStats(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const funnelData = STATUS_CONFIG.map(({ key, label, color }) => ({
    name: label,
    value: (stats?.applicationsByStatus?.[key] ?? 0) + (key === 'Pending' ? 0 : 0),
    fill: color,
  }));

  const kpiData = [
    { label: 'Students', value: stats?.totalStudents ?? 0, color: 'text-sky-600' },
    { label: 'Companies', value: stats?.totalCompanies ?? 0, color: 'text-violet-600' },
    { label: 'Internships', value: stats?.totalInternships ?? 0, color: 'text-emerald-600' },
    { label: 'Applications', value: stats?.totalApplications ?? 0, color: 'text-amber-600' },
  ];

  const companyData = [
    { label: 'Total', value: stats?.totalCompanies ?? 0, color: '#94a3b8' },
    { label: 'Approved', value: stats?.totalApproved ?? 0, color: '#34d399' },
    { label: 'Pending', value: stats?.totalPending ?? 0, color: '#facc15' },
  ];

  const topSkills = skillsStats?.rows.slice(0, 15) ?? [];
  const maxSkillCount = topSkills[0]?.count ?? 1;

  return (
    <PageShell
      title="Admin Overview"
      subtitle="Platform health and key metrics at a glance."
    >
      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading...</div>
      ) : !stats ? (
        <div className="py-12 text-center text-slate-500">Failed to load stats.</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {kpiData.map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">{label}</p>
                <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Application Funnel Bar Chart */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Applications by Status
              </h2>
              <p className="mb-4 text-xs text-slate-400">Total: {stats.totalApplications}</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={funnelData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {funnelData.map((entry, index) => (
                      <entry key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Horizontal bars as fallback visual */}
              <div className="mt-4 space-y-2">
                {STATUS_CONFIG.map(({ key, label, color }) => {
                  const value = stats.applicationsByStatus?.[key] ?? 0;
                  const pct = stats.totalApplications > 0 ? (value / stats.totalApplications) * 100 : 0;
                  return (
                    <div key={key}>
                      <div className="mb-0.5 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600">{label}</span>
                        <span className="text-slate-400">{value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Company Status Bar Chart */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Company Overview
              </h2>
              <p className="mb-4 text-xs text-slate-400">Total: {stats.totalCompanies} registered</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={companyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {companyData.map((entry, index) => (
                      <entry key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {companyData.map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="mb-0.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600">{label}</span>
                      <span className="text-slate-400">{value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${stats.totalCompanies > 0 ? (value / stats.totalCompanies) * 100 : 0}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Platform Summary Table */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Platform Summary
            </h2>
            <div className="space-y-4">
              {[
                { label: 'Registered Students', value: stats.totalStudents },
                { label: 'Registered Companies', value: stats.totalCompanies },
                { label: 'Approved Companies', value: stats.totalApproved },
                { label: 'Pending Approval', value: stats.totalPending },
                { label: 'Open Internships', value: stats.totalInternships },
                { label: 'Total Applications', value: stats.totalApplications },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className="text-sm font-semibold text-slate-900">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Skills Analytics */}
          {skillsStats && skillsStats.rows.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Skills Analytics
              </h2>
              <p className="mb-1 text-xs text-slate-400">
                Top skills in demand across {skillsStats.totalInternships} published internships
              </p>
              <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-5 mb-6">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Distinct skills</p>
                  <p className="mt-0.5 text-xl font-bold text-slate-900">{skillsStats.rows.length}</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total mentions</p>
                  <p className="mt-0.5 text-xl font-bold text-sky-600">
                    {skillsStats.rows.reduce((s, r) => s + r.count, 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Top skill</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900 leading-tight">{skillsStats.rows[0]?.skill ?? '—'}</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">2nd skill</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-700 leading-tight">{skillsStats.rows[1]?.skill ?? '—'}</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">3rd skill</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-500 leading-tight">{skillsStats.rows[2]?.skill ?? '—'}</p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Top 15 bar chart */}
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Top 15 Skills — bar chart
                  </h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={topSkills}
                      layout="vertical"
                      margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis
                        dataKey="skill"
                        type="category"
                        width={110}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                        cursor={{ fill: '#f8fafc' }}
                        formatter={(value: number) => [`${value} posting${value !== 1 ? 's' : ''}`, 'Mentions']}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#38bdf8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Top 15 horizontal bars */}
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Top 15 Skills — breakdown
                  </h3>
                  <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                    {topSkills.map(({ skill, count }) => {
                      const pct = Math.round((count / maxSkillCount) * 100);
                      return (
                        <div key={skill}>
                          <div className="mb-0.5 flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-700">{skill}</span>
                            <span className="text-slate-400">{count} posting{count !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-sky-400 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
};

export default AdminDashboardPage;
