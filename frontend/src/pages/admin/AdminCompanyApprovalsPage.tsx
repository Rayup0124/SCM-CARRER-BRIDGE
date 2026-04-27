import { useState, useEffect } from 'react';
import PageShell from '../../components/PageShell';
import api from '../../services/api';

interface PendingCompany {
  _id: string;
  companyName: string;
  hrEmail: string;
  description?: string;
  website?: string;
  documentUrls?: string[];
  verificationStatus: string;
  adminRequestMessage?: string;
  createdAt: string;
}

const buildFileUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  return `${base.replace(/\/api$/, '')}${url}`;
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending_review: { label: 'Pending Review', color: 'bg-blue-100 text-blue-700' },
  pending_documents: { label: 'Awaiting Documents', color: 'bg-orange-100 text-orange-700' },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
};

const AdminCompanyApprovalsPage = () => {
  const [companies, setCompanies] = useState<PendingCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_review' | 'pending_documents'>('all');

  const [requestModal, setRequestModal] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await api.get('/admin/companies/pending');
        setCompanies(res.data || []);
      } catch {
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await api.put(`/admin/companies/approve/${id}`);
      setCompanies((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setSubmitting(true);
    try {
      await api.delete(`/admin/companies/reject/${rejectModal}`, {
        data: { reason: rejectReason.trim() || undefined },
      });
      setCompanies((prev) => prev.filter((c) => c._id !== rejectModal));
      setRejectModal(null);
      setRejectReason('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestDocuments = async () => {
    if (!requestModal) return;
    setSubmitting(true);
    try {
      await api.put(`/admin/companies/request-documents/${requestModal}`, {
        message: requestMessage.trim(),
      });
      setCompanies((prev) => prev.filter((c) => c._id !== requestModal));
      setRequestModal(null);
      setRequestMessage('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      title="Company Approvals"
      subtitle="Checklist view for vetting HR partners before enabling postings. Review company details and use approve/reject buttons to manage platform access."
    >
      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-red-700">Reject Company</h2>
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="text-xl font-bold text-slate-400 hover:text-slate-700 leading-none"
              >
                ×
              </button>
            </div>
            <p className="mb-3 text-sm text-slate-600">
              The company will be notified that their registration has been rejected. Optionally, provide a reason to help them understand what went wrong.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Reason for rejection (optional)... e.g. 'Documents provided are unclear or incomplete.'"
              className="w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-900 outline-none focus:border-red-400 resize-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={submitting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
      {requestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Request Documents</h2>
              <button
                onClick={() => { setRequestModal(null); setRequestMessage(''); }}
                className="text-xl font-bold text-slate-400 hover:text-slate-700 leading-none"
              >
                ×
              </button>
            </div>
            <p className="mb-3 text-sm text-slate-600">
              The company will be notified and asked to upload the requested documents. Their status will change to <strong>Awaiting Documents</strong>.
            </p>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              rows={4}
              placeholder="Describe what documents you need (e.g. 'Please upload your SSM certificate and company registration documents')..."
              className="w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-900 outline-none focus:border-sky-500 resize-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setRequestModal(null); setRequestMessage(''); }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestDocuments}
                disabled={submitting}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {submitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Filters */}
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-sky-500"
          >
            <option value="all">All Pending ({companies.length})</option>
            <option value="pending_review">Awaiting Review ({companies.filter((c) => c.verificationStatus === 'pending_review').length})</option>
            <option value="pending_documents">Awaiting Docs ({companies.filter((c) => c.verificationStatus === 'pending_documents').length})</option>
          </select>
          {statusFilter !== 'all' && (
            <span className="text-xs text-slate-500">
              {companies.filter((c) => c.verificationStatus === statusFilter).length} result(s)
            </span>
          )}
        </div>

        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Pending Companies ({loading ? '...' : companies.filter((c) => statusFilter === 'all' || c.verificationStatus === statusFilter).length})
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading...</div>
        ) : companies.filter((c) => statusFilter === 'all' || c.verificationStatus === statusFilter).length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            No companies in this category.
          </div>
        ) : (
          companies
            .filter((c) => statusFilter === 'all' || c.verificationStatus === statusFilter)
            .map((company) => {
              const status = statusConfig[company.verificationStatus] || statusConfig.pending_review;
              return (
                <div key={company._id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">{company.companyName}</h3>
                    {company.description && (
                      <p className="mt-1 text-sm text-slate-600">{company.description}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setRejectModal(company._id);
                        setRejectReason('');
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(company._id)}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                  </div>
                </div>

                <div className="mb-4 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700">HR Email:</span>
                    <span>{company.hrEmail}</span>
                  </div>
                  {company.website && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">Website:</span>
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-600 hover:underline"
                      >
                        {company.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700">Registered:</span>
                    <span>
                      {company.createdAt
                        ? new Date(company.createdAt).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-700">Verification documents &amp; images:</span>
                    {company.documentUrls && company.documentUrls.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {company.documentUrls.map((url, i) => {
                          const filename = url.split('/').pop() || `Document ${i + 1}`;
                          const isPdf = filename.toLowerCase().endsWith('.pdf');
                          return (
                            <a
                              key={url}
                              href={`buildFileUrl(url)`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 shadow-sm transition hover:bg-sky-100 hover:text-sky-800"
                            >
                              {isPdf ? (
                                <svg className="shrink-0 text-red-500" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                  <polyline points="14 2 14 8 20 8" fill="none" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                              ) : (
                                <svg className="shrink-0 text-sky-500" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2"/>
                                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                                  <polyline points="21 15 16 10 5 21" fill="none" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                              )}
                              {filename.length > 30 ? `${filename.slice(0, 28)}…` : filename}
                            </a>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        No documents uploaded
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => {
                      setRequestModal(company._id);
                      setRequestMessage(company.adminRequestMessage || '');
                    }}
                    className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100"
                  >
                    Request Documents
                  </button>
                  <button
                    onClick={() => {
                      window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(company.hrEmail)}`, '_blank');
                    }}
                    className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100"
                  >
                    Send Email
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </PageShell>
  );
};

export default AdminCompanyApprovalsPage;
