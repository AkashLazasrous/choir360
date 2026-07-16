import type { ActivityKind, AttendanceCategory, MassCategory } from '../types';

/** Mass-bucket kinds (regular liturgy; excludes special mass + practice). */
export const MASS_BUCKET_KINDS: ActivityKind[] = [
  'sunday_mass',
  'saturday_mass',
  'weekday_mass',
  'feast_day',
  'novena',
];

/** All activity kinds accepted by APIs and the log UI. */
export const ALL_ACTIVITY_KINDS: ActivityKind[] = [
  ...MASS_BUCKET_KINDS,
  'special_mass',
  'practice',
];

export const ATTENDANCE_CATEGORY_LABELS: Record<AttendanceCategory, string> = {
  mass: 'Mass',
  special_mass: 'Special Mass',
  practice: 'Practice Session',
};

export const ACTIVITY_KIND_LABELS: Record<ActivityKind, string> = {
  sunday_mass: 'Sunday Mass',
  saturday_mass: 'Saturday Mass',
  weekday_mass: 'Weekday Mass',
  feast_day: 'Feast Day',
  novena: 'Novena',
  practice: 'Practice Session',
  special_mass: 'Special Mass',
};

export const ACTIVITY_KIND_SHORT: Record<ActivityKind, string> = {
  sunday_mass: 'Sun',
  saturday_mass: 'Sat',
  weekday_mass: 'Weekday',
  feast_day: 'Feast',
  novena: 'Novena',
  practice: 'Practice',
  special_mass: 'Special',
};

/** Map a fine-grained activity kind → Mass | Special Mass | Practice Session. */
export function categoryForActivityKind(kind: ActivityKind): AttendanceCategory {
  if (kind === 'practice') return 'practice';
  if (kind === 'special_mass') return 'special_mass';
  return 'mass';
}

export function isMassBucketKind(kind: ActivityKind): boolean {
  return MASS_BUCKET_KINDS.includes(kind);
}

/**
 * Liturgy / payment mass kinds historically bundled with "mass attendance".
 * Includes special_mass (paid rites) but not practice.
 */
export function isLiturgyActivityKind(kind: ActivityKind): boolean {
  return kind !== 'practice';
}

export function kindsForCategory(category: AttendanceCategory): ActivityKind[] {
  if (category === 'practice') return ['practice'];
  if (category === 'special_mass') return ['special_mass'];
  return [...MASS_BUCKET_KINDS];
}

export function kindToMassCategory(kind: ActivityKind): MassCategory {
  switch (kind) {
    case 'special_mass':
      return 'Special Mass';
    case 'saturday_mass':
      return 'Saturday Mass';
    case 'weekday_mass':
      return 'Weekday Mass';
    case 'feast_day':
      return 'Feast Day';
    case 'novena':
      return 'Novena';
    case 'sunday_mass':
    default:
      return 'Sunday Mass';
  }
}

export function defaultTimeForKind(kind: ActivityKind): string {
  switch (kind) {
    case 'saturday_mass':
      return '18:00';
    case 'sunday_mass':
      return '07:00';
    case 'weekday_mass':
      return '06:30';
    case 'practice':
      return '18:00';
    default:
      return '10:00';
  }
}

/**
 * Infer ActivityKind from a legacy attendance record missing activityKind.
 * Prefer entityType / entityName heuristics used across stats + leaderboard.
 */
export function resolveActivityKind(input: {
  activityKind?: ActivityKind | null;
  entityType?: string | null;
  entityName?: string | null;
}): ActivityKind {
  if (input.activityKind) return input.activityKind;
  if (input.entityType === 'Rehearsal') return 'practice';
  const name = (input.entityName ?? '').toLowerCase();
  if (name.includes('practice') || name.includes('rehearsal')) return 'practice';
  if (name.includes('special')) return 'special_mass';
  if (name.includes('novena')) return 'novena';
  if (name.includes('feast')) return 'feast_day';
  if (name.includes('weekday') || name.includes('ferial')) return 'weekday_mass';
  if (name.includes('saturday') || name.includes('sat mass')) return 'saturday_mass';
  if (name.includes('sunday')) return 'sunday_mass';
  return 'sunday_mass';
}
