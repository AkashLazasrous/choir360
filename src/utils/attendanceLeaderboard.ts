import type { AttendanceCategory, AttendanceRecord, AttendanceStatus, Member } from '../types';
import { isActiveMember } from './choirStats';
import { mergeSundaySlotStatuses, resolveSundayMassSlot } from './attendanceActivity';
import { categoryForActivityKind, resolveActivityKind } from './attendanceTaxonomy';

/**
 * Reliability score points (all attendance categories).
 * Present = full credit, Late = half, Excused = slight credit, Absent = none.
 *
 * Overall score = sum(points) / max(sessionCount, 1) across Mass + Special Mass + Practice.
 * Mass typically dominates standings by session volume; practice and special mass
 * count equally per session in the combined rate.
 */
export const LEADERBOARD_POINTS: Record<AttendanceStatus, number> = {
  Present: 1,
  Late: 0.5,
  Excused: 0.25,
  Absent: 0,
};

export const LEADERBOARD_CAPTION =
  'Ranked by attendance across Mass, Special Mass, and Practice — late and absent count against you.';

export const LEADERBOARD_FORMULA_HINT =
  'Score = (Present×1 + Late×0.5 + Excused×0.25 + Absent×0) ÷ all sessions (Mass + Special Mass + Practice). Ties break by on-time count, then name.';

export interface CategoryAttendanceStats {
  logged: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
  /** Present + Late */
  attended: number;
}

export interface LeaderboardEntry {
  rank: number;
  memberId: string;
  memberName: string;
  photoUrl: string;
  voiceType: string;
  memberType: string;
  /** 0–1 reliability score across all categories */
  score: number;
  /** Rounded 0–100 for display */
  scorePercent: number;
  /** Combined session totals (Mass + Special + Practice) */
  sessionLogged: number;
  sessionAttended: number;
  onTime: number;
  late: number;
  absent: number;
  excused: number;
  /** Per-category breakdown for board columns */
  mass: CategoryAttendanceStats;
  specialMass: CategoryAttendanceStats;
  practice: CategoryAttendanceStats;
  /** @deprecated Prefer sessionLogged / mass.logged — kept for older call sites */
  massLogged: number;
  /** @deprecated Prefer sessionAttended / mass.attended */
  massAttended: number;
}

function emptyCategoryStats(): CategoryAttendanceStats {
  return { logged: 0, present: 0, late: 0, absent: 0, excused: 0, attended: 0 };
}

function applyStatus(stats: CategoryAttendanceStats, status: AttendanceStatus): void {
  stats.logged += 1;
  if (status === 'Present') stats.present += 1;
  if (status === 'Late') stats.late += 1;
  if (status === 'Absent') stats.absent += 1;
  if (status === 'Excused') stats.excused += 1;
  stats.attended = stats.present + stats.late;
}

function categoryBucket(
  entry: { mass: CategoryAttendanceStats; specialMass: CategoryAttendanceStats; practice: CategoryAttendanceStats },
  category: AttendanceCategory,
): CategoryAttendanceStats {
  if (category === 'special_mass') return entry.specialMass;
  if (category === 'practice') return entry.practice;
  return entry.mass;
}

/**
 * One mark per member + kind + date (latest wins).
 * Sunday 1st/2nd Mass merge: attend either → not absent; late on either noted.
 */
function dedupeSessionRecords(records: AttendanceRecord[]): AttendanceRecord[] {
  const sundayByMemberDate = new Map<string, Map<string, AttendanceRecord>>();
  const other = new Map<string, AttendanceRecord>();

  for (const record of records) {
    const kind = resolveActivityKind(record);
    if (kind === 'sunday_mass') {
      const dayKey = `${record.memberId}::${record.date}`;
      const slots = sundayByMemberDate.get(dayKey) ?? new Map<string, AttendanceRecord>();
      const slotKey = resolveSundayMassSlot(record) ?? record.entityId ?? 'legacy';
      slots.set(slotKey, record);
      sundayByMemberDate.set(dayKey, slots);
      continue;
    }
    other.set(`${record.memberId}::${kind}::${record.date}`, record);
  }

  const mergedSunday: AttendanceRecord[] = [];
  for (const slots of sundayByMemberDate.values()) {
    const list = [...slots.values()];
    const base = list[list.length - 1]!;
    const statuses = list.map((r) => r.status);
    const merged = mergeSundaySlotStatuses(statuses);
    // Keep a late note when Present on one slot and Late on the other.
    const status = merged === 'Present' && statuses.includes('Late') ? 'Present' : merged;
    mergedSunday.push({ ...base, status, sundayMassSlot: undefined });
  }

  return [...other.values(), ...mergedSunday];
}

function displayName(member: Member): string {
  return `${member.firstName} ${member.lastName}`.trim();
}

export function pointsForStatus(status: AttendanceStatus): number {
  return LEADERBOARD_POINTS[status] ?? 0;
}

/**
 * Build attendance leaderboard from live records.
 * Active members with ≥1 mark across Mass / Special / Practice are ranked.
 */
export function computeAttendanceLeaderboard(
  records: AttendanceRecord[],
  members: Member[],
): LeaderboardEntry[] {
  const sessionRecords = dedupeSessionRecords(records);
  if (sessionRecords.length === 0) return [];

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
      sessionLogged: number;
      onTime: number;
      late: number;
      absent: number;
      excused: number;
      mass: CategoryAttendanceStats;
      specialMass: CategoryAttendanceStats;
      practice: CategoryAttendanceStats;
    }
  >();

  for (const record of sessionRecords) {
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
        sessionLogged: 0,
        onTime: 0,
        late: 0,
        absent: 0,
        excused: 0,
        mass: emptyCategoryStats(),
        specialMass: emptyCategoryStats(),
        practice: emptyCategoryStats(),
      };
      buckets.set(record.memberId, bucket);
    }

    const kind = resolveActivityKind(record);
    const category = categoryForActivityKind(kind);
    applyStatus(categoryBucket(bucket, category), record.status);

    bucket.sessionLogged += 1;
    bucket.points += pointsForStatus(record.status);
    if (record.status === 'Present') bucket.onTime += 1;
    if (record.status === 'Late') bucket.late += 1;
    if (record.status === 'Absent') bucket.absent += 1;
    if (record.status === 'Excused') bucket.excused += 1;
  }

  const rows = [...buckets.values()].map((b) => {
    const member = memberMap.get(b.memberId);
    const score = b.points / Math.max(b.sessionLogged, 1);
    return {
      memberId: b.memberId,
      memberName: member ? displayName(member) : b.memberName,
      photoUrl: member?.photoUrl || b.photoUrl,
      voiceType: member?.voiceType ?? b.voiceType,
      memberType: member?.memberType ?? b.memberType,
      score,
      scorePercent: Math.round(score * 100),
      sessionLogged: b.sessionLogged,
      sessionAttended: b.onTime + b.late,
      onTime: b.onTime,
      late: b.late,
      absent: b.absent,
      excused: b.excused,
      mass: b.mass,
      specialMass: b.specialMass,
      practice: b.practice,
      massLogged: b.mass.logged,
      massAttended: b.mass.attended,
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
