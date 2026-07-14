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

  /** Avatar URL selected from the dropdown — used as fallback if no Cloudinary upload */
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150');
  /** Set once the ProfilePhotoUpload component completes a successful Cloudinary upload */
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
    // If the user completed a Cloudinary upload via ProfilePhotoUpload, use that URL.
    // Otherwise fall back to the avatar dropdown selection.
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

    // Clear form
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="registration-form-view">
      {/* Form */}
      <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6" id="member-form">
        <h3 className="font-sans font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">Contact & Background details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">First Name *</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Antony / Maria"
              className="w-full text-xs px-3 py-3 min-h-[44px] rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Last Name *</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Susairaj"
              className="w-full text-xs px-3 py-3 min-h-[44px] rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full text-xs px-3 py-3 min-h-[44px] rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full text-xs px-3 py-3 min-h-[44px] rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Mobile Number *</label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full text-xs px-3 py-3 min-h-[44px] rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">WhatsApp Number</label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="Leave empty to use mobile number"
              className="w-full text-xs px-3 py-3 min-h-[44px] rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. antony@gmail.com"
              className="w-full text-xs px-3 py-3 min-h-[44px] rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Postal Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Your full residence address..."
              className="w-full text-xs px-3 py-3 min-h-[44px] rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 h-16"
            />
          </div>
        </div>

        <h3 className="font-sans font-bold text-slate-900 text-sm pt-4 pb-2 border-b border-slate-100">Liturgical Choral Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Parish <span className="text-red-500">*</span></label>
            <select
              value={parish}
              onChange={(e) => setParish(e.target.value)}
              required
              className="w-full text-xs px-3 py-3 min-h-[44px] rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
            >
              <option value="">— Select parish —</option>
              {parishes.map((p) => (
                <option key={p.id} value={p.displayName}>{p.displayName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Choir Name</label>
            <input
              type="text"
              value={choirName}
              onChange={(e) => setChoirName(e.target.value)}
              className="w-full text-xs px-3 py-3 min-h-[44px] rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Member Primary Role</label>
            <select
              value={memberType}
              onChange={(e) => setMemberType(e.target.value as MemberType)}
              className="w-full text-xs px-3 py-3 min-h-[44px] rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
          </div>

          {memberType === 'Singer' ? (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">{dict.voiceType} *</label>
              <select
                value={voiceType}
                onChange={(e) => setVoiceType(e.target.value as VoiceType)}
                className="w-full text-xs px-3 py-3 min-h-[44px] rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-emerald-50 font-bold text-emerald-800"
              >
                <option value="Soprano">Soprano (Melodic Alto High)</option>
                <option value="Alto">Alto (Harmonic Mid Range)</option>
                <option value="Tenor">Tenor (Male Clear Register)</option>
                <option value="Bass">Bass (Male Resonant Base)</option>
              </select>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Voice Register (Not applicable)</label>
              <input
                type="text"
                disabled
                value="None (Instrumentalist Mode active)"
                className="w-full text-xs px-3 py-3 min-h-[44px] rounded-lg border border-slate-100 bg-slate-50 text-slate-400 cur-not-allowed"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Years of Music Experience</label>
            <input
              type="number"
              min="0"
              value={experience}
              onChange={(e) => setExperience(Number(e.target.value))}
              className="w-full text-xs px-3 py-3 min-h-[44px] rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Profile Photo Selection (Mock URL)</label>
            <select
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full text-xs px-3 py-3 min-h-[44px] rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150">Avatar 1 (Male Secular)</option>
              <option value="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150">Avatar 2 (Female Solemn)</option>
              <option value="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150">Avatar 3 (Male Parishioner)</option>
              <option value="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150">Avatar 4 (Female Cantor)</option>
            </select>
          </div>

          <div className="space-y-1 md:col-span-2 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-3">
            <label className="text-[11px] font-bold text-emerald-800 uppercase">Profile Photo Upload</label>
            <ProfilePhotoUpload
              memberId={`M${String(members.length + 1).padStart(3, '0')}`}
              uploadedByUserId="public_user"
              currentPhotoUrl={cloudinaryRecord?.optimizedUrl || cloudinaryRecord?.secureUrl || photoUrl}
              onUploadComplete={(record) => setCloudinaryRecord(record)}
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Special Skills & Talents</label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. sight-reading gregorian chants, tempo moderation"
              className="w-full text-xs px-3 py-3 min-h-[44px] rounded-lg border border-slate-200"
            />
          </div>
        </div>

        <h3 className="font-sans font-bold text-slate-900 text-sm pt-4 pb-2 border-b border-slate-100">Emergency Guardianship contact</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Full Name</label>
            <input
              type="text"
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
              placeholder="Guardian e.g. Susairaj S"
              className="w-full text-xs px-3 py-3 min-h-[44px] rounded-lg border border-slate-200"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Relationship</label>
            <input
              type="text"
              value={emergencyRelation}
              onChange={(e) => setEmergencyRelation(e.target.value)}
              placeholder="e.g. Father / Spouse"
              className="w-full text-xs px-3 py-3 min-h-[44px] rounded-lg border border-slate-200"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Contact Phone</label>
            <input
              type="tel"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="e.g. 9444000000"
              className="w-full text-xs px-3 py-3 min-h-[44px] rounded-lg border border-slate-200"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            id="submit-registration-btn"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition shadow"
          >
            <Send className="w-4 h-4" />
            {dict.submitApproval}
          </button>
        </div>
      </form>

      {/* Workflow Status Roadmap Card (Educational) */}
      <div className="space-y-6" id="workflow-steps-road">
        <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-md">
          <h4 className="font-sans font-bold text-sm text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            Choral Approval Workflow
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Our strict liturgical validation process filters and generates secure identities for each active choral vocalist and organist.
          </p>

          <div className="space-y-4 pt-2">
            {/* Pending */}
            <div className="flex items-start gap-3">
              <div className="bg-amber-950/80 border border-amber-800 text-amber-400 p-1.5 rounded-lg shrink-0 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">1. {dict.pendingApproval}</h5>
                <p className="text-[10px] text-slate-400">Roster details submitted. Pending parish council & choir master details verification.</p>
              </div>
            </div>

            {/* Correction requested */}
            <div className="flex items-start gap-3">
              <div className="bg-rose-950/80 border border-rose-800 text-rose-400 p-1.5 rounded-lg shrink-0 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">2. {dict.correctionReq}</h5>
                <p className="text-[10px] text-slate-400">Requires correction (e.g. blurry ID photo, unclear church parish code, incorrect voice octave register).</p>
              </div>
            </div>

            {/* Approved */}
            <div className="flex items-start gap-3">
              <div className="bg-blue-950/80 border border-blue-800 text-blue-400 p-1.5 rounded-lg shrink-0 mt-0.5">
                <CheckCircle className="w-3.5 h-3.5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">3. Approved & Scheduled</h5>
                <p className="text-[10px] text-slate-400">Validated by choir director. Ready for official mass share calculations and weekly rehearsals.</p>
              </div>
            </div>

            {/* Active Member */}
            <div className="flex items-start gap-3">
              <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-400 p-1.5 rounded-lg shrink-0 mt-0.5">
                <Award className="w-3.5 h-3.5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">4. {dict.activeMember}</h5>
                <p className="text-[10px] text-slate-400">Active member. Enjoys absolute voting rights, specialized tours, custom uniforms, and digital earnings share.</p>
              </div>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-2">
            <h5 className="text-xs font-bold text-slate-700">Admin review access</h5>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Use the <strong>Approval Desk</strong> tab to approve, request a correction, reject, or update choir registrations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
