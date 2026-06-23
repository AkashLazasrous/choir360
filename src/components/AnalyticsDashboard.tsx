import React from 'react';
import { Member, Mass, Payment, Language } from '../types';
import { BarChart2, IndianRupee, Layers, Users, TrendingUp, Music2, ChevronRight } from 'lucide-react';
import { MULTILINGUAL_DICTIONARY } from '../data/mockData';
import { formatINR } from '../utils/currency';
import { useParish } from '../features/parish/ParishContext';

interface AnalyticsDashboardProps {
  currentLang: Language;
  members: Member[];
  masses: Mass[];
  payments: Payment[];
}

const NoteIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M9 18V5l12-2v13" opacity="0.5"/>
    <circle cx="6" cy="18" r="3" opacity="0.5"/>
    <circle cx="18" cy="16" r="3" opacity="0.5"/>
  </svg>
);

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  currentLang, members, masses, payments,
}) => {
  const dict = MULTILINGUAL_DICTIONARY[currentLang] || MULTILINGUAL_DICTIONARY.en;
  const { selectedParish } = useParish();

  const activeMembers    = members.filter((m) => m.status === 'Active Member');
  const pendingCount     = members.filter((m) => m.status === 'Pending').length;
  const singers          = activeMembers.filter((m) => m.memberType === 'Singer');
  const instrumentalists = activeMembers.filter((m) => m.memberType !== 'Singer');

  const sopranos = singers.filter((m) => m.voiceType === 'Soprano').length;
  const altos    = singers.filter((m) => m.voiceType === 'Alto').length;
  const tenors   = singers.filter((m) => m.voiceType === 'Tenor').length;
  const basses   = singers.filter((m) => m.voiceType === 'Bass').length;
  const total    = activeMembers.length || 1;
  const pct      = (n: number) => Math.round((n / total) * 100);

  const specialMassCategories = ['Special Mass', 'Death Mass', 'Death Anniversary Mass'];
  const totalReceived  = payments.filter((p) => p.status === 'Received').reduce((s, p) => s + (p.receivedAmount || p.promisedAmount), 0);
  const totalPending   = payments.filter((p) => p.status === 'Pending').reduce((s, p) => s + p.pendingAmount, 0);
  const totalProposed  = payments.reduce((s, p) => s + p.promisedAmount, 0);
  const avgAttendance  = Math.round(activeMembers.reduce((s, m) => s + (m.attendanceRate ?? 0), 0) / Math.max(activeMembers.length, 1));
  const parishLabel    = selectedParish?.parishName ?? 'Parish';

  const voiceParts = [
    { label: 'Soprano', count: sopranos, grad: 'from-pink-500 to-rose-500',    light: 'bg-pink-50',    text: 'text-pink-700' },
    { label: 'Alto',    count: altos,    grad: 'from-violet-500 to-purple-500', light: 'bg-violet-50',  text: 'text-violet-700' },
    { label: 'Tenor',   count: tenors,   grad: 'from-amber-400 to-orange-500',  light: 'bg-amber-50',   text: 'text-amber-700' },
    { label: 'Bass',    count: basses,   grad: 'from-blue-500 to-indigo-600',   light: 'bg-blue-50',    text: 'text-blue-700' },
  ];

  const topStats = [
    { label: 'Active Choralists', value: activeMembers.length, sub: `${pendingCount} pending`, icon: Users, grad: 'from-blue-500 to-indigo-600', bar: Math.round((activeMembers.length / Math.max(members.length, 1)) * 100) },
    { label: 'Gross Received',    value: formatINR(totalReceived), sub: `${payments.filter(p=>p.status==='Received').length} payments cleared`, icon: IndianRupee, grad: 'from-emerald-500 to-teal-600', bar: totalProposed > 0 ? Math.round((totalReceived / totalProposed) * 100) : 0 },
    { label: 'Dues Outstanding',  value: formatINR(totalPending), sub: `${payments.filter(p=>p.status==='Pending').length} open invoices`, icon: TrendingUp, grad: 'from-rose-500 to-red-600', bar: totalProposed > 0 ? Math.round((totalPending / totalProposed) * 100) : 0 },
    { label: 'Liturgy Log',       value: masses.length, sub: `${masses.filter(m => specialMassCategories.includes(m.category)).length} special masses`, icon: Music2, grad: 'from-amber-400 to-orange-500', bar: Math.min(100, masses.length * 5) },
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Brand hero header ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-[#18392f] px-8 py-8 text-white shadow-xl">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-emerald-700/30 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-32 w-32 rounded-full bg-amber-400/15 blur-2xl" />
          <NoteIcon className="absolute right-10 top-6 h-20 w-20 text-amber-300/20" />
          <NoteIcon className="absolute right-28 bottom-4 h-10 w-10 text-white/10" />
        </div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1">
              <BarChart2 className="h-3.5 w-3.5 text-amber-300" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-200">Live Analytics</span>
            </div>
            <h2 className="font-serif text-3xl font-bold">Parish Choral Insights</h2>
            <p className="mt-1 text-sm text-emerald-100/70">
              {parishLabel} — vocal registers, liturgy log & fund splits
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-white/10 bg-white/8 px-5 py-3 text-center">
            <p className="text-2xl font-extrabold text-amber-300 font-mono">{members.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200/60 mt-0.5">Total Choralists</p>
          </div>
        </div>
      </section>

      {/* ── Stat cards ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {topStats.map((s) => (
          <div key={s.label} className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${s.grad} opacity-10 blur-xl group-hover:opacity-20 transition-opacity`} />
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${s.grad}`}>
              <s.icon className="h-4 w-4 text-white" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 font-mono">{s.value}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className="mt-1 text-[10px] text-slate-500">{s.sub}</p>
            <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100">
              <div className={`h-1.5 rounded-full bg-gradient-to-r ${s.grad} transition-all duration-700`} style={{ width: `${s.bar}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Voice distribution ───────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-violet-50 blur-3xl opacity-60" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#18392f]">
                <Layers className="h-4 w-4 text-amber-300" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Four-Part Harmony</h3>
                <p className="text-[10px] text-slate-400">Voice saturation analysis</p>
              </div>
            </div>

            {activeMembers.length === 0 ? (
              <div className="py-8 text-center">
                <Music2 className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No active members yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {voiceParts.map(({ label, count, grad, light, text }) => (
                  <div key={label}>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${grad} inline-block`} />
                        <span className="font-bold text-slate-700">{label}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${light} ${text}`}>
                        {count} · {pct(count)}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-r ${grad} transition-all duration-700`} style={{ width: `${pct(count)}%` }} />
                    </div>
                  </div>
                ))}

                <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                  <div className="rounded-xl bg-slate-50 p-3 text-center">
                    <p className="text-xl font-bold text-slate-800">{singers.length}</p>
                    <p className="text-[9px] font-bold uppercase text-slate-400 mt-0.5">Singers</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-center">
                    <p className="text-xl font-bold text-slate-800">{instrumentalists.length}</p>
                    <p className="text-[9px] font-bold uppercase text-slate-400 mt-0.5">Instrumentalists</p>
                  </div>
                </div>

                <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-2.5 text-[10px] text-emerald-800 font-semibold">
                  Optimal: Soprano 40% · Alto 30% · Tenor 15% · Bass 15%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Cashflow ─────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-[#18392f] p-6 text-white shadow-xl">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-300/15 blur-2xl" />
            <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-emerald-600/30 blur-2xl" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/10">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-300/20 border border-amber-300/30">
                <IndianRupee className="h-4 w-4 text-amber-300" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Liturgical Cashflow</h3>
                <p className="text-[10px] text-emerald-200/60">Offerings & dues summary</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Gross Received', val: formatINR(totalReceived), sub: `${payments.filter(p=>p.status==='Received').length} cleared`, color: 'border-emerald-500/40 bg-emerald-500/10', textColor: 'text-emerald-300' },
                { label: 'Pending Dues',   val: formatINR(totalPending),  sub: 'Awaiting clearance',                                        color: 'border-rose-500/40 bg-rose-500/10',     textColor: 'text-rose-300'   },
                { label: 'Total Proposed', val: formatINR(totalProposed), sub: `${payments.length} records`,                                color: 'border-white/10 bg-white/5',            textColor: 'text-white'      },
              ].map(({ label, val, sub, color, textColor }) => (
                <div key={label} className={`flex items-center justify-between rounded-2xl border ${color} px-4 py-3`}>
                  <div>
                    <p className="text-xs font-bold text-slate-200">{label}</p>
                    <p className="text-[10px] text-emerald-200/50 mt-0.5">{sub}</p>
                  </div>
                  <p className={`text-lg font-extrabold font-mono ${textColor}`}>{val}</p>
                </div>
              ))}
            </div>

            {payments.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 py-3 text-center">
                  <p className="text-2xl font-bold text-emerald-300">{payments.filter(p=>p.status==='Received').length}</p>
                  <p className="text-[9px] font-bold uppercase text-emerald-200/60 mt-0.5">Received</p>
                </div>
                <div className="rounded-2xl bg-amber-400/10 border border-amber-400/30 py-3 text-center">
                  <p className="text-2xl font-bold text-amber-300">{payments.filter(p=>p.status==='Pending').length}</p>
                  <p className="text-[9px] font-bold uppercase text-amber-200/60 mt-0.5">Pending</p>
                </div>
              </div>
            )}

            {payments.length === 0 && (
              <p className="mt-4 text-center text-sm text-emerald-200/40 py-4">No payment records yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Liturgy log table ────────────────────────────────────────────────── */}
      {masses.length > 0 && (
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Recent Liturgy Log</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">{masses.length} mass{masses.length !== 1 ? 'es' : ''} logged</p>
            </div>
          </div>
          <div className="space-y-2">
            {masses.slice(0, 6).map((m, i) => {
              const isSpecial = ['Special Mass', 'Death Mass', 'Death Anniversary Mass'].includes(m.category);
              return (
                <div key={m.id} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 hover:bg-slate-100 transition">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${i === 0 ? 'bg-[#18392f] text-amber-300' : isSpecial ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">{m.name}</p>
                    <p className="text-[10px] text-slate-400">{m.date} · {m.time} · {m.language}</p>
                  </div>
                  <span className={`shrink-0 rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase ${isSpecial ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>
                    {m.category}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
