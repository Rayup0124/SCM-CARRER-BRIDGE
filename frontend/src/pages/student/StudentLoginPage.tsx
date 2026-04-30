import { type FormEvent, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  isValidStudentEmailDomain,
  studentIdMatchesProgramme,
  STUDENT_EMAIL_DOMAIN,
} from '../../constants/studentRegistration';

const StudentLoginPage = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [programme, setProgramme] = useState('');
  const [programmeOptions, setProgrammeOptions] = useState<string[]>([]);

  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading, login } = useAuth();

  useEffect(() => {
    api
      .get('/users/programmes')
      .then((res) => setProgrammeOptions(res.data.programmes || []))
      .catch(() => setProgrammeOptions([]));
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (user?.role === 'student') {
        navigate('/student/dashboard', { replace: true });
      } else if (user?.role === 'company') {
        navigate('/company/dashboard', { replace: true });
      } else if (user?.role === 'admin') {
        navigate('/admin/companies', { replace: true });
      }
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    // Validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!isValidStudentEmailDomain(email)) {
      setError(`Use your UTS student email — must end with @${STUDENT_EMAIL_DOMAIN}`);
      return;
    }

    if (mode === 'register') {
      if (!programme) {
        setError('Please select your programme');
        return;
      }
      if (!studentIdMatchesProgramme(studentId, programme)) {
        setError(
          'Student ID must start with the correct prefix for your programme: BCS (Computer Science), BID (Industrial Design), BDM (Creative Digital Media), BMD (Mobile Game Development).',
        );
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        // Login request
        const response = await api.post('/auth/login', {
          email,
          password,
        });

        const { token, role, profile } = response.data;

        if (token && profile) {
          // Build user object from backend response
          const user = {
            _id: profile.id,
            name: profile.name || profile.companyName || '',
            email: profile.email || profile.hrEmail || '',
            role: role,
            studentId: profile.studentId,
            programme: profile.programme,
            ...(role === 'company' ? { companyId: profile.id, companyName: profile.companyName } : {})
          };
          
          login(token, user);
          
          // Redirect based on role
          if (role === 'company') {
            navigate('/company/dashboard');
          } else if (role === 'admin') {
            navigate('/admin/companies');
          } else {
            navigate('/student/dashboard');
          }
        } else {
          setError('Invalid response from server');
        }
      } else {
        // Register request
        const response = await api.post('/auth/register/student', {
          name,
          email,
          password,
          studentId,
          programme,
          skills: [],
        });

        if (response.status === 201 || response.status === 200) {
          // After successful registration, switch to login mode
          setMode('login');
          setError(null);
          alert('Registration successful! Please login with your credentials.');
          // Clear form except email for convenience
          setPassword('');
          setConfirmPassword('');
        }
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
    <PageShell
      title="Student Access"
      subtitle="Clean and simple entry point for SCM students before exploring internships."
    >
      <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-500">Student portal</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            {mode === 'login' ? 'Sign in to continue' : 'Create your account'}
          </h2>
        </div>

        <div className="mb-6 inline-flex rounded-full bg-slate-100 p-1 text-xs font-medium text-slate-600">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`rounded-full px-4 py-1 transition ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`rounded-full px-4 py-1 transition ${
              mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-4">
              <label className="text-sm font-medium text-slate-700">
                Name
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-sky-100 focus:bg-white focus:ring-2"
                  required
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Programme
                <select
                  value={programme}
                  onChange={(e) => setProgramme(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-sky-100 focus:bg-white focus:ring-2"
                  required
                >
                  <option value="" disabled>
                    {programmeOptions.length ? 'Select a programme' : 'Loading programmes…'}
                  </option>
                  {programmeOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Student ID
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-sky-100 focus:bg-white focus:ring-2"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  Prefix must match programme: BCS · BID · BDM · BMD (letters are not case-sensitive).
                </p>
              </label>
            </div>
          )}

          <label className="text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-sky-100 focus:bg-white focus:ring-2"
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-sky-100 focus:bg-white focus:ring-2"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          {mode === 'register' && (
            <label className="text-sm font-medium text-slate-700">
              Confirm Password
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-sky-100 focus:bg-white focus:ring-2"
                required
              />
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {mode === 'login' ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : mode === 'login' ? (
              'Login to portal'
            ) : (
              'Create student account'
            )}
          </button>
        </form>
      </section>
    </PageShell>
  );
};

export default StudentLoginPage;
