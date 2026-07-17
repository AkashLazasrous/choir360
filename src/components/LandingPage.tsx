import React, { useMemo } from 'react';
import { RadioPlayer } from './RadioPlayer';
import { Announcement, AttendanceRecord, ChoirEvent, Language, Mass, Member, Payment, Tab } from '../types';
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChevronRight,
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
import { useParish } from '../features/parish/ParishContext';
import { Reveal } from './interactions/Reveal';
import { CountUp } from './interactions/CountUp';
import { AppleButton } from './interactions/AppleButton';
import { MobileHomeDashboard } from './mobileDashboard';

interface LandingPageProps {
  currentLang: Language;
  onNavigate: (section: Tab) => void;
  members: Member[];
  masses: Mass[];
  payments: Payment[];
  events: ChoirEvent[];
  announcements: Announcement[];
  attendanceRecords?: AttendanceRecord[];
  loading?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  members,
  masses,
  payments,
  events,
  announcements,
  attendanceRecords = [],
  loading = false,
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

  const today      = new Date();
  const todayLabel = today.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="font-apple space-y-4 animate-fade-in sm:space-y-5">

      {/* Award mobile Home — all 10 patterns; desktop keeps legacy layout */}
      <MobileHomeDashboard
        variant="admin"
        members={members}
        masses={masses}
        payments={payments}
        events={events}
        announcements={announcements}
        attendanceRecords={attendanceRecords}
        loading={loading}
        onNavigate={onNavigate}
      />

      <div className="website-desk hidden space-y-8 lg:block">
      {/* Editorial website hero */}
      <section className="website-desk-hero">
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
      <section>
        <p className="website-desk-kicker">Selected ministries</p>
        <h2 className="mt-2 text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-[-0.035em] text-[#0f172a]">
          Jump into the work
        </h2>
        <div className="website-desk-grid mt-6">
          {[
            { label: 'Liturgy', sub: nextMass ? nextMass.name : 'Log masses & shares', tab: 'masses' as Tab, icon: BookOpen },
            { label: 'People', sub: `${activeMembers.length} active`, tab: 'registration' as Tab, icon: UsersRound },
            { label: 'Attendance', sub: `${averageAttendance}% avg`, tab: 'attendance' as Tab, icon: UserCheck },
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

      {/* Insights strip */}
      <section className="website-desk-stats">
        {[
          { label: 'Active', value: activeMembers.length },
          { label: 'Attendance', value: `${averageAttendance}%` },
          { label: 'Pending ₹', value: formatINR(pendingCollections) },
          { label: 'Health', value: healthLabel },
        ].map((stat) => (
          <article key={stat.label} className="website-desk-stat">
            <p className="website-desk-stat-val">
              {typeof stat.value === 'number' ? <CountUp value={stat.value} /> : stat.value}
            </p>
            <p className="website-desk-stat-label">{stat.label}</p>
          </article>
        ))}
      </section>

      {/* Keep liturgy list for ops continuity */}
      <Reveal>
        <section className="grid gap-4 xl:grid-cols-[1.4fr_0.85fr]">
          <article className="apple-card p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <p className="apple-caption">Parish liturgy log</p>
                <h3 className="apple-title mt-0.5">Logged masses</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('masses')}
                className="btn-pill btn-pill-secondary !min-h-[44px] !text-[13px]"
              >
                Manage <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {masses.length === 0 ? (
              <button
                type="button"
                onClick={() => onNavigate('masses')}
                className="apple-empty w-full rounded-2xl border border-dashed border-black/10 bg-[#f5f5f7]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0e3d4c]">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3>No masses logged yet</h3>
                <p>Open Masses & Accounts to add your first liturgy.</p>
              </button>
            ) : (
              <div className="apple-grouped">
                {masses.slice(0, 5).map((mass, i) => {
                  const isSpecial = ['Special Mass', 'Death Mass', 'Death Anniversary Mass'].includes(mass.category);
                  return (
                    <button
                      key={mass.id}
                      type="button"
                      onClick={() => onNavigate('masses')}
                      className="apple-list-row w-full text-left"
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        i === 0 ? 'bg-[#0e3d4c] text-amber-300' : isSpecial ? 'bg-[rgba(245,194,76,0.22)] text-[#8a6a10]' : 'bg-black/[0.06] text-[#86868b]'
                      }`}>
                        <BookOpen className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[15px] font-medium text-[#1d1d1f]">{mass.name}</p>
                          {i === 0 && <span className="apple-badge-forest">Next</span>}
                        </div>
                        <p className="mt-0.5 text-[12px] text-[#86868b]">
                          {mass.category} · {mass.date} · {mass.time}
                        </p>
                      </div>
                      <span className="shrink-0 text-[12px] text-[#86868b]">{mass.language}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[#c7c7cc]" />
                    </button>
                  );
                })}
              </div>
            )}
          </article>

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
