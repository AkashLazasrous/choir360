import React from 'react';
import { ClipboardCheck, MapPin, PhoneCall, UserPlus } from 'lucide-react';
import { Member, MemberStatus } from '../../types';
import { ApprovalControls } from './ApprovalControls';

interface ApprovalDeskProps {
  members: Member[];
  onUpdateMemberStatus: (memberId: string, status: MemberStatus, note?: string) => void;
}

/** Admin approval desk: applicant cards with status badges and approval actions. */
export const ApprovalDesk: React.FC<ApprovalDeskProps> = ({ members, onUpdateMemberStatus }) => (
  <div className="apple-card font-apple space-y-5 p-6" id="admin-dashboard-view">
    <div className="flex flex-col items-start justify-between gap-3 border-b border-black/[0.06] pb-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#18392f]">
          <ClipboardCheck className="h-5 w-5 text-amber-300" />
        </div>
        <div>
          <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">Choral Registrar Verification</h3>
          <p className="text-[12px] text-[#86868b]">Approve, reject or request corrections for applicants</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="apple-badge-gold">
          {members.filter(m=>m.status==='Pending').length} Pending
        </span>
        <span className="apple-badge-forest">
          {members.filter(m=>m.status==='Active Member'||m.status==='Admin').length} Active
        </span>
        <span className="apple-badge-danger">
          {members.filter(m=>m.status==='Rejected').length} Rejected
        </span>
      </div>
    </div>

    {members.length === 0 ? (
      <div className="apple-empty">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.06]">
          <UserPlus className="h-6 w-6 text-[#86868b]" />
        </div>
        <h3>No applications yet</h3>
        <p>Register a new member using the form tab</p>
      </div>
    ) : (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {members.map((m) => {
          const statusCfg = {
            'Active Member': { bg: 'bg-[rgba(24,57,47,0.06)]', border: 'border-[rgba(24,57,47,0.14)]', badge: 'apple-badge-forest', dot: 'bg-[#18392f]' },
            'Admin':         { bg: 'bg-[rgba(245,194,76,0.12)]', border: 'border-[rgba(245,194,76,0.35)]', badge: 'apple-badge-gold', dot: 'bg-[#f5c24c]' },
            'Pending':       { bg: 'bg-[rgba(245,194,76,0.1)]', border: 'border-[rgba(245,194,76,0.28)]', badge: 'apple-badge-gold', dot: 'bg-[#e8a820]' },
            'Rejected':      { bg: 'bg-[rgba(255,59,48,0.06)]', border: 'border-[rgba(255,59,48,0.2)]', badge: 'apple-badge-danger', dot: 'bg-[#d70015]' },
            'Correction Requested': { bg: 'bg-[rgba(255,149,0,0.08)]', border: 'border-[rgba(255,149,0,0.22)]', badge: 'apple-badge-gold', dot: 'bg-[#ff9500]' },
            'Approved':      { bg: 'bg-[rgba(41,151,255,0.08)]', border: 'border-[rgba(41,151,255,0.22)]', badge: 'apple-badge-blue', dot: 'bg-[#2997ff]' },
          }[m.status] ?? { bg: 'bg-[#f5f5f7]', border: 'border-black/[0.06]', badge: 'apple-badge-muted', dot: 'bg-[#86868b]' };

          return (
            <div key={m.id} className={`rounded-2xl border ${statusCfg.border} ${statusCfg.bg} p-4 space-y-3 transition hover:shadow-sm`}>
              {/* Profile row */}
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <img src={m.photoUrl} alt={m.firstName} referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-xl object-cover border-2 border-white shadow-sm" />
                  <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${statusCfg.dot}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-sm truncate">{m.firstName} {m.lastName}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{m.id} · {m.gender}</p>
                </div>
                <span className={`shrink-0 ${statusCfg.badge}`}>
                  {m.status}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-1 text-[10px] text-slate-500 border-t border-white/60 pt-2">
                <p className="flex items-center gap-1.5 font-semibold text-slate-700"><MapPin className="w-3 h-3 shrink-0 text-slate-400" />{m.parish}</p>
                <p className="flex items-center gap-1.5"><PhoneCall className="w-3 h-3 shrink-0 text-slate-400" />{m.mobile}</p>
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="px-2 py-0.5 bg-white rounded-lg border border-slate-200 font-semibold text-slate-700">{m.memberType}</span>
                  {m.voiceType !== 'None' && <span className="px-2 py-0.5 bg-blue-50 rounded-lg border border-blue-100 font-semibold text-blue-700">{m.voiceType}</span>}
                  <span className="text-slate-400">{m.experience}y exp</span>
                </div>
              </div>

              {m.correctionNote && (
                <p className="text-[10px] font-mono text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-2.5 py-1.5 leading-relaxed line-clamp-2">
                  Note: "{m.correctionNote}"
                </p>
              )}

              {/* Approval controls */}
              <div className="border-t border-white/60 pt-2">
                <ApprovalControls member={m} members={members} onUpdateMemberStatus={onUpdateMemberStatus} />
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);
