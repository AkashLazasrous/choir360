import type { Tab } from '../../types';

export type WebsitePageMeta = {
  eyebrow: string;
  lede: string;
};

/** Editorial copy for desktop WebsitePageShell per route. */
export const WEBSITE_PAGE_META: Record<Tab, WebsitePageMeta> = {
  landing: {
    eyebrow: 'Overview',
    lede: 'Your parish choir at a glance — liturgy, people, and ministry in one stage.',
  },
  calendar: {
    eyebrow: 'Calendar',
    lede: 'Masses, rehearsals, and parish moments on one cinematic timeline.',
  },
  masses: {
    eyebrow: 'Liturgy',
    lede: 'Plan Masses, track offerings, and keep the liturgical rhythm clear.',
  },
  registration: {
    eyebrow: 'People',
    lede: 'Register singers, approve members, and keep the choir roster living.',
  },
  dashboard_member: {
    eyebrow: 'Ministry',
    lede: 'Your voice, your Digital ID, and the next call to serve.',
  },
  bible: {
    eyebrow: 'Scripture',
    lede: 'Read and prepare with the Word — Tamil and English side by side.',
  },
  song_library: {
    eyebrow: 'Music',
    lede: 'Scores, lyrics, and presentation — the repertoire stage for every Mass.',
  },
  ai_hub: {
    eyebrow: 'AI Tools',
    lede: 'Recommend, optimize, and craft ministry content with focus.',
  },
  analytics: {
    eyebrow: 'Insights',
    lede: 'Attendance, engagement, and health signals for the choir desk.',
  },
  catholic_hub: {
    eyebrow: 'Faith',
    lede: 'Gospel, saints, prayers, and the liturgical year — one knowledge stage.',
  },
  liturgical_planner: {
    eyebrow: 'Planner',
    lede: 'Shape the Mass with AI-assisted liturgical planning.',
  },
  gamification: {
    eyebrow: 'Achievements',
    lede: 'Milestones, streaks, and the joy of showing up.',
  },
  rehearsals: {
    eyebrow: 'Rehearsals',
    lede: 'Schedule practice, set the program, and keep the choir ready.',
  },
  attendance: {
    eyebrow: 'Attendance',
    lede: 'Sessions, leaderboards, and imports — presence made visible.',
  },
  choir_chat: {
    eyebrow: 'Choir chat',
    lede: 'Parish group chat with live sync — messages disappear after 24 hours.',
  },
};
