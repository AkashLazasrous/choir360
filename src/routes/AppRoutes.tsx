export const APP_ROUTES = {
  songs: '/songs',
  songHash: (songId: string) => `/songs#song-${encodeURIComponent(songId)}`,
  songsSearch: (query: string) => `/songs?search=${encodeURIComponent(query)}`,
};
