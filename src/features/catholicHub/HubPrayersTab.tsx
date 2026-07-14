import React, { useState } from 'react';
import { TAMIL_PRAYERS } from './data/prayers';

export const HubPrayersTab: React.FC = () => {
  const [prayerIdx, setPrayerIdx] = useState(0);
  const [showTamil, setShowTamil] = useState(true);
  const currentPrayer = TAMIL_PRAYERS[prayerIdx];

  return (
    <div className="space-y-4">
      {/* Prayer Nav */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TAMIL_PRAYERS.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setPrayerIdx(i)}
            className={`flex-shrink-0 rounded-xl px-3 py-2 text-xs font-bold min-h-[44px] transition-all ${
              prayerIdx === i
                ? 'bg-amber-800 text-white'
                : 'border border-slate-200 bg-white text-slate-600'
            }`}
          >
            {p.title.split('(')[0].trim()}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              {currentPrayer.category}
            </span>
            <h2 className="mt-2 text-lg font-black text-slate-900">{currentPrayer.title}</h2>
          </div>
          <button
            onClick={() => setShowTamil(!showTamil)}
            className="flex min-h-[44px] items-center gap-1 rounded-xl border border-amber-200 px-3 py-2 text-xs font-bold text-amber-800"
          >
            {showTamil ? '🇬🇧' : '🇮🇳'}
          </button>
        </div>

        <div className="rounded-2xl bg-amber-50 p-4">
          <p className="whitespace-pre-line text-sm leading-7 text-slate-800">
            {showTamil ? currentPrayer.tamil : currentPrayer.english}
          </p>
        </div>

        {/* Nav arrows */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setPrayerIdx((i) => Math.max(0, i - 1))}
            disabled={prayerIdx === 0}
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-slate-200 text-sm font-bold disabled:opacity-30"
          >
            ← Previous
          </button>
          <button
            onClick={() => setPrayerIdx((i) => Math.min(TAMIL_PRAYERS.length - 1, i + 1))}
            disabled={prayerIdx === TAMIL_PRAYERS.length - 1}
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-amber-800 text-sm font-bold text-white disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};
