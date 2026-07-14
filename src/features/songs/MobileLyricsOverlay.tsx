import React from 'react';
import { ArrowLeft, BookOpen, Copy, Minus, Moon, Pause, Play, Plus, Share2, Star, Sun, X } from 'lucide-react';
import { Song } from '../../types';
import { PdfSongPage } from './PdfSongPage';
import { getDisplayTitle } from './utils/songDisplay';

interface MobileLyricsOverlayProps {
  song: Song;
  isPdfSong: boolean;
  viewerDarkMode: boolean;
  viewerFontSize: number;
  isPlayingScroll: boolean;
  isFavorite: boolean;
  lyricsContainerRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onCopy: (song: Song) => void;
  onShare: (song: Song) => void;
  onToggleFavorite: (songId: string) => void;
  onFontSizeChange: (size: number) => void;
  onToggleDarkMode: () => void;
  onToggleScroll: () => void;
}

/** Full-screen mobile lyrics reader with copy/share/favorite/scroll controls. */
export const MobileLyricsOverlay: React.FC<MobileLyricsOverlayProps> = ({
  song,
  isPdfSong,
  viewerDarkMode,
  viewerFontSize,
  isPlayingScroll,
  isFavorite,
  lyricsContainerRef,
  onClose,
  onCopy,
  onShare,
  onToggleFavorite,
  onFontSizeChange,
  onToggleDarkMode,
  onToggleScroll,
}) => (
  <div className={`mobile-safe-screen fixed inset-0 z-[70] flex flex-col lg:hidden ${viewerDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'}`}>
    <div className={`sticky top-0 z-10 border-b px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] ${
      viewerDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'
    }`}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onClose}
          className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/20 bg-white/10"
          aria-label="Back to song index"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 text-base font-black tamil-text">{getDisplayTitle(song)}</h2>
          <p className="mt-1 text-xs font-semibold opacity-70">
            {song.category} • {song.language} • Page {song.sourcePageNumber ?? song.pageNumber ?? '-'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/20 bg-white/10"
          aria-label="Close lyrics viewer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        <button type="button" onClick={() => onCopy(song)} className="inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-xl border border-slate-700/20 px-3 text-xs font-bold">
          <Copy className="h-4 w-4" /> Copy
        </button>
        <button type="button" onClick={() => onShare(song)} className="inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-xl border border-slate-700/20 px-3 text-xs font-bold">
          <Share2 className="h-4 w-4" /> Share
        </button>
        <button
          type="button"
          onClick={() => onToggleFavorite(song.id)}
          className="inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-xl border border-slate-700/20 px-3 text-xs font-bold"
        >
          <Star className={'h-4 w-4 ' + (isFavorite ? 'fill-amber-300 text-amber-300' : '')} /> Favorite
        </button>
        <button type="button" onClick={() => onFontSizeChange(Math.max(12, viewerFontSize - 1))} className="inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-xl border border-slate-700/20 px-3 text-xs font-bold">
          <Minus className="h-4 w-4" /> A
        </button>
        <button type="button" onClick={() => onFontSizeChange(Math.min(30, viewerFontSize + 1))} className="inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-xl border border-slate-700/20 px-3 text-xs font-bold">
          <Plus className="h-4 w-4" /> A
        </button>
        <button type="button" onClick={onToggleDarkMode} className="inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-xl border border-slate-700/20 px-3 text-xs font-bold">
          {viewerDarkMode ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4" />} Mode
        </button>
        <button type="button" onClick={onToggleScroll} className="inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-xl bg-emerald-700 px-3 text-xs font-bold text-white">
          {isPlayingScroll ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} Scroll
        </button>
      </div>
    </div>

    <div
      ref={lyricsContainerRef}
      className="mobile-scroll-contain min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-[calc(5rem+env(safe-area-inset-bottom))]"
      style={{ fontSize: `${Math.max(viewerFontSize, 16)}px` }}
    >
      {isPdfSong ? (
        <PdfSongPage song={song} isPresentationMode={false} />
      ) : song.lyrics ? (
        <pre className="tamil-text whitespace-pre-wrap text-center leading-loose">{song.lyrics}</pre>
      ) : (
        <div className="rounded-2xl border border-slate-700/30 p-6 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-emerald-500" />
          <h3 className="mt-3 text-base font-black">Lyrics extraction pending</h3>
          <p className="mt-2 text-sm opacity-70">Open the source PDF page to read this song exactly as imported.</p>
          {song.sourcePdfUrl && (
            <div className="mt-4 flex flex-col gap-2">
              <a href={`${song.sourcePdfUrl}#page=${song.sourcePageNumber}`} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white">
                Open source page
              </a>
              <a href={song.sourcePdfUrl} download className="rounded-xl border border-slate-700/30 px-4 py-3 text-sm font-bold">
                Download songbook
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);
