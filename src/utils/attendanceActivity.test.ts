import { describe, expect, it } from 'vitest';
import type { AttendanceRecord } from '../types';
import {
  activityEntityId,
  attendanceRecordId,
  dedupeImportSessions,
  marksForActivitySession,
  marksFromRecords,
  mergeSundaySlotStatuses,
} from './attendanceActivity';

function record(overrides: Partial<AttendanceRecord> & Pick<AttendanceRecord, 'memberId' | 'date'>): AttendanceRecord {
  const kind = overrides.activityKind ?? 'sunday_mass';
  const entityId = overrides.entityId ?? activityEntityId(kind, overrides.date);
  return {
    id: overrides.id ?? attendanceRecordId(entityId, overrides.memberId),
    entityId,
    entityType: kind === 'practice' ? 'Rehearsal' : 'Mass',
    activityKind: kind,
    entityName: overrides.entityName ?? 'Sunday Mass',
    date: overrides.date,
    memberId: overrides.memberId,
    memberName: overrides.memberName ?? 'Test Member',
    status: overrides.status ?? 'Present',
  };
}

describe('marksForActivitySession', () => {
  it('prefers canonical entityId when legacy duplicates exist', () => {
    const date = '2026-01-04';
    const kind = 'sunday_mass' as const;
    const canonical = activityEntityId(kind, date);
    const rows = [
      record({
        memberId: 'm1',
        date,
        activityKind: kind,
        entityId: 'legacy-mass-uuid',
        id: 'att-legacy-m1',
        status: 'Absent',
      }),
      record({
        memberId: 'm1',
        date,
        activityKind: kind,
        entityId: canonical,
        status: 'Present',
      }),
      record({
        memberId: 'm2',
        date,
        activityKind: kind,
        entityId: 'legacy-mass-uuid',
        id: 'att-legacy-m2',
        status: 'Late',
      }),
    ];

    expect(marksForActivitySession(rows, kind, date)).toEqual({
      m1: 'Present',
      m2: 'Late',
    });
    expect(marksFromRecords(rows, canonical)).toEqual({ m1: 'Present' });
  });
});

describe('dedupeImportSessions', () => {
  it('merges same kind+date and lets later marks win', () => {
    const merged = dedupeImportSessions([
      { kind: 'practice', date: '2026-01-10', marks: { m1: 'Present', m2: 'Absent' } },
      { kind: 'practice', date: '2026-01-10', marks: { m2: 'Late', m3: 'Present' } },
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.marks).toEqual({ m1: 'Present', m2: 'Late', m3: 'Present' });
  });

  it('keeps Sunday 1st and 2nd Mass sessions separate', () => {
    const merged = dedupeImportSessions([
      { kind: 'sunday_mass', date: '2026-07-19', sundayMassSlot: '1st', marks: { m1: 'Present' } },
      { kind: 'sunday_mass', date: '2026-07-19', sundayMassSlot: '2nd', marks: { m1: 'Absent' } },
    ]);
    expect(merged).toHaveLength(2);
  });
});

describe('mergeSundaySlotStatuses', () => {
  it('counts Present on either slot as Present', () => {
    expect(mergeSundaySlotStatuses(['Absent', 'Present'])).toBe('Present');
    expect(mergeSundaySlotStatuses(['Present', 'Late'])).toBe('Present');
  });

  it('counts Late when no Present', () => {
    expect(mergeSundaySlotStatuses(['Absent', 'Late'])).toBe('Late');
  });

  it('counts Absent only when both slots are Absent/missing', () => {
    expect(mergeSundaySlotStatuses(['Absent', 'Absent'])).toBe('Absent');
    expect(mergeSundaySlotStatuses(['Absent'])).toBe('Absent');
  });
});

describe('activityEntityId sunday slots', () => {
  it('includes 1st/2nd in Sunday entity ids', () => {
    expect(activityEntityId('sunday_mass', '2026-07-19', '1st')).toBe('mass-sunday_mass-1st-2026-07-19');
    expect(activityEntityId('sunday_mass', '2026-07-19', '2nd')).toBe('mass-sunday_mass-2nd-2026-07-19');
    expect(activityEntityId('sunday_mass', '2026-07-19')).toBe('mass-sunday_mass-2026-07-19');
  });
});
