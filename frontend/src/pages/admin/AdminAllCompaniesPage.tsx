import { useState, useEffect } from 'react';
import PageShell from '../../components/PageShell';
import { FilePreviewModal } from '../../components/FilePreviewModal';
import api from '../../services/api';

interface Company {
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

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  pending_review: { label: 'Pending Review', bg: 'bg-blue-100', text: 'text-blue-700' },
  pending_documents: { label: 'Awaiting Docs', bg: 'bg-orange-100', text: 'text-orange-700' },
  approved: { label: 'Approved', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  rejected: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-700' },
};

const AdminAllCompaniesPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [previewingUrl, setPreviewingUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await api.get('/admin/companies/all');
        setCompanies(res.data || []);
      } catch {
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.hrEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || company.verificationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    all: companies.length,
    approved: companies.filter((c) => c.verificationStatus === 'approved').length,
    pending_review: companies.filter((c) => c.verificationStatus === 'pending_review').length,
    pending_documents: companies.filter((c) => c.verificationStatus === 'pending_documents').length,
    rejected: companies.filter((c) => c.verificationStatus === 'rejected').length,
  };

  return (
    <>
    <PageShell
      title="All Companies"
      subtitle="Complete registry of all registered companies on the platform."
    >
      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{counts.all}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm text-emerald-600">Approved</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{counts.approved}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <p className="text-sm text-blue-600">Pending Review</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">{counts.pending_review}</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
          <p className="text-sm text-orange-600">Awaiting Docs</p>
          <p className="mt-1 text-2xl font-bold text-orange-700">{counts.pending_documents}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <p className="text-sm text-red-600">Rejected</p>
          <p className="mt-1 text-2xl font-bold text-red-700">{counts.rejected}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search by company name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 outline-none focus:border-sky-500"
        >
          <option value="all">All Status ({counts.all})</option>
          <option value="approved">Approved ({counts.approved})</option>
          <option value="pending_review">Pending Review ({counts.pending_review})</option>
          <option value="pending_documents">Awaiting Docs ({counts.pending_documents})</option>
          <option value="rejected">Rejected ({counts.rejected})</option>
        </select>
      </div>

      {/* Company List */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading...</div>
      ) : filteredCompanies.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-slate-600">No companies found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCompanies.map((company) => {
            const cfg = statusConfig[company.verificationStatus] || statusConfig.pending_review;
            return (
              <div key={company._id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-900">{company.companyName}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </div>
                    {company.description && (
                      <p className="text-sm text-slate-600">{company.description}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-700 shrink-0">HR Email:</span>
                    <span className="shrink-0">{company.hrEmail}</span>
                    <button
                      onClick={() => {
                        window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(company.hrEmail)}`, '_blank');
                      }}
                      className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100"
                    >
                      Send Email
                    </button>
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
                    <span className="font-medium text-slate-700">Documents:</span>
                    {company.documentUrls && company.documentUrls.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {company.documentUrls.map((url, i) => {
                          const filename = url.split('/').pop() || `Doc ${i + 1}`;
                          const isPdf = filename.toLowerCase().endsWith('.pdf');
                          return (
                            <button
                              key={url}
                              type="button"
                              onClick={() => setPreviewingUrl(buildFileUrl(url))}
                              className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 shadow-sm transition hover:bg-sky-100 hover:text-sky-800"
                            >
                              {isPdf ? (
                                <svg className="shrink-0 text-red-500" width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                  <polyline points="14 2 14 8 20 8" fill="none" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                              ) : (
                                <svg className="shrink-0 text-sky-500" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                                  <polyline points="21 15 16 10 5 21"/>
                                </svg>
                              )}
                              {filename.length > 25 ? `${filename.slice(0, 23)}…` : filename}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                        No documents
                      </span>
                    )}
                  </div>
                </div>

        {/* Action Buttons */}
        {company.verificationStatus === 'approved' && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <button
              onClick={() => {
                if (!window.confirm(`Delete "${company.companyName}"? This will also permanently remove all its internships and applications.`)) return;
                api.delete(`/admin/companies/${company._id}`).then(() => {
                  setCompanies((prev) => prev.filter((c) => c._id !== company._id));
                }).catch((err) => {
                  const e = err as { response?: { data?: { message?: string } } };
                  window.alert(e.response?.data?.message || 'Failed to delete');
                });
              }}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              Delete Company
            </button>
            <button
              onClick={() => {
                const msg = window.prompt('Message to company (optional):');
                if (msg === null) return;
                api.put(`/admin/companies/request-documents/${company._id}`, { message: msg }).then(() => {
                  setCompanies((prev) => prev.map((c) => c._id === company._id ? { ...c, verificationStatus: 'pending_documents', adminRequestMessage: msg } : c));
                }).catch((err) => {
                  const e = err as { response?: { data?: { message?: string } } };
                  window.alert(e.response?.data?.message || 'Failed');
                });
              }}
              className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100"
            >
              Request Docs
            </button>
          </div>
        )}

        {company.verificationStatus === 'rejected' && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <button
              onClick={async () => {
                if (!window.confirm(`Reactivate "${company.companyName}" for re-review?`)) return;
                try {
                  await api.put(`/admin/companies/approve/${company._id}`);
                  setCompanies((prev) => prev.map((c) => c._id === company._id ? { ...c, verificationStatus: 'approved' } : c));
                } catch (err) {
                  const e = err as { response?: { data?: { message?: string } } };
                  window.alert(e.response?.data?.message || 'Failed');
                }
              }}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Reactivate
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
        )}

        {(company.verificationStatus === 'pending_review' || company.verificationStatus === 'pending_documents') && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <button
              onClick={async () => {
                if (!window.confirm(`Approve "${company.companyName}"?`)) return;
                try {
                  await api.put(`/admin/companies/approve/${company._id}`);
                  setCompanies((prev) => prev.map((c) => c._id === company._id ? { ...c, verificationStatus: 'approved' } : c));
                } catch (err) {
                  const e = err as { response?: { data?: { message?: string } } };
                  window.alert(e.response?.data?.message || 'Failed to approve');
                }
              }}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Approve
            </button>
            <button
              onClick={async () => {
                const reason = window.prompt('Reason for rejection (optional):');
                if (reason === null) return;
                try {
                  await api.delete(`/admin/companies/reject/${company._id}`, { data: reason ? { message: reason } : {} });
                  setCompanies((prev) => prev.map((c) => c._id === company._id ? { ...c, verificationStatus: 'rejected' } : c));
                } catch (err) {
                  const e = err as { response?: { data?: { message?: string } } };
                  window.alert(e.response?.data?.message || 'Failed to reject');
                }
              }}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              Reject
            </button>
            <button
              onClick={() => {
                const msg = window.prompt('Message to company (optional):');
                if (msg === null) return;
                api.put(`/admin/companies/request-documents/${company._id}`, { message: msg }).then(() => {
                  setCompanies((prev) => prev.map((c) => c._id === company._id ? { ...c, verificationStatus: 'pending_documents', adminRequestMessage: msg } : c));
                }).catch((err) => {
                  const e = err as { response?: { data?: { message?: string } } };
                  window.alert(e.response?.data?.message || 'Failed');
                });
              }}
              className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100"
            >
              Request Docs
            </button>
          </div>
        )}
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
    <FilePreviewModal url={previewingUrl} onClose={() => setPreviewingUrl(null)} />
    </>
  );
};

export default AdminAllCompaniesPage;
