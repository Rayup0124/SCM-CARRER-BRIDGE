import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (user?.role === 'admin') {
        navigate('/admin/overview');
      } else if (user?.role === 'student') {
        navigate('/student/dashboard', { replace: true });
      } else if (user?.role === 'company') {
        navigate('/company/dashboard', { replace: true });
      }
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { token, role, profile } = response.data;

      if (token && profile && role === 'admin') {
        const user = {
          _id: profile.id,
          name: profile.name,
          email: profile.email,
          role: role,
        };

        login(token, user);
        navigate('/admin/overview');
      } else {
        setError('Invalid admin credentials');
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Unable to connect to the server';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="Admin Access" subtitle="Restricted panel for SCM programme leads.">
      <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">Admin portal</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Sign in to continue</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <label className="text-sm font-medium text-slate-700">
            Admin Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-rose-100 focus:bg-white focus:ring-2"
              required
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Password
            <div className="mt-1 flex items-center gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-rose-100 focus:bg-white focus:ring-2"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="shrink-0 text-xs font-semibold text-rose-600 hover:text-rose-700"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login to admin panel'}
          </button>
        </form>
      </section>
    </PageShell>
  );
};

export default AdminLoginPage;
