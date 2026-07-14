import React from 'react';
import { BookOpen } from 'lucide-react';
import { Song } from '../../types';
import { getDisplayTitle, songMatchesQuery } from './utils/songDisplay';

interface SongIndexProps {
  songs: Song[];
  selectedSongId: string;
  searchQuery: string;
  onSelectSong: (song: Song) => void;
}

/** Multi-column hyperlinked song index (page numbers + Tamil titles). */
export const SongIndex: React.FC<SongIndexProps> = ({ songs, selectedSongId, searchQuery, onSelectSong }) => {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  if (songs.length === 0) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-slate-800/60 p-8 text-center">
        <div>
          <BookOpen className="mx-auto h-10 w-10 text-slate-500" />
          <h4 className="mt-4 text-sm font-black">No songs found</h4>
          <p className="mt-1 text-xs text-slate-400">Adjust search or filters to show imported song index entries.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl text-left">
      <div className="mb-6 border-b border-slate-800/60 pb-4 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-500">Song Index</p>
        <h3 className="mt-2 text-xl font-black text-white">Jebathotta Jeyageethangal - Song Index</h3>
        <p className="mt-1 text-xs text-slate-400">{songs.length} imported PDF song page{songs.length === 1 ? '' : 's'}</p>
      </div>

      <ol className="columns-1 gap-10 space-y-2 sm:columns-2 xl:columns-3">
        {songs.map((song) => {
          const title = getDisplayTitle(song);
          const isSelected = song.id === selectedSongId;
          const isMatch = normalizedQuery.length > 0 && songMatchesQuery(song, normalizedQuery);

          return (
            <li key={song.id} className="break-inside-avoid pb-2">
              <button
                type="button"
                onClick={() => onSelectSong(song)}
                className={`group w-full rounded-lg px-2 py-1.5 text-left transition focus:outline-none focus:ring-2 focus:ring-amber-400/80 ${
                  isSelected
                    ? 'bg-emerald-500/10 text-emerald-300'
                    : isMatch
                      ? 'bg-amber-400/10 text-sky-300'
                      : 'text-sky-300 hover:bg-slate-900 hover:text-sky-200'
                }`}
              >
                <span className="mr-2 font-mono text-xs font-black text-amber-300">
                  {String(song.sourcePageNumber ?? song.pageNumber ?? 0).padStart(3, '0')}.
                </span>
                <span className="align-middle text-sm font-bold underline decoration-sky-400/80 underline-offset-4">
                  {title}
                </span>
                <span className="ml-2 align-middle text-[10px] font-semibold text-slate-500 group-hover:text-slate-400">
                  Page {song.sourcePageNumber ?? song.pageNumber ?? '-'}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
