import React, { useState } from 'react';
import {
  ArrowUpRight, BarChart3, BookOpen, CalendarDays, ChevronDown, Church,
  Command, IndianRupee, Mic2, Music2, ShieldCheck, Sparkles, Star,
  Trophy, UsersRound,
} from 'lucide-react';
import { Tab } from '../../types';
import { Reveal } from '../interactions/Reveal';
import { CountUp } from '../interactions/CountUp';
import { MagneticButton } from '../interactions/MagneticButton';

interface MarketingLandingProps {
  onNavigate: (tab: Tab) => void;
  parishName?: string;
}

const FEATURES = [
  { icon: Church, title: 'Masses & Accounts', body: 'Log every liturgy, propose payment shares between singers and instrumentalists, and track collections to the rupee.' },
  { icon: Music2, title: 'Song Library', body: 'A searchable Tamil hymn library with lyrics, page references, and category filters — including Jebathotta Jeyageethangal.' },
  { icon: UsersRound, title: 'Member Management', body: 'Self-service registration with admin approval, voice-part rosters, and private contact details kept private.' },
  { icon: CalendarDays, title: 'Unified Calendar', body: 'Masses, rehearsals, and parish events in one calendar so nobody misses a call time.' },
  { icon: Trophy, title: 'Attendance & Achievements', body: 'Mark attendance in one tap and celebrate consistency with streaks and badges.' },
  { icon: Command, title: 'AI Hub', body: 'Draft announcements, suggest hymns for the liturgical season, and answer choir questions with AI assistance.' },
  { icon: BookOpen, title: 'Daily Readings & Catholic Hub', body: 'Daily gospel readings, Tamil prayers, saints of the day, and the liturgical year at a glance.' },
  { icon: BarChart3, title: 'Insights', body: 'Choir health scores, attendance trends, and financial summaries for parish reporting.' },
];

const STEPS = [
  { n: '01', title: 'Register your details', body: 'Fill in the member form with your voice part and parish. It takes under two minutes on any phone.' },
  { n: '02', title: 'Get approved', body: 'Your choir admin reviews and approves your application — you are notified the moment it happens.' },
  { n: '03', title: 'Sing with everything in one place', body: 'See upcoming masses, rehearsal times, hymn lyrics, and your attendance record from a single dashboard.' },
];

const FAQS = [
  { q: 'Is Choir360 free for our parish?', a: 'Yes. Choir360 is free for parish choirs. There are no subscriptions, seat limits, or locked features.' },
  { q: 'Who can see my personal details?', a: 'Only you and your choir administrators. Contact details are stored separately from the public roster and protected by per-parish security rules.' },
  { q: 'Does it work on mobile?', a: 'Yes — the whole app is designed mobile-first, with bottom navigation, large touch targets, and offline-friendly song lyrics.' },
  { q: 'Can we manage money for special masses?', a: 'Yes. Admins can propose amounts for special masses, split shares between singers and instrumentalists, and track what has been received.' },
  { q: 'What if our choir sings in Tamil and English?', a: 'The song library, prayers, and daily readings support Tamil and English side by side, with phonetic search (type "anbe" to find அன்பே).' },
];

export const MarketingLanding: React.FC<MarketingLandingProps> = ({ onNavigate, parishName }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="space-y-16 pb-16 animate-fade-in">

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0f2b22] via-[#18392f] to-[#1e4035] text-white shadow-2xl">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
          <div className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl px-6 py-16 text-center sm:py-20">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">
            <Sparkles className="h-3 w-3" /> For parish choirs
          </span>
          <h1 className="mt-6 font-serif text-4xl font-bold leading-tight sm:text-5xl">
            Your choir&apos;s ministry,
            <br />
            <span className="text-amber-300">beautifully organised.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-emerald-100/80">
            Choir360 brings masses, rehearsals, hymn lyrics, attendance, and accounts
            into one place — so your choir spends less time coordinating and more time singing.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <MagneticButton
              onClick={() => onNavigate('registration')}
              className="group flex items-center gap-2 rounded-2xl bg-amber-300 px-7 py-4 text-sm font-bold text-[#18392f] shadow-[0_4px_24px_rgba(251,191,36,0.4)] transition hover:bg-amber-200 hover:shadow-[0_4px_32px_rgba(251,191,36,0.55)] active:scale-95"
            >
              Join your choir
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </MagneticButton>
            <button
              onClick={() => onNavigate('song_library')}
              className="rounded-2xl border border-white/15 bg-white/8 px-7 py-4 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/14 active:scale-95"
            >
              Browse the song library
            </button>
          </div>

          {/* Hero stats */}
          <div className="mx-auto mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-8">
            {[
              { val: 1000, suffix: '+', label: 'Hymns & Songs' },
              { val: 12, suffix: '', label: 'Ministry Modules' },
              { val: 5, suffix: '', label: 'Languages' },
            ].map(({ val, suffix, label }) => (
              <div key={label}>
                <p className="font-mono text-2xl font-extrabold text-amber-300">
                  <CountUp value={val} />{suffix}
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-200/60">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ─────────────────────────────────────────────────────── */}
      <Reveal>
        <section className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center">
          <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Per-parish data isolation with Firebase security rules
          </p>
          <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Star className="h-4 w-4 text-amber-500" />
            Built with the Archdiocese of Madras–Mylapore parishes
          </p>
          {parishName && (
            <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Church className="h-4 w-4 text-emerald-600" />
              Serving {parishName}
            </p>
          )}
        </section>
      </Reveal>

      {/* ── PROBLEM → SOLUTION ──────────────────────────────────────────────── */}
      <Reveal>
        <section className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Why Choir360</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-slate-900">From WhatsApp chaos to one calm desk</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { before: 'Mass times buried in group chats', after: 'A calendar every member can check, with the next liturgy always on top.' },
              { before: 'Photocopied lyric sheets going missing', after: 'A searchable library with lyrics that work on any phone, even mid-mass.' },
              { before: 'Payment splits worked out on paper', after: 'Automatic singer and instrumentalist shares, with received amounts tracked.' },
            ].map(({ before, after }, i) => (
              <Reveal key={before} delay={i * 0.08}>
                <div className="h-full rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold text-rose-500 line-through decoration-rose-300">{before}</p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-800">{after}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── FEATURE GRID ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl">
        <Reveal>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Everything included</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-slate-900">One platform for the whole ministry</h2>
          </div>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={(i % 4) * 0.06}>
              <article className="group h-full rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-transform group-hover:scale-105">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-slate-500">{body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <Reveal>
        <section className="mx-auto max-w-4xl rounded-[2rem] bg-[#18392f] p-8 text-white sm:p-12">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/80">How it works</p>
            <h2 className="mt-2 font-serif text-3xl font-bold">Singing within minutes</h2>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map(({ n, title, body }, i) => (
              <Reveal key={n} delay={i * 0.1}>
                <div>
                  <p className="font-mono text-3xl font-extrabold text-amber-300/40">{n}</p>
                  <h3 className="mt-2 text-sm font-bold">{title}</h3>
                  <p className="mt-1.5 text-xs leading-5 text-emerald-100/70">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 text-center">
            <button
              onClick={() => onNavigate('registration')}
              className="rounded-2xl bg-amber-300 px-6 py-3 text-sm font-bold text-[#18392f] transition hover:bg-amber-200 active:scale-95"
            >
              Start your registration
            </button>
          </div>
        </section>
      </Reveal>

      {/* ── PRICING (free) ──────────────────────────────────────────────────── */}
      <Reveal>
        <section className="mx-auto max-w-2xl rounded-2xl border-2 border-emerald-100 bg-emerald-50/50 p-8 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Pricing</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-slate-900">
            Free. <span className="text-emerald-700">For every parish.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
            Choir360 is a ministry tool, not a product. Every module — masses, songs,
            accounts, AI hub, insights — is included for every choir at no cost.
          </p>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500">
            <IndianRupee className="h-3.5 w-3.5" /> 0 per month, forever
          </p>
        </section>
      </Reveal>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <Reveal>
        <section className="mx-auto max-w-2xl">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Questions</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-slate-900">Frequently asked</h2>
          </div>
          <div className="mt-8 space-y-2">
            {FAQS.map(({ q, a }, i) => (
              <div key={q} className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                >
                  {q}
                  <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <p className="border-t border-slate-100 px-5 py-4 text-sm leading-6 text-slate-600">{a}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── FINAL CTA ───────────────────────────────────────────────────────── */}
      <Reveal>
        <section className="mx-auto max-w-4xl rounded-[2rem] bg-gradient-to-br from-amber-300 to-amber-400 p-10 text-center text-[#18392f] shadow-xl">
          <Mic2 className="mx-auto h-8 w-8" />
          <h2 className="mt-4 font-serif text-3xl font-bold">Ready to lift your voice?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-[#18392f]/80">
            Join your parish choir on Choir360 today — registration takes two minutes.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => onNavigate('registration')}
              className="rounded-2xl bg-[#18392f] px-7 py-3.5 text-sm font-bold text-amber-300 shadow-lg transition hover:bg-[#0f2b22] active:scale-95"
            >
              Register as a member
            </button>
            <button
              onClick={() => onNavigate('calendar')}
              className="rounded-2xl border-2 border-[#18392f]/20 px-7 py-3.5 text-sm font-bold transition hover:bg-[#18392f]/5 active:scale-95"
            >
              See the parish calendar
            </button>
          </div>
        </section>
      </Reveal>
    </div>
  );
};
