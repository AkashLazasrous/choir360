export function getSongIdFromLocation(location: Location = window.location) {
  const hashMatch = location.hash.match(/^#song-(.+)$/);
  if (hashMatch?.[1]) return decodeURIComponent(hashMatch[1]);

  const params = new URLSearchParams(location.search);
  return params.get('song') || '';
}

export function setSongHash(songId: string) {
  if (!songId) return;
  const nextHash = `song-${encodeURIComponent(songId)}`;
  if (window.location.hash.slice(1) !== nextHash) {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${nextHash}`);
  }
}

export function setSongSearchParam(search: string) {
  const url = new URL(window.location.href);
  if (search.trim()) {
    url.searchParams.set('search', search.trim());
  } else {
    url.searchParams.delete('search');
  }
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

export function getSongSearchFromLocation(location: Location = window.location) {
  return new URLSearchParams(location.search).get('search') || '';
}
