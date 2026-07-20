import React, { useMemo, useState } from 'react';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { getISTGreeting } from '../../utils/timezone';
import { calculateChoirHealth, isActiveMember, sumPendingCollections } from '../../utils/choirStats';
import { computeMemberRosterStats } from '../../utils/attendanceStats';
import { formatINR } from '../../utils/currency';
import { BentoGrid } from './BentoGrid';
import { MetricCarousel } from './MetricCarousel';
import { TimeRangeToggle } from './TimeRangeToggle';
import { ScrubChart } from './ScrubChart';
import { DashboardSheet } from './DashboardSheet';
import { QuickActionFab } from './QuickActionFab';
import { StreakBanner } from './StreakBanner';
import { ContextualAlerts } from './ContextualAlerts';
import { ShimmerSkeleton } from './ShimmerSkeleton';
import {
  buildChartSeries,
  buildContextualAlerts,
  buildMetricCards,
  choirStreakDays,
} from './dashboardMetrics';
import type { BentoWidgetKey, MobileDashboardData, TimeRange } from './types';
import { LoggedLiturgySection } from '../LoggedLiturgySection';

type FeedFilter = 'overview' | 'liturgy' | 'shares';

/**
 * Aurex Living–inspired mobile Home — cream canvas, greeting-first, feature card.
 * Desktop callers wrap with `lg:hidden` and keep legacy UI for `lg:`.
 */
export const MobileHomeDashboard: React.FC<MobileDashboardData> = ({
  variant,
  members,
  masses,
  rehearsals = [],
  payments,
  paymentShares = [],
  shareSettlements = [],
  events,
  attendanceRecords = [],
  member = null,
  loading = false,
  isAdmin = false,
  onSaveLiturgySongNotes,
  onRemoveLiturgyLog,
  onClearLiturgyLog,
  onNavigate,
}) => {
  const [range, setRange] = useState<TimeRange>('W');
  const [sheet, setSheet] = useState<BentoWidgetKey | null>(null);
  const [feed, setFeed] = useState<FeedFilter>('overview');

  const greeting = useMemo(() => getISTGreeting(), []);
  const streak = useMemo(
    () => choirStreakDays(members, member),
    [members, member],
  );
  const metrics = useMemo(
    () => buildMetricCards(
      members,
      payments,
      member,
      attendanceRecords,
      masses,
      paymentShares,
      shareSettlements,
    ),
    [members, payments, member, attendanceRecords, masses, paymentShares, shareSettlements],
  );
  const personalStats = useMemo(() => {
    if (!member) return null;
    return computeMemberRosterStats(
      attendanceRecords,
      members,
      masses,
      payments,
      paymentShares,
      shareSettlements,
    ).find((s) => s.memberId === member.id) ?? null;
  }, [member, attendanceRecords, members, masses, payments, paymentShares, shareSettlements]);
  const chartPoints = useMemo(
    () =>
      buildChartSeries(range, attendanceRecords, masses, member?.id),
    [range, attendanceRecords, masses, member?.id],
  );
  const alerts = useMemo(
    () => buildContextualAlerts({ members, masses, payments, variant, member }),
    [members, masses, payments, variant, member],
  );

  const health = calculateChoirHealth(members);
  const active = members.filter(isActiveMember);
  const nextMass = masses[0];
  const nextPractice =
    events.find((e) => e.category === 'Choir Practice') ?? events[0];
  const pendingInr = sumPendingCollections(payments);
  const heroPrice =
    variant === 'member'
      ? formatINR(personalStats?.totalShareINR ?? 0)
      : formatINR(pendingInr);
  const displayName =
    member?.firstName ?? (variant === 'admin' ? 'Admin' : 'Choir');

  if (loading) {
    return (
      <div className="md-oled-surface ax-mobile-surface font-apple -mx-3 px-3 py-3 sm:-mx-4 sm:px-4 lg:hidden">
        <ShimmerSkeleton />
      </div>
    );
  }

  const sheetCopy: Record<
    BentoWidgetKey,
    { title: string; subtitle: string; body: React.ReactNode }
  > = {
    streak: {
      title: 'Attendance streak',
      subtitle: 'Consistency fuels the liturgy',
      body: (
        <div className="space-y-3 text-[14px] text-[var(--ax-ink-secondary,#5c5c5c)]">
          <p className="text-[32px] font-semibold text-[var(--ax-ink,#121212)]">{streak} days</p>
          <p>
            Derived from gamification + attendance rate
            {member ? ` for ${member.firstName}` : ' across the choir'}.
          </p>
          <button
            type="button"
            className="ax-cta-black mt-2 w-full"
            onClick={() => {
              setSheet(null);
              onNavigate(variant === 'admin' ? 'attendance' : 'gamification');
            }}
          >
            Open streak board
          </button>
        </div>
      ),
    },
    next_liturgy: {
      title: 'Next liturgy',
      subtitle: nextMass?.category ?? 'Schedule',
      body: nextMass ? (
        <div className="space-y-3">
          <p className="text-[20px] font-semibold text-[var(--ax-ink,#121212)]">{nextMass.name}</p>
          <p className="text-[14px] text-[var(--ax-ink-secondary,#5c5c5c)]">
            {nextMass.date} · {nextMass.time}
            {nextMass.venue ? ` · ${nextMass.venue}` : ''}
          </p>
          <button
            type="button"
            className="ax-cta-black w-full"
            onClick={() => {
              setSheet(null);
              onNavigate('masses');
            }}
          >
            Open liturgy desk
          </button>
        </div>
      ) : (
        <p className="text-[14px] text-[var(--ax-ink-tertiary,#8a8a8a)]">No mass logged yet.</p>
      ),
    },
    active_members: {
      title: 'Active choralists',
      subtitle: `${health.pendingCount} pending approval`,
      body: (
        <div className="space-y-3">
          <p className="text-[28px] font-semibold text-[var(--ax-ink,#121212)]">{active.length}</p>
          <div className="flex -space-x-2">
            {active.slice(0, 8).map((m) => (
              <img
                key={m.id}
                src={m.photoUrl}
                alt=""
                className="h-9 w-9 rounded-full border-2 border-white object-cover"
              />
            ))}
          </div>
          <button
            type="button"
            className="ax-cta-black w-full"
            onClick={() => {
              setSheet(null);
              onNavigate('registration');
            }}
          >
            Manage members
          </button>
        </div>
      ),
    },
    pending_collection: {
      title: 'Pending collection',
      subtitle: 'Open invoices',
      body: (
        <div className="space-y-3">
          <p className="text-[24px] font-semibold text-[var(--ax-ink,#121212)]">
            {formatINR(pendingInr)}
          </p>
          <p className="text-[13px] text-[var(--ax-ink-secondary,#5c5c5c)]">
            {payments.filter((p) => p.status === 'Pending').length} invoices still open
          </p>
          <button
            type="button"
            className="ax-cta-black w-full"
            onClick={() => {
              setSheet(null);
              onNavigate('masses');
            }}
          >
            Review accounts
          </button>
        </div>
      ),
    },
    choir_health: {
      title: 'Choir health',
      subtitle: `Score ${health.healthScore} / 100`,
      body: (
        <div className="space-y-3">
          <p className="text-[22px] font-semibold text-[var(--ax-ink,#121212)]">{health.healthLabel}</p>
          <p className="text-[13px] text-[var(--ax-ink-secondary,#5c5c5c)]">
            Avg attendance {health.averageAttendance}% · {health.confirmedPercent}% confirmed
          </p>
          <button
            type="button"
            className="ax-cta-black w-full"
            onClick={() => {
              setSheet(null);
              onNavigate(variant === 'admin' ? 'analytics' : 'attendance');
            }}
          >
            View insights
          </button>
        </div>
      ),
    },
    quick_links: {
      title: 'Quick actions',
      subtitle: 'Jump without leaving Home',
      body: (
        <div className="grid grid-cols-2 gap-2">
          {(variant === 'admin'
            ? [
                { label: 'Log mass', tab: 'masses' as const },
                { label: 'Attendance', tab: 'attendance' as const },
                { label: 'Add member', tab: 'registration' as const },
                { label: 'Calendar', tab: 'calendar' as const },
              ]
            : [
                { label: 'Check-in', tab: 'attendance' as const },
                { label: 'Lyrics', tab: 'song_library' as const },
                { label: 'Ministry', tab: 'masses' as const },
                { label: 'Achievements', tab: 'gamification' as const },
              ]
          ).map((item) => (
            <button
              key={item.label}
              type="button"
              className="rounded-2xl border border-black/[0.06] bg-[#efebe4] px-3 py-4 text-[13px] font-semibold text-[#121212]"
              onClick={() => {
                setSheet(null);
                onNavigate(item.tab);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ),
    },
  };

  const showOverview = feed === 'overview';
  const showLiturgy = feed === 'overview' || feed === 'liturgy';
  const showShares = feed === 'overview' || feed === 'shares';

  return (
    <div className="md-oled-surface ax-mobile-surface font-apple relative -mx-3 space-y-4 px-3 py-3 sm:-mx-4 sm:px-4 lg:hidden">
      {/* Aurex greeting — Hey Name */}
      <header className="space-y-3 pb-0.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-[var(--ax-ink-tertiary,#8a8a8a)]">
              {greeting}
            </p>
            <h2 className="mt-0.5 text-[32px] font-semibold leading-[1.05] tracking-[-0.04em] text-[var(--ax-ink,#121212)]">
              Hey {displayName}
            </h2>
            <p className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-[var(--ax-ink-secondary,#5c5c5c)]">
              <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <span className="truncate">
                {variant === 'admin'
                  ? `${active.length} active · ${masses.length} liturgies`
                  : member
                    ? `${member.voiceType} · ministry desk`
                    : 'Member desk'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(
            [
              { id: 'overview' as const, label: 'Overview' },
              { id: 'liturgy' as const, label: 'Liturgy' },
              { id: 'shares' as const, label: 'Shares' },
            ] as const
          ).map((chip) => (
            <button
              key={chip.id}
              type="button"
              className="ax-chip shrink-0"
              aria-pressed={feed === chip.id}
              onClick={() => setFeed(chip.id)}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <StreakBanner
          days={streak}
          onClick={() => onNavigate(variant === 'admin' ? 'attendance' : 'gamification')}
        />
      </header>

      {/* Hero feature card — next liturgy (Aurex photography-first card) */}
      {showLiturgy && (
        <button
          type="button"
          className="ax-feature-card w-full text-left"
          onClick={() => (nextMass ? setSheet('next_liturgy') : onNavigate('masses'))}
        >
          <div className="ax-feature-media">
            <div className="absolute inset-0 bg-[radial-gradient(80%_70%_at_20%_10%,rgba(196,165,116,0.35),transparent_55%)]" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-4 pb-12 pt-16">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/70">
                {nextMass?.category ?? 'Liturgy'}
              </p>
              <p className="mt-1 text-[22px] font-semibold leading-tight tracking-[-0.03em] text-white">
                {nextMass?.name ?? 'No liturgy scheduled'}
              </p>
            </div>
            <span className="ax-feature-price">{heroPrice}</span>
          </div>
          <div className="space-y-3 px-4 py-3.5">
            <div className="ax-spec-row">
              <span>{nextMass?.date ?? '—'}</span>
              <span>{nextMass?.time ?? '—'}</span>
              {nextMass?.venue ? <span className="truncate">{nextMass.venue}</span> : null}
            </div>
            <span className="ax-cta-black inline-flex w-full">
              {nextMass ? 'View liturgy' : 'Open liturgy desk'}
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </button>
      )}

      {showOverview && <ContextualAlerts alerts={alerts} onNavigate={onNavigate} mode="strip" />}

      {showShares && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-semibold tracking-[-0.02em] text-[var(--ax-ink,#121212)]">
              Pulse
            </p>
            <TimeRangeToggle value={range} onChange={setRange} className="md-range-on-dark" />
          </div>
          <MetricCarousel
            metrics={metrics}
            onSelect={() => setSheet('choir_health')}
          />
        </div>
      )}

      {showOverview && (
        <div className="ax-panel rounded-[1.5rem] border border-black/[0.06] bg-white p-3 shadow-[0_10px_30px_rgba(18,18,18,0.06)]">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-semibold tracking-[-0.02em] text-[var(--ax-ink,#121212)]">
              Trend
            </p>
            <TimeRangeToggle value={range} onChange={setRange} />
          </div>
          <ScrubChart points={chartPoints} title="Attendance" />
        </div>
      )}

      {showOverview && (
        <BentoGrid
          variant={variant}
          members={members}
          masses={masses}
          payments={payments}
          streakDays={streak}
          personalShareInr={personalStats?.totalShareINR ?? 0}
          personalAttendancePercent={personalStats?.finalPercent}
          onNavigate={onNavigate}
          onOpenSheet={setSheet}
        />
      )}

      {showLiturgy && (
        <LoggedLiturgySection
          variant="mobile"
          masses={masses}
          rehearsals={rehearsals}
          attendanceRecords={attendanceRecords}
          isAdmin={isAdmin}
          limit={5}
          onNavigate={onNavigate}
          onSaveSongNotes={onSaveLiturgySongNotes}
          onRemoveLog={onRemoveLiturgyLog}
          onClearLog={onClearLiturgyLog}
        />
      )}

      {showOverview && nextPractice && (
        <button
          type="button"
          onClick={() => onNavigate('calendar')}
          className="w-full rounded-[1.5rem] border border-black/[0.06] bg-white px-4 py-3.5 text-left shadow-[0_10px_30px_rgba(18,18,18,0.06)]"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--ax-ink-tertiary,#8a8a8a)]">
            Next rehearsal
          </p>
          <p className="mt-1 text-[16px] font-semibold tracking-[-0.02em] text-[var(--ax-ink,#121212)]">
            {nextPractice.name}
          </p>
          <p className="text-[12px] text-[var(--ax-ink-secondary,#5c5c5c)]">
            {nextPractice.date} · {nextPractice.time}
          </p>
        </button>
      )}

      <div className="h-16" aria-hidden />

      <QuickActionFab variant={variant} onNavigate={onNavigate} />

      {sheet && (
        <DashboardSheet
          open={!!sheet}
          onClose={() => setSheet(null)}
          title={sheetCopy[sheet].title}
          subtitle={sheetCopy[sheet].subtitle}
        >
          {sheetCopy[sheet].body}
        </DashboardSheet>
      )}
    </div>
  );
};

export default MobileHomeDashboard;
