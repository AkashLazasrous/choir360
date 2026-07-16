import React, { useState } from 'react';
import {
  BarChart3, BookOpen, CalendarDays, ChevronDown, Church,
  Command, Music2, ShieldCheck, Trophy, UsersRound,
} from 'lucide-react';
import { Tab } from '../../types';
import { Reveal } from '../interactions/Reveal';
import { CountUp } from '../interactions/CountUp';
import { ProductSubnav } from '../interactions/ProductSubnav';
import { AppleButton } from '../interactions/AppleButton';
import { SpotlightCard } from '../interactions/SpotlightCard';

interface MarketingLandingProps {
  onNavigate: (tab: Tab) => void;
  parishName?: string;
}

const SUBNAV_LINKS = [
  { id: 'design', label: 'Design' },
  { id: 'modules', label: 'Modules' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'faq', label: 'FAQ' },
];

const FEATURES = [
  { icon: Church, title: 'Masses & Accounts', body: 'Log every liturgy, propose payment shares, and track collections to the rupee.', well: 'grad-icon-well' },
  { icon: Music2, title: 'Song Library', body: 'Searchable Tamil hymns with lyrics and categories — including Jebathotta Jeyageethangal.', well: 'grad-icon-well-sunset' },
  { icon: UsersRound, title: 'Member Management', body: 'Self-service registration, voice-part rosters, private contacts kept private.', well: 'grad-icon-well-hydrogen' },
  { icon: CalendarDays, title: 'Unified Calendar', body: 'Masses, rehearsals, and parish events so nobody misses a call time.', well: 'grad-icon-well-cinnamint' },
  { icon: Trophy, title: 'Attendance', body: 'Mark attendance in one tap. Celebrate consistency with streaks and badges.', well: 'grad-icon-well-neon' },
  { icon: Command, title: 'AI Hub', body: 'Draft announcements, suggest hymns, answer choir questions.', well: 'grad-icon-well-disco' },
  { icon: BookOpen, title: 'Catholic Hub', body: 'Daily gospel, Tamil prayers, saints, and the liturgical year.', well: 'grad-icon-well-roseanna' },
  { icon: BarChart3, title: 'Insights', body: 'Choir health, attendance trends, and financial summaries.', well: 'grad-icon-well-instagram' },
];

const STEPS = [
  { n: '01', title: 'Register', body: 'Voice part and parish in under two minutes on any phone.' },
  { n: '02', title: 'Get approved', body: 'Your choir admin reviews — you are notified the moment it happens.' },
  { n: '03', title: 'Sing', body: 'Masses, rehearsals, lyrics, and attendance from one calm desk.' },
];

const FAQS = [
  { q: 'Is Choir360 free for our parish?', a: 'Yes. Free for parish choirs — no subscriptions, seat limits, or locked features.' },
  { q: 'Who can see my personal details?', a: 'Only you and your choir administrators. Contact details are stored separately and protected by per-parish security rules.' },
  { q: 'Does it work on mobile?', a: 'Yes — mobile-first, with bottom navigation, large touch targets, and offline-friendly lyrics.' },
  { q: 'Can we manage money for special masses?', a: 'Yes. Propose amounts, split singer and instrumentalist shares, and track what has been received.' },
  { q: 'Tamil and English together?', a: 'Song library, prayers, and readings support both — with phonetic search (type “anbe” to find அன்பே).' },
];

export const MarketingLanding: React.FC<MarketingLandingProps> = ({ onNavigate, parishName }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="font-apple -mx-4 animate-fade-in grad-tranquil text-[#0f172a] sm:-mx-6 lg:-mx-8">
      <ProductSubnav
        title="Choir360"
        links={SUBNAV_LINKS}
        ctaLabel="Join"
        onCta={() => onNavigate('registration')}
      />

      {/* Hero — full-bleed liturgy photo + Deep Sea scrim */}
      <section className="relative min-h-[min(92svh,860px)] overflow-hidden bg-[#050a14] text-[#f5f5f7]">
        <img
          src="/images/landing-hero.png"
          alt=""
          className="choir-hero-photo absolute inset-0 h-full w-full object-cover object-[center_35%]"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0" aria-hidden style={{ background: 'var(--grad-hero-scrim)' }} />
        <div
          className="absolute inset-0 opacity-50"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 20% 20%, rgba(56,189,248,0.22) 0%, transparent 55%), radial-gradient(ellipse 60% 45% at 85% 75%, rgba(232,121,249,0.16) 0%, transparent 50%)',
          }}
        />
        <div className="choir-hero-ambient opacity-50" aria-hidden />

        <div className="apple-content relative z-10 flex min-h-[min(92svh,860px)] flex-col items-center justify-end px-6 pb-16 pt-28 text-center sm:justify-center sm:pb-20 sm:pt-24">
          <p className="text-[17px] font-semibold tracking-[0.02em] text-transparent bg-clip-text drop-shadow-[0_1px_12px_rgba(0,0,0,0.35)]" style={{ backgroundImage: 'var(--grad-gold)', WebkitBackgroundClip: 'text' }}>
            Choir360
          </p>
          <h1 className="mt-3 max-w-3xl text-[clamp(2.75rem,8vw,5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)]">
            Your choir&apos;s ministry.<br className="hidden sm:block" /> Beautifully organised.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[19px] font-normal leading-snug tracking-[-0.01em] text-[#e8e8ed]/[0.92] drop-shadow-[0_1px_10px_rgba(0,0,0,0.4)]">
            Masses, rehearsals, hymns, attendance, and accounts —
            so your parish choir spends less time coordinating and more time singing.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <AppleButton variant="gold" magnetic onClick={() => onNavigate('registration')}>
              Join your choir
            </AppleButton>
            <AppleButton variant="link" onClick={() => onNavigate('song_library')} className="!text-[#7dd3fc] hover:!text-white">
              Browse songs ›
            </AppleButton>
          </div>
        </div>
      </section>

      {/* Trust strip — Hydrogen mist */}
      <Reveal>
        <section className="border-b border-black/5 grad-hydrogen py-6">
          <div className="apple-content flex flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 text-center text-[12px] font-medium text-[#0c4a6e]/80">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#0e7490]" />
              Per-parish data isolation
            </span>
            <span>Archdiocese of Madras–Mylapore</span>
            {parishName && <span>Serving {parishName}</span>}
          </div>
        </section>
      </Reveal>

      {/* Design */}
      <section id="design" className="apple-section scroll-mt-28">
        <Reveal>
          <div className="apple-content text-center">
            <p className="apple-eyebrow grad-text-maldives">Design</p>
            <h2 className="apple-display mt-2">
              From WhatsApp chaos<br />to one calm desk.
            </h2>
            <p className="apple-subhead mx-auto mt-5 max-w-2xl">
              Liturgy times, lyric sheets, and payment splits used to live in group chats and paper.
              Choir360 brings the whole ministry into one place — clear, fast, and built for parish life.
            </p>
          </div>
        </Reveal>
        <div className="apple-content mt-16 grid gap-4 px-0 sm:grid-cols-3">
          {[
            { before: 'Mass times buried in chats', after: 'A calendar every member can check, next liturgy on top.', accent: 'grad-icon-well-hydrogen' },
            { before: 'Photocopied sheets going missing', after: 'Searchable lyrics on any phone — even mid-mass.', accent: 'grad-icon-well-sunset' },
            { before: 'Payment splits on paper', after: 'Automatic singer and instrumentalist shares, tracked.', accent: 'grad-icon-well' },
          ].map(({ before, after, accent }, i) => (
            <Reveal key={before} delay={i * 0.06}>
              <div className="rounded-[28px] bg-white/90 px-7 py-8 text-left shadow-[0_2px_12px_rgba(14,61,76,0.06)] ring-1 ring-black/[0.03] backdrop-blur-sm">
                <div className={`mb-4 h-1.5 w-12 rounded-full ${accent}`} />
                <p className="text-[14px] font-normal text-[#64748b] line-through decoration-[#94a3b8]/50">{before}</p>
                <p className="mt-3 text-[19px] font-semibold leading-snug tracking-[-0.02em] text-[#0f172a]">{after}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Stats — Deep Sea Space */}
      <Reveal>
        <section className="apple-section apple-section-dark">
          <div className="apple-content text-center">
            <p className="text-[17px] font-semibold text-transparent" style={{ backgroundImage: 'var(--grad-gold)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>
              Built for ministry scale
            </p>
            <h2 className="apple-headline mt-2">Everything you need. Nothing you don&apos;t.</h2>
            <div className="mt-12 grid grid-cols-1 gap-8 sm:mt-16 sm:grid-cols-3 sm:gap-6">
              {[
                { val: 1000, suffix: '+', label: 'Hymns & songs', tint: 'grad-text-maldives' },
                { val: 12, suffix: '', label: 'Ministry modules', tint: 'grad-text-sunset' },
                { val: 5, suffix: '', label: 'Languages', tint: 'grad-text-maldives' },
              ].map(({ val, suffix, label, tint }) => (
                <div key={label} className="text-center">
                  <p className={`text-[clamp(2.5rem,8vw,4rem)] font-semibold tracking-[-0.04em] ${tint}`}>
                    <CountUp value={val} />{suffix}
                  </p>
                  <p className="mt-2 text-[14px] text-[#94a3b8]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* Modules grid */}
      <section id="modules" className="apple-section scroll-mt-28">
        <Reveal>
          <div className="apple-content text-center">
            <p className="apple-eyebrow grad-text-maldives">Modules</p>
            <h2 className="apple-headline mt-2">One platform for the whole choir.</h2>
            <p className="apple-subhead mx-auto mt-4 max-w-xl">
              Every capability included — free for every parish.
            </p>
          </div>
        </Reveal>
        <div className="apple-content mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body, well }, i) => (
            <Reveal key={title} delay={(i % 4) * 0.04}>
              <SpotlightCard className="h-full rounded-[22px] bg-white/90 p-6 shadow-[0_2px_12px_rgba(14,61,76,0.06)] ring-1 ring-black/[0.03]">
                <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-full ${well}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-[17px] font-semibold tracking-[-0.015em]">{title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#64748b]">{body}</p>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 text-center">
          <AppleButton variant="link" onClick={() => onNavigate('catholic_hub')} className="!text-[#0284c7]">
            Explore Catholic Hub ›
          </AppleButton>
        </div>
      </section>

      {/* How it works — Neon Lagoon cinematic */}
      <section id="how-it-works" className="apple-section scroll-mt-28 grad-neon-lagoon text-[#f5f5f7]">
        <Reveal>
          <div className="apple-content text-center">
            <p className="text-[17px] font-semibold text-[#bbf7d0]">How it works</p>
            <h2 className="apple-headline mt-2 !text-white">Singing within minutes.</h2>
          </div>
        </Reveal>
        <div className="apple-content mt-16 grid gap-12 sm:grid-cols-3">
          {STEPS.map(({ n, title, body }, i) => (
            <Reveal key={n} delay={i * 0.08}>
              <div className="text-left sm:text-center">
                <p className="text-[40px] font-semibold tracking-[-0.04em] text-white/25">{n}</p>
                <h3 className="mt-2 text-[21px] font-semibold tracking-[-0.02em] text-white">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#bbf7d0]/85">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-14 text-center">
          <AppleButton variant="gold" magnetic onClick={() => onNavigate('registration')}>
            Start registration
          </AppleButton>
        </div>
      </section>

      {/* Pricing — Roseanna soft band */}
      <section id="pricing" className="apple-section scroll-mt-28 grad-roseanna">
        <Reveal>
          <div className="apple-content text-center">
            <p className="apple-eyebrow text-[#9a3412]">Pricing</p>
            <h2 className="apple-display mt-2">
              Free.<br />For every parish.
            </h2>
            <p className="apple-subhead mx-auto mt-5 max-w-lg !text-[#7c2d12]/80">
              A ministry tool, not a product. Masses, songs, accounts, AI hub, insights —
              included for every choir at no cost.
            </p>
            <p className="mt-8 text-[40px] font-semibold tracking-[-0.04em] grad-text-sunset">₹0</p>
            <p className="mt-1 text-[14px] text-[#9a3412]/70">per month, forever</p>
            <div className="mt-8">
              <AppleButton variant="primary" onClick={() => onNavigate('registration')}>
                Get started
              </AppleButton>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section id="faq" className="apple-section scroll-mt-28 !pt-0">
        <Reveal>
          <div className="apple-content">
            <div className="text-center">
              <h2 className="apple-headline">Questions. Answered.</h2>
            </div>
            <div className="mx-auto mt-12 max-w-2xl space-y-2">
              {FAQS.map(({ q, a }, i) => (
                <div key={q} className="overflow-hidden rounded-[18px] bg-white/90 shadow-[0_1px_4px_rgba(14,61,76,0.05)] ring-1 ring-black/[0.03]">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                    className="flex min-h-[56px] w-full items-center justify-between gap-4 px-6 py-4 text-left text-[17px] font-semibold tracking-[-0.015em] text-[#0f172a]"
                  >
                    {q}
                    <ChevronDown className={`h-4 w-4 shrink-0 text-[#64748b] transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <p className="border-t border-black/5 px-6 py-4 text-[15px] leading-relaxed text-[#64748b]">{a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* Final CTA — Maldives + Deep Sea blend */}
      <Reveal>
        <section className="px-6 pb-24">
          <div className="apple-content relative overflow-hidden rounded-[28px] grad-deep-sea px-8 py-16 text-center text-[#f5f5f7] sm:px-12">
            <div
              className="pointer-events-none absolute inset-0 opacity-70"
              aria-hidden
              style={{
                background:
                  'radial-gradient(ellipse 80% 60% at 15% 20%, rgba(56,189,248,0.35) 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 90% 80%, rgba(20,184,166,0.28) 0%, transparent 50%)',
              }}
            />
            <h2 className="relative text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.03em]">
              Ready to lift your voice?
            </h2>
            <p className="relative mx-auto mt-3 max-w-md text-[17px] text-[#94a3b8]">
              Join your parish choir on Choir360 — registration takes two minutes.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-4">
              <AppleButton variant="gold" magnetic onClick={() => onNavigate('registration')}>
                Register as a member
              </AppleButton>
              <AppleButton variant="link" onClick={() => onNavigate('calendar')} className="!text-[#7dd3fc]">
                See the calendar ›
              </AppleButton>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
};
