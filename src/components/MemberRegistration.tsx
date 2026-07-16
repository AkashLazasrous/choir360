import React, { useState } from 'react';
import { Member, MemberStatus, Language } from '../types';
import { UserPlus, CheckCircle, Lock } from 'lucide-react';
import { MULTILINGUAL_DICTIONARY } from '../data/mockData';
import { RegistrationForm } from '../features/members/RegistrationForm';
import { ApprovalDesk } from '../features/members/ApprovalDesk';

interface MemberRegistrationProps {
  currentLang: Language;
  currentUserRole: string;
  members: Member[];
  parishId?: string;
  parishName?: string;
  onPersistMember: (member: Member) => Promise<{ ok: boolean; error?: string }>;
  onUpdateMemberStatus: (memberId: string, status: MemberStatus, note?: string) => void;
  onEditMember?: (member: Member) => Promise<{ ok: boolean; error?: string }>;
  onRemoveMember?: (member: Member) => Promise<{ ok: boolean; error?: string }>;
}

/**
 * Thin orchestrator for the registration area. The public registration form
 * lives in features/members/RegistrationForm and the admin approval desk in
 * features/members/ApprovalDesk.
 */
export const MemberRegistration: React.FC<MemberRegistrationProps> = ({
  currentLang,
  currentUserRole,
  members,
  parishId,
  parishName,
  onPersistMember,
  onUpdateMemberStatus,
  onEditMember,
  onRemoveMember,
}) => {
  const dict = MULTILINGUAL_DICTIONARY[currentLang] || MULTILINGUAL_DICTIONARY.en;
  const isAdmin = ['super_admin', 'diocese_admin', 'parish_admin', 'choir_admin'].includes(currentUserRole);

  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'form' | 'admin_dashboard'>('form');

  const handleSubmitted = (message: string) => {
    setSuccessMsg(message);
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  return (
    <div className="space-y-8" id="member-registration-component">
      {/* Top Selector Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-200 pb-3 gap-3" id="registration-header">
        <div className="flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-emerald-600" />
          <div>
            <h2 className="font-sans font-bold text-xl text-slate-800">{dict.registerTitle}</h2>
            <p className="text-xs text-slate-500">Multilingual recruitment form & administrative validation center</p>
          </div>
        </div>

        <div className="apple-segmented font-apple">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            aria-selected={activeTab === 'form'}
            className={activeTab === 'form' ? 'is-active' : ''}
            id="tab-reg-form"
          >
            Registration Form
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('admin_dashboard')}
              aria-selected={activeTab === 'admin_dashboard'}
              className={`inline-flex items-center gap-1 ${activeTab === 'admin_dashboard' ? 'is-active' : ''}`}
              id="tab-approval-desk"
            >
              <Lock className="h-3.5 w-3.5" />
              {dict.registrationAudit}
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 text-xs font-medium flex items-center gap-2" id="success-banner">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {activeTab === 'form' && (
        <RegistrationForm
          currentLang={currentLang}
          isAdmin={isAdmin}
          onSubmitted={handleSubmitted}
          onPersistMember={onPersistMember}
        />
      )}

      {isAdmin && activeTab === 'admin_dashboard' && (
        <ApprovalDesk
          members={members}
          parishId={parishId}
          parishName={parishName}
          onUpdateMemberStatus={onUpdateMemberStatus}
          onEditMember={onEditMember}
          onRemoveMember={onRemoveMember}
        />
      )}
    </div>
  );
};
