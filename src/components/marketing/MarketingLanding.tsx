import React, { useMemo, useRef, useState } from 'react';
import {
  BarChart3, BookOpen, CalendarDays, ChevronDown, Church,
  Command, Music2, ShieldCheck, Trophy, UsersRound,
} from 'lucide-react';
import { Language, Tab } from '../../types';
import { t } from '../../i18n/ui';
import { Reveal } from '../interactions/Reveal';
import { CountUp } from '../interactions/CountUp';
import { ProductSubnav } from '../interactions/ProductSubnav';
import { AppleButton } from '../interactions/AppleButton';
import { SpotlightCard } from '../interactions/SpotlightCard';
import {
  useDesktopMarketingScroll,
  useEnterVeil,
  useSectionReveals,
} from '../../features/marketing/motion/desktopMotion';

interface MarketingLandingProps {
  lang: Language;
  onNavigate: (tab: Tab) => void;
  parishName?: string;
}

type MinistryFilter = 'all' | 'liturgy' | 'music' | 'people' | 'ops';

export const MarketingLanding: React.FC<MarketingLandingProps> = ({ lang, onNavigate, parishName }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [filter, setFilter] = useState<MinistryFilter>('all');
  const rootRef = useRef<HTMLDivElement>(null);
  const { show: showVeil, enter } = useEnterVeil();

  useDesktopMarketingScroll(true);
  useSectionReveals(rootRef, true);

  const subnavLinks = useMemo(() => [
    { id: 'modules', label: t(lang, 'mktModules') },
    { id: 'how-it-works', label: t(lang, 'mktHow') },
    { id: 'pricing', label: t(lang, 'mktPricing') },
    { id: 'faq', label: t(lang, 'mktFaq') },
  ], [lang]);

  const ministries = useMemo(() => [
    { filter: 'liturgy' as const, icon: Church, title: t(lang, 'mktFeatMasses'), body: t(lang, 'mktFeatMassesBody'), tab: 'masses' as Tab },
    { filter: 'music' as const, icon: Music2, title: t(lang, 'mktFeatSongs'), body: t(lang, 'mktFeatSongsBody'), tab: 'song_library' as Tab },
    { filter: 'people' as const, icon: UsersRound, title: t(lang, 'mktFeatMembers'), body: t(lang, 'mktFeatMembersBody'), tab: 'registration' as Tab },
    { filter: 'liturgy' as const, icon: CalendarDays, title: t(lang, 'mktFeatCalendar'), body: t(lang, 'mktFeatCalendarBody'), tab: 'calendar' as Tab },
    { filter: 'ops' as const, icon: Trophy, title: t(lang, 'mktFeatAttendance'), body: t(lang, 'mktFeatAttendanceBody'), tab: 'attendance' as Tab },
    { filter: 'ops' as const, icon: Command, title: t(lang, 'mktFeatAi'), body: t(lang, 'mktFeatAiBody'), tab: 'ai_hub' as Tab },
    { filter: 'music' as const, icon: BookOpen, title: t(lang, 'mktFeatCatholic'), body: t(lang, 'mktFeatCatholicBody'), tab: 'catholic_hub' as Tab },
    { filter: 'ops' as const, icon: BarChart3, title: t(lang, 'mktFeatInsights'), body: t(lang, 'mktFeatInsightsBody'), tab: 'analytics' as Tab },
  ], [lang]);

  const filtered = filter === 'all' ? ministries : ministries.filter((m) => m.filter === filter);

  const steps = useMemo(() => [
    { n: '01', title: t(lang, 'mktStep1'), body: t(lang, 'mktStep1Body') },
    { n: '02', title: t(lang, 'mktStep2'), body: t(lang, 'mktStep2Body') },
    { n: '03', title: t(lang, 'mktStep3'), body: t(lang, 'mktStep3Body') },
  ], [lang]);

  const faqs = useMemo(() => [
    { q: t(lang, 'mktFaq1q'), a: t(lang, 'mktFaq1a') },
    { q: t(lang, 'mktFaq2q'), a: t(lang, 'mktFaq2a') },
    { q: t(lang, 'mktFaq3q'), a: t(lang, 'mktFaq3a') },
    { q: t(lang, 'mktFaq4q'), a: t(lang, 'mktFaq4a') },
    { q: t(lang, 'mktFaq5q'), a: t(lang, 'mktFaq5a') },
  ], [lang]);

  const filters: { id: MinistryFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'liturgy', label: 'Liturgy' },
    { id: 'music', label: 'Music' },
    { id: 'people', label: 'People' },
    { id: 'ops', label: 'Ops' },
  ];

  return (
    <>
      {showVeil && (
        <div className="website-enter-veil" role="dialog" aria-label="Enter Choir360">
          <p className="website-brand">Choir360</p>
          <h1>Choir360</h1>
          <p className="mt-4 max-w-md text-center text-[15px] text-white/50">
            {t(lang, 'mktHeroDesc')}
          </p>
          <button type="button" className="website-enter-btn" onClick={enter}>
            Enter
          </button>
        </div>
      )}

      {/* ── Desktop cinematic website (≥1024) ─────────────────────────────── */}
      <div ref={rootRef} className="website-marketing font-apple hidden lg:block">
        <div className="website-progress" aria-hidden>
          <span id="website-scroll-progress" />
        </div>

        <section className="website-hero">
          <img
            data-hero-parallax
            className="website-hero-media"
            src="/images/landing-hero.png"
            alt=""
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0" style={{ background: 'var(--grad-hero-scrim)' }} aria-hidden />
          <div className="website-hero-copy">
            <p className="website-brand" data-reveal>Choir360</p>
            <h1 className="website-display" data-reveal>
              {t(lang, 'mktHeroTitle1')}{' '}
              <span className="text-amber-300">{t(lang, 'mktHeroTitle2')}</span>
            </h1>
            <p className="website-lede" data-reveal>{t(lang, 'mktHeroDesc')}</p>
            <div className="mt-8 flex flex-wrap gap-4" data-reveal>
              <AppleButton variant="gold" magnetic onClick={() => onNavigate('registration')}>
                {t(lang, 'mktJoinChoir')}
              </AppleButton>
              <AppleButton variant="link" onClick={() => onNavigate('song_library')} className="!text-[#7dd3fc]">
                {t(lang, 'mktBrowseSongs')}
              </AppleButton>
            </div>
          </div>
        </section>

        <div className="website-metrics" data-reveal>
          {[
            { val: 1000, suffix: '+', label: t(lang, 'mktStatHymns') },
            { val: 12, suffix: '', label: t(lang, 'mktStatModules') },
            { val: 5, suffix: '', label: t(lang, 'mktStatLanguages') },
          ].map(({ val, suffix, label }) => (
            <div key={label}>
              <p className="website-metric-val">
                <CountUp value={val} />
                {suffix}
              </p>
              <p className="website-metric-label">{label}</p>
            </div>
          ))}
        </div>

        <section id="modules" className="website-section scroll-mt-24">
          <p className="website-eyebrow" data-reveal>{t(lang, 'mktModulesEyebrow')}</p>
          <h2 className="website-title" data-reveal>{t(lang, 'mktModulesTitle')}</h2>
          <p className="mt-4 max-w-xl text-[16px] text-white/50" data-reveal>
            {t(lang, 'mktModulesBody')}
          </p>

          <div className="website-filters" data-reveal>
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                className={'website-filter' + (filter === f.id ? ' is-active' : '')}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="website-project-grid">
            {filtered.map(({ icon: Icon, title, body, tab }) => (
              <button
                key={title}
                type="button"
                className="website-project"
                data-reveal
                onClick={() => onNavigate(tab)}
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-amber-300">
                  <Icon className="h-5 w-5" />
                </span>
                <h3>{title}</h3>
                <p>{body}</p>
              </button>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="website-section-full border-t border-white/8 bg-[#050a14]">
          <div className="website-section !py-0">
            <p className="website-eyebrow" data-reveal>{t(lang, 'mktHowEyebrow')}</p>
            <h2 className="website-title" data-reveal>{t(lang, 'mktHowTitle')}</h2>
            <div className="website-steps mt-16">
              {steps.map(({ n, title, body }) => (
                <div key={n} data-reveal>
                  <p className="website-step-n">{n}</p>
                  <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-white">{title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-white/50">{body}</p>
                </div>
              ))}
            </div>
            <div className="mt-14" data-reveal>
              <AppleButton variant="gold" magnetic onClick={() => onNavigate('registration')}>
                {t(lang, 'mktStartReg')}
              </AppleButton>
            </div>
          </div>
        </section>

        <section id="pricing" className="website-section text-center">
          <p className="website-eyebrow" data-reveal>{t(lang, 'mktPricingEyebrow')}</p>
          <h2 className="website-title mx-auto" data-reveal>
            {t(lang, 'mktPricingTitle1')} {t(lang, 'mktPricingTitle2')}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-white/50" data-reveal>{t(lang, 'mktPricingBody')}</p>
          <p className="mt-10 text-[72px] font-semibold tracking-[-0.05em] text-amber-300" data-reveal>₹0</p>
          <p className="text-[13px] uppercase tracking-[0.14em] text-white/40">{t(lang, 'mktPerMonth')}</p>
          <div className="mt-8" data-reveal>
            <AppleButton variant="gold" onClick={() => onNavigate('registration')}>
              {t(lang, 'mktGetStarted')}
            </AppleButton>
          </div>
        </section>

        <section id="faq" className="website-section !pt-0">
          <h2 className="website-title text-center" data-reveal>{t(lang, 'mktFaqTitle')}</h2>
          <div className="mx-auto mt-12 max-w-2xl space-y-2">
            {faqs.map(({ q, a }, i) => (
              <div
                key={q}
                data-reveal
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  className="flex min-h-[56px] w-full items-center justify-between gap-4 px-6 py-4 text-left text-[17px] font-semibold text-white"
                >
                  {q}
                  <ChevronDown className={`h-4 w-4 shrink-0 text-white/40 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <p className="border-t border-white/10 px-6 py-4 text-[15px] leading-relaxed text-white/50">{a}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <footer className="website-footer">
          <div className="mx-auto flex max-w-[1120px] flex-wrap items-end justify-between gap-10">
            <div data-reveal>
              <p className="website-eyebrow">Say hello</p>
              <h2 className="mt-3">{t(lang, 'mktCtaTitle')}</h2>
              <p className="mt-3 max-w-md text-[16px] text-white/45">{t(lang, 'mktCtaBody')}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <AppleButton variant="gold" magnetic onClick={() => onNavigate('registration')}>
                  {t(lang, 'mktRegisterMember')}
                </AppleButton>
                <AppleButton variant="link" onClick={() => onNavigate('calendar')} className="!text-[#7dd3fc]">
                  {t(lang, 'mktSeeCalendar')}
                </AppleButton>
              </div>
            </div>
            <div className="text-[13px] text-white/40" data-reveal>
              <p className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
                {t(lang, 'mktTrust')}
              </p>
              <p className="mt-2">{t(lang, 'mktArchdiocese')}</p>
              {parishName && <p className="mt-1">{t(lang, 'mktServing')} {parishName}</p>}
              <p className="mt-6 text-white/25">© {new Date().getFullYear()} Choir360</p>
            </div>
          </div>
        </footer>
      </div>

      {/* ── Mobile / tablet fallback (unchanged structure) ─────────────────── */}
      <div className="font-apple -mx-4 animate-fade-in grad-tranquil text-[#0f172a] sm:-mx-6 lg:hidden">
        <ProductSubnav
          title="Choir360"
          links={subnavLinks}
          ctaLabel={t(lang, 'mktJoin')}
          onCta={() => onNavigate('registration')}
        />

        <section className="relative min-h-[min(92svh,860px)] overflow-hidden bg-[#050a14] text-[#f5f5f7]">
          <img
            src="/images/landing-hero.png"
            alt=""
            className="choir-hero-photo absolute inset-0 h-full w-full object-cover object-[center_35%]"
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0" aria-hidden style={{ background: 'var(--grad-hero-scrim)' }} />
          <div className="apple-content relative z-10 flex min-h-[min(92svh,860px)] flex-col items-center justify-end px-6 pb-16 pt-28 text-center sm:justify-center sm:pb-20 sm:pt-24">
            <p
              className="text-[17px] font-semibold tracking-[0.02em] text-transparent"
              style={{ backgroundImage: 'var(--grad-gold)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}
            >
              Choir360
            </p>
            <h1 className="mt-3 max-w-3xl text-[clamp(2.75rem,8vw,5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-white">
              {t(lang, 'mktHeroTitle1')}<br className="hidden sm:block" /> {t(lang, 'mktHeroTitle2')}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[19px] text-[#e8e8ed]/[0.92]">
              {t(lang, 'mktHeroDesc')}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <AppleButton variant="gold" magnetic onClick={() => onNavigate('registration')}>
                {t(lang, 'mktJoinChoir')}
              </AppleButton>
              <AppleButton variant="link" onClick={() => onNavigate('song_library')} className="!text-[#7dd3fc]">
                {t(lang, 'mktBrowseSongs')}
              </AppleButton>
            </div>
          </div>
        </section>

        <Reveal>
          <section className="border-b border-black/5 grad-hydrogen py-6">
            <div className="apple-content flex flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 text-center text-[12px] font-medium text-[#0c4a6e]/80">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#0e7490]" />
                {t(lang, 'mktTrust')}
              </span>
              <span>{t(lang, 'mktArchdiocese')}</span>
              {parishName && <span>{t(lang, 'mktServing')} {parishName}</span>}
            </div>
          </section>
        </Reveal>

        <section id="modules-mobile" className="apple-section">
          <Reveal>
            <div className="apple-content text-center">
              <p className="apple-eyebrow grad-text-maldives">{t(lang, 'mktModulesEyebrow')}</p>
              <h2 className="apple-headline mt-2">{t(lang, 'mktModulesTitle')}</h2>
            </div>
          </Reveal>
          <div className="apple-content mt-10 grid gap-3 sm:grid-cols-2">
            {ministries.slice(0, 6).map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={(i % 2) * 0.04}>
                <SpotlightCard className="h-full rounded-[22px] bg-white/90 p-6 shadow-[0_2px_12px_rgba(14,61,76,0.06)] ring-1 ring-black/[0.03]">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full grad-icon-well">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-[17px] font-semibold">{title}</h3>
                  <p className="mt-2 text-[14px] text-[#64748b]">{body}</p>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="apple-section grad-deep-sea text-center text-[#f5f5f7]">
          <h2 className="text-[clamp(1.75rem,5vw,2.5rem)] font-semibold">{t(lang, 'mktCtaTitle')}</h2>
          <div className="mt-6">
            <AppleButton variant="gold" onClick={() => onNavigate('registration')}>
              {t(lang, 'mktRegisterMember')}
            </AppleButton>
          </div>
        </section>
      </div>
    </>
  );
};
