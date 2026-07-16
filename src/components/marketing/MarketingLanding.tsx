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
  { icon: Church, title: 'Masses & Accounts', body: 'Log every liturgy, propose payment shares, and track collections to the rupee.' },
  { icon: Music2, title: 'Song Library', body: 'Searchable Tamil hymns with lyrics and categories — including Jebathotta Jeyageethangal.' },
  { icon: UsersRound, title: 'Member Management', body: 'Self-service registration, voice-part rosters, private contacts kept private.' },
  { icon: CalendarDays, title: 'Unified Calendar', body: 'Masses, rehearsals, and parish events so nobody misses a call time.' },
  { icon: Trophy, title: 'Attendance', body: 'Mark attendance in one tap. Celebrate consistency with streaks and badges.' },
  { icon: Command, title: 'AI Hub', body: 'Draft announcements, suggest hymns, answer choir questions.' },
  { icon: BookOpen, title: 'Catholic Hub', body: 'Daily gospel, Tamil prayers, saints, and the liturgical year.' },
  { icon: BarChart3, title: 'Insights', body: 'Choir health, attendance trends, and financial summaries.' },
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
    <div className="font-apple -mx-4 animate-fade-in bg-[#f5f5f7] text-[#1d1d1f] sm:-mx-6 lg:-mx-8">
      <ProductSubnav
        title="Choir360"
        links={SUBNAV_LINKS}
        ctaLabel="Join"
        onCta={() => onNavigate('registration')}
      />

      {/* Hero — full-bleed liturgy photo + brand, one line, one CTA */}
      <section className="relative min-h-[min(92svh,860px)] overflow-hidden bg-[#0f2b22] text-[#f5f5f7]">
        <img
          src="/images/landing-hero.png"
          alt=""
          className="choir-hero-photo absolute inset-0 h-full w-full object-cover object-[center_35%]"
          fetchPriority="high"
          decoding="async"
        />
        {/* Brand-tint scrim so white type stays readable over warm cathedral light */}
        <div
          className="absolute inset-0"
          aria-hidden
          style={{
            background:
              'linear-gradient(180deg, rgba(15,43,34,0.55) 0%, rgba(15,43,34,0.28) 38%, rgba(15,43,34,0.72) 72%, rgba(15,43,34,0.92) 100%), radial-gradient(ellipse 80% 55% at 50% 40%, rgba(15,43,34,0.15) 0%, rgba(15,43,34,0.55) 100%)',
          }}
        />
        <div className="choir-hero-ambient opacity-40" aria-hidden />

        <div className="apple-content relative z-10 flex min-h-[min(92svh,860px)] flex-col items-center justify-end px-6 pb-16 pt-28 text-center sm:justify-center sm:pb-20 sm:pt-24">
          <p className="text-[17px] font-semibold tracking-[0.02em] text-[#f5c24c] drop-shadow-[0_1px_12px_rgba(0,0,0,0.35)]">
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
            <AppleButton variant="link" onClick={() => onNavigate('song_library')} className="!text-white/90 hover:!text-white">
              Browse songs ›
            </AppleButton>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <Reveal>
        <section className="border-b border-black/5 bg-[#fbfbfd] py-6">
          <div className="apple-content flex flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 text-center text-[12px] font-normal text-[#86868b]">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#18392f]" />
              Per-parish data isolation
            </span>
            <span>Archdiocese of Madras–Mylapore</span>
            {parishName && <span>Serving {parishName}</span>}
          </div>
        </section>
      </Reveal>

      {/* Design — one idea, huge type (Apple section model) */}
      <section id="design" className="apple-section scroll-mt-28">
        <Reveal>
          <div className="apple-content text-center">
            <p className="apple-eyebrow text-[#18392f]">Design</p>
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
            { before: 'Mass times buried in chats', after: 'A calendar every member can check, next liturgy on top.' },
            { before: 'Photocopied sheets going missing', after: 'Searchable lyrics on any phone — even mid-mass.' },
            { before: 'Payment splits on paper', after: 'Automatic singer and instrumentalist shares, tracked.' },
          ].map(({ before, after }, i) => (
            <Reveal key={before} delay={i * 0.06}>
              <div className="rounded-[28px] bg-white px-7 py-8 text-left shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <p className="text-[14px] font-normal text-[#86868b] line-through decoration-[#86868b]/50">{before}</p>
                <p className="mt-3 text-[19px] font-semibold leading-snug tracking-[-0.02em] text-[#1d1d1f]">{after}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Stats — Apple battery-style big numbers */}
      <Reveal>
        <section className="apple-section apple-section-dark">
          <div className="apple-content text-center">
            <p className="text-[17px] font-semibold text-amber-300">Built for ministry scale</p>
            <h2 className="apple-headline mt-2">Everything you need. Nothing you don&apos;t.</h2>
            <div className="mt-12 grid grid-cols-1 gap-8 sm:mt-16 sm:grid-cols-3 sm:gap-6">
              {[
                { val: 1000, suffix: '+', label: 'Hymns & songs' },
                { val: 12, suffix: '', label: 'Ministry modules' },
                { val: 5, suffix: '', label: 'Languages' },
              ].map(({ val, suffix, label }) => (
                <div key={label} className="text-center">
                  <p className="text-[clamp(2.5rem,8vw,4rem)] font-semibold tracking-[-0.04em] text-[#f5f5f7]">
                    <CountUp value={val} />{suffix}
                  </p>
                  <p className="mt-2 text-[14px] text-[#a1a1a6]">{label}</p>
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
            <p className="apple-eyebrow text-[#18392f]">Modules</p>
            <h2 className="apple-headline mt-2">One platform for the whole choir.</h2>
            <p className="apple-subhead mx-auto mt-4 max-w-xl">
              Every capability included — free for every parish.
            </p>
          </div>
        </Reveal>
        <div className="apple-content mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={(i % 4) * 0.04}>
              <SpotlightCard className="h-full rounded-[22px] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#18392f]/[0.08] text-[#18392f]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-[17px] font-semibold tracking-[-0.015em]">{title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#86868b]">{body}</p>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 text-center">
          <AppleButton variant="link" onClick={() => onNavigate('catholic_hub')} className="!text-[#2997ff]">
            Explore Catholic Hub ›
          </AppleButton>
        </div>
      </section>

      {/* How it works — dark cinematic */}
      <section id="how-it-works" className="apple-section apple-section-dark scroll-mt-28">
        <Reveal>
          <div className="apple-content text-center">
            <p className="text-[17px] font-semibold text-amber-300">How it works</p>
            <h2 className="apple-headline mt-2">Singing within minutes.</h2>
          </div>
        </Reveal>
        <div className="apple-content mt-16 grid gap-12 sm:grid-cols-3">
          {STEPS.map(({ n, title, body }, i) => (
            <Reveal key={n} delay={i * 0.08}>
              <div className="text-left sm:text-center">
                <p className="text-[40px] font-semibold tracking-[-0.04em] text-[#424245]">{n}</p>
                <h3 className="mt-2 text-[21px] font-semibold tracking-[-0.02em]">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#a1a1a6]">{body}</p>
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

      {/* Pricing — Apple "Worth the upgrade? 100%." tone */}
      <section id="pricing" className="apple-section scroll-mt-28">
        <Reveal>
          <div className="apple-content text-center">
            <p className="apple-eyebrow text-[#18392f]">Pricing</p>
            <h2 className="apple-display mt-2">
              Free.<br />For every parish.
            </h2>
            <p className="apple-subhead mx-auto mt-5 max-w-lg">
              A ministry tool, not a product. Masses, songs, accounts, AI hub, insights —
              included for every choir at no cost.
            </p>
            <p className="mt-8 text-[40px] font-semibold tracking-[-0.04em] text-[#1d1d1f]">₹0</p>
            <p className="mt-1 text-[14px] text-[#86868b]">per month, forever</p>
            <div className="mt-8">
              <AppleButton variant="primary" onClick={() => onNavigate('registration')}>
                Get started
              </AppleButton>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FAQ — accordion cards (interaction containers) */}
      <section id="faq" className="apple-section scroll-mt-28 !pt-0">
        <Reveal>
          <div className="apple-content">
            <div className="text-center">
              <h2 className="apple-headline">Questions. Answered.</h2>
            </div>
            <div className="mx-auto mt-12 max-w-2xl space-y-2">
              {FAQS.map(({ q, a }, i) => (
                <div key={q} className="overflow-hidden rounded-[18px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                    className="flex min-h-[56px] w-full items-center justify-between gap-4 px-6 py-4 text-left text-[17px] font-semibold tracking-[-0.015em] text-[#1d1d1f]"
                  >
                    {q}
                    <ChevronDown className={`h-4 w-4 shrink-0 text-[#86868b] transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <p className="border-t border-black/5 px-6 py-4 text-[15px] leading-relaxed text-[#86868b]">{a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* Final CTA band */}
      <Reveal>
        <section className="px-6 pb-24">
          <div className="apple-content overflow-hidden rounded-[28px] bg-[#18392f] px-8 py-16 text-center text-[#f5f5f7] sm:px-12">
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.03em]">
              Ready to lift your voice?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[17px] text-[#a1a1a6]">
              Join your parish choir on Choir360 — registration takes two minutes.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <AppleButton variant="gold" magnetic onClick={() => onNavigate('registration')}>
                Register as a member
              </AppleButton>
              <AppleButton variant="link" onClick={() => onNavigate('calendar')} className="!text-[#2997ff]">
                See the calendar ›
              </AppleButton>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
};
