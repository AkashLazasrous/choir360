import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Song, Language } from '../types';
import {
  ArrowLeft,
  BookOpen,
  Check,
  Languages,
  ListMusic,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  Moon,
  Music,
  Pause,
  Play,
  Plus,
  Search,
  Sparkles,
  Sun,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { MULTILINGUAL_DICTIONARY } from '../data/mockData';
import { getSongIdFromLocation, getSongSearchFromLocation, setSongHash, setSongSearchParam } from '../features/songs/utils/songDeepLink';
import { getDisplayTitle, songMatchesQuery } from '../features/songs/utils/songDisplay';
import { PdfSongPage } from '../features/songs/PdfSongPage';
import { SongIndex } from '../features/songs/SongIndex';
import { MobileLyricsOverlay } from '../features/songs/MobileLyricsOverlay';

interface SongLibraryWidgetProps {
  currentLang: Language;
  /** External songs override — if omitted the widget lazy-loads the bundled library */
  songs?: Song[];
}

export const SongLibraryWidget: React.FC<SongLibraryWidgetProps> = ({
  currentLang,
  songs: songsProp
}) => {
  const dict = MULTILINGUAL_DICTIONARY[currentLang] || MULTILINGUAL_DICTIONARY.en;
  const [selfLoadedSongs, setSelfLoadedSongs] = useState<Song[]>([]);

  // Lazy-load bundled song data when no external songs are provided
  useEffect(() => {
    if (songsProp && songsProp.length > 0) return;
    import('../data/jebathotta-jeyageethangal').then((mod) => {
      setSelfLoadedSongs(mod.JEBATHOTTA_JEYAGEETHANGAL_SONGS);
    }).catch(() => { /* ignore */ });
  }, [songsProp]);

  const songs = (songsProp && songsProp.length > 0) ? songsProp : selfLoadedSongs;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'All' | 'Tamil' | 'English'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiExplainText, setAiExplainText] = useState<string | null>(null);
  const [filteredSongIds, setFilteredSongIds] = useState<string[] | null>(null);
  const [selectedSongId, setSelectedSongId] = useState(songs[0]?.id ?? '');
  const [viewerDarkMode, setViewerDarkMode] = useState(true);
  const [viewerFontSize, setViewerFontSize] = useState<number>(14);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isDualLanguage, setIsDualLanguage] = useState(true);
  const [viewerMode, setViewerMode] = useState<'index' | 'detail'>('index');
  const [offlineSaved, setOfflineSaved] = useState<Record<string, boolean>>({});
  const [favoriteSongs, setFavoriteSongs] = useState<Record<string, boolean>>({});
  const [recentSongIds, setRecentSongIds] = useState<string[]>([]);
  const [isMobileLyricsOpen, setIsMobileLyricsOpen] = useState(false);
  const [isPlayingScroll, setIsPlayingScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(20);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  const categoriesList = useMemo(() => {
    const categories = Array.from(new Set(songs.map((song) => song.category).filter(Boolean))).sort();
    return ['All', ...categories];
  }, [songs]);

  const selectedSong = songs.find((song) => song.id === selectedSongId) ?? songs[0] ?? null;

  useEffect(() => {
    const linkedSongId = getSongIdFromLocation();
    const linkedSearch = getSongSearchFromLocation();
    if (linkedSearch) setSearchQuery(linkedSearch);
    if (linkedSongId && songs.some((song) => song.id === linkedSongId)) {
      setSelectedSongId(linkedSongId);
      setViewerMode('detail');
      setIsMobileLyricsOpen(true);
    }
    try {
      setRecentSongIds(JSON.parse(localStorage.getItem('choir360:songs:recent') || '[]'));
      setFavoriteSongs(JSON.parse(localStorage.getItem('choir360:songs:favorites') || '{}'));
    } catch {
      setRecentSongIds([]);
      setFavoriteSongs({});
    }
  }, [songs]);

  useEffect(() => {
    if (!selectedSongId && songs[0]) {
      setSelectedSongId(songs[0].id);
      return;
    }
    if (selectedSongId && !songs.some((song) => song.id === selectedSongId)) {
      setSelectedSongId(songs[0]?.id ?? '');
    }
  }, [selectedSongId, songs]);

  useEffect(() => {
    let scrollInterval: NodeJS.Timeout | null = null;

    if (isPlayingScroll && lyricsContainerRef.current) {
      scrollInterval = setInterval(() => {
        const container = lyricsContainerRef.current;
        if (!container) return;
        container.scrollTop += 1;
        if (container.scrollTop + container.clientHeight >= container.scrollHeight - 5) {
          setIsPlayingScroll(false);
        }
      }, Math.max(10, 100 - scrollSpeed));
    }

    return () => {
      if (scrollInterval) clearInterval(scrollInterval);
    };
  }, [isPlayingScroll, scrollSpeed]);

  useEffect(() => {
    setIsPlayingScroll(false);
    if (lyricsContainerRef.current) {
      lyricsContainerRef.current.scrollTop = 0;
    }
    window.setTimeout(() => {
      document.getElementById(`song-index-${selectedSongId}`)?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }, 0);
  }, [selectedSongId]);

  const triggerAiSmartSearch = async () => {
    if (!searchQuery.trim()) {
      setFilteredSongIds(null);
      setAiExplainText(null);
      return;
    }

    setIsAiSearching(true);
    setAiExplainText('Searching songbook...');
    // Free local search — no paid API needed
    try {
      const matchedIds = songs
        .filter((song) => songMatchesQuery(song, searchQuery))
        .map((song) => song.id);
      setFilteredSongIds(matchedIds);
      setAiExplainText(matchedIds.length > 0
        ? `Found ${matchedIds.length} song page(s) matching "${searchQuery}"`
        : `No match for "${searchQuery}" — try Tamil or English keywords`);
    } finally {
      setIsAiSearching(false);
    }
  };

  const displaySongs = songs.filter((song) => {
    if (selectedCategory !== 'All' && song.category !== selectedCategory) return false;
    if (selectedLanguage !== 'All' && song.language !== selectedLanguage) return false;
    if (filteredSongIds !== null) return filteredSongIds.includes(song.id);
    if (searchQuery.trim()) return songMatchesQuery(song, searchQuery);
    return true;
  });

  const indexedSongs = [...displaySongs].sort((a, b) => getDisplayTitle(a).localeCompare(getDisplayTitle(b), 'ta'));
  const recentSongs = recentSongIds
    .map((id) => songs.find((song) => song.id === id))
    .filter((song): song is Song => Boolean(song));
  const favoriteSongItems = songs.filter((song) => favoriteSongs[song.id]);

  const handleToggleOffline = (songId: string) => {
    setOfflineSaved((current) => ({
      ...current,
      [songId]: !current[songId]
    }));
  };

  const handleSelectSong = (song: Song) => {
    setSelectedSongId(song.id);
    setViewerMode('detail');
    setIsMobileLyricsOpen(true);
    setSongHash(song.id);
    setRecentSongIds((current) => {
      const next = [song.id, ...current.filter((id) => id !== song.id)].slice(0, 8);
      localStorage.setItem('choir360:songs:recent', JSON.stringify(next));
      return next;
    });
  };

  const handleCopyLyrics = async (song: Song) => {
    const text = `${getDisplayTitle(song)}\n${song.category} - ${song.language}\nPage ${song.sourcePageNumber ?? song.pageNumber ?? '-'}\n\n${song.lyrics || song.sourceSearchText || 'Lyrics extraction pending.'}`;
    await navigator.clipboard?.writeText(text);
  };

  const handleShareSong = async (song: Song) => {
    const url = `${window.location.origin}${window.location.pathname}#song-${encodeURIComponent(song.id)}`;
    const text = `${getDisplayTitle(song)} - Page ${song.sourcePageNumber ?? song.pageNumber ?? '-'}`;
    if (navigator.share) {
      await navigator.share({ title: getDisplayTitle(song), text, url });
    } else {
      await navigator.clipboard?.writeText(url);
    }
  };

  const toggleFavoriteSong = (songId: string) => {
    setFavoriteSongs((current) => {
      const next = { ...current, [songId]: !current[songId] };
      localStorage.setItem('choir360:songs:favorites', JSON.stringify(next));
      return next;
    });
  };

  if (!selectedSong) {
    return (
      <div className="apple-empty apple-card">
        <BookOpen className="mx-auto mb-3 h-10 w-10 text-[#c7c7cc]" />
        <h3>No songs imported</h3>
        <p>Import the song PDF to populate the Music Library.</p>
      </div>
    );
  }

  const isPdfSong = Boolean(selectedSong.sourcePdfUrl && selectedSong.sourcePageNumber);

  return (
    <div className="space-y-8 animate-fade-in font-apple text-[#1d1d1f]" id="songs-library-container">
      <div className="apple-card p-6" id="search-controls-card">
        <div className="flex flex-col gap-3 border-b border-[rgba(0,0,0,0.08)] pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-[#18392f]" />
            <div>
              <h3 className="apple-title text-base">Imported PDF Song Library</h3>
              <p className="apple-caption">Only the provided Jebathotta Jeyageethangal PDF is loaded.</p>
            </div>
          </div>
          <div className="apple-badge-forest flex items-center gap-1">
            <Check className="h-3.5 w-3.5" />
            {songs.length} PDF pages
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="relative flex items-center gap-2 md:col-span-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-[#86868b]" />
              <input
                type="text"
                value={searchQuery}
                onKeyDown={(event) => { if (event.key === 'Enter') triggerAiSmartSearch(); }}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSongSearchParam(event.target.value);
                  if (!event.target.value) {
                    setFilteredSongIds(null);
                    setAiExplainText(null);
                  }
                }}
                placeholder={dict.songSearchPlaceholder || 'Search imported songbook'}
                className="apple-input py-3 pl-9 pr-4 !text-[16px]"
                id="song-search-box"
              />
            </div>
            <button
              type="button"
              onClick={triggerAiSmartSearch}
              disabled={isAiSearching}
              className="btn-pill btn-pill-primary btn-pill-sm flex cursor-pointer items-center gap-1.5 disabled:opacity-60"
              id="ai-translit-search-btn"
            >
              {isAiSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Search
            </button>
          </div>

          <div className="space-y-1">
            <label className="apple-label">Language</label>
            <select
              value={selectedLanguage}
              onChange={(event) => setSelectedLanguage(event.target.value as 'All' | 'Tamil' | 'English')}
              className="apple-select !text-[15px]"
            >
              <option value="All">All Languages</option>
              <option value="Tamil">Tamil</option>
              <option value="English">English</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="apple-label">Category</label>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="apple-select !text-[15px]"
            >
              {categoriesList.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {aiExplainText && (
          <div className="mt-4 flex items-center gap-1.5 apple-badge-gold p-3 text-[10px] font-medium">
            <Sparkles className="h-4 w-4 shrink-0 text-[#18392f]" />
            <span>{aiExplainText}</span>
          </div>
        )}
      </div>

      {isMobileLyricsOpen && selectedSong && (
        <MobileLyricsOverlay
          song={selectedSong}
          isPdfSong={isPdfSong}
          viewerDarkMode={viewerDarkMode}
          viewerFontSize={viewerFontSize}
          isPlayingScroll={isPlayingScroll}
          isFavorite={!!favoriteSongs[selectedSong.id]}
          lyricsContainerRef={lyricsContainerRef}
          onClose={() => setIsMobileLyricsOpen(false)}
          onCopy={() => void handleCopyLyrics(selectedSong)}
          onShare={() => void handleShareSong(selectedSong)}
          onToggleFavorite={toggleFavoriteSong}
          onFontSizeChange={setViewerFontSize}
          onToggleDarkMode={() => setViewerDarkMode(!viewerDarkMode)}
          onToggleScroll={() => setIsPlayingScroll(!isPlayingScroll)}
        />
      )}

      <div
        className={`grid grid-cols-1 gap-8 lg:grid-cols-3 ${isMobileLyricsOpen ? 'max-lg:hidden' : ''}`}
        id="song-split-panel"
        aria-hidden={isMobileLyricsOpen ? true : undefined}
      >
        <div className="song-index-scroll space-y-3 overflow-y-auto pr-1 lg:h-[620px]" id="songs-sidebar-list">
          <div className="sticky-below-header sticky z-10 glass-panel p-4">
            <p className="apple-label text-[#18392f]">Song Index</p>
            <h3 className="apple-title mt-1">Jebathotta Jeyageethangal</h3>
            <p className="apple-caption mt-1">
              {indexedSongs.length} songs • alphabetical • hyperlink navigation
            </p>
            {(recentSongs.length > 0 || favoriteSongItems.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {favoriteSongItems.slice(0, 4).map((song) => (
                  <button key={`fav-${song.id}`} type="button" onClick={() => handleSelectSong(song)} className="apple-badge-gold">
                    ★ {getDisplayTitle(song)}
                  </button>
                ))}
                {recentSongs.slice(0, 4).map((song) => (
                  <button key={`recent-${song.id}`} type="button" onClick={() => handleSelectSong(song)} className="apple-badge">
                    {getDisplayTitle(song)}
                  </button>
                ))}
              </div>
            )}
          </div>
          {indexedSongs.length === 0 ? (
            <div className="apple-empty apple-card py-8">
              <BookOpen className="mx-auto mb-2 h-8 w-8 opacity-55" />
              <p className="text-xs">No imported song pages match this search.</p>
            </div>
          ) : (
            indexedSongs.map((song) => {
              const isSelected = selectedSong.id === song.id;
              const isSaved = !!offlineSaved[song.id];
              return (
                <a
                  key={song.id}
                  id={`song-index-${song.id}`}
                  href={`#song-${encodeURIComponent(song.id)}`}
                  onClick={(event) => { event.preventDefault(); handleSelectSong(song); }}
                  className={`song-index-link apple-card flex min-h-[86px] flex-col justify-between p-4 transition ${
                    isSelected
                      ? 'ring-2 ring-[#18392f] bg-[rgba(24,57,47,0.06)]'
                      : 'hover:bg-[rgba(120,120,128,0.06)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="apple-badge-muted text-[9px]">
                      {song.category}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => { event.stopPropagation(); handleToggleOffline(song.id); }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          event.stopPropagation();
                          handleToggleOffline(song.id);
                        }
                      }}
                      className="cursor-pointer text-xs text-slate-400 hover:text-emerald-700"
                      title={isSaved ? 'Saved Offline' : 'Save Offline'}
                    >
                      {isSaved ? <Wifi className="h-4 w-4 text-emerald-600" /> : <WifiOff className="h-4 w-4 text-slate-300" />}
                    </span>
                  </div>

                  <div>
                    <h4 className="tamil-text line-clamp-2 text-[16px] font-semibold tracking-[-0.015em] text-[#1d1d1f]">{getDisplayTitle(song)}</h4>
                    <p className="text-[13px] text-[#86868b]">
                      Page {song.sourcePageNumber ?? song.pageNumber ?? '-'} • {song.category}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 font-mono text-[9px] font-medium text-slate-400">
                    <span>{song.language}</span>
                  </div>
                </a>
              );
            })
          )}
        </div>

        <div className={`hidden flex-col justify-between rounded-3xl border shadow-lg transition duration-300 lg:col-span-2 lg:flex ${
          viewerDarkMode
            ? 'border-slate-850 bg-slate-950 text-slate-100'
            : 'border-slate-200/80 bg-white text-slate-900'
        } ${isPresentationMode ? 'fixed inset-0 z-50 !h-screen overflow-hidden rounded-none p-6 md:p-12' : 'h-[620px]'}`} id="lyrics-viewer-panel">
          <div className={`flex items-center justify-between gap-3 border-b px-5 py-4 ${
            viewerDarkMode ? 'border-slate-850 bg-slate-900/60' : 'border-slate-100 bg-slate-50/70'
          }`} id="viewer-controls">
            <div className="flex min-w-0 items-center gap-3">
              {viewerMode === 'index' ? <ListMusic className="h-4 w-4 shrink-0 text-emerald-500" /> : <BookOpen className="h-4 w-4 shrink-0 text-emerald-500" />}
              <div className="min-w-0">
                <h3 className="truncate text-xs font-bold">
                  {viewerMode === 'index' ? 'Jebathotta Jeyageethangal - Song Index' : getDisplayTitle(selectedSong)}
                </h3>
                <p className="text-[10px] opacity-60">
                  {viewerMode === 'index'
                    ? `${displaySongs.length} songs • Click a title to open the exact PDF page`
                    : `Category: ${selectedSong.category} • ${selectedSong.language} • Page ${selectedSong.sourcePageNumber ?? selectedSong.pageNumber ?? '-'}`}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {viewerMode === 'detail' && (
                <button
                  type="button"
                  onClick={() => setViewerMode('index')}
                  className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-700/20 bg-slate-800/30 px-2.5 py-1.5 text-[10px] font-bold text-slate-300 transition hover:text-emerald-400"
                  title="Back to Song Index"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Song Index
                </button>
              )}

              {!isPdfSong && (
                <div className="flex items-center gap-1 rounded-lg border border-slate-700/20 bg-slate-800/10 px-2 py-1">
                  <button type="button" onClick={() => setViewerFontSize(Math.max(10, viewerFontSize - 1))} className="p-0.5 text-xs hover:text-emerald-500">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="px-1 font-mono text-[10px] font-bold">{viewerFontSize}pt</span>
                  <button type="button" onClick={() => setViewerFontSize(Math.min(32, viewerFontSize + 1))} className="p-0.5 text-xs hover:text-emerald-500">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {!isPdfSong && selectedSong.language === 'Tamil' && selectedSong.lyricsEnglishPattern && (
                <button
                  type="button"
                  onClick={() => setIsDualLanguage(!isDualLanguage)}
                  className={`flex cursor-pointer items-center gap-1 rounded-lg border p-1.5 text-[10px] font-bold transition ${
                    isDualLanguage
                      ? 'border-emerald-400 bg-emerald-600 text-white'
                      : 'border-slate-700/20 bg-slate-800/30 text-slate-400'
                  }`}
                  title="Dual Tamil-English Translit"
                >
                  <Languages className="h-3.5 w-3.5" /> Translit
                </button>
              )}

              <button
                type="button"
                onClick={() => setViewerDarkMode(!viewerDarkMode)}
                className="cursor-pointer rounded-lg border border-slate-700/20 bg-slate-800/30 p-1.5 transition hover:text-emerald-500"
                title="Toggle Dark Mode"
              >
                {viewerDarkMode ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-slate-600" />}
              </button>

              <button
                type="button"
                onClick={() => setIsPresentationMode(!isPresentationMode)}
                className={`cursor-pointer rounded-lg border p-1.5 transition ${
                  isPresentationMode ? 'border-rose-400 bg-rose-600 text-white' : 'border-slate-700/20 bg-slate-800/30 text-slate-400 hover:text-emerald-500'
                }`}
                title="Presentation Projection Mode"
              >
                {isPresentationMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div
            ref={lyricsContainerRef}
            className={`flex-1 overflow-y-auto px-6 py-8 text-center font-sans leading-relaxed ${
              viewerDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-white text-slate-800'
            }`}
            style={{ fontSize: `${viewerFontSize}px` }}
            id="scroller-inner-panel"
          >
            {viewerMode === 'index' ? (
              <SongIndex
                songs={indexedSongs}
                selectedSongId={selectedSong.id}
                searchQuery={searchQuery}
                onSelectSong={handleSelectSong}
              />
            ) : isPdfSong ? (
              <PdfSongPage song={selectedSong} isPresentationMode={isPresentationMode} />
            ) : (
              <div className="mx-auto max-w-xl space-y-6 whitespace-pre-wrap">
                {selectedSong.chordSheet && !isPresentationMode && (
                  <div className="mx-auto mb-6 max-w-lg rounded-xl border border-amber-900/30 bg-amber-50/5 p-4 text-left font-mono text-[11px] leading-normal text-amber-500">
                    <span className="mb-1 block font-sans text-[10px] font-bold uppercase tracking-wider text-amber-600">
                      Chords Keyboardist / Rhythm Sheet:
                    </span>
                    <pre className="whitespace-pre-wrap">{selectedSong.chordSheet}</pre>
                  </div>
                )}

                {isDualLanguage && selectedSong.language === 'Tamil' && selectedSong.lyricsEnglishPattern ? (
                  <div className="mx-auto grid max-w-2xl grid-cols-1 gap-8 text-left md:grid-cols-2">
                    <div className="space-y-4">
                      <h5 className="border-b border-slate-800/40 pb-1 text-center font-mono text-xs font-bold text-slate-500">TAMIL ORIGINAL</h5>
                      <pre className="whitespace-pre-wrap text-center font-sans leading-loose">{selectedSong.lyrics}</pre>
                    </div>
                    <div className="space-y-4 border-l border-slate-800/30 pl-4">
                      <h5 className="border-b border-slate-800/40 pb-1 text-center font-mono text-xs font-bold text-emerald-600">ENGLISH LITURGICAL TRANSLIT</h5>
                      <pre className="whitespace-pre-wrap text-center font-sans italic leading-loose text-emerald-500/80">
                        {selectedSong.lyricsEnglishPattern}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <pre className="font-sans leading-loose tracking-wide">{selectedSong.lyrics}</pre>
                )}
              </div>
            )}
          </div>

          <div className={`flex flex-col items-center justify-between gap-4 border-t px-5 py-4 md:flex-row ${
            viewerDarkMode ? 'border-slate-850 bg-slate-900/40' : 'border-slate-50 bg-slate-50/50'
          }`} id="lyrics-footer-bar">
            <div className="flex w-full items-center gap-3 md:w-auto">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Auto Scroll:</span>
              <button
                type="button"
                onClick={() => setIsPlayingScroll(!isPlayingScroll)}
                className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition ${
                  isPlayingScroll ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {isPlayingScroll ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {isPlayingScroll ? 'Pause Scroll' : 'Start Scroll'}
              </button>

              <div className="ml-2 flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">Speed:</span>
                <input
                  type="range"
                  min="5"
                  max="70"
                  value={scrollSpeed}
                  onChange={(event) => setScrollSpeed(Number(event.target.value))}
                  className="w-24 cursor-pointer accent-emerald-500"
                />
                <span className="font-mono text-[10px]">{scrollSpeed}Hz</span>
              </div>
            </div>

            {!isPresentationMode && (
              <div className="text-xs text-slate-400">
                Original PDF page rendering preserves Tamil exactly.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
