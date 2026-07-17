import type {
  Announcement,
  AttendanceRecord,
  ChoirEvent,
  Mass,
  Member,
  Payment,
  Tab,
} from '../../types';

export type TimeRange = 'D' | 'W' | 'M' | 'Y';

export type DashboardVariant = 'admin' | 'member';

export type BentoWidgetKey =
  | 'streak'
  | 'next_liturgy'
  | 'active_members'
  | 'pending_collection'
  | 'choir_health'
  | 'quick_links';

export type BentoSpan = '1x1' | '2x1' | '2x2';

export interface BentoWidgetDef {
  key: BentoWidgetKey;
  span: BentoSpan;
  title: string;
}

export interface MetricCard {
  id: string;
  label: string;
  value: string;
  sub: string;
  accent: 'teal' | 'gold' | 'mint' | 'rose';
  progress?: number;
}

export interface ChartPoint {
  label: string;
  value: number;
  date?: string;
}

export interface ContextualAlert {
  id: string;
  title: string;
  body: string;
  tab: Tab;
  tone: 'gold' | 'teal' | 'warn';
}

export interface MobileDashboardData {
  variant: DashboardVariant;
  members: Member[];
  masses: Mass[];
  payments: Payment[];
  events: ChoirEvent[];
  announcements?: Announcement[];
  attendanceRecords?: AttendanceRecord[];
  /** Signed-in member (member variant) */
  member?: Member | null;
  loading?: boolean;
  onNavigate: (tab: Tab) => void;
}

export const ADMIN_BENTO_DEFAULT: BentoWidgetKey[] = [
  'next_liturgy',
  'active_members',
  'pending_collection',
  'choir_health',
  'streak',
  'quick_links',
];

export const MEMBER_BENTO_DEFAULT: BentoWidgetKey[] = [
  'streak',
  'next_liturgy',
  'choir_health',
  'active_members',
  'pending_collection',
  'quick_links',
];

export const BENTO_SPANS: Record<BentoWidgetKey, BentoSpan> = {
  streak: '1x1',
  next_liturgy: '2x1',
  active_members: '1x1',
  pending_collection: '1x1',
  choir_health: '2x1',
  quick_links: '2x1',
};
