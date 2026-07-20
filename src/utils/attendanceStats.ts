import {
  ActivityKind,
  AttendanceRecord,
  AttendanceStatus,
  Mass,
  Member,
  Payment,
  ShareCalculation,
} from '../types';
import { isActiveMember, calculatePaymentShares } from './choirStats';
import { isMassActivityKind, mergeSundaySlotStatuses, resolveSundayMassSlot } from './attendanceActivity';
import { ALL_ACTIVITY_KINDS, resolveActivityKind } from './attendanceTaxonomy';

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
  /** Final attended count across all activity kinds */
  finalAttended: number;
  /** Mass sessions logged (Sunday + Saturday + Special) */
  massLogged: number;
  /** Mass sessions attended (final rules) */
  massAttended: number;
  rawPercent: number;
  finalPercent: number;
  totalShareINR: number;
  byKind: Record<ActivityKind, { logged: number; finalPercent: number }>;
}

export interface MemberRosterStats extends MemberAttendanceStats {
  memberType?: string;
  voiceType?: string;
}

export interface ParishAttendanceStats {
  averageFinalPercent: number;
  averageRawPercent: number;
  trendLast30Days: number;
  topPerformers: MemberAttendanceStats[];
  needsAttention: MemberAttendanceStats[];
  totalSessions: number;
  memberStats: MemberAttendanceStats[];
  rosterStats: MemberRosterStats[];
  totalShareINR: number;
  parishMassLogged: number;
  parishMassAttended: number;
  parishLate: number;
  parishAbsent: number;
}

function emptyKindBreakdown(): Record<ActivityKind, { logged: number; finalPercent: number }> {
  return Object.fromEntries(
    ALL_ACTIVITY_KINDS.map((kind) => [kind, { logged: 0, finalPercent: 0 }]),
  ) as Record<ActivityKind, { logged: number; finalPercent: number }>;
}

function resolveKind(record: AttendanceRecord): ActivityKind {
  return resolveActivityKind(record);
}

function memberDisplayName(member: Member): string {
  return `${member.firstName} ${member.lastName}`.trim();
}

/**
 * One logical mark per member + kind + date.
 * Sunday 1st/2nd Mass collapse to a single day: Present/Late on either
 * counts as attended; only missing both → Absent.
 */
function dedupeAttendanceRecords(records: AttendanceRecord[]): AttendanceRecord[] {
  const sundayByMemberDate = new Map<string, Map<string, AttendanceRecord>>();
  const other = new Map<string, AttendanceRecord>();

  for (const record of records) {
    const kind = resolveKind(record);
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
    mergedSunday.push({
      ...base,
      status: mergeSundaySlotStatuses(list.map((r) => r.status)),
      sundayMassSlot: undefined,
      entityId: base.entityId,
    });
  }

  return [...other.values(), ...mergedSunday];
}

function isPresentForShare(status: AttendanceStatus | string | undefined): boolean {
  return status === 'Present' || status === 'Late';
}

function isSoftDeletedRow(row: { status?: string; deletedAt?: string | null } | null | undefined): boolean {
  if (!row) return true;
  if (row.deletedAt) return true;
  return row.status === 'deleted';
}

/** Present/Late member ids for a paid special mass (mass doc and/or attendance logs). */
export function attendingIdsForSpecialMassShare(opts: {
  massId?: string;
  massDate?: string;
  masses: Mass[];
  attendanceRecords: AttendanceRecord[];
}): string[] {
  const { massId, massDate, masses, attendanceRecords } = opts;
  const mass = massId ? masses.find((m) => m.id === massId) : undefined;
  if (mass?.attendingMemberIds?.length) {
    return [...new Set(mass.attendingMemberIds)];
  }

  const fromEntity = massId
    ? attendanceRecords.filter((r) => {
        if (isSoftDeletedRow(r as { status?: string; deletedAt?: string | null })) return false;
        if (r.entityId !== massId) return false;
        return isPresentForShare(r.status);
      })
    : [];
  if (fromEntity.length > 0) {
    return [...new Set(fromEntity.map((r) => r.memberId))];
  }

  if (!massDate) return [];
  const fromDate = attendanceRecords.filter((r) => {
    if (isSoftDeletedRow(r as { status?: string; deletedAt?: string | null })) return false;
    if (r.date !== massDate) return false;
    const kind = resolveActivityKind({
      activityKind: r.activityKind,
      entityType: r.entityType,
      entityName: r.entityName,
    });
    if (kind !== 'special_mass' && kind !== 'feast_day' && kind !== 'novena') return false;
    return isPresentForShare(r.status);
  });
  return [...new Set(fromDate.map((r) => r.memberId))];
}

type SharePaymentSource = {
  id: string;
  massId?: string;
  massDate?: string;
  promisedAmount: number;
  guestTotal: number;
};

/** Build payment-like sources from payments + paid special masses with billing amount. */
function collectSpecialMassPaymentSources(
  masses: Mass[],
  payments: Payment[],
): SharePaymentSource[] {
  const sources: SharePaymentSource[] = [];
  const seen = new Set<string>();

  for (const payment of payments) {
    if (isSoftDeletedRow(payment as { status?: string; deletedAt?: string | null })) continue;
    const amount = Number(payment.promisedAmount) || 0;
    if (amount <= 0) continue;
    const mass = payment.massId ? masses.find((m) => m.id === payment.massId) : undefined;
    const guestTotal = (mass?.guestAttendees ?? []).reduce(
      (sum, g) => sum + (Number(g.amount) > 0 ? Number(g.amount) : 0),
      0,
    );
    sources.push({
      id: payment.id,
      massId: payment.massId,
      massDate: payment.massDate || mass?.date,
      promisedAmount: amount,
      guestTotal,
    });
    if (payment.massId) seen.add(payment.massId);
  }

  for (const mass of masses) {
    if (seen.has(mass.id)) continue;
    const billingPaid = mass.specialMassBilling === 'paid'
      || (mass.specialMassPayment && Number(mass.specialMassPayment.amount) > 0);
    if (!billingPaid) continue;
    const amount = Number(mass.specialMassPayment?.amount) || 0;
    if (amount <= 0) continue;
    const guestTotal = (mass.guestAttendees ?? []).reduce(
      (sum, g) => sum + (Number(g.amount) > 0 ? Number(g.amount) : 0),
      0,
    );
    sources.push({
      id: `mass-pay-${mass.id}`,
      massId: mass.id,
      massDate: mass.date,
      promisedAmount: amount,
      guestTotal,
    });
  }

  return sources;
}

/**
 * Per-member payment share totals for special / paid masses.
 * Prefers locked paymentShares; else derives from payments + Present/Late attendance.
 */
export function computeMemberShareTotals(
  members: Member[],
  masses: Mass[],
  payments: Payment[],
  paymentShares: ShareCalculation[] = [],
  attendanceRecords: AttendanceRecord[] = [],
): Map<string, number> {
  const totals = new Map<string, number>();
  const coveredPaymentIds = new Set<string>();

  for (const shareDoc of paymentShares) {
    if (isSoftDeletedRow(shareDoc as { status?: string; deletedAt?: string | null })) continue;
    if (!shareDoc?.participatingMembers?.length) continue;
    let addedMemberShare = false;
    for (const part of shareDoc.participatingMembers) {
      if (!part.memberId || part.isGuest || part.memberId.startsWith('guest-')) continue;
      const amount = Number(part.share) || 0;
      if (amount <= 0) continue;
      totals.set(part.memberId, (totals.get(part.memberId) ?? 0) + amount);
      addedMemberShare = true;
    }
    if (addedMemberShare && shareDoc.paymentId) {
      coveredPaymentIds.add(shareDoc.paymentId);
    }
  }

  const sources = collectSpecialMassPaymentSources(masses, payments);
  for (const source of sources) {
    if (coveredPaymentIds.has(source.id)) continue;
    // Also skip if a share doc used payment-${massId} style id coverage
    if (source.massId && coveredPaymentIds.has(`payment-${source.massId}`)) continue;

    const attendingIds = attendingIdsForSpecialMassShare({
      massId: source.massId,
      massDate: source.massDate,
      masses,
      attendanceRecords,
    });
    if (attendingIds.length === 0) continue;

    const attendees = members.filter((m) => attendingIds.includes(m.id));
    if (attendees.length === 0) continue;

    const memberPool = Math.max(0, source.promisedAmount - source.guestTotal);
    if (memberPool <= 0) continue;

    const singers = attendees.filter((m) => m.memberType === 'Singer' || m.memberType === 'Other').length;
    const instrumentalists = attendees.filter((m) => !['Singer', 'Other'].includes(m.memberType)).length;
    const calc = calculatePaymentShares(memberPool, singers, instrumentalists);

    for (const member of attendees) {
      const share = member.memberType === 'Singer' || member.memberType === 'Other'
        ? calc.singerShare
        : calc.instrumentalistShare;
      if (share <= 0) continue;
      totals.set(member.id, (totals.get(member.id) ?? 0) + share);
    }
  }

  return totals;
}

function emptyMemberStats(member: Member): MemberAttendanceStats {
  return {
    memberId: member.id,
    memberName: memberDisplayName(member),
    logged: 0,
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
    finalAttended: 0,
    massLogged: 0,
    massAttended: 0,
    rawPercent: 0,
    finalPercent: 0,
    totalShareINR: 0,
    byKind: emptyKindBreakdown(),
  };
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
        finalAttended: 0,
        massLogged: 0,
        massAttended: 0,
        rawPercent: 0,
        finalPercent: 0,
        totalShareINR: 0,
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
    const memberRecords = uniqueRecords.filter((r) => r.memberId === stats.memberId);
    const rawHits = stats.present;
    stats.rawPercent = stats.logged > 0 ? Math.round((rawHits / stats.logged) * 100) : 0;

    const finalHits = memberRecords.filter((r) => countsAsPresentFinal(r.status, resolveKind(r))).length;
    stats.finalAttended = finalHits;
    stats.finalPercent = stats.logged > 0 ? Math.round((finalHits / stats.logged) * 100) : 0;

    const massRecords = memberRecords.filter((r) => isMassActivityKind(resolveKind(r)));
    stats.massLogged = massRecords.length;
    stats.massAttended = massRecords.filter((r) => countsAsPresentFinal(r.status, resolveKind(r))).length;

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

/** Full active-member roster with attendance + share totals (includes members with no logs). */
export function computeMemberRosterStats(
  records: AttendanceRecord[],
  members: Member[],
  masses: Mass[],
  payments: Payment[],
  paymentShares: ShareCalculation[] = [],
): MemberRosterStats[] {
  const loggedStats = computeMemberStats(records, members);
  const statsById = new Map(loggedStats.map((s) => [s.memberId, s]));
  const shareTotals = computeMemberShareTotals(
    members,
    masses,
    payments,
    paymentShares,
    records,
  );

  return members
    .filter(isActiveMember)
    .map((member) => {
      const base = statsById.get(member.id) ?? emptyMemberStats(member);
      return {
        ...base,
        totalShareINR: shareTotals.get(member.id) ?? 0,
        memberType: member.memberType,
        voiceType: member.voiceType,
      };
    })
    .sort((a, b) => a.memberName.localeCompare(b.memberName));
}

/** Parish-wide overview from attendance logs. */
export function computeParishStats(
  records: AttendanceRecord[],
  members: Member[],
  masses: Mass[] = [],
  payments: Payment[] = [],
  paymentShares: ShareCalculation[] = [],
): ParishAttendanceStats {
  const uniqueRecords = dedupeAttendanceRecords(records);
  const memberStats = computeMemberStats(uniqueRecords, members);
  const rosterStats = computeMemberRosterStats(uniqueRecords, members, masses, payments, paymentShares);
  const activeStats = memberStats.filter((s) => {
    const m = members.find((mem) => mem.id === s.memberId);
    return m && isActiveMember(m);
  });
  const activeRoster = rosterStats;

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
    rosterStats: activeRoster,
    totalShareINR: activeRoster.reduce((sum, s) => sum + s.totalShareINR, 0),
    parishMassLogged: activeRoster.reduce((sum, s) => sum + s.massLogged, 0),
    parishMassAttended: activeRoster.reduce((sum, s) => sum + s.massAttended, 0),
    parishLate: activeRoster.reduce((sum, s) => sum + s.late, 0),
    parishAbsent: activeRoster.reduce((sum, s) => sum + s.absent, 0),
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
