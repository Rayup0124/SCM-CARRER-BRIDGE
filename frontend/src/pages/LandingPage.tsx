import { Link } from 'react-router-dom';

const LandingPage = () => (
  <div className="min-h-screen bg-slate-50">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-sky-600">
            SCM Career Bridge
          </span>
        </div>
      </div>
    </header>

    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
          Experience overview
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Experience Hub</h1>
        <p className="mt-1 text-sm text-slate-600">
          Choose your persona to preview the planned student, company and admin journeys.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            role: 'Student',
            description:
              'Discover curated internships, track applications, and highlight your skills.',
            href: '/student/login',
          },
          {
            role: 'Company',
            description:
              'Publish internships, manage applicants, and collaborate with SCM mentors.',
            href: '/company/login',
          },
          {
            role: 'Admin',
            description:
              'Approve employers, monitor application health, and ensure compliance.',
            href: '/admin/login',
          },
        ].map(({ role, description, href }) => (
          <Link
            key={role}
            to={href}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-md"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {role} journey
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">{role} Portal</h2>
            <p className="mt-3 text-sm text-slate-600">{description}</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-600">
              Explore flow
              <span className="transition group-hover:translate-x-0.5">→</span>
            </span>
          </Link>
        ))}
      </section>

    </main>
  </div>
);

export default LandingPage;

