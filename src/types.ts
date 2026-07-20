export type Role =
  | 'super_admin'
  | 'diocese_admin'
  | 'parish_admin'
  | 'choir_admin'
  | 'choir_member'
  | 'public_user';

export type Language = 'en' | 'ta' | 'ml' | 'te' | 'hi';

/** App navigation tabs. Keep in sync with the nav config in App.tsx. */
export type Tab =
  | 'landing'
  | 'calendar'
  | 'masses'
  | 'registration'
  | 'dashboard_member'
  | 'bible'
  | 'song_library'
  | 'ai_hub'
  | 'analytics'
  | 'catholic_hub'
  | 'liturgical_planner'
  | 'gamification'
  | 'rehearsals'
  | 'attendance'
  | 'choir_chat';

export type RecordStatus = string;

export interface TenantScopedRecord {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  status: RecordStatus;
  archdioceseId: string;
  parishName: string;
  tenantId: string;
  parishId: string;
  choirId: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface CloudinaryMediaRecord extends TenantScopedRecord {
  id: string;
  publicId: string;
  secureUrl: string;
  thumbnailUrl: string;
  optimizedUrl: string;
  uploadedAt: string;
  uploadedByUserId: string;
  moduleName:
    | 'members'
    | 'events'
    | 'feasts'
    | 'choir-gallery'
    | 'songs'
    | 'announcements'
    | 'parishes'
    | 'dioceses'
    | 'ai-posters'
    | 'qr-codes'
    | 'documents';
  relatedRecordId: string;
  bytes?: number;
  format?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  width?: number;
  height?: number;
  originalFileName?: string;
  mimeType?: string;
  sizeBytes?: number;
}

export type SyncedRecord<T> = T & TenantScopedRecord;

export type VoiceType = 'Soprano' | 'Alto' | 'Tenor' | 'Bass' | 'None';

export type MemberType =
  | 'Singer'
  | 'Keyboard'
  | 'Guitar'
  | 'Violin'
  | 'Flute'
  | 'Tabla'
  | 'Pad'
  | 'Drums'
  | 'Harmonium'
  | 'Veena'
  | 'Mridangam'
  | 'Other';

export type MemberStatus =
  | 'Pending'
  | 'Correction Requested'
  | 'Approved'
  | 'Active Member'
  | 'Inactive'
  | 'Rejected'
  | 'Admin';

export type BloodGroup =
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'AB+'
  | 'AB-'
  | 'O+'
  | 'O-'
  | 'Unknown';

export type RelationshipStatus =
  | 'Single'
  | 'Married'
  | 'Engaged'
  | 'Widowed'
  | 'Separated'
  | 'Divorced'
  | 'Prefer not to say';

export interface Member {
  id: string;
  photoUrl: string;
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  mobile: string;
  /** Digits-only mobile for login lookup (privateMembers). */
  mobileNormalized?: string;
  whatsapp: string;
  email: string;
  address: string;
  parish: string;
  choirName: string;
  voiceType: VoiceType;
  memberType: MemberType;
  /** Instrument played (if instrumentalist). Same as memberType for non-singers. */
  instrument?: string;
  skills: string;
  experience: number;
  /** Marital / relationship status (public roster field). */
  relationshipStatus?: RelationshipStatus | string;
  /** Medical blood group (stored on privateMembers). */
  bloodGroup?: BloodGroup | string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  status: MemberStatus;
  joiningDate: string;
  correctionNote?: string;
  attendanceRate?: number;
  /** Weight for share calculation: singers = 1, instrumentalists = 2 */
  shareWeight?: 1 | 2;
}

// =============================================================================
// Mass & Liturgy
// =============================================================================

export type MassCategory =
  | 'Sunday Mass'
  | 'Saturday Mass'
  | 'Weekday Mass'
  | 'Special Mass'
  | 'Wedding'
  /** @deprecated Removed from liturgy dropdowns; retained for legacy docs. */
  | 'Funeral'
  | 'Death Mass'
  | 'Death Anniversary Mass'
  | 'Feast Day'
  | 'Ordination'
  | 'First Holy Communion'
  | 'Confirmation'
  | 'Novena';

/** Categories that require payment tracking (Funeral removed from new entries). */
export const PAYMENT_MASS_CATEGORIES: MassCategory[] = [
  'Special Mass',
  'Wedding',
  'Death Mass',
  'Death Anniversary Mass',
  'Feast Day',
  'Ordination',
  'First Holy Communion',
  'Confirmation',
];

/** Free vs paid billing for special-mass attendance sessions. */
export type SpecialMassBilling = 'free' | 'paid';

export interface SpecialMassPaymentDetails {
  amount?: number;
  /** @deprecated Prefer receivedBy / partyName — legacy payer free-text */
  whoPaid?: string;
  /** Choir member who collected the payment */
  receivedByMemberId?: string;
  /** Display name of the member who collected the payment */
  receivedBy?: string;
  notes?: string;
  dateReceived?: string;
  paymentMode?: string;
}

export function isPaymentMassCategory(cat: MassCategory): boolean {
  return PAYMENT_MASS_CATEGORIES.includes(cat);
}

/** Non-roster guest on a paid rite — fixed ₹ amount; remaining pool splits among members. */
export type MassGuestRole = 'Singer' | 'Musician';

export interface MassGuest {
  id: string;
  name: string;
  role: MassGuestRole;
  /** Fixed amount paid to this guest (₹); deducted before member share split */
  amount: number;
}

export interface Mass {
  id: string;
  name: string;
  category: MassCategory;
  date: string;
  time: string;
  language: string;
  celebrant?: string;
  venue?: string;
  notes?: string;
  /** Choir members who attended this Mass */
  attendingMemberIds?: string[];
  /** Ad-hoc guests included in paid-mass share splits */
  guestAttendees?: MassGuest[];
  /** Links attendance logs to Sunday vs Special Mass sheets */
  activityKind?: ActivityKind;
  /** Sunday Mass only — 1st Mass or 2nd Mass */
  sundayMassSlot?: SundayMassSlot;
  /** Special mass only: free choir service vs paid rite */
  specialMassBilling?: SpecialMassBilling;
  /** Populated when specialMassBilling === 'paid' */
  specialMassPayment?: SpecialMassPaymentDetails;
  /**
   * When true, hide from Overview “Logged masses & practices”.
   * Attendance / storage records stay intact (unlike soft-delete Remove).
   */
  hiddenFromLiturgyLog?: boolean;
}

export interface Payment {
  id: string;
  massId?: string;
  partyName: string;
  mobile: string;
  massType: string;
  massDate: string;
  massTime: string;
  /** Amount proposed / promised (₹) */
  promisedAmount: number;
  /** Amount actually received (₹) */
  receivedAmount: number;
  /** Remaining balance (₹) */
  pendingAmount: number;
  /** Date payment was received (ISO string) */
  dateReceived?: string;
  /** @deprecated Prefer receivedBy — legacy payer free-text */
  whoPaid?: string;
  /** Choir member id who collected the payment */
  receivedByMemberId?: string;
  /** Display name of the member who collected the payment */
  receivedBy?: string;
  /** Cash / UPI / Cheque / NEFT */
  paymentMode?: string;
  receiptNo?: string;
  remarks?: string;
  status: 'Pending' | 'Received' | 'Partial';
  /** Sponsor name (e.g. for feast days) */
  sponsor?: string;
}

export interface ShareCalculation {
  id: string;
  paymentId: string;
  massName: string;
  date: string;
  totalAmount: number;
  singersCount: number;
  instrumentalistsCount: number;
  /** singers*1 + instrumentalists*2 */
  totalUnits: number;
  /** totalAmount / totalUnits */
  unitValue: number;
  /** unitValue * 1 */
  singerShare: number;
  /** unitValue * 2 */
  instrumentalistShare: number;
  isLocked: boolean;
  /** Sum of fixed guest payouts deducted before member split */
  guestTotalAmount?: number;
  /** Pool split among roster members after guest payouts */
  memberPoolAmount?: number;
  participatingMembers: {
    memberId: string;
    name: string;
    type: MemberType | MassGuestRole;
    /** 1 / 2 for members; 0 for fixed guest payouts */
    weight: 0 | 1 | 2;
    share: number;
    /** True when participant is a non-roster guest (fixed amount) */
    isGuest?: boolean;
  }[];
}

// =============================================================================
// Attendance
// =============================================================================

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

/**
 * Choir activity kinds for attendance logging.
 * Mass bucket: sunday / saturday / weekday / feast_day / novena
 * Separate buckets: special_mass, practice
 */
export type ActivityKind =
  | 'sunday_mass'
  | 'saturday_mass'
  | 'weekday_mass'
  | 'feast_day'
  | 'novena'
  | 'practice'
  | 'special_mass';

/** Sunday Mass only: 1st and 2nd Mass on the same date. */
export type SundayMassSlot = '1st' | '2nd';

/** Top-level attendance taxonomy used by leaderboard columns + filters. */
export type AttendanceCategory = 'mass' | 'special_mass' | 'practice';

export interface AttendanceRecord {
  id: string;
  entityId: string;
  entityType: 'Mass' | 'Rehearsal' | 'Event';
  /** Activity subtype for stats rules (Excused counts differently on practice). */
  activityKind?: ActivityKind;
  /** Sunday Mass only — which liturgy of the day. */
  sundayMassSlot?: SundayMassSlot;
  entityName: string;
  date: string;
  memberId: string;
  memberName: string;
  status: AttendanceStatus;
  notes?: string;
}

// =============================================================================
// Rehearsals
// =============================================================================

export type RehearsalType =
  | 'Regular Practice'
  | 'Pre-Sunday Practice'
  | 'Feast Preparation'
  | 'New Song Workshop'
  | 'Special Preparation'
  | 'Sectional Practice';

export interface Rehearsal {
  id: string;
  name: string;
  type: RehearsalType;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  conductor?: string;
  songs?: string[];
  notes?: string;
  attendingMemberIds?: string[];
  /** Practice sessions from the attendance spreadsheet */
  activityKind?: ActivityKind;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  /**
   * When true, hide from Overview liturgy log without deleting the practice
   * or its attendance marks.
   */
  hiddenFromLiturgyLog?: boolean;
}

// =============================================================================
// Events
// =============================================================================

export type EventCategory =
  | 'Choir Practice'
  | 'Feast'
  | 'Retreat'
  | 'Pilgrimage'
  | 'Tour'
  | 'Concert'
  | 'Parish Event'
  | 'Diocese Event'
  | 'Competition';

export interface ChoirEvent {
  id: string;
  name: string;
  category: EventCategory;
  date: string;
  time: string;
  location: string;
  description: string;
  bannerUrl: string;
  rsvps: {
    [memberId: string]: 'Going' | 'Not Going' | 'Maybe';
  };
}

// =============================================================================
// Songs
// =============================================================================

export interface Song {
  id: string;
  title: string;
  displayTitle?: string;
  lyricsTitle?: string;
  language: 'English' | 'Tamil' | 'Malayalam' | 'Telugu' | 'Hindi';
  album?: string;
  composer?: string;
  singer?: string;
  category:
    | 'Roman Catholic Songs'
    | 'Praise & Worship'
    | 'Devotional Songs'
    | 'Retreat Songs'
    | 'Choir Competition Songs'
    | 'Non-Catholic Christian Songs'
    | 'Unknown'
    | 'Jebathotta Jeyageethangal';
  source?: string;
  lyrics: string;
  lyricsEnglishPattern?: string;
  chordSheet?: string;
  pdfUrl?: string;
  sourcePdfUrl?: string;
  sourcePageNumber?: number;
  pageNumber?: number;
  sourceUrl?: string;
  sourceSearchText?: string;
  audioUrl?: string;
  videoUrl?: string;
}

// =============================================================================
// Bible & Readings
// =============================================================================

export type BibleLanguage = 'ta' | 'en';

export interface BibleDocument {
  id: BibleLanguage;
  label: string;
  tabLabel: string;
  title: string;
  subtitle: string;
  pdfUrl?: string;
  isAvailable: boolean;
  unavailableMessage?: string;
  chapterIndex?: {
    id: string;
    testament: string;
    book: string;
    printedPage: number;
    pdfPage: number;
  }[];
}

export interface DailyReadingSection {
  heading: string;
  reference?: string;
  text: string;
}

export interface DailyReading {
  id: string;
  date: string;
  language: BibleLanguage;
  title: string;
  liturgicalDay: string;
  firstReading?: DailyReadingSection;
  psalm?: DailyReadingSection;
  secondReading?: DailyReadingSection;
  gospelAcclamation?: DailyReadingSection;
  gospel?: DailyReadingSection;
  reflection?: DailyReadingSection;
  feast?: string;
  saint?: string;
  liturgicalColor?: string;
  sourceUrl: string;
  publicDisplay: boolean;
  lastSyncedAt?: string;
  syncStatus: 'synced' | 'cached' | 'failed' | 'pending';
  syncMessage?: string;
}

// =============================================================================
// Announcements & Notifications
// =============================================================================

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  publishedBy: string;
  category: 'News' | 'Circular' | 'Choir Notice' | 'Feast Update' | 'Finance' | 'Rehearsal';
}

/** Parish choir group chat — ephemeral (hard-deleted after expiresAtMs). */
export interface ChoirChatMessage extends TenantScopedRecord {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderPhotoUrl: string;
  /** Unix ms — message is purged everywhere after this time (24h from send). */
  expiresAtMs: number;
}

export interface SaintOfDay {
  name: string;
  feastDate: string;
  description: string;
  imageUrl: string;
  patronOf: string;
}
