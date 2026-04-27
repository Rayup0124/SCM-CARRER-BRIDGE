import { useState, useEffect, useMemo, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { COMMON_SKILL_SUGGESTIONS } from '../../constants/profileOptions';

const RESUME_ACCEPT_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const RESUME_FILE_ACCEPT =
  'application/pdf,image/jpeg,image/png,image/webp,image/gif,.pdf,.jpg,.jpeg,.png,.webp,.gif';

const MAX_RESUMES = 10;

const StudentProfilePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [programme, setProgramme] = useState('');
  const [allowedProgrammes, setAllowedProgrammes] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [pendingResumeFiles, setPendingResumeFiles] = useState<File[]>([]);
  const [serverResumeUrls, setServerResumeUrls] = useState<string[]>([]);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [removingResumeUrl, setRemovingResumeUrl] = useState<string | null>(null);
  const [resumeMsg, setResumeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const resumeChooseRef = useRef<HTMLInputElement>(null);
  const resumeAddMoreRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const profileRes = await api.get('/users/me');
        const data = profileRes.data;
        setName(data.name || '');
        setProgramme(data.programme || '');
        setSkills(data.skills || []);
        const urls =
          data.resumeUrls?.length > 0
            ? data.resumeUrls
            : data.resumeUrl
              ? [data.resumeUrl]
              : [];
        setServerResumeUrls(urls);
      } catch {
        if (user) {
          setName(user.name || '');
          setProgramme(user.programme || '');
          setSkills(user.skills || []);
        }
      }
      try {
        const progRes = await api.get('/users/programmes');
        setAllowedProgrammes(progRes.data.programmes || []);
      } catch {
        setAllowedProgrammes([]);
      }
    };
    load();
  }, [user]);

  const buildFileUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    return `${base.replace(/\/api$/, '')}${url}`;
  };

  const validatePendingResume = (file: File, pending: File[]): string | null => {
    if (!RESUME_ACCEPT_MIME.has(file.type)) {
      return 'Only PDF or image files (JPEG, PNG, WebP, GIF) are allowed.';
    }
    if (file.size > 5 * 1024 * 1024) {
      return 'Each file must be smaller than 5MB.';
    }
    if (pending.some((f) => f.name === file.name && f.size === file.size)) {
      return 'This file is already selected.';
    }
    if (serverResumeUrls.length + pending.length >= MAX_RESUMES) {
      return `Maximum ${MAX_RESUMES} resume files allowed.`;
    }
    return null;
  };

  const handleResumeFileInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    ref: React.RefObject<HTMLInputElement | null>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const invalid = validatePendingResume(file, pendingResumeFiles);
    if (invalid) {
      setResumeMsg({ type: 'error', text: invalid });
      e.target.value = '';
      return;
    }

    setPendingResumeFiles((prev) => [...prev, file]);
    setResumeMsg(null);
    e.target.value = '';
    if (ref.current) ref.current.value = '';
  };

  const removePendingResume = (index: number) => {
    setPendingResumeFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveUploadedResume = async (url: string) => {
    setRemovingResumeUrl(url);
    setResumeMsg(null);
    try {
      const res = await api.delete('/uploads/resume', { data: { url } });
      const urls = res.data.resumeUrls || [];
      setServerResumeUrls(urls);
      setResumeMsg({ type: 'success', text: 'Resume removed.' });
      if (user) {
        updateUser({ ...user, resumeUrl: res.data.resumeUrl, resumeUrls: urls });
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setResumeMsg({
        type: 'error',
        text: error.response?.data?.message || 'Failed to remove resume. Please try again.',
      });
    } finally {
      setRemovingResumeUrl(null);
    }
  };

  const handleResumeUpload = async () => {
    if (!pendingResumeFiles.length) return;
    if (serverResumeUrls.length + pendingResumeFiles.length > MAX_RESUMES) {
      setResumeMsg({ type: 'error', text: `Maximum ${MAX_RESUMES} resume files allowed.` });
      return;
    }
    setUploadingResume(true);
    setResumeMsg(null);

    const formData = new FormData();
    pendingResumeFiles.forEach((f) => formData.append('files', f));

    try {
      const res = await api.post('/uploads/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const urls = res.data.resumeUrls || [];
      setResumeMsg({
        type: 'success',
        text:
          pendingResumeFiles.length > 1
            ? `${pendingResumeFiles.length} files uploaded successfully!`
            : 'Resume uploaded successfully!',
      });
      setPendingResumeFiles([]);
      setServerResumeUrls(urls);
      if (user) {
        updateUser({
          ...user,
          resumeUrl: res.data.resumeUrl,
          resumeUrls: urls,
        });
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setResumeMsg({
        type: 'error',
        text: error.response?.data?.message || 'Upload failed. Please try again.',
      });
    } finally {
      setUploadingResume(false);
    }
  };

  const programmeSelectOptions = useMemo(() => {
    const list = [...allowedProgrammes];
    if (programme && !list.includes(programme)) {
      return [programme, ...list];
    }
    return list;
  }, [allowedProgrammes, programme]);

  const addSkill = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(skillInput);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await api.patch('/users/me', {
        name: name.trim(),
        programme,
        skills,
      });

      if (user) {
        updateUser({ ...user, ...res.data });
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update profile. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      title="Edit Profile"
      subtitle="Update your personal information and skills."
    >
      <div className="mx-auto max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Read-only Info */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Account Information
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Student ID
                </label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-600">
                  {user?.studentId || 'N/A'}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-600">
                  {user?.email || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Personal Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="name">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Wei Chen"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="programme">
                  Programme / Major
                </label>
                <select
                  id="programme"
                  value={programme}
                  onChange={(e) => setProgramme(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="" disabled>
                    {programmeSelectOptions.length ? 'Select your programme' : 'Loading programmes…'}
                  </option>
                  {programmeSelectOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-slate-500">
                  You can only choose from the official list. Contact admin if your programme is missing.
                </p>
              </div>

              {/* Skills Tag Input */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Skills
                </label>
                <p className="mb-2 text-xs text-slate-500">
                  Suggested skills (click to add). You can still type your own below.
                </p>
                <div className="mb-3 flex flex-wrap gap-2">
                  {COMMON_SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addSkill(s)}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-sky-400 hover:bg-sky-200 hover:text-sky-800"
                        aria-label={`Remove ${skill}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    onBlur={() => skillInput && addSkill(skillInput)}
                    placeholder={skills.length === 0 ? 'Type a skill and press Enter' : ''}
                    className="min-w-[140px] flex-1 bg-transparent py-0.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Type a skill and press Enter or comma to add.
                </p>
              </div>
            </div>
          </div>

          {/* Resume Upload */}
          <div id="resume" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-1 flex flex-wrap items-baseline gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Resume</h3>
              {(serverResumeUrls.length > 0 || pendingResumeFiles.length > 0) && (
                <span className="text-xs font-normal text-slate-500">
                  {serverResumeUrls.length + pendingResumeFiles.length}/{MAX_RESUMES}
                </span>
              )}
            </div>
            <p className="mb-4 text-xs text-slate-500">
              PDF or image (JPEG, PNG, WebP, GIF). Each max 5MB, up to {MAX_RESUMES} files. Companies can view
              these when you apply. Choose files, then click Upload to save.
            </p>

            {serverResumeUrls.length > 0 && (
              <div className="mb-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Uploaded ({serverResumeUrls.length})
                </p>
                <ul className="space-y-1.5">
                  {serverResumeUrls.map((url) => {
                    const filename = url.split('/').pop() || 'Resume';
                    const isPdf = filename.toLowerCase().endsWith('.pdf');
                    const isRemoving = removingResumeUrl === url;
                    return (
                      <li
                        key={url}
                        className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-2 py-2 pl-3 sm:px-3"
                      >
                        {isPdf ? (
                          <svg className="shrink-0 text-red-500" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" fill="none" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        ) : (
                          <svg className="shrink-0 text-sky-500" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                            <polyline points="21 15 16 10 5 21" fill="none" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        )}
                        <a
                          href={`buildFileUrl(url)`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-w-0 flex-1 truncate text-sm font-medium text-emerald-800 underline decoration-emerald-600/40 hover:text-emerald-900"
                        >
                          {filename.length > 40 ? `${filename.slice(0, 38)}…` : filename}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveUploadedResume(url)}
                          disabled={isRemoving || !!removingResumeUrl}
                          className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg leading-none text-emerald-700 transition hover:bg-red-100 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Remove this resume"
                          aria-label={`Remove ${filename}`}
                        >
                          {isRemoving ? (
                            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                          ) : '×'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {pendingResumeFiles.length > 0 && (
              <div className="mb-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Selected — not uploaded yet ({pendingResumeFiles.length})
                </p>
                <ul className="space-y-1.5">
                  {pendingResumeFiles.map((doc, i) => (
                    <li
                      key={`${doc.name}-${doc.size}-${doc.lastModified}`}
                      className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-2 py-2 pl-3 sm:px-3"
                    >
                      {doc.type === 'application/pdf' ? (
                        <svg className="shrink-0 text-red-500" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" fill="none" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      ) : (
                        <svg className="shrink-0 text-sky-500" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                          <polyline points="21 15 16 10 5 21" fill="none" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-emerald-800">{doc.name}</span>
                      <div className="hidden shrink-0 items-center gap-2 sm:flex">
                        <span className="text-xs text-emerald-600/80">{(doc.size / 1024 / 1024).toFixed(1)} MB</span>
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          Not saved
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePendingResume(i)}
                        className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg leading-none text-emerald-700 transition hover:bg-red-100 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
                        title="Remove from list"
                        aria-label={`Remove ${doc.name} from upload list`}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {serverResumeUrls.length + pendingResumeFiles.length < MAX_RESUMES && (
              <>
                {pendingResumeFiles.length > 0 && (
                  <label className="mb-3 flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 transition hover:border-sky-300 hover:bg-sky-50/50 hover:text-sky-600">
                    <input
                      ref={resumeAddMoreRef}
                      type="file"
                      accept={RESUME_FILE_ACCEPT}
                      className="sr-only"
                      onChange={(e) => handleResumeFileInput(e, resumeAddMoreRef)}
                    />
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add more
                  </label>
                )}
                {pendingResumeFiles.length === 0 && (
                  <label className="mb-3 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500 transition hover:border-sky-300 hover:bg-sky-50/50">
                    <input
                      ref={resumeChooseRef}
                      type="file"
                      accept={RESUME_FILE_ACCEPT}
                      className="sr-only"
                      onChange={(e) => handleResumeFileInput(e, resumeChooseRef)}
                    />
                    Choose file
                  </label>
                )}
              </>
            )}

            <button
              type="button"
              onClick={handleResumeUpload}
              disabled={!pendingResumeFiles.length || uploadingResume}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploadingResume
                ? `Uploading ${pendingResumeFiles.length} file(s)...`
                : pendingResumeFiles.length > 0
                  ? `Upload ${pendingResumeFiles.length} file(s)`
                  : 'Upload'}
            </button>

            {resumeMsg && (
              <div
                className={`mt-3 rounded-lg px-4 py-2.5 text-sm font-medium ${
                  resumeMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {resumeMsg.text}
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <div
              className={`rounded-lg px-4 py-3 text-sm font-medium ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/student/dashboard')}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
};

export default StudentProfilePage;
