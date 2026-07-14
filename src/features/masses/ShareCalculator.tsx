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

/** Dark "Share Calculation Engine" panel: weighted split with lock/disburse. */
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
}) => (
  <div className="bg-slate-900 text-slate-100 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-700 pb-4 gap-4">
      <div className="flex items-center gap-3">
        <div className="bg-emerald-950 border border-emerald-800 text-emerald-400 p-2 rounded-xl">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-white flex items-center gap-2">
            Share Calculation Engine
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
              isLocked ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-800 text-amber-400'}`}>
              {isLocked ? 'LOCKED' : 'LIVE'}
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            {activePayment.massType} · Sponsor: <strong className="text-slate-200">{activePayment.partyName}</strong>
          </p>
        </div>
      </div>
      <div>
        {isLocked ? (
          <button onClick={onUnlock}
            className="px-4 py-2.5 min-h-[44px] bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition">
            <Unlock className="w-4 h-4" /> Unlock Editing
          </button>
        ) : (
          <button onClick={onLock}
            className="px-4 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition">
            <Lock className="w-4 h-4" /> Lock & Disburse
          </button>
        )}
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Controls */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-emerald-400 uppercase font-mono">Attendance Parameters</h4>
        {[
          { label: 'Present Singers (Weight = 1)', val: singerCount, set: onSingerCountChange, max: 20 },
          { label: 'Present Instrumentalists (Weight = 2)', val: instrumentalistCount, set: onInstrumentalistCountChange, max: 10 },
        ].map(({ label, val, set, max }) => (
          <div key={label} className="bg-slate-800 p-3.5 rounded-xl border border-slate-700 space-y-2">
            <div className="flex justify-between text-xs text-slate-300">
              <span>{label}</span>
              <span className="font-mono font-bold text-white text-sm">{val}</span>
            </div>
            <input type="range" min={0} max={max} value={val} disabled={isLocked}
              onChange={(e) => set(Number(e.target.value))}
              className="w-full accent-emerald-500 disabled:opacity-40" />
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col justify-between">
        <h4 className="text-xs font-bold text-emerald-400 uppercase font-mono mb-4">Choral Split Summary</h4>
        <div className="space-y-3 text-xs">
          {[
            { label: 'Gross Amount',    val: formatINR(activePayment.promisedAmount), cls: 'text-white' },
            { label: 'Total Units',     val: `${isLocked ? lockedCalc?.totalUnits : calc.totalUnits} units`, cls: 'text-slate-200' },
            { label: 'Unit Value',      val: formatINR((isLocked ? lockedCalc?.unitValue : calc.unitValue) ?? 0), cls: 'text-emerald-400 text-sm font-extrabold' },
          ].map(({ label, val, cls }) => (
            <div key={label} className="flex justify-between border-b border-slate-700 pb-2">
              <span className="text-slate-400">{label}</span>
              <span className={`font-bold font-mono ${cls}`}>{val}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-emerald-300/70 font-mono mt-4 bg-emerald-950 p-2 rounded">
          {formatINR(activePayment.promisedAmount)} / ({singerCount}×1 + {instrumentalistCount}×2)
        </p>
      </div>

      {/* Per-member shares */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-emerald-400 uppercase font-mono">Disbursement Shares</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center space-y-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Per Singer</p>
            <p className="text-xl font-extrabold text-white font-mono">
              {formatINR((isLocked ? lockedCalc?.singerShare : calc.singerShare) ?? 0)}
            </p>
            <p className="text-[9px] text-emerald-400">Weight 1×</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center space-y-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Per Musician</p>
            <p className="text-xl font-extrabold text-amber-400 font-mono">
              {formatINR((isLocked ? lockedCalc?.instrumentShare : calc.instrumentalistShare) ?? 0)}
            </p>
            <p className="text-[9px] text-amber-400">Weight 2×</p>
          </div>
        </div>

        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-xs text-center">
          <p className="text-slate-400">Total distributed</p>
          <p className="text-lg font-extrabold text-emerald-400 font-mono">
            {formatINR(
              ((isLocked ? lockedCalc?.singerShare : calc.singerShare) ?? 0) * singerCount +
              ((isLocked ? lockedCalc?.instrumentShare : calc.instrumentalistShare) ?? 0) * instrumentalistCount
            )}
          </p>
        </div>

        <button
          onClick={() => alert(`Audit for ${activePayment.partyName}\nProposed: ${formatINR(activePayment.promisedAmount)}\nSingers (${singerCount}): ${formatINR(calc.singerShare)} each\nInstrumentalists (${instrumentalistCount}): ${formatINR(calc.instrumentalistShare)} each`)}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-700 transition">
          <Download className="w-3.5 h-3.5" /> Export Audit Report
        </button>
      </div>
    </div>
  </div>
);
