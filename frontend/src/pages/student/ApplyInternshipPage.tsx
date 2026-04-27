import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import api from '../../services/api';

type InternshipDetail = {
  _id: string;
  title: string;
  description: string;
  location: string;
  duration: string;
  skills: string[];
  targetedProgrammes: string[];
  company: { _id: string; companyName: string };
  requiredAttachments: string[];
};

type Attachment = {
  type: string;
  url: string;
  filename: string;
  uploadedAt: string;
};

const FILE_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.gif';

const ApplyInternshipPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [internship, setInternship] = useState<InternshipDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const ATTACHMENT_TYPES = ['Resume', 'Portfolio', 'Transcript', 'Cover Letter', 'Certifications', 'Other'];

  type PendingDoc = { file: File; name: string };

  const [pendingDocs, setPendingDocs] = useState<PendingDoc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api
      .get<InternshipDetail>(`/internships/${id}`)
      .then((res) => { if (!cancelled) setInternship(res.data); })
      .catch(() => { if (!cancelled) setError('Could not load internship.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const getUploadedByType = (type: string): Attachment[] => {
    return attachments.filter((a) => {
      if (type === 'Other') return a.type !== 'Resume' && a.type !== 'Portfolio' && a.type !== 'Transcript' &&
        a.type !== 'Cover Letter' && a.type !== 'Certifications';
      return a.type === type;
    });
  };

  const createAppIfNeeded = async (): Promise<string> => {
    if (appId) return appId;
    const res = await api.post<{ _id: string }>('/applications', { internshipId: id });
    setAppId(res.data._id);
    return res.data._id;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setPendingDocs((prev) => [
      ...prev,
      ...files.map((file) => ({ file, name: '' })),
    ]);
    e.target.value = '';
  };

  const removePending = (index: number) => {
    setPendingDocs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDocUpload = async () => {
    const validDocs = pendingDocs.filter((d) => d.name.trim());
    if (validDocs.length === 0) return;
    setUploading(true);
    setUploadError(null);

    try {
      const currentAppId = await createAppIfNeeded();
      for (const { file, name } of validDocs) {
        const formData = new FormData();
        formData.append('files', file);
        formData.append('applicationId', currentAppId);
        formData.append('attachmentType', name.trim());
        const res = await api.post('/uploads/application-attachment', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setAttachments(res.data.attachments || []);
      }
      setPendingDocs([]);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setUploadError(e.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (url: string) => {
    if (!appId) return;
    try {
      const res = await api.delete('/uploads/application-attachment', {
        data: { applicationId: appId, url },
      });
      setAttachments(res.data.attachments || []);
    } catch {
      console.error('Failed to delete attachment');
    }
  };

  const viewFile = (url: string) => {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    window.open(`${base.replace(/\/api$/, '')}${url}`, '_blank', 'noopener,noreferrer');
  };

  const isPdf = (name: string) => name.toLowerCase().endsWith('.pdf');

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      await createAppIfNeeded();
    } catch {}
    setSubmitted(true);
    setTimeout(() => navigate('/student/applications'), 1500);
  };

  if (loading) {
    return (
      <PageShell title="Apply" subtitle="Loading…">
        <p className="py-12 text-center text-slate-500">Loading…</p>
      </PageShell>
    );
  }

  if (error || !internship) {
    return (
      <PageShell title="Apply" subtitle="">
        <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || 'Internship not found'}
        </div>
        <button type="button" onClick={() => navigate(-1)} className="mt-4 text-sm font-semibold text-sky-600 hover:text-sky-800">
          ← Go back
        </button>
      </PageShell>
    );
  }

  const required = internship.requiredAttachments || [];

  return (
    <PageShell
      title={`Apply: ${internship.title}`}
      subtitle={internship.company?.companyName || 'Company'}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <button type="button" onClick={() => navigate(-1)} className="text-sm font-semibold text-sky-600 hover:text-sky-800">
          ← Back
        </button>

        {submitted && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            Application submitted successfully!
          </div>
        )}

        {/* Internship info */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-base font-bold text-slate-900">{internship.title}</h2>
          <p className="text-sm text-slate-600">{internship.company?.companyName || 'Company'}</p>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
            <span>📍 {internship.location || '—'}</span>
            <span>⏰ {internship.duration || '—'}</span>
          </div>
        </div>

        {/* Required Documents - info only */}
        {required.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-base font-bold text-slate-900">Required Documents</h2>
            <p className="mb-4 text-xs text-slate-500">
              Please prepare the following documents before applying. Upload them using the Additional Documents section below.
            </p>
            <ul className="space-y-3">
              {required.map((type) => {
                const uploaded = getUploadedByType(type);
                return (
                  <li key={type} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                    <span className={`shrink-0 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                      uploaded.length > 0
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'border border-slate-300 text-slate-400'
                    }`}>
                      {uploaded.length > 0 ? '✓' : '·'}
                    </span>
                    <span className={`text-sm font-medium ${uploaded.length > 0 ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {type}
                    </span>
                    {uploaded.length > 0 && (
                      <span className="ml-auto text-xs text-emerald-600">
                        {uploaded.length} uploaded
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Additional Documents */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-base font-bold text-slate-900">Additional Documents</h2>
          <p className="mb-4 text-xs text-slate-500">
            Upload your documents (PDF or image, max 5MB each). Each file will be tagged with the selected type below.
          </p>

          {/* Uploaded list */}
          {attachments.length > 0 && (
            <ul className="mb-4 space-y-1.5">
              {attachments.map((att) => {
                const filename = att.filename || att.url.split('/').pop() || 'Document';
                return (
                  <li key={att.url} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    {isPdf(filename)
                      ? <svg className="shrink-0 text-red-400" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      : <svg className="shrink-0 text-sky-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    }
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">{att.type}</span>
                      <span className="text-xs text-slate-400">{filename}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => viewFile(att.url)} className="rounded px-2 py-1 text-xs font-medium text-sky-600 hover:bg-sky-100">View</button>
                      <button type="button" onClick={() => handleDeleteAttachment(att.url)} className="rounded px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-50 hover:text-red-600">Remove</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Upload form */}
          <div className="mb-3 flex flex-wrap items-end gap-2">
            <div className="shrink-0">
              <label className="mb-1 block text-xs font-semibold text-slate-600">Add files</label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-500 transition hover:border-sky-300 hover:bg-sky-50/50 hover:text-sky-600">
                <input ref={fileInputRef} type="file" accept={FILE_ACCEPT} onChange={handleFileChange} className="sr-only" multiple />
                + Add files
              </label>
            </div>
            <div className="shrink-0">
              <label className="mb-1 block text-xs font-semibold text-slate-600">&nbsp;</label>
              <button
                type="button"
                onClick={handleDocUpload}
                disabled={pendingDocs.filter((d) => d.name.trim()).length === 0 || uploading}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </div>

          {uploadError && (
            <p className="mb-2 text-xs text-red-600">{uploadError}</p>
          )}

          {/* Pending rows */}
          {pendingDocs.length > 0 && (
            <div className="mb-3 space-y-2">
              {pendingDocs.map((doc, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      value={doc.name}
                      onChange={(e) =>
                        setPendingDocs((prev) =>
                          prev.map((d, j) => (j === i ? { ...d, name: e.target.value } : d))
                        )
                      }
                      placeholder="Document name (e.g. Portfolio, Certificate)"
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-sky-500"
                    />
                  </div>
                  <span className="min-w-0 max-w-[200px] truncate text-xs text-slate-400" title={doc.file.name}>
                    {doc.file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePending(i)}
                    className="shrink-0 rounded px-1.5 py-1 text-xs text-red-400 hover:bg-red-50 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="pb-6">
          <button
            onClick={handleFinalSubmit}
            disabled={submitting || submitted}
            className="rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:bg-slate-300 disabled:text-slate-500"
          >
            {submitted ? 'Submitted!' : 'Submit Application'}
          </button>
        </div>
      </div>
    </PageShell>
  );
};

export default ApplyInternshipPage;
