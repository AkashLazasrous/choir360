import { describe, expect, it } from 'vitest';
import {
  categoryForActivityKind,
  isMassBucketKind,
  isOptInSpecialMassCategory,
  isOptInSpecialMassKind,
  kindsForCategory,
  kindToMassCategory,
  massCategoryToActivityKind,
  resolveActivityKind,
} from './attendanceTaxonomy';

describe('attendance taxonomy', () => {
  it('maps kinds into Mass / Special Mass / Practice buckets', () => {
    expect(categoryForActivityKind('sunday_mass')).toBe('mass');
    expect(categoryForActivityKind('saturday_mass')).toBe('mass');
    expect(categoryForActivityKind('weekday_mass')).toBe('mass');
    expect(categoryForActivityKind('feast_day')).toBe('mass');
    expect(categoryForActivityKind('novena')).toBe('mass');
    expect(categoryForActivityKind('special_mass')).toBe('special_mass');
    expect(categoryForActivityKind('practice')).toBe('practice');
  });

  it('lists mass-bucket kinds and maps to MassCategory', () => {
    expect(kindsForCategory('mass')).toEqual([
      'sunday_mass',
      'saturday_mass',
      'weekday_mass',
      'feast_day',
      'novena',
    ]);
    expect(kindsForCategory('special_mass')).toEqual(['special_mass']);
    expect(kindsForCategory('practice')).toEqual(['practice']);
    expect(isMassBucketKind('feast_day')).toBe(true);
    expect(isMassBucketKind('special_mass')).toBe(false);
    expect(kindToMassCategory('weekday_mass')).toBe('Weekday Mass');
    expect(kindToMassCategory('novena')).toBe('Novena');
  });

  it('resolves legacy records without activityKind', () => {
    expect(resolveActivityKind({ entityType: 'Rehearsal' })).toBe('practice');
    expect(resolveActivityKind({ entityName: 'Special Mass · 2026-01-01' })).toBe('special_mass');
    expect(resolveActivityKind({ entityName: 'Saturday Mass · 2026-01-03' })).toBe('saturday_mass');
    expect(resolveActivityKind({ entityName: 'Weekday Mass · 2026-02-18' })).toBe('weekday_mass');
    expect(resolveActivityKind({ entityName: 'Feast Day · 2026-08-15' })).toBe('feast_day');
    expect(resolveActivityKind({ entityName: 'Novena · 2026-05-01' })).toBe('novena');
    expect(resolveActivityKind({ entityName: 'Sunday Mass · 2026-01-04' })).toBe('sunday_mass');
  });

  it('treats special rites as opt-in attendance (unmarked ≠ Absent)', () => {
    expect(isOptInSpecialMassKind('special_mass')).toBe(true);
    expect(isOptInSpecialMassKind('sunday_mass')).toBe(false);
    expect(isOptInSpecialMassKind('practice')).toBe(false);

    for (const category of [
      'Special Mass',
      'Wedding',
      'Death Mass',
      'Death Anniversary Mass',
      'First Holy Communion',
      'Confirmation',
      'Ordination',
    ] as const) {
      expect(massCategoryToActivityKind(category)).toBe('special_mass');
      expect(isOptInSpecialMassCategory(category)).toBe(true);
    }
    expect(isOptInSpecialMassCategory('Sunday Mass')).toBe(false);
    expect(isOptInSpecialMassCategory('Saturday Mass')).toBe(false);
  });
});
