import { describe, expect, it } from 'vitest';
import type { Mass, Rehearsal } from '../types';
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
      {
        id: 'r2',
        name: 'Cancelled',
        type: 'Regular Practice',
        date: '2026-01-15',
        startTime: '18:00',
        endTime: '20:00',
        venue: 'Hall',
        status: 'Cancelled',
      },
    ];

    const entries = buildLiturgyLogEntries(masses, rehearsals);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.kind).toBe('practice');
    expect(entries[0]?.songNotes).toBe('Ave Maria');
    expect(entries[1]?.kind).toBe('mass');
    expect(entries[1]?.songNotes).toContain('Gloria');
  });
});
