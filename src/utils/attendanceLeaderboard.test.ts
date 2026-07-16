import { describe, expect, it } from 'vitest';
import type { AttendanceRecord, Member } from '../types';
import {
  computeAttendanceLeaderboard,
  findLeaderboardRank,
  pointsForStatus,
} from './attendanceLeaderboard';

const member = (overrides: Partial<Member>): Member =>
  ({
    id: 'm-test',
    firstName: 'Test',
    lastName: 'Member',
    status: 'Active Member',
    memberType: 'Singer',
    voiceType: 'Tenor',
    photoUrl: '',
    parish: 'Test',
    ...overrides,
  }) as Member;

const record = (
  overrides: Partial<AttendanceRecord> & Pick<AttendanceRecord, 'memberId' | 'status' | 'activityKind'>,
): AttendanceRecord => ({
  id: `att-${overrides.memberId}-${overrides.date ?? '2026-01-01'}-${overrides.activityKind}`,
  entityId: `mass-${overrides.activityKind}-${overrides.date ?? '2026-01-01'}`,
  entityType: overrides.entityType ?? (overrides.activityKind === 'practice' ? 'Rehearsal' : 'Mass'),
  entityName: 'Sunday Mass',
  date: overrides.date ?? '2026-01-01',
  memberId: overrides.memberId,
  memberName: overrides.memberName ?? 'Test Member',
  status: overrides.status,
  activityKind: overrides.activityKind,
});

describe('pointsForStatus', () => {
  it('weights present > late > excused > absent', () => {
    expect(pointsForStatus('Present')).toBe(1);
    expect(pointsForStatus('Late')).toBe(0.5);
    expect(pointsForStatus('Excused')).toBe(0.25);
    expect(pointsForStatus('Absent')).toBe(0);
  });
});

describe('computeAttendanceLeaderboard', () => {
  const members = [
    member({ id: 'm1', firstName: 'Akash', lastName: 'Lazar', voiceType: 'Bass' }),
    member({ id: 'm2', firstName: 'Bella', lastName: 'Mary', voiceType: 'Soprano' }),
    member({ id: 'm3', firstName: 'Pending', lastName: 'User', status: 'Pending' }),
  ];

  it('returns empty when no attendance records exist', () => {
    expect(computeAttendanceLeaderboard([], members)).toEqual([]);
  });

  it('includes practice in standings and breaks out Mass / Special / Practice columns', () => {
    const records: AttendanceRecord[] = [
      record({ memberId: 'm1', status: 'Present', activityKind: 'sunday_mass', date: '2026-01-04' }),
      record({ memberId: 'm1', status: 'Late', activityKind: 'special_mass', date: '2026-01-05' }),
      record({ memberId: 'm1', status: 'Absent', activityKind: 'practice', date: '2026-01-06', entityType: 'Rehearsal' }),
      record({ memberId: 'm2', status: 'Present', activityKind: 'practice', date: '2026-01-06', entityType: 'Rehearsal' }),
    ];

    const board = computeAttendanceLeaderboard(records, members);
    expect(board).toHaveLength(2);

    const m2 = board.find((e) => e.memberId === 'm2')!;
    const m1 = board.find((e) => e.memberId === 'm1')!;
    // m2: 1/1 = 100%; m1: (1 + 0.5 + 0) / 3 = 50%
    expect(m2.rank).toBe(1);
    expect(m2.scorePercent).toBe(100);
    expect(m2.practice.attended).toBe(1);
    expect(m2.practice.logged).toBe(1);

    expect(m1.scorePercent).toBe(50);
    expect(m1.mass.attended).toBe(1);
    expect(m1.mass.logged).toBe(1);
    expect(m1.specialMass.late).toBe(1);
    expect(m1.specialMass.logged).toBe(1);
    expect(m1.practice.absent).toBe(1);
    expect(m1.sessionLogged).toBe(3);
  });

  it('scores combined reliability and sorts by score, then on-time, then name', () => {
    const records: AttendanceRecord[] = [
      record({ memberId: 'm1', status: 'Present', activityKind: 'sunday_mass', date: '2026-01-04' }),
      record({ memberId: 'm1', status: 'Late', activityKind: 'sunday_mass', date: '2026-01-11' }),
      record({ memberId: 'm1', status: 'Absent', activityKind: 'sunday_mass', date: '2026-01-18' }),
      record({ memberId: 'm2', status: 'Present', activityKind: 'sunday_mass', date: '2026-01-04' }),
      record({ memberId: 'm2', status: 'Present', activityKind: 'sunday_mass', date: '2026-01-11' }),
      record({ memberId: 'm3', status: 'Present', activityKind: 'sunday_mass', date: '2026-01-04' }),
    ];

    const board = computeAttendanceLeaderboard(records, members);
    expect(board).toHaveLength(2);
    expect(board[0].memberId).toBe('m2');
    expect(board[0].rank).toBe(1);
    expect(board[0].scorePercent).toBe(100);
    expect(board[0].sessionAttended).toBe(2);
    expect(board[1].memberId).toBe('m1');
    expect(board[1].scorePercent).toBe(50);
    expect(board[1].late).toBe(1);
    expect(board[1].absent).toBe(1);
  });

  it('breaks ties by on-time count then name', () => {
    const records: AttendanceRecord[] = [
      record({ memberId: 'm1', status: 'Present', activityKind: 'sunday_mass', date: '2026-01-04' }),
      record({ memberId: 'm1', status: 'Late', activityKind: 'sunday_mass', date: '2026-01-11' }),
      record({ memberId: 'm2', status: 'Present', activityKind: 'sunday_mass', date: '2026-01-04' }),
      record({ memberId: 'm2', status: 'Late', activityKind: 'sunday_mass', date: '2026-01-11' }),
    ];
    const board = computeAttendanceLeaderboard(records, members);
    expect(board[0].memberName).toBe('Akash Lazar');
    expect(board[1].memberName).toBe('Bella Mary');
  });
});

describe('findLeaderboardRank', () => {
  it('returns the viewer entry or null', () => {
    const entries = computeAttendanceLeaderboard(
      [record({ memberId: 'm1', status: 'Present', activityKind: 'sunday_mass' })],
      [member({ id: 'm1', firstName: 'Akash', lastName: 'Lazar' })],
    );
    expect(findLeaderboardRank(entries, 'm1')?.rank).toBe(1);
    expect(findLeaderboardRank(entries, 'missing')).toBeNull();
  });
});
