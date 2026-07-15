import React from 'react';
import { ArrowUpRight, Bell, IndianRupee, Music2 } from 'lucide-react';
import { Mass, Payment } from '../../types';
import { formatINR } from '../../utils/currency';
import { LockedCalc, isPaymentMass } from './shared';

interface PaymentsTableProps {
  masses: Mass[];
  payments: Payment[];
  lockedCalcs: Record<string, LockedCalc>;
  selectedPaymentId: string;
  onSelectPayment: (paymentId: string) => void;
  onSendReminder: (payment: Payment) => void;
}

/** Special Mass Payments — card list on phone, table on desktop. */
export const PaymentsTable: React.FC<PaymentsTableProps> = ({
  masses,
  payments,
  lockedCalcs,
  selectedPaymentId,
  onSelectPayment,
  onSendReminder,
}) => (
  <div className="apple-card font-apple space-y-4 p-5 lg:col-span-2 lg:p-6">
    <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(245,194,76,0.18)]">
          <IndianRupee className="h-4 w-4 text-[#8a6a10]" />
        </div>
        <div>
          <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">Special Mass Payments</h3>
          <p className="text-[12px] text-[#86868b]">
            {payments.length} payment record{payments.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      {payments.length > 0 && (
        <div className="flex flex-wrap justify-end gap-1.5">
          <span className="apple-badge-forest">
            {payments.filter((p) => p.status === 'Received').length} cleared
          </span>
          <span className="apple-badge-gold">
            {payments.filter((p) => p.status === 'Pending').length} pending
          </span>
        </div>
      )}
    </div>

    {masses.length > 0 && (
      <div>
        <p className="apple-label mb-2 flex items-center gap-1">
          <Music2 className="h-3.5 w-3.5" /> All logged masses ({masses.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {masses.map((m) => (
            <span
              key={m.id}
              className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${
                isPaymentMass(m.category)
                  ? 'bg-[rgba(245,194,76,0.18)] text-[#8a6a10]'
                  : 'bg-black/[0.05] text-[#3a3a3c]'
              }`}
            >
              {m.name} · {m.date}
            </span>
          ))}
        </div>
      </div>
    )}

    {payments.length === 0 ? (
      <div className="apple-empty py-8">
        <p>No special mass payments logged yet. Select Special Mass / Death Mass to add one.</p>
      </div>
    ) : (
      <>
        {/* Mobile card list */}
        <div className="apple-grouped lg:hidden">
          {payments.map((p) => {
            const locked = !!lockedCalcs[p.id];
            const pending = locked ? 0 : p.pendingAmount;
            const received = p.status === 'Received' || locked;
            const selected = selectedPaymentId === p.id;
            return (
              <div key={p.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[17px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">{p.partyName}</p>
                    <p className="mt-0.5 text-[13px] text-[#86868b]">{p.mobile}</p>
                    <p className="mt-1 text-[14px] font-medium text-[#3a3a3c]">{p.massType}</p>
                    <p className="text-[12px] text-[#86868b]">{p.massDate} · {p.massTime}</p>
                  </div>
                  <span className={received ? 'apple-badge-forest' : 'apple-badge-gold'}>
                    {received ? 'Received' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-[#86868b]">Proposed</span>
                  <span className="font-semibold tabular-nums text-[#1d1d1f]">{formatINR(p.promisedAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-[#86868b]">Pending</span>
                  <span className={`font-semibold tabular-nums ${pending > 0 ? 'text-[#d70015]' : 'text-[#86868b]'}`}>
                    {formatINR(pending)}
                  </span>
                </div>
                <div className="flex gap-2 pt-1">
                  {!received && (
                    <button
                      type="button"
                      onClick={() => onSendReminder(p)}
                      className="btn-pill btn-pill-secondary btn-pill-sm flex-1 !min-h-[44px] !text-[14px]"
                    >
                      <Bell className="h-4 w-4" /> Remind
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectPayment(p.id)}
                    className={`btn-pill btn-pill-sm flex-1 !min-h-[44px] !text-[14px] ${
                      selected ? 'btn-pill-primary' : 'btn-pill-secondary'
                    }`}
                  >
                    Calculate <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-black/[0.06] text-[12px] font-medium text-[#86868b]">
                <th className="py-2.5 font-medium">Sponsor / Party</th>
                <th className="py-2.5 font-medium">Solemn Rite</th>
                <th className="py-2.5 text-right font-medium">Proposed</th>
                <th className="py-2.5 text-right font-medium">Pending</th>
                <th className="py-2.5 text-center font-medium">Status</th>
                <th className="py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] text-[14px]">
              {payments.map((p) => {
                const locked = !!lockedCalcs[p.id];
                const pending = locked ? 0 : p.pendingAmount;
                const received = p.status === 'Received' || locked;
                return (
                  <tr key={p.id} className="transition hover:bg-black/[0.02]">
                    <td className="py-3">
                      <p className="font-semibold text-[#1d1d1f]">{p.partyName}</p>
                      <p className="text-[12px] text-[#86868b]">{p.mobile}</p>
                    </td>
                    <td className="py-3">
                      <p className="font-medium text-[#3a3a3c]">{p.massType}</p>
                      <p className="text-[12px] text-[#86868b]">{p.massDate} · {p.massTime}</p>
                    </td>
                    <td className="py-3 text-right font-semibold tabular-nums">{formatINR(p.promisedAmount)}</td>
                    <td className={`py-3 text-right font-semibold tabular-nums ${pending > 0 ? 'text-[#d70015]' : 'text-[#86868b]'}`}>
                      {formatINR(pending)}
                    </td>
                    <td className="py-3 text-center">
                      <span className={received ? 'apple-badge-forest' : 'apple-badge-gold'}>
                        {received ? 'Received' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-2">
                        {!received && (
                          <button
                            type="button"
                            onClick={() => onSendReminder(p)}
                            className="btn-pill btn-pill-secondary btn-pill-sm !min-h-[36px]"
                          >
                            <Bell className="h-3.5 w-3.5" /> Remind
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectPayment(p.id)}
                          className={`btn-pill btn-pill-sm !min-h-[36px] ${
                            selectedPaymentId === p.id ? 'btn-pill-primary' : 'btn-pill-secondary'
                          }`}
                        >
                          Calculate <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    )}
  </div>
);
