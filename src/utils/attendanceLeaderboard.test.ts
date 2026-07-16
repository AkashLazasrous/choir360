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
  entityType: overrides.entityType ?? 'Mass',
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

  it('returns empty when no mass records exist', () => {
    expect(computeAttendanceLeaderboard([], members)).toEqual([]);
    expect(
      computeAttendanceLeaderboard(
        [record({ memberId: 'm1', status: 'Present', activityKind: 'practice', entityType: 'Rehearsal' })],
        members,
      ),
    ).toEqual([]);
  });

  it('scores mass reliability and sorts by score, then on-time, then name', () => {
    const records: AttendanceRecord[] = [
      // m1: 1 + 0.5 + 0 = 1.5 / 3 = 0.5
      record({ memberId: 'm1', status: 'Present', activityKind: 'sunday_mass', date: '2026-01-04' }),
      record({ memberId: 'm1', status: 'Late', activityKind: 'sunday_mass', date: '2026-01-11' }),
      record({ memberId: 'm1', status: 'Absent', activityKind: 'sunday_mass', date: '2026-01-18' }),
      // m2: perfect → 1.0
      record({ memberId: 'm2', status: 'Present', activityKind: 'sunday_mass', date: '2026-01-04' }),
      record({ memberId: 'm2', status: 'Present', activityKind: 'sunday_mass', date: '2026-01-11' }),
      // pending member should be ignored even with logs
      record({ memberId: 'm3', status: 'Present', activityKind: 'sunday_mass', date: '2026-01-04' }),
    ];

    const board = computeAttendanceLeaderboard(records, members);
    expect(board).toHaveLength(2);
    expect(board[0].memberId).toBe('m2');
    expect(board[0].rank).toBe(1);
    expect(board[0].scorePercent).toBe(100);
    expect(board[0].massAttended).toBe(2);
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
    // Both score 1.5/2 = 0.75, both onTime = 1 → alphabetical: Akash before Bella
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
