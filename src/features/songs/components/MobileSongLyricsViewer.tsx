import React from 'react';
import { X } from 'lucide-react';
import { Song } from '../../../types';
import { SongLyricsViewer } from './SongLyricsViewer';

interface MobileSongLyricsViewerProps {
  song: Song;
  onClose: () => void;
}

export const MobileSongLyricsViewer: React.FC<MobileSongLyricsViewerProps> = ({ song, onClose }) => (
  <div className="mobile-safe-screen fixed inset-0 z-[70] flex flex-col bg-white lg:hidden">
    <div className="sticky top-0 z-10 flex items-center justify-end border-b border-slate-200 bg-white p-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
      <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200" aria-label="Close song viewer">
        <X className="h-5 w-5" />
      </button>
    </div>
    <div className="mobile-scroll-contain min-h-0 flex-1 overflow-y-auto p-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <SongLyricsViewer song={song} />
    </div>
  </div>
);
