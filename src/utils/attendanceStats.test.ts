import { describe, expect, it } from 'vitest';
import type { AttendanceRecord, Mass, Member, Payment } from '../types';
import {
  countsAsPresentFinal,
  countsAsPresentRaw,
  computeMemberRosterStats,
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

  it('keeps same-day Special Mass rites distinct by entityId / tag', () => {
    const records: AttendanceRecord[] = [
      record({
        memberId: 'm1',
        status: 'Present',
        activityKind: 'special_mass',
        date: '2026-06-07',
        entityId: 'mass-death-anniversary-1',
        entityName: 'Death Anniversary Mass',
      }),
      record({
        memberId: 'm1',
        status: 'Present',
        activityKind: 'special_mass',
        date: '2026-06-07',
        entityId: 'mass-wedding-1',
        entityName: 'Wedding Mass',
      }),
      record({
        memberId: 'm1',
        status: 'Present',
        activityKind: 'special_mass',
        date: '2026-06-25',
        entityId: 'mass-wedding-2',
        entityName: 'Wedding Mass',
      }),
    ];

    const stats = computeMemberStats(records, members);
    expect(stats[0].logged).toBe(3);
    expect(stats[0].byKind.special_mass.logged).toBe(3);
    expect(stats[0].finalPercent).toBe(100);

    const parish = computeParishStats(records, members);
    expect(parish.totalSessions).toBe(3);
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

describe('special mass share sync', () => {
  it('splits remaining pool from attendance Present marks even without attendingMemberIds', () => {
    const members = [
      member({ id: 'm1', firstName: 'A', lastName: 'Singer', memberType: 'Singer' }),
      member({ id: 'm2', firstName: 'B', lastName: 'Keys', memberType: 'Keyboard' }),
      member({ id: 'm3', firstName: 'C', lastName: 'Absent', memberType: 'Singer' }),
    ];
    const masses: Mass[] = [{
      id: 'mass-wedding-1',
      name: 'Wedding Mass',
      category: 'Wedding',
      date: '2026-06-07',
      time: '04:00 PM',
      language: 'Tamil',
      activityKind: 'special_mass',
      specialMassBilling: 'paid',
      specialMassPayment: { amount: 3000 },
    }];
    const payments: Payment[] = [{
      id: 'payment-mass-wedding-1',
      massId: 'mass-wedding-1',
      partyName: 'Sponsor',
      mobile: '',
      massType: 'Wedding',
      massDate: '2026-06-07',
      massTime: '04:00 PM',
      promisedAmount: 3000,
      receivedAmount: 0,
      pendingAmount: 3000,
      status: 'Pending',
    }];
    const records: AttendanceRecord[] = [
      record({
        memberId: 'm1',
        status: 'Present',
        activityKind: 'special_mass',
        date: '2026-06-07',
        entityId: 'mass-wedding-1',
      }),
      record({
        memberId: 'm2',
        status: 'Present',
        activityKind: 'special_mass',
        date: '2026-06-07',
        entityId: 'mass-wedding-1',
      }),
      record({
        memberId: 'm3',
        status: 'Absent',
        activityKind: 'special_mass',
        date: '2026-06-07',
        entityId: 'mass-wedding-1',
      }),
    ];

    const roster = computeMemberRosterStats(records, members, masses, payments, []);
    // 3000 / (1 + 2) = 1000 unit → singer 1000, musician 2000
    expect(roster.find((r) => r.memberId === 'm1')?.totalShareINR).toBe(1000);
    expect(roster.find((r) => r.memberId === 'm2')?.totalShareINR).toBe(2000);
    expect(roster.find((r) => r.memberId === 'm3')?.totalShareINR).toBe(0);
  });

  it('zeros outstanding share after settle ledger entry', () => {
    const members = [
      member({ id: 'm1', firstName: 'A', lastName: 'Singer', memberType: 'Singer' }),
    ];
    const masses: Mass[] = [{
      id: 'mass-wedding-1',
      name: 'Wedding Mass',
      category: 'Wedding',
      date: '2026-06-07',
      time: '04:00 PM',
      language: 'Tamil',
      activityKind: 'special_mass',
      specialMassBilling: 'paid',
      specialMassPayment: { amount: 1000 },
    }];
    const payments: Payment[] = [{
      id: 'payment-mass-wedding-1',
      massId: 'mass-wedding-1',
      partyName: 'Sponsor',
      mobile: '',
      massType: 'Wedding',
      massDate: '2026-06-07',
      massTime: '04:00 PM',
      promisedAmount: 1000,
      receivedAmount: 0,
      pendingAmount: 1000,
      status: 'Pending',
    }];
    const records: AttendanceRecord[] = [
      record({
        memberId: 'm1',
        status: 'Present',
        activityKind: 'special_mass',
        date: '2026-06-07',
        entityId: 'mass-wedding-1',
      }),
    ];
    const before = computeMemberRosterStats(records, members, masses, payments, []);
    expect(before.find((r) => r.memberId === 'm1')?.totalShareINR).toBe(1000);

    const after = computeMemberRosterStats(records, members, masses, payments, [], [{
      id: 'settle-1',
      memberId: 'm1',
      memberName: 'A Singer',
      amount: 1000,
      settledAt: '2026-06-08T00:00:00.000Z',
    }]);
    expect(after.find((r) => r.memberId === 'm1')?.totalShareINR).toBe(0);
  });
});
