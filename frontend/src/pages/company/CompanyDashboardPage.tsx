import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

type CompanyInternship = {
  _id: string;
  title: string;
  status: string;
  isDraft: boolean;
  createdAt: string;
  applicantCount: number;
  applicantCountByStatus: Record<string, number>;
};

type VerificationStatus = 'pending_review' | 'pending_documents' | 'approved' | 'rejected';

const statusLabels: { key: string; label: string; color: string }[] = [
  { key: 'Pending', label: 'New', color: 'bg-blue-100 text-blue-700' },
  { key: 'Reviewed', label: 'Review', color: 'bg-yellow-100 text-yellow-700' },
  { key: 'Interview', label: 'Interview', color: 'bg-sky-100 text-sky-700' },
  { key: 'Accepted', label: 'Offered', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'Rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' },
];

const CompanyDashboardPage = () => {
  const { user, updateUser } = useAuth();
  const [internships, setInternships] = useState<CompanyInternship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('pending_review');
  const [adminRequestMessage, setAdminRequestMessage] = useState('');

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreRef = useRef<HTMLInputElement>(null);
  const MAX_DOCS = 10;

  useEffect(() => {
    const verificationStatus = (user as any)?.verificationStatus || 'pending_review';
    const adminMsg = (user as any)?.adminRequestMessage || '';
    setVerificationStatus(verificationStatus);
    setAdminRequestMessage(adminMsg);
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<CompanyInternship[]>('/internships/company/me')
      .then((res) => {
        if (!cancelled) setInternships(res.data || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load internships');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isApproved = verificationStatus === 'approved';
  const totalInternships = internships.filter((i) => !i.isDraft).length;
  const totalApplicants = internships.reduce((sum, item) => sum + (item.applicantCount || 0), 0);
  const openPositions = internships.filter((item) => !item.isDraft && item.status === 'Open').length;
  const draftPositions = internships.filter((item) => item.isDraft).length;

  const safeDate = (value: string | undefined | null) => {
    if (!value) return '—';
    try {
      const d = new Date(value);
      const result = d.toISOString().slice(0, 10);
      return result !== '1970-01-01' ? result : '—';
    } catch {
      return '—';
    }
  };

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) return 'Only PDF or image files (JPG, PNG, WEBP, GIF) are allowed.';
    if (file.size > 5 * 1024 * 1024) return 'Each file must be smaller than 5MB.';
    if (pendingFiles.some((f) => f.name === file.name && f.size === file.size)) return 'This file is already selected.';
    if (pendingFiles.length >= MAX_DOCS) return `Maximum ${MAX_DOCS} files allowed.`;
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, refKey: 'fileInputRef' | 'addMoreRef') => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const ref = refKey === 'fileInputRef' ? fileInputRef : addMoreRef;
    const invalid = validateFile(files[0]);
    if (invalid) {
      setUploadMsg({ type: 'error', text: invalid });
      e.target.value = '';
      return;
    }
    setPendingFiles((prev) => [...prev, files[0]]);
    setUploadMsg(null);
    if (ref.current) ref.current.value = '';
  };

  const removePending = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!pendingFiles.length) return;
    setUploading(true);
    setUploadMsg(null);
    const formData = new FormData();
    pendingFiles.forEach((f) => formData.append('documents', f));
    try {
      await api.post('/companies/documents/submit', formData);
      const newStatus: VerificationStatus = 'pending_review';
      setVerificationStatus(newStatus);
      setAdminRequestMessage('');
      setPendingFiles([]);
      if (user) {
        updateUser({ ...user, verificationStatus: newStatus, adminRequestMessage: '' } as any);
      }
      setUploadMsg({ type: 'success', text: 'Documents submitted successfully. The admin will review them shortly.' });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setUploadMsg({ type: 'error', text: e.response?.data?.message || 'Upload failed. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <PageShell
      title="Company Dashboard"
      subtitle="Oversee your published internships and track key metrics for each position."
    >
      <div className="space-y-6">
        {/* Verification Status Banners */}
        {verificationStatus === 'pending_review' && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 shrink-0 text-blue-500" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <p className="font-semibold text-blue-800">Account Under Review</p>
                <p className="mt-1 text-sm text-blue-700">
                  Your company account is currently being reviewed by the administrator. You will be able to post internships once approved.
                </p>
              </div>
            </div>
          </div>
        )}

        {verificationStatus === 'pending_documents' && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 shrink-0 text-orange-500" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              <div className="flex-1">
                <p className="font-semibold text-orange-800">Additional Documents Required</p>
                {adminRequestMessage && (
                  <p className="mt-1 text-sm text-orange-700 bg-orange-100 rounded-lg px-3 py-2 border border-orange-200">
                    {adminRequestMessage}
                  </p>
                )}
                <p className="mt-2 text-sm text-orange-700">
                  Please upload the requested documents below. You will be able to post internships once the admin approves them.
                </p>

                {/* Upload UI */}
                {pendingFiles.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {pendingFiles.map((doc, i) => (
                      <li key={`${doc.name}-${doc.size}-${i}`} className="flex items-center gap-2 rounded-lg border border-orange-200 bg-white px-3 py-2">
                        {doc.type === 'application/pdf' ? (
                          <svg className="shrink-0 text-red-500" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8" fill="none" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        ) : (
                          <svg className="shrink-0 text-orange-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                            <polyline points="21 15 16 10 5 21"/>
                          </svg>
                        )}
                        <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{doc.name}</span>
                        <span className="text-xs text-slate-400">{(doc.size / 1024 / 1024).toFixed(1)} MB</span>
                        <button
                          type="button"
                          onClick={() => removePending(i)}
                          className="shrink-0 text-base font-medium text-slate-400 transition hover:text-red-500"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {pendingFiles.length > 0 && pendingFiles.length < MAX_DOCS && (
                  <label className="mt-2 flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-orange-300 bg-orange-50 px-4 py-2 text-sm text-orange-600 transition hover:border-orange-400 hover:bg-orange-100">
                    <input
                      ref={addMoreRef}
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      onChange={(e) => handleFileChange(e, 'addMoreRef')}
                    />
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add more
                  </label>
                )}

                {pendingFiles.length === 0 && (
                  <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-600 transition hover:border-orange-400 hover:bg-orange-100">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      onChange={(e) => handleFileChange(e, 'fileInputRef')}
                    />
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Choose file
                  </label>
                )}

                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!pendingFiles.length || uploading}
                  className="mt-3 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? `Submitting ${pendingFiles.length} document(s)...` : pendingFiles.length > 0 ? `Submit ${pendingFiles.length} document(s)` : 'Submit Documents'}
                </button>

                {uploadMsg && (
                  <div className={`mt-3 rounded-lg px-4 py-2.5 text-sm font-medium ${
                    uploadMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {uploadMsg.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {verificationStatus === 'rejected' && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 shrink-0 text-red-500" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <div>
                <p className="font-semibold text-red-800">Account Rejected</p>
                <p className="mt-1 text-sm text-red-700">
                  {adminRequestMessage || 'Your company registration has been rejected. Please contact the administrator for more information.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Total Internships</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{totalInternships}</p>
            <p className="mt-1 text-xs text-slate-500">{openPositions} currently open</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Total Applicants</p>
            <p className="mt-2 text-3xl font-bold text-sky-600">{totalApplicants}</p>
            <p className="mt-1 text-xs text-slate-500">Across all positions</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Active Positions</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{openPositions}</p>
            <p className="mt-1 text-xs text-slate-500">Currently recruiting</p>
          </div>
        </div>

        {/* Published Internships List */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Published Internships</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:justify-end">
              <Link
                to="/company/profile"
                className="text-sm font-semibold text-sky-600 hover:text-sky-800"
              >
                Company profile
              </Link>
              <span className="hidden text-slate-300 sm:inline" aria-hidden>
                |
              </span>
              <Link
                to="/company/applicants"
                className="text-sm font-semibold text-sky-600 hover:text-sky-800"
              >
                All applicants
              </Link>
              <span className="hidden text-slate-300 sm:inline" aria-hidden>
                |
              </span>
              <Link
                to={isApproved ? '/company/internships/new' : '#'}
                onClick={(e) => { if (!isApproved) e.preventDefault(); }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                  isApproved
                    ? 'bg-sky-600 text-white hover:bg-sky-700'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed pointer-events-none'
                }`}
              >
                + Post New Internship
              </Link>
            </div>
          </div>

          {loading && (
            <p className="py-8 text-center text-slate-500">Loading internships...</p>
          )}
          {error && (
            <p className="py-8 text-center text-red-600">{error}</p>
          )}
          {!loading && !error && internships.filter(i => !i.isDraft).length === 0 && !loading && !error && internships.filter(i => i.isDraft).length === 0 && (
            <div className="py-12 text-center">
              <p className="text-slate-600">No internships posted yet.</p>
              {isApproved && (
                <Link
                  to="/company/internships/new"
                  className="mt-3 inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                >
                  + Post New Internship
                </Link>
              )}
            </div>
          )}

          {/* Drafts Section */}
          {!loading && !error && internships.filter(i => i.isDraft).length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="mb-4 text-sm font-semibold text-amber-800">Drafts</h2>
              <div className="space-y-3">
                {internships.filter(i => i.isDraft).map((internship) => (
                  <div key={internship._id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-white p-4">
                    <div>
                      <p className="font-semibold text-slate-900">{internship.title}</p>
                      <p className="text-xs text-slate-500">Saved {safeDate(internship.createdAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={isApproved ? `/company/internships/${internship._id}/edit` : '#'}
                        onClick={(e) => { if (!isApproved) e.preventDefault(); }}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          isApproved
                            ? 'bg-amber-600 text-white hover:bg-amber-700'
                            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Edit & Publish
                      </Link>
                      <button
                        onClick={async () => {
                          if (!window.confirm('Delete this draft?')) return;
                          try {
                            await api.delete(`/internships/${internship._id}`);
                            setInternships((prev) => prev.filter((i) => i._id !== internship._id));
                          } catch {}
                        }}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Published Internships List */}
          {!loading && !error && internships.filter(i => !i.isDraft && i.isPublished !== false).length > 0 && (
            <div className="space-y-4">
              {internships.filter(i => !i.isDraft && i.isPublished !== false).map((internship) => {
                const postedDate = safeDate(internship.createdAt);
                return (
                  <div
                    key={internship._id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-5 transition hover:border-sky-300 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-slate-900">{internship.title}</h3>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              internship.status === 'Open'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {internship.status || 'Open'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">Posted: {postedDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-sky-600">{internship.applicantCount ?? 0}</p>
                        <p className="text-xs text-slate-500">applicants</p>
                      </div>
                    </div>

                    {/* Applicant Status Breakdown */}
                    <div className="mt-4 grid grid-cols-5 gap-2">
                      {statusLabels.map(({ key, label, color }) => (
                        <div key={label} className="rounded-lg border border-slate-200 bg-white p-2 text-center">
                          <p className="text-xs font-medium text-slate-500">{label}</p>
                          <p className={`mt-1 text-lg font-bold ${color}`}>
                            {key === 'Interview' ? 0 : (internship.applicantCountByStatus?.[key] ?? 0)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Link
                        to={`/company/applicants?internship=${internship._id}`}
                        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                      >
                        View Applicants
                      </Link>
                      <Link
                        to={`/company/internships/${internship._id}/edit`}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Edit Position
                      </Link>
                      <button
                        onClick={async () => {
                          const newStatus = internship.status === 'Open' ? 'Closed' : 'Open';
                          await api.put(`/internships/${internship._id}`, { status: newStatus });
                          setInternships((prev) =>
                            prev.map((i) => (i._id === internship._id ? { ...i, status: newStatus } : i))
                          );
                        }}
                        className={`rounded-lg border px-4 py-2 text-sm font-semibold hover:opacity-80 ${
                          internship.status === 'Open'
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {internship.status === 'Open' ? 'Close Position' : 'Reopen Position'}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const n = internship.applicantCount ?? 0;
                          const msg =
                            n > 0
                              ? `Permanently delete this position? This will also remove ${n} application record(s). This cannot be undone.`
                              : 'Permanently delete this position? This cannot be undone.';
                          if (!window.confirm(msg)) return;
                          try {
                            await api.delete(`/internships/${internship._id}`);
                            setInternships((prev) => prev.filter((i) => i._id !== internship._id));
                          } catch (e: unknown) {
                            const err = e as { response?: { data?: { message?: string } } };
                            window.alert(err.response?.data?.message || 'Failed to delete position.');
                          }
                        }}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default CompanyDashboardPage;
