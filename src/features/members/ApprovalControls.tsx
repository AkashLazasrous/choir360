import React from 'react';
import { FileEdit, Shield, ShieldCheck, UserCheck, UserX } from 'lucide-react';
import { Member, MemberStatus } from '../../types';

interface ApprovalControlsProps {
  member: Member;
  members: Member[];
  onUpdateMemberStatus: (memberId: string, status: MemberStatus, note?: string) => void;
}

/** Per-applicant action buttons: approve (member/admin), correction, reject, reinstate. */
export const ApprovalControls: React.FC<ApprovalControlsProps> = ({ member: m, members, onUpdateMemberStatus }) => {
  const parishAdminExists = members.some(
    (x) => x.id !== m.id && (x.status === 'Admin') && x.parish === m.parish
  );

  const handleAproveMember = () => onUpdateMemberStatus(m.id, 'Active Member');

  const handleApproveAdmin = () => {
    if (parishAdminExists) {
      alert(`⚠️ One admin per parish rule\n\nA parish admin already exists for "${m.parish}". Only one primary admin is allowed per parish. Approve this person as a Member instead, or first revoke the existing admin's role.`);
      return;
    }
    if (!window.confirm(`Approve ${m.firstName} ${m.lastName} as Parish Admin for "${m.parish}"?\n\nThis grants full parish-level administrative access.`)) return;
    onUpdateMemberStatus(m.id, 'Admin', 'Approved as Parish Admin');
  };

  const handleReject = () => {
    const note = prompt(`Reason for rejecting ${m.firstName} ${m.lastName}:`);
    if (note === null) return; // cancelled
    onUpdateMemberStatus(m.id, 'Rejected', note || 'Application rejected by admin.');
  };

  const handleRequestCorrection = () => {
    const note = prompt('Enter correction comments for this applicant:') || 'Please update your verification credentials.';
    onUpdateMemberStatus(m.id, 'Correction Requested', note);
  };

  const isPending = m.status === 'Pending' || m.status === 'Correction Requested';
  const isActive  = m.status === 'Active Member' || m.status === 'Admin';
  const isRejected = m.status === 'Rejected';

  return (
    <div className="flex flex-col items-end gap-1 min-w-[120px]">
      {isPending && (
        <>
          {/* Approve as Member */}
          <button
            onClick={handleAproveMember}
            className="w-full px-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-[10px] flex items-center justify-center gap-1 transition"
          >
            <UserCheck className="w-3 h-3" /> Approve Member
          </button>

          {/* Approve as Admin */}
          <button
            onClick={handleApproveAdmin}
            title={parishAdminExists ? 'Parish already has an admin' : 'Approve as parish admin'}
            className={`w-full px-2 py-1.5 font-semibold rounded text-[10px] flex items-center justify-center gap-1 transition border ${
              parishAdminExists
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                : 'bg-violet-50 hover:bg-violet-100 text-violet-800 border-violet-200'
            }`}
          >
            <ShieldCheck className="w-3 h-3" /> Approve Admin
          </button>

          {/* Request Correction */}
          <button
            onClick={handleRequestCorrection}
            className="w-full px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold rounded text-[10px] flex items-center justify-center gap-1 transition border border-amber-200"
          >
            <FileEdit className="w-3 h-3" /> Correction
          </button>

          {/* Reject */}
          <button
            onClick={handleReject}
            className="w-full px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded text-[10px] flex items-center justify-center gap-1 transition border border-rose-200"
          >
            <UserX className="w-3 h-3" /> Reject
          </button>
        </>
      )}

      {isActive && (
        <>
          {m.status === 'Admin' && (
            <span className="px-2 py-0.5 bg-violet-100 text-violet-800 border border-violet-200 rounded text-[9px] font-bold uppercase flex items-center gap-0.5 mb-1">
              <Shield className="w-2.5 h-2.5" /> Parish Admin
            </span>
          )}
          <button
            onClick={handleRequestCorrection}
            className="w-full px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold rounded text-[10px] flex items-center justify-center gap-1 transition border border-amber-200"
          >
            <FileEdit className="w-3 h-3" /> Request Edit
          </button>
          <button
            onClick={handleReject}
            className="w-full px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded text-[10px] flex items-center justify-center gap-1 transition border border-rose-200"
          >
            <UserX className="w-3 h-3" /> Revoke
          </button>
        </>
      )}

      {isRejected && (
        <button
          onClick={handleAproveMember}
          className="w-full px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded text-[10px] flex items-center justify-center gap-1 transition border border-emerald-200"
        >
          <UserCheck className="w-3 h-3" /> Reinstate
        </button>
      )}
    </div>
  );
};
