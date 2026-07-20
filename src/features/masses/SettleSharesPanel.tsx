import React, { useMemo, useState } from 'react';
import { Banknote, Check, IndianRupee, Loader2, Users } from 'lucide-react';
import type { AttendanceRecord, Mass, Member, Payment, ShareCalculation, ShareSettlement } from '../../types';
import { computeMemberRosterStats } from '../../utils/attendanceStats';
import { formatINR } from '../../utils/currency';
import { isActiveMember } from '../../utils/choirStats';

export type SettleMemberResult = {
  ok: boolean;
  error?: string;
  amountSettled?: number;
};

type SettleSharesPanelProps = {
  isAdmin: boolean;
  members: Member[];
  masses: Mass[];
  payments: Payment[];
  paymentShares: ShareCalculation[];
  shareSettlements: ShareSettlement[];
  attendanceRecords: AttendanceRecord[];
  onSettleMember: (memberId: string, amount: number) => Promise<SettleMemberResult>;
};

/** Outstanding member shares from logged paid liturgies, with per-member Settle. */
export const SettleSharesPanel: React.FC<SettleSharesPanelProps> = ({
  isAdmin,
  members,
  masses,
  payments,
  paymentShares,
  shareSettlements,
  attendanceRecords,
  onSettleMember,
}) => {
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const rows = useMemo(() => {
    const roster = computeMemberRosterStats(
      attendanceRecords,
      members,
      masses,
      payments,
      paymentShares,
      shareSettlements,
    );
    return roster
      .filter((r) => {
        const member = members.find((m) => m.id === r.memberId);
        return member ? isActiveMember(member) : false;
      })
      .map((r) => ({
        memberId: r.memberId,
        name: r.memberName,
        memberType: r.memberType,
        share: r.totalShareINR,
      }))
      .sort((a, b) => b.share - a.share || a.name.localeCompare(b.name));
  }, [attendanceRecords, members, masses, payments, paymentShares, shareSettlements]);

  const withBalance = rows.filter((r) => r.share > 0);
  const totalOutstanding = withBalance.reduce((sum, r) => sum + r.share, 0);

  const handleSettle = async (memberId: string, name: string, amount: number) => {
    if (!isAdmin || amount <= 0) return;
    const ok = window.confirm(
      `Settle ${formatINR(amount)} for ${name}?\n\nTheir Share balance will become ₹0 across web and mobile until new paid liturgies are logged.`,
    );
    if (!ok) return;
    setSettlingId(memberId);
    setMessage(null);
    const result = await onSettleMember(memberId, amount);
    setSettlingId(null);
    if (result.ok) {
      setMessage(`Settled ${formatINR(result.amountSettled ?? amount)} for ${name}. Balance is now ₹0.`);
      setTimeout(() => setMessage(null), 5000);
    } else {
      setMessage(result.error ?? 'Settle failed.');
    }
  };

  return (
    <div className="apple-card font-apple space-y-4 p-5 lg:p-6">
      <div className="mb-1 flex flex-wrap items-center gap-2 border-b border-black/[0.06] pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(245,194,76,0.2)]">
          <Banknote className="h-3.5 w-3.5 text-[#8a6a10]" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">
            Settle All Logged Liturgies
          </h3>
          <p className="text-[12px] text-[#86868b]">
            Outstanding shares from paid rites · Settle clears that member’s balance to ₹0 everywhere
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#86868b]">Outstanding</p>
          <p className="text-[18px] font-semibold tabular-nums text-[#18392f]">{formatINR(totalOutstanding)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-[12px]">
        <span className="apple-badge-muted flex items-center gap-1">
          <Users className="h-3 w-3" /> {rows.length} members
        </span>
        <span className="apple-badge-gold flex items-center gap-1">
          <IndianRupee className="h-3 w-3" /> {withBalance.length} with balance
        </span>
      </div>

      {message && (
        <p className="rounded-2xl bg-[rgba(24,57,47,0.08)] px-3 py-2.5 text-[13px] font-medium text-[#18392f]">
          {message}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="apple-empty py-8 text-center text-[14px] text-[#86868b]">
          No active members yet.
        </p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-2 lg:hidden">
            {rows.map((row) => (
              <div
                key={row.memberId}
                className="flex items-center justify-between gap-3 rounded-2xl border border-black/[0.06] bg-[#fafafa] px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-[#1d1d1f]">{row.name}</p>
                  <p className="text-[12px] text-[#86868b]">{row.memberType}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[15px] font-semibold tabular-nums text-[#18392f]">
                    {formatINR(row.share)}
                  </span>
                  {isAdmin && (
                    <button
                      type="button"
                      disabled={row.share <= 0 || settlingId === row.memberId}
                      onClick={() => void handleSettle(row.memberId, row.name, row.share)}
                      className="btn-pill btn-pill-sm btn-pill-primary !min-h-[40px] disabled:opacity-40"
                    >
                      {settlingId === row.memberId
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Check className="h-3.5 w-3.5" />}
                      Settle
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black/[0.06] text-[12px] font-medium text-[#86868b]">
                  <th className="py-2.5 font-medium">Member</th>
                  <th className="py-2.5 font-medium">Role</th>
                  <th className="py-2.5 text-right font-medium">Total share</th>
                  {isAdmin && <th className="py-2.5 text-right font-medium">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] text-[14px]">
                {rows.map((row) => (
                  <tr key={row.memberId} className="hover:bg-black/[0.02]">
                    <td className="py-3 font-semibold text-[#1d1d1f]">{row.name}</td>
                    <td className="py-3 text-[#3a3a3c]">{row.memberType}</td>
                    <td className="py-3 text-right font-semibold tabular-nums text-[#18392f]">
                      {formatINR(row.share)}
                    </td>
                    {isAdmin && (
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          disabled={row.share <= 0 || settlingId === row.memberId}
                          onClick={() => void handleSettle(row.memberId, row.name, row.share)}
                          className="btn-pill btn-pill-sm btn-pill-primary !min-h-[36px] disabled:opacity-40"
                        >
                          {settlingId === row.memberId
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Check className="h-3.5 w-3.5" />}
                          Settle
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
