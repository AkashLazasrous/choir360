import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Download, ExternalLink, Loader2 } from 'lucide-react';
import { Song } from '../../types';

// pdfjs is lazy-loaded only when a PDF song page is actually requested.
// This keeps the initial JS bundle ~470KB smaller.
let pdfjsLibCache: typeof import('pdfjs-dist') | null = null;
async function getPdfjsLib() {
  if (pdfjsLibCache) return pdfjsLibCache;
  const lib = await import('pdfjs-dist');
  const workerMod = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  lib.GlobalWorkerOptions.workerSrc = (workerMod as unknown as { default: string }).default;
  pdfjsLibCache = lib;
  return lib;
}

interface PdfSongPageProps {
  song: Song;
  isPresentationMode: boolean;
}

/** Renders a single original songbook PDF page onto a canvas via pdf.js. */
export const PdfSongPage: React.FC<PdfSongPageProps> = ({ song, isPresentationMode }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<{ cancel(): void } | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!song.sourcePdfUrl || !song.sourcePageNumber || !canvasRef.current) return;

    let isMounted = true;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const render = async () => {
      setStatus('loading');
      setError('');

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      try {
        const pdfjsLib = await getPdfjsLib();
        const loadingTask = pdfjsLib.getDocument({ url: song.sourcePdfUrl });
        const document = await loadingTask.promise;
        const page = await document.getPage(song.sourcePageNumber ?? song.pageNumber ?? 1);
        if (!isMounted) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const fitWidth = Math.max((wrapperRef.current?.clientWidth ?? 760) - 24, 280);
        const viewport = page.getViewport({ scale: fitWidth / baseViewport.width });
        const ratio = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * ratio);
        canvas.height = Math.floor(viewport.height * ratio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.clearRect(0, 0, viewport.width, viewport.height);

        const task = page.render({ canvas, canvasContext: context, viewport });
        renderTaskRef.current = task;
        await task.promise;

        if (isMounted) setStatus('ready');
      } catch (renderError) {
        if (
          renderError
          && typeof renderError === 'object'
          && 'name' in renderError
          && renderError.name === 'RenderingCancelledException'
        ) {
          return;
        }
        if (!isMounted) return;
        setError(renderError instanceof Error ? renderError.message : 'Song PDF page could not be rendered.');
        setStatus('error');
      }
    };

    void render();

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [song.sourcePdfUrl, song.sourcePageNumber]);

  return (
    <div ref={wrapperRef} className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4">
      {!isPresentationMode && (
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          {song.sourcePdfUrl && (
            <>
              <a
                href={`${song.sourcePdfUrl}#page=${song.sourcePageNumber}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700/30 px-3 py-2 font-bold hover:text-emerald-400"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open source page
              </a>
              <a
                href={song.sourcePdfUrl}
                download
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700/30 px-3 py-2 font-bold hover:text-emerald-400"
              >
                <Download className="h-3.5 w-3.5" />
                Download songbook
              </a>
            </>
          )}
        </div>
      )}

      {status === 'loading' && (
        <div className="flex min-h-[360px] items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-700/30 px-4 py-3 text-sm font-bold">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
            Rendering original PDF page...
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-xl border border-rose-400/40 p-6 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-rose-500" />
          <p className="mt-3 text-sm font-bold">This song page is unavailable.</p>
          <p className="mt-1 text-xs opacity-70">{error}</p>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className={`max-w-full bg-white shadow-xl ${status !== 'ready' ? 'hidden' : ''}`}
        aria-label={`${song.title} original PDF page`}
      />
    </div>
  );
};
