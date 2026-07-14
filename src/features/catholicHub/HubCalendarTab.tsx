import React from 'react';
import { LITURGICAL_SEASONS_2026, UPCOMING_FEASTS_2026 } from './data/liturgicalYear';

export const HubCalendarTab: React.FC = () => (
  <div className="space-y-4">
    {/* Current Season Banner */}
    <div className="rounded-3xl bg-gradient-to-r from-green-800 to-emerald-700 p-5 text-white shadow-xl">
      <p className="text-xs font-bold uppercase tracking-widest text-green-200">Current Season</p>
      <h2 className="mt-1 text-2xl font-black">Ordinary Time</h2>
      <p className="mt-1 text-sm text-green-100">
        The longest liturgical season — a time to grow in faith and discipleship.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-4 w-4 rounded-full bg-green-300" />
        <span className="text-xs font-bold text-green-100">Vestment colour: Green</span>
      </div>
    </div>

    {/* Season Guide */}
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <h3 className="mb-3 font-black text-slate-900">2026 Liturgical Year (Year C)</h3>
      <div className="space-y-2">
        {LITURGICAL_SEASONS_2026.map((s, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl p-2">
            <div
              className="h-4 w-4 flex-shrink-0 rounded-full border border-slate-200"
              style={{ backgroundColor: s.hex }}
            />
            <div className="min-w-0 flex-1">
              <span className="text-sm font-bold text-slate-800">{s.name}</span>
              <span className="ml-2 text-xs text-slate-500">
                {s.start} – {s.end}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Upcoming Feasts */}
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <h3 className="mb-3 font-black text-slate-900">Upcoming Solemnities & Feasts</h3>
      <div className="space-y-2">
        {UPCOMING_FEASTS_2026.slice(0, 8).map((f) => (
          <div key={f.date} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div
              className="flex h-10 w-10 flex-shrink-0 flex-col items-center justify-center rounded-xl border text-xs font-black"
              style={{ borderColor: f.color === 'white' ? '#e2e8f0' : f.color === 'red' ? '#dc2626' : '#6B21A8', color: f.color === 'white' ? '#475569' : f.color === 'red' ? '#dc2626' : '#6B21A8' }}
            >
              {f.date.split('-')[2]}
              <span className="text-[9px] font-semibold">
                {new Date(f.date).toLocaleDateString('en', { month: 'short' })}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800">{f.name}</p>
              <p className="text-[11px] text-slate-500">
                {f.type} · Vestment: {f.vestment}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
