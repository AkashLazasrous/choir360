import React from 'react';
import { Language, Song } from '../../../types';
import { SongLibraryWidget } from '../../../components/SongLibraryWidget';

interface SongsPageProps {
  currentLang: Language;
  songs: Song[];
}

export const SongsPage: React.FC<SongsPageProps> = ({ currentLang, songs }) => (
  <SongLibraryWidget currentLang={currentLang} songs={songs} />
);
