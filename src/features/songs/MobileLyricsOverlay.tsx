import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Copy, Minus, Moon, MoreHorizontal, Pause, Play, Plus, Share2, Star, Sun, X } from 'lucide-react';
import { PdfSongPage } from './PdfSongPage';
import { Song } from '../../types';

/** Minimal song shape for Library + Catholic Hub mobile readers. */
export interface MobileLyricsSong {
  id: string;
  title: string;
  category?: string;
  language?: string;
  lyrics?: string;
  pageNumber?: number;
  sourcePageNumber?: number;
  sourcePdfUrl?: string;
  metaLine?: string;
}

interface MobileLyricsOverlayProps {
  song: MobileLyricsSong;
  isPdfSong?: boolean;
  viewerDarkMode?: boolean;
  viewerFontSize?: number;
  isPlayingScroll?: boolean;
  isFavorite?: boolean;
  showFavorite?: boolean;
  showAutoScroll?: boolean;
  lyricsContainerRef?: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onCopy: (song: MobileLyricsSong) => void;
  onShare: (song: MobileLyricsSong) => void;
  onToggleFavorite?: (songId: string) => void;
  onFontSizeChange?: (size: number) => void;
  onToggleDarkMode?: () => void;
  onToggleScroll?: () => void;
}

function displayTitle(song: MobileLyricsSong) {
  return song.title || `Untitled · Page ${song.sourcePageNumber ?? song.pageNumber ?? '-'}`;
}

function subtitle(song: MobileLyricsSong) {
  if (song.metaLine) return song.metaLine;
  const parts = [song.category, song.language, song.sourcePageNumber ?? song.pageNumber ? `Page ${song.sourcePageNumber ?? song.pageNumber}` : null].filter(Boolean);
  return parts.join(' · ');
}

/** Full-screen mobile lyrics reader — hides app bottom nav while open. */
export const MobileLyricsOverlay: React.FC<MobileLyricsOverlayProps> = ({
  song,
  isPdfSong = false,
  viewerDarkMode: controlledDark,
  viewerFontSize: controlledFont,
  isPlayingScroll: controlledScroll,
  isFavorite = false,
  showFavorite = true,
  showAutoScroll = true,
  lyricsContainerRef: externalRef,
  onClose,
  onCopy,
  onShare,
  onToggleFavorite,
  onFontSizeChange,
  onToggleDarkMode,
  onToggleScroll,
}) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const [localDark, setLocalDark] = useState(false);
  const [localFont, setLocalFont] = useState(18);
  const [localScroll, setLocalScroll] = useState(false);
  const internalRef = useRef<HTMLDivElement>(null);
  const lyricsContainerRef = externalRef ?? internalRef;

  const viewerDarkMode = controlledDark ?? localDark;
  const viewerFontSize = controlledFont ?? localFont;
  const isPlayingScroll = controlledScroll ?? localScroll;

  const setFont = (size: number) => {
    onFontSizeChange?.(size);
    if (controlledFont === undefined) setLocalFont(size);
  };
  const toggleDark = () => {
    onToggleDarkMode?.();
    if (controlledDark === undefined) setLocalDark((d) => !d);
  };
  const toggleScroll = () => {
    onToggleScroll?.();
    if (controlledScroll === undefined) setLocalScroll((s) => !s);
  };

  // Lock the document scrollport while open. On mobile Safari/Chrome, a short
  // lyrics page inside a fixed overlay otherwise scroll-chains into the tall
  // Music song index behind it (infinite black void under the white PDF page).
  useEffect(() => {
    const html = document.documentElement;
    const { body } = document;
    const scrollY = window.scrollY;

    html.classList.add('mobile-reader-open');
    body.classList.add('mobile-reader-open');

    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
    };

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';

    return () => {
      html.classList.remove('mobile-reader-open');
      body.classList.remove('mobile-reader-open');
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.left = prev.bodyLeft;
      body.style.right = prev.bodyRight;
      body.style.width = prev.bodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Local auto-scroll only when parent does not own scroll state (e.g. Catholic Hub).
  useEffect(() => {
    if (onToggleScroll || !isPlayingScroll) return;
    const el = lyricsContainerRef.current;
    if (!el) return;
    const id = window.setInterval(() => {
      el.scrollTop += 1;
    }, 50);
    return () => window.clearInterval(id);
  }, [isPlayingScroll, lyricsContainerRef, onToggleScroll]);

  const chip = viewerDarkMode
    ? 'inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 text-[14px] font-medium'
    : 'inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border border-black/10 bg-black/[0.04] px-3.5 text-[14px] font-medium text-[#1d1d1f]';

  return (
    <div
      className={`mobile-safe-screen fixed inset-0 z-[70] flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden font-apple lg:hidden ${
        viewerDarkMode ? 'bg-[#0a0a0a] text-[#f5f5f7]' : 'bg-[#f5f5f7] text-[#1d1d1f]'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Song lyrics"
    >
      <div className={`sticky top-0 z-10 border-b px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] ${
        viewerDarkMode ? 'border-white/10 bg-[#0a0a0a]/95' : 'border-black/[0.06] bg-[#f5f5f7]/95'
      }`}>
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onClose}
            className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/80"
            aria-label="Back to song index"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="tamil-text line-clamp-2 text-[18px] font-semibold tracking-[-0.02em]">{displayTitle(song)}</h2>
            <p className="mt-1 text-[13px] text-[#86868b]">{subtitle(song)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/80"
            aria-label="Close lyrics viewer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          {showAutoScroll && (
            <button type="button" onClick={toggleScroll} className="btn-pill btn-pill-primary flex-1 !min-h-[44px] !text-[14px]">
              {isPlayingScroll ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} Auto-scroll
            </button>
          )}
          {showFavorite && onToggleFavorite && (
            <button type="button" onClick={() => onToggleFavorite(song.id)} className={chip}>
              <Star className={'h-4 w-4 ' + (isFavorite ? 'fill-amber-300 text-amber-300' : '')} />
            </button>
          )}
          <div className="relative">
            <button type="button" onClick={() => setMoreOpen((o) => !o)} className={chip} aria-label="More tools">
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {moreOpen && (
              <>
                <button type="button" className="fixed inset-0 z-10" aria-label="Close" onClick={() => setMoreOpen(false)} />
                <div className={`absolute right-0 top-[calc(100%+4px)] z-20 min-w-[11rem] overflow-hidden rounded-2xl border py-1 shadow-lg ${
                  viewerDarkMode ? 'border-white/10 bg-[#1c1c1e]' : 'border-black/10 bg-white'
                }`}>
                  <button type="button" onClick={() => { onCopy(song); setMoreOpen(false); }} className="flex w-full min-h-[44px] items-center gap-2 px-4 text-left text-[15px]">
                    <Copy className="h-4 w-4" /> Copy
                  </button>
                  <button type="button" onClick={() => { onShare(song); setMoreOpen(false); }} className="flex w-full min-h-[44px] items-center gap-2 px-4 text-left text-[15px]">
                    <Share2 className="h-4 w-4" /> Share
                  </button>
                  <button type="button" onClick={() => setFont(Math.max(12, viewerFontSize - 1))} className="flex w-full min-h-[44px] items-center gap-2 px-4 text-left text-[15px]">
                    <Minus className="h-4 w-4" /> Smaller text
                  </button>
                  <button type="button" onClick={() => setFont(Math.min(30, viewerFontSize + 1))} className="flex w-full min-h-[44px] items-center gap-2 px-4 text-left text-[15px]">
                    <Plus className="h-4 w-4" /> Larger text
                  </button>
                  <button type="button" onClick={() => { toggleDark(); setMoreOpen(false); }} className="flex w-full min-h-[44px] items-center gap-2 px-4 text-left text-[15px]">
                    {viewerDarkMode ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4" />} Theme
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div
        ref={lyricsContainerRef}
        className="mobile-scroll-contain min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-4 py-5"
        style={{
          fontSize: `${Math.max(viewerFontSize, 17)}px`,
          paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {isPdfSong ? (
          <PdfSongPage song={song as Song} isPresentationMode={false} />
        ) : song.lyrics ? (
          <pre className="tamil-text whitespace-pre-wrap text-center leading-loose">{song.lyrics}</pre>
        ) : (
          <div className="apple-empty rounded-2xl border border-black/10">
            <BookOpen className="h-10 w-10 text-[#18392f]" />
            <h3>Lyrics extraction pending</h3>
            <p>Open the source PDF page to read this song exactly as imported.</p>
            {song.sourcePdfUrl && (
              <div className="mt-2 flex w-full flex-col gap-2">
                <a href={`${song.sourcePdfUrl}#page=${song.sourcePageNumber}`} target="_blank" rel="noreferrer" className="btn-pill btn-pill-primary w-full">
                  Open source page
                </a>
                <a href={song.sourcePdfUrl} download className="btn-pill btn-pill-secondary w-full">
                  Download songbook
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
