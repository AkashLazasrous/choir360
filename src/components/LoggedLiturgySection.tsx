import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  Loader2,
  Music2,
  Save,
  Mic2,
} from 'lucide-react';
import type { Mass, Rehearsal, Tab } from '../types';

export type LiturgyLogKind = 'mass' | 'practice';

export type LiturgySongNotesSave = {
  id: string;
  kind: LiturgyLogKind;
  songNotes: string;
};

export type LiturgyLogEntry = {
  id: string;
  kind: LiturgyLogKind;
  name: string;
  date: string;
  time: string;
  subtitle: string;
  songNotes: string;
};

function songNotesFromRehearsal(r: Rehearsal): string {
  if (r.notes?.trim()) return r.notes.trim();
  if (r.songs?.length) return r.songs.join('\n');
  return '';
}

/** Merge masses + practices, newest first. */
export function buildLiturgyLogEntries(
  masses: Mass[],
  rehearsals: Rehearsal[],
): LiturgyLogEntry[] {
  const massEntries: LiturgyLogEntry[] = masses.map((m) => ({
    id: m.id,
    kind: 'mass',
    name: m.name,
    date: m.date,
    time: m.time,
    subtitle: m.category,
    songNotes: (m.notes ?? '').trim(),
  }));

  const practiceEntries: LiturgyLogEntry[] = rehearsals
    .filter((r) => r.status !== 'Cancelled')
    .map((r) => ({
      id: r.id,
      kind: 'practice' as const,
      name: r.name,
      date: r.date,
      time: r.startTime,
      subtitle: r.type,
      songNotes: songNotesFromRehearsal(r),
    }));

  return [...massEntries, ...practiceEntries].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    if (byDate !== 0) return byDate;
    return (b.time || '').localeCompare(a.time || '');
  });
}

type LoggedLiturgySectionProps = {
  masses: Mass[];
  rehearsals: Rehearsal[];
  isAdmin: boolean;
  limit?: number;
  /** desk = Overview apple-card; mobile = OLED home surface */
  variant?: 'desk' | 'mobile';
  onNavigate: (tab: Tab) => void;
  onSaveSongNotes?: (payload: LiturgySongNotesSave) => Promise<{ ok: boolean; error?: string }>;
};

/**
 * Overview “Logged masses & practices” — shows liturgy + practice logs with
 * admin-only song-list notes. Shared by desktop Overview and mobile Home.
 */
export const LoggedLiturgySection: React.FC<LoggedLiturgySectionProps> = ({
  masses,
  rehearsals,
  isAdmin,
  limit = 8,
  variant = 'desk',
  onNavigate,
  onSaveSongNotes,
}) => {
  const entries = useMemo(
    () => buildLiturgyLogEntries(masses, rehearsals).slice(0, limit),
    [masses, rehearsals, limit],
  );

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isMobile = variant === 'mobile';

  const openNotes = (entry: LiturgyLogEntry) => {
    setExpandedId((prev) => (prev === entry.id ? null : entry.id));
    setDrafts((prev) => ({
      ...prev,
      [entry.id]: prev[entry.id] ?? entry.songNotes,
    }));
    setMessage(null);
  };

  const handleSave = async (entry: LiturgyLogEntry) => {
    if (!isAdmin || !onSaveSongNotes) return;
    const songNotes = (drafts[entry.id] ?? entry.songNotes).trim();
    setSavingId(entry.id);
    setMessage(null);
    const result = await onSaveSongNotes({ id: entry.id, kind: entry.kind, songNotes });
    setSavingId(null);
    if (result.ok) {
      setMessage('Song list saved.');
      setTimeout(() => setMessage(null), 2500);
    } else {
      setMessage(result.error ?? 'Could not save song list.');
    }
  };

  const manageTab = (kind: LiturgyLogKind): Tab =>
    kind === 'practice' ? 'rehearsals' : 'masses';

  return (
    <article
      className={
        isMobile
          ? 'rounded-[1.25rem] border border-white/8 bg-black/50 p-3.5'
          : 'apple-card p-5 sm:p-6'
      }
    >
      <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
        <div className="min-w-0">
          <p className={isMobile ? 'text-[11px] font-semibold uppercase tracking-wider text-[#86868b]' : 'apple-caption'}>
            Parish liturgy log
          </p>
          <h3 className={isMobile ? 'mt-0.5 text-[16px] font-semibold tracking-[-0.02em] text-[#f5f5f7]' : 'apple-title mt-0.5'}>
            Logged masses & practices
          </h3>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('masses')}
          className={
            isMobile
              ? 'inline-flex min-h-[40px] items-center gap-1 rounded-full border border-white/12 px-3 text-[12px] font-semibold text-[#f5f5f7]'
              : 'btn-pill btn-pill-secondary !min-h-[44px] !text-[13px]'
          }
        >
          Manage <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {entries.length === 0 ? (
        <button
          type="button"
          onClick={() => onNavigate('masses')}
          className={
            isMobile
              ? 'flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-white/14 px-4 py-6 text-center'
              : 'apple-empty w-full rounded-2xl border border-dashed border-black/10 bg-[#f5f5f7]'
          }
        >
          <div
            className={
              isMobile
                ? 'flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-amber-300'
                : 'flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0e3d4c]'
            }
          >
            <BookOpen className="h-5 w-5" />
          </div>
          <h3 className={isMobile ? 'text-[14px] font-semibold text-[#f5f5f7]' : undefined}>
            No masses or practices logged yet
          </h3>
          <p className={isMobile ? 'text-[12px] text-[#86868b]' : undefined}>
            Log a liturgy or practice session to see it here.
          </p>
        </button>
      ) : (
        <ul className={isMobile ? 'space-y-2' : 'apple-grouped divide-y divide-black/[0.06]'}>
          {entries.map((entry, i) => {
            const open = expandedId === entry.id;
            const draft = drafts[entry.id] ?? entry.songNotes;
            const Icon = entry.kind === 'practice' ? Mic2 : BookOpen;
            return (
              <li
                key={`${entry.kind}-${entry.id}`}
                className={
                  isMobile
                    ? 'rounded-xl border border-white/8 bg-white/[0.04]'
                    : undefined
                }
              >
                <div
                  className={
                    isMobile
                      ? 'flex items-start gap-3 px-3 py-3'
                      : 'apple-list-row !items-start'
                  }
                >
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      entry.kind === 'practice'
                        ? isMobile
                          ? 'bg-sky-500/20 text-sky-300'
                          : 'bg-[rgba(56,189,248,0.18)] text-[#0369a1]'
                        : i === 0
                          ? isMobile
                            ? 'bg-[#0e3d4c] text-amber-300'
                            : 'bg-[#0e3d4c] text-amber-300'
                          : isMobile
                            ? 'bg-white/10 text-[#a1a1a6]'
                            : 'bg-black/[0.06] text-[#86868b]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={
                          isMobile
                            ? 'truncate text-[14px] font-semibold text-[#f5f5f7]'
                            : 'truncate text-[15px] font-medium text-[#1d1d1f]'
                        }
                      >
                        {entry.name}
                      </p>
                      <span
                        className={
                          isMobile
                            ? 'rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#a1a1a6]'
                            : 'apple-badge-forest !text-[10px]'
                        }
                      >
                        {entry.kind === 'practice' ? 'Practice' : 'Mass'}
                      </span>
                    </div>
                    <p className={isMobile ? 'mt-0.5 text-[11px] text-[#86868b]' : 'mt-0.5 text-[12px] text-[#86868b]'}>
                      {entry.subtitle} · {entry.date} · {entry.time}
                    </p>

                    {!open && entry.songNotes ? (
                      <p
                        className={
                          isMobile
                            ? 'mt-1.5 line-clamp-2 text-[12px] text-[#c7c7cc]'
                            : 'mt-1.5 line-clamp-2 text-[12px] text-[#3a3a3c]'
                        }
                      >
                        <Music2 className="mr-1 inline h-3 w-3 opacity-70" />
                        {entry.songNotes.split(/\r?\n/).filter(Boolean).join(' · ')}
                      </p>
                    ) : null}

                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openNotes(entry)}
                        className={
                          isMobile
                            ? 'min-h-[36px] rounded-full border border-white/14 px-3 text-[11px] font-semibold text-[#f5f5f7]'
                            : 'btn-pill btn-pill-secondary btn-pill-xs'
                        }
                      >
                        {open ? 'Hide notes' : isAdmin ? (entry.songNotes ? 'Edit song list' : 'Add song list') : 'Song list'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate(manageTab(entry.kind))}
                        className={
                          isMobile
                            ? 'min-h-[36px] rounded-full px-2 text-[11px] font-medium text-[#86868b]'
                            : 'btn-pill btn-pill-ghost btn-pill-xs'
                        }
                      >
                        Open
                      </button>
                    </div>

                    {open && (
                      <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                        <label
                          className={
                            isMobile
                              ? 'block text-[11px] font-medium text-[#86868b]'
                              : 'apple-label'
                          }
                        >
                          Song list {isAdmin ? '(one song per line)' : ''}
                        </label>
                        {isAdmin && onSaveSongNotes ? (
                          <>
                            <textarea
                              value={draft}
                              onChange={(e) =>
                                setDrafts((prev) => ({ ...prev, [entry.id]: e.target.value }))
                              }
                              rows={4}
                              placeholder={'e.g.\nEntrance hymn\nGloria\nCommunion song'}
                              className={
                                isMobile
                                  ? 'w-full rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-[13px] text-[#f5f5f7] placeholder:text-[#86868b]'
                                  : 'apple-textarea !min-h-[6rem] !text-[13px]'
                              }
                            />
                            <button
                              type="button"
                              disabled={savingId === entry.id}
                              onClick={() => void handleSave(entry)}
                              className={
                                isMobile
                                  ? 'inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-amber-300 px-3 text-[12px] font-semibold text-[#050a14] disabled:opacity-50'
                                  : 'btn-pill btn-pill-primary btn-pill-sm inline-flex items-center gap-1.5'
                              }
                            >
                              {savingId === entry.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Save className="h-3.5 w-3.5" />
                              )}
                              Save songs
                            </button>
                          </>
                        ) : (
                          <p
                            className={
                              isMobile
                                ? 'rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[13px] whitespace-pre-wrap text-[#c7c7cc]'
                                : 'rounded-xl bg-[#f5f5f7] px-3 py-2 text-[13px] whitespace-pre-wrap text-[#3a3a3c]'
                            }
                          >
                            {entry.songNotes || 'No songs noted yet. Ask a choir admin to add the list.'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {message && (
        <p className={isMobile ? 'mt-2 text-[12px] text-amber-300' : 'mt-2 text-[12px] text-[#18392f]'}>
          {message}
        </p>
      )}
    </article>
  );
};
