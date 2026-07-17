import { buildGamificationProfile } from '../../services/GamificationEngine';
import type {
  AttendanceRecord,
  Mass,
  Member,
  Payment,
  Tab,
} from '../../types';
import {
  calculateChoirHealth,
  isActiveMember,
  sumPendingCollections,
} from '../../utils/choirStats';
import { formatINR } from '../../utils/currency';
import type {
  ChartPoint,
  ContextualAlert,
  DashboardVariant,
  MetricCard,
  TimeRange,
} from './types';

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function rangeStart(range: TimeRange, now = new Date()): Date {
  const d = startOfDay(now);
  if (range === 'D') return d;
  if (range === 'W') {
    d.setDate(d.getDate() - 6);
    return d;
  }
  if (range === 'M') {
    d.setDate(d.getDate() - 29);
    return d;
  }
  d.setFullYear(d.getFullYear() - 1);
  return d;
}

function parseDate(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function filterByRange<T>(
  items: T[],
  getDate: (item: T) => string | undefined,
  range: TimeRange,
  now = new Date(),
): T[] {
  const from = rangeStart(range, now).getTime();
  const to = now.getTime();
  return items.filter((item) => {
    const raw = getDate(item);
    if (!raw) return false;
    const d = parseDate(raw);
    if (!d) return false;
    const t = d.getTime();
    return t >= from && t <= to + 86_400_000;
  });
}

export function choirStreakDays(members: Member[], member?: Member | null): number {
  if (member) {
    const profile = buildGamificationProfile(member);
    return Math.max(profile.streak, member.attendanceRate && member.attendanceRate >= 75 ? Math.max(1, profile.streak) : 0);
  }
  const active = members.filter(isActiveMember);
  if (active.length === 0) return 0;
  const avg = Math.round(
    active.reduce((s, m) => s + (m.attendanceRate ?? 0), 0) / active.length,
  );
  return avg >= 75 ? Math.max(3, Math.round(avg / 8)) : avg >= 50 ? 2 : 0;
}

export function buildMetricCards(
  members: Member[],
  payments: Payment[],
  member?: Member | null,
): MetricCard[] {
  const health = calculateChoirHealth(members);
  const pending = sumPendingCollections(payments);
  const openInvoices = payments.filter((p) => p.status === 'Pending').length;
  const attendanceValue = member?.attendanceRate ?? health.averageAttendance;

  return [
    {
      id: 'attendance',
      label: member ? 'Your attendance' : 'Attendance rate',
      value: `${attendanceValue}%`,
      sub: attendanceValue >= 75 ? 'Strong consistency' : 'Keep showing up',
      accent: 'teal',
      progress: attendanceValue,
    },
    {
      id: 'active',
      label: 'Active choralists',
      value: String(health.activeCount),
      sub:
        health.pendingCount > 0
          ? `${health.pendingCount} pending approval`
          : 'All members active',
      accent: 'mint',
      progress: health.confirmedPercent,
    },
    {
      id: 'pending',
      label: 'Pending ₹',
      value: formatINR(pending),
      sub: `${openInvoices} open invoice${openInvoices !== 1 ? 's' : ''}`,
      accent: 'gold',
      progress: openInvoices > 0 ? Math.min(100, openInvoices * 18) : 8,
    },
    {
      id: 'health',
      label: 'Choir health',
      value: health.healthLabel,
      sub: `Score ${health.healthScore} / 100`,
      accent: 'rose',
      progress: health.healthScore,
    },
  ];
}

/** Build scrub chart series from attendance / masses for the selected range. */
export function buildChartSeries(
  range: TimeRange,
  attendanceRecords: AttendanceRecord[],
  masses: Mass[],
  memberId?: string,
): ChartPoint[] {
  const from = rangeStart(range);
  const now = new Date();

  if (attendanceRecords.length > 0) {
    const filtered = filterByRange(
      attendanceRecords.filter((r) => !memberId || r.memberId === memberId),
      (r) => r.date,
      range,
      now,
    );

    if (range === 'D') {
      // Hourly buckets for today — sparse → single day total
      const present = filtered.filter(
        (r) => r.status === 'Present' || r.status === 'Late',
      ).length;
      const total = Math.max(filtered.length, 1);
      return [
        { label: 'AM', value: Math.round((present / total) * 70) },
        { label: 'Noon', value: Math.round((present / total) * 85) },
        { label: 'PM', value: Math.round((present / total) * 100) },
        { label: 'Eve', value: Math.round((present / total) * 92) },
      ];
    }

    // Group by day
    const byDay = new Map<string, { present: number; total: number }>();
    for (const r of filtered) {
      const key = r.date.slice(0, 10);
      const cur = byDay.get(key) ?? { present: 0, total: 0 };
      cur.total += 1;
      if (r.status === 'Present' || r.status === 'Late') cur.present += 1;
      byDay.set(key, cur);
    }

    const days: ChartPoint[] = [];
    const cursor = new Date(from);
    const step = range === 'Y' ? 14 : 1;
    while (cursor <= now) {
      const key = cursor.toISOString().slice(0, 10);
      const bucket = byDay.get(key);
      const label =
        range === 'Y'
          ? cursor.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
          : cursor.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
      days.push({
        label,
        date: key,
        value: bucket
          ? Math.round((bucket.present / Math.max(bucket.total, 1)) * 100)
          : 0,
      });
      cursor.setDate(cursor.getDate() + step);
    }

    // If almost all zeros but we have masses, fall through to mass-derived
    if (days.some((d) => d.value > 0)) {
      return days.length > 24 ? days.filter((_, i) => i % 2 === 0) : days;
    }
  }

  // Fallback: derive from mass attendance counts
  const massWindow = filterByRange(masses, (m) => m.date, range, now);
  if (massWindow.length === 0) {
    // Synthetic gentle placeholder so scrub UI still works
    const labels =
      range === 'D'
        ? ['AM', 'Noon', 'PM', 'Eve']
        : range === 'W'
          ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
          : range === 'M'
            ? ['W1', 'W2', 'W3', 'W4']
            : ['Q1', 'Q2', 'Q3', 'Q4'];
    return labels.map((label, i) => ({
      label,
      value: 55 + ((i * 11) % 35),
    }));
  }

  return massWindow
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((m) => ({
      label: new Date(m.date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      }),
      date: m.date,
      value: Math.min(
        100,
        Math.round(((m.attendingMemberIds?.length ?? 0) / 12) * 100) || 40,
      ),
    }));
}

export function buildContextualAlerts(input: {
  members: Member[];
  masses: Mass[];
  payments: Payment[];
  variant: DashboardVariant;
  member?: Member | null;
}): ContextualAlert[] {
  const { members, masses, payments, variant, member } = input;
  const alerts: ContextualAlert[] = [];
  const pending = members.filter((m) => m.status === 'Pending').length;
  const nextMass = [...masses].sort((a, b) => a.date.localeCompare(b.date))[0];
  const pendingInr = sumPendingCollections(payments);
  const health = calculateChoirHealth(members);

  if (pending > 0 && variant === 'admin') {
    alerts.push({
      id: 'pending-approvals',
      title: 'Pending approvals',
      body: `${pending} member${pending !== 1 ? 's' : ''} awaiting review`,
      tab: 'registration',
      tone: 'warn',
    });
  }

  if (nextMass) {
    const today = new Date().toISOString().slice(0, 10);
    const isTonight = nextMass.date.slice(0, 10) === today;
    alerts.push({
      id: 'next-mass',
      title: isTonight ? 'Next mass tonight' : 'Upcoming liturgy',
      body: `${nextMass.name} · ${nextMass.time}`,
      tab: 'masses',
      tone: 'gold',
    });
  }

  if (pendingInr > 0) {
    alerts.push({
      id: 'pending-inr',
      title: 'Collections open',
      body: `${formatINR(pendingInr)} still pending`,
      tab: 'masses',
      tone: 'teal',
    });
  }

  if (health.healthScore >= 80) {
    alerts.push({
      id: 'target',
      title: 'Target reached!',
      body: `Choir health is ${health.healthLabel} (${health.healthScore})`,
      tab: 'analytics',
      tone: 'teal',
    });
  }

  if (member && (member.attendanceRate ?? 0) >= 95) {
    alerts.push({
      id: 'perfect',
      title: 'Perfect streak',
      body: 'You are at 95%+ attendance — keep it up',
      tab: 'attendance',
      tone: 'gold',
    });
  }

  return alerts.slice(0, 4);
}

export function fabActions(
  variant: DashboardVariant,
  onNavigate: (tab: Tab) => void,
): { id: string; label: string; tab: Tab; onClick: () => void }[] {
  if (variant === 'admin') {
    return [
      { id: 'mass', label: 'Log Mass', tab: 'masses', onClick: () => onNavigate('masses') },
      { id: 'att', label: 'Attendance', tab: 'attendance', onClick: () => onNavigate('attendance') },
      { id: 'people', label: 'Add member', tab: 'registration', onClick: () => onNavigate('registration') },
    ];
  }
  return [
    { id: 'checkin', label: 'Check-in', tab: 'attendance', onClick: () => onNavigate('attendance') },
    { id: 'ministry', label: 'Ministry', tab: 'masses', onClick: () => onNavigate('masses') },
    { id: 'lyrics', label: 'Open lyrics', tab: 'song_library', onClick: () => onNavigate('song_library') },
  ];
}
