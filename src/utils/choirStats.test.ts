import { describe, expect, it } from 'vitest';
import {
  calculateChoirHealth,
  calculatePaymentShares,
  derivePaymentStatus,
  sumPendingCollections,
  sumProposed,
  sumReceived,
} from './choirStats';
import { Member, Payment } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const member = (overrides: Partial<Member>): Member =>
  ({
    id: `m-${Math.random().toString(36).slice(2, 8)}`,
    firstName: 'Test',
    lastName: 'Member',
    status: 'Active Member',
    memberType: 'Singer',
    voiceType: 'Soprano',
    attendanceRate: 100,
    ...overrides,
  }) as Member;

const payment = (overrides: Partial<Payment>): Payment =>
  ({
    id: `p-${Math.random().toString(36).slice(2, 8)}`,
    partyName: 'Test Party',
    mobile: '',
    massType: 'Special Mass',
    massDate: '2026-07-14',
    massTime: '09:00',
    promisedAmount: 0,
    receivedAmount: 0,
    pendingAmount: 0,
    status: 'Pending',
    ...overrides,
  }) as Payment;

// ─── calculatePaymentShares ──────────────────────────────────────────────────
// Business rule: singers weigh 1 unit, instrumentalists weigh 2 units.

describe('calculatePaymentShares', () => {
  it('splits an amount across singers (1 unit) and instrumentalists (2 units)', () => {
    // 4 singers + 2 instrumentalists = 8 units; 8000 / 8 = 1000 per unit
    const result = calculatePaymentShares(8000, 4, 2);
    expect(result.totalUnits).toBe(8);
    expect(result.unitValue).toBe(1000);
    expect(result.singerShare).toBe(1000);
    expect(result.instrumentalistShare).toBe(2000);
  });

  it('gives an instrumentalist exactly double a singer share', () => {
    const result = calculatePaymentShares(9000, 3, 3);
    expect(result.instrumentalistShare).toBe(result.singerShare * 2);
  });

  it('returns zero shares when there are no participants (no division by zero)', () => {
    const result = calculatePaymentShares(5000, 0, 0);
    expect(result.totalUnits).toBe(0);
    expect(result.unitValue).toBe(0);
    expect(result.singerShare).toBe(0);
    expect(result.instrumentalistShare).toBe(0);
  });

  it('rounds shares to whole rupees', () => {
    // 1000 / 3 units = 333.33… → 333 per singer, 667 per instrumentalist
    const result = calculatePaymentShares(1000, 1, 1);
    expect(result.singerShare).toBe(333);
    expect(result.instrumentalistShare).toBe(667);
  });

  it('handles singers-only masses', () => {
    const result = calculatePaymentShares(4000, 4, 0);
    expect(result.singerShare).toBe(1000);
    expect(result.instrumentalistShare).toBe(2000);
  });
});

// ─── derivePaymentStatus ─────────────────────────────────────────────────────

describe('derivePaymentStatus', () => {
  it('is Pending when nothing has been received', () => {
    expect(derivePaymentStatus(5000, false, 0)).toBe('Pending');
  });

  it('is Pending when only part of the amount is received', () => {
    expect(derivePaymentStatus(5000, true, 2500)).toBe('Pending');
  });

  it('is Received when the full amount is received', () => {
    expect(derivePaymentStatus(5000, true, 5000)).toBe('Received');
  });

  it('is Received when overpaid', () => {
    expect(derivePaymentStatus(5000, true, 6000)).toBe('Received');
  });
});

// ─── calculateChoirHealth ────────────────────────────────────────────────────

describe('calculateChoirHealth', () => {
  it('scores 100 for a fully active, fully attending choir', () => {
    const members = [member({}), member({}), member({})];
    const health = calculateChoirHealth(members);
    expect(health.activeCount).toBe(3);
    expect(health.averageAttendance).toBe(100);
    expect(health.healthScore).toBe(100);
    expect(health.healthLabel).toBe('Excellent');
    expect(health.confirmedPercent).toBe(100);
  });

  it('handles an empty roster without NaN', () => {
    const health = calculateChoirHealth([]);
    expect(health.activeCount).toBe(0);
    expect(health.averageAttendance).toBe(0);
    expect(health.healthScore).toBe(0);
    expect(health.healthLabel).toBe('Needs attention');
    expect(health.confirmedPercent).toBe(0);
  });

  it('blends active ratio (max 50) with average attendance (max 50)', () => {
    // 1 active of 2 total → 25 points; active attendance 80 → 40 points; total 65
    const members = [
      member({ attendanceRate: 80 }),
      member({ status: 'Pending', attendanceRate: 0 }),
    ];
    const health = calculateChoirHealth(members);
    expect(health.healthScore).toBe(65);
    expect(health.healthLabel).toBe('Good');
    expect(health.confirmedPercent).toBe(50);
    expect(health.pendingCount).toBe(1);
  });

  it('treats missing attendanceRate as zero', () => {
    const members = [member({ attendanceRate: undefined })];
    expect(calculateChoirHealth(members).averageAttendance).toBe(0);
  });

  it('labels each score band correctly', () => {
    const labelFor = (attendance: number) =>
      calculateChoirHealth([member({ attendanceRate: attendance })]).healthLabel;
    // Single active member → 50 base points + attendance/2
    expect(labelFor(100)).toBe('Excellent'); // 100
    expect(labelFor(40)).toBe('Good');       // 70
    expect(labelFor(10)).toBe('Fair');       // 55
    const empty = calculateChoirHealth([member({ status: 'Pending' })]);
    expect(empty.healthLabel).toBe('Needs attention'); // 0
  });
});

// ─── Payment aggregates ──────────────────────────────────────────────────────

describe('payment aggregates', () => {
  const payments = [
    payment({ promisedAmount: 5000, receivedAmount: 5000, pendingAmount: 0, status: 'Received' }),
    payment({ promisedAmount: 3000, receivedAmount: 1000, pendingAmount: 2000, status: 'Partial' }),
    payment({ promisedAmount: 2000, receivedAmount: 0, pendingAmount: 2000, status: 'Pending' }),
  ];

  it('sums pending collections across all payments', () => {
    expect(sumPendingCollections(payments)).toBe(4000);
  });

  it('sums received amounts for Received payments only', () => {
    expect(sumReceived(payments)).toBe(5000);
  });

  it('falls back to promisedAmount when a Received payment has no receivedAmount', () => {
    const legacy = [payment({ promisedAmount: 7000, receivedAmount: 0, status: 'Received' })];
    expect(sumReceived(legacy)).toBe(7000);
  });

  it('sums proposed amounts across all payments', () => {
    expect(sumProposed(payments)).toBe(10000);
  });
});
