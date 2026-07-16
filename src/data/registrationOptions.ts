import { BloodGroup, RelationshipStatus } from '../types';

export const BLOOD_GROUPS: BloodGroup[] = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown',
];

export const RELATIONSHIP_STATUSES: RelationshipStatus[] = [
  'Single',
  'Married',
  'Engaged',
  'Widowed',
  'Separated',
  'Divorced',
  'Prefer not to say',
];

/** Special skills & talents for choir registration. */
export const SPECIAL_SKILLS: string[] = [
  'Sight-reading',
  'Harmonizing / harmony singing',
  'Solo singing',
  'Choir leading / conducting',
  'Songwriting / composition',
  'Music theory',
  'Choir mentoring / teaching',
  'Worship leading',
  'Multilingual liturgy (Tamil / English / Latin)',
  'Keyboard accompaniment',
  'Guitar accompaniment',
  'Violin / strings support',
  'Percussion / rhythm support',
  'Sound / PA operation',
  'Recording / AV support',
  'Event coordination',
  'Liturgy planning support',
  'Other',
];

export const EMERGENCY_RELATIONSHIPS: string[] = [
  'Spouse',
  'Father',
  'Mother',
  'Son',
  'Daughter',
  'Brother',
  'Sister',
  'Guardian',
  'Friend',
  'Relative',
  'Colleague',
  'Other',
];
