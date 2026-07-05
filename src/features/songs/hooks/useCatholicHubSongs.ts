/**
 * Reads Catholic Tamil songs from the backend cache API.
 * This hook never scrapes source pages by itself. Category buttons call
 * /api/catholic-hub/songs/ensure, and refresh() only reloads cached data.
 */
import { useCallback, useEffect, useState } from 'react';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { apiFetch } from '../../../services/apiClient';
import { db, ensureFirebaseConfigured } from '../../../services/firebase';

export interface CatholicHubSong {
  id: string;
  title: string;
  titleNormalized?: string;
  category: string;
  categoryTamil: string;
  lyrics: string;
  lyricsNormalized?: string;
  sourceUrl: string;
  sourcePageUrl?: string;
  sourcePage?: string;
  order: number;
  tags: string[];
  contentHash?: string;
  isArchived?: boolean;
  lastSourceSeenAt?: string;
  lastSyncedAt?: string;
}

export interface CatholicHubSongSyncStatus {
  categoryId: string;
  categoryTamil: string;
  sourceUrl: string;
  status?: 'idle' | 'syncing' | 'success' | 'failed';
  lastSyncedAt?: string;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  errorMessage?: string;
  totalFetched?: number;
  totalCreated?: number;
  totalUpdated?: number;
  totalUnchanged?: number;
  totalArchived?: number;
  totalSongsSynced?: number;
  syncDurationMs?: number;
  nextScheduledSyncAt?: string;
}

export interface UseCatholicHubSongsResult {
  songs: CatholicHubSong[];
  syncStatuses: CatholicHubSongSyncStatus[];
  loading: boolean;
  error: string;
  lastLoadedAt: string;
  refresh: () => Promise<void>;
}

function dedupeAndSortSongs(rawSongs: CatholicHubSong[]) {
  const seenUrls = new Map<string, CatholicHubSong>();
  for (const song of rawSongs) {
    const normalizedSong = {
      ...song,
      sourcePageUrl: song.sourcePageUrl ?? song.sourcePage,
    };
    const key = normalizedSong.sourceUrl || normalizedSong.sourcePage || normalizedSong.id;
    const prev = seenUrls.get(key);
    if (!prev || (normalizedSong.lastSyncedAt ?? '') > (prev.lastSyncedAt ?? '')) {
      seenUrls.set(key, normalizedSong);
    }
  }

  const loaded = Array.from(seenUrls.values());
  loaded.sort((a, b) => {
    const cat = (a.category ?? '').localeCompare(b.category ?? '');
    return cat !== 0 ? cat : (a.order ?? 0) - (b.order ?? 0);
  });
  return loaded;
}

async function loadSongsFromApi() {
  const response = await apiFetch('/api/catholic-hub/songs');
  if (!response.ok) throw new Error('Backend song cache is unavailable.');
  const payload = await response.json();
  return {
    songs: dedupeAndSortSongs(Array.isArray(payload?.songs) ? payload.songs : []),
    syncStatuses: Array.isArray(payload?.syncStatus) ? payload.syncStatus as CatholicHubSongSyncStatus[] : [],
  };
}

async function loadSongsFromFirestore() {
  await ensureFirebaseConfigured();

  if (!db) {
    return { songs: [] as CatholicHubSong[], syncStatuses: [] as CatholicHubSongSyncStatus[] };
  }

  const songsSnap = await getDocs(
    query(
      collection(db, 'catholicHubSongs'),
      where('status', '==', 'active'),
      limit(1500),
    ),
  );
  let syncStatuses: CatholicHubSongSyncStatus[] = [];
  try {
    const statusSnap = await getDocs(collection(db, 'catholicHubSongSyncStatus'));
    syncStatuses = statusSnap.docs.map((d) => d.data() as CatholicHubSongSyncStatus);
  } catch {
    // Public users can still use cached songs even if operational sync metadata
    // is temporarily unavailable because of rules or rollout timing.
    syncStatuses = [];
  }

  return {
    songs: dedupeAndSortSongs(songsSnap.docs.map((d) => d.data() as CatholicHubSong)),
    syncStatuses,
  };
}

export function useCatholicHubSongs(): UseCatholicHubSongsResult {
  const [songs, setSongs] = useState<CatholicHubSong[]>([]);
  const [syncStatuses, setSyncStatuses] = useState<CatholicHubSongSyncStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastLoadedAt, setLastLoadedAt] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const loaded = await loadSongsFromApi();
      setSongs(loaded.songs);
      setSyncStatuses(loaded.syncStatuses);
      setLastLoadedAt(new Date().toISOString());
    } catch (apiError) {
      try {
        const loaded = await loadSongsFromFirestore();
        setSongs(loaded.songs);
        setSyncStatuses(loaded.syncStatuses);
        setLastLoadedAt(new Date().toISOString());
      } catch (fallbackError) {
        const msg = fallbackError instanceof Error ? fallbackError.message : String(apiError);
        if (msg.includes('Missing or insufficient permissions')) {
          setSongs([]);
          setSyncStatuses([]);
        } else {
          setError('Songs could not be loaded. Please try refreshing.');
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return { songs, syncStatuses, loading, error, lastLoadedAt, refresh };
}
