import React from 'react';
import { Member, Mass, Payment, Language, AttendanceRecord, ShareCalculation, ShareSettlement } from '../types';
import { BarChart2, IndianRupee, Layers, Users, TrendingUp, Music2, ChevronRight, UserCheck } from 'lucide-react';
import { MULTILINGUAL_DICTIONARY } from '../data/mockData';
import { formatINR } from '../utils/currency';
import { calculateChoirHealth, isActiveMember, sumProposed, sumReceived } from '../utils/choirStats';
import { computeParishStats } from '../utils/attendanceStats';
import { useParish } from '../features/parish/ParishContext';
import { AttendanceLeaderboard } from '../features/attendance/AttendanceLeaderboard';

interface AnalyticsDashboardProps {
  currentLang: Language;
  members: Member[];
  masses: Mass[];
  payments: Payment[];
  paymentShares?: ShareCalculation[];
  shareSettlements?: ShareSettlement[];
  attendanceRecords?: AttendanceRecord[];
}

const NoteIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M9 18V5l12-2v13" opacity="0.5"/>
    <circle cx="6" cy="18" r="3" opacity="0.5"/>
    <circle cx="18" cy="16" r="3" opacity="0.5"/>
  </svg>
);

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  currentLang, members, masses, payments, paymentShares = [], shareSettlements = [], attendanceRecords = [],
}) => {
  const dict = MULTILINGUAL_DICTIONARY[currentLang] || MULTILINGUAL_DICTIONARY.en;
  const { selectedParish } = useParish();

  const activeMembers    = members.filter(isActiveMember);
  const parishAttendance = computeParishStats(
    attendanceRecords,
    members,
    masses,
    payments,
    paymentShares,
    shareSettlements,
  );
  const { pendingCount } = calculateChoirHealth(members);
  const avgAttendance = attendanceRecords.length > 0
    ? parishAttendance.averageFinalPercent
    : calculateChoirHealth(members).averageAttendance;
  const singers          = activeMembers.filter((m) => m.memberType === 'Singer');
  const instrumentalists = activeMembers.filter((m) => m.memberType !== 'Singer');

  const sopranos = singers.filter((m) => m.voiceType === 'Soprano').length;
  const altos    = singers.filter((m) => m.voiceType === 'Alto').length;
  const tenors   = singers.filter((m) => m.voiceType === 'Tenor').length;
  const basses   = singers.filter((m) => m.voiceType === 'Bass').length;
  const total    = activeMembers.length || 1;
  const pct      = (n: number) => Math.round((n / total) * 100);

  const specialMassCategories = ['Special Mass', 'Death Mass', 'Death Anniversary Mass'];
  const totalReceived  = sumReceived(payments);
  const totalPending   = payments.filter((p) => p.status === 'Pending').reduce((s, p) => s + p.pendingAmount, 0);
  const totalProposed  = sumProposed(payments);
  const parishLabel    = selectedParish?.parishName ?? 'Parish';

  const voiceParts = [
    { label: 'Soprano', count: sopranos, grad: 'from-pink-400 to-orange-300', light: 'apple-badge', text: 'text-pink-700' },
    { label: 'Alto',    count: altos,    grad: 'from-sky-400 to-teal-400', light: 'apple-badge-maldives', text: 'text-[#0e3d4c]' },
    { label: 'Tenor',   count: tenors,   grad: 'from-amber-400 to-[#f5c24c]', light: 'apple-badge-gold', text: 'text-[#8a6a10]' },
    { label: 'Bass',    count: basses,   grad: 'from-slate-800 to-black', light: 'apple-badge-muted', text: 'text-[#0f172a]' },
  ];

  const topStats = [
    { label: 'Active Choralists', value: activeMembers.length, sub: `${pendingCount} pending`, icon: Users, grad: 'from-sky-500 to-teal-500', bar: Math.round((activeMembers.length / Math.max(members.length, 1)) * 100) },
    { label: 'Gross Received',    value: formatINR(totalReceived), sub: `${payments.filter(p=>p.status==='Received').length} payments cleared`, icon: IndianRupee, grad: 'from-violet-500 to-fuchsia-500', bar: totalProposed > 0 ? Math.round((totalReceived / totalProposed) * 100) : 0 },
    { label: 'Dues Outstanding',  value: formatINR(totalPending), sub: `${payments.filter(p=>p.status==='Pending').length} open invoices`, icon: TrendingUp, grad: 'from-rose-500 via-orange-500 to-amber-400', bar: totalProposed > 0 ? Math.round((totalPending / totalProposed) * 100) : 0 },
    attendanceRecords.length > 0
      ? { label: 'Avg Attendance', value: `${avgAttendance}%`, sub: `${parishAttendance.totalSessions} sessions · 30d ${parishAttendance.trendLast30Days}%`, icon: UserCheck, grad: 'from-teal-700 to-lime-400', bar: avgAttendance }
      : { label: 'Liturgy Log', value: masses.length, sub: `${masses.filter(m => specialMassCategories.includes(m.category)).length} special masses`, icon: Music2, grad: 'from-amber-400 to-[#f5c24c]', bar: Math.min(100, masses.length * 5) },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-apple">

      {/* ── Brand hero header ────────────────────────────────────────────────── */}
      <section className="apple-hero-soft relative px-8 py-8">
        <div className="choir-hero-ambient" aria-hidden />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 apple-badge-gold px-3 py-1">
              <BarChart2 className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium">Live Analytics</span>
            </div>
            <h2 className="apple-headline text-[#f5f5f7]">Parish Choral Insights</h2>
            <p className="apple-caption mt-1 text-[#a1a1a6]">
              {parishLabel} — vocal registers, liturgy log & fund splits
            </p>
          </div>
          <div className="shrink-0 apple-inset border border-white/10 px-5 py-3 text-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <p className="text-2xl font-semibold tracking-tight text-[#f5c24c] font-mono">{members.length}</p>
            <p className="apple-caption mt-0.5 text-[#a1a1a6]">Total Choralists</p>
          </div>
        </div>
      </section>

      {/* ── Stat cards ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {topStats.map((s) => (
          <div key={s.label} className="apple-card group relative overflow-hidden p-5">
            <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${s.grad} opacity-10 blur-xl group-hover:opacity-15 transition-opacity`} />
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${s.grad}`}>
              <s.icon className="h-4 w-4 text-white" />
            </div>
            <p className="text-xl font-semibold tracking-tight font-mono">{s.value}</p>
            <p className="apple-label mt-0.5">{s.label}</p>
            <p className="apple-caption mt-1">{s.sub}</p>
            <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100">
              <div className={`h-1.5 rounded-full bg-gradient-to-r ${s.grad} transition-all duration-700`} style={{ width: `${s.bar}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Voice distribution ───────────────────────────────────────────── */}
        <div className="apple-card relative overflow-hidden p-6">
          <div className="relative">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[rgba(0,0,0,0.08)]">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0e3d4c]">
                <Layers className="h-4 w-4 text-[#f5c24c]" />
              </div>
              <div>
                <h3 className="apple-title text-sm">Four-Part Harmony</h3>
                <p className="apple-caption">Voice saturation analysis</p>
              </div>
            </div>

            {activeMembers.length === 0 ? (
              <div className="apple-empty py-8">
                <Music2 className="h-10 w-10 text-[#c7c7cc] mx-auto mb-2" />
                <p className="text-sm">No active members yet</p>
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
                      <span className={`apple-badge ${light} ${text}`}>
                        {count} · {pct(count)}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-r ${grad} transition-all duration-700`} style={{ width: `${pct(count)}%` }} />
                    </div>
                  </div>
                ))}

                <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-[rgba(0,0,0,0.08)]">
                  <div className="apple-inset p-3 text-center">
                    <p className="text-xl font-semibold tracking-tight">{singers.length}</p>
                    <p className="apple-caption mt-0.5">Singers</p>
                  </div>
                  <div className="apple-inset p-3 text-center">
                    <p className="text-xl font-semibold tracking-tight">{instrumentalists.length}</p>
                    <p className="apple-caption mt-0.5">Instrumentalists</p>
                  </div>
                </div>

                <div className="apple-badge-forest mt-3 px-4 py-2.5 text-[11px] font-medium">
                  Optimal: Soprano 40% · Alto 30% · Tenor 15% · Bass 15%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Cashflow ─────────────────────────────────────────────────────── */}
        <div className="apple-hero-soft relative p-6">
          <div className="choir-hero-ambient" aria-hidden />
          <div className="relative">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/10">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5c24c]/20 border border-[#f5c24c]/30">
                <IndianRupee className="h-4 w-4 text-[#f5c24c]" />
              </div>
              <div>
                <h3 className="apple-title text-sm text-[#f5f5f7]">Liturgical Cashflow</h3>
                <p className="apple-caption text-[#a1a1a6]">Offerings & dues summary</p>
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

      <AttendanceLeaderboard
        attendanceRecords={attendanceRecords}
        members={members}
      />

      {/* ── Member roster stats ─────────────────────────────────────────────── */}
      {parishAttendance.rosterStats.length > 0 && (
        <div className="apple-card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.08)] px-6 py-4">
            <div>
              <h3 className="apple-title text-sm">Choir Member Stats</h3>
              <p className="apple-caption mt-0.5">
                Masses {parishAttendance.parishMassAttended}/{parishAttendance.parishMassLogged} attended parish-wide
                · Late {parishAttendance.parishLate} · Absent {parishAttendance.parishAbsent}
                · Shares {formatINR(parishAttendance.totalShareINR)}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-[13px]">
              <thead className="bg-[#f5f5f7] text-[11px] font-semibold uppercase tracking-wide text-[#86868b]">
                <tr>
                  <th className="px-4 py-2.5">Member</th>
                  <th className="px-4 py-2.5">Role</th>
                  <th className="px-4 py-2.5">Masses</th>
                  <th className="px-4 py-2.5">Present</th>
                  <th className="px-4 py-2.5">Late</th>
                  <th className="px-4 py-2.5">Absent</th>
                  <th className="px-4 py-2.5">Excused</th>
                  <th className="px-4 py-2.5">Final %</th>
                  <th className="px-4 py-2.5">Share</th>
                </tr>
              </thead>
              <tbody>
                {parishAttendance.rosterStats.map((row) => (
                  <tr key={row.memberId} className="border-t border-black/[0.04]">
                    <td className="px-4 py-3 font-medium text-[#1d1d1f]">{row.memberName}</td>
                    <td className="px-4 py-3 text-[#86868b]">{row.memberType} · {row.voiceType}</td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className="font-semibold text-[#0e3d4c]">{row.massAttended}</span>
                      <span className="text-[#86868b]"> / {row.massLogged}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{row.present}</td>
                    <td className="px-4 py-3 tabular-nums text-[#8a6a10]">{row.late}</td>
                    <td className="px-4 py-3 tabular-nums text-[#d70015]">{row.absent}</td>
                    <td className="px-4 py-3 tabular-nums">{row.excused}</td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-[#0e3d4c]">{row.finalPercent}%</td>
                    <td className="px-4 py-3 tabular-nums font-medium">{formatINR(row.totalShareINR)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Liturgy log table ────────────────────────────────────────────────── */}
      {masses.length > 0 && (
        <div className="apple-card p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[rgba(0,0,0,0.08)]">
            <div>
              <h3 className="apple-title text-sm">Recent Liturgy Log</h3>
              <p className="apple-caption mt-0.5">{masses.length} mass{masses.length !== 1 ? 'es' : ''} logged</p>
            </div>
          </div>
          <div className="space-y-2">
            {masses.slice(0, 6).map((m, i) => {
              const isSpecial = ['Special Mass', 'Death Mass', 'Death Anniversary Mass'].includes(m.category);
              return (
                <div key={m.id} className="apple-list-row rounded-xl border border-[rgba(0,0,0,0.08)]">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${i === 0 ? 'bg-[#0e3d4c] text-[#f5c24c]' : isSpecial ? 'apple-badge-gold' : 'apple-badge-muted'}`}>
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold tracking-tight">{m.name}</p>
                    <p className="apple-caption">{m.date} · {m.time} · {m.language}</p>
                  </div>
                  <span className={`shrink-0 apple-badge ${isSpecial ? 'apple-badge-gold' : 'apple-badge-muted'}`}>
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
