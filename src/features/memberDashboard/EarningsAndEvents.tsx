import React, { useMemo } from 'react';
import { DollarSign, CalendarDays } from 'lucide-react';
import { Language, ChoirEvent, ShareCalculation, Payment } from '../../types';
import { MULTILINGUAL_DICTIONARY } from '../../data/mockData';
import { formatRegionalCurrency } from '../../utils/currency';

interface EarningsAndEventsProps {
  currentLang: Language;
  memberId: string;
  events: ChoirEvent[];
  paymentShares?: ShareCalculation[];
  payments?: Payment[];
  onUpdateEventRsvp: (eventId: string, memberId: string, status: 'Going' | 'Not Going' | 'Maybe') => void;
}

/** Earnings ledger table plus the upcoming-events RSVP list. */
export const EarningsAndEvents: React.FC<EarningsAndEventsProps> = ({
  currentLang,
  memberId,
  events,
  paymentShares = [],
  payments = [],
  onUpdateEventRsvp,
}) => {
  const dict = MULTILINGUAL_DICTIONARY[currentLang] || MULTILINGUAL_DICTIONARY.en;

  const earnings = useMemo(() => {
    const rows: Array<{ id: string; name: string; date: string; amount: number; share: number; status: string }> = [];
    for (const shareDoc of paymentShares) {
      const part = shareDoc.participatingMembers?.find((m) => m.memberId === memberId);
      if (!part) continue;
      const payment = payments.find((p) => p.id === shareDoc.paymentId);
      const status = payment?.status === 'Received' ? 'Disbursed' : (payment?.status ?? 'Pending');
      rows.push({
        id: shareDoc.id,
        name: shareDoc.massName,
        date: shareDoc.date,
        amount: shareDoc.totalAmount,
        share: part.share,
        status,
      });
    }
    return rows.sort((a, b) => b.date.localeCompare(a.date));
  }, [paymentShares, payments, memberId]);

  return (
    <>
      {/* EARNINGS LEDGER */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100" id="member-earnings-card">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            {dict.earnings}
          </h4>
          <span className="text-xs text-slate-400 font-mono">Singer ×1 · Musician ×2</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left" id="member-earnings-table">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-semibold uppercase">
                <th className="py-2.5">Mass Name</th>
                <th className="py-2.5">Date</th>
                <th className="py-2.5 text-right">Total Offer</th>
                <th className="py-2.5 text-right text-emerald-700">My Share</th>
                <th className="py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {earnings.map((earn) => (
                <tr key={earn.id}>
                  <td className="py-3.5 font-bold text-slate-800">{earn.name}</td>
                  <td className="py-3.5 text-slate-500 font-mono">{earn.date}</td>
                  <td className="py-3.5 text-right text-slate-600 font-mono">{formatRegionalCurrency(earn.amount)}</td>
                  <td className="py-3.5 text-right text-emerald-700 font-bold font-mono">{formatRegionalCurrency(earn.share)}</td>
                  <td className="py-3.5 text-right">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      earn.status === 'Disbursed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {earn.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {earnings.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No payment share records have been assigned to this member yet.
            </div>
          )}
        </div>

        <div className="mt-4 p-3 rounded-lg bg-slate-50/50 border border-slate-200/60 text-[10px] text-slate-500 leading-relaxed font-sans">
          <strong>Calculation Rules:</strong> Musicians receive double share weighting (×2); singers receive ×1.
          Shares update when an admin saves attendance on a paid mass.
        </div>
      </div>

      {/* MY EVENTS RSVP LEDGER */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100" id="member-rsvp-card">
        <h4 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-2 mb-4">
          <CalendarDays className="w-4 h-4 text-emerald-600" />
          My Scheduled Choral Events & RSVPs
        </h4>

        <div className="space-y-4">
          {events.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No choir events have been scheduled yet.
            </div>
          )}
          {events.slice(0, 3).map((evt) => {
            const currentRsvp = evt.rsvps[memberId] || 'Maybe';
            return (
              <div key={evt.id} className="p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-100 rounded text-[9px] font-bold uppercase">
                      {evt.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{evt.time}</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-800">{evt.name}</h5>
                  <p className="text-[10px] text-slate-500 font-mono">{evt.date} • {evt.location}</p>
                </div>

                {/* RSVP Buttons */}
                <div className="flex items-center gap-1">
                  {(['Going', 'Not Going', 'Maybe'] as const).map((status) => {
                    const isCurrent = currentRsvp === status;
                    return (
                      <button
                        key={status}
                        onClick={() => onUpdateEventRsvp(evt.id, memberId, status)}
                        className={`px-3 py-1 rounded text-[10px] font-bold cursor-pointer transition ${
                          isCurrent
                            ? status === 'Going' ? 'bg-emerald-600 text-white shadow-xs' :
                              status === 'Not Going' ? 'bg-rose-600 text-white shadow-xs' :
                              'bg-slate-700 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
