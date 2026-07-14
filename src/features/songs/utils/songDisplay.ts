import { Song } from '../../../types';
import { buildTamilSearchText, expandSearchQuery } from '../../../utils/tamilSearch';

const getSongSearchText = (song: Song) => buildTamilSearchText([
  song.id,
  song.title,
  song.displayTitle,
  song.lyricsTitle,
  song.category,
  song.album,
  song.composer,
  song.singer,
  song.lyrics,
  song.lyricsEnglishPattern,
  song.sourceSearchText,
].filter(Boolean).join('\n'));

export const songMatchesQuery = (song: Song, query: string) => {
  const terms = expandSearchQuery(query);
  if (terms.length === 0) return true;
  const haystack = getSongSearchText(song);
  return terms.some((term) => haystack.includes(term));
};

export const getDisplayTitle = (song: Song) =>
  song.displayTitle || song.title || `Untitled Song - Page ${song.sourcePageNumber ?? song.pageNumber ?? '-'}`;
