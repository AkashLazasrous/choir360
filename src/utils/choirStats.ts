import { Member, Payment } from '../types';

/**
 * Shared choir/finance calculations used by LandingPage, AnalyticsDashboard
 * and MassManagement. Pure functions — no React, no Firebase — so they are
 * unit-testable in isolation.
 */

// ─── Payment share calculation ────────────────────────────────────────────────
// Singers count as 1 unit, instrumentalists as 2 units.

export interface ShareBreakdown {
  totalUnits: number;
  unitValue: number;
  singerShare: number;
  instrumentalistShare: number;
}

export function calculatePaymentShares(amount: number, singers: number, instrumentalists: number): ShareBreakdown {
  const totalUnits = singers * 1 + instrumentalists * 2;
  const unitValue = totalUnits > 0 ? amount / totalUnits : 0;
  return {
    totalUnits,
    unitValue: Math.round(unitValue),
    singerShare: Math.round(unitValue),
    instrumentalistShare: Math.round(unitValue * 2),
  };
}

export function derivePaymentStatus(proposed: number, received: boolean, receivedAmount: number): 'Pending' | 'Received' {
  if (!received) return 'Pending';
  return receivedAmount >= proposed ? 'Received' : 'Pending';
}

// ─── Membership / health metrics ──────────────────────────────────────────────

export const isActiveMember = (m: Member) => m.status === 'Active Member';

export interface ChoirHealth {
  activeCount: number;
  totalCount: number;
  pendingCount: number;
  /** Mean attendanceRate of active members, rounded. 0 when no active members. */
  averageAttendance: number;
  /** 0–100 composite: active ratio (max 50) + average attendance (max 50). */
  healthScore: number;
  healthLabel: 'Excellent' | 'Good' | 'Fair' | 'Needs attention';
  /** Percentage of all members that are active. */
  confirmedPercent: number;
}

export function calculateChoirHealth(members: Member[]): ChoirHealth {
  const activeMembers = members.filter(isActiveMember);
  const activeCount = activeMembers.length;
  const totalCount = members.length;

  const averageAttendance = Math.round(
    activeMembers.reduce((sum, m) => sum + (m.attendanceRate ?? 0), 0) / Math.max(activeCount, 1),
  );
  const healthScore = Math.min(
    100,
    Math.round((activeCount / Math.max(totalCount, 1)) * 50 + averageAttendance * 0.5),
  );
  const healthLabel =
    healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Needs attention';

  return {
    activeCount,
    totalCount,
    pendingCount: members.filter((m) => m.status === 'Pending').length,
    averageAttendance,
    healthScore,
    healthLabel,
    confirmedPercent: totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0,
  };
}

// ─── Payment aggregates ───────────────────────────────────────────────────────

export const sumPendingCollections = (payments: Payment[]) =>
  payments.reduce((sum, p) => sum + p.pendingAmount, 0);

export const sumReceived = (payments: Payment[]) =>
  payments.filter((p) => p.status === 'Received').reduce((s, p) => s + (p.receivedAmount || p.promisedAmount), 0);

export const sumProposed = (payments: Payment[]) =>
  payments.reduce((s, p) => s + p.promisedAmount, 0);
