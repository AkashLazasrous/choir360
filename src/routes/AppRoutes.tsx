import { Tab } from '../types';

export const APP_ROUTES = {
  songs: '/songs',
  songHash: (songId: string) => `/songs#song-${encodeURIComponent(songId)}`,
  songsSearch: (query: string) => `/songs?search=${encodeURIComponent(query)}`,
};

/**
 * URL path for every app tab. Firebase Hosting rewrites all paths to
 * index.html (and Vite dev does the same), so these are safe deep links.
 */
export const TAB_PATHS: Record<Tab, string> = {
  landing: '/',
  calendar: '/calendar',
  masses: '/masses',
  registration: '/people',
  dashboard_member: '/ministry',
  bible: '/bible',
  song_library: '/songs',
  ai_hub: '/ai-hub',
  analytics: '/insights',
  catholic_hub: '/catholic-hub',
  liturgical_planner: '/planner',
  gamification: '/achievements',
  rehearsals: '/rehearsals',
};

const PATH_TO_TAB: Record<string, Tab> = Object.fromEntries(
  (Object.entries(TAB_PATHS) as [Tab, string][]).map(([tab, path]) => [path, tab]),
);

/** Resolve a location pathname to a tab; unknown paths fall back to the landing tab. */
export function tabFromPath(pathname: string): Tab {
  const normalized = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return PATH_TO_TAB[normalized] ?? 'landing';
}

/** Push the tab's path onto the history stack (no-op when already there). */
export function pushTabPath(tab: Tab) {
  if (window.location.pathname !== TAB_PATHS[tab]) {
    window.history.pushState(null, '', TAB_PATHS[tab]);
  }
}

/** Replace the current history entry with the tab's path (for redirects). */
export function replaceTabPath(tab: Tab) {
  if (window.location.pathname !== TAB_PATHS[tab]) {
    window.history.replaceState(null, '', TAB_PATHS[tab]);
  }
}
