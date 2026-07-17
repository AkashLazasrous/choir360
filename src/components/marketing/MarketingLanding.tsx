import React, { useMemo, useRef, useState } from 'react';
import {
  BarChart3, BookOpen, CalendarDays, ChevronDown, Church,
  Command, Music2, ShieldCheck, Trophy, UsersRound, ArrowUpRight,
} from 'lucide-react';
import { Language, Tab } from '../../types';
import { t } from '../../i18n/ui';
import { Reveal } from '../interactions/Reveal';
import { CountUp } from '../interactions/CountUp';
import { ProductSubnav } from '../interactions/ProductSubnav';
import { AppleButton } from '../interactions/AppleButton';
import { SpotlightCard } from '../interactions/SpotlightCard';
import {
  useEnterVeil,
  useSectionReveals,
} from '../../features/website/motion/desktopMotion';

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

  /* Lenis is mounted once from App — avoid double smooth-scroll instances */
  useSectionReveals(rootRef, true);

  const subnavLinks = useMemo(() => [
    { id: 'modules', label: t(lang, 'mktModules') },
    { id: 'how-it-works', label: t(lang, 'mktHow') },
    { id: 'pricing', label: t(lang, 'mktPricing') },
    { id: 'faq', label: t(lang, 'mktFaq') },
  ], [lang]);

  const ministries = useMemo(() => [
    { filter: 'liturgy' as const, icon: Church, title: t(lang, 'mktFeatMasses'), body: t(lang, 'mktFeatMassesBody'), tab: 'masses' as Tab, year: '01' },
    { filter: 'music' as const, icon: Music2, title: t(lang, 'mktFeatSongs'), body: t(lang, 'mktFeatSongsBody'), tab: 'song_library' as Tab, year: '02' },
    { filter: 'people' as const, icon: UsersRound, title: t(lang, 'mktFeatMembers'), body: t(lang, 'mktFeatMembersBody'), tab: 'registration' as Tab, year: '03' },
    { filter: 'liturgy' as const, icon: CalendarDays, title: t(lang, 'mktFeatCalendar'), body: t(lang, 'mktFeatCalendarBody'), tab: 'calendar' as Tab, year: '04' },
    { filter: 'ops' as const, icon: Trophy, title: t(lang, 'mktFeatAttendance'), body: t(lang, 'mktFeatAttendanceBody'), tab: 'attendance' as Tab, year: '05' },
    { filter: 'ops' as const, icon: Command, title: t(lang, 'mktFeatAi'), body: t(lang, 'mktFeatAiBody'), tab: 'ai_hub' as Tab, year: '06' },
    { filter: 'music' as const, icon: BookOpen, title: t(lang, 'mktFeatCatholic'), body: t(lang, 'mktFeatCatholicBody'), tab: 'catholic_hub' as Tab, year: '07' },
    { filter: 'ops' as const, icon: BarChart3, title: t(lang, 'mktFeatInsights'), body: t(lang, 'mktFeatInsightsBody'), tab: 'analytics' as Tab, year: '08' },
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

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    const scroller = document.querySelector('.app-main');
    if (el && scroller) {
      const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 24;
      scroller.scrollTo({ top, behavior: 'smooth' });
    } else {
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {showVeil && (
        <div className="website-enter-veil" role="dialog" aria-label="Enter Choir360">
          <p className="website-brand">Choir360</p>
          <h1>Choir360</h1>
          <p className="website-veil-sub">{t(lang, 'mktHeroDesc')}</p>
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

        {/* Sticky chapter rail — Unseen-style */}
        <nav className="website-chapters" aria-label="Sections">
          {[
            { id: 'website-hero', label: 'Intro' },
            { id: 'modules', label: 'Work' },
            { id: 'how-it-works', label: 'Process' },
            { id: 'pricing', label: 'Pricing' },
            { id: 'faq', label: 'FAQ' },
            { id: 'contact', label: 'Contact' },
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              data-chapter={c.id}
              onClick={() => scrollTo(c.id)}
            >
              {c.label}
            </button>
          ))}
        </nav>

        <section id="website-hero" className="website-hero">
          <img
            data-hero-parallax
            className="website-hero-media"
            src="/images/landing-hero.png"
            alt=""
            fetchPriority="high"
            decoding="async"
          />
          <div className="website-hero-scrim" aria-hidden />
          <div className="website-hero-copy">
            <p className="website-brand" data-reveal>Choir360</p>
            <h1 className="website-display">
              <span data-split="words">{t(lang, 'mktHeroTitle1')}</span>
              <br />
              <span className="website-display-accent" data-split="words">{t(lang, 'mktHeroTitle2')}</span>
            </h1>
            <p className="website-lede" data-reveal>{t(lang, 'mktHeroDesc')}</p>
            <div className="website-hero-cta" data-reveal>
              <AppleButton variant="gold" magnetic onClick={() => onNavigate('registration')}>
                {t(lang, 'mktJoinChoir')}
              </AppleButton>
              <button type="button" className="website-text-link" onClick={() => scrollTo('modules')}>
                Selected ministries <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="website-hero-scroll" aria-hidden>Scroll</p>
        </section>

        <div className="website-metrics" data-reveal>
          {[
            { val: 1000, suffix: '+', label: t(lang, 'mktStatHymns') },
            { val: 12, suffix: '', label: t(lang, 'mktStatModules') },
            { val: 5, suffix: '', label: t(lang, 'mktStatLanguages') },
          ].map(({ val, suffix, label }) => (
            <div key={label} className="website-metric">
              <p className="website-metric-val">
                <CountUp value={val} />
                {suffix}
              </p>
              <p className="website-metric-label">{label}</p>
            </div>
          ))}
        </div>

        <section id="modules" className="website-section website-section--work">
          <div className="website-section-head">
            <p className="website-eyebrow" data-reveal>{t(lang, 'mktModulesEyebrow')}</p>
            <h2 className="website-title" data-reveal>{t(lang, 'mktModulesTitle')}</h2>
            <p className="website-section-lede" data-reveal>
              {t(lang, 'mktModulesBody')}
            </p>
          </div>

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
            {filtered.map(({ icon: Icon, title, body, tab, year }) => (
              <button
                key={title}
                type="button"
                className="website-project"
                data-reveal
                onClick={() => onNavigate(tab)}
              >
                <span className="website-project-meta">
                  <span className="website-project-index">{year}</span>
                  <Icon className="h-5 w-5 text-amber-300" />
                </span>
                <h3>{title}</h3>
                <p>{body}</p>
                <span className="website-project-go">
                  Open <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </button>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="website-section-full website-chapter-dark" data-how-chapter>
          <div className="website-section !py-0">
            <p className="website-eyebrow" data-reveal>{t(lang, 'mktHowEyebrow')}</p>
            <h2 className="website-title website-title--wide" data-split="words">{t(lang, 'mktHowTitle')}</h2>
            <div className="website-how-layout mt-16">
              <div className="website-how-rail" aria-hidden>
                <span data-how-progress />
              </div>
              <div className="website-steps">
                {steps.map(({ n, title, body }) => (
                  <div key={n} className="website-step" data-how-step data-reveal>
                    <p className="website-step-n">{n}</p>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-14" data-reveal>
              <AppleButton variant="gold" magnetic onClick={() => onNavigate('registration')}>
                {t(lang, 'mktStartReg')}
              </AppleButton>
            </div>
          </div>
        </section>

        <section id="pricing" className="website-section website-pricing">
          <p className="website-eyebrow" data-reveal>{t(lang, 'mktPricingEyebrow')}</p>
          <h2 className="website-title mx-auto text-center" data-reveal>
            {t(lang, 'mktPricingTitle1')} {t(lang, 'mktPricingTitle2')}
          </h2>
          <p className="website-section-lede mx-auto text-center" data-reveal>{t(lang, 'mktPricingBody')}</p>
          <p className="website-price" data-reveal>₹0</p>
          <p className="website-price-sub">{t(lang, 'mktPerMonth')}</p>
          <div className="mt-8" data-reveal>
            <AppleButton variant="gold" onClick={() => onNavigate('registration')}>
              {t(lang, 'mktGetStarted')}
            </AppleButton>
          </div>
        </section>

        <section id="faq" className="website-section !pt-0">
          <h2 className="website-title text-center" data-reveal>{t(lang, 'mktFaqTitle')}</h2>
          <div className="website-faq">
            {faqs.map(({ q, a }, i) => (
              <div key={q} data-reveal className="website-faq-item">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  className="website-faq-q"
                >
                  {q}
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <p className="website-faq-a">{a}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <footer id="contact" className="website-footer">
          <div className="website-footer-inner">
            <div data-reveal>
              <p className="website-eyebrow">Say hello</p>
              <h2>{t(lang, 'mktCtaTitle')}</h2>
              <p className="website-footer-lede">{t(lang, 'mktCtaBody')}</p>
              <div className="website-footer-cta">
                <AppleButton variant="gold" magnetic onClick={() => onNavigate('registration')}>
                  {t(lang, 'mktRegisterMember')}
                </AppleButton>
                <AppleButton variant="link" onClick={() => onNavigate('calendar')} className="!text-[#7dd3fc]">
                  {t(lang, 'mktSeeCalendar')}
                </AppleButton>
              </div>
            </div>
            <div className="website-footer-meta" data-reveal>
              <p className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
                {t(lang, 'mktTrust')}
              </p>
              <p className="mt-2">{t(lang, 'mktArchdiocese')}</p>
              {parishName && <p className="mt-1">{t(lang, 'mktServing')} {parishName}</p>}
              <p className="website-copyright">© {new Date().getFullYear()} Choir360</p>
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
