import { describe, expect, it } from 'vitest';
import {
  collectUnmatchedNames,
  kindFromFilename,
  massKindForIsoDate,
  matchMemberByName,
  parseAttendanceMatrixCsv,
  shouldSplitMassByWeekday,
  stripCsvBom,
} from './parseAttendanceCsv';

const roster = [
  { id: 'm1', firstName: 'Akash', lastName: 'Lazar' },
  { id: 'm2', firstName: 'Sharon', lastName: 'Gabriel' },
  { id: 'm3', firstName: 'Jansi', lastName: 'Joseph' },
  { id: 'm4', firstName: 'Pravin', lastName: 'Antony' },
];

describe('stripCsvBom', () => {
  it('removes UTF-8 BOM', () => {
    expect(stripCsvBom('\uFEFF,,24-01-2026')).toBe(',,24-01-2026');
  });
});

describe('kindFromFilename / shouldSplitMassByWeekday', () => {
  it('maps practise / special / mass filenames', () => {
    expect(kindFromFilename('Practise Session (1 jan - 15 jul).csv')).toBe('practice');
    expect(kindFromFilename('Special Mass (1 jan - 15 jul).csv')).toBe('special_mass');
    expect(kindFromFilename('Mass (1 jan - 15 jul).csv')).toBe('sunday_mass');
  });

  it('splits only mixed Mass sheets by weekday', () => {
    expect(shouldSplitMassByWeekday('Mass (1 jan - 15 jul).csv')).toBe(true);
    expect(shouldSplitMassByWeekday('Special Mass (1 jan - 15 jul).csv')).toBe(false);
    expect(shouldSplitMassByWeekday('Practise Session.csv')).toBe(false);
    expect(shouldSplitMassByWeekday('Saturday Mass.csv')).toBe(false);
  });
});

describe('massKindForIsoDate', () => {
  it('maps Saturday to saturday_mass and Sunday to sunday_mass', () => {
    expect(massKindForIsoDate('2026-01-24')).toBe('saturday_mass');
    expect(massKindForIsoDate('2026-01-25')).toBe('sunday_mass');
    expect(massKindForIsoDate('2026-02-18')).toBe('sunday_mass'); // midweek → sunday_mass bucket
  });
});

describe('parseAttendanceMatrixCsv', () => {
  const sample = [
    ',,24-01-2026,25-01-2026,,Attendances',
    '1,Akash Lazar,A,x,,1',
    '2,Sharon G,L,A,,1',
    '3,,A,A,,',
  ].join('\n');

  it('parses marks and splits Mass dates by weekday', () => {
    const parsed = parseAttendanceMatrixCsv(sample, 'sunday_mass', { splitMassByWeekday: true });
    expect(parsed.dateCount).toBe(2);
    expect(parsed.memberCount).toBe(2);
    expect(parsed.rows).toEqual(
      expect.arrayContaining([
        { memberName: 'Akash Lazar', date: '2026-01-24', status: 'Present', kind: 'saturday_mass' },
        { memberName: 'Akash Lazar', date: '2026-01-25', status: 'Absent', kind: 'sunday_mass' },
        { memberName: 'Sharon G', date: '2026-01-24', status: 'Late', kind: 'saturday_mass' },
        { memberName: 'Sharon G', date: '2026-01-25', status: 'Present', kind: 'sunday_mass' },
      ]),
    );
  });

  it('keeps practice kind for all dates', () => {
    const parsed = parseAttendanceMatrixCsv(sample, 'practice');
    expect(parsed.rows.every((r) => r.kind === 'practice')).toBe(true);
  });

  it('maps symbology: A present, x absent, L late, * excused; blank skipped', () => {
    const csv = ',,01-03-2026\n1,Akash Lazar,A\n2,Pravin Antony,x\n3,Jansi J,L\n4,Sharon G,*\n5,Nobody,\n';
    const parsed = parseAttendanceMatrixCsv(csv, 'special_mass');
    const byName = Object.fromEntries(parsed.rows.map((r) => [r.memberName, r.status]));
    expect(byName['Akash Lazar']).toBe('Present');
    expect(byName['Pravin Antony']).toBe('Absent');
    expect(byName['Jansi J']).toBe('Late');
    expect(byName['Sharon G']).toBe('Excused');
    expect(byName.Nobody).toBeUndefined();
  });
});

describe('matchMemberByName', () => {
  it('matches exact and case-insensitive names', () => {
    expect(matchMemberByName('akash lazar', roster)).toBe('m1');
    expect(matchMemberByName('  Pravin Antony ', roster)).toBe('m4');
  });

  it('matches first/last order swap', () => {
    expect(matchMemberByName('Lazar Akash', roster)).toBe('m1');
  });

  it('matches last-initial forms when unique', () => {
    expect(matchMemberByName('Sharon G', roster)).toBe('m2');
    expect(matchMemberByName('Jansi J', roster)).toBe('m3');
  });

  it('returns null for unknown or ambiguous names', () => {
    expect(matchMemberByName('Unknown Person', roster)).toBeNull();
  });
});

describe('collectUnmatchedNames', () => {
  it('lists unique unmatched names', () => {
    expect(collectUnmatchedNames(['Akash Lazar', 'Ghost', 'ghost', 'Sharon G'], roster)).toEqual(['Ghost']);
  });
});
