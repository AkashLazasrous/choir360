import {
  ActivityKind,
  AttendanceRecord,
  AttendanceStatus,
  Member,
} from '../types';
import { isActiveMember } from './choirStats';

/** Present-only for raw spreadsheet %. */
export function countsAsPresentRaw(status: AttendanceStatus): boolean {
  return status === 'Present';
}

/**
 * Final attendance per sheet rules:
 * Late → Present; Excused → Present for Mass kinds, Absent for Practice.
 */
export function countsAsPresentFinal(status: AttendanceStatus, kind: ActivityKind): boolean {
  if (status === 'Present' || status === 'Late') return true;
  if (status === 'Excused') return kind !== 'practice';
  return false;
}

export interface MemberAttendanceStats {
  memberId: string;
  memberName: string;
  logged: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
  rawPercent: number;
  finalPercent: number;
  byKind: Record<ActivityKind, { logged: number; finalPercent: number }>;
}

export interface ParishAttendanceStats {
  averageFinalPercent: number;
  averageRawPercent: number;
  trendLast30Days: number;
  topPerformers: MemberAttendanceStats[];
  needsAttention: MemberAttendanceStats[];
  totalSessions: number;
  memberStats: MemberAttendanceStats[];
}

function emptyKindBreakdown(): Record<ActivityKind, { logged: number; finalPercent: number }> {
  return {
    sunday_mass: { logged: 0, finalPercent: 0 },
    practice: { logged: 0, finalPercent: 0 },
    special_mass: { logged: 0, finalPercent: 0 },
  };
}

function resolveKind(record: AttendanceRecord): ActivityKind {
  if (record.activityKind) return record.activityKind;
  if (record.entityType === 'Rehearsal') return 'practice';
  if (record.entityName.toLowerCase().includes('special')) return 'special_mass';
  return 'sunday_mass';
}

function memberDisplayName(member: Member): string {
  return `${member.firstName} ${member.lastName}`.trim();
}

function dedupeAttendanceRecords(records: AttendanceRecord[]): AttendanceRecord[] {
  const map = new Map<string, AttendanceRecord>();
  for (const record of records) {
    const key = `${record.memberId}::${resolveKind(record)}::${record.date}`;
    map.set(key, record);
  }
  return [...map.values()];
}

/** Aggregate attendance records into per-member stats. */
export function computeMemberStats(
  records: AttendanceRecord[],
  members: Member[],
): MemberAttendanceStats[] {
  const uniqueRecords = dedupeAttendanceRecords(records);
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const buckets = new Map<string, MemberAttendanceStats>();

  for (const record of uniqueRecords) {
    const kind = resolveKind(record);
    let stats = buckets.get(record.memberId);
    if (!stats) {
      const member = memberMap.get(record.memberId);
      stats = {
        memberId: record.memberId,
        memberName: record.memberName || (member ? memberDisplayName(member) : record.memberId),
        logged: 0,
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
        rawPercent: 0,
        finalPercent: 0,
        byKind: emptyKindBreakdown(),
      };
      buckets.set(record.memberId, stats);
    }

    stats.logged += 1;
    if (record.status === 'Present') stats.present += 1;
    if (record.status === 'Late') stats.late += 1;
    if (record.status === 'Absent') stats.absent += 1;
    if (record.status === 'Excused') stats.excused += 1;

    const kindBucket = stats.byKind[kind];
    kindBucket.logged += 1;
  }

  for (const stats of buckets.values()) {
    const rawHits = stats.present;
    stats.rawPercent = stats.logged > 0 ? Math.round((rawHits / stats.logged) * 100) : 0;

    let finalHits = 0;
    for (const record of uniqueRecords.filter((r) => r.memberId === stats.memberId)) {
      if (countsAsPresentFinal(record.status, resolveKind(record))) finalHits += 1;
    }
    stats.finalPercent = stats.logged > 0 ? Math.round((finalHits / stats.logged) * 100) : 0;

    for (const kind of Object.keys(stats.byKind) as ActivityKind[]) {
      const kindRecords = uniqueRecords.filter(
        (r) => r.memberId === stats.memberId && resolveKind(r) === kind,
      );
      const kindLogged = kindRecords.length;
      const kindFinal = kindRecords.filter((r) => countsAsPresentFinal(r.status, kind)).length;
      stats.byKind[kind].logged = kindLogged;
      stats.byKind[kind].finalPercent = kindLogged > 0 ? Math.round((kindFinal / kindLogged) * 100) : 0;
    }
  }

  return [...buckets.values()].sort((a, b) => a.memberName.localeCompare(b.memberName));
}

export function computeMemberStatsForId(
  records: AttendanceRecord[],
  members: Member[],
  memberId: string,
): MemberAttendanceStats | null {
  return computeMemberStats(records, members).find((s) => s.memberId === memberId) ?? null;
}

/** Parish-wide overview from attendance logs. */
export function computeParishStats(
  records: AttendanceRecord[],
  members: Member[],
): ParishAttendanceStats {
  const uniqueRecords = dedupeAttendanceRecords(records);
  const memberStats = computeMemberStats(uniqueRecords, members);
  const activeStats = memberStats.filter((s) => {
    const m = members.find((mem) => mem.id === s.memberId);
    return m && isActiveMember(m);
  });

  const averageFinalPercent = Math.round(
    activeStats.reduce((sum, s) => sum + s.finalPercent, 0) / Math.max(activeStats.length, 1),
  );
  const averageRawPercent = Math.round(
    activeStats.reduce((sum, s) => sum + s.rawPercent, 0) / Math.max(activeStats.length, 1),
  );

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffIso = cutoff.toISOString().slice(0, 10);
  const recent = uniqueRecords.filter((r) => r.date >= cutoffIso);
  const recentStats = computeMemberStats(recent, members).filter((s) =>
    activeStats.some((a) => a.memberId === s.memberId),
  );
  const trendLast30Days = Math.round(
    recentStats.reduce((sum, s) => sum + s.finalPercent, 0) / Math.max(recentStats.length, 1),
  );

  const sorted = [...activeStats].sort((a, b) => b.finalPercent - a.finalPercent);
  const sessionDates = new Set(uniqueRecords.map((r) => `${resolveKind(r)}::${r.date}`));

  return {
    averageFinalPercent,
    averageRawPercent,
    trendLast30Days,
    topPerformers: sorted.slice(0, 3),
    needsAttention: [...sorted].reverse().filter((s) => s.finalPercent < 75).slice(0, 3),
    totalSessions: sessionDates.size,
    memberStats,
  };
}

/** Present + Late members for share calculator defaults. */
export function countAttendeesByRole(
  attendingMemberIds: string[],
  members: Member[],
): { singers: number; instrumentalists: number } {
  const attendees = members.filter((m) => attendingMemberIds.includes(m.id));
  const singers = attendees.filter((m) => m.memberType === 'Singer' || m.memberType === 'Other').length;
  const instrumentalists = attendees.filter(
    (m) => !['Singer', 'Other'].includes(m.memberType),
  ).length;
  return { singers, instrumentalists };
}
