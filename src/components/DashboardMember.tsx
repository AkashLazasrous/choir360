import React, { useState } from 'react';
import { Member, Language, ChoirEvent, Mass, AttendanceRecord, Payment, Rehearsal, Tab } from '../types';
import { Activity, AlertCircle, IdCard } from 'lucide-react';
import { DigitalChoirID } from './DigitalChoirID';
import { ProfileCard } from '../features/memberDashboard/ProfileCard';
import { AvailabilityCard } from '../features/memberDashboard/AvailabilityCard';
import { BadgesCard } from '../features/memberDashboard/BadgesCard';
import { EarningsAndEvents } from '../features/memberDashboard/EarningsAndEvents';
import { PracticeConsole } from '../features/memberDashboard/PracticeConsole';
import { PrayerWall } from '../features/memberDashboard/PrayerWall';
import { computeMemberRosterStats } from '../utils/attendanceStats';
import { formatINR } from '../utils/currency';
import { AttendanceLeaderboard } from '../features/attendance/AttendanceLeaderboard';
import { MobileHomeDashboard } from './mobileDashboard';
import {
  LoggedLiturgySection,
  type LiturgyLogClear,
  type LiturgyLogRemove,
  type LiturgySongNotesSave,
} from './LoggedLiturgySection';

interface DashboardMemberProps {
  currentLang: Language;
  memberId: string; // The logged-in member context.
  members: Member[];
  events: ChoirEvent[];
  masses: Mass[];
  rehearsals?: Rehearsal[];
  payments?: Payment[];
  attendanceRecords?: AttendanceRecord[];
  isAdmin?: boolean;
  onSaveLiturgySongNotes?: (payload: LiturgySongNotesSave) => Promise<{ ok: boolean; error?: string }>;
  onRemoveLiturgyLog?: (payload: LiturgyLogRemove) => Promise<{ ok: boolean; error?: string }>;
  onClearLiturgyLog?: (payload: LiturgyLogClear) => Promise<{ ok: boolean; error?: string }>;
  onUpdateMemberDetails: (updated: Member) => void;
  onUpdateEventRsvp: (eventId: string, memberId: string, status: 'Going' | 'Not Going' | 'Maybe') => void;
  onNavigate?: (tab: Tab) => void;
  loading?: boolean;
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
  masses,
  rehearsals = [],
  payments = [],
  attendanceRecords = [],
  isAdmin = false,
  onSaveLiturgySongNotes,
  onRemoveLiturgyLog,
  onClearLiturgyLog,
  onUpdateMemberDetails,
  onUpdateEventRsvp,
  onNavigate,
  loading = false,
}) => {
  const member = members.find(m => m.id === memberId) || members[0];
  const liveStats = computeMemberRosterStats(attendanceRecords, members, masses, payments)
    .find((s) => s.memberId === (member?.id ?? memberId));

  const [dashTab, setDashTab] = useState<'overview' | 'id_card'>('overview');
  const [hasRequestedChange, setHasRequestedChange] = useState(false);

  const handleEditRequested = () => {
    setHasRequestedChange(true);
    setTimeout(() => setHasRequestedChange(false), 6000);
  };

  const go = onNavigate ?? (() => undefined);

  return (
    <div className="space-y-5 animate-fade-in sm:space-y-6" id="member-dashboard-subcontainer">

      {/* Sub-tab — compact on phone so Home stays the first composition */}
      <div className="flex w-full gap-1 rounded-2xl bg-[#0e3d4c]/[0.06] p-1 sm:w-fit lg:mt-0">
        <button
          type="button"
          onClick={() => setDashTab('overview')}
          className={`flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold transition sm:min-h-[44px] sm:flex-none sm:px-4 sm:py-2 sm:text-[13px] ${
            dashTab === 'overview'
              ? 'bg-white text-[#0e3d4c] shadow-sm'
              : 'text-[#86868b] hover:text-[#1d1d1f]'
          }`}
        >
          <Activity className="h-3.5 w-3.5" /> Overview
        </button>
        <button
          type="button"
          onClick={() => setDashTab('id_card')}
          className={`flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold transition sm:min-h-[44px] sm:flex-none sm:px-4 sm:py-2 sm:text-[13px] ${
            dashTab === 'id_card'
              ? 'bg-white text-[#0e3d4c] shadow-sm'
              : 'text-[#86868b] hover:text-[#1d1d1f]'
          }`}
        >
          <IdCard className="h-3.5 w-3.5" /> Digital ID
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

      <MobileHomeDashboard
        variant="member"
        members={members}
        masses={masses}
        rehearsals={rehearsals}
        payments={payments}
        events={events}
        attendanceRecords={attendanceRecords}
        member={member}
        loading={loading}
        isAdmin={isAdmin}
        onSaveLiturgySongNotes={onSaveLiturgySongNotes}
        onRemoveLiturgyLog={onRemoveLiturgyLog}
        onClearLiturgyLog={onClearLiturgyLog}
        onNavigate={go}
      />

      <div className="hidden space-y-5 lg:block">
      {/* Header Summary */}
      <div className="apple-card website-panel font-apple flex flex-col items-center justify-between gap-5 p-5 sm:gap-6 sm:p-6 md:flex-row md:items-start" data-reveal id="dashboard-member-header">
        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
          <img
            src={member.photoUrl}
            alt={member.firstName}
            referrerPolicy="no-referrer"
            className="h-16 w-16 rounded-full object-cover ring-2 ring-[#0e3d4c]/20 sm:h-[4.5rem] sm:w-[4.5rem]"
          />
          <div>
            <h3 className="flex flex-wrap items-center justify-center gap-2 text-[20px] font-semibold tracking-[-0.02em] text-[#1d1d1f] sm:text-[21px] md:justify-start">
              {member.firstName} {member.lastName}
              <span className="apple-badge-forest">
                {member.status}
              </span>
            </h3>
            <p className="mt-1 text-[13px] text-[#86868b]">{member.memberType} · Voice: <strong className="font-medium text-[#0e3d4c]">{member.voiceType}</strong></p>
            <p className="mt-0.5 text-[12px] text-[#86868b]">ID: {member.id} · {member.parish}</p>
          </div>
        </div>

        <div className="flex w-full shrink-0 items-center gap-4 rounded-2xl bg-[rgba(14,61,76,0.06)] p-4 md:w-auto">
          <div className="text-center">
            <p className="text-[28px] font-semibold tracking-[-0.03em] text-[#0e3d4c]">
              {liveStats?.finalPercent ?? member.attendanceRate ?? 0}%
            </p>
            <p className="text-[12px] font-medium text-[#86868b]">Attendance</p>
          </div>
          <div className="min-w-0 flex-1 space-y-0.5 border-l border-black/10 pl-3 text-[13px] text-[#3a3a3c] md:flex-none">
            <p>Masses: <span className="font-semibold text-[#0e3d4c]">{liveStats?.massAttended ?? 0} / {liveStats?.massLogged ?? 0}</span></p>
            <p>Present: <span className="font-semibold text-[#0e3d4c]">{liveStats?.present ?? 0}</span> · Late: <span className="font-semibold text-[#8a6a10]">{liveStats?.late ?? 0}</span></p>
            <p>Absent: <span className="font-semibold text-[#d70015]">{liveStats?.absent ?? 0}</span> · Share: <span className="font-semibold text-[#0e3d4c]">{formatINR(liveStats?.totalShareINR ?? 0)}</span></p>
          </div>
        </div>
      </div>

      <LoggedLiturgySection
        variant="desk"
        masses={masses}
        rehearsals={rehearsals}
        attendanceRecords={attendanceRecords}
        isAdmin={isAdmin}
        onNavigate={go}
        onSaveSongNotes={onSaveLiturgySongNotes}
        onRemoveLog={onRemoveLiturgyLog}
        onClearLog={onClearLiturgyLog}
      />

      {hasRequestedChange && (
        <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200 text-xs font-medium flex items-center gap-2" id="edit-request-banner">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />
          <span>
            Profile update request submitted. Local administrators (Choir Admin / Super Admin) have received the notification to verify and publish changes.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-8">
        {/* Left Column: Profile edit & Availability RSVPs */}
        <div className="space-y-5 lg:space-y-8" id="member-profile-controls">
          <ProfileCard
            member={member}
            onUpdateMemberDetails={onUpdateMemberDetails}
            onEditRequested={handleEditRequested}
          />
          <AvailabilityCard currentLang={currentLang} />
          <BadgesCard />
        </div>

        {/* Middle and Right: Mass Earnings and RSVPs */}
        <div className="space-y-5 lg:col-span-2 lg:space-y-8" id="member-earnings-events">
          <AttendanceLeaderboard
            attendanceRecords={attendanceRecords}
            members={members}
            viewerMemberId={member?.id ?? memberId}
            limit={8}
            compact
          />
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
      </div>

      </>}

    </div>
  );
};
