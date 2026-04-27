import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const CompanyProfilePage = () => {
  const { user, updateUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    companyName: user?.name || '',
    description: (user as any)?.description || '',
    website: (user as any)?.website || '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreRef = useRef<HTMLInputElement>(null);
  const MAX_DOCS = 10;

  useEffect(() => {
    if (user) {
      setForm({
        companyName: user.name || '',
        description: (user as any).description || '',
        website: (user as any).website || '',
      });
    }
  }, [user]);

  const buildFileUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    return `${base.replace(/\/api$/, '')}${url}`;
  };

  const handleSave = async () => {
    if (!form.companyName.trim()) {
      setMsg({ type: 'error', text: 'Company name cannot be empty.' });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await api.put('/companies/profile', {
        companyName: form.companyName.trim(),
        description: form.description.trim(),
        website: form.website.trim(),
      });
      const updated = res.data.company;
      const refreshed: typeof user = {
        ...user!,
        name: updated.companyName,
        description: updated.description || '',
        website: updated.website || '',
      };
      updateUser(refreshed as any);
      setEditing(false);
      setMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setMsg({ type: 'error', text: e.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      companyName: user?.name || '',
      description: (user as any).description || '',
      website: (user as any).website || '',
    });
    setEditing(false);
    setMsg(null);
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
      await api.post('/uploads/company-document', formData);
      setUploadMsg({ type: 'success', text: `${pendingFiles.length} document(s) uploaded successfully!` });
      setPendingFiles([]);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setUploadMsg({ type: 'error', text: e.response?.data?.message || 'Upload failed. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <PageShell
      title="Company Profile"
      subtitle="Manage your company information and upload verification documents."
    >
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Company Info */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Company Information
            </h3>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-sm font-semibold text-sky-600 hover:text-sky-800"
              >
                Edit
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Company Name</label>
              {editing ? (
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-600">
                  {user?.name || 'N/A'}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">HR Email</label>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-600">
                {user?.email || 'N/A'}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Website</label>
              {editing ? (
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  placeholder="https://example.com"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-600">
                  {form.website ? (
                    <a
                      href={form.website.startsWith('http') ? form.website : `https://${form.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 hover:text-sky-800 hover:underline"
                    >
                      {form.website}
                    </a>
                  ) : (
                    <span className="text-slate-400">Not set</span>
                  )}
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">About Company</label>
              {editing ? (
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  placeholder="Introduce your company, team culture, and what you do..."
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-600 min-h-[80px]">
                  {form.description ? (
                    <p className="whitespace-pre-wrap">{form.description}</p>
                  ) : (
                    <span className="text-slate-400">No description yet.</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {editing && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}

          {msg && (
            <div className={`mt-3 rounded-lg px-4 py-2.5 text-sm font-medium ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {msg.text}
            </div>
          )}

          <div className="mt-4">
            <Link to="/company/dashboard" className="text-sm font-medium text-sky-600 hover:text-sky-800">
              &larr; Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Document Upload */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Verification Documents
          </h3>
          <p className="mb-4 text-xs text-slate-500">
            Upload PDF or image (JPG, PNG, WEBP). Each max 5MB, up to {MAX_DOCS} files. New companies submit these at registration.
          </p>

          {/* Current documents */}
          {user?.documentUrls && user.documentUrls.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Already uploaded ({user.documentUrls.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {user.documentUrls.map((url) => {
                  const filename = url.split('/').pop() || 'Document';
                  return (
                    <a
                      key={url}
                      href={`buildFileUrl(url)`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 shadow-sm hover:bg-emerald-100 transition-colors"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      {filename.length > 30 ? `${filename.slice(0, 28)}…` : filename}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pending upload list */}
          {pendingFiles.length > 0 && (
            <ul className="mb-3 space-y-1.5">
              {pendingFiles.map((doc, i) => (
                <li key={`${doc.name}-${doc.size}-${i}`} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  {doc.type === 'application/pdf' ? (
                    <svg className="shrink-0 text-red-500" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8" fill="none" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  ) : (
                    <svg className="shrink-0 text-sky-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none"/>
                      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                      <polyline points="21 15 16 10 5 21" fill="none"/>
                    </svg>
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{doc.name}</span>
                  <span className="text-xs text-slate-400">{(doc.size / 1024 / 1024).toFixed(1)} MB</span>
                  <button
                    type="button"
                    onClick={() => removePending(i)}
                    className="shrink-0 text-base font-medium text-slate-400 transition hover:text-red-500"
                    aria-label={`Remove ${doc.name}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Add more */}
          {pendingFiles.length > 0 && pendingFiles.length < MAX_DOCS && (
            <label className="mb-3 flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 transition hover:border-sky-300 hover:bg-sky-50/50 hover:text-sky-600">
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

          {/* Choose file (when list empty) */}
          {pendingFiles.length === 0 && (
            <label className="mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500 transition hover:border-sky-300 hover:bg-sky-50/50">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => handleFileChange(e, 'fileInputRef')}
              />
              Choose file
            </label>
          )}

          {/* Upload button */}
          <button
            type="button"
            onClick={handleUpload}
            disabled={!pendingFiles.length || uploading}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? `Uploading ${pendingFiles.length} file(s)...` : pendingFiles.length > 0 ? `Upload ${pendingFiles.length} document(s)` : 'Upload'}
          </button>

          {uploadMsg && (
            <div className={`mt-3 rounded-lg px-4 py-2.5 text-sm font-medium ${uploadMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {uploadMsg.text}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default CompanyProfilePage;
