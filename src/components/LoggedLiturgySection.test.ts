import { describe, expect, it } from 'vitest';
import type { AttendanceRecord, Mass, Rehearsal } from '../types';
import { buildLiturgyLogEntries } from './LoggedLiturgySection';

describe('buildLiturgyLogEntries', () => {
  it('merges masses and practices sorted by date desc', () => {
    const masses: Mass[] = [
      {
        id: 'm1',
        name: 'Sunday Mass',
        category: 'Sunday Mass',
        date: '2026-01-10',
        time: '07:00',
        language: 'Tamil',
        activityKind: 'sunday_mass',
        notes: 'Entrance\nGloria',
      },
    ];
    const rehearsals: Rehearsal[] = [
      {
        id: 'r1',
        name: 'Friday Practice',
        type: 'Regular Practice',
        date: '2026-01-12',
        startTime: '18:00',
        endTime: '20:00',
        venue: 'Hall',
        songs: ['Ave Maria'],
        status: 'Completed',
      },
    ];

    const entries = buildLiturgyLogEntries(masses, rehearsals);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.kind).toBe('practice');
    expect(entries[0]?.songNotes).toBe('Ave Maria');
    expect(entries[1]?.kind).toBe('mass');
    expect(entries[1]?.songNotes).toContain('Gloria');
  });

  it('keeps attendance-logged sessions even without parent docs', () => {
    const attendance: AttendanceRecord[] = [
      {
        id: 'att-1',
        entityId: 'mass-sunday_mass-2026-02-01',
        entityType: 'Mass',
        activityKind: 'sunday_mass',
        entityName: 'Sunday Mass · 2026-02-01',
        date: '2026-02-01',
        memberId: 'm1',
        memberName: 'Akash',
        status: 'Present',
      },
    ];

    const entries = buildLiturgyLogEntries([], [], attendance);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.id).toBe('mass-sunday_mass-2026-02-01');
    expect(entries[0]?.loggedCount).toBe(1);
  });

  it('hides soft-deleted parents', () => {
    const masses = [
      {
        id: 'gone',
        name: 'Deleted Mass',
        category: 'Sunday Mass',
        date: '2026-01-01',
        time: '07:00',
        language: 'Tamil',
        status: 'deleted',
      },
    ] as unknown as Mass[];

    expect(buildLiturgyLogEntries(masses, [])).toHaveLength(0);
  });
});
