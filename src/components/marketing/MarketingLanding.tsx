import React, { useMemo, useState } from 'react';
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

interface MarketingLandingProps {
  lang: Language;
  onNavigate: (tab: Tab) => void;
  parishName?: string;
}

export const MarketingLanding: React.FC<MarketingLandingProps> = ({ lang, onNavigate, parishName }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const subnavLinks = useMemo(() => [
    { id: 'design', label: t(lang, 'mktDesign') },
    { id: 'modules', label: t(lang, 'mktModules') },
    { id: 'how-it-works', label: t(lang, 'mktHow') },
    { id: 'pricing', label: t(lang, 'mktPricing') },
    { id: 'faq', label: t(lang, 'mktFaq') },
  ], [lang]);

  const features = useMemo(() => [
    { icon: Church, title: t(lang, 'mktFeatMasses'), body: t(lang, 'mktFeatMassesBody'), well: 'grad-icon-well' },
    { icon: Music2, title: t(lang, 'mktFeatSongs'), body: t(lang, 'mktFeatSongsBody'), well: 'grad-icon-well-sunset' },
    { icon: UsersRound, title: t(lang, 'mktFeatMembers'), body: t(lang, 'mktFeatMembersBody'), well: 'grad-icon-well-hydrogen' },
    { icon: CalendarDays, title: t(lang, 'mktFeatCalendar'), body: t(lang, 'mktFeatCalendarBody'), well: 'grad-icon-well-cinnamint' },
    { icon: Trophy, title: t(lang, 'mktFeatAttendance'), body: t(lang, 'mktFeatAttendanceBody'), well: 'grad-icon-well-neon' },
    { icon: Command, title: t(lang, 'mktFeatAi'), body: t(lang, 'mktFeatAiBody'), well: 'grad-icon-well-disco' },
    { icon: BookOpen, title: t(lang, 'mktFeatCatholic'), body: t(lang, 'mktFeatCatholicBody'), well: 'grad-icon-well-roseanna' },
    { icon: BarChart3, title: t(lang, 'mktFeatInsights'), body: t(lang, 'mktFeatInsightsBody'), well: 'grad-icon-well-instagram' },
  ], [lang]);

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

  const designCards = useMemo(() => [
    { before: t(lang, 'mktBefore1'), after: t(lang, 'mktAfter1'), accent: 'grad-icon-well-hydrogen' },
    { before: t(lang, 'mktBefore2'), after: t(lang, 'mktAfter2'), accent: 'grad-icon-well-sunset' },
    { before: t(lang, 'mktBefore3'), after: t(lang, 'mktAfter3'), accent: 'grad-icon-well' },
  ], [lang]);

  return (
    <div className="font-apple -mx-4 animate-fade-in grad-tranquil text-[#0f172a] sm:-mx-6 lg:-mx-8">
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
          <p
            className="text-[17px] font-semibold tracking-[0.02em] text-transparent drop-shadow-[0_1px_12px_rgba(0,0,0,0.35)]"
            style={{ backgroundImage: 'var(--grad-gold)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}
          >
            Choir360
          </p>
          <h1 className="mt-3 max-w-3xl text-[clamp(2.75rem,8vw,5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)]">
            {t(lang, 'mktHeroTitle1')}<br className="hidden sm:block" /> {t(lang, 'mktHeroTitle2')}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[19px] font-normal leading-snug tracking-[-0.01em] text-[#e8e8ed]/[0.92] drop-shadow-[0_1px_10px_rgba(0,0,0,0.4)]">
            {t(lang, 'mktHeroDesc')}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <AppleButton variant="gold" magnetic onClick={() => onNavigate('registration')}>
              {t(lang, 'mktJoinChoir')}
            </AppleButton>
            <AppleButton variant="link" onClick={() => onNavigate('song_library')} className="!text-[#7dd3fc] hover:!text-white">
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

      <section id="design" className="apple-section scroll-mt-28">
        <Reveal>
          <div className="apple-content text-center">
            <p className="apple-eyebrow grad-text-maldives">{t(lang, 'mktDesignEyebrow')}</p>
            <h2 className="apple-display mt-2">
              {t(lang, 'mktDesignTitle1')}<br />{t(lang, 'mktDesignTitle2')}
            </h2>
            <p className="apple-subhead mx-auto mt-5 max-w-2xl">
              {t(lang, 'mktDesignBody')}
            </p>
          </div>
        </Reveal>
        <div className="apple-content mt-16 grid gap-4 px-0 sm:grid-cols-3">
          {designCards.map(({ before, after, accent }, i) => (
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

      <Reveal>
        <section className="apple-section apple-section-dark">
          <div className="apple-content text-center">
            <p className="text-[17px] font-semibold text-transparent" style={{ backgroundImage: 'var(--grad-gold)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>
              {t(lang, 'mktStatsEyebrow')}
            </p>
            <h2 className="apple-headline mt-2">{t(lang, 'mktStatsTitle')}</h2>
            <div className="mt-12 grid grid-cols-1 gap-8 sm:mt-16 sm:grid-cols-3 sm:gap-6">
              {[
                { val: 1000, suffix: '+', label: t(lang, 'mktStatHymns'), tint: 'grad-text-maldives' },
                { val: 12, suffix: '', label: t(lang, 'mktStatModules'), tint: 'grad-text-sunset' },
                { val: 5, suffix: '', label: t(lang, 'mktStatLanguages'), tint: 'grad-text-maldives' },
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

      <section id="modules" className="apple-section scroll-mt-28">
        <Reveal>
          <div className="apple-content text-center">
            <p className="apple-eyebrow grad-text-maldives">{t(lang, 'mktModulesEyebrow')}</p>
            <h2 className="apple-headline mt-2">{t(lang, 'mktModulesTitle')}</h2>
            <p className="apple-subhead mx-auto mt-4 max-w-xl">
              {t(lang, 'mktModulesBody')}
            </p>
          </div>
        </Reveal>
        <div className="apple-content mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, body, well }, i) => (
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
            {t(lang, 'mktExploreHub')}
          </AppleButton>
        </div>
      </section>

      <section id="how-it-works" className="apple-section scroll-mt-28 grad-neon-lagoon text-[#f5f5f7]">
        <Reveal>
          <div className="apple-content text-center">
            <p className="text-[17px] font-semibold text-[#bbf7d0]">{t(lang, 'mktHowEyebrow')}</p>
            <h2 className="apple-headline mt-2 !text-white">{t(lang, 'mktHowTitle')}</h2>
          </div>
        </Reveal>
        <div className="apple-content mt-16 grid gap-12 sm:grid-cols-3">
          {steps.map(({ n, title, body }, i) => (
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
            {t(lang, 'mktStartReg')}
          </AppleButton>
        </div>
      </section>

      <section id="pricing" className="apple-section scroll-mt-28 grad-roseanna">
        <Reveal>
          <div className="apple-content text-center">
            <p className="apple-eyebrow text-[#9a3412]">{t(lang, 'mktPricingEyebrow')}</p>
            <h2 className="apple-display mt-2">
              {t(lang, 'mktPricingTitle1')}<br />{t(lang, 'mktPricingTitle2')}
            </h2>
            <p className="apple-subhead mx-auto mt-5 max-w-lg !text-[#7c2d12]/80">
              {t(lang, 'mktPricingBody')}
            </p>
            <p className="mt-8 text-[40px] font-semibold tracking-[-0.04em] grad-text-sunset">₹0</p>
            <p className="mt-1 text-[14px] text-[#9a3412]/70">{t(lang, 'mktPerMonth')}</p>
            <div className="mt-8">
              <AppleButton variant="primary" onClick={() => onNavigate('registration')}>
                {t(lang, 'mktGetStarted')}
              </AppleButton>
            </div>
          </div>
        </Reveal>
      </section>

      <section id="faq" className="apple-section scroll-mt-28 !pt-0">
        <Reveal>
          <div className="apple-content">
            <div className="text-center">
              <h2 className="apple-headline">{t(lang, 'mktFaqTitle')}</h2>
            </div>
            <div className="mx-auto mt-12 max-w-2xl space-y-2">
              {faqs.map(({ q, a }, i) => (
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
              {t(lang, 'mktCtaTitle')}
            </h2>
            <p className="relative mx-auto mt-3 max-w-md text-[17px] text-[#94a3b8]">
              {t(lang, 'mktCtaBody')}
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-4">
              <AppleButton variant="gold" magnetic onClick={() => onNavigate('registration')}>
                {t(lang, 'mktRegisterMember')}
              </AppleButton>
              <AppleButton variant="link" onClick={() => onNavigate('calendar')} className="!text-[#7dd3fc]">
                {t(lang, 'mktSeeCalendar')}
              </AppleButton>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
};
