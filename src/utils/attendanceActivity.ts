import {
  ActivityKind,
  AttendanceRecord,
  AttendanceStatus,
  Mass,
  Member,
  Rehearsal,
  SpecialMassBilling,
  SpecialMassPaymentDetails,
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

export function activityEntityId(kind: ActivityKind, date: string): string {
  const prefix = kind === 'practice' ? 'rehearsal' : 'mass';
  return `${prefix}-${kind}-${date}`;
}

export function attendanceRecordId(entityId: string, memberId: string): string {
  return `att-${entityId}-${memberId}`;
}

export function kindToEntityType(kind: ActivityKind): AttendanceRecord['entityType'] {
  return kind === 'practice' ? 'Rehearsal' : 'Mass';
}

export function defaultEntityName(kind: ActivityKind, date: string): string {
  return `${ACTIVITY_KIND_LABELS[kind]} · ${date}`;
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
): Mass | Rehearsal | undefined {
  const entityId = activityEntityId(kind, date);
  if (kind === 'practice') {
    return rehearsals.find((r) => r.id === entityId || (r.date === date && r.activityKind === 'practice'));
  }
  return masses.find((m) => m.id === entityId || (m.date === date && m.activityKind === kind));
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
): Mass {
  const id = existing?.id ?? activityEntityId(kind, date);
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
    name: title?.trim() || existing?.name || defaultEntityName(kind, date),
    category: kindToMassCategory(kind),
    date,
    time: existing?.time ?? defaultTimeForKind(kind),
    language: existing?.language ?? 'Tamil',
    notes: notes?.trim() || existing?.notes,
    attendingMemberIds,
    activityKind: kind,
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
): AttendanceRecord[] {
  const entityType = kindToEntityType(kind);
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
      entityName,
      date,
      memberId: m.id,
      memberName: `${m.firstName} ${m.lastName}`.trim(),
      status: marks[m.id] as AttendanceStatus,
    }));
}

export function marksFromRecords(
  records: AttendanceRecord[],
  entityId: string,
): Record<string, AttendanceStatus> {
  const marks: Record<string, AttendanceStatus> = {};
  for (const record of records.filter((r) => r.entityId === entityId)) {
    marks[record.memberId] = record.status;
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
  specialMassBilling?: SpecialMassBilling;
  specialMassPayment?: SpecialMassPaymentDetails;
}

/** Merge import sessions by kind + date; later marks win on conflict. */
export function dedupeImportSessions(
  sessions: ActivitySessionPayload[],
): ActivitySessionPayload[] {
  const map = new Map<string, ActivitySessionPayload>();

  for (const session of sessions) {
    const key = `${session.kind}::${session.date}`;
    const existing = map.get(key);
    if (existing) {
      map.set(key, {
        ...existing,
        title: session.title ?? existing.title,
        notes: session.notes ?? existing.notes,
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
): boolean {
  const entityId = activityEntityId(kind, date);
  const existing = marksFromRecords(records, entityId);
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
}

/** Recent unique activity sessions from attendance records. */
export function listActivitySessions(
  records: AttendanceRecord[],
  kind?: ActivityKind,
): ActivitySessionSummary[] {
  const map = new Map<string, ActivitySessionSummary>();
  const membersBySession = new Map<string, Set<string>>();

  for (const record of records) {
    const recordKind = resolveActivityKind(record);
    if (kind && recordKind !== kind) continue;
    const key = `${recordKind}::${record.date}`;
    const members = membersBySession.get(key) ?? new Set<string>();
    members.add(record.memberId);
    membersBySession.set(key, members);

    const existing = map.get(key);
    if (existing) {
      existing.loggedCount = members.size;
      existing.entityId = activityEntityId(recordKind, record.date);
    } else {
      map.set(key, {
        kind: recordKind,
        date: record.date,
        entityId: activityEntityId(recordKind, record.date),
        entityName: record.entityName,
        loggedCount: members.size,
      });
    }
  }

  return [...map.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
}
