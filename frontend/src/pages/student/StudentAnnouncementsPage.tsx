import { useState, useEffect } from 'react';
import PageShell from '../../components/PageShell';
import { FilePreviewModal } from '../../components/FilePreviewModal';
import api from '../../services/api';

type Announcement = {
  _id: string;
  title: string;
  content: string;
  postedBy: string;
  attachments: string[];
  createdAt: string;
};

const StudentAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [previewingUrl, setPreviewingUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Announcement[]>('/announcements')
      .then((res) => setAnnouncements(res.data || []))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
  }, []);

  const buildFileUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    return `${base.replace(/\/api$/, '')}${url}`;
  };

  return (
    <>
      <PageShell
        title="Announcements"
        subtitle="Stay updated with the latest news and updates from SCM programme."
      >
        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-slate-600">No announcements at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((ann) => (
              <div key={ann._id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-2">
                  <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                    Announcement
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-slate-900">{ann.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    By {ann.postedBy} · {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString() : '—'}
                  </p>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{ann.content}</p>

                {ann.attachments?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {ann.attachments.map((url, i) => {
                      const filename = url.split('/').pop() || `attachment-${i + 1}`;
                      const isImageUrl = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPreviewingUrl(buildFileUrl(url))}
                          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-sky-600 hover:bg-sky-50 hover:text-sky-800"
                        >
                          {isImageUrl ? (
                            <img
                              src={buildFileUrl(url)}
                              alt={filename}
                              className="h-5 w-5 rounded object-cover"
                            />
                          ) : (
                            <span className="flex h-5 w-5 items-center justify-center rounded bg-red-50 text-[10px] font-bold text-red-500">
                              PDF
                            </span>
                          )}
                          {filename.length > 30 ? `${filename.slice(0, 27)}...` : filename}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </PageShell>
      <FilePreviewModal url={previewingUrl} onClose={() => setPreviewingUrl(null)} />
    </>
  );
};

export default StudentAnnouncementsPage;
