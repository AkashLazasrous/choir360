import { useEffect, useMemo, useState } from 'react';
import { Song } from '../../../types';
import { getSongIdFromLocation, setSongHash } from '../utils/songDeepLink';

export function useSongSelection(songs: Song[]) {
  const [selectedSongId, setSelectedSongId] = useState(songs[0]?.id ?? '');
  const selectedSong = useMemo(
    () => songs.find((song) => song.id === selectedSongId) ?? songs[0] ?? null,
    [selectedSongId, songs],
  );

  useEffect(() => {
    const linkedSongId = getSongIdFromLocation();
    if (linkedSongId && songs.some((song) => song.id === linkedSongId)) {
      setSelectedSongId(linkedSongId);
    }
  }, [songs]);

  const selectSong = (song: Song) => {
    setSelectedSongId(song.id);
    setSongHash(song.id);
  };

  return { selectedSong, selectedSongId, selectSong };
}
