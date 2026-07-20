import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  EyeOff,
  Loader2,
  Music2,
  Save,
  Mic2,
  Trash2,
} from 'lucide-react';
import type { ActivityKind, AttendanceRecord, Mass, Rehearsal, Tab } from '../types';
import {
  ACTIVITY_KIND_LABELS,
  activityEntityId,
  categoryForActivityKind,
  defaultTimeForKind,
  listActivitySessions,
  resolveSundayMassSlot,
  SUNDAY_MASS_SLOT_LABELS,
} from '../utils/attendanceActivity';

export type LiturgyLogKind = 'mass' | 'practice';

export type LiturgySongNotesSave = {
  id: string;
  kind: LiturgyLogKind;
  activityKind: ActivityKind;
  date: string;
  name: string;
  songNotes: string;
};

export type LiturgyLogRemove = {
  id: string;
  kind: LiturgyLogKind;
  activityKind: ActivityKind;
  date: string;
};

/** Hide from Overview log only — does not soft-delete storage / attendance. */
export type LiturgyLogClear = LiturgyLogRemove;

export type LiturgyLogEntry = {
  id: string;
  kind: LiturgyLogKind;
  activityKind: ActivityKind;
  name: string;
  date: string;
  time: string;
  subtitle: string;
  songNotes: string;
  loggedCount: number;
};

type SoftDeletable = { status?: string; deletedAt?: string | null };

function isLiveDoc(doc: SoftDeletable): boolean {
  return doc.status !== 'deleted' && doc.deletedAt == null;
}

function songNotesFromRehearsal(r: Rehearsal): string {
  if (r.notes?.trim()) return r.notes.trim();
  if (r.songs?.length) return r.songs.join('\n');
  return '';
}

function logKindForActivity(kind: ActivityKind): LiturgyLogKind {
  return kind === 'practice' ? 'practice' : 'mass';
}

/**
 * Build durable log rows from masses + rehearsals + attendance sessions.
 * Attendance keeps a session visible even if a parent doc is briefly missing;
 * soft-deleted parents/marks are excluded until an admin restores them.
 */
export function buildLiturgyLogEntries(
  masses: Mass[],
  rehearsals: Rehearsal[],
  attendanceRecords: AttendanceRecord[] = [],
): LiturgyLogEntry[] {
  const map = new Map<string, LiturgyLogEntry>();
  /** Cleared from Overview log — attendance/storage kept. */
  const hiddenKeys = new Set<string>();

  for (const m of masses) {
    if (!isLiveDoc(m as SoftDeletable)) continue;
    const activityKind = (m.activityKind ?? 'sunday_mass') as ActivityKind;
    const slot = activityKind === 'sunday_mass' ? resolveSundayMassSlot(m) : undefined;
    const key = `${activityKind}::${slot ?? 'legacy'}::${m.date}`;
    if (m.hiddenFromLiturgyLog) {
      hiddenKeys.add(key);
      continue;
    }
    const slotLabel = slot ? SUNDAY_MASS_SLOT_LABELS[slot] : '';
    map.set(key, {
      id: m.id || activityEntityId(activityKind, m.date, slot),
      kind: 'mass',
      activityKind,
      name: m.name,
      date: m.date,
      time: m.time || defaultTimeForKind(activityKind),
      subtitle: [m.category || ACTIVITY_KIND_LABELS[activityKind], slotLabel].filter(Boolean).join(' · '),
      songNotes: (m.notes ?? '').trim(),
      loggedCount: m.attendingMemberIds?.length ?? 0,
    });
  }

  for (const r of rehearsals) {
    if (!isLiveDoc(r as SoftDeletable)) continue;
    const activityKind: ActivityKind = 'practice';
    const key = `${activityKind}::legacy::${r.date}`;
    if (r.hiddenFromLiturgyLog) {
      hiddenKeys.add(key);
      continue;
    }
    map.set(key, {
      id: r.id || activityEntityId(activityKind, r.date),
      kind: 'practice',
      activityKind,
      name: r.name,
      date: r.date,
      time: r.startTime || defaultTimeForKind(activityKind),
      subtitle: r.type || ACTIVITY_KIND_LABELS.practice,
      songNotes: songNotesFromRehearsal(r),
      loggedCount: r.attendingMemberIds?.length ?? 0,
    });
  }

  // Attendance is source of truth for "logged" sessions — never drop a live session
  // just because the parent collection lagged or failed to load.
  for (const session of listActivitySessions(attendanceRecords)) {
    const slot = session.sundayMassSlot;
    const key = `${session.kind}::${slot ?? 'legacy'}::${session.date}`;
    if (hiddenKeys.has(key)) continue;
    const existing = map.get(key);
    if (existing) {
      existing.loggedCount = Math.max(existing.loggedCount, session.loggedCount);
      if (!existing.name?.trim()) existing.name = session.entityName;
      continue;
    }
    const slotLabel = slot ? SUNDAY_MASS_SLOT_LABELS[slot] : '';
    map.set(key, {
      id: session.entityId,
      kind: logKindForActivity(session.kind),
      activityKind: session.kind,
      name: session.entityName,
      date: session.date,
      time: defaultTimeForKind(session.kind),
      subtitle: [ACTIVITY_KIND_LABELS[session.kind], slotLabel].filter(Boolean).join(' · '),
      songNotes: '',
      loggedCount: session.loggedCount,
    });
  }

  return [...map.values()].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    if (byDate !== 0) return byDate;
    return (b.time || '').localeCompare(a.time || '');
  });
}

type LoggedLiturgySectionProps = {
  masses: Mass[];
  rehearsals: Rehearsal[];
  attendanceRecords?: AttendanceRecord[];
  isAdmin: boolean;
  limit?: number;
  /** desk = Overview apple-card; mobile = OLED home surface */
  variant?: 'desk' | 'mobile';
  onNavigate: (tab: Tab) => void;
  onSaveSongNotes?: (payload: LiturgySongNotesSave) => Promise<{ ok: boolean; error?: string }>;
  onRemoveLog?: (payload: LiturgyLogRemove) => Promise<{ ok: boolean; error?: string }>;
  /** Hide from this list only — keeps masses/practices/attendance in storage. */
  onClearLog?: (payload: LiturgyLogClear) => Promise<{ ok: boolean; error?: string }>;
};

/**
 * Overview “Logged masses & practices” — shows liturgy + practice logs with
 * admin-only song-list notes, clear-from-log, and soft-delete remove.
 */
export const LoggedLiturgySection: React.FC<LoggedLiturgySectionProps> = ({
  masses,
  rehearsals,
  attendanceRecords = [],
  isAdmin,
  limit = 5,
  variant = 'desk',
  onNavigate,
  onSaveSongNotes,
  onRemoveLog,
  onClearLog,
}) => {
  const allEntries = useMemo(
    () => buildLiturgyLogEntries(masses, rehearsals, attendanceRecords),
    [masses, rehearsals, attendanceRecords],
  );
  const entries = useMemo(() => allEntries.slice(0, limit), [allEntries, limit]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [clearingId, setClearingId] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);
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
    const result = await onSaveSongNotes({
      id: entry.id,
      kind: entry.kind,
      activityKind: entry.activityKind,
      date: entry.date,
      name: entry.name,
      songNotes,
    });
    setSavingId(null);
    if (result.ok) {
      setMessage('Song list saved.');
      setTimeout(() => setMessage(null), 2500);
    } else {
      setMessage(result.error ?? 'Could not save song list.');
    }
  };

  const handleClear = async (entry: LiturgyLogEntry) => {
    if (!isAdmin || !onClearLog) return;
    const ok = window.confirm(
      `Clear “${entry.name}” (${entry.date}) from this liturgy log?\n\nIt will disappear from Overview only. Attendance and records stay in storage.`,
    );
    if (!ok) return;
    setClearingId(entry.id);
    setMessage(null);
    const result = await onClearLog({
      id: entry.id,
      kind: entry.kind,
      activityKind: entry.activityKind,
      date: entry.date,
    });
    setClearingId(null);
    if (result.ok) {
      setExpandedId(null);
      setMessage('Log cleared from Overview (data kept).');
      setTimeout(() => setMessage(null), 2500);
    } else {
      setMessage(result.error ?? 'Could not clear log.');
    }
  };

  const handleClearAll = async () => {
    if (!isAdmin || !onClearLog || entries.length === 0) return;
    const ok = window.confirm(
      `Clear all ${entries.length} visible log${entries.length === 1 ? '' : 's'} from Overview?\n\nAttendance and storage records are kept. Use Remove on an item only if you need to delete it.`,
    );
    if (!ok) return;
    setClearingAll(true);
    setMessage(null);
    let failed = 0;
    for (const entry of entries) {
      const result = await onClearLog({
        id: entry.id,
        kind: entry.kind,
        activityKind: entry.activityKind,
        date: entry.date,
      });
      if (!result.ok) failed += 1;
    }
    setClearingAll(false);
    setExpandedId(null);
    setMessage(
      failed === 0
        ? 'Logs cleared from Overview (data kept).'
        : `Cleared with ${failed} error${failed === 1 ? '' : 's'}.`,
    );
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRemove = async (entry: LiturgyLogEntry) => {
    if (!isAdmin || !onRemoveLog) return;
    const ok = window.confirm(
      `Permanently remove “${entry.name}” (${entry.date}) from storage?\n\nThis soft-deletes the liturgy entry and hides its attendance marks. Prefer Clear if you only want it off Overview.`,
    );
    if (!ok) return;
    setRemovingId(entry.id);
    setMessage(null);
    const result = await onRemoveLog({
      id: entry.id,
      kind: entry.kind,
      activityKind: entry.activityKind,
      date: entry.date,
    });
    setRemovingId(null);
    if (result.ok) {
      setExpandedId(null);
      setMessage('Log removed from storage.');
      setTimeout(() => setMessage(null), 2500);
    } else {
      setMessage(result.error ?? 'Could not remove log.');
    }
  };

  const manageTab = (kind: LiturgyLogKind): Tab =>
    kind === 'practice' ? 'rehearsals' : 'masses';

  return (
    <article
      className={
        isMobile
          ? 'rounded-[1.5rem] border border-black/[0.06] bg-white p-3.5 shadow-[0_10px_30px_rgba(18,18,18,0.06)]'
          : 'apple-card p-5 sm:p-6'
      }
    >
      <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
        <div className="min-w-0">
          <p className={isMobile ? 'text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8a8a8a]' : 'apple-caption'}>
            Parish liturgy log
          </p>
          <h3 className={isMobile ? 'mt-0.5 text-[16px] font-semibold tracking-[-0.02em] text-[#121212]' : 'apple-title mt-0.5'}>
            Logged masses & practices
          </h3>
          {entries.length > 0 && (
            <p className={isMobile ? 'mt-0.5 text-[11px] text-[#8a8a8a]' : 'mt-0.5 text-[12px] text-[#86868b]'}>
              Latest {entries.length} by date · Clear hides from Overview; Remove deletes storage
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {isAdmin && onClearLog && entries.length > 0 ? (
            <button
              type="button"
              disabled={clearingAll}
              onClick={() => void handleClearAll()}
              className={
                isMobile
                  ? 'inline-flex min-h-[40px] items-center gap-1 rounded-full bg-[#efebe4] px-3 text-[12px] font-semibold text-[#121212] disabled:opacity-50'
                  : 'btn-pill btn-pill-secondary !min-h-[44px] !text-[13px] inline-flex items-center gap-1.5'
              }
            >
              {clearingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <EyeOff className="h-3.5 w-3.5" />}
              Clear logs
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onNavigate('masses')}
            className={
              isMobile
                ? 'inline-flex min-h-[40px] items-center gap-1 rounded-full bg-[#111111] px-3 text-[12px] font-semibold text-white'
                : 'btn-pill btn-pill-secondary !min-h-[44px] !text-[13px]'
            }
          >
            Manage <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <button
          type="button"
          onClick={() => onNavigate('attendance')}
          className={
            isMobile
              ? 'flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-black/10 bg-[#f6f3ee] px-4 py-6 text-center'
              : 'apple-empty w-full rounded-2xl border border-dashed border-black/10 bg-[#f5f5f7]'
          }
        >
          <div
            className={
              isMobile
                ? 'flex h-11 w-11 items-center justify-center rounded-full bg-[#efebe4] text-[#121212]'
                : 'flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0e3d4c]'
            }
          >
            <BookOpen className="h-5 w-5" />
          </div>
          <h3 className={isMobile ? 'text-[14px] font-semibold text-[#121212]' : undefined}>
            No masses or practices logged yet
          </h3>
          <p className={isMobile ? 'text-[12px] text-[#5c5c5c]' : undefined}>
            Log attendance for a mass or practice — it will stay here until an admin removes it.
          </p>
        </button>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry, i) => {
            const open = expandedId === entry.id;
            const draft = drafts[entry.id] ?? entry.songNotes;
            const Icon = entry.kind === 'practice' ? Mic2 : BookOpen;
            const category = categoryForActivityKind(entry.activityKind);
            return (
              <li
                key={`${entry.activityKind}-${entry.id}-${entry.date}`}
                className={
                  isMobile
                    ? 'rounded-xl border border-black/[0.06] bg-[#f6f3ee]'
                    : 'rounded-xl border border-white/10 bg-white/[0.04]'
                }
              >
                <div className="flex items-start gap-3 px-3 py-3 sm:px-4 sm:py-3.5">
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      isMobile
                        ? entry.kind === 'practice'
                          ? 'bg-sky-100 text-sky-700'
                          : i === 0
                            ? 'bg-[#111111] text-white'
                            : 'bg-white text-[#5c5c5c]'
                        : entry.kind === 'practice'
                          ? 'bg-sky-500/20 text-sky-300'
                          : i === 0
                            ? 'bg-[#0e3d4c] text-amber-300'
                            : 'bg-white/10 text-[#a1a1a6]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={
                          isMobile
                            ? 'truncate text-[14px] font-semibold text-[#121212] sm:text-[15px]'
                            : 'truncate text-[14px] font-semibold text-[#f5f5f7] sm:text-[15px]'
                        }
                      >
                        {entry.name}
                      </p>
                      <span
                        className={
                          isMobile
                            ? 'rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#5c5c5c]'
                            : 'rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#c7c7cc]'
                        }
                      >
                        {category === 'practice' ? 'Practice' : category === 'special_mass' ? 'Special' : 'Mass'}
                      </span>
                    </div>
                    <p
                      className={
                        isMobile
                          ? 'mt-0.5 text-[11px] text-[#5c5c5c] sm:text-[12px]'
                          : 'mt-0.5 text-[11px] text-[#a1a1a6] sm:text-[12px]'
                      }
                    >
                      {entry.subtitle} · {entry.date} · {entry.time}
                      {entry.loggedCount > 0 ? ` · ${entry.loggedCount} marked` : ''}
                    </p>

                    {!open && entry.songNotes ? (
                      <p
                        className={
                          isMobile
                            ? 'mt-1.5 line-clamp-2 text-[12px] text-[#5c5c5c]'
                            : 'mt-1.5 line-clamp-2 text-[12px] text-[#c7c7cc]'
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
                            ? 'min-h-[36px] rounded-full border border-black/[0.08] bg-white px-3 text-[11px] font-semibold text-[#121212]'
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
                            ? 'min-h-[36px] rounded-full px-2 text-[11px] font-medium text-[#5c5c5c]'
                            : 'btn-pill btn-pill-ghost btn-pill-xs'
                        }
                      >
                        Open
                      </button>
                      {isAdmin && onClearLog ? (
                        <button
                          type="button"
                          disabled={clearingId === entry.id || clearingAll}
                          onClick={() => void handleClear(entry)}
                          className={
                            isMobile
                              ? 'inline-flex min-h-[36px] items-center gap-1 rounded-full px-2 text-[11px] font-medium text-[#8a6a10] disabled:opacity-50'
                              : 'btn-pill btn-pill-ghost btn-pill-xs inline-flex items-center gap-1 !text-[#8a6a10]'
                          }
                        >
                          {clearingId === entry.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5" />
                          )}
                          Clear
                        </button>
                      ) : null}
                      {isAdmin && onRemoveLog ? (
                        <button
                          type="button"
                          disabled={removingId === entry.id}
                          onClick={() => void handleRemove(entry)}
                          className={
                            isMobile
                              ? 'inline-flex min-h-[36px] items-center gap-1 rounded-full px-2 text-[11px] font-medium text-rose-600 disabled:opacity-50'
                              : 'btn-pill btn-pill-ghost btn-pill-xs inline-flex items-center gap-1 !text-[#ff6b7a]'
                          }
                        >
                          {removingId === entry.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Remove
                        </button>
                      ) : null}
                    </div>

                    {open && (
                      <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                        <label
                          className={
                            isMobile
                              ? 'block text-[11px] font-medium text-[#5c5c5c] sm:text-[12px]'
                              : 'block text-[11px] font-medium text-[#a1a1a6] sm:text-[12px]'
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
                                  ? 'w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-[13px] text-[#121212] placeholder:text-[#8a8a8a]'
                                  : 'apple-textarea !min-h-[6rem] !text-[13px]'
                              }
                            />
                            <button
                              type="button"
                              disabled={savingId === entry.id}
                              onClick={() => void handleSave(entry)}
                              className={
                                isMobile
                                  ? 'inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[#111111] px-3 text-[12px] font-semibold text-white disabled:opacity-50'
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
                                ? 'rounded-xl border border-black/[0.06] bg-white px-3 py-2 text-[13px] whitespace-pre-wrap text-[#5c5c5c]'
                                : 'rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[13px] whitespace-pre-wrap text-[#c7c7cc]'
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
        <p className={isMobile ? 'mt-2 text-[12px] text-[#5c5c5c]' : 'mt-2 text-[12px] text-amber-300'}>
          {message}
        </p>
      )}
    </article>
  );
};
