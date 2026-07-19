import React from 'react';
import { PauseCircle, Pencil, Shield, ShieldCheck, Trash2, UserCheck, UserX } from 'lucide-react';
import { Member, MemberStatus } from '../../types';

interface ApprovalControlsProps {
  member: Member;
  members: Member[];
  onUpdateMemberStatus: (memberId: string, status: MemberStatus, note?: string) => void;
  onEditMember?: (member: Member) => void;
  onRemoveMember?: (member: Member) => void;
}

/** Per-applicant action buttons: approve, edit, remove, reinstate. */
export const ApprovalControls: React.FC<ApprovalControlsProps> = ({
  member: m,
  members,
  onUpdateMemberStatus,
  onEditMember,
  onRemoveMember,
}) => {
  const parishAdminExists = members.some(
    (x) => x.id !== m.id && (x.status === 'Admin') && x.parish === m.parish
  );

  const handleAproveMember = () => onUpdateMemberStatus(m.id, 'Active Member');

  const handleApproveAdmin = () => {
    if (parishAdminExists) {
      alert(`⚠️ One admin per parish rule\n\nA parish admin already exists for "${m.parish}". Only one primary admin is allowed per parish. Approve this person as a Member instead, or first remove the existing admin.`);
      return;
    }
    if (!window.confirm(`Approve ${m.firstName} ${m.lastName} as Parish Admin for "${m.parish}"?\n\nThis grants full parish-level administrative access.`)) return;
    onUpdateMemberStatus(m.id, 'Admin', 'Approved as Parish Admin');
  };

  const handleReject = () => {
    const note = prompt(`Reason for rejecting ${m.firstName} ${m.lastName}:`);
    if (note === null) return;
    onUpdateMemberStatus(m.id, 'Rejected', note || 'Application rejected by admin.');
  };

  const handleMarkInactive = () => {
    const label = `${m.firstName} ${m.lastName}`.trim() || 'this member';
    if (!window.confirm(
      `Mark ${label} as Inactive?\n\n`
      + `They stay on the parish roster but lose active choir access until reactivated.`,
    )) return;
    onUpdateMemberStatus(m.id, 'Inactive', 'Marked inactive by parish admin');
  };

  const handleRequestCorrection = () => {
    const note = prompt('Enter correction comments for this applicant:') || 'Please update your verification credentials.';
    onUpdateMemberStatus(m.id, 'Correction Requested', note);
  };

  const handleRemove = () => {
    if (!onRemoveMember) return;
    const label = `${m.firstName} ${m.lastName}`.trim() || 'this member';
    const ok = window.confirm(
      `Permanently delete ${label}?\n\n`
      + `This cannot be undone.\n`
      + `• Profile, private contact data, and login are erased\n`
      + `• Attendance marks and payment shares for this person are erased\n`
      + `• Photo is removed from storage when possible\n\n`
      + `Type OK in the next prompt to confirm.`,
    );
    if (!ok) return;
    const typed = window.prompt(`Type DELETE to permanently erase ${label}:`);
    if (typed?.trim().toUpperCase() !== 'DELETE') {
      alert('Deletion cancelled — you must type DELETE to confirm.');
      return;
    }
    onRemoveMember(m);
  };

  const isPending = m.status === 'Pending' || m.status === 'Correction Requested';
  const isActive  = m.status === 'Active Member' || m.status === 'Admin';
  const isInactive = m.status === 'Inactive';
  const isRejected = m.status === 'Rejected';

  return (
    <div className="flex flex-col items-stretch gap-1.5">
      {onEditMember && (
        <button
          type="button"
          onClick={() => onEditMember(m)}
          className="btn-pill btn-pill-secondary btn-pill-xs w-full !text-[11px]"
        >
          <Pencil className="w-3 h-3" /> Edit profile
        </button>
      )}

      {isPending && (
        <>
          <button
            type="button"
            onClick={handleAproveMember}
            className="btn-pill btn-pill-primary btn-pill-xs w-full !text-[11px]"
          >
            <UserCheck className="w-3 h-3" /> Approve Member
          </button>

          <button
            type="button"
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

          <button
            type="button"
            onClick={handleRequestCorrection}
            className="btn-pill btn-pill-secondary btn-pill-xs w-full !text-[11px]"
          >
            Request correction
          </button>

          <button
            type="button"
            onClick={handleReject}
            className="btn-pill btn-pill-xs w-full !text-[11px] !bg-[rgba(255,59,48,0.12)] !text-[#d70015]"
          >
            <UserX className="w-3 h-3" /> Reject
          </button>
        </>
      )}

      {isActive && m.status === 'Admin' && (
        <span className="apple-badge-gold mb-0.5 flex items-center justify-center gap-0.5">
          <Shield className="w-2.5 h-2.5" /> Parish Admin
        </span>
      )}

      {isActive && (
        <button
          type="button"
          onClick={handleMarkInactive}
          className="btn-pill btn-pill-secondary btn-pill-xs w-full !text-[11px]"
        >
          <PauseCircle className="w-3 h-3" /> Mark Inactive
        </button>
      )}

      {isInactive && (
        <button
          type="button"
          onClick={handleAproveMember}
          className="btn-pill btn-pill-primary btn-pill-xs w-full !text-[11px]"
        >
          <UserCheck className="w-3 h-3" /> Reactivate
        </button>
      )}

      {isRejected && (
        <button
          type="button"
          onClick={handleAproveMember}
          className="btn-pill btn-pill-primary btn-pill-xs w-full !text-[11px]"
        >
          <UserCheck className="w-3 h-3" /> Reinstate
        </button>
      )}

      {/* Permanent delete — available before or after approval */}
      {onRemoveMember && (isPending || isActive || isInactive || isRejected) && (
        <button
          type="button"
          onClick={handleRemove}
          className="btn-pill btn-pill-xs w-full !text-[11px] !bg-[rgba(255,59,48,0.14)] !text-[#ff453a]"
        >
          <Trash2 className="w-3 h-3" /> Delete permanently
        </button>
      )}
    </div>
  );
};
