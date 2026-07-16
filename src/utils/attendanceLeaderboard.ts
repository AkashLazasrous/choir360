import type { AttendanceRecord, AttendanceStatus, Member } from '../types';
import { isActiveMember } from './choirStats';
import { isMassActivityKind } from './attendanceActivity';
import type { ActivityKind } from '../types';

/**
 * Liturgy reliability score points (mass kinds only).
 * Present = full credit, Late = half, Excused = slight credit, Absent = none.
 * score = sum(points) / max(massSessions, 1)
 */
export const LEADERBOARD_POINTS: Record<AttendanceStatus, number> = {
  Present: 1,
  Late: 0.5,
  Excused: 0.25,
  Absent: 0,
};

export const LEADERBOARD_CAPTION =
  'Ranked by attendance rate, with late and absent counting against you.';

export const LEADERBOARD_FORMULA_HINT =
  'Score = (Present×1 + Late×0.5 + Excused×0.25 + Absent×0) ÷ mass sessions. Ties break by on-time count, then name.';

export interface LeaderboardEntry {
  rank: number;
  memberId: string;
  memberName: string;
  photoUrl: string;
  voiceType: string;
  memberType: string;
  /** 0–1 reliability score */
  score: number;
  /** Rounded 0–100 for display */
  scorePercent: number;
  massLogged: number;
  /** Present + Late (showed up) */
  massAttended: number;
  onTime: number;
  late: number;
  absent: number;
  excused: number;
}

function resolveKind(record: AttendanceRecord): ActivityKind {
  if (record.activityKind) return record.activityKind;
  if (record.entityType === 'Rehearsal') return 'practice';
  const name = record.entityName.toLowerCase();
  if (name.includes('special')) return 'special_mass';
  if (name.includes('saturday') || name.includes('sat mass')) return 'saturday_mass';
  return 'sunday_mass';
}

/** One mark per member + mass kind + date (latest wins). */
function dedupeMassRecords(records: AttendanceRecord[]): AttendanceRecord[] {
  const map = new Map<string, AttendanceRecord>();
  for (const record of records) {
    const kind = resolveKind(record);
    if (!isMassActivityKind(kind)) continue;
    const key = `${record.memberId}::${kind}::${record.date}`;
    map.set(key, record);
  }
  return [...map.values()];
}

function displayName(member: Member): string {
  return `${member.firstName} ${member.lastName}`.trim();
}

export function pointsForStatus(status: AttendanceStatus): number {
  return LEADERBOARD_POINTS[status] ?? 0;
}

/**
 * Build a liturgy reliability leaderboard from live attendance records.
 * Only active members with at least one mass mark are ranked.
 */
export function computeAttendanceLeaderboard(
  records: AttendanceRecord[],
  members: Member[],
): LeaderboardEntry[] {
  const massRecords = dedupeMassRecords(records);
  if (massRecords.length === 0) return [];

  const memberMap = new Map(members.map((m) => [m.id, m]));
  const buckets = new Map<
    string,
    {
      memberId: string;
      memberName: string;
      photoUrl: string;
      voiceType: string;
      memberType: string;
      points: number;
      massLogged: number;
      onTime: number;
      late: number;
      absent: number;
      excused: number;
    }
  >();

  for (const record of massRecords) {
    const member = memberMap.get(record.memberId);
    if (member && !isActiveMember(member)) continue;

    let bucket = buckets.get(record.memberId);
    if (!bucket) {
      bucket = {
        memberId: record.memberId,
        memberName: record.memberName || (member ? displayName(member) : record.memberId),
        photoUrl: member?.photoUrl ?? '',
        voiceType: member?.voiceType ?? '—',
        memberType: member?.memberType ?? '—',
        points: 0,
        massLogged: 0,
        onTime: 0,
        late: 0,
        absent: 0,
        excused: 0,
      };
      buckets.set(record.memberId, bucket);
    }

    bucket.massLogged += 1;
    bucket.points += pointsForStatus(record.status);
    if (record.status === 'Present') bucket.onTime += 1;
    if (record.status === 'Late') bucket.late += 1;
    if (record.status === 'Absent') bucket.absent += 1;
    if (record.status === 'Excused') bucket.excused += 1;
  }

  // Include active members who appear in roster but only if they have mass logs
  // (already ensured by iterating records). Enrich photo/role from member doc.
  const rows = [...buckets.values()].map((b) => {
    const member = memberMap.get(b.memberId);
    const score = b.points / Math.max(b.massLogged, 1);
    return {
      memberId: b.memberId,
      memberName: member ? displayName(member) : b.memberName,
      photoUrl: member?.photoUrl || b.photoUrl,
      voiceType: member?.voiceType ?? b.voiceType,
      memberType: member?.memberType ?? b.memberType,
      score,
      scorePercent: Math.round(score * 100),
      massLogged: b.massLogged,
      massAttended: b.onTime + b.late,
      onTime: b.onTime,
      late: b.late,
      absent: b.absent,
      excused: b.excused,
    };
  });

  rows.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.onTime !== a.onTime) return b.onTime - a.onTime;
    return a.memberName.localeCompare(b.memberName);
  });

  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}

export function findLeaderboardRank(
  entries: LeaderboardEntry[],
  memberId: string | null | undefined,
): LeaderboardEntry | null {
  if (!memberId) return null;
  return entries.find((e) => e.memberId === memberId) ?? null;
}
