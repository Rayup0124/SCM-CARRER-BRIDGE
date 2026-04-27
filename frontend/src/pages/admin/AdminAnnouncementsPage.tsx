import { useState, useRef, useEffect } from 'react';
import PageShell from '../../components/PageShell';
import api from '../../services/api';

type Announcement = {
  _id: string;
  title: string;
  content: string;
  postedBy: string;
  attachments: string[];
  createdAt: string;
};

const MAX_ATTACHMENTS = 5;
const ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp,image/gif';
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024;

const AdminAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [postedBy, setPostedBy] = useState('SCM Admin');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editPostedBy, setEditPostedBy] = useState('');
  const [editExistingAttachments, setEditExistingAttachments] = useState<string[]>([]);
  const [editPendingFiles, setEditPendingFiles] = useState<File[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = () => {
    setLoading(true);
    api
      .get<Announcement[]>('/announcements')
      .then((res) => setAnnouncements(res.data || []))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
  };

  const buildFileUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    return `${base.replace(/\/api$/, '')}${url}`;
  };

  const validateFile = (file: File, existingPending: File[]): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) return 'Only PDF or image files are allowed.';
    if (file.size > MAX_SIZE) return 'Each file must be smaller than 5MB.';
    if (existingPending.some((f) => f.name === file.name && f.size === file.size)) return 'This file is already selected.';
    if (existingPending.length >= MAX_ATTACHMENTS) return `Maximum ${MAX_ATTACHMENTS} attachments allowed.`;
    return null;
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File[]>>,
    setError: React.Dispatch<React.SetStateAction<string>>,
    ref: React.RefObject<HTMLInputElement | null>,
    pending: File[],
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const invalid = validateFile(files[0], pending);
    if (invalid) {
      setError(invalid);
      e.target.value = '';
      return;
    }
    setter((prev) => [...prev, files[0]]);
    setError('');
    if (ref.current) ref.current.value = '';
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (file: File) => file.type.startsWith('image/');

  // ---------- Post new ----------
  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setPosting(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      formData.append('postedBy', postedBy.trim() || 'SCM Admin');
      pendingFiles.forEach((f) => formData.append('attachments', f));

      const res = await api.post('/announcements', formData);
      setAnnouncements((prev) => [res.data, ...prev]);
      setTitle('');
      setContent('');
      setPostedBy('SCM Admin');
      setPendingFiles([]);
      setShowForm(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setUploadError(e.response?.data?.message || 'Failed to post announcement.');
    } finally {
      setPosting(false);
    }
  };

  const handleCancelNew = () => {
    setShowForm(false);
    setTitle('');
    setContent('');
    setPostedBy('SCM Admin');
    setPendingFiles([]);
    setUploadError('');
  };

  // ---------- Edit ----------
  const startEdit = (ann: Announcement) => {
    setEditingId(ann._id);
    setEditTitle(ann.title);
    setEditContent(ann.content);
    setEditPostedBy(ann.postedBy);
    setEditExistingAttachments(ann.attachments || []);
    setEditPendingFiles([]);
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
    setEditPostedBy('');
    setEditExistingAttachments([]);
    setEditPendingFiles([]);
    setEditError('');
  };

  const removeExistingAttachment = async (url: string) => {
    if (!editingId) return;
    try {
      await api.delete(`/announcements/${editingId}/attachments`, { data: { url } });
      setEditExistingAttachments((prev) => prev.filter((u) => u !== url));
    } catch {
      console.error('Failed to remove attachment');
    }
  };

  const removePendingEditFile = (index: number) => {
    setEditPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editContent.trim()) return;
    if (!editingId) return;
    setEditSaving(true);
    setEditError('');
    try {
      const formData = new FormData();
      formData.append('title', editTitle.trim());
      formData.append('content', editContent.trim());
      formData.append('postedBy', editPostedBy.trim() || 'SCM Admin');
      editPendingFiles.forEach((f) => formData.append('attachments', f));

      const res = await api.put(`/announcements/${editingId}`, formData);
      setAnnouncements((prev) =>
        prev.map((a) => (a._id === editingId ? res.data : a)),
      );
      cancelEdit();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setEditError(e.response?.data?.message || 'Failed to update announcement.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this announcement and its attachments?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
    } catch {
      console.error('Failed to delete');
    }
  };

  return (
    <PageShell
      title="Manage Announcements"
      subtitle="Post system-wide announcements visible to all students."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            All Announcements ({announcements.length})
          </h2>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
          >
            {showForm ? 'Cancel' : '+ Post New'}
          </button>
        </div>

        {/* ── New Post Form ── */}
        {showForm && (
          <form
            onSubmit={handlePost}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h3 className="mb-4 font-semibold text-slate-800">Post New Announcement</h3>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">Posted By</label>
              <input
                type="text"
                value={postedBy}
                onChange={(e) => setPostedBy(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-sky-100"
                placeholder="SCM Admin"
              />
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-sky-100"
                placeholder="Announcement title"
                required
              />
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">Content *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-sky-100"
                placeholder="Write your announcement here..."
                required
              />
            </div>
            <AttachmentSection
              pendingFiles={pendingFiles}
              setPendingFiles={setPendingFiles}
              uploadError={uploadError}
              setUploadError={setUploadError}
              fileInputRef={fileInputRef}
              maxAttachments={MAX_ATTACHMENTS}
              onFileChange={(e) => handleFileChange(e, setPendingFiles, setUploadError, fileInputRef, pendingFiles)}
              isImage={isImage}
              formatSize={formatSize}
            />
            <div className="mt-4 flex gap-3">
              <button
                type="submit"
                disabled={posting}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {posting ? 'Posting...' : 'Post Announcement'}
              </button>
              <button type="button" onClick={handleCancelNew} className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* ── Announcement List ── */}
        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading...</div>
        ) : announcements.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-slate-600">No announcements yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((ann) =>
              editingId === ann._id ? (
                /* ── Edit Form ── */
                <div key={ann._id} className="rounded-xl border border-sky-300 bg-white p-6 shadow-sm ring-2 ring-sky-100">
                  <h3 className="mb-4 font-semibold text-slate-800">Edit Announcement</h3>
                  <div className="mb-4">
                    <label className="mb-1 block text-sm font-medium text-slate-700">Posted By</label>
                    <input
                      type="text"
                      value={editPostedBy}
                      onChange={(e) => setEditPostedBy(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-sky-100"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="mb-1 block text-sm font-medium text-slate-700">Title *</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-sky-100"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="mb-1 block text-sm font-medium text-slate-700">Content *</label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-sky-100"
                      required
                    />
                  </div>

                  {/* Existing attachments */}
                  <div className="mb-4">
                    <label className="mb-1 block text-sm font-medium text-slate-700">Current Attachments</label>
                    {editExistingAttachments.length === 0 ? (
                      <p className="text-xs text-slate-400">No attachments.</p>
                    ) : (
                      <div className="mb-3 space-y-2">
                        {editExistingAttachments.map((url, i) => (
                          <AttachmentItem
                            key={i}
                            url={url}
                            buildFileUrl={buildFileUrl}
                            onRemove={() => removeExistingAttachment(url)}
                            removable
                          />
                        ))}
                      </div>
                    )}

                    {/* New pending files */}
                    {editPendingFiles.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {editPendingFiles.map((file, i) => (
                          <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                            {isImage(file) ? (
                              <img src={URL.createObjectURL(file)} alt={file.name} className="h-8 w-8 rounded object-cover" />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded bg-red-50 text-xs font-bold text-red-500">PDF</div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
                              <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removePendingEditFile(i)}
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-red-100 hover:text-red-500"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="mb-2 text-xs text-slate-500">PDF or image, up to 5MB each.</p>
                    <input ref={editFileInputRef} type="file" accept={ACCEPT} className="sr-only"
                      onChange={(e) => handleFileChange(e, setEditPendingFiles, setEditError, editFileInputRef, editPendingFiles)} />
                    {editExistingAttachments.length + editPendingFiles.length < MAX_ATTACHMENTS && (
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="flex items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-sky-400 hover:text-sky-600"
                      >
                        <span className="text-lg">+</span> Add PDF or Image
                      </button>
                    )}
                    {editError && <p className="mt-2 text-xs text-red-500">{editError}</p>}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveEdit}
                      disabled={editSaving}
                      className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                    >
                      {editSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* ── View Card ── */
                <div key={ann._id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                        Announcement
                      </span>
                      <h3 className="mt-2 text-lg font-bold text-slate-900">{ann.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        By {ann.postedBy} · {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(ann)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-sky-50 hover:text-sky-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(ann._id)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{ann.content}</p>

                  {/* Attachments display */}
                  {ann.attachments?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {ann.attachments.map((url, i) => (
                        <AttachmentItem key={i} url={url} buildFileUrl={buildFileUrl} onRemove={undefined} removable={false} />
                      ))}
                    </div>
                  )}
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
};

// ── Sub-components ──

function AttachmentSection({
  pendingFiles,
  setPendingFiles,
  uploadError,
  setUploadError,
  fileInputRef,
  maxAttachments,
  onFileChange,
  isImage,
  formatSize,
}: {
  pendingFiles: File[];
  setPendingFiles: React.Dispatch<React.SetStateAction<File[]>>;
  uploadError: string;
  setUploadError: React.Dispatch<React.SetStateAction<string>>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  maxAttachments: number;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isImage: (file: File) => boolean;
  formatSize: (bytes: number) => string;
}) {
  return (
    <div className="mb-4">
      <label className="mb-1 block text-sm font-medium text-slate-700">
        Attachments <span className="font-normal text-slate-400">(optional, max {maxAttachments})</span>
      </label>
      <p className="mb-2 text-xs text-slate-500">PDF or image, up to 5MB each.</p>
      <input ref={fileInputRef} type="file" accept={ACCEPT} className="sr-only" onChange={onFileChange} />
      {pendingFiles.length > 0 && (
        <div className="mb-3 space-y-2">
          {pendingFiles.map((file, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {isImage(file) ? (
                <img src={URL.createObjectURL(file)} alt={file.name} className="h-8 w-8 rounded object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded bg-red-50 text-xs font-bold text-red-500">PDF</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-red-100 hover:text-red-500"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {pendingFiles.length < maxAttachments && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-sky-400 hover:text-sky-600"
        >
          <span className="text-lg">+</span> Add PDF or Image
        </button>
      )}
      {uploadError && <p className="mt-2 text-xs text-red-500">{uploadError}</p>}
    </div>
  );
}

function AttachmentItem({
  url,
  buildFileUrl,
  onRemove,
  removable,
}: {
  url: string;
  buildFileUrl: (url: string) => string;
  onRemove: (() => void) | undefined;
  removable: boolean;
}) {
  const filename = url.split('/').pop() || 'attachment';
  const isImageUrl = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      {isImageUrl ? (
        <img src={buildFileUrl(url)} alt={filename} className="h-8 w-8 rounded object-cover" />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded bg-red-50 text-[10px] font-bold text-red-500">PDF</span>
      )}
      <a
        href={buildFileUrl(url)}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 flex-1 truncate text-sm font-medium text-sky-600 hover:text-sky-800"
      >
        {filename.length > 35 ? `${filename.slice(0, 32)}...` : filename}
      </a>
      {removable && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-red-100 hover:text-red-500"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default AdminAnnouncementsPage;
