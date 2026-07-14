import React, { useState } from 'react';
import { User, Save } from 'lucide-react';
import { Member } from '../../types';

interface ProfileCardProps {
  member: Member;
  onUpdateMemberDetails: (updated: Member) => void;
  /** Called after an edit request is submitted so the parent can show a banner. */
  onEditRequested: () => void;
}

/** Member profile card with read-only view and an "request update" edit form. */
export const ProfileCard: React.FC<ProfileCardProps> = ({ member, onUpdateMemberDetails, onEditRequested }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState(member.firstName);
  const [editLastName, setEditLastName] = useState(member.lastName);
  const [editMobile, setEditMobile] = useState(member.mobile);
  const [editWhatsapp, setEditWhatsapp] = useState(member.whatsapp);
  const [editEmail, setEditEmail] = useState(member.email);
  const [editAddress, setEditAddress] = useState(member.address);
  const [editSkills, setEditSkills] = useState(member.skills);

  const handleEditRequest = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMemberDetails({
      ...member,
      firstName: editFirstName,
      lastName: editLastName,
      mobile: editMobile,
      whatsapp: editWhatsapp,
      email: editEmail,
      address: editAddress,
      skills: editSkills,
    });
    setIsEditing(false);
    onEditRequested();
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4" id="member-profile-card">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <h4 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-600" />
          My Profile Details
        </h4>
        <button
          id="edit-profile-btn"
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
        >
          {isEditing ? 'Cancel Edit' : 'Request Update'}
        </button>
      </div>

      {isEditing ? (
        <form onSubmit={handleEditRequest} className="space-y-4 text-xs" id="profile-edit-form">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">First Name</label>
              <input type="text" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} className="w-full px-3 py-3 min-h-[44px] border border-slate-200 rounded" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Last Name</label>
              <input type="text" value={editLastName} onChange={e => setEditLastName(e.target.value)} className="w-full px-3 py-3 min-h-[44px] border border-slate-200 rounded" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Mobile Number</label>
            <input type="text" value={editMobile} onChange={e => setEditMobile(e.target.value)} className="w-full px-3 py-3 min-h-[44px] border border-slate-200 rounded" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">WhatsApp Number</label>
            <input type="text" value={editWhatsapp} onChange={e => setEditWhatsapp(e.target.value)} className="w-full px-3 py-3 min-h-[44px] border border-slate-200 rounded" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
            <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full px-3 py-3 min-h-[44px] border border-slate-200 rounded" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Residential Address</label>
            <textarea value={editAddress} onChange={e => setEditAddress(e.target.value)} className="w-full p-2 border border-slate-200 rounded h-16" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Special Skills</label>
            <input type="text" value={editSkills} onChange={e => setEditSkills(e.target.value)} className="w-full px-3 py-3 min-h-[44px] border border-slate-200 rounded" />
          </div>
          <button
            type="submit"
            id="save-profile-request-btn"
            className="w-full py-3 min-h-[44px] bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Save className="w-3.5 h-3.5" /> Submit Edit for Admin Approval
          </button>
        </form>
      ) : (
        <div className="space-y-3.5 text-xs text-slate-600" id="profile-read-only">
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-400">Department</span>
            <span className="font-semibold text-slate-800">{member.memberType}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-400">Primary Register</span>
            <span className="font-semibold text-emerald-800 font-sans">{member.voiceType}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-400">Mobile Phone</span>
            <span className="font-semibold text-slate-800">{member.mobile}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-400">WhatsApp</span>
            <span className="font-semibold text-slate-800">{member.whatsapp}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-400">Parish</span>
            <span className="font-semibold text-slate-800 text-right max-w-44 truncate">{member.parish}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-400">Skills Profile</span>
            <span className="font-semibold text-slate-800 italic leading-snug">{member.skills || 'Choralist'}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-400">Joined Choir</span>
            <span className="font-mono font-medium text-slate-800">{member.joiningDate || '2021'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
