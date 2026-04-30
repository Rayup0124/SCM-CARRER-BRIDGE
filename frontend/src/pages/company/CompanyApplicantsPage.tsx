import { useEffect, useState, useMemo } from 'react';
import PageShell from '../../components/PageShell';
import { FilePreviewModal } from '../../components/FilePreviewModal';
import api from '../../services/api';

type Student = {
  _id: string;
  name: string;
  email: string;
  programme: string;
  skills: string[];
  resumeUrl?: string;
  resumeUrls?: string[];
};

type Internship = { _id: string; title: string; requiredAttachments?: string[] };

type ApplicationAttachment = {
  type: string;
  url: string;
  filename: string;
  uploadedAt: string;
};

type Application = {
  _id: string;
  student?: Student;
  internship: Internship;
  status: string;
  note: string;
  createdAt: string;
  attachments: ApplicationAttachment[];
};

const statusLabels: Record<string, { label: string; color: string }> = {
  Pending: { label: 'Applied', color: 'bg-slate-100 text-slate-700' },
  Reviewed: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-700' },
  Interviewing: { label: 'Interviewing', color: 'bg-purple-100 text-purple-700' },
  Accepted: { label: 'Offered', color: 'bg-emerald-100 text-emerald-700' },
  Rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
};

const StudentProfileModal = ({
  student,
  onClose,
}: {
  student: Student;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Student Profile</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl font-bold leading-none">×</button>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-700 text-lg font-bold">
            {student.name
              ? student.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
              : '??'}
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">{student.name || '—'}</p>
            <p className="text-slate-500">{student.email || '—'}</p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="font-semibold text-slate-700">Programme</p>
          <p className="text-slate-600">{student.programme || '—'}</p>
        </div>
        {student.skills?.length > 0 && (
          <div>
            <p className="mb-2 font-semibold text-slate-700">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {student.skills.map((s) => (
                <span key={s} className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mt-5 flex justify-end">
        <button
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

const CompanyApplicantsPage = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInternship, setSelectedInternship] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [previewingUrl, setPreviewingUrl] = useState<string | null>(null);
  const [profileModal, setProfileModal] = useState<Student | null>(null);
  const [noteAppId, setNoteAppId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const buildFileUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    return `${base.replace(/\/api$/, '')}${url}`;
  };

  const handleOpenResume = (resumeUrl: string) => {
    if (!resumeUrl) return;
    const fullUrl = buildFileUrl(resumeUrl);
    setPreviewingUrl(fullUrl);
  };

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

  const studentResumeUrls = (student: Partial<Pick<Student, 'resumeUrl' | 'resumeUrls'>>): string[] => {
    if (student.resumeUrls?.length) return student.resumeUrls;
    if (student.resumeUrl) return [student.resumeUrl];
    return [];
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    setUpdatingId(applicationId);
    try {
      const res = await api.put(`/applications/${applicationId}/status`, { status: newStatus });
      setApplications((prev) =>
        prev.map((app) => (app._id === applicationId ? { ...app, status: res.data.status } : app)),
      );
    } catch {
      console.error('Failed to update status');
      setError('Failed to update status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenNote = (app: Application) => {
    setNoteAppId(app._id);
    setNoteText(app.note || '');
  };

  const handleSaveNote = async () => {
    if (!noteAppId) return;
    setSavingNote(true);
    try {
      const res = await api.put(`/applications/${noteAppId}/note`, { note: noteText });
      setApplications((prev) =>
        prev.map((app) => (app._id === noteAppId ? { ...app, note: res.data.note } : app)),
      );
      setNoteAppId(null);
    } catch {
      console.error('Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ applications: Application[]; internships: Internship[] }>('/applications/company/me')
      .then((res) => {
        if (!cancelled) {
          setApplications(res.data.applications || []);
          setInternships(res.data.internships || []);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load applications');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const applicantsLabel = (n: number) => `${n} ${n === 1 ? 'applicant' : 'applicants'}`;

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const appIntId = app.internship?._id != null ? String(app.internship._id) : '';
      const matchInternship = selectedInternship === 'all' || appIntId === selectedInternship;
      const matchStatus = selectedStatus === 'all' || app.status === selectedStatus;
      return matchInternship && matchStatus;
    });
  }, [applications, selectedInternship, selectedStatus]);

  const stats = useMemo(() => {
    const total = applications.length;
    const byStatus: Record<string, number> = {};
    applications.forEach((app) => {
      byStatus[app.status] = (byStatus[app.status] || 0) + 1;
    });
    return {
      total,
      pending: byStatus.Pending || 0,
      reviewed: byStatus.Reviewed || 0,
      interviewing: byStatus.Interviewing || 0,
      accepted: byStatus.Accepted || 0,
      rejected: byStatus.Rejected || 0,
    };
  }, [applications]);

  if (loading) {
    return (
      <PageShell title="Applicant Management" subtitle="Review and manage students who applied to your internship positions.">
        <p className="py-12 text-center text-slate-500">Loading applications...</p>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Applicant Management" subtitle="Review and manage students who applied to your internship positions.">
        <p className="py-12 text-center text-red-600">{error}</p>
      </PageShell>
    );
  }

  return (
    <>
    <PageShell title="Applicant Management" subtitle="Review and manage students who applied to your internship positions.">
      {profileModal && (
        <StudentProfileModal student={profileModal} onClose={() => setProfileModal(null)} />
      )}

      {noteAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-base font-bold text-slate-900">Internal Note</h2>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              placeholder="Add a private note about this applicant..."
              className="w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-900 outline-none focus:border-sky-500 resize-none"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setNoteAppId(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                disabled={savingNote}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:bg-sky-400"
              >
                {savingNote ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Status Summary Cards */}
        <div className="grid gap-4 md:grid-cols-6">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Applied', value: stats.pending },
            { label: 'Under Review', value: stats.reviewed },
            { label: 'Interviewing', value: stats.interviewing },
            { label: 'Offered', value: stats.accepted },
            { label: 'Rejected', value: stats.rejected },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <select
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 outline-none focus:border-sky-500"
            value={selectedInternship}
            onChange={(e) => setSelectedInternship(e.target.value)}
          >
            <option value="all">All positions ({applicantsLabel(applications.length)})</option>
            {internships.map((int) => {
              const id = String(int._id);
              const count = applications.filter((a) => String(a.internship?._id) === id).length;
              const title = (int.title && int.title.trim()) || 'Untitled position';
              return (
                <option key={id} value={id}>
                  {title} — {applicantsLabel(count)}
                </option>
              );
            })}
          </select>
          <select
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 outline-none focus:border-sky-500"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Applied</option>
            <option value="Reviewed">Under Review</option>
            <option value="Interviewing">Interviewing</option>
            <option value="Accepted">Offered</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Applicants List */}
        <div>
          {internships.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <p className="text-slate-600">No internships posted yet.</p>
              <p className="mt-2 text-sm text-slate-500">Post an internship to start receiving applications.</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <p className="text-slate-600">No applicants found.</p>
              <p className="mt-2 text-sm text-slate-500">Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <h3 className="mb-4 text-lg font-semibold text-slate-900">Applicants ({filteredApplications.length})</h3>
              <div className="space-y-4">
                {filteredApplications.map((app) => {
                  const student = (app.student || null) as Student | null;
                  const resumeUrls = studentResumeUrls(student || {});
                  const initials = student?.name
                    ? student.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                    : '??';
                  const appliedDate = safeDate(app.createdAt);
                  const statusInfo = statusLabels[app.status] || { label: app.status || 'Unknown', color: 'bg-slate-100 text-slate-700' };
                  return (
                    <div key={app._id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-semibold">
                            {initials}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h4 className="text-lg font-semibold text-slate-900">{student?.name || 'Unknown'}</h4>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                              {app.note && (
                                <span title={app.note} className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                                  📝 Note
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-slate-600">{student?.email || 'No email'}</p>
                            <p className="text-sm text-slate-600">{student?.programme || 'Unknown programme'}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              Applied: {appliedDate} · Position: {app.internship?.title || 'Unknown'}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {(student?.skills || []).map((skill: string) => (
                                <span key={skill} className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
                                  {skill}
                                </span>
                              ))}
                            </div>
                            {app.note && (
                              <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-slate-700">
                                <span className="font-semibold text-blue-700">Note:</span> {app.note}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => setProfileModal(student || null)}
                          className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700"
                        >
                          View Full Profile
                        </button>
                        {resumeUrls.length === 0 ? (
                          <button
                            type="button"
                            className="rounded-lg bg-slate-300 px-4 py-2 text-xs font-semibold text-white cursor-not-allowed"
                            disabled
                            title="No resume uploaded"
                          >
                            No Resume
                          </button>
                        ) : resumeUrls.length === 1 ? (
                          <button
                            type="button"
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                            onClick={() => handleOpenResume(resumeUrls[0])}
                            title="Open resume"
                          >
                            Open Resume
                          </button>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-medium text-slate-600">Resumes:</span>
                            {resumeUrls.map((url) => (
                              <button
                                key={url}
                                type="button"
                                className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                                onClick={() => handleOpenResume(url)}
                                title={url.split('/').pop() || 'Resume'}
                              >
                                {1 + resumeUrls.indexOf(url)}
                              </button>
                            ))}
                          </div>
                        )}
                        {app.attachments && app.attachments.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-medium text-slate-600">Submitted Docs:</span>
                            {app.attachments.map((att) => (
                              <button
                                key={att.url}
                                type="button"
                                className="rounded-lg bg-amber-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                                onClick={() => handleOpenResume(att.url)}
                                title={`${att.type}: ${att.filename || att.url.split('/').pop()}`}
                              >
                                {att.type}
                              </button>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(student?.email ?? '')}`, '_blank')}
                          className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700"
                        >
                          Send Email
                        </button>
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusUpdate(app._id, e.target.value)}
                          disabled={updatingId === app._id}
                          className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 outline-none hover:bg-slate-50 disabled:opacity-50"
                        >
                          <option value="Pending">Applied</option>
                          <option value="Reviewed">Under Review</option>
                          <option value="Interviewing">Interviewing</option>
                          <option value="Accepted">Offered</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                        <button
                          onClick={() => handleOpenNote(app)}
                          className={`rounded-lg border px-4 py-2 text-xs font-semibold ${
                            app.note
                              ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {app.note ? 'Edit Note' : 'Add Note'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </PageShell>
    <FilePreviewModal url={previewingUrl} onClose={() => setPreviewingUrl(null)} />
    </>
  );
};

export default CompanyApplicantsPage;
