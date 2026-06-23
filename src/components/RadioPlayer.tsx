import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, Radio, Volume2, VolumeX } from 'lucide-react';
import { apiFetch } from '../services/apiClient';

interface StreamInfo {
  streamUrl: string | null;
  artist: string;
  title: string;
  cover: string | null;
}

export const RadioPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Fetch stream URL from backend proxy
  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch('/api/radio/stream-url');
        const data = await res.json() as StreamInfo;
        setStreamInfo(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  // Refresh current track every 30 s (without interrupting playback)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await apiFetch('/api/radio/stream-url');
        const data = await res.json() as StreamInfo;
        setStreamInfo((prev) => prev ? { ...prev, artist: data.artist, title: data.title } : data);
      } catch { /* silent */ }
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleTogglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !streamInfo?.streamUrl) {
      // Fallback: open RadioKing in new tab
      window.open('https://www.radioking.com/play/catholic-tamil', '_blank', 'noopener');
      return;
    }
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    }
  };

  const handleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted((m) => !m);
    }
  };

  const trackLabel = streamInfo
    ? [streamInfo.artist, streamInfo.title].filter(Boolean).join(' · ') || 'Catholic Tamil Radio'
    : 'Catholic Tamil Radio';

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/8 p-3">
      {/* Hidden HTML5 audio element */}
      {streamInfo?.streamUrl && (
        <audio
          ref={audioRef}
          src={streamInfo.streamUrl}
          preload="none"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => { setIsPlaying(false); setError(true); }}
        />
      )}

      <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200/70">
        Live Radio
      </p>

      <div className="flex items-center gap-3">
        {/* Play / Pause */}
        <button
          type="button"
          onClick={() => void handleTogglePlay()}
          disabled={loading}
          aria-label={isPlaying ? 'Pause radio' : 'Play Catholic Tamil Radio'}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-300 text-[#18392f] shadow transition hover:bg-amber-200 disabled:opacity-50"
        >
          {loading ? (
            <Radio className="h-4 w-4 animate-pulse" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 translate-x-[1px]" />
          )}
        </button>

        {/* Track info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold leading-tight text-white">
            Catholic Tamil Radio
          </p>
          <p className="mt-0.5 truncate text-[10px] text-emerald-100/60">
            {loading ? 'Connecting...' : error ? 'Tap play to open' : trackLabel}
          </p>
        </div>

        {/* Mute */}
        {streamInfo?.streamUrl && (
          <button
            type="button"
            onClick={handleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-emerald-200/60 transition hover:text-white"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        )}

        {/* Live badge */}
        {isPlaying && (
          <span className="shrink-0 rounded-full bg-red-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-red-300">
            Live
          </span>
        )}
      </div>
    </div>
  );
};
