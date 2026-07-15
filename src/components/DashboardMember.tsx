import React, { useState } from 'react';
import { Member, Language, ChoirEvent, Mass, AttendanceRecord } from '../types';
import { Activity, AlertCircle, IdCard } from 'lucide-react';
import { DigitalChoirID } from './DigitalChoirID';
import { ProfileCard } from '../features/memberDashboard/ProfileCard';
import { AvailabilityCard } from '../features/memberDashboard/AvailabilityCard';
import { BadgesCard } from '../features/memberDashboard/BadgesCard';
import { EarningsAndEvents } from '../features/memberDashboard/EarningsAndEvents';
import { PracticeConsole } from '../features/memberDashboard/PracticeConsole';
import { PrayerWall } from '../features/memberDashboard/PrayerWall';
import { computeMemberStatsForId } from '../utils/attendanceStats';

interface DashboardMemberProps {
  currentLang: Language;
  memberId: string; // The logged-in member context.
  members: Member[];
  events: ChoirEvent[];
  masses: Mass[];
  attendanceRecords?: AttendanceRecord[];
  onUpdateMemberDetails: (updated: Member) => void;
  onUpdateEventRsvp: (eventId: string, memberId: string, status: 'Going' | 'Not Going' | 'Maybe') => void;
}

/**
 * Thin orchestrator for the member dashboard. Each card lives in
 * src/features/memberDashboard/.
 */
export const DashboardMember: React.FC<DashboardMemberProps> = ({
  currentLang,
  memberId,
  members,
  events,
  attendanceRecords = [],
  onUpdateMemberDetails,
  onUpdateEventRsvp
}) => {
  const member = members.find(m => m.id === memberId) || members[0];
  const liveStats = computeMemberStatsForId(attendanceRecords, members, member?.id ?? memberId);

  const [dashTab, setDashTab] = useState<'overview' | 'id_card'>('overview');
  const [hasRequestedChange, setHasRequestedChange] = useState(false);

  const handleEditRequested = () => {
    setHasRequestedChange(true);
    setTimeout(() => setHasRequestedChange(false), 6000);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="member-dashboard-subcontainer">

      {/* Sub-tab switcher */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setDashTab('overview')}
          className={`flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl text-xs font-bold transition ${
            dashTab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Overview
        </button>
        <button
          onClick={() => setDashTab('id_card')}
          className={`flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl text-xs font-bold transition ${
            dashTab === 'id_card' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <IdCard className="w-3.5 h-3.5" /> Digital ID & Badges
        </button>
      </div>

      {/* Digital Choir ID tab */}
      {dashTab === 'id_card' && (
        <DigitalChoirID
          member={member}
          onCheckIn={(memberId, payload) => {
            console.log('[Choir360] QR Check-in', memberId, payload);
          }}
        />
      )}

      {/* Overview tab content */}
      {dashTab === 'overview' && <>

      {/* Header Summary */}
      <div className="apple-card font-apple flex flex-col items-center justify-between gap-6 p-6 md:flex-row md:items-start" id="dashboard-member-header">
        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
          <img
            src={member.photoUrl}
            alt={member.firstName}
            referrerPolicy="no-referrer"
            className="h-16 w-16 rounded-full object-cover ring-2 ring-[#18392f]/20"
          />
          <div>
            <h3 className="flex items-center justify-center gap-2 text-[21px] font-semibold tracking-[-0.02em] text-[#1d1d1f] md:justify-start">
              {member.firstName} {member.lastName}
              <span className="apple-badge-forest">
                {member.status}
              </span>
            </h3>
            <p className="mt-1 text-[13px] text-[#86868b]">{member.memberType} · Voice: <strong className="font-medium text-[#18392f]">{member.voiceType}</strong></p>
            <p className="mt-0.5 text-[12px] text-[#86868b]">ID: {member.id} · {member.parish}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4 rounded-2xl bg-[rgba(24,57,47,0.06)] p-4">
          <div className="text-center">
            <p className="text-[28px] font-semibold tracking-[-0.03em] text-[#18392f]">
              {liveStats?.finalPercent ?? member.attendanceRate ?? 0}%
            </p>
            <p className="text-[12px] font-medium text-[#86868b]">Attendance (final)</p>
          </div>
          <div className="space-y-0.5 border-l border-black/10 pl-3 text-[13px] text-[#3a3a3c]">
            <p>Present: <span className="font-semibold text-[#18392f]">{liveStats?.present ?? 0}</span></p>
            <p>Late: <span className="font-semibold text-[#8a6a10]">{liveStats?.late ?? 0}</span></p>
            <p>Absent: <span className="font-semibold text-[#d70015]">{liveStats?.absent ?? 0}</span></p>
          </div>
        </div>
      </div>

      {hasRequestedChange && (
        <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200 text-xs font-medium flex items-center gap-2" id="edit-request-banner">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />
          <span>
            Profile update request submitted. Local administrators (Choir Admin / Super Admin) have received the notification to verify and publish changes.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile edit & Availability RSVPs */}
        <div className="space-y-8" id="member-profile-controls">
          <ProfileCard
            member={member}
            onUpdateMemberDetails={onUpdateMemberDetails}
            onEditRequested={handleEditRequested}
          />
          <AvailabilityCard currentLang={currentLang} />
          <BadgesCard />
        </div>

        {/* Middle and Right: Mass Earnings and RSVPs */}
        <div className="lg:col-span-2 space-y-8" id="member-earnings-events">
          <EarningsAndEvents
            currentLang={currentLang}
            memberId={memberId}
            events={events}
            onUpdateEventRsvp={onUpdateEventRsvp}
          />
          <PracticeConsole />
          <PrayerWall member={member} />
        </div>
      </div>

      </>}

    </div>
  );
};
