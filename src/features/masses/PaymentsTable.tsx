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

/** "Special Mass Payments" card: logged-mass chips plus the payments table. */
export const PaymentsTable: React.FC<PaymentsTableProps> = ({
  masses,
  payments,
  lockedCalcs,
  selectedPaymentId,
  onSelectPayment,
  onSendReminder,
}) => (
  <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 border border-amber-200">
          <IndianRupee className="w-4 h-4 text-amber-700" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Special Mass Payments</h3>
          <p className="text-[10px] text-slate-400">{payments.length} payment record{payments.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
      {payments.length > 0 && (
        <div className="flex gap-2 text-[10px] font-bold">
          <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
            {payments.filter(p=>p.status==='Received').length} cleared
          </span>
          <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
            {payments.filter(p=>p.status==='Pending').length} pending
          </span>
        </div>
      )}
    </div>

    {masses.length > 0 && (
      <div className="mb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1"><Music2 className="h-3 w-3" /> All Logged Masses ({masses.length})</p>
        <div className="flex flex-wrap gap-2">
          {masses.map((m) => (
            <span key={m.id} className={`px-2 py-1 rounded-lg text-[10px] font-semibold border ${
              isPaymentMass(m.category) ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              {m.name} · {m.date}
            </span>
          ))}
        </div>
      </div>
    )}

    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left">
        <thead>
          <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase">
            <th className="py-2.5">Sponsor / Party</th>
            <th className="py-2.5">Solemn Rite</th>
            <th className="py-2.5 text-right">Proposed</th>
            <th className="py-2.5 text-right">Pending</th>
            <th className="py-2.5 text-center">Status</th>
            <th className="py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 text-xs">
          {payments.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                No special mass payments logged yet. Select Special Mass / Death Mass above to add one.
              </td>
            </tr>
          ) : payments.map((p) => {
            const locked   = !!lockedCalcs[p.id];
            const pending  = locked ? 0 : p.pendingAmount;
            const received = p.status === 'Received' || locked;
            return (
              <tr key={p.id} className="hover:bg-slate-50 transition">
                <td className="py-3">
                  <p className="font-bold text-slate-800">{p.partyName}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{p.mobile}</p>
                </td>
                <td className="py-3">
                  <p className="font-semibold text-slate-700">{p.massType}</p>
                  <p className="text-[10px] text-slate-400">{p.massDate} · {p.massTime}</p>
                </td>
                <td className="py-3 text-right font-bold font-mono">{formatINR(p.promisedAmount)}</td>
                <td className={`py-3 text-right font-bold font-mono ${pending > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                  {formatINR(pending)}
                </td>
                <td className="py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                    received ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-amber-50 text-amber-800 border-amber-100'
                  }`}>
                    {received ? 'Received' : 'Pending'}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    {!received && (
                      <button onClick={() => onSendReminder(p)}
                        className="p-1 text-amber-700 hover:text-amber-900 bg-amber-50 border border-amber-200 rounded text-[9px] font-bold flex items-center gap-0.5 transition">
                        <Bell className="w-3 h-3" /> Remind
                      </button>
                    )}
                    <button onClick={() => onSelectPayment(p.id)}
                      className={`p-1.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                        selectedPaymentId === p.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      Calculate <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);
