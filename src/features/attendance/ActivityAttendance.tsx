import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar, Check, Clock, ClipboardList, History, IndianRupee, Save, Upload,
  UserCheck, Users, X, AlertCircle,
} from 'lucide-react';
import {
  ActivityKind,
  AttendanceCategory,
  AttendanceRecord,
  AttendanceStatus,
  Mass,
  Member,
  Payment,
  Rehearsal,
  SpecialMassBilling,
  SpecialMassPaymentDetails,
} from '../../types';
import { formatINR } from '../../utils/currency';
import {
  ACTIVITY_KIND_LABELS,
  ATTENDANCE_CATEGORY_LABELS,
  activityEntityId,
  categoryForActivityKind,
  findActivityParent,
  kindsForCategory,
  listActivitySessions,
  marksFromRecords,
  MASS_BUCKET_KINDS,
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
import { computeAttendanceLeaderboard } from '../../utils/attendanceLeaderboard';

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

const CATEGORIES: AttendanceCategory[] = ['mass', 'special_mass', 'practice'];

export interface ActivityAttendanceSavePayload {
  kind: ActivityKind;
  date: string;
  title?: string;
  notes?: string;
  marks: Record<string, AttendanceStatus | null>;
  specialMassBilling?: SpecialMassBilling;
  specialMassPayment?: SpecialMassPaymentDetails;
}

export interface ActivityAttendanceImportPayload {
  kind: ActivityKind;
  sessions: ActivityAttendanceSavePayload[];
  unmatchedNames?: string[];
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
  onImportSessions: (payload: ActivityAttendanceImportPayload) => Promise<{
    ok: boolean;
    error?: string;
    imported?: number;
    skipped?: number;
    sessionsWritten?: number;
    attendanceWritten?: number;
    emptySkipped?: number;
    unmatchedNames?: string[];
    parishId?: string;
  }>;
}

function canMutateKind(kind: ActivityKind, isAdmin: boolean): boolean {
  if (!isAdmin) return false;
  // Practice create/edit/delete is admin-only (members view in history/leaderboard).
  if (kind === 'practice') return isAdmin;
  return true;
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

  const [section, setSection] = useState<'log' | 'history' | 'overview'>('log');
  const [category, setCategory] = useState<AttendanceCategory>('mass');
  const [kind, setKind] = useState<ActivityKind>('sunday_mass');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<AttendanceCategory | 'all'>('all');
  const [date, setDate] = useState(today);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [marks, setMarks] = useState<Record<string, AttendanceStatus | null>>({});
  const [specialBilling, setSpecialBilling] = useState<SpecialMassBilling>('free');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentWho, setPaymentWho] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
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

  const leaderboardRows = useMemo(
    () => computeAttendanceLeaderboard(attendanceRecords, members),
    [attendanceRecords, members],
  );

  const rosterRows = isAdmin
    ? leaderboardRows
    : leaderboardRows.filter((s) => s.memberId === viewerMemberId);

  const viewerStats = viewerMemberId
    ? leaderboardRows.find((s) => s.memberId === viewerMemberId) ?? null
    : null;

  const recentHistory = useMemo(
    () => listActivitySessions(attendanceRecords, kind).slice(0, 12),
    [attendanceRecords, kind],
  );

  const fullHistory = useMemo(() => {
    const all = listActivitySessions(attendanceRecords);
    if (historyCategoryFilter === 'all') return all;
    return all.filter((s) => categoryForActivityKind(s.kind) === historyCategoryFilter);
  }, [attendanceRecords, historyCategoryFilter]);

  const summary = useMemo(() => {
    const logged = Object.values(loadedMarks).filter(Boolean).length;
    const present = Object.values(loadedMarks).filter((s) => s === 'Present').length;
    const late = Object.values(loadedMarks).filter((s) => s === 'Late').length;
    const absent = Object.values(loadedMarks).filter((s) => s === 'Absent').length;
    const excused = Object.values(loadedMarks).filter((s) => s === 'Excused').length;
    return { logged, present, late, absent, excused };
  }, [loadedMarks]);

  const massSubKinds = MASS_BUCKET_KINDS;
  const canEdit = canMutateKind(kind, isAdmin);

  // Sync billing fields when opening an existing special mass parent
  useEffect(() => {
    if (kind !== 'special_mass') return;
    const mass = existingParent && 'category' in existingParent ? existingParent as Mass : undefined;
    if (!mass) return;
    setSpecialBilling(mass.specialMassBilling ?? 'free');
    setPaymentAmount(mass.specialMassPayment?.amount != null ? String(mass.specialMassPayment.amount) : '');
    setPaymentWho(mass.specialMassPayment?.whoPaid ?? '');
    setPaymentNotes(mass.specialMassPayment?.notes ?? '');
    setPaymentDate(mass.specialMassPayment?.dateReceived ?? '');
    setPaymentMode(mass.specialMassPayment?.paymentMode ?? 'Cash');
  }, [kind, date, existingParent]);

  const selectCategory = (next: AttendanceCategory) => {
    setCategory(next);
    const kinds = kindsForCategory(next);
    setKind(kinds[0]!);
    setMarks({});
    setSaveMessage(null);
  };

  const setMemberStatus = (memberId: string, status: AttendanceStatus) => {
    if (!canEdit) return;
    setMarks((prev) => {
      const current = prev[memberId] ?? existingMarks[memberId] ?? null;
      return { ...prev, [memberId]: current === status ? null : status };
    });
  };

  const openSession = (sessionDate: string, sessionKind: ActivityKind) => {
    setKind(sessionKind);
    setCategory(categoryForActivityKind(sessionKind));
    setDate(sessionDate);
    setMarks({});
    setTitle('');
    setNotes('');
    setSection('log');
    setSaveMessage(null);
  };

  const buildSpecialPayment = (): SpecialMassPaymentDetails | undefined => {
    if (kind !== 'special_mass' || specialBilling !== 'paid') return undefined;
    const amount = Number(paymentAmount);
    return {
      amount: Number.isFinite(amount) && amount > 0 ? amount : undefined,
      whoPaid: paymentWho.trim() || undefined,
      notes: paymentNotes.trim() || undefined,
      dateReceived: paymentDate || undefined,
      paymentMode: paymentMode || undefined,
    };
  };

  const handleSave = async () => {
    if (!canEdit) return;
    setSaving(true);
    setSaveMessage(null);
    const result = await onSaveSession({
      kind,
      date,
      title: title || undefined,
      notes: notes || undefined,
      marks: loadedMarks,
      ...(kind === 'special_mass'
        ? {
            specialMassBilling: specialBilling,
            specialMassPayment: buildSpecialPayment(),
          }
        : {}),
    });
    setSaving(false);
    setSaveMessage(result.ok ? 'Attendance saved.' : (result.error ?? 'Save failed.'));
    if (result.ok) setTimeout(() => setSaveMessage(null), 4000);
  };

  const handleImportFiles = async (files: FileList | null) => {
    if (!isAdmin || !files?.length) return;
    setImporting(true);
    setImportMessage(null);

    if (members.length === 0) {
      setImportMessage('Roster not loaded yet — wait for Sync: Live, then import again.');
      setImporting(false);
      return;
    }

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

    if (dedupedSessions.length === 0) {
      setImporting(false);
      setImportMessage(
        unmatchedNames.length
          ? `Import failed — no names matched the roster. Unmatched: ${unmatchedNames.join(', ')}`
          : 'Import failed — no attendance rows found in the CSV files.',
      );
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    const result = await onImportSessions({ kind, sessions: dedupedSessions, unmatchedNames });
    setImporting(false);
    const skipped = sessions.length - dedupedSessions.length;
    const written = result.attendanceWritten ?? 0;
    if (result.ok) {
      setImportMessage(
        `Imported ${result.sessionsWritten ?? result.imported ?? dedupedSessions.length} sessions · ${written} marks`
        + `${result.skipped ? ` · ${result.skipped} unchanged` : ''}`
        + `${result.emptySkipped ? ` · ${result.emptySkipped} empty` : ''}`
        + `${skipped ? ` · ${skipped} duplicate dates merged` : ''}`
        + `${unmatchedNames.length ? ` · unmatched: ${unmatchedNames.join(', ')}` : ''}.`
        + ' Open History to browse imported dates.',
      );
      setSection('history');
      setHistoryCategoryFilter('all');
    } else {
      setImportMessage(
        `${result.error ?? 'Import failed.'}`
        + (unmatchedNames.length ? ` Unmatched: ${unmatchedNames.join(', ')}` : ''),
      );
    }
    if (unmatchedNames.length) {
      console.warn('[attendance import] Unmatched CSV names:', unmatchedNames);
    }
    if (fileRef.current) fileRef.current.value = '';
    setTimeout(() => setImportMessage(null), unmatchedNames.length || !result.ok ? 16000 : 8000);
  };

  const specialMassParent = kind === 'special_mass' && existingParent && 'category' in existingParent
    ? existingParent as Mass
    : undefined;

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
              Mass · Special Mass · Practice Session — one log for Sts Joseph &amp; Philip
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSection('log')}
              className={`btn-pill btn-pill-sm ${section === 'log' ? 'btn-pill-gold' : 'btn-pill-secondary !bg-white/10 !text-[#f5f5f7]'}`}
            >
              Log
            </button>
            <button
              type="button"
              onClick={() => setSection('history')}
              className={`btn-pill btn-pill-sm ${section === 'history' ? 'btn-pill-gold' : 'btn-pill-secondary !bg-white/10 !text-[#f5f5f7]'}`}
            >
              History
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

      {section === 'history' && (
        <div className="space-y-4">
          <div className="apple-card space-y-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-[17px] font-semibold text-[#1d1d1f]">Session history</h3>
                <p className="mt-0.5 text-[13px] text-[#86868b]">
                  {fullHistory.length} session{fullHistory.length === 1 ? '' : 's'}
                  {attendanceRecords.length ? ` · ${attendanceRecords.length} marks loaded` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setHistoryCategoryFilter('all')}
                  className={`btn-pill btn-pill-sm ${historyCategoryFilter === 'all' ? 'btn-pill-primary' : 'btn-pill-secondary'}`}
                >
                  All
                </button>
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setHistoryCategoryFilter(c)}
                    className={`btn-pill btn-pill-sm ${historyCategoryFilter === c ? 'btn-pill-primary' : 'btn-pill-secondary'}`}
                  >
                    {ATTENDANCE_CATEGORY_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>

            {fullHistory.length === 0 ? (
              <p className="rounded-2xl bg-[#f5f5f7] px-4 py-6 text-center text-[14px] text-[#86868b]">
                No attendance sessions found yet. Admins can import CSV sheets or log a session on the Log tab.
              </p>
            ) : (
              <div className="max-h-[min(70vh,640px)] space-y-1 overflow-y-auto">
                {fullHistory.map((session) => (
                  <button
                    key={`${session.kind}-${session.date}`}
                    type="button"
                    onClick={() => openSession(session.date, session.kind)}
                    className="flex w-full min-h-[48px] items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-black/[0.04]"
                  >
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-[#1d1d1f]">{session.date}</p>
                      <p className="truncate text-[12px] text-[#86868b]">
                        {ATTENDANCE_CATEGORY_LABELS[categoryForActivityKind(session.kind)]}
                        {' · '}
                        {ACTIVITY_KIND_LABELS[session.kind]}
                        {session.entityName ? ` · ${session.entityName}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[rgba(24,57,47,0.08)] px-2.5 py-1 text-[12px] font-semibold tabular-nums text-[#18392f]">
                      {session.loggedCount} marks
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
              <p className="text-[12px] font-medium text-[#86868b]">Liturgy attended</p>
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
                  <p className="text-[32px] font-semibold text-[#18392f]">{viewerStats.scorePercent}%</p>
                  <p className="text-[12px] text-[#86868b]">Reliability score</p>
                </div>
                <div className="text-[13px] text-[#3a3a3c] space-y-1">
                  <p>Mass: <strong>{viewerStats.mass.attended}/{viewerStats.mass.logged}</strong>
                    {viewerStats.mass.late ? ` · Late ${viewerStats.mass.late}` : ''}
                    {viewerStats.mass.absent ? ` · Absent ${viewerStats.mass.absent}` : ''}
                  </p>
                  <p>Special: <strong>{viewerStats.specialMass.attended}/{viewerStats.specialMass.logged}</strong></p>
                  <p>Practice: <strong>{viewerStats.practice.attended}/{viewerStats.practice.logged}</strong></p>
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
              <p className="mt-0.5 text-[12px] text-[#86868b]">
                Columns show attended / total · late · absent per category
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-[13px]">
                <thead className="bg-[#f5f5f7] text-[11px] font-semibold uppercase tracking-wide text-[#86868b]">
                  <tr>
                    <th className="px-4 py-2.5">Member</th>
                    <th className="px-4 py-2.5">Mass</th>
                    <th className="px-4 py-2.5">Special Mass</th>
                    <th className="px-4 py-2.5">Practice</th>
                    <th className="px-4 py-2.5">Overall</th>
                    <th className="px-4 py-2.5">Score</th>
                    <th className="px-4 py-2.5">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {rosterRows.map((row) => {
                    const share = parishStats.rosterStats.find((r) => r.memberId === row.memberId)?.totalShareINR ?? 0;
                    const fmt = (c: { attended: number; logged: number; late: number; absent: number }) => (
                      <span className="tabular-nums">
                        <span className="font-semibold text-[#18392f]">{c.attended}</span>
                        <span className="text-[#86868b]">/{c.logged}</span>
                        {c.late > 0 && <span className="ml-1 text-[#8a6a10]">L{c.late}</span>}
                        {c.absent > 0 && <span className="ml-1 text-[#d70015]">A{c.absent}</span>}
                      </span>
                    );
                    return (
                      <tr key={row.memberId} className="border-t border-black/[0.04]">
                        <td className="px-4 py-3 font-medium text-[#1d1d1f]">{row.memberName}</td>
                        <td className="px-4 py-3">{fmt(row.mass)}</td>
                        <td className="px-4 py-3">{fmt(row.specialMass)}</td>
                        <td className="px-4 py-3">{fmt(row.practice)}</td>
                        <td className="px-4 py-3 tabular-nums">
                          <span className="font-semibold text-[#18392f]">{row.sessionAttended}</span>
                          <span className="text-[#86868b]"> / {row.sessionLogged}</span>
                        </td>
                        <td className="px-4 py-3 tabular-nums font-semibold text-[#18392f]">{row.scorePercent}%</td>
                        <td className="px-4 py-3 tabular-nums font-medium">{formatINR(share)}</td>
                      </tr>
                    );
                  })}
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
                {importing ? 'Importing…' : 'Import Mass / Special / Practice CSV'}
              </button>
              <p className="text-[12px] text-[#86868b]">
                Expects files named Mass, Special Mass, Practise Session (CSV).
              </p>
              {importMessage && <p className="w-full text-[13px] text-[#18392f]">{importMessage}</p>}
            </div>
          )}

          <div className="apple-card space-y-4 p-5">
            <div>
              <p className="apple-label mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => selectCategory(c)}
                    className={`btn-pill btn-pill-sm ${category === c ? 'btn-pill-primary' : 'btn-pill-secondary'}`}
                  >
                    {ATTENDANCE_CATEGORY_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>

            {category === 'mass' && (
              <div>
                <p className="apple-label mb-2">Mass type</p>
                <div className="flex flex-wrap gap-2">
                  {massSubKinds.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => { setKind(k); setMarks({}); }}
                      className={`btn-pill btn-pill-sm ${kind === k ? 'btn-pill-gold' : 'btn-pill-secondary'}`}
                    >
                      {ACTIVITY_KIND_LABELS[k]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {kind === 'practice' && !isAdmin && (
              <p className="rounded-xl bg-[rgba(14,61,76,0.06)] px-3 py-2 text-[13px] text-[#0e3d4c]">
                Practice sessions are view-only for members. Only choir admins can create or edit practice attendance.
              </p>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="space-y-1.5">
                <span className="apple-label flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Date</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => { setDate(e.target.value); setMarks({}); }}
                  className="apple-input"
                  disabled={!canEdit && isAdmin === false}
                />
              </label>
              {canEdit && (
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

            {kind === 'special_mass' && (
              <div className="space-y-3 rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4">
                <p className="apple-label flex items-center gap-1 text-amber-800">
                  <IndianRupee className="h-3.5 w-3.5" /> Special Mass billing
                </p>
                {!canEdit && specialMassParent && (
                  <p className="text-[13px] text-[#3a3a3c]">
                    {specialMassParent.specialMassBilling === 'paid'
                      ? `Paid${specialMassParent.specialMassPayment?.amount != null ? ` · ${formatINR(specialMassParent.specialMassPayment.amount)}` : ''}${specialMassParent.specialMassPayment?.whoPaid ? ` · ${specialMassParent.specialMassPayment.whoPaid}` : ''}`
                      : 'Free'}
                    {specialMassParent.specialMassPayment?.notes
                      ? ` — ${specialMassParent.specialMassPayment.notes}`
                      : ''}
                  </p>
                )}
                {canEdit && (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {(['free', 'paid'] as SpecialMassBilling[]).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSpecialBilling(opt)}
                          className={`btn-pill btn-pill-sm ${specialBilling === opt ? 'btn-pill-primary' : 'btn-pill-secondary'}`}
                        >
                          {opt === 'free' ? 'Free' : 'Paid'}
                        </button>
                      ))}
                    </div>
                    {specialBilling === 'paid' && (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="space-y-1.5">
                          <span className="apple-label">Amount (₹)</span>
                          <input
                            type="number"
                            min={0}
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="apple-input"
                            placeholder="0"
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="apple-label">Who paid</span>
                          <input
                            value={paymentWho}
                            onChange={(e) => setPaymentWho(e.target.value)}
                            className="apple-input"
                            placeholder="Payer / sponsor"
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="apple-label">Date received</span>
                          <input
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="apple-input"
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="apple-label">Mode</span>
                          <select
                            value={paymentMode}
                            onChange={(e) => setPaymentMode(e.target.value)}
                            className="apple-select"
                          >
                            {['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'DD'].map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </label>
                        <label className="space-y-1.5 sm:col-span-2">
                          <span className="apple-label">Payment notes</span>
                          <input
                            value={paymentNotes}
                            onChange={(e) => setPaymentNotes(e.target.value)}
                            className="apple-input"
                            placeholder="Optional remarks"
                          />
                        </label>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
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
                                disabled={!canEdit}
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
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="apple-label flex items-center gap-1">
                    <History className="h-3.5 w-3.5" /> Recent · {ACTIVITY_KIND_LABELS[kind]}
                  </p>
                  <button
                    type="button"
                    onClick={() => { setHistoryCategoryFilter(category); setSection('history'); }}
                    className="text-[12px] font-semibold text-[#18392f] hover:underline"
                  >
                    View all
                  </button>
                </div>
                {recentHistory.length === 0 ? (
                  <p className="text-[13px] text-[#86868b]">No sessions logged yet for this kind.</p>
                ) : (
                  <div className="space-y-1">
                    {recentHistory.map((session) => (
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

          {canEdit && (
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
              Only choir admins can log attendance. Switch to Overview or History to view Mass, Special Mass, and Practice stats.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityAttendance;
