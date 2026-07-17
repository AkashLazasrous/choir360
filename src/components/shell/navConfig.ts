import type { ElementType } from 'react';
import {
  BarChart3,
  BookOpen,
  BookText,
  CalendarDays,
  Church,
  ClipboardList,
  Command,
  HeartHandshake,
  LayoutDashboard,
  Music2,
  Sparkles,
  Star,
  UsersRound,
} from 'lucide-react';
import type { Role, Tab } from '../../types';

export const TAB_REQUIRED_ROLE: Record<Tab, Role> = {
  landing: 'public_user',
  calendar: 'public_user',
  bible: 'public_user',
  song_library: 'public_user',
  registration: 'public_user',
  catholic_hub: 'public_user',
  liturgical_planner: 'choir_member',
  dashboard_member: 'choir_member',
  masses: 'choir_member',
  ai_hub: 'choir_member',
  gamification: 'choir_member',
  analytics: 'choir_admin',
  rehearsals: 'choir_member',
  attendance: 'choir_member',
};

export type NavItem = {
  id: Tab;
  icon: ElementType;
  minRole: Role;
};

/** Full desktop / tablet sidebar order */
export const SIDEBAR_NAV: NavItem[] = [
  { id: 'landing', icon: LayoutDashboard, minRole: 'public_user' },
  { id: 'calendar', icon: CalendarDays, minRole: 'public_user' },
  { id: 'masses', icon: Church, minRole: 'choir_member' },
  { id: 'attendance', icon: ClipboardList, minRole: 'choir_member' },
  { id: 'bible', icon: BookText, minRole: 'public_user' },
  { id: 'song_library', icon: Music2, minRole: 'public_user' },
  { id: 'registration', icon: UsersRound, minRole: 'public_user' },
  { id: 'dashboard_member', icon: HeartHandshake, minRole: 'choir_member' },
  { id: 'catholic_hub', icon: BookOpen, minRole: 'public_user' },
  { id: 'liturgical_planner', icon: Sparkles, minRole: 'choir_member' },
  { id: 'gamification', icon: Star, minRole: 'choir_member' },
  { id: 'ai_hub', icon: Command, minRole: 'choir_member' },
  { id: 'analytics', icon: BarChart3, minRole: 'choir_admin' },
  { id: 'rehearsals', icon: Music2, minRole: 'choir_member' },
];

/** Thumb-zone primary tabs — role-aware sets */
const PRIMARY_MEMBER: Tab[] = ['landing', 'dashboard_member', 'masses', 'song_library'];
const PRIMARY_ADMIN: Tab[] = ['landing', 'masses', 'registration', 'song_library'];
const PRIMARY_PUBLIC: Tab[] = ['landing', 'calendar', 'song_library', 'registration'];

const PRIMARY_ICONS: Partial<Record<Tab, ElementType>> = {
  landing: LayoutDashboard,
  dashboard_member: HeartHandshake,
  masses: Church,
  song_library: Music2,
  registration: UsersRound,
  calendar: CalendarDays,
};

/** Compact labels for the bottom tab bar (full i18n labels stay in sidebar/More) */
export const BOTTOM_NAV_SHORT_LABEL: Partial<Record<Tab, string>> = {
  landing: 'Home',
  dashboard_member: 'Ministry',
  masses: 'Liturgy',
  song_library: 'Music',
  registration: 'People',
  calendar: 'Calendar',
};

export function primaryTabsForRole(canAccess: (role: Role) => boolean): NavItem[] {
  let ids: Tab[];
  if (canAccess('choir_admin')) ids = PRIMARY_ADMIN;
  else if (canAccess('choir_member')) ids = PRIMARY_MEMBER;
  else ids = PRIMARY_PUBLIC;

  return ids
    .filter((id) => canAccess(TAB_REQUIRED_ROLE[id]))
    .map((id) => ({
      id,
      icon: PRIMARY_ICONS[id] ?? LayoutDashboard,
      minRole: TAB_REQUIRED_ROLE[id],
    }));
}

export type MoreSection = {
  title: string;
  items: NavItem[];
};

/** Grouped secondary destinations for the More sheet */
export function moreSectionsForRole(
  canAccess: (role: Role) => boolean,
  primaryIds: Tab[],
): MoreSection[] {
  const primary = new Set(primaryIds);

  const sections: MoreSection[] = [
    {
      title: 'Ministry',
      items: [
        { id: 'attendance', icon: ClipboardList, minRole: 'choir_member' },
        { id: 'rehearsals', icon: Music2, minRole: 'choir_member' },
        { id: 'dashboard_member', icon: HeartHandshake, minRole: 'choir_member' },
        { id: 'gamification', icon: Star, minRole: 'choir_member' },
        { id: 'calendar', icon: CalendarDays, minRole: 'public_user' },
        { id: 'masses', icon: Church, minRole: 'choir_member' },
        { id: 'registration', icon: UsersRound, minRole: 'public_user' },
      ],
    },
    {
      title: 'Library',
      items: [
        { id: 'bible', icon: BookText, minRole: 'public_user' },
        { id: 'catholic_hub', icon: BookOpen, minRole: 'public_user' },
        { id: 'song_library', icon: Music2, minRole: 'public_user' },
      ],
    },
    {
      title: 'Tools',
      items: [
        { id: 'liturgical_planner', icon: Sparkles, minRole: 'choir_member' },
        { id: 'ai_hub', icon: Command, minRole: 'choir_member' },
        { id: 'analytics', icon: BarChart3, minRole: 'choir_admin' },
      ],
    },
  ];

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !primary.has(item.id) && canAccess(item.minRole),
      ),
    }))
    .filter((section) => section.items.length > 0);
}

export function isPrimaryTabActive(activeTab: Tab, primaryIds: Tab[]): boolean {
  return primaryIds.includes(activeTab);
}
