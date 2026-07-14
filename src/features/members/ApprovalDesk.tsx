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
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5" id="admin-dashboard-view">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#18392f]">
          <ClipboardCheck className="h-5 w-5 text-amber-300" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Choral Registrar Verification</h3>
          <p className="text-[11px] text-slate-400">Approve, reject or request corrections for applicants</p>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap text-[10px] font-bold">
        <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
          {members.filter(m=>m.status==='Pending').length} Pending
        </span>
        <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
          {members.filter(m=>m.status==='Active Member'||m.status==='Admin').length} Active
        </span>
        <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200">
          {members.filter(m=>m.status==='Rejected').length} Rejected
        </span>
      </div>
    </div>

    {members.length === 0 ? (
      <div className="py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 mx-auto mb-3">
          <UserPlus className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-sm font-bold text-slate-500">No applications yet</p>
        <p className="text-xs text-slate-400 mt-1">Register a new member using the form tab</p>
      </div>
    ) : (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {members.map((m) => {
          const statusCfg = {
            'Active Member': { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
            'Admin':         { bg: 'bg-violet-50',  border: 'border-violet-200',  badge: 'bg-violet-100 text-violet-800 border-violet-200',   dot: 'bg-violet-500'  },
            'Pending':       { bg: 'bg-amber-50',   border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-800 border-amber-200',       dot: 'bg-amber-500'   },
            'Rejected':      { bg: 'bg-rose-50',    border: 'border-rose-200',    badge: 'bg-rose-100 text-rose-800 border-rose-200',           dot: 'bg-rose-500'    },
            'Correction Requested': { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500' },
            'Approved':      { bg: 'bg-blue-50',    border: 'border-blue-200',    badge: 'bg-blue-100 text-blue-800 border-blue-200',           dot: 'bg-blue-500'    },
          }[m.status] ?? { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };

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
                <span className={`shrink-0 px-2 py-0.5 rounded-lg border text-[9px] font-bold uppercase ${statusCfg.badge}`}>
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
