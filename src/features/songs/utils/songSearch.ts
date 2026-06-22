import { Song } from '../../../types';
import { buildTamilSearchText, expandSearchQuery } from '../../../utils/tamilSearch';

export function getSongTitle(song: Song) {
  return song.displayTitle || song.title || `Untitled Song - Page ${song.sourcePageNumber ?? song.pageNumber ?? '-'}`;
}

export function getSongSearchText(song: Song) {
  return buildTamilSearchText([
    song.id,
    song.title,
    song.displayTitle,
    song.lyricsTitle,
    song.category,
    song.language,
    song.lyrics,
    song.lyricsEnglishPattern,
    song.sourceSearchText,
  ].filter(Boolean).join('\n'));
}

export function songMatchesSearch(song: Song, query: string) {
  const terms = expandSearchQuery(query);
  if (!terms.length) return true;
  const haystack = getSongSearchText(song);
  return terms.some((term) => haystack.includes(term));
}
