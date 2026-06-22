import React from 'react';
import { Song } from '../../../types';
import { SongIndexItem } from './SongIndexItem';
import { getSongTitle } from '../utils/songSearch';

interface SongIndexProps {
  songs: Song[];
  selectedSongId: string;
  onSelect: (song: Song) => void;
}

export const SongIndex: React.FC<SongIndexProps> = ({ songs, selectedSongId, onSelect }) => {
  const sortedSongs = [...songs].sort((a, b) => getSongTitle(a).localeCompare(getSongTitle(b), 'ta'));

  return (
    <div className="space-y-2">
      {sortedSongs.map((song) => (
        <SongIndexItem key={song.id} song={song} isSelected={song.id === selectedSongId} onSelect={onSelect} />
      ))}
    </div>
  );
};
