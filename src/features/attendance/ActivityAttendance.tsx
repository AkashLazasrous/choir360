import React, { useMemo, useRef, useState } from 'react';
import {
  Calendar, Check, Clock, ClipboardList, History, Save, Upload,
  UserCheck, Users, X, AlertCircle,
} from 'lucide-react';
import {
  ActivityKind,
  AttendanceRecord,
  AttendanceStatus,
  Mass,
  Member,
  Payment,
  Rehearsal,
} from '../../types';
import { formatINR } from '../../utils/currency';
import {
  ACTIVITY_KIND_LABELS,
  activityEntityId,
  attendingMemberIdsFromMarks,
  findActivityParent,
  listActivitySessions,
  marksFromRecords,
} from '../../utils/attendanceActivity';
import {
  computeParishStats,
} from '../../utils/attendanceStats';
import {
  collectUnmatchedNames,
  kindFromFilename,
  matchMemberByName,
  parseAttendanceMatrixCsv,
  shouldSplitMassByWeekday,
} from './parseAttendanceCsv';
import { dedupeImportSessions } from '../../utils/attendanceActivity';
import { AttendanceLeaderboard } from './AttendanceLeaderboard';

const STATUSES: AttendanceStatus[] = ['Present', 'Absent', 'Late', 'Excused'];

const STATUS_STYLE: Record<AttendanceStatus, { active: string; idle: string; icon: React.ReactNode }> = {
  Present: {
    active: 'border-[rgba(24,57,47,0.35)] bg-[rgba(24,57,47,0.12)] text-[#18392f]',
    idle: 'border-black/[0.08] bg-white text-[#86868b] hover:border-[rgba(24,57,47,0.2)]',
    icon: <Check className="h-4 w-4" />,
  },
  Late: {
    active: 'border-[rgba(245,194,76,0.45)] bg-[rgba(245,194,76,0.16)] text-[#8a6a10]',
    idle: 'border-black/[0.08] bg-white text-[#86868b] hover:border-[rgba(245,194,76,0.3)]',
    icon: <Clock className="h-4 w-4" />,
  },
  Absent: {
    active: 'border-[rgba(255,59,48,0.35)] bg-[rgba(255,59,48,0.08)] text-[#d70015]',
    idle: 'border-black/[0.08] bg-white text-[#86868b] hover:border-[rgba(255,59,48,0.25)]',
    icon: <X className="h-4 w-4" />,
  },
  Excused: {
    active: 'border-[rgba(100,116,139,0.35)] bg-[rgba(100,116,139,0.1)] text-[#475569]',
    idle: 'border-black/[0.08] bg-white text-[#86868b] hover:border-[rgba(100,116,139,0.25)]',
    icon: <AlertCircle className="h-4 w-4" />,
  },
};

export interface ActivityAttendanceSavePayload {
  kind: ActivityKind;
  date: string;
  title?: string;
  notes?: string;
  marks: Record<string, AttendanceStatus | null>;
}

export interface ActivityAttendanceImportPayload {
  kind: ActivityKind;
  sessions: ActivityAttendanceSavePayload[];
}

interface ActivityAttendanceProps {
  members: Member[];
  masses: Mass[];
  payments: Payment[];
  rehearsals: Rehearsal[];
  attendanceRecords: AttendanceRecord[];
  isAdmin: boolean;
  viewerMemberId?: string | null;
  onSaveSession: (payload: ActivityAttendanceSavePayload) => Promise<{ ok: boolean; error?: string }>;
  onImportSessions: (payload: ActivityAttendanceImportPayload) => Promise<{ ok: boolean; error?: string; imported?: number; skipped?: number }>;
}

export const ActivityAttendance: React.FC<ActivityAttendanceProps> = ({
  members,
  masses,
  payments,
  rehearsals,
  attendanceRecords,
  isAdmin,
  viewerMemberId,
  onSaveSession,
  onImportSessions,
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const fileRef = useRef<HTMLInputElement>(null);

  const [section, setSection] = useState<'log' | 'overview'>('log');
  const [kind, setKind] = useState<ActivityKind>('sunday_mass');
  const [date, setDate] = useState(today);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [marks, setMarks] = useState<Record<string, AttendanceStatus | null>>({});
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const activeMembers = useMemo(
    () => members.filter((m) => ['Active Member', 'Approved', 'Admin'].includes(m.status)),
    [members],
  );

  const entityId = activityEntityId(kind, date);
  const existingParent = findActivityParent(kind, date, masses, rehearsals);
  const existingMarks = useMemo(
    () => marksFromRecords(attendanceRecords, entityId),
    [attendanceRecords, entityId],
  );

  const loadedMarks = useMemo(() => {
    const merged: Record<string, AttendanceStatus | null> = {};
    for (const m of activeMembers) {
      merged[m.id] = marks[m.id] ?? existingMarks[m.id] ?? null;
    }
    return merged;
  }, [activeMembers, marks, existingMarks]);

  const parishStats = useMemo(
    () => computeParishStats(attendanceRecords, members, masses, payments),
    [attendanceRecords, members, masses, payments],
  );

  const rosterRows = isAdmin
    ? parishStats.rosterStats
    : parishStats.rosterStats.filter((s) => s.memberId === viewerMemberId);

  const viewerStats = viewerMemberId
    ? parishStats.rosterStats.find((s) => s.memberId === viewerMemberId) ?? null
    : null;

  const history = useMemo(
    () => listActivitySessions(attendanceRecords, kind).slice(0, 12),
    [attendanceRecords, kind],
  );

  const summary = useMemo(() => {
    const logged = Object.values(loadedMarks).filter(Boolean).length;
    const present = Object.values(loadedMarks).filter((s) => s === 'Present').length;
    const late = Object.values(loadedMarks).filter((s) => s === 'Late').length;
    const absent = Object.values(loadedMarks).filter((s) => s === 'Absent').length;
    const excused = Object.values(loadedMarks).filter((s) => s === 'Excused').length;
    return { logged, present, late, absent, excused };
  }, [loadedMarks]);

  const setMemberStatus = (memberId: string, status: AttendanceStatus) => {
    if (!isAdmin) return;
    setMarks((prev) => {
      const current = prev[memberId] ?? existingMarks[memberId] ?? null;
      return { ...prev, [memberId]: current === status ? null : status };
    });
  };

  const openSession = (sessionDate: string, sessionKind: ActivityKind) => {
    setKind(sessionKind);
    setDate(sessionDate);
    setMarks({});
    setTitle('');
    setNotes('');
    setSection('log');
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    setSaving(true);
    setSaveMessage(null);
    const result = await onSaveSession({
      kind,
      date,
      title: title || undefined,
      notes: notes || undefined,
      marks: loadedMarks,
    });
    setSaving(false);
    setSaveMessage(result.ok ? 'Attendance saved.' : (result.error ?? 'Save failed.'));
    if (result.ok) setTimeout(() => setSaveMessage(null), 4000);
  };

  const handleImportFiles = async (files: FileList | null) => {
    if (!isAdmin || !files?.length) return;
    setImporting(true);
    setImportMessage(null);

    const sessions: ActivityAttendanceSavePayload[] = [];
    const unmatchedNameHits: string[] = [];

    for (const file of Array.from(files)) {
      if (/\.xlsx?$/i.test(file.name)) {
        setImportMessage('Excel (.xlsx) files: save as CSV first, then import.');
        setImporting(false);
        if (fileRef.current) fileRef.current.value = '';
        return;
      }
      const detectedKind = kindFromFilename(file.name);
      if (!detectedKind) continue;
      const text = await file.text();
      const parsed = parseAttendanceMatrixCsv(text, detectedKind, {
        splitMassByWeekday: shouldSplitMassByWeekday(file.name),
      });

      // key = kind::date
      const bySession = new Map<string, { kind: ActivityKind; date: string; marks: Record<string, AttendanceStatus | null> }>();
      for (const row of parsed.rows) {
        const memberId = matchMemberByName(row.memberName, members);
        if (!memberId) {
          unmatchedNameHits.push(row.memberName);
          continue;
        }
        const sessionKey = `${row.kind}::${row.date}`;
        if (!bySession.has(sessionKey)) {
          bySession.set(sessionKey, { kind: row.kind, date: row.date, marks: {} });
        }
        bySession.get(sessionKey)!.marks[memberId] = row.status;
      }

      for (const session of bySession.values()) {
        sessions.push({
          kind: session.kind,
          date: session.date,
          marks: session.marks,
        });
      }
    }

    const unmatchedNames = collectUnmatchedNames(unmatchedNameHits, members);
    const dedupedSessions = dedupeImportSessions(sessions);
    const result = await onImportSessions({ kind, sessions: dedupedSessions });
    setImporting(false);
    const skipped = sessions.length - dedupedSessions.length;
    setImportMessage(
      result.ok
        ? `Imported ${result.imported ?? dedupedSessions.length} sessions${
            result.skipped ? ` · ${result.skipped} unchanged` : ''
          }${skipped ? ` · ${skipped} duplicate dates merged` : ''}${
            unmatchedNames.length
              ? ` · unmatched: ${unmatchedNames.join(', ')}`
              : ''
          }.`
        : (result.error ?? 'Import failed.'),
    );
    if (unmatchedNames.length) {
      console.warn('[attendance import] Unmatched CSV names:', unmatchedNames);
    }
    if (fileRef.current) fileRef.current.value = '';
    setTimeout(() => setImportMessage(null), unmatchedNames.length ? 12000 : 6000);
  };

  return (
    <div className="space-y-6 font-apple">
      <section className="apple-hero-soft relative px-6 py-7 sm:px-8">
        <div className="choir-hero-ambient" aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-300/15 px-3 py-1">
              <ClipboardList className="h-3.5 w-3.5 text-amber-300" />
              <span className="text-[13px] font-medium text-amber-200">Choir Attendance</span>
            </div>
            <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-[#f5f5f7]">Activity Attendance</h2>
            <p className="mt-1 text-[15px] text-[#a1a1a6]">
              Sunday Mass · Practice · Special Mass — one log for Sts Joseph &amp; Philip
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSection('log')}
              className={`btn-pill btn-pill-sm ${section === 'log' ? 'btn-pill-gold' : 'btn-pill-secondary !bg-white/10 !text-[#f5f5f7]'}`}
            >
              Log
            </button>
            <button
              type="button"
              onClick={() => setSection('overview')}
              className={`btn-pill btn-pill-sm ${section === 'overview' ? 'btn-pill-gold' : 'btn-pill-secondary !bg-white/10 !text-[#f5f5f7]'}`}
            >
              Overview
            </button>
          </div>
        </div>
      </section>

      {section === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="apple-card p-4 text-center">
              <p className="text-[12px] font-medium text-[#86868b]">Parish final %</p>
              <p className="mt-1 text-[28px] font-semibold text-[#18392f]">{parishStats.averageFinalPercent}%</p>
            </div>
            <div className="apple-card p-4 text-center">
              <p className="text-[12px] font-medium text-[#86868b]">Raw present %</p>
              <p className="mt-1 text-[28px] font-semibold text-[#18392f]">{parishStats.averageRawPercent}%</p>
            </div>
            <div className="apple-card p-4 text-center">
              <p className="text-[12px] font-medium text-[#86868b]">Last 30 days</p>
              <p className="mt-1 text-[28px] font-semibold text-[#18392f]">{parishStats.trendLast30Days}%</p>
            </div>
            <div className="apple-card p-4 text-center">
              <p className="text-[12px] font-medium text-[#86868b]">Masses attended</p>
              <p className="mt-1 text-[28px] font-semibold text-[#18392f]">
                {parishStats.parishMassAttended}<span className="text-[16px] text-[#86868b]">/{parishStats.parishMassLogged}</span>
              </p>
            </div>
            <div className="apple-card p-4 text-center">
              <p className="text-[12px] font-medium text-[#86868b]">Total shares</p>
              <p className="mt-1 text-[22px] font-semibold text-[#18392f]">{formatINR(parishStats.totalShareINR)}</p>
            </div>
          </div>

          {viewerStats && !isAdmin && (
            <div className="apple-card p-5">
              <p className="apple-label mb-2">Your attendance</p>
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-[32px] font-semibold text-[#18392f]">{viewerStats.finalPercent}%</p>
                  <p className="text-[12px] text-[#86868b]">Final rate</p>
                </div>
                <div className="text-[13px] text-[#3a3a3c]">
                  <p>Masses: <strong>{viewerStats.massAttended} / {viewerStats.massLogged}</strong> attended</p>
                  <p>Present: <strong>{viewerStats.present}</strong> · Late: <strong>{viewerStats.late}</strong></p>
                  <p>Absent: <strong>{viewerStats.absent}</strong> · Excused: <strong>{viewerStats.excused}</strong></p>
                  <p>Share total: <strong>{formatINR(viewerStats.totalShareINR)}</strong></p>
                </div>
              </div>
            </div>
          )}

          <AttendanceLeaderboard
            attendanceRecords={attendanceRecords}
            members={members}
            viewerMemberId={viewerMemberId}
            limit={isAdmin ? undefined : 12}
          />

          <div className="apple-card overflow-hidden p-0">
            <div className="border-b border-black/[0.06] px-5 py-3">
              <h3 className="text-[17px] font-semibold text-[#1d1d1f]">Member attendance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-[13px]">
                <thead className="bg-[#f5f5f7] text-[11px] font-semibold uppercase tracking-wide text-[#86868b]">
                  <tr>
                    <th className="px-4 py-2.5">Member</th>
                    <th className="px-4 py-2.5">Masses</th>
                    <th className="px-4 py-2.5">Present</th>
                    <th className="px-4 py-2.5">Late</th>
                    <th className="px-4 py-2.5">Absent</th>
                    <th className="px-4 py-2.5">Excused</th>
                    <th className="px-4 py-2.5">Final %</th>
                    <th className="px-4 py-2.5">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {rosterRows.map((row) => (
                    <tr key={row.memberId} className="border-t border-black/[0.04]">
                      <td className="px-4 py-3 font-medium text-[#1d1d1f]">{row.memberName}</td>
                      <td className="px-4 py-3 tabular-nums">
                        <span className="font-semibold text-[#18392f]">{row.massAttended}</span>
                        <span className="text-[#86868b]"> / {row.massLogged}</span>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{row.present}</td>
                      <td className="px-4 py-3 tabular-nums text-[#8a6a10]">{row.late}</td>
                      <td className="px-4 py-3 tabular-nums text-[#d70015]">{row.absent}</td>
                      <td className="px-4 py-3 tabular-nums">{row.excused}</td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-[#18392f]">{row.finalPercent}%</td>
                      <td className="px-4 py-3 tabular-nums font-medium">{formatINR(row.totalShareINR)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {section === 'log' && (
        <div className="space-y-5">
          {isAdmin && (
            <div className="apple-card flex flex-wrap items-center gap-3 p-4">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                multiple
                className="hidden"
                onChange={(e) => void handleImportFiles(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={importing}
                className="btn-pill btn-pill-secondary flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {importing ? 'Importing…' : 'Import Excel/CSV'}
              </button>
              {importMessage && <p className="text-[13px] text-[#18392f]">{importMessage}</p>}
            </div>
          )}

          <div className="apple-card space-y-4 p-5">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(ACTIVITY_KIND_LABELS) as ActivityKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => { setKind(k); setMarks({}); }}
                  className={`btn-pill btn-pill-sm ${kind === k ? 'btn-pill-primary' : 'btn-pill-secondary'}`}
                >
                  {ACTIVITY_KIND_LABELS[k]}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="space-y-1.5">
                <span className="apple-label flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Date</span>
                <input
                  type="date"
                  value={date}
                  disabled={!isAdmin}
                  onChange={(e) => { setDate(e.target.value); setMarks({}); }}
                  className="apple-input"
                />
              </label>
              {isAdmin && (
                <>
                  <label className="space-y-1.5 sm:col-span-1">
                    <span className="apple-label">Title (optional)</span>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={existingParent?.name ?? ACTIVITY_KIND_LABELS[kind]}
                      className="apple-input"
                    />
                  </label>
                  <label className="space-y-1.5 sm:col-span-1">
                    <span className="apple-label">Notes (optional)</span>
                    <input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="apple-input"
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_240px]">
            <div className="apple-card space-y-3 p-4">
              <p className="apple-label flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> Mark each member
              </p>
              {activeMembers.length === 0 ? (
                <p className="text-[14px] text-[#86868b]">No active members in this parish.</p>
              ) : (
                <div className="space-y-2">
                  {activeMembers.map((member) => {
                    const status = loadedMarks[member.id];
                    return (
                      <div
                        key={member.id}
                        className="flex flex-col gap-2 rounded-2xl border border-black/[0.06] bg-[#fafafa] px-3 py-3 sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-semibold text-[#1d1d1f]">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-[12px] text-[#86868b]">{member.memberType} · {member.voiceType}</p>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 sm:max-w-[320px] sm:flex-1">
                          {STATUSES.map((s) => {
                            const cfg = STATUS_STYLE[s];
                            const active = status === s;
                            return (
                              <button
                                key={s}
                                type="button"
                                disabled={!isAdmin}
                                onClick={() => setMemberStatus(member.id, s)}
                                className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl border text-[10px] font-semibold transition ${
                                  active ? cfg.active : cfg.idle
                                }`}
                              >
                                {cfg.icon}
                                <span>{s}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="apple-card p-4">
                <p className="apple-label mb-2 flex items-center gap-1">
                  <History className="h-3.5 w-3.5" /> Recent · {ACTIVITY_KIND_LABELS[kind]}
                </p>
                {history.length === 0 ? (
                  <p className="text-[13px] text-[#86868b]">No sessions logged yet.</p>
                ) : (
                  <div className="space-y-1">
                    {history.map((session) => (
                      <button
                        key={`${session.kind}-${session.date}`}
                        type="button"
                        onClick={() => openSession(session.date, session.kind)}
                        className="flex w-full min-h-[44px] items-center justify-between rounded-xl px-2 text-left text-[13px] hover:bg-black/[0.04]"
                      >
                        <span className="font-medium text-[#1d1d1f]">{session.date}</span>
                        <span className="text-[#86868b]">{session.loggedCount} marks</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="sticky bottom-[calc(var(--app-bottom-nav-height,0px)+0.75rem)] z-20 rounded-2xl border border-black/[0.08] bg-white/95 p-4 shadow-lg backdrop-blur-xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-3 text-[13px] text-[#3a3a3c]">
                  <span><UserCheck className="mr-1 inline h-3.5 w-3.5" />{summary.logged} logged</span>
                  <span className="text-[#18392f]">P {summary.present}</span>
                  <span className="text-[#8a6a10]">L {summary.late}</span>
                  <span className="text-[#d70015]">A {summary.absent}</span>
                  <span className="text-[#475569]">E {summary.excused}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving || summary.logged === 0}
                  className="btn-pill btn-pill-primary flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving…' : 'Save attendance'}
                </button>
              </div>
              {saveMessage && <p className="mt-2 text-[13px] text-[#18392f]">{saveMessage}</p>}
            </div>
          )}

          {!isAdmin && (
            <p className="rounded-2xl bg-[rgba(24,57,47,0.06)] px-4 py-3 text-[13px] text-[#18392f]">
              Only choir admins can log attendance. Switch to Overview to see your stats.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityAttendance;
