import React from 'react';
import { Calculator, Download, Lock, Unlock } from 'lucide-react';
import { Payment } from '../../types';
import { formatINR } from '../../utils/currency';
import { ShareBreakdown } from '../../utils/choirStats';
import { LockedCalc } from './shared';

interface ShareCalculatorProps {
  activePayment: Payment;
  calc: ShareBreakdown;
  isLocked: boolean;
  lockedCalc?: LockedCalc;
  singerCount: number;
  instrumentalistCount: number;
  onSingerCountChange: (n: number) => void;
  onInstrumentalistCountChange: (n: number) => void;
  onLock: () => void;
  onUnlock: () => void;
}

/** Share calculation panel — summary-first on phone, full grid on desktop. */
export const ShareCalculator: React.FC<ShareCalculatorProps> = ({
  activePayment,
  calc,
  isLocked,
  lockedCalc,
  singerCount,
  instrumentalistCount,
  onSingerCountChange,
  onInstrumentalistCountChange,
  onLock,
  onUnlock,
}) => {
  const singerShare = (isLocked ? lockedCalc?.singerShare : calc.singerShare) ?? 0;
  const instrumentShare = (isLocked ? lockedCalc?.instrumentShare : calc.instrumentalistShare) ?? 0;
  const unitValue = (isLocked ? lockedCalc?.unitValue : calc.unitValue) ?? 0;
  const totalUnits = isLocked ? lockedCalc?.totalUnits : calc.totalUnits;

  return (
    <div className="apple-hero-soft relative space-y-5 p-5 font-apple sm:p-6 md:p-8">
      <div className="relative flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-[#f5c24c]/30 bg-[#f5c24c]/15 p-2.5 text-[#f5c24c]">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h3 className="flex flex-wrap items-center gap-2 text-[17px] font-semibold tracking-[-0.02em] text-[#f5f5f7]">
              Share calculator
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                isLocked ? 'bg-[rgba(48,209,88,0.2)] text-[#30d158]' : 'bg-white/10 text-amber-300'
              }`}>
                {isLocked ? 'Locked' : 'Live'}
              </span>
            </h3>
            <p className="mt-0.5 text-[13px] text-[#a1a1a6]">
              {activePayment.massType} · {activePayment.partyName}
            </p>
          </div>
        </div>
        {isLocked ? (
          <button type="button" onClick={onUnlock} className="btn-pill btn-pill-secondary !min-h-[44px] !bg-white/10 !text-[#ff453a]">
            <Unlock className="h-4 w-4" /> Unlock
          </button>
        ) : (
          <button type="button" onClick={onLock} className="btn-pill btn-pill-gold !min-h-[44px]">
            <Lock className="h-4 w-4" /> Lock &amp; Disburse
          </button>
        )}
      </div>

      {/* Mobile summary first */}
      <div className="relative grid grid-cols-2 gap-3 md:hidden">
        <div className="rounded-2xl bg-black/25 p-4 text-center">
          <p className="text-[12px] text-[#a1a1a6]">Per singer</p>
          <p className="mt-1 text-[22px] font-semibold tabular-nums text-[#f5f5f7]">{formatINR(singerShare)}</p>
        </div>
        <div className="rounded-2xl bg-black/25 p-4 text-center">
          <p className="text-[12px] text-[#a1a1a6]">Per musician</p>
          <p className="mt-1 text-[22px] font-semibold tabular-nums text-amber-300">{formatINR(instrumentShare)}</p>
        </div>
        <div className="col-span-2 rounded-2xl bg-black/25 p-4 text-center">
          <p className="text-[12px] text-[#a1a1a6]">Total distributed</p>
          <p className="mt-1 text-[24px] font-semibold tabular-nums text-[#30d158]">
            {formatINR(singerShare * singerCount + instrumentShare * instrumentalistCount)}
          </p>
        </div>
      </div>

      <div className="relative grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        <div className="space-y-4">
          <h4 className="text-[13px] font-medium text-amber-300">Attendance</h4>
          {[
            { label: 'Singers (×1)', val: singerCount, set: onSingerCountChange, max: 20 },
            { label: 'Instrumentalists (×2)', val: instrumentalistCount, set: onInstrumentalistCountChange, max: 10 },
          ].map(({ label, val, set, max }) => (
            <div key={label} className="space-y-2 rounded-2xl bg-black/25 p-3.5">
              <div className="flex justify-between text-[14px] text-[#a1a1a6]">
                <span>{label}</span>
                <span className="font-semibold tabular-nums text-[#f5f5f7]">{val}</span>
              </div>
              <input
                type="range"
                min={0}
                max={max}
                value={val}
                disabled={isLocked}
                onChange={(e) => set(Number(e.target.value))}
                className="w-full accent-amber-300 disabled:opacity-40"
              />
            </div>
          ))}
        </div>

        <div className="hidden flex-col justify-between rounded-2xl bg-black/25 p-6 md:flex">
          <h4 className="mb-4 text-[13px] font-medium text-amber-300">Split summary</h4>
          <div className="space-y-3 text-[14px]">
            {[
              { label: 'Gross amount', val: formatINR(activePayment.promisedAmount) },
              { label: 'Total units', val: `${totalUnits} units` },
              { label: 'Unit value', val: formatINR(unitValue) },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-[#86868b]">{label}</span>
                <span className="font-semibold tabular-nums text-[#f5f5f7]">{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden space-y-4 md:block">
          <h4 className="text-[13px] font-medium text-amber-300">Disbursement</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-black/25 p-4 text-center">
              <p className="text-[12px] text-[#86868b]">Per singer</p>
              <p className="mt-1 text-[20px] font-semibold tabular-nums text-[#f5f5f7]">{formatINR(singerShare)}</p>
            </div>
            <div className="rounded-2xl bg-black/25 p-4 text-center">
              <p className="text-[12px] text-[#86868b]">Per musician</p>
              <p className="mt-1 text-[20px] font-semibold tabular-nums text-amber-300">{formatINR(instrumentShare)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => alert(`Audit for ${activePayment.partyName}\nProposed: ${formatINR(activePayment.promisedAmount)}\nSingers (${singerCount}): ${formatINR(calc.singerShare)} each\nInstrumentalists (${instrumentalistCount}): ${formatINR(calc.instrumentalistShare)} each`)}
            className="btn-pill btn-pill-on-dark w-full !min-h-[44px]"
          >
            <Download className="h-4 w-4" /> Export audit
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => alert(`Audit for ${activePayment.partyName}\nProposed: ${formatINR(activePayment.promisedAmount)}\nSingers (${singerCount}): ${formatINR(calc.singerShare)} each\nInstrumentalists (${instrumentalistCount}): ${formatINR(calc.instrumentalistShare)} each`)}
        className="btn-pill btn-pill-on-dark relative w-full !min-h-[44px] md:hidden"
      >
        <Download className="h-4 w-4" /> Export audit
      </button>
    </div>
  );
};
