import { describe, expect, it } from 'vitest';
import type { AttendanceRecord, Member } from '../types';
import {
  countsAsPresentFinal,
  countsAsPresentRaw,
  computeMemberStats,
  computeParishStats,
} from './attendanceStats';

const member = (overrides: Partial<Member>): Member =>
  ({
    id: 'm-test',
    firstName: 'Test',
    lastName: 'Member',
    status: 'Active Member',
    memberType: 'Singer',
    voiceType: 'Tenor',
    parish: 'Test',
    ...overrides,
  }) as Member;

const record = (
  overrides: Partial<AttendanceRecord> & Pick<AttendanceRecord, 'memberId' | 'status' | 'activityKind'>,
): AttendanceRecord => {
  const date = overrides.date ?? '2026-01-01';
  const slot = overrides.sundayMassSlot;
  const entityId = overrides.entityId
    ?? (slot
      ? `mass-sunday_mass-${slot}-${date}`
      : `mass-${overrides.activityKind}-${date}`);
  return {
    id: overrides.id ?? `att-${entityId}-${overrides.memberId}`,
    entityId,
    entityType: overrides.entityType ?? (overrides.activityKind === 'practice' ? 'Rehearsal' : 'Mass'),
    entityName: overrides.entityName ?? 'Sunday Mass',
    date,
    memberId: overrides.memberId,
    memberName: overrides.memberName ?? 'Test Member',
    status: overrides.status,
    activityKind: overrides.activityKind,
    ...(slot ? { sundayMassSlot: slot } : {}),
  };
};

describe('countsAsPresentFinal', () => {
  it('treats Late as present for all kinds', () => {
    expect(countsAsPresentFinal('Late', 'sunday_mass')).toBe(true);
    expect(countsAsPresentFinal('Late', 'practice')).toBe(true);
  });

  it('treats Excused as present for mass kinds only', () => {
    expect(countsAsPresentFinal('Excused', 'sunday_mass')).toBe(true);
    expect(countsAsPresentFinal('Excused', 'special_mass')).toBe(true);
    expect(countsAsPresentFinal('Excused', 'practice')).toBe(false);
  });
});

describe('countsAsPresentRaw', () => {
  it('counts only Present', () => {
    expect(countsAsPresentRaw('Present')).toBe(true);
    expect(countsAsPresentRaw('Late')).toBe(false);
    expect(countsAsPresentRaw('Excused')).toBe(false);
  });
});

describe('computeMemberStats', () => {
  const members = [member({ id: 'm1', firstName: 'Akash', lastName: 'Lazar' })];

  it('computes raw and final percentages from sheet rules', () => {
    const records: AttendanceRecord[] = [
      record({ memberId: 'm1', status: 'Present', activityKind: 'sunday_mass', sundayMassSlot: '1st' }),
      record({ memberId: 'm1', status: 'Late', activityKind: 'sunday_mass', date: '2026-01-08', sundayMassSlot: '1st' }),
      record({ memberId: 'm1', status: 'Absent', activityKind: 'sunday_mass', date: '2026-01-15', sundayMassSlot: '1st' }),
      record({ memberId: 'm1', status: 'Excused', activityKind: 'practice', date: '2026-01-22', entityType: 'Rehearsal' }),
    ];

    const stats = computeMemberStats(records, members);
    expect(stats[0].present).toBe(1);
    expect(stats[0].late).toBe(1);
    expect(stats[0].rawPercent).toBe(25);
    expect(stats[0].finalPercent).toBe(50);
  });

  it('merges Sunday 1st/2nd Mass so either attendance is not Absent', () => {
    const records: AttendanceRecord[] = [
      record({
        memberId: 'm1',
        status: 'Absent',
        activityKind: 'sunday_mass',
        date: '2026-07-19',
        sundayMassSlot: '1st',
        entityId: 'mass-sunday_mass-1st-2026-07-19',
      }),
      record({
        memberId: 'm1',
        status: 'Present',
        activityKind: 'sunday_mass',
        date: '2026-07-19',
        sundayMassSlot: '2nd',
        entityId: 'mass-sunday_mass-2nd-2026-07-19',
      }),
      record({
        memberId: 'm1',
        status: 'Absent',
        activityKind: 'sunday_mass',
        date: '2026-07-26',
        sundayMassSlot: '1st',
        entityId: 'mass-sunday_mass-1st-2026-07-26',
      }),
      record({
        memberId: 'm1',
        status: 'Absent',
        activityKind: 'sunday_mass',
        date: '2026-07-26',
        sundayMassSlot: '2nd',
        entityId: 'mass-sunday_mass-2nd-2026-07-26',
      }),
    ];

    const stats = computeMemberStats(records, members);
    expect(stats[0].logged).toBe(2);
    expect(stats[0].present).toBe(1);
    expect(stats[0].absent).toBe(1);
    expect(stats[0].finalPercent).toBe(50);
  });
});

describe('computeParishStats', () => {
  const members = [
    member({ id: 'm1', firstName: 'A', lastName: 'One' }),
    member({ id: 'm2', firstName: 'B', lastName: 'Two', voiceType: 'Alto' }),
  ];

  it('averages active member final rates', () => {
    const records: AttendanceRecord[] = [
      record({ memberId: 'm1', status: 'Present', activityKind: 'sunday_mass' }),
      record({ memberId: 'm1', status: 'Present', activityKind: 'sunday_mass', date: '2026-01-08' }),
      record({ memberId: 'm2', status: 'Absent', activityKind: 'sunday_mass' }),
    ];
    const parish = computeParishStats(records, members);
    expect(parish.averageFinalPercent).toBe(50);
    expect(parish.totalSessions).toBe(2);
    expect(parish.rosterStats.length).toBeGreaterThanOrEqual(0);
  });
});
