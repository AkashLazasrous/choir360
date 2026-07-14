import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Copy, Music2, RefreshCw, Search, Share2, X } from 'lucide-react';
import { apiFetch } from '../../services/apiClient';
import {
  useCatholicHubSongs,
  type CatholicHubSong,
  type CatholicHubSongSyncStatus,
} from '../songs/hooks/useCatholicHubSongs';
import { HUB_SONG_CATEGORIES } from './data/songCategories';
import { expandHubSearchQuery, normalizeHubSearch } from './search';

export const HubSongsTab: React.FC = () => {
  // ── Songs — loaded once from Firestore; never triggers a source scrape ──────
  const {
    songs,
    syncStatuses,
    loading: isLoadingSongs,
    error: songsError,
    refresh: loadSongs,
  } = useCatholicHubSongs();

  const [songSearch, setSongSearch] = useState('');
  const [songCategory, setSongCategory] = useState('all');
  const [selectedSongId, setSelectedSongId] = useState('');
  const [ensuringSongCategory, setEnsuringSongCategory] = useState('');
  const [songSyncMessage, setSongSyncMessage] = useState('');
  const [mobileSongOpen, setMobileSongOpen] = useState(false);

  // Auto-select first song when songs are loaded (honouring a #song- deep link)
  useEffect(() => {
    if (songs.length > 0 && !selectedSongId) {
      const hashSongId = window.location.hash.replace(/^#song-/, '');
      const next = songs.find((s) => s.id === hashSongId) || songs[0];
      if (next) setSelectedSongId(next.id);
    }
  }, [songs, selectedSongId]);

  const ensureSongCategory = async (categoryId: string) => {
    if (categoryId === 'all') {
      setSongCategory('all');
      setSelectedSongId('');
      setSongSyncMessage('');
      await loadSongs();
      return;
    }

    setSongCategory(categoryId);
    setSelectedSongId('');
    setSongSyncMessage('Checking cached songs for this category...');
    setEnsuringSongCategory(categoryId);

    try {
      const response = await apiFetch('/api/catholic-hub/songs/ensure', {
        method: 'POST',
        body: JSON.stringify({ categoryId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Song category sync failed.');
      setSongSyncMessage(payload?.skipped ? payload.message || 'Category already synced.' : 'Category synced. Loading songs...');
      await loadSongs();
    } catch (error) {
      setSongSyncMessage(error instanceof Error ? error.message : 'Song category sync failed.');
    } finally {
      setEnsuringSongCategory('');
    }
  };

  const filteredSongs = useMemo(() => {
    const queryParts = expandHubSearchQuery(songSearch);
    const seen = new Set<string>();
    return songs.filter((song) => {
      if (seen.has(song.id)) return false;
      seen.add(song.id);
      if (songCategory !== 'all' && song.category !== songCategory) return false;
      if (queryParts.length === 0) return true;
      const haystack = normalizeHubSearch([
        song.title,
        song.categoryTamil,
        song.lyrics,
        song.tags?.join(' ') || '',
      ].join(' '));
      return queryParts.some((part) => haystack.includes(part));
    });
  }, [songs, songCategory, songSearch]);

  // Group filtered songs by category for the index panel
  const groupedSongs = useMemo(() => {
    const map = new Map<string, { label: string; songs: CatholicHubSong[] }>();
    for (const song of filteredSongs) {
      const key = song.category || 'other';
      if (!map.has(key)) map.set(key, { label: song.categoryTamil || key, songs: [] });
      map.get(key)!.songs.push(song);
    }
    return Array.from(map.values());
  }, [filteredSongs]);

  const selectedSong =
    filteredSongs.find((song) => song.id === selectedSongId) ||
    filteredSongs[0] ||
    (songCategory === 'all' ? songs[0] : undefined);
  const selectedStatus: CatholicHubSongSyncStatus | undefined =
    syncStatuses.find((s) => s.categoryId === songCategory) ||
    syncStatuses.find((s) => s.categoryId === selectedSong?.category);

  const selectSong = (song: CatholicHubSong, openMobile = false) => {
    setSelectedSongId(song.id);
    window.history.replaceState(null, '', `#song-${song.id}`);
    if (openMobile) setMobileSongOpen(true);
  };

  const copySong = async (song?: CatholicHubSong) => {
    if (!song) return;
    await navigator.clipboard?.writeText(`${song.title}\n\n${song.lyrics || ''}`.trim());
  };

  const shareSong = async (song?: CatholicHubSong) => {
    if (!song) return;
    const text = `${song.title}\n${window.location.href}`;
    if (navigator.share) {
      await navigator.share({ title: song.title, text, url: window.location.href });
      return;
    }
    await navigator.clipboard?.writeText(text);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">Catholic Tamil Songs</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">Songs</h2>
            <p className="mt-1 text-xs text-slate-500">
              {selectedStatus?.lastSuccessAt
                ? `Last synced ${new Date(selectedStatus.lastSuccessAt).toLocaleString()} · ${songs.length} songs`
                : songs.length > 0
                ? `${songs.length} songs loaded from cache`
                : 'No songs synced yet. Select a category to fetch songs.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void loadSongs()}
              disabled={isLoadingSongs}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 disabled:opacity-40"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingSongs ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
          <RefreshCw className={`h-3 w-3 ${ensuringSongCategory ? 'animate-spin text-amber-700' : ''}`} />
          {songSyncMessage || 'Select a category to load cached songs. Missing or stale categories sync automatically once every 3 months.'}
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={songSearch}
              onChange={(e) => setSongSearch(e.target.value)}
              placeholder="Search Tamil title, lyrics, anbe, arul..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none min-h-[44px] focus:border-amber-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible">
            <button
              type="button"
              onClick={() => void ensureSongCategory('all')}
              className={`flex-shrink-0 rounded-xl px-3 py-2 text-left text-xs font-black transition-all ${songCategory === 'all' ? 'bg-amber-800 text-white shadow' : 'border border-slate-200 bg-white text-slate-700'}`}
            >
              All Songs
            </button>
            {HUB_SONG_CATEGORIES.map((category) => (
              <button
                key={category.categoryId}
                type="button"
                onClick={() => void ensureSongCategory(category.categoryId)}
                disabled={ensuringSongCategory === category.categoryId}
                className={`flex-shrink-0 rounded-xl px-3 py-2 text-left text-xs font-black transition-all disabled:opacity-60 ${songCategory === category.categoryId ? 'bg-amber-800 text-white shadow' : 'border border-slate-200 bg-white text-slate-700'}`}
              >
                {ensuringSongCategory === category.categoryId && <RefreshCw className="mr-1.5 inline h-3.5 w-3.5 animate-spin" />}
                {category.categoryTamil}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
            <div className="flex items-center justify-between px-2 py-2">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Song Index</p>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-800">{filteredSongs.length}</span>
            </div>
            <div className="max-h-[62vh] space-y-1 overflow-y-auto pr-1">
              {isLoadingSongs ? (
                <div className="flex min-h-[180px] items-center justify-center text-sm font-bold text-slate-500">
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading songs...
                </div>
              ) : filteredSongs.length === 0 ? (
                <div className="space-y-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                  {/* Category not synced yet — show targeted sync action for admins */}
                  {songCategory !== 'all' && songs.length > 0 ? (
                    // Songs exist globally but none for this category → not synced
                    <div className="space-y-2 px-1 py-2 text-center">
                      <p className="font-bold text-slate-700">
                        {`"${HUB_SONG_CATEGORIES.find(c => c.categoryId === songCategory)?.categoryTamil || songCategory}" has not been synced yet.`}
                      </p>
                      <button
                        type="button"
                        onClick={() => void ensureSongCategory(songCategory)}
                        disabled={ensuringSongCategory === songCategory}
                        className="mx-auto flex min-h-[36px] items-center gap-1.5 rounded-xl bg-amber-800 px-4 text-xs font-bold text-white disabled:opacity-40"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${ensuringSongCategory === songCategory ? 'animate-spin' : ''}`} />
                        {ensuringSongCategory === songCategory ? 'Syncing songs...' : 'Load this category'}
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="px-2 py-1 text-center font-bold text-slate-700">
                        {songs.length === 0
                          ? 'No songs synced yet. Select a category to fetch songs.'
                          : 'No songs match your search.'}
                      </p>
                      {songs.length === 0 && (
                        <div className="space-y-2">
                          {HUB_SONG_CATEGORIES.map((category) => (
                            <button
                              key={category.categoryId}
                              type="button"
                              onClick={() => void ensureSongCategory(category.categoryId)}
                              disabled={ensuringSongCategory === category.categoryId}
                              className="flex min-h-[44px] w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-left font-bold text-amber-800 shadow-sm disabled:opacity-60"
                            >
                              <span>{category.categoryTamil}</span>
                              <RefreshCw className={`h-3.5 w-3.5 ${ensuringSongCategory === category.categoryId ? 'animate-spin' : ''}`} />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                groupedSongs.map(({ label, songs: groupSongs }) => (
                  <div key={label}>
                    <div className="sticky top-0 z-10 bg-white px-2 pb-1 pt-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">{label}</p>
                    </div>
                    {groupSongs.map((song) => (
                      <button
                        key={song.id}
                        type="button"
                        onClick={() => selectSong(song, window.matchMedia('(max-width: 767px)').matches)}
                        className={`w-full rounded-xl p-3 text-left transition ${selectedSong?.id === song.id ? 'bg-amber-50 ring-1 ring-amber-200' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-sm font-black text-slate-900">{song.title}</p>
                          <span className="mt-0.5 flex-shrink-0 text-[10px] font-bold text-amber-700 md:hidden">Read →</span>
                        </div>
                        <p className="mt-1 text-[11px] font-semibold text-slate-400">#{song.order}</p>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        <section className="hidden min-h-[620px] rounded-3xl border border-slate-100 bg-white shadow-sm md:block">
          {songsError ? (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center p-8 text-center">
              <Music2 className="h-10 w-10 text-rose-500" />
              <h3 className="mt-3 text-sm font-black text-slate-900">Songs are not available yet</h3>
              <p className="mt-1 max-w-md text-xs text-slate-500">Songs are not available yet. Please sync content or try again.</p>
              <button
                type="button"
                onClick={() => void loadSongs()}
                className="mt-4 inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-amber-800 px-4 text-xs font-bold text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          ) : selectedSong ? (
            <article className="flex h-full min-h-[620px] flex-col">
              <header className="border-b border-slate-100 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">{selectedSong.categoryTamil}</p>
                    <h3 className="mt-1 text-2xl font-black text-slate-950">{selectedSong.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">Tamil · Song #{selectedSong.order}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => void copySong(selectedSong)} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700"><Copy className="h-3.5 w-3.5" /> Copy</button>
                    <button onClick={() => void shareSong(selectedSong)} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700"><Share2 className="h-3.5 w-3.5" /> Share</button>
                  </div>
                </div>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                {selectedSong.lyrics ? (
                  <p className="whitespace-pre-line font-serif text-xl leading-10 text-slate-900">{selectedSong.lyrics}</p>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    Lyrics extraction is pending. Reload this category to refresh the cached song content.
                  </div>
                )}
              </div>
            </article>
          ) : (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center p-8 text-center text-sm text-slate-500">
              <Music2 className="h-10 w-10 text-amber-700" />
              <h3 className="mt-3 text-base font-black text-slate-900">Catholic Tamil Songs</h3>
              <p className="mt-1 max-w-md">
                Select a category to fetch and display songs here. Missing categories sync from the source automatically and then stay cached.
              </p>
              <div className="mt-5 grid w-full max-w-xl gap-2 sm:grid-cols-3">
                {HUB_SONG_CATEGORIES.map((category) => (
                  <button
                    key={category.categoryId}
                    type="button"
                    onClick={() => void ensureSongCategory(category.categoryId)}
                    disabled={ensuringSongCategory === category.categoryId}
                    className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs font-black text-amber-900"
                  >
                    {ensuringSongCategory === category.categoryId && <RefreshCw className="mr-1.5 inline h-3.5 w-3.5 animate-spin" />}
                    {category.categoryTamil}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {mobileSongOpen && selectedSong && (
        <div className="fixed inset-0 z-[70] bg-white md:hidden">
          <div className="flex h-[100dvh] flex-col pb-[env(safe-area-inset-bottom)]">
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 p-4 backdrop-blur">
              <div className="flex items-center justify-between gap-2">
                <button onClick={() => setMobileSongOpen(false)} className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700"><ArrowLeft className="h-4 w-4" /> Songs</button>
                <button onClick={() => setMobileSongOpen(false)} className="min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 p-2 text-slate-600" aria-label="Close"><X className="h-4 w-4" /></button>
              </div>
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">{selectedSong.categoryTamil}</p>
              <h3 className="mt-1 text-lg font-black text-slate-950">{selectedSong.title}</h3>
              <p className="mt-1 text-xs text-slate-500">Tamil · Song #{selectedSong.order}</p>
              <div className="mt-3 flex gap-2 overflow-x-auto">
                <button onClick={() => void copySong(selectedSong)} className="inline-flex min-h-[40px] flex-shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700"><Copy className="h-3.5 w-3.5" /> Copy</button>
                <button onClick={() => void shareSong(selectedSong)} className="inline-flex min-h-[40px] flex-shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700"><Share2 className="h-3.5 w-3.5" /> Share</button>
              </div>
            </header>
            <main className="min-h-0 flex-1 overflow-y-auto p-5 overscroll-contain">
              {selectedSong.lyrics ? (
                <p className="whitespace-pre-line font-serif text-xl leading-10 text-slate-900">{selectedSong.lyrics}</p>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                  Lyrics extraction is pending. Reload this category to refresh the cached song content.
                </div>
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
};
