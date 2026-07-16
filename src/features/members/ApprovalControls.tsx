import React from 'react';
import { Pencil, Shield, ShieldCheck, Trash2, UserCheck, UserX } from 'lucide-react';
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

  const handleRequestCorrection = () => {
    const note = prompt('Enter correction comments for this applicant:') || 'Please update your verification credentials.';
    onUpdateMemberStatus(m.id, 'Correction Requested', note);
  };

  const handleRemove = () => {
    if (!onRemoveMember) return;
    if (!window.confirm(`Remove ${m.firstName} ${m.lastName} from the parish roster?\n\nThey will lose choir portal access. This can be undone by re-approving if needed.`)) return;
    onRemoveMember(m);
  };

  const isPending = m.status === 'Pending' || m.status === 'Correction Requested';
  const isActive  = m.status === 'Active Member' || m.status === 'Admin';
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

      {isActive && (
        <>
          {m.status === 'Admin' && (
            <span className="apple-badge-gold mb-0.5 flex items-center justify-center gap-0.5">
              <Shield className="w-2.5 h-2.5" /> Parish Admin
            </span>
          )}
          {onRemoveMember && (
            <button
              type="button"
              onClick={handleRemove}
              className="btn-pill btn-pill-xs w-full !text-[11px] !bg-[rgba(255,59,48,0.12)] !text-[#d70015]"
            >
              <Trash2 className="w-3 h-3" /> Remove member
            </button>
          )}
        </>
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
    </div>
  );
};
