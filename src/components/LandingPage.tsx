import React, { useMemo } from 'react';
import { RadioPlayer } from './RadioPlayer';
import {
  Announcement,
  AttendanceRecord,
  ChoirEvent,
  Language,
  Mass,
  Member,
  Payment,
  Rehearsal,
  ShareCalculation,
  Tab,
} from '../types';
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Clock3,
  MapPin,
  Music2,
  Sparkles,
  TrendingUp,
  UserCheck,
  UsersRound,
} from 'lucide-react';
import { formatINR } from '../utils/currency';
import { getISTGreeting } from '../utils/timezone';
import { calculateChoirHealth, isActiveMember, sumPendingCollections } from '../utils/choirStats';
import { computeMemberRosterStats } from '../utils/attendanceStats';
import { useParish } from '../features/parish/ParishContext';
import { Reveal } from './interactions/Reveal';
import { CountUp } from './interactions/CountUp';
import { AppleButton } from './interactions/AppleButton';
import { MobileHomeDashboard } from './mobileDashboard';
import {
  LoggedLiturgySection,
  type LiturgyLogClear,
  type LiturgyLogRemove,
  type LiturgySongNotesSave,
} from './LoggedLiturgySection';

interface LandingPageProps {
  currentLang: Language;
  onNavigate: (section: Tab) => void;
  members: Member[];
  masses: Mass[];
  rehearsals?: Rehearsal[];
  payments: Payment[];
  paymentShares?: ShareCalculation[];
  events: ChoirEvent[];
  announcements: Announcement[];
  attendanceRecords?: AttendanceRecord[];
  loading?: boolean;
  isAdmin?: boolean;
  /** Logged-in member — when set (non-admin), Overview shows personal attendance % and share ₹ */
  viewerMember?: Member | null;
  onSaveLiturgySongNotes?: (payload: LiturgySongNotesSave) => Promise<{ ok: boolean; error?: string }>;
  onRemoveLiturgyLog?: (payload: LiturgyLogRemove) => Promise<{ ok: boolean; error?: string }>;
  onClearLiturgyLog?: (payload: LiturgyLogClear) => Promise<{ ok: boolean; error?: string }>;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  members,
  masses,
  rehearsals = [],
  payments,
  paymentShares = [],
  events,
  announcements,
  attendanceRecords = [],
  loading = false,
  isAdmin = false,
  viewerMember = null,
  onSaveLiturgySongNotes,
  onRemoveLiturgyLog,
  onClearLiturgyLog,
}) => {
  const { selectedParish } = useParish();
  const parishName  = selectedParish?.parishName ?? 'your parish';
  const parishPlace = selectedParish?.place ?? '';

  const greeting = useMemo(() => getISTGreeting(), []);

  const activeMembers      = members.filter(isActiveMember);
  const pendingMembers     = members.filter((m) => !isActiveMember(m));
  const nextMass           = masses[0];
  const nextPractice       = events.find((e) => e.category === 'Choir Practice') ?? events[0];
  const pendingCollections = sumPendingCollections(payments);
  const { averageAttendance, healthLabel, confirmedPercent } = calculateChoirHealth(members);

  const personalStats = useMemo(() => {
    if (!viewerMember || isAdmin) return null;
    return computeMemberRosterStats(attendanceRecords, members, masses, payments, paymentShares)
      .find((s) => s.memberId === viewerMember.id) ?? null;
  }, [viewerMember, isAdmin, attendanceRecords, members, masses, payments, paymentShares]);

  const today      = new Date();
  const todayLabel = today.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="font-apple space-y-4 animate-fade-in sm:space-y-5">

      {/* Award mobile Home — all 10 patterns; desktop keeps legacy layout */}
      <MobileHomeDashboard
        variant={isAdmin || !viewerMember ? 'admin' : 'member'}
        members={members}
        masses={masses}
        rehearsals={rehearsals}
        payments={payments}
        paymentShares={paymentShares}
        events={events}
        announcements={announcements}
        attendanceRecords={attendanceRecords}
        member={!isAdmin ? viewerMember : null}
        loading={loading}
        isAdmin={isAdmin}
        onSaveLiturgySongNotes={onSaveLiturgySongNotes}
        onRemoveLiturgyLog={onRemoveLiturgyLog}
        onClearLiturgyLog={onClearLiturgyLog}
        onNavigate={onNavigate}
      />

      <div className="website-desk hidden space-y-8 lg:block">
      {/* Editorial website hero */}
      <section className="website-desk-hero" data-reveal>
        <div className="choir-hero-ambient opacity-40" aria-hidden />
        <div className="relative grid gap-12 lg:grid-cols-[1.45fr_0.85fr]">
          <div>
            <p className="website-desk-kicker">{todayLabel}</p>
            <p className="mt-4 text-[15px] font-semibold tracking-wide text-amber-300">{greeting}</p>
            <h1 className="website-desk-title max-w-xl">
              {nextMass
                ? <>Ministry ready.<br /><span className="text-amber-300">Voices aligned.</span></>
                : <>Welcome to<br /><span className="text-amber-300">Choir360.</span></>
              }
            </h1>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-white/50">
              {members.length === 0
                ? 'Your parish choir desk. Register members and log your first mass.'
                : `${confirmedPercent}% active · ${pendingMembers.length > 0 ? `${pendingMembers.length} pending` : 'All approved'} · ${masses.length} mass${masses.length !== 1 ? 'es' : ''}`
              }
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <AppleButton variant="gold" magnetic onClick={() => onNavigate('masses')}>
                {nextMass ? 'Open Liturgy Desk' : 'Log First Mass'}
                <ArrowUpRight className="h-4 w-4" />
              </AppleButton>
              <AppleButton variant="onDark" onClick={() => onNavigate('registration')}>
                Manage Members
              </AppleButton>
            </div>
          </div>

          <div className="border border-white/10 bg-black/40 p-7 backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">Next liturgy</p>
            {nextMass ? (
              <div className="mt-4 space-y-3">
                <h3 className="text-[26px] font-semibold tracking-[-0.03em] text-white">{nextMass.name}</h3>
                <p className="flex items-center gap-2 text-[14px] text-white/55">
                  <CalendarDays className="h-4 w-4 text-amber-300" />
                  {new Date(nextMass.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' })}
                </p>
                <p className="flex items-center gap-2 text-[14px] text-white/55">
                  <Clock3 className="h-4 w-4 text-amber-300" />
                  {nextMass.time}
                </p>
                <p className="flex items-center gap-2 text-[14px] text-white/55">
                  <MapPin className="h-4 w-4 text-amber-300" />
                  {parishName}{parishPlace ? `, ${parishPlace}` : ''}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-[15px] text-white/45">No mass scheduled yet</p>
            )}
            <div className="mt-7">
              <RadioPlayer />
            </div>
          </div>
        </div>
      </section>

      {/* Selected ministries — Unseen-style project grid */}
      <section data-reveal>
        <p className="website-desk-kicker">Selected ministries</p>
        <h2 className="mt-2 text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-[-0.035em] text-white">
          Jump into the work
        </h2>
        <div className="website-desk-grid mt-6">
          {[
            { label: 'Liturgy', sub: nextMass ? nextMass.name : 'Log masses & shares', tab: 'masses' as Tab, icon: BookOpen },
            { label: 'People', sub: `${activeMembers.length} active`, tab: 'registration' as Tab, icon: UsersRound },
            {
              label: 'Attendance',
              sub: personalStats
                ? `${personalStats.finalPercent}% yours`
                : `${averageAttendance}% avg`,
              tab: 'attendance' as Tab,
              icon: UserCheck,
            },
            { label: 'Music', sub: 'Songbook & lyrics', tab: 'song_library' as Tab, icon: Music2 },
            { label: 'Calendar', sub: nextPractice?.name ?? 'Rehearsals & events', tab: 'calendar' as Tab, icon: CalendarDays },
            { label: 'Insights', sub: `Health ${healthLabel}`, tab: 'analytics' as Tab, icon: TrendingUp },
          ].map(({ label, sub, tab, icon: Icon }) => (
            <button key={label} type="button" className="website-desk-card" onClick={() => onNavigate(tab)}>
              <Icon className="h-5 w-5 text-amber-300" />
              <h3>{label}</h3>
              <p>{sub}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Insights strip — personal for members, parish-wide for admins */}
      <section className="website-desk-stats" data-reveal>
        {(personalStats
          ? [
              { label: 'Your attendance', value: `${personalStats.finalPercent}%` },
              { label: 'Your share', value: formatINR(personalStats.totalShareINR) },
              {
                label: 'Sessions',
                value: `${personalStats.finalAttended}/${personalStats.logged}`,
              },
              { label: 'Active choir', value: activeMembers.length },
            ]
          : [
              { label: 'Active', value: activeMembers.length },
              { label: 'Attendance', value: `${averageAttendance}%` },
              { label: 'Pending ₹', value: formatINR(pendingCollections) },
              { label: 'Health', value: healthLabel },
            ]
        ).map((stat) => (
          <article key={stat.label} className="website-desk-stat">
            <p className="website-desk-stat-val">
              {typeof stat.value === 'number' ? <CountUp value={stat.value} /> : stat.value}
            </p>
            <p className="website-desk-stat-label">{stat.label}</p>
          </article>
        ))}
      </section>

      {/* Liturgy + practice log with admin song notes */}
      <Reveal>
        <section className="grid gap-4 xl:grid-cols-[1.4fr_0.85fr]">
          <LoggedLiturgySection
            variant="desk"
            masses={masses}
            rehearsals={rehearsals}
            attendanceRecords={attendanceRecords}
            isAdmin={isAdmin}
            onNavigate={onNavigate}
            onSaveSongNotes={onSaveLiturgySongNotes}
            onRemoveLog={onRemoveLiturgyLog}
            onClearLog={onClearLiturgyLog}
          />

          <article className="apple-hero relative overflow-hidden p-6">
            <div className="choir-hero-ambient" aria-hidden />
            <div className="relative">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-amber-300/20">
                <Sparkles className="h-4 w-4 text-amber-300" />
              </div>
              <h3 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] text-[#f5f5f7]">
                {activeMembers.length === 0
                  ? <>Begin your<br /><span className="text-amber-300">choir journey.</span></>
                  : <>Your choir<br /><span className="text-amber-300">is thriving.</span></>
                }
              </h3>
              <p className="mt-3 text-[15px] text-[#a1a1a6]">
                {activeMembers.length === 0
                  ? 'Add your first choir member to begin ministry.'
                  : `${activeMembers.length} active at ${parishName}.`}
              </p>
            </div>
          </article>
        </section>
      </Reveal>
      </div>
    </div>
  );
};
