import React, { useState } from 'react';
import {
  Award,
  AlertTriangle,
  CheckCircle,
  ClipboardCheck,
  Clock,
  Send,
} from 'lucide-react';
import { Member, VoiceType, MemberType, Language } from '../../types';
import type { CloudinaryMediaRecord } from '../../types';
import { MULTILINGUAL_DICTIONARY } from '../../data/mockData';
import { ProfilePhotoUpload } from '../../components/media/ProfilePhotoUpload';
import { useParish } from '../parish/ParishContext';
import { activeParishes } from '../../data/madrasMylaporeParishes';

interface RegistrationFormProps {
  currentLang: Language;
  isAdmin: boolean;
  members: Member[];
  onAddMember: (member: Member) => void;
  onSubmitted: (message: string) => void;
}

const Field: React.FC<{ label: string; required?: boolean; className?: string; children: React.ReactNode }> = ({
  label,
  required,
  className = '',
  children,
}) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="apple-label block">
      {label}{required ? ' *' : ''}
    </label>
    {children}
  </div>
);

/** Public member registration form plus the approval-workflow explainer card. */
export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  currentLang,
  isAdmin,
  members,
  onAddMember,
  onSubmitted,
}) => {
  const dict = MULTILINGUAL_DICTIONARY[currentLang] || MULTILINGUAL_DICTIONARY.en;
  const { selectedParish } = useParish();
  const parishes = activeParishes();

  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150');
  const [cloudinaryRecord, setCloudinaryRecord] = useState<CloudinaryMediaRecord | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('2000-01-01');
  const [mobile, setMobile] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [parish, setParish] = useState(() => selectedParish?.displayName ?? '');
  const [choirName, setChoirName] = useState(() => selectedParish ? `${selectedParish.parishName} Choir` : '');
  const [voiceType, setVoiceType] = useState<VoiceType>('Soprano');
  const [memberType, setMemberType] = useState<MemberType>('Singer');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState(1);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !mobile || !email) {
      alert("Please fill in all mandatory fields: First Name, Last Name, Mobile, and Email.");
      return;
    }

    const memberId = `M${String(members.length + 1).padStart(3, '0')}`;
    const finalPhotoUrl =
      cloudinaryRecord?.optimizedUrl ||
      cloudinaryRecord?.secureUrl ||
      photoUrl;

    const newMember: Member = {
      id: memberId,
      photoUrl: finalPhotoUrl,
      firstName,
      lastName,
      gender,
      dob,
      mobile,
      whatsapp: whatsapp || mobile,
      email,
      address,
      parish,
      choirName,
      voiceType: memberType === 'Singer' ? voiceType : 'None',
      memberType,
      skills,
      experience: Number(experience),
      emergencyContact: {
        name: emergencyName || 'Guardian',
        relationship: emergencyRelation || 'Family',
        phone: emergencyPhone || mobile
      },
      status: 'Pending',
      joiningDate: new Date().toISOString().split('T')[0],
      attendanceRate: 0
    };

    onAddMember(newMember);
    onSubmitted(`Success! ${firstName}'s registration is submitted as PENDING. Admins will review it soon.`);

    setFirstName('');
    setLastName('');
    setMobile('');
    setWhatsapp('');
    setEmail('');
    setAddress('');
    setSkills('');
    setCloudinaryRecord(null);
    setEmergencyName('');
    setEmergencyRelation('');
    setEmergencyPhone('');
  };

  return (
    <div className="font-apple grid grid-cols-1 gap-6 lg:grid-cols-3" id="registration-form-view">
      <form onSubmit={handleSubmit} className="apple-card space-y-7 p-6 lg:col-span-2 lg:p-8" id="member-form">
        <div>
          <h3 className="apple-title">Contact & background</h3>
          <p className="apple-caption mt-1">Tell us how to reach you and where you sing.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="First name" required>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Antony / Maria"
              className="apple-input"
              required
            />
          </Field>

          <Field label="Last name" required>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Susairaj"
              className="apple-input"
              required
            />
          </Field>

          <Field label="Gender">
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="apple-select"
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </Field>

          <Field label="Date of birth">
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="apple-input"
            />
          </Field>

          <Field label="Mobile number" required>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="e.g. 9876543210"
              className="apple-input"
              required
            />
          </Field>

          <Field label="WhatsApp number">
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="Leave empty to use mobile number"
              className="apple-input"
            />
          </Field>

          <Field label="Email address" required className="md:col-span-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. antony@gmail.com"
              className="apple-input"
              required
            />
          </Field>

          <Field label="Postal address" className="md:col-span-2">
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Your full residence address..."
              className="apple-textarea !min-h-[4.5rem]"
            />
          </Field>
        </div>

        <hr className="apple-divider" />

        <div>
          <h3 className="apple-title">Choir configuration</h3>
          <p className="apple-caption mt-1">Parish, role, and voice part.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Parish" required>
            <select
              value={parish}
              onChange={(e) => setParish(e.target.value)}
              required
              className="apple-select"
            >
              <option value="">— Select parish —</option>
              {parishes.map((p) => (
                <option key={p.id} value={p.displayName}>{p.displayName}</option>
              ))}
            </select>
          </Field>

          <Field label="Choir name">
            <input
              type="text"
              value={choirName}
              onChange={(e) => setChoirName(e.target.value)}
              className="apple-input"
            />
          </Field>

          <Field label="Primary role">
            <select
              value={memberType}
              onChange={(e) => setMemberType(e.target.value as MemberType)}
              className="apple-select"
            >
              <option value="Singer">Singer (Vocalist)</option>
              <option value="Keyboard">Keyboard (Harmonium/Organ)</option>
              <option value="Guitar">Acoustic / Lead Guitar</option>
              <option value="Violin">Symphonic Violin</option>
              <option value="Flute">Church Transverse Flute</option>
              <option value="Tabla">Acoustic Tabla</option>
              <option value="Pad">Electric Choral Pad</option>
              <option value="Drums">Drums & Timpani</option>
              <option value="Other">Other supporting instrument</option>
            </select>
          </Field>

          {memberType === 'Singer' ? (
            <Field label={`${dict.voiceType}`} required>
              <select
                value={voiceType}
                onChange={(e) => setVoiceType(e.target.value as VoiceType)}
                className="apple-select"
              >
                <option value="Soprano">Soprano (Melodic Alto High)</option>
                <option value="Alto">Alto (Harmonic Mid Range)</option>
                <option value="Tenor">Tenor (Male Clear Register)</option>
                <option value="Bass">Bass (Male Resonant Base)</option>
              </select>
            </Field>
          ) : (
            <Field label="Voice register">
              <input
                type="text"
                disabled
                value="Not applicable (instrumentalist)"
                className="apple-input opacity-60"
              />
            </Field>
          )}

          <Field label="Years of experience">
            <input
              type="number"
              min="0"
              value={experience}
              onChange={(e) => setExperience(Number(e.target.value))}
              className="apple-input"
            />
          </Field>

          <Field label="Fallback avatar">
            <select
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="apple-select"
            >
              <option value="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150">Avatar 1</option>
              <option value="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150">Avatar 2</option>
              <option value="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150">Avatar 3</option>
              <option value="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150">Avatar 4</option>
            </select>
          </Field>

          <div className="apple-inset space-y-3 p-4 md:col-span-2">
            <p className="apple-label">Profile photo</p>
            <ProfilePhotoUpload
              memberId={`M${String(members.length + 1).padStart(3, '0')}`}
              uploadedByUserId="public_user"
              currentPhotoUrl={cloudinaryRecord?.optimizedUrl || cloudinaryRecord?.secureUrl || photoUrl}
              onUploadComplete={(record) => setCloudinaryRecord(record)}
            />
          </div>

          <Field label="Special skills & talents" className="md:col-span-2">
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. sight-reading, tempo moderation"
              className="apple-input"
            />
          </Field>
        </div>

        <hr className="apple-divider" />

        <div>
          <h3 className="apple-title">Emergency contact</h3>
          <p className="apple-caption mt-1">Someone we can reach if needed.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Full name">
            <input
              type="text"
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
              placeholder="e.g. Susairaj S"
              className="apple-input"
            />
          </Field>

          <Field label="Relationship">
            <input
              type="text"
              value={emergencyRelation}
              onChange={(e) => setEmergencyRelation(e.target.value)}
              placeholder="e.g. Father / Spouse"
              className="apple-input"
            />
          </Field>

          <Field label="Contact phone">
            <input
              type="tel"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="e.g. 9444000000"
              className="apple-input"
            />
          </Field>
        </div>

        <div className="flex justify-end border-t border-black/[0.06] pt-5">
          <button
            type="submit"
            id="submit-registration-btn"
            className="btn-pill btn-pill-primary !text-[15px]"
          >
            <Send className="h-4 w-4" />
            {dict.submitApproval}
          </button>
        </div>
      </form>

      <div className="space-y-4" id="workflow-steps-road">
        <div className="apple-hero-soft space-y-4 p-6">
          <div className="choir-hero-ambient" aria-hidden />
          <div className="relative">
            <h4 className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em] text-[#f5f5f7]">
              <ClipboardCheck className="h-5 w-5 text-amber-300" />
              Approval workflow
            </h4>
            <p className="mt-2 text-[13px] leading-relaxed text-[#a1a1a6]">
              Each application is reviewed before you join the parish choir roster.
            </p>

            <div className="mt-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-300/15 text-amber-300">
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h5 className="text-[15px] font-semibold text-[#f5f5f7]">1. {dict.pendingApproval}</h5>
                  <p className="mt-0.5 text-[12px] text-[#86868b]">Submitted and waiting for parish review.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(255,69,58,0.18)] text-[#ff453a]">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h5 className="text-[15px] font-semibold text-[#f5f5f7]">2. {dict.correctionReq}</h5>
                  <p className="mt-0.5 text-[12px] text-[#86868b]">Updates needed before approval.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(41,151,255,0.18)] text-[#2997ff]">
                  <CheckCircle className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h5 className="text-[15px] font-semibold text-[#f5f5f7]">3. Approved</h5>
                  <p className="mt-0.5 text-[12px] text-[#86868b]">Ready for rehearsals and mass scheduling.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-300/15 text-amber-300">
                  <Award className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h5 className="text-[15px] font-semibold text-[#f5f5f7]">4. {dict.activeMember}</h5>
                  <p className="mt-0.5 text-[12px] text-[#86868b]">Full member access on Choir360.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="apple-card space-y-2 p-5">
            <h5 className="text-[15px] font-semibold text-[#1d1d1f]">Admin review</h5>
            <p className="text-[13px] leading-relaxed text-[#86868b]">
              Use the <strong className="font-medium text-[#1d1d1f]">Approval Desk</strong> tab to approve, request a correction, or reject registrations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
