import { describe, expect, it } from 'vitest';
import type { AttendanceRecord } from '../types';
import {
  activityEntityId,
  attendanceRecordId,
  dedupeImportSessions,
  marksForActivitySession,
  marksFromRecords,
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
});
