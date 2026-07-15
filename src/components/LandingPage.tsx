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
  IndianRupee,
  MapPin,
  Mic2,
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

interface LandingPageProps {
  currentLang: Language;
  onNavigate: (section: Tab) => void;
  members: Member[];
  masses: Mass[];
  payments: Payment[];
  events: ChoirEvent[];
  announcements: Announcement[];
}

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
    <div className="font-apple space-y-5 animate-fade-in">

      {/* Hero — Apple product block */}
      <section className="apple-hero-soft">
        <div className="choir-hero-ambient" aria-hidden />
        <div className="relative grid lg:grid-cols-[1.45fr_0.85fr]">
          <div className="px-7 py-9 sm:px-10 sm:py-11">
            <p className="text-[13px] font-medium text-[#a1a1a6]">{todayLabel}</p>
            <p className="mt-4 text-[17px] font-semibold tracking-[-0.01em] text-amber-300">
              {greeting}
            </p>
            <h1 className="mt-2 max-w-xl text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-[#f5f5f7]">
              {nextMass
                ? <>Ministry ready.<br /><span className="text-amber-300">Voices aligned.</span></>
                : <>Welcome to<br /><span className="text-amber-300">Choir360.</span></>
              }
            </h1>
            <p className="mt-4 max-w-lg text-[17px] leading-snug tracking-[-0.01em] text-[#a1a1a6]">
              {members.length === 0
                ? 'Your parish choir desk. Register members and log your first mass.'
                : `${confirmedPercent}% active · ${pendingMembers.length > 0 ? `${pendingMembers.length} pending` : 'All approved'} · ${masses.length} mass${masses.length !== 1 ? 'es' : ''}`
              }
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <AppleButton variant="gold" magnetic onClick={() => onNavigate('masses')}>
                {nextMass ? 'Open Liturgy Desk' : 'Log First Mass'}
                <ArrowUpRight className="h-4 w-4" />
              </AppleButton>
              <AppleButton variant="onDark" onClick={() => onNavigate('registration')}>
                Manage Members
              </AppleButton>
            </div>
          </div>

          <div className="flex flex-col justify-between border-t border-white/10 bg-black/20 px-7 py-8 backdrop-blur-sm lg:border-l lg:border-t-0">
            <div>
              <p className="apple-caption text-[#86868b]">Next liturgy</p>
              {nextMass ? (
                <div className="mt-3 space-y-3">
                  <h3 className="text-[21px] font-semibold leading-snug tracking-[-0.02em] text-[#f5f5f7]">
                    {nextMass.name}
                  </h3>
                  <div className="space-y-2 text-[15px] text-[#a1a1a6]">
                    <p className="flex items-center gap-2.5">
                      <CalendarDays className="h-4 w-4 text-amber-300" />
                      {new Date(nextMass.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' })}
                    </p>
                    <p className="flex items-center gap-2.5">
                      <Clock3 className="h-4 w-4 text-amber-300" />
                      {nextMass.time}
                    </p>
                    <p className="flex items-center gap-2.5">
                      <MapPin className="h-4 w-4 text-amber-300" />
                      {parishName}{parishPlace ? `, ${parishPlace}` : ''}
                    </p>
                  </div>
                  <span className="apple-badge-gold mt-1 inline-flex">{nextMass.category}</span>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-white/15 p-5 text-center">
                  <Music2 className="mx-auto mb-2 h-7 w-7 text-white/30" />
                  <p className="text-[15px] text-[#86868b]">No mass scheduled yet</p>
                  <button
                    type="button"
                    onClick={() => onNavigate('masses')}
                    className="btn-pill-link mt-1 !text-amber-300"
                  >
                    Log one now ›
                  </button>
                </div>
              )}

              {activeMembers.length > 0 && (
                <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/8 p-3">
                  <div className="flex -space-x-2">
                    {activeMembers.slice(0, 5).map((m) => (
                      <img key={m.id} src={m.photoUrl} alt="" className="h-8 w-8 rounded-full border-2 border-[#0f2b22] object-cover" />
                    ))}
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-[#f5f5f7]">{activeMembers.length} confirmed</p>
                    <p className="text-[12px] text-[#86868b]">
                      {pendingMembers.length > 0 ? `+${pendingMembers.length} awaiting approval` : 'Fully confirmed'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6">
              <RadioPlayer />
            </div>
          </div>
        </div>
      </section>

      {/* Stats — Apple grouped tiles */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Active choralists',
            value: activeMembers.length,
            sub: pendingMembers.length > 0 ? `${pendingMembers.length} awaiting review` : 'All members active',
            icon: UsersRound,
            bar: confirmedPercent,
          },
          {
            label: 'Avg attendance',
            value: `${averageAttendance}%`,
            sub: averageAttendance >= 75 ? 'Strong participation' : 'Room to improve',
            icon: UserCheck,
            bar: averageAttendance,
          },
          {
            label: 'Pending collection',
            value: formatINR(pendingCollections),
            sub: `${openPaymentCount} open invoice${openPaymentCount !== 1 ? 's' : ''}`,
            icon: IndianRupee,
            bar: openPaymentCount > 0 ? Math.min(100, openPaymentCount * 20) : 0,
          },
          {
            label: 'Choir health',
            value: healthLabel,
            sub: `Score ${healthScore} / 100`,
            icon: TrendingUp,
            bar: healthScore,
          },
        ].map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.05}>
            <article className="apple-card flex h-full flex-col p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(24,57,47,0.08)] text-[#18392f]">
                <stat.icon className="h-4 w-4" />
              </div>
              <p className="text-[28px] font-semibold tracking-[-0.03em] text-[#1d1d1f]">
                {typeof stat.value === 'number' ? <CountUp value={stat.value} /> : stat.value}
              </p>
              <p className="mt-0.5 text-[13px] font-medium text-[#1d1d1f]">{stat.label}</p>
              <p className="mt-1 text-[12px] text-[#86868b]">{stat.sub}</p>
              <div className="mt-auto pt-4">
                <div className="h-1 w-full overflow-hidden rounded-full bg-black/[0.06]">
                  <div
                    className="h-full rounded-full bg-[#18392f] transition-all duration-700"
                    style={{ width: `${stat.bar}%` }}
                  />
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </section>

      <Reveal>
        <section className="grid gap-4 xl:grid-cols-[1.4fr_0.85fr]">
          <article className="apple-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="apple-caption">Parish liturgy log</p>
                <h3 className="apple-title mt-0.5">Logged masses</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('masses')}
                className="btn-pill btn-pill-secondary btn-pill-sm"
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
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#18392f]">
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
                        i === 0 ? 'bg-[#18392f] text-amber-300' : isSpecial ? 'bg-[rgba(245,194,76,0.22)] text-[#8a6a10]' : 'bg-black/[0.06] text-[#86868b]'
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

            {masses.length > 5 && (
              <button
                type="button"
                onClick={() => onNavigate('masses')}
                className="btn-pill-link mt-3 w-full !justify-center"
              >
                View all {masses.length} masses ›
              </button>
            )}
          </article>

          <div className="flex flex-col gap-4">
            <article className="apple-hero relative flex-1 overflow-hidden p-6">
              <div className="choir-hero-ambient" aria-hidden />
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-300/20">
                    <Sparkles className="h-4 w-4 text-amber-300" />
                  </div>
                  <span className="apple-badge text-amber-200/90 !bg-white/10">AI Insight</span>
                </div>
                <h3 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] text-[#f5f5f7]">
                  {activeMembers.length === 0
                    ? <>Begin your<br /><span className="text-amber-300">choir journey.</span></>
                    : activeMembers.length < 4
                    ? <>Grow your<br /><span className="text-amber-300">choir family.</span></>
                    : <>Your choir<br /><span className="text-amber-300">is thriving.</span></>
                  }
                </h3>
                <p className="mt-3 text-[15px] leading-snug text-[#a1a1a6]">
                  {activeMembers.length === 0
                    ? 'No members yet. Add your first choir member to begin your parish music ministry.'
                    : `${activeMembers.length} active at ${parishName}. ${pendingMembers.length > 0 ? `${pendingMembers.length} awaiting review.` : 'All applications processed.'}`
                  }
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('ai_hub')}
                  className="btn-pill-link mt-5 !px-0 !text-amber-300"
                >
                  Ask Choir AI ›
                </button>
              </div>
            </article>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: UsersRound, label: 'Members', sub: `${activeMembers.length} active`, nav: 'registration' as Tab },
                { icon: IndianRupee, label: 'Accounts', sub: formatINR(pendingCollections), nav: 'masses' as Tab },
              ].map(({ icon: Icon, label, sub, nav }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onNavigate(nav)}
                  className="apple-card flex flex-col items-start gap-2 p-4 text-left transition active:scale-[0.98]"
                >
                  <Icon className="h-5 w-5 text-[#18392f]" />
                  <div>
                    <p className="text-[15px] font-semibold text-[#1d1d1f]">{label}</p>
                    <p className="mt-0.5 text-[12px] text-[#86868b]">{sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.06}>
        <section className="grid gap-3 lg:grid-cols-3">
          <article className="apple-hero-soft p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/12">
              <Mic2 className="h-5 w-5 text-[#f5f5f7]" />
            </div>
            <p className="apple-caption text-[#a1a1a6]">Next rehearsal</p>
            {nextPractice ? (
              <>
                <h3 className="mt-1.5 text-[17px] font-semibold tracking-[-0.02em] text-[#f5f5f7]">{nextPractice.name}</h3>
                <p className="mt-1.5 text-[13px] text-[#86868b]">{nextPractice.date} · {nextPractice.time}</p>
              </>
            ) : (
              <h3 className="mt-1.5 text-[15px] text-[#86868b]">No rehearsal scheduled</h3>
            )}
            <button type="button" onClick={() => onNavigate('calendar')} className="btn-pill-link mt-4 !px-0 !text-[#2997ff]">
              Manage calendar ›
            </button>
          </article>

          <article className="overflow-hidden rounded-[1.75rem] bg-gradient-to-b from-[#f5c24c] to-[#e8a820] p-6 text-[#0f2b22]">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/10">
              <BookOpenText className="h-5 w-5" />
            </div>
            <p className="text-[13px] font-medium text-[#0f2b22]/80">Daily word</p>
            <h3 className="mt-1.5 text-[17px] font-semibold leading-snug tracking-[-0.02em]">
              &ldquo;Your Father knows what you need.&rdquo;
            </h3>
            <p className="mt-1.5 text-[13px] text-[#0f2b22]/70">Matthew 6:7–15 · Daily readings</p>
            <button type="button" onClick={() => onNavigate('bible')} className="mt-4 text-[15px] font-medium text-[#0f2b22] underline-offset-2 hover:underline">
              Read reflection ›
            </button>
          </article>

          <article className="overflow-hidden rounded-[1.75rem] bg-[#1c1c1e] p-6 text-[#f5f5f7]">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <CalendarDays className="h-5 w-5" />
            </div>
            <p className="apple-caption text-[#86868b]">Parish update</p>
            {announcements[0] ? (
              <>
                <h3 className="mt-1.5 text-[17px] font-semibold tracking-[-0.02em]">{announcements[0].title}</h3>
                <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-[#86868b]">{announcements[0].content}</p>
              </>
            ) : (
              <h3 className="mt-1.5 text-[15px] text-[#86868b]">No announcements yet</h3>
            )}
            <button type="button" className="btn-pill-link mt-4 !px-0 !text-[#2997ff]">
              Read announcement ›
            </button>
          </article>
        </section>
      </Reveal>
    </div>
  );
};
