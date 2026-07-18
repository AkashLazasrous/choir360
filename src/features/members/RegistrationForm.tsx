import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Send,
} from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Member, VoiceType, MemberType, Language, BloodGroup, RelationshipStatus } from '../../types';
import type { CloudinaryMediaRecord } from '../../types';
import { MULTILINGUAL_DICTIONARY } from '../../data/mockData';
import {
  BLOOD_GROUPS,
  EMERGENCY_RELATIONSHIPS,
  RELATIONSHIP_STATUSES,
  SPECIAL_SKILLS,
} from '../../data/registrationOptions';
import { pickCloudinaryPhotoUrl, ProfilePhotoUpload } from '../../components/media/ProfilePhotoUpload';
import { useParish } from '../parish/ParishContext';
import { activeParishes, findParishById } from '../../data/madrasMylaporeParishes';
import { apiFetch } from '../../services/apiClient';
import { auth } from '../../services/firebase';
import { dobToPassword, normalizeMobile } from '../../utils/memberAuth';

interface RegistrationFormProps {
  currentLang: Language;
  isAdmin: boolean;
  onSubmitted: (message: string) => void;
  /** Used when the server register API is unavailable (e.g. Render not redeployed yet). */
  onPersistMember?: (member: Member) => Promise<{ ok: boolean; error?: string }>;
}

const REG_STEPS = [
  { id: 1 as const, label: 'Contact', shortLabel: 'Contact' },
  { id: 2 as const, label: 'Choir', shortLabel: 'Choir' },
  { id: 3 as const, label: 'Photo & emergency', shortLabel: 'Photo/Emergency' },
];

type RegStep = (typeof REG_STEPS)[number]['id'];

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
  onSubmitted,
  onPersistMember,
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
  const [whatsappSameAsMobile, setWhatsappSameAsMobile] = useState(true);
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | ''>('');
  const [relationshipStatus, setRelationshipStatus] = useState<RelationshipStatus | ''>('');
  const [parishId, setParishId] = useState(() => selectedParish?.id ?? '');
  const [choirName, setChoirName] = useState(() => selectedParish ? `${selectedParish.parishName} Choir` : '');
  const [voiceType, setVoiceType] = useState<VoiceType>('Soprano');
  const [memberType, setMemberType] = useState<MemberType>('Singer');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState(1);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [step, setStep] = useState<RegStep>(1);
  const stepRef = useRef<RegStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const resolvedWhatsapp = whatsappSameAsMobile ? mobile : whatsapp;

  const dobPasswordHint = (() => {
    try {
      return dobToPassword(dob);
    } catch {
      return 'DDMMYYYY';
    }
  })();

  const validateStep = (s: RegStep): string | null => {
    if (s === 1) {
      if (!firstName.trim() || !lastName.trim() || !mobile.trim() || !email.trim() || !dob) {
        return 'Please fill in name, mobile, email, and date of birth before continuing.';
      }
      if (!whatsappSameAsMobile && !whatsapp.trim()) {
        return 'Enter a WhatsApp number, or choose “same as mobile”.';
      }
      return null;
    }
    if (s === 2) {
      if (!parishId) return 'Select a parish before continuing.';
      if (!voiceType || !memberType) return 'Select voice type and member type before continuing.';
      return null;
    }
    if (s === 3) {
      if (!emergencyName.trim() || !emergencyRelation.trim() || !emergencyPhone.trim()) {
        return 'Please fill emergency contact name, relationship, and phone before submitting.';
      }
      return null;
    }
    return null;
  };

  const goToStep = (next: RegStep) => {
    stepRef.current = next;
    setStep(next);
  };

  const goNext = () => {
    const current = stepRef.current;
    const err = validateStep(current);
    if (err) {
      setFormError(err);
      return;
    }
    if (current >= 3) return;
    setFormError('');
    goToStep((current + 1) as RegStep);
  };

  const goBack = () => {
    const current = stepRef.current;
    if (current <= 1) return;
    setFormError('');
    goToStep((current - 1) as RegStep);
  };

  /** Steps 1–2 are NOT a <form>, so Enter never creates a member early. */
  const handleWizardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') return;
    if (stepRef.current >= 3) return;
    e.preventDefault();
    e.stopPropagation();
    goNext();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFormError('');

    // Only step 3 renders this <form>. Still hard-block if step somehow drifts.
    if (stepRef.current !== 3) {
      goNext();
      return;
    }

    const stepErr = validateStep(1) || validateStep(2) || validateStep(3);
    if (stepErr) {
      setFormError(stepErr);
      if (validateStep(1)) goToStep(1);
      else if (validateStep(2)) goToStep(2);
      else goToStep(3);
      return;
    }

    if (!firstName || !lastName || !mobile || !email || !parishId || !dob) {
      setFormError('Please fill in all mandatory fields: name, mobile, email, date of birth, and parish.');
      return;
    }

    const parish = findParishById(parishId);
    if (!parish) {
      setFormError('Select a valid parish.');
      return;
    }

    const finalPhotoUrl =
      (cloudinaryRecord ? pickCloudinaryPhotoUrl(cloudinaryRecord) : '') ||
      photoUrl;

    setIsSubmitting(true);
    const successMessage =
      `Success! ${firstName}'s registration is pending parish approval. After approval, sign in with email or mobile and DOB password ${dobPasswordHint}.`;

    const resetForm = () => {
      setFirstName('');
      setLastName('');
      setMobile('');
      setWhatsapp('');
      setWhatsappSameAsMobile(true);
      setEmail('');
      setAddress('');
      setBloodGroup('');
      setRelationshipStatus('');
      setSkills('');
      setCloudinaryRecord(null);
      setEmergencyName('');
      setEmergencyRelation('');
      setEmergencyPhone('');
      goToStep(1);
    };

    try {
      const response = await apiFetch('/api/members/register', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          gender,
          dob,
          mobile,
          whatsapp: resolvedWhatsapp || mobile,
          email,
          address,
          bloodGroup: bloodGroup || 'Unknown',
          relationshipStatus: relationshipStatus || 'Prefer not to say',
          parishId,
          choirName: choirName || `${parish.parishName} Choir`,
          voiceType: memberType === 'Singer' ? voiceType : 'None',
          memberType,
          skills,
          experience: Number(experience),
          photoUrl: finalPhotoUrl,
          emergencyContact: {
            name: emergencyName.trim(),
            relationship: emergencyRelation.trim(),
            phone: emergencyPhone.trim(),
          },
        }),
      });
      const payload = await response.json().catch(() => ({} as { error?: string; message?: string }));

      if (response.ok) {
        onSubmitted(payload?.message || successMessage);
        resetForm();
        return;
      }

      // Backend not redeployed yet — create Auth user + Pending member from the client.
      if (response.status !== 404 || !onPersistMember || !auth) {
        const detail = typeof payload?.error === 'string' && payload.error.trim()
          ? payload.error
          : `Registration failed (${response.status}). Please try again.`;
        throw new Error(detail);
      }

      const password = dobToPassword(dob);
      const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const uid = credential.user.uid;
      await updateProfile(credential.user, { displayName: `${firstName} ${lastName}`.trim() });

      try {
        await apiFetch('/api/auth/sync-role', { method: 'POST' });
        await credential.user.getIdToken(true);
      } catch {
        // Non-fatal: claims sync may still run on next sign-in
      }

      const member: Member = {
        id: uid,
        photoUrl: finalPhotoUrl,
        firstName,
        lastName,
        gender,
        dob,
        mobile,
        mobileNormalized: normalizeMobile(mobile),
        whatsapp: resolvedWhatsapp || mobile,
        email: email.trim().toLowerCase(),
        address,
        bloodGroup: bloodGroup || 'Unknown',
        relationshipStatus: relationshipStatus || 'Prefer not to say',
        parish: parish.displayName,
        choirName: choirName || `${parish.parishName} Choir`,
        voiceType: memberType === 'Singer' ? voiceType : 'None',
        memberType,
        skills,
        experience: Number(experience),
        emergencyContact: {
          name: emergencyName.trim(),
          relationship: emergencyRelation.trim(),
          phone: emergencyPhone.trim(),
        },
        status: 'Pending',
        joiningDate: new Date().toISOString().split('T')[0],
        attendanceRate: 0,
      };

      const persist = await onPersistMember(member);
      if (!persist.ok) {
        throw new Error(persist.error || 'Could not save your registration. Please try again.');
      }

      onSubmitted(successMessage);
      resetForm();
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? String((error as { code: string }).code) : '';
      if (code === 'auth/email-already-in-use') {
        setFormError('An account already exists for this email. Sign in instead, or ask an admin to review your application.');
      } else {
        setFormError(error instanceof Error ? error.message : 'Registration failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="font-apple grid grid-cols-1 gap-6 lg:grid-cols-3" id="registration-form-view">
      {/*
        Steps 1–2 are NOT wrapped in <form>. Mobile browsers often treat Enter / “Go”
        (and sometimes Next) as form submit, which created the member before Photo/Emergency.
        Only step 3 uses a real form with type="submit".
      */}
      <div
        className="apple-card space-y-7 p-6 lg:col-span-2 lg:p-8"
        id="member-form"
        onKeyDown={handleWizardKeyDown}
      >
        <div
          className="sticky-below-header sticky z-10 -mx-6 border-b border-black/[0.06] bg-white/95 px-4 py-3 backdrop-blur-md lg:-mx-8 lg:px-8"
          role="navigation"
          aria-label="Registration steps"
        >
          <div className="reading-tabs-scroll flex gap-2 overflow-x-auto pb-1">
            {REG_STEPS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (s.id === step) return;
                  if (s.id < step) {
                    setFormError('');
                    goToStep(s.id);
                    return;
                  }
                  // Only advance via tabs after the current step validates.
                  for (let i = step; i < s.id; i += 1) {
                    const err = validateStep(i as RegStep);
                    if (err) {
                      setFormError(err);
                      return;
                    }
                  }
                  setFormError('');
                  goToStep(s.id);
                }}
                aria-current={step === s.id ? 'step' : undefined}
                className={`btn-pill shrink-0 snap-start !min-h-[44px] !px-4 !text-[13px] ${
                  step === s.id ? 'btn-pill-primary' : 'btn-pill-secondary'
                }`}
              >
                <span className="font-semibold tabular-nums">{s.id}.</span>
                {s.shortLabel}
              </button>
            ))}
          </div>
        </div>

        {step === 1 && (
          <>
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
            />
          </Field>

          <Field label="Last name" required>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Susairaj"
              className="apple-input"
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

          <Field label="Date of birth" required>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="apple-input"
            />
            <p className="mt-1 text-[12px] text-[#86868b]">
              After approval, this becomes your login password as <span className="font-semibold text-[#0e3d4c]">{dobPasswordHint}</span> (DDMMYYYY).
            </p>
          </Field>

          <Field label="Blood group">
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value as BloodGroup | '')}
              className="apple-select"
            >
              <option value="">— Select blood group —</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </Field>

          <Field label="Relationship status">
            <select
              value={relationshipStatus}
              onChange={(e) => setRelationshipStatus(e.target.value as RelationshipStatus | '')}
              className="apple-select"
            >
              <option value="">— Select status —</option>
              {RELATIONSHIP_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>

          <Field label="Mobile number" required>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="e.g. 9876543210"
              className="apple-input"
            />
          </Field>

          <Field label="WhatsApp number">
            <label className="mb-2 flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl bg-black/[0.03] px-3 py-2 text-[13px] font-medium text-[#1d1d1f]">
              <input
                type="checkbox"
                checked={whatsappSameAsMobile}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setWhatsappSameAsMobile(checked);
                  if (checked) setWhatsapp('');
                }}
                className="h-4 w-4 accent-[#0e3d4c]"
              />
              Same as mobile number *
            </label>
            <input
              type="tel"
              value={whatsappSameAsMobile ? mobile : whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="e.g. 9876543210"
              className="apple-input"
              disabled={whatsappSameAsMobile}
            />
          </Field>

          <Field label="Email address" required className="md:col-span-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. antony@gmail.com"
              className="apple-input"
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
          </>
        )}

        {step === 2 && (
          <>
        <div>
          <h3 className="apple-title">Choir configuration</h3>
          <p className="apple-caption mt-1">Parish, role, and voice part.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Parish" required>
            <select
              value={parishId}
              onChange={(e) => {
                const nextId = e.target.value;
                setParishId(nextId);
                const next = findParishById(nextId);
                if (next) setChoirName(`${next.parishName} Choir`);
              }}
              className="apple-select"
            >
              <option value="">— Select parish —</option>
              {parishes.map((p) => (
                <option key={p.id} value={p.id}>{p.displayName}</option>
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

          <Field label="Special skills & talents" className="md:col-span-2">
            <select
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="apple-select"
            >
              <option value="">— Select a skill or talent —</option>
              {SPECIAL_SKILLS.map((skill) => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
          </Field>
        </div>
          </>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} noValidate className="space-y-7">
            <div>
              <h3 className="apple-title">Profile photo</h3>
              <p className="apple-caption mt-1">Upload a photo for your choir roster card.</p>
            </div>

            <div className="apple-inset space-y-3 p-4">
              <ProfilePhotoUpload
                memberId={email.trim() ? `pending-${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')}` : 'pending-registration'}
                uploadedByUserId="public_user"
                currentPhotoUrl={
                  (cloudinaryRecord ? pickCloudinaryPhotoUrl(cloudinaryRecord) : '') || photoUrl
                }
                onUploadComplete={(record) => setCloudinaryRecord(record)}
              />
            </div>

            <hr className="apple-divider" />

            <div>
              <h3 className="apple-title">Emergency contact</h3>
              <p className="apple-caption mt-1">Required before you can submit your application.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Full name" required>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="e.g. Susairaj S"
                  className="apple-input"
                  autoComplete="name"
                />
              </Field>

              <Field label="Relationship" required>
                <select
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  className="apple-select"
                >
                  <option value="">— Select relationship —</option>
                  {EMERGENCY_RELATIONSHIPS.map((rel) => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </Field>

              <Field label="Contact phone" required>
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="e.g. 9444000000"
                  className="apple-input"
                  autoComplete="tel"
                />
              </Field>
            </div>

            {formError && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-[13px] font-medium text-rose-700">{formError}</p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-5">
              <button
                type="button"
                onClick={goBack}
                className="btn-pill btn-pill-secondary !min-h-[44px]"
                disabled={isSubmitting}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="submit"
                id="submit-registration-btn"
                disabled={isSubmitting}
                className="btn-pill btn-pill-primary !min-h-[44px] !text-[15px] ml-auto"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Submitting...' : dict.submitApproval}
              </button>
            </div>
          </form>
        )}

        {step < 3 && (
          <>
            {formError && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-[13px] font-medium text-rose-700">{formError}</p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-5">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="btn-pill btn-pill-secondary !min-h-[44px]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <span aria-hidden />
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goNext();
                }}
                className="btn-pill btn-pill-primary !min-h-[44px] !text-[15px] ml-auto"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>

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
