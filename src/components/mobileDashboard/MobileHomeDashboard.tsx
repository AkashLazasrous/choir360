import React, { useMemo, useState } from 'react';
import { getISTGreeting } from '../../utils/timezone';
import { calculateChoirHealth, isActiveMember, sumPendingCollections } from '../../utils/choirStats';
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

/**
 * Award-style mobile Home surface — all 10 patterns.
 * Desktop callers should wrap with `lg:hidden` and keep legacy UI for `lg:`.
 */
export const MobileHomeDashboard: React.FC<MobileDashboardData> = ({
  variant,
  members,
  masses,
  rehearsals = [],
  payments,
  events,
  attendanceRecords = [],
  member = null,
  loading = false,
  isAdmin = false,
  onSaveLiturgySongNotes,
  onRemoveLiturgyLog,
  onNavigate,
}) => {
  const [range, setRange] = useState<TimeRange>('W');
  const [sheet, setSheet] = useState<BentoWidgetKey | null>(null);

  const greeting = useMemo(() => getISTGreeting(), []);
  const streak = useMemo(
    () => choirStreakDays(members, member),
    [members, member],
  );
  const metrics = useMemo(
    () => buildMetricCards(members, payments, member),
    [members, payments, member],
  );
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

  if (loading) {
    return (
      <div className="md-oled-surface font-apple -mx-3 px-3 py-3 sm:-mx-4 sm:px-4 lg:hidden">
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
        <div className="space-y-3 text-[14px] text-[#a1a1a6]">
          <p className="text-[32px] font-semibold text-amber-200">{streak} days</p>
          <p>
            Derived from gamification + attendance rate
            {member ? ` for ${member.firstName}` : ' across the choir'}.
          </p>
          <button
            type="button"
            className="btn-pill btn-pill-gold mt-2 !min-h-[44px]"
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
          <p className="text-[20px] font-semibold text-[#f5f5f7]">{nextMass.name}</p>
          <p className="text-[14px] text-[#a1a1a6]">
            {nextMass.date} · {nextMass.time}
            {nextMass.venue ? ` · ${nextMass.venue}` : ''}
          </p>
          <button
            type="button"
            className="btn-pill btn-pill-gold !min-h-[44px]"
            onClick={() => {
              setSheet(null);
              onNavigate('masses');
            }}
          >
            Open liturgy desk
          </button>
        </div>
      ) : (
        <p className="text-[14px] text-[#86868b]">No mass logged yet.</p>
      ),
    },
    active_members: {
      title: 'Active choralists',
      subtitle: `${health.pendingCount} pending approval`,
      body: (
        <div className="space-y-3">
          <p className="text-[28px] font-semibold text-teal-200">{active.length}</p>
          <div className="flex -space-x-2">
            {active.slice(0, 8).map((m) => (
              <img
                key={m.id}
                src={m.photoUrl}
                alt=""
                className="h-9 w-9 rounded-full border-2 border-[#0a1628] object-cover"
              />
            ))}
          </div>
          <button
            type="button"
            className="btn-pill btn-pill-gold !min-h-[44px]"
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
          <p className="text-[24px] font-semibold text-amber-200">
            {formatINR(pendingInr)}
          </p>
          <p className="text-[13px] text-[#a1a1a6]">
            {payments.filter((p) => p.status === 'Pending').length} invoices still open
          </p>
          <button
            type="button"
            className="btn-pill btn-pill-gold !min-h-[44px]"
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
          <p className="text-[22px] font-semibold text-[#f5f5f7]">{health.healthLabel}</p>
          <p className="text-[13px] text-[#a1a1a6]">
            Avg attendance {health.averageAttendance}% · {health.confirmedPercent}% confirmed
          </p>
          <button
            type="button"
            className="btn-pill btn-pill-gold !min-h-[44px]"
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
              className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-4 text-[13px] font-semibold text-[#f5f5f7]"
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

  return (
    <div className="md-oled-surface font-apple relative -mx-3 space-y-3 px-3 py-3 sm:-mx-4 sm:px-4 lg:hidden">
      {/* First viewport: brand greeting + streak only — one composition */}
      <header className="space-y-2 pb-1">
        <p className="text-[12px] font-medium text-[#86868b]">{greeting}</p>
        <h2 className="text-[26px] font-semibold leading-[1.1] tracking-[-0.035em] text-[#f5f5f7]">
          {variant === 'admin' ? 'Choir overview' : 'Your ministry'}
        </h2>
        <p className="text-[13px] leading-snug text-[#a1a1a6]">
          {variant === 'admin'
            ? `${active.length} active · ${masses.length} masses`
            : member
              ? `${member.firstName} · ${member.voiceType}`
              : 'Member desk'}
        </p>
        <StreakBanner
          days={streak}
          onClick={() => onNavigate(variant === 'admin' ? 'attendance' : 'gamification')}
        />
      </header>

      {/* Below fold: metrics, charts, bento */}
      <ContextualAlerts alerts={alerts} onNavigate={onNavigate} mode="strip" />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
            Pulse
          </p>
          <TimeRangeToggle value={range} onChange={setRange} className="md-range-on-dark" />
        </div>
        <MetricCarousel
          metrics={metrics}
          onSelect={() => setSheet('choir_health')}
        />
      </div>

      <div className="rounded-[1.25rem] border border-white/8 bg-black/50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
            Trend
          </p>
          <TimeRangeToggle value={range} onChange={setRange} />
        </div>
        <ScrubChart points={chartPoints} title="Attendance" />
      </div>

      <BentoGrid
        variant={variant}
        members={members}
        masses={masses}
        payments={payments}
        streakDays={streak}
        onNavigate={onNavigate}
        onOpenSheet={setSheet}
      />

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
      />

      {nextPractice && (
        <button
          type="button"
          onClick={() => onNavigate('calendar')}
          className="w-full rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-left"
        >
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#86868b]">
            Next rehearsal
          </p>
          <p className="mt-1 text-[15px] font-semibold text-[#f5f5f7]">
            {nextPractice.name}
          </p>
          <p className="text-[12px] text-[#86868b]">
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
