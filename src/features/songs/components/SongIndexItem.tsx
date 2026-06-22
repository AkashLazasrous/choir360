import React from 'react';
import { Song } from '../../../types';
import { getSongTitle } from '../utils/songSearch';

interface SongIndexItemProps {
  song: Song;
  isSelected: boolean;
  onSelect: (song: Song) => void;
}

export const SongIndexItem: React.FC<SongIndexItemProps> = ({ song, isSelected, onSelect }) => (
  <a
    id={`song-index-${song.id}`}
    href={`#song-${encodeURIComponent(song.id)}`}
    onClick={(event) => {
      event.preventDefault();
      onSelect(song);
    }}
    className={`song-index-link flex min-h-[64px] w-full flex-col justify-center rounded-xl border p-3 ${
      isSelected ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : 'border-slate-100 bg-white text-slate-700'
    }`}
  >
    <span className="tamil-text text-sm font-black underline decoration-emerald-400/70 underline-offset-4">{getSongTitle(song)}</span>
    <span className="mt-1 text-[11px] font-semibold text-slate-500">
      Page {song.sourcePageNumber ?? song.pageNumber ?? '-'} • {song.category} • {song.language}
    </span>
  </a>
);
