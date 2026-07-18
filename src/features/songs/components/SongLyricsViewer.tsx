import React from 'react';
import { Song } from '../../../types';
import { getSongTitle } from '../utils/songSearch';

interface SongLyricsViewerProps {
  song: Song;
}

export const SongLyricsViewer: React.FC<SongLyricsViewerProps> = ({ song }) => (
  <article className="website-light-surface tamil-text whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-5 text-center leading-loose text-slate-900">
    <h2 className="text-lg font-black text-slate-950">{getSongTitle(song)}</h2>
    <p className="mt-1 text-xs font-bold text-slate-500">
      {song.category} • {song.language} • Page {song.sourcePageNumber ?? song.pageNumber ?? '-'}
    </p>
    <div className="mt-5 text-base text-slate-800">
      {song.lyrics || 'Lyrics extraction pending. Open source page or download songbook to view this page.'}
    </div>
  </article>
);
