import React from 'react';
import { Song } from '../../../types';
import { SongIndex } from './SongIndex';
import { SongLyricsViewer } from './SongLyricsViewer';

interface DesktopSongSplitViewProps {
  songs: Song[];
  selectedSong: Song;
  onSelect: (song: Song) => void;
}

export const DesktopSongSplitView: React.FC<DesktopSongSplitViewProps> = ({ songs, selectedSong, onSelect }) => (
  <div className="hidden gap-6 lg:grid lg:grid-cols-[360px_minmax(0,1fr)]">
    <aside className="song-index-scroll max-h-[calc(100dvh-12rem)] overflow-y-auto">
      <SongIndex songs={songs} selectedSongId={selectedSong.id} onSelect={onSelect} />
    </aside>
    <SongLyricsViewer song={selectedSong} />
  </div>
);
