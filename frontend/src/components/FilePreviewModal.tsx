import { useEffect, useRef, useState } from 'react';

interface FilePreviewModalProps {
  url: string | null;
  onClose: () => void;
}

export function FilePreviewModal({ url, onClose }: FilePreviewModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    if (!url) return;
    const isPdf = url.toLowerCase().endsWith('.pdf');

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [url, onClose]);

  useEffect(() => {
    if (!url || !url.toLowerCase().endsWith('.pdf')) return;

    setLoading(true);
    setError(null);
    setPageNum(1);
    setPdfDoc(null);

    const scriptId = 'pdfjs-script';
    const existing = document.getElementById(scriptId);

    const init = async () => {
      const pdfjsLib = (window as any).pdfjsLib;
      if (!pdfjsLib) {
        setError('PDF.js failed to load.');
        setLoading(false);
        return;
      }

      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.9.155/legacy/build/pdf.worker.min.mjs';

      try {
        const loadingTask = pdfjsLib.getDocument({
          url: url!,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.9.155/cmaps/',
          cMapPacked: true,
        });
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setLoading(false);
      } catch (err: any) {
        const msg = err?.message || '';
        if (msg.includes('404') || msg.includes('Not Found')) {
          setError('PDF not found on server.');
        } else if (msg.includes('empty') || msg.includes('zero')) {
          setError('PDF file is empty or corrupted.');
        } else {
          setError('Failed to load PDF. ' + msg);
        }
        setLoading(false);
      }
    };

    if (existing) {
      init();
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.9.155/legacy/build/pdf.min.mjs';
    script.type = 'module';
    script.onload = init;
    script.onerror = () => {
      setError('Failed to load PDF.js library.');
      setLoading(false);
    };
    document.head.appendChild(script);
  }, [url]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    let cancelled = false;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderTask = page.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        if (cancelled) {
          try { renderTask.cancel(); } catch { /* ignore */ }
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('PDF render error:', err);
        }
      }
    };

    renderPage();
    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch { /* ignore */ }
      }
    };
  }, [pdfDoc, pageNum, scale]);

  if (!url) return null;

  const isPdf = url.toLowerCase().endsWith('.pdf');
  const filename = url.split('/').pop() || 'Document';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="File Preview"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-700">
            {isPdf ? 'PDF Preview' : 'Image Preview'}
          </h3>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              title="Open in new tab"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close preview"
            >
              ×
            </button>
          </div>
        </div>

        {isPdf ? (
          <div className="flex flex-col">
            {numPages > 1 && (
              <div className="flex items-center justify-center gap-4 border-b border-slate-100 bg-slate-50 px-4 py-2">
                <button
                  onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                  disabled={pageNum <= 1}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ‹ Prev
                </button>
                <span className="text-sm text-slate-600">
                  Page {pageNum} of {numPages}
                </span>
                <button
                  onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
                  disabled={pageNum >= numPages}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next ›
                </button>
                <div className="ml-2 flex items-center gap-1">
                  <span className="text-xs text-slate-500">Zoom:</span>
                  <button
                    onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
                    className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs hover:bg-slate-100"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-xs text-slate-600">{(scale * 100).toFixed(0)}%</span>
                  <button
                    onClick={() => setScale((s) => Math.min(3, s + 0.2))}
                    className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
            <div className="max-h-[70vh] overflow-auto bg-slate-200 p-4">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-sky-600" />
                  <span className="ml-3 text-sm text-slate-600">Loading PDF...</span>
                </div>
              )}
              {error && (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-sm text-red-600">{error}</p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                  >
                    Open PDF in New Tab
                  </a>
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="mx-auto block shadow-lg"
                style={{ display: loading || error ? 'none' : 'block' }}
              />
            </div>
          </div>
        ) : (
          <div className="max-h-[75vh] overflow-auto bg-slate-100">
            <img
              src={url}
              alt="Preview"
              className="max-h-[70vh] w-full object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
}
