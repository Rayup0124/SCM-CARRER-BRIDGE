import { FormEvent, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const CompanyLoginPage = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [hrEmail, setHrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [description, setDescription] = useState('');
  const [verificationDocs, setVerificationDocs] = useState<File[]>([]);
  const verificationInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const MAX_DOCS = 10;

  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading, login } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (user?.role === 'company') {
        navigate('/company/dashboard', { replace: true });
      } else if (user?.role === 'student') {
        navigate('/student/dashboard', { replace: true });
      } else if (user?.role === 'admin') {
        navigate('/admin/companies', { replace: true });
      }
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const clearAllDocs = () => {
    setVerificationDocs([]);
    if (verificationInputRef.current) verificationInputRef.current.value = '';
    if (addMoreInputRef.current) addMoreInputRef.current.value = '';
  };

  const removeDoc = (index: number) => {
    setVerificationDocs((prev) => prev.filter((_, i) => i !== index));
  };

  const validateAndAddDoc = (file: File) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only PDF or image files (JPG, PNG, WEBP, GIF) are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Each file must be smaller than 5MB.');
      return;
    }
    if (verificationDocs.some((d) => d.name === file.name && d.size === file.size)) {
      setError('This file is already selected.');
      return;
    }
    if (verificationDocs.length >= MAX_DOCS) {
      setError(`Maximum ${MAX_DOCS} files allowed.`);
      return;
    }
    setError(null);
    setVerificationDocs((prev) => [...prev, file]);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        const formData = new FormData();
        formData.append('companyName', companyName);
        formData.append('hrEmail', hrEmail);
        formData.append('password', password);
        formData.append('description', description);
        verificationDocs.forEach((doc) => formData.append('documents', doc));

        await api.post('/auth/register/company', formData);
        setMode('login');
        setError('Registration successful! Please login with your HR email and password.');
        setCompanyName('');
        setDescription('');
        clearAllDocs();
      } else {
        const response = await api.post('/auth/login', {
          email: hrEmail,
          password,
        });

        const { token, role, verificationStatus, adminRequestMessage, profile } = response.data;

        if (role !== 'company') {
          setError('Invalid company credentials');
          return;
        }

        const companyUser = {
          _id: profile.id,
          name: profile.companyName,
          email: profile.hrEmail,
          role: role,
          description: profile.description || '',
          website: profile.website || '',
          documentUrls: profile.documentUrls,
          verificationStatus,
          adminRequestMessage: adminRequestMessage || '',
        };

        login(token, companyUser as any);
        navigate('/company/dashboard');
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string; reason?: string } } };
      const reason = axiosError.response?.data?.reason;
      if (reason === 'company_rejected') {
        setError('Your account has been rejected. Please contact the administrator for more information.');
      } else {
        const message = axiosError.response?.data?.message || 'Unable to connect to the server';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setError(null);
    clearAllDocs();
    setMode(mode === 'login' ? 'register' : 'login');
  };

  return (
    <PageShell title="Company Access" subtitle="Gate for HR partners before publishing opportunities.">
      <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-500">Company portal</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            {mode === 'login' ? 'Sign in to continue' : 'Register your company'}
          </h2>
        </div>

        <div className="mb-6 inline-flex rounded-full bg-slate-100 p-1 text-xs font-medium text-slate-600">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); clearAllDocs(); }}
            className={`rounded-full px-4 py-1 transition ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); clearAllDocs(); }}
            className={`rounded-full px-4 py-1 transition ${
              mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className={`mb-4 rounded-lg border p-3 text-sm ${
            error.includes('rejected')
              ? 'bg-red-50 border-red-200'
              : mode === 'register' && error.includes('successful')
              ? 'bg-green-50 border-green-200 text-green-600'
              : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            <p className={error.includes('rejected') ? 'text-red-700' : ''}>{error}</p>
            {error.includes('rejected') && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await api.post('/auth/reactivate-request', { email: hrEmail });
                    const { company: companyData } = res.data;
                    setCompanyName(companyData?.companyName || '');
                    setHrEmail(companyData?.hrEmail || hrEmail);
                    setDescription(companyData?.description || '');
                    clearAllDocs();
                    setMode('register');
                    setError(null);
                    window.alert(res.data.message);
                  } catch (err) {
                    const e = err as { response?: { data?: { message?: string } } };
                    window.alert(e.response?.data?.message || 'Request failed');
                  }
                }}
                className="mt-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                Request Reactivation
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <label className="text-sm font-medium text-slate-700">
                Company Name
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-sky-100 focus:bg-white focus:ring-2"
                  required
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                HR Email
                <input
                  type="email"
                  value={hrEmail}
                  onChange={(e) => setHrEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-sky-100 focus:bg-white focus:ring-2"
                  required
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Company Description
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-sky-100 focus:bg-white focus:ring-2"
                  rows={3}
                  required
                />
              </label>
              <div>
                <span className="text-sm font-medium text-slate-700">
                  Verification documents
                  {verificationDocs.length > 0 && (
                    <span className="ml-2 font-normal text-slate-500">
                      {verificationDocs.length}/{MAX_DOCS}
                    </span>
                  )}
                  <span className="ml-2 font-normal text-sky-600">(optional)</span>
                </span>
                <p className="mt-1 text-xs text-slate-500">
                  Upload SSM certificate, business registration, or any proof of company legitimacy. PDF or image (JPG, PNG, WEBP). Each max 5MB.
                </p>

                {verificationDocs.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {verificationDocs.map((doc, i) => (
                      <li
                        key={`${doc.name}-${doc.size}-${i}`}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        {doc.type === 'application/pdf' ? (
                          <svg className="shrink-0 text-red-500" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8" fill="none" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        ) : (
                          <svg className="shrink-0 text-sky-500" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                            <polyline points="21 15 16 10 5 21" fill="none" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        )}
                        <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{doc.name}</span>
                        <span className="text-xs text-slate-400">{(doc.size / 1024 / 1024).toFixed(1)} MB</span>
                        <button
                          type="button"
                          onClick={() => removeDoc(i)}
                          className="shrink-0 text-base font-medium text-slate-400 transition hover:text-red-500"
                          aria-label={`Remove ${doc.name}`}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {verificationDocs.length > 0 && verificationDocs.length < MAX_DOCS && (
                  <label className="mt-2 flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 transition hover:border-sky-300 hover:bg-sky-50/50 hover:text-sky-600">
                    <input
                      ref={addMoreInputRef}
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) validateAndAddDoc(file);
                        e.target.value = '';
                      }}
                    />
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add more
                  </label>
                )}

                {verificationDocs.length === 0 && (
                  <label className="mt-2 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500 transition hover:border-sky-300 hover:bg-sky-50/50">
                    <input
                      ref={verificationInputRef}
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) validateAndAddDoc(file);
                        e.target.value = '';
                      }}
                    />
                    Choose file
                  </label>
                )}
              </div>
            </>
          )}

          {mode === 'login' && (
            <label className="text-sm font-medium text-slate-700">
              HR Email
              <input
                type="email"
                value={hrEmail}
                onChange={(e) => setHrEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-sky-100 focus:bg-white focus:ring-2"
                required
              />
            </label>
          )}

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
                className="shrink-0 text-xs font-semibold text-sky-600 hover:text-sky-700"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-50"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Login to portal' : 'Register company'}
          </button>
        </form>
      </section>
    </PageShell>
  );
};

export default CompanyLoginPage;
