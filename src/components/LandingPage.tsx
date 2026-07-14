import React, { useMemo } from 'react';
import { RadioPlayer } from './RadioPlayer';
import { Announcement, ChoirEvent, Language, Mass, Member, Payment, Tab } from '../types';
import {
  ArrowUpRight,
  BookOpen,
  BookOpenText,
  CalendarDays,
  ChevronRight,
  Clock3,
  Cross,
  IndianRupee,
  MapPin,
  Mic2,
  Music2,
  Sparkles,
  Star,
  TrendingUp,
  UserCheck,
  UsersRound,
  Zap,
} from 'lucide-react';
import { formatINR } from '../utils/currency';
import { getISTGreeting } from '../utils/timezone';
import { calculateChoirHealth, isActiveMember, sumPendingCollections } from '../utils/choirStats';
import { useParish } from '../features/parish/ParishContext';
import { Reveal } from './interactions/Reveal';
import { CountUp } from './interactions/CountUp';
import { MagneticButton } from './interactions/MagneticButton';

interface LandingPageProps {
  currentLang: Language;
  onNavigate: (section: Tab) => void;
  members: Member[];
  masses: Mass[];
  payments: Payment[];
  events: ChoirEvent[];
  announcements: Announcement[];
}

// Decorative cross/note motif SVG
const MusicalCross: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 60 60" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="30" r="29" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 4" opacity="0.3" />
    <path d="M30 10 V50 M16 24 H44" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    <circle cx="30" cy="30" r="3" fill="currentColor" opacity="0.3" />
  </svg>
);

const NoteIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M9 18V5l12-2v13" opacity="0.6" />
    <circle cx="6" cy="18" r="3" opacity="0.6" />
    <circle cx="18" cy="16" r="3" opacity="0.6" />
  </svg>
);

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  members,
  masses,
  payments,
  events,
  announcements,
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
  const openPaymentCount   = payments.filter((p) => p.status === 'Pending').length;
  const { averageAttendance, healthScore, healthLabel, confirmedPercent } = calculateChoirHealth(members);

  const today      = new Date();
  const todayLabel = today.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[32px] bg-[#18392f] text-white shadow-[0_32px_96px_rgba(18,52,43,0.22)]">

        {/* Decorative background layer */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-16 -top-16 h-80 w-80 rounded-full bg-emerald-700/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-amber-400/10 blur-2xl" />
          <MusicalCross className="absolute right-8 top-6 h-32 w-32 text-amber-300" />
          <MusicalCross className="absolute right-28 bottom-4 h-20 w-20 text-emerald-400" />
          <NoteIcon className="absolute left-6 bottom-8 h-10 w-10 text-amber-300/30" />
          <NoteIcon className="absolute left-20 top-10 h-6 w-6 text-white/10" />
          {/* Diagonal stripe accent */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'repeating-linear-gradient(-45deg, white 0, white 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }} />
        </div>

        <div className="relative grid lg:grid-cols-[1.5fr_0.75fr]">
          {/* Left — headline */}
          <div className="p-8 sm:p-10">
            {/* Date pill */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">{todayLabel} · Madras-Mylapore</span>
            </div>

            <p className="text-base font-medium text-emerald-200/90">
              {greeting}, <span className="font-bold text-white">{parishName}</span>
            </p>

            <h1 className="mt-3 max-w-xl font-serif text-4xl font-bold leading-[1.15] sm:text-5xl lg:text-[3.25rem]">
              {nextMass
                ? <>Ministry ready.<br /><span className="text-amber-300">Voices aligned.</span></>
                : <>Welcome to<br /><span className="text-amber-300">CHOIR360 X.</span></>
              }
            </h1>

            <p className="mt-4 max-w-lg text-[15px] leading-7 text-emerald-100/75">
              {members.length === 0
                ? 'Your parish choir management platform. Start by registering members and logging your first mass.'
                : `${confirmedPercent}% of choir active · ${pendingMembers.length > 0 ? `${pendingMembers.length} pending review` : 'All members approved'} · ${masses.length} mass${masses.length !== 1 ? 'es' : ''} logged`
              }
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <MagneticButton
                onClick={() => onNavigate('masses')}
                className="group flex items-center gap-2 rounded-2xl bg-amber-300 px-6 py-3.5 text-sm font-bold text-[#18392f] shadow-[0_4px_24px_rgba(251,191,36,0.4)] transition hover:bg-amber-200 hover:shadow-[0_4px_32px_rgba(251,191,36,0.55)] active:scale-95"
              >
                {nextMass ? 'Open Liturgy Desk' : 'Log First Mass'}
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </MagneticButton>
              <button
                onClick={() => onNavigate('registration')}
                className="rounded-2xl border border-white/15 bg-white/8 px-6 py-3.5 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/14 active:scale-95"
              >
                Manage Members
              </button>
            </div>

            {/* Mini stat strip */}
            <div className="mt-8 flex flex-wrap gap-5 border-t border-white/10 pt-6">
              {[
                { val: activeMembers.length, label: 'Active Choralists' },
                { val: `${averageAttendance}%`, label: 'Avg Attendance' },
                { val: masses.length, label: 'Masses Logged' },
              ].map(({ val, label }) => (
                <div key={label}>
                  <p className="text-xl font-extrabold text-amber-300 font-mono">
                    {typeof val === 'number' ? <CountUp value={val} /> : val}
                  </p>
                  <p className="text-[10px] font-semibold text-emerald-200/60 uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — next liturgy + radio */}
          <div className="flex flex-col justify-between border-t border-white/10 bg-black/15 p-7 lg:border-l lg:border-t-0 backdrop-blur-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/70 mb-3">Next Liturgy</p>
              {nextMass ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold leading-snug">{nextMass.name}</h3>
                  <div className="space-y-2.5 text-sm text-emerald-100/80">
                    <p className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-300/20">
                        <CalendarDays className="h-3.5 w-3.5 text-amber-300" />
                      </span>
                      {new Date(nextMass.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' })}
                    </p>
                    <p className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-300/20">
                        <Clock3 className="h-3.5 w-3.5 text-amber-300" />
                      </span>
                      {nextMass.time}
                    </p>
                    <p className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-300/20">
                        <MapPin className="h-3.5 w-3.5 text-amber-300" />
                      </span>
                      {parishName}{parishPlace ? `, ${parishPlace}` : ''}
                    </p>
                  </div>
                  <span className={`inline-block mt-1 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                    nextMass.category === 'Sunday Mass' ? 'bg-emerald-800/60 text-emerald-200' : 'bg-amber-300/20 text-amber-200'
                  }`}>
                    {nextMass.category}
                  </span>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 p-4 text-center">
                  <Music2 className="h-8 w-8 text-white/30 mx-auto mb-2" />
                  <p className="text-sm text-emerald-100/50">No mass scheduled yet</p>
                  <button onClick={() => onNavigate('masses')} className="mt-2 text-xs font-bold text-amber-300 hover:text-amber-200">Log one now →</button>
                </div>
              )}

              {/* Member avatars */}
              {activeMembers.length > 0 && (
                <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/8 p-3">
                  <div className="flex -space-x-2">
                    {activeMembers.slice(0, 5).map((m) => (
                      <img key={m.id} src={m.photoUrl} alt="" className="h-8 w-8 rounded-full border-2 border-[#1e4035] object-cover" />
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{activeMembers.length} confirmed</p>
                    <p className="text-[10px] text-emerald-200/60">
                      {pendingMembers.length > 0 ? `+${pendingMembers.length} awaiting approval` : 'Fully confirmed'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <RadioPlayer />
          </div>
        </div>
      </section>

      {/* ── STAT CARDS ───────────────────────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Active Choralists',
            value: activeMembers.length,
            sub: pendingMembers.length > 0 ? `${pendingMembers.length} awaiting review` : 'All members active',
            icon: UsersRound,
            grad: 'from-blue-500 to-indigo-600',
            light: 'bg-blue-50',
            text: 'text-blue-700',
            bar: confirmedPercent,
          },
          {
            label: 'Avg Attendance',
            value: `${averageAttendance}%`,
            sub: averageAttendance >= 75 ? 'Strong participation' : 'Room to improve',
            icon: UserCheck,
            grad: 'from-emerald-500 to-teal-600',
            light: 'bg-emerald-50',
            text: 'text-emerald-700',
            bar: averageAttendance,
          },
          {
            label: 'Pending Collection',
            value: formatINR(pendingCollections),
            sub: `${openPaymentCount} open invoice${openPaymentCount !== 1 ? 's' : ''}`,
            icon: IndianRupee,
            grad: 'from-amber-400 to-orange-500',
            light: 'bg-amber-50',
            text: 'text-amber-700',
            bar: openPaymentCount > 0 ? Math.min(100, openPaymentCount * 20) : 0,
          },
          {
            label: 'Choir Health',
            value: healthLabel,
            sub: `Score ${healthScore} / 100`,
            icon: TrendingUp,
            grad: 'from-violet-500 to-purple-600',
            light: 'bg-violet-50',
            text: 'text-violet-700',
            bar: healthScore,
          },
        ].map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.06}>
          <article className="group relative h-full overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            {/* Gradient orb */}
            <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${stat.grad} opacity-10 blur-xl group-hover:opacity-20 transition-opacity`} />

            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${stat.light} ${stat.text}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-extrabold tracking-tight text-slate-900">
              {typeof stat.value === 'number' ? <CountUp value={stat.value} /> : stat.value}
            </p>
            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
            <p className="mt-2 text-[11px] text-slate-500">{stat.sub}</p>

            {/* Progress bar */}
            <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100">
              <div className={`h-1.5 rounded-full bg-gradient-to-r ${stat.grad} transition-all duration-700`} style={{ width: `${stat.bar}%` }} />
            </div>
          </article>
          </Reveal>
        ))}
      </section>

      {/* ── LITURGY LOG + AI INSIGHT ─────────────────────────────────────────── */}
      <Reveal>
      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.85fr]">

        {/* Liturgy log — timeline style */}
        <article className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">Parish Liturgy Log</p>
              <h3 className="mt-0.5 text-xl font-bold text-slate-900">Logged Masses</h3>
            </div>
            <button onClick={() => onNavigate('masses')}
              className="flex items-center gap-1 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition">
              Manage <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {masses.length === 0 ? (
            <button onClick={() => onNavigate('masses')}
              className="flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 px-5 py-8 text-left hover:bg-slate-100 transition group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm group-hover:scale-105 transition-transform">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">No masses logged yet</p>
                <p className="text-xs text-slate-500 mt-0.5">Tap to open Masses & Accounts desk →</p>
              </div>
            </button>
          ) : (
            <div className="relative space-y-1">
              {/* Timeline line */}
              <div className="absolute left-[18px] top-2 bottom-2 w-px bg-slate-100" />

              {masses.slice(0, 5).map((mass, i) => {
                const isSpecial = ['Special Mass', 'Death Mass', 'Death Anniversary Mass'].includes(mass.category);
                return (
                  <button key={mass.id} onClick={() => onNavigate('masses')}
                    className="relative flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left hover:bg-slate-50 transition group">
                    {/* Timeline dot */}
                    <div className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-white shadow-sm ${
                      i === 0 ? 'bg-[#18392f] text-amber-300' : isSpecial ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <BookOpen className="h-3.5 w-3.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-slate-800 group-hover:text-emerald-800 transition-colors">{mass.name}</p>
                        {i === 0 && <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700">Next</span>}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${isSpecial ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>
                          {mass.category}
                        </span>
                        <span className="text-[10px] text-slate-400">{mass.date} · {mass.time}</span>
                      </div>
                    </div>

                    <span className="shrink-0 text-[10px] font-semibold text-slate-400">{mass.language}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          )}

          {masses.length > 5 && (
            <button onClick={() => onNavigate('masses')}
              className="mt-3 w-full rounded-xl border border-slate-100 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition text-center">
              View all {masses.length} masses →
            </button>
          )}
        </article>

        {/* AI Insight — bold brand card */}
        <div className="flex flex-col gap-5">
          <article className="relative overflow-hidden rounded-3xl bg-[#18392f] p-6 text-white flex-1">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-300/20 blur-2xl" />
              <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-emerald-700/40 blur-2xl" />
              <MusicalCross className="absolute right-4 bottom-4 h-16 w-16 text-amber-300" />
            </div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-300/20 border border-amber-300/30">
                  <Sparkles className="h-4 w-4 text-amber-300" />
                </div>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-amber-200/80">AI Insight</span>
              </div>
              <h3 className="font-serif text-2xl font-bold leading-snug">
                {activeMembers.length === 0
                  ? <>Begin your<br /><span className="text-amber-300">choir journey.</span></>
                  : activeMembers.length < 4
                  ? <>Grow your<br /><span className="text-amber-300">choir family.</span></>
                  : <>Your choir<br /><span className="text-amber-300">is thriving.</span></>
                }
              </h3>
              <p className="mt-3 text-sm leading-6 text-emerald-100/75">
                {activeMembers.length === 0
                  ? 'No members yet. Add your first choir member to begin your parish music ministry.'
                  : `${activeMembers.length} active member${activeMembers.length !== 1 ? 's' : ''} at ${parishName}. ${pendingMembers.length > 0 ? `${pendingMembers.length} application${pendingMembers.length !== 1 ? 's' : ''} awaiting review.` : 'All applications processed.'}`
                }
              </p>
              <button onClick={() => onNavigate('ai_hub')}
                className="mt-5 flex items-center gap-2 text-sm font-bold text-amber-300 hover:text-amber-200 transition group">
                Ask Choir AI
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </article>

          {/* Quick actions strip */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: UsersRound, label: 'Members', sub: `${activeMembers.length} active`, nav: 'registration' as Tab, color: 'bg-blue-50 text-blue-700 border-blue-100' },
              { icon: IndianRupee, label: 'Accounts', sub: formatINR(pendingCollections), nav: 'masses' as Tab, color: 'bg-amber-50 text-amber-700 border-amber-100' },
            ].map(({ icon: Icon, label, sub, nav, color }) => (
              <button key={label} onClick={() => onNavigate(nav)}
                className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition hover:shadow-sm active:scale-95 ${color}`}>
                <Icon className="h-5 w-5" />
                <div>
                  <p className="text-sm font-bold">{label}</p>
                  <p className="text-[10px] font-semibold opacity-70 mt-0.5">{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
      </Reveal>

      {/* ── BOTTOM CARDS ─────────────────────────────────────────────────────── */}
      <Reveal delay={0.08}>
      <section className="grid gap-5 lg:grid-cols-3">

        {/* Rehearsal */}
        <article className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-purple-700 p-6 text-white shadow-md hover:shadow-lg transition-shadow">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-xl" />
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 mb-4">
              <Mic2 className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200/80">Next Rehearsal</p>
            {nextPractice ? (
              <>
                <h3 className="mt-1.5 font-bold text-base leading-snug">{nextPractice.name}</h3>
                <p className="mt-1.5 text-xs text-violet-100/70">{nextPractice.date} · {nextPractice.time}</p>
              </>
            ) : (
              <h3 className="mt-1.5 text-sm text-violet-100/60">No rehearsal scheduled</h3>
            )}
            <button onClick={() => onNavigate('calendar')}
              className="mt-4 flex items-center gap-1 text-xs font-bold text-violet-200 hover:text-white transition group">
              Manage calendar <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </article>

        {/* Daily Word */}
        <article className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-6 text-white shadow-md hover:shadow-lg transition-shadow">
          <div className="absolute -left-6 -bottom-6 h-28 w-28 rounded-full bg-white/10 blur-xl" />
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 mb-4">
              <BookOpenText className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-100/80">Daily Word</p>
            <h3 className="mt-1.5 font-bold text-base leading-snug">"Your Father knows what you need."</h3>
            <p className="mt-1.5 text-xs text-amber-100/70">Matthew 6:7–15 · Daily readings</p>
            <button onClick={() => onNavigate('bible')}
              className="mt-4 flex items-center gap-1 text-xs font-bold text-amber-100 hover:text-white transition group">
              Read reflection <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </article>

        {/* Parish Announcement */}
        <article className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white shadow-md hover:shadow-lg transition-shadow">
          <div className="absolute right-4 top-4 h-20 w-20 rounded-full bg-emerald-500/10 blur-xl" />
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 mb-4">
              <CalendarDays className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Parish Update</p>
            {announcements[0] ? (
              <>
                <h3 className="mt-1.5 font-bold text-base leading-snug">{announcements[0].title}</h3>
                <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-400">{announcements[0].content}</p>
              </>
            ) : (
              <h3 className="mt-1.5 text-sm text-slate-500">No announcements yet</h3>
            )}
            <button className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition group">
              Read announcement <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </article>

      </section>
      </Reveal>
    </div>
  );
};
