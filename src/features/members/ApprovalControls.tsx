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
            className="btn-pill btn-pill-primary btn-pill-xs w-full !text-[11px]"
          >
            <UserCheck className="w-3 h-3" /> Approve Member
          </button>

          {/* Approve as Admin */}
          <button
            onClick={handleApproveAdmin}
            title={parishAdminExists ? 'Parish already has an admin' : 'Approve as parish admin'}
            className={`btn-pill btn-pill-xs w-full !text-[11px] ${
              parishAdminExists
                ? 'btn-pill-secondary cursor-not-allowed opacity-60'
                : 'btn-pill-gold'
            }`}
          >
            <ShieldCheck className="w-3 h-3" /> Approve Admin
          </button>

          {/* Request Correction */}
          <button
            onClick={handleRequestCorrection}
            className="btn-pill btn-pill-secondary btn-pill-xs w-full !text-[11px]"
          >
            <FileEdit className="w-3 h-3" /> Correction
          </button>

          {/* Reject */}
          <button
            onClick={handleReject}
            className="btn-pill btn-pill-xs w-full !text-[11px] !bg-[rgba(255,59,48,0.12)] !text-[#d70015]"
          >
            <UserX className="w-3 h-3" /> Reject
          </button>
        </>
      )}

      {isActive && (
        <>
          {m.status === 'Admin' && (
            <span className="apple-badge-gold mb-1 flex items-center gap-0.5">
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
