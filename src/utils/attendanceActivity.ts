import {
  ActivityKind,
  AttendanceRecord,
  AttendanceStatus,
  Mass,
  Member,
  Rehearsal,
  SpecialMassBilling,
  SpecialMassPaymentDetails,
  SundayMassSlot,
} from '../types';
import {
  ACTIVITY_KIND_LABELS,
  ACTIVITY_KIND_SHORT,
  defaultTimeForKind,
  isLiturgyActivityKind,
  kindToMassCategory,
  resolveActivityKind,
} from './attendanceTaxonomy';

export {
  ACTIVITY_KIND_LABELS,
  ACTIVITY_KIND_SHORT,
  ATTENDANCE_CATEGORY_LABELS,
  ALL_ACTIVITY_KINDS,
  MASS_BUCKET_KINDS,
  categoryForActivityKind,
  defaultTimeForKind,
  isMassBucketKind,
  isLiturgyActivityKind,
  kindsForCategory,
  kindToMassCategory,
  resolveActivityKind,
} from './attendanceTaxonomy';

/** @deprecated Prefer isLiturgyActivityKind — includes special_mass, excludes practice. */
export const MASS_ACTIVITY_KINDS: ActivityKind[] = [
  'sunday_mass',
  'saturday_mass',
  'weekday_mass',
  'feast_day',
  'novena',
  'special_mass',
];

export function isMassActivityKind(kind: ActivityKind): boolean {
  return isLiturgyActivityKind(kind);
}

export const SUNDAY_MASS_SLOTS: SundayMassSlot[] = ['1st', '2nd'];

export const SUNDAY_MASS_SLOT_LABELS: Record<SundayMassSlot, string> = {
  '1st': '1st Mass',
  '2nd': '2nd Mass',
};

/** Parse slot from entityId / stored field (legacy sunday sessions have no slot). */
export function resolveSundayMassSlot(
  source: { sundayMassSlot?: SundayMassSlot | null; entityId?: string; id?: string } | null | undefined,
): SundayMassSlot | undefined {
  const direct = source?.sundayMassSlot;
  if (direct === '1st' || direct === '2nd') return direct;
  const id = `${source?.entityId || ''} ${source?.id || ''}`;
  if (id.includes('sunday_mass-1st-') || id.includes('-1st-')) return '1st';
  if (id.includes('sunday_mass-2nd-') || id.includes('-2nd-')) return '2nd';
  return undefined;
}

export function activityEntityId(
  kind: ActivityKind,
  date: string,
  sundayMassSlot?: SundayMassSlot | null,
): string {
  const prefix = kind === 'practice' ? 'rehearsal' : 'mass';
  if (kind === 'sunday_mass' && sundayMassSlot) {
    return `${prefix}-${kind}-${sundayMassSlot}-${date}`;
  }
  return `${prefix}-${kind}-${date}`;
}

export function attendanceRecordId(entityId: string, memberId: string): string {
  return `att-${entityId}-${memberId}`;
}

export function kindToEntityType(kind: ActivityKind): AttendanceRecord['entityType'] {
  return kind === 'practice' ? 'Rehearsal' : 'Mass';
}

export function defaultEntityName(
  kind: ActivityKind,
  date: string,
  sundayMassSlot?: SundayMassSlot | null,
): string {
  if (kind === 'sunday_mass' && sundayMassSlot) {
    return `${ACTIVITY_KIND_LABELS[kind]} · ${SUNDAY_MASS_SLOT_LABELS[sundayMassSlot]} · ${date}`;
  }
  return `${ACTIVITY_KIND_LABELS[kind]} · ${date}`;
}

/**
 * Collapse 1st/2nd Sunday marks for the same member+date:
 * Present on either → Present; else Late; else Excused; else Absent
 * (missing both slots / Absent on both → Absent).
 */
export function mergeSundaySlotStatuses(statuses: AttendanceStatus[]): AttendanceStatus {
  if (statuses.length === 0) return 'Absent';
  if (statuses.includes('Present')) return 'Present';
  if (statuses.includes('Late')) return 'Late';
  if (statuses.includes('Excused')) return 'Excused';
  return 'Absent';
}

export function attendingMemberIdsFromMarks(
  marks: Record<string, AttendanceStatus | null | undefined>,
): string[] {
  return Object.entries(marks)
    .filter(([, status]) => status === 'Present' || status === 'Late')
    .map(([memberId]) => memberId);
}

export function findActivityParent(
  kind: ActivityKind,
  date: string,
  masses: Mass[],
  rehearsals: Rehearsal[],
  sundayMassSlot?: SundayMassSlot | null,
): Mass | Rehearsal | undefined {
  const entityId = activityEntityId(kind, date, sundayMassSlot);
  if (kind === 'practice') {
    return rehearsals.find((r) => r.id === entityId || (r.date === date && r.activityKind === 'practice'));
  }
  const slotted = masses.find((m) => m.id === entityId);
  if (slotted) return slotted;
  if (kind === 'sunday_mass' && sundayMassSlot) {
    return masses.find(
      (m) =>
        m.date === date
        && m.activityKind === 'sunday_mass'
        && resolveSundayMassSlot(m) === sundayMassSlot,
    );
  }
  // Legacy unslotted Sunday (or other kinds): match kind+date without a slot.
  return masses.find((m) => {
    if (m.id === entityId) return true;
    if (m.date !== date || m.activityKind !== kind) return false;
    if (kind === 'sunday_mass') return !resolveSundayMassSlot(m);
    return true;
  });
}

export function buildMassFromActivity(
  kind: ActivityKind,
  date: string,
  title: string | undefined,
  notes: string | undefined,
  attendingMemberIds: string[],
  existing?: Mass,
  billing?: {
    specialMassBilling?: SpecialMassBilling;
    specialMassPayment?: SpecialMassPaymentDetails;
  },
  sundayMassSlot?: SundayMassSlot | null,
): Mass {
  const slot = kind === 'sunday_mass' ? (sundayMassSlot ?? existing?.sundayMassSlot) : undefined;
  const id = existing?.id ?? activityEntityId(kind, date, slot);
  const isSpecial = kind === 'special_mass';
  const specialMassBilling = isSpecial
    ? (billing?.specialMassBilling ?? existing?.specialMassBilling)
    : undefined;
  const specialMassPayment = isSpecial && specialMassBilling === 'paid'
    ? (billing?.specialMassPayment ?? existing?.specialMassPayment)
    : isSpecial && specialMassBilling === 'free'
      ? undefined
      : existing?.specialMassPayment;

  return {
    id,
    name: title?.trim() || existing?.name || defaultEntityName(kind, date, slot),
    category: kindToMassCategory(kind),
    date,
    time: existing?.time ?? defaultTimeForKind(kind),
    language: existing?.language ?? 'Tamil',
    notes: notes?.trim() || existing?.notes,
    attendingMemberIds,
    activityKind: kind,
    ...(slot ? { sundayMassSlot: slot } : {}),
    celebrant: existing?.celebrant,
    venue: existing?.venue,
    ...(isSpecial && specialMassBilling
      ? {
          specialMassBilling,
          ...(specialMassBilling === 'paid' && specialMassPayment
            ? { specialMassPayment }
            : {}),
        }
      : {}),
  };
}

export function buildRehearsalFromActivity(
  date: string,
  title: string | undefined,
  notes: string | undefined,
  attendingMemberIds: string[],
  existing?: Rehearsal,
): Rehearsal {
  const id = existing?.id ?? activityEntityId('practice', date);
  return {
    id,
    name: title?.trim() || existing?.name || defaultEntityName('practice', date),
    type: existing?.type ?? 'Regular Practice',
    date,
    startTime: existing?.startTime ?? '18:00',
    endTime: existing?.endTime ?? '19:30',
    venue: existing?.venue ?? 'Church Hall',
    notes: notes?.trim() || existing?.notes,
    attendingMemberIds,
    activityKind: 'practice',
    status: existing?.status ?? 'Completed',
    conductor: existing?.conductor,
    songs: existing?.songs,
  };
}

export function buildAttendanceRecords(
  kind: ActivityKind,
  entityId: string,
  entityName: string,
  date: string,
  marks: Record<string, AttendanceStatus | null | undefined>,
  members: Member[],
  sundayMassSlot?: SundayMassSlot | null,
): AttendanceRecord[] {
  const entityType = kindToEntityType(kind);
  const slot = kind === 'sunday_mass' ? (sundayMassSlot ?? resolveSundayMassSlot({ entityId })) : undefined;
  const activeMembers = members.filter(
    (m) => m.status === 'Active Member' || m.status === 'Approved' || m.status === 'Admin',
  );

  return activeMembers
    .filter((m) => marks[m.id])
    .map((m) => ({
      id: attendanceRecordId(entityId, m.id),
      entityId,
      entityType,
      activityKind: kind,
      ...(slot ? { sundayMassSlot: slot } : {}),
      entityName,
      date,
      memberId: m.id,
      memberName: `${m.firstName} ${m.lastName}`.trim(),
      status: marks[m.id] as AttendanceStatus,
    }));
}

function isSoftDeletedRecord(record: AttendanceRecord): boolean {
  return (record as AttendanceRecord & { deletedAt?: string | null }).deletedAt != null
    || (record.status as string) === 'deleted';
}

export function marksFromRecords(
  records: AttendanceRecord[],
  entityId: string,
): Record<string, AttendanceStatus> {
  const marks: Record<string, AttendanceStatus> = {};
  for (const record of records.filter((r) => r.entityId === entityId)) {
    if (isSoftDeletedRecord(record)) continue;
    marks[record.memberId] = record.status;
  }
  return marks;
}

/**
 * One mark per member for a logical session (kind + date [+ Sunday slot]).
 * Prefers the canonical entityId so Log/History stay aligned after CSV re-imports
 * even when legacy docs used a different mass/rehearsal id.
 */
export function marksForActivitySession(
  records: AttendanceRecord[],
  kind: ActivityKind,
  date: string,
  sundayMassSlot?: SundayMassSlot | null,
): Record<string, AttendanceStatus> {
  const canonicalEntityId = activityEntityId(kind, date, sundayMassSlot);
  const marks: Record<string, AttendanceStatus> = {};

  for (const record of records) {
    if (record.date !== date || isSoftDeletedRecord(record)) continue;
    if (resolveActivityKind(record) !== kind) continue;
    if (kind === 'sunday_mass') {
      const recordSlot = resolveSundayMassSlot(record);
      // Slotted UI only loads matching slot; legacy unslotted loads when no slot selected.
      if (sundayMassSlot) {
        if (recordSlot && recordSlot !== sundayMassSlot) continue;
        if (!recordSlot && sundayMassSlot !== '1st') continue;
      } else if (recordSlot) {
        continue;
      }
    }
    marks[record.memberId] = record.status;
  }

  for (const record of records) {
    if (record.entityId !== canonicalEntityId || isSoftDeletedRecord(record)) continue;
    marks[record.memberId] = record.status;
  }

  // Legacy unslotted Sunday docs when viewing 1st Mass
  if (kind === 'sunday_mass' && sundayMassSlot === '1st') {
    const legacyId = activityEntityId(kind, date);
    for (const record of records) {
      if (record.entityId !== legacyId || isSoftDeletedRecord(record)) continue;
      if (marks[record.memberId] == null) marks[record.memberId] = record.status;
    }
  }

  return marks;
}

/** Map spreadsheet cell codes to attendance status. */
export function parseCsvMark(cell: string | undefined | null): AttendanceStatus | null {
  const value = (cell ?? '').trim().toUpperCase();
  if (!value) return null;
  if (value === 'A') return 'Present';
  if (value === 'X') return 'Absent';
  if (value === 'L') return 'Late';
  if (value === '*') return 'Excused';
  return null;
}

/** Parse DD-MM-YYYY (sheet format) to ISO YYYY-MM-DD. */
export function parseSheetDate(header: string): string | null {
  const trimmed = header.trim();
  const match = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(trimmed);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export interface ActivitySessionPayload {
  kind: ActivityKind;
  date: string;
  title?: string;
  notes?: string;
  marks: Record<string, AttendanceStatus | null>;
  sundayMassSlot?: SundayMassSlot;
  specialMassBilling?: SpecialMassBilling;
  specialMassPayment?: SpecialMassPaymentDetails;
}

/** Merge import sessions by kind + date [+ Sunday slot]; later marks win on conflict. */
export function dedupeImportSessions(
  sessions: ActivitySessionPayload[],
): ActivitySessionPayload[] {
  const map = new Map<string, ActivitySessionPayload>();

  for (const session of sessions) {
    const slot = session.kind === 'sunday_mass' ? (session.sundayMassSlot ?? '') : '';
    const key = `${session.kind}::${slot}::${session.date}`;
    const existing = map.get(key);
    if (existing) {
      map.set(key, {
        ...existing,
        title: session.title ?? existing.title,
        notes: session.notes ?? existing.notes,
        sundayMassSlot: session.sundayMassSlot ?? existing.sundayMassSlot,
        specialMassBilling: session.specialMassBilling ?? existing.specialMassBilling,
        specialMassPayment: session.specialMassPayment ?? existing.specialMassPayment,
        marks: { ...existing.marks, ...session.marks },
      });
    } else {
      map.set(key, { ...session, marks: { ...session.marks } });
    }
  }

  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** True when every logged mark already matches stored attendance for that session. */
export function sessionMarksUnchanged(
  kind: ActivityKind,
  date: string,
  marks: Record<string, AttendanceStatus | null>,
  records: AttendanceRecord[],
  sundayMassSlot?: SundayMassSlot | null,
): boolean {
  const existing = marksForActivitySession(records, kind, date, sundayMassSlot);
  const incoming = Object.entries(marks).filter(([, status]) => status) as [string, AttendanceStatus][];
  if (incoming.length === 0) return Object.keys(existing).length === 0;
  if (incoming.length !== Object.keys(existing).length) return false;
  return incoming.every(([memberId, status]) => existing[memberId] === status);
}

export interface ActivitySessionSummary {
  kind: ActivityKind;
  date: string;
  entityId: string;
  entityName: string;
  loggedCount: number;
  sundayMassSlot?: SundayMassSlot;
}

/** Recent unique activity sessions from attendance records. */
export function listActivitySessions(
  records: AttendanceRecord[],
  kind?: ActivityKind,
): ActivitySessionSummary[] {
  const map = new Map<string, ActivitySessionSummary>();
  const membersBySession = new Map<string, Set<string>>();

  for (const record of records) {
    if (isSoftDeletedRecord(record)) continue;
    const recordKind = resolveActivityKind(record);
    if (kind && recordKind !== kind) continue;
    const slot = recordKind === 'sunday_mass' ? resolveSundayMassSlot(record) : undefined;
    const key = `${recordKind}::${slot ?? 'legacy'}::${record.date}`;
    const members = membersBySession.get(key) ?? new Set<string>();
    members.add(record.memberId);
    membersBySession.set(key, members);

    const existing = map.get(key);
    if (existing) {
      existing.loggedCount = members.size;
      existing.entityId = activityEntityId(recordKind, record.date, slot);
    } else {
      map.set(key, {
        kind: recordKind,
        date: record.date,
        entityId: activityEntityId(recordKind, record.date, slot),
        entityName: record.entityName,
        loggedCount: members.size,
        ...(slot ? { sundayMassSlot: slot } : {}),
      });
    }
  }

  return [...map.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
}
