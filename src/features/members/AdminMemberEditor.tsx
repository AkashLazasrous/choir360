import React, { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import { BloodGroup, Member, MemberType, RelationshipStatus, VoiceType } from '../../types';
import {
  BLOOD_GROUPS,
  EMERGENCY_RELATIONSHIPS,
  RELATIONSHIP_STATUSES,
  SPECIAL_SKILLS,
} from '../../data/registrationOptions';
import { ProfilePhotoUpload } from '../../components/media/ProfilePhotoUpload';
import { auth } from '../../services/firebase';
import { normalizeMobile } from '../../utils/memberAuth';

const MEMBER_TYPES: MemberType[] = [
  'Singer', 'Keyboard', 'Guitar', 'Violin', 'Flute', 'Tabla', 'Pad', 'Drums', 'Harmonium', 'Veena', 'Mridangam', 'Other',
];

const VOICE_TYPES: VoiceType[] = ['Soprano', 'Alto', 'Tenor', 'Bass', 'None'];

interface AdminMemberEditorProps {
  member: Member;
  saving?: boolean;
  error?: string;
  onClose: () => void;
  onSave: (updated: Member) => void | Promise<void>;
}

/** Admin modal to edit any member profile field directly. */
export const AdminMemberEditor: React.FC<AdminMemberEditorProps> = ({
  member,
  saving = false,
  error,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<Member>(member);

  useEffect(() => {
    setForm(member);
  }, [member]);

  const set = <K extends keyof Member>(key: K, value: Member[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Member = {
      ...form,
      mobileNormalized: normalizeMobile(form.mobile),
      voiceType: form.memberType === 'Singer' ? form.voiceType : 'None',
      whatsapp: form.whatsapp || form.mobile,
    };
    await onSave(updated);
  };

  return (
    <div
      className="apple-modal-backdrop flex items-end justify-center p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="apple-modal flex max-h-[min(90dvh,100%)] w-full max-w-2xl flex-col rounded-t-3xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 border-b border-black/[0.06] px-6 pb-4 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">Edit member profile</h3>
              <p className="mt-0.5 text-[13px] text-[#86868b]">
                {member.firstName} {member.lastName} · {member.status}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full text-[#86868b] hover:bg-black/[0.04]"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <p className="mt-4 rounded-2xl bg-[rgba(255,59,48,0.08)] px-3 py-2 text-[13px] font-medium text-[#d70015]">{error}</p>
          )}
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-4">
          <div className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7] p-4">
            <p className="apple-label mb-3">Profile photo</p>
            <ProfilePhotoUpload
              key={member.id}
              memberId={member.id}
              uploadedByUserId={auth?.currentUser?.uid ?? 'admin'}
              currentPhotoUrl={form.photoUrl}
              onUploadComplete={(record) => {
                const url = record.optimizedUrl || record.secureUrl;
                if (url) set('photoUrl', url);
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="apple-label">First name</span>
              <input required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} className="apple-input" />
            </label>
            <label className="space-y-1.5">
              <span className="apple-label">Last name</span>
              <input required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} className="apple-input" />
            </label>
            <label className="space-y-1.5">
              <span className="apple-label">Gender</span>
              <select value={form.gender} onChange={(e) => set('gender', e.target.value)} className="apple-select">
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="apple-label">Date of birth</span>
              <input type="date" required value={form.dob} onChange={(e) => set('dob', e.target.value)} className="apple-input" />
            </label>
            <label className="space-y-1.5">
              <span className="apple-label">Blood group</span>
              <select
                value={form.bloodGroup || ''}
                onChange={(e) => set('bloodGroup', e.target.value as BloodGroup)}
                className="apple-select"
              >
                <option value="">— Select —</option>
                {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="apple-label">Relationship status</span>
              <select
                value={form.relationshipStatus || ''}
                onChange={(e) => set('relationshipStatus', e.target.value as RelationshipStatus)}
                className="apple-select"
              >
                <option value="">— Select —</option>
                {RELATIONSHIP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="apple-label">Mobile</span>
              <input required value={form.mobile} onChange={(e) => set('mobile', e.target.value)} className="apple-input" />
            </label>
            <label className="space-y-1.5">
              <span className="apple-label">WhatsApp</span>
              <input value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} className="apple-input" />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="apple-label">Email</span>
              <input type="email" required value={form.email} onChange={(e) => set('email', e.target.value.trim().toLowerCase())} className="apple-input" />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="apple-label">Address</span>
              <textarea value={form.address} onChange={(e) => set('address', e.target.value)} className="apple-textarea !min-h-[4rem]" />
            </label>
            <label className="space-y-1.5">
              <span className="apple-label">Role</span>
              <select value={form.memberType} onChange={(e) => set('memberType', e.target.value as MemberType)} className="apple-select">
                {MEMBER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            {form.memberType === 'Singer' ? (
              <label className="space-y-1.5">
                <span className="apple-label">Voice part</span>
                <select value={form.voiceType} onChange={(e) => set('voiceType', e.target.value as VoiceType)} className="apple-select">
                  {VOICE_TYPES.filter((v) => v !== 'None').map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
            ) : (
              <div />
            )}
            <label className="space-y-1.5">
              <span className="apple-label">Experience (years)</span>
              <input type="number" min={0} max={60} value={form.experience} onChange={(e) => set('experience', Number(e.target.value))} className="apple-input" />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="apple-label">Special skills & talents</span>
              <select value={form.skills} onChange={(e) => set('skills', e.target.value)} className="apple-select">
                <option value="">— Select —</option>
                {SPECIAL_SKILLS.map((skill) => <option key={skill} value={skill}>{skill}</option>)}
                {form.skills && !SPECIAL_SKILLS.includes(form.skills) ? (
                  <option value={form.skills}>{form.skills}</option>
                ) : null}
              </select>
            </label>
          </div>

          <div className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7] p-4">
            <p className="apple-label mb-3">Emergency contact</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input
                placeholder="Name"
                value={form.emergencyContact.name}
                onChange={(e) => set('emergencyContact', { ...form.emergencyContact, name: e.target.value })}
                className="apple-input"
              />
              <select
                value={form.emergencyContact.relationship}
                onChange={(e) => set('emergencyContact', { ...form.emergencyContact, relationship: e.target.value })}
                className="apple-select"
              >
                <option value="">— Relationship —</option>
                {EMERGENCY_RELATIONSHIPS.map((rel) => <option key={rel} value={rel}>{rel}</option>)}
                {form.emergencyContact.relationship
                  && !EMERGENCY_RELATIONSHIPS.includes(form.emergencyContact.relationship) ? (
                  <option value={form.emergencyContact.relationship}>{form.emergencyContact.relationship}</option>
                ) : null}
              </select>
              <input
                placeholder="Phone"
                value={form.emergencyContact.phone}
                onChange={(e) => set('emergencyContact', { ...form.emergencyContact, phone: e.target.value })}
                className="apple-input"
              />
            </div>
          </div>

          </div>

          <div className="flex flex-shrink-0 gap-2 border-t border-black/[0.06] bg-white px-6 py-4">
            <button type="button" onClick={onClose} className="btn-pill btn-pill-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-pill btn-pill-primary flex flex-1 items-center justify-center gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
