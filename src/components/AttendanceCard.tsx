import React, { useState } from 'react';
import { Check, Clock, X, Music2, Guitar, Mic2, MapPin, ChevronDown } from 'lucide-react';

type AttendanceStatus = 'present' | 'absent' | 'late';
type MemberRole = 'Singer' | 'Instrumentalist';

interface AttendanceMember {
  id: string;
  photoUrl: string;
  firstName: string;
  lastName: string;
  tamilName?: string;
  voiceType?: string;
  memberType: string;
  parish: string;
}

interface AttendanceCardProps {
  member: AttendanceMember;
  massName: string;
  massDate: string;
  massTime: string;
  massCategory?: string;
  onStatusChange?: (memberId: string, status: AttendanceStatus, role: MemberRole) => void;
}

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; tamilLabel: string; icon: React.ReactNode; classes: string; dot: string }> = {
  present: {
    label: 'Present',
    tamilLabel: 'வந்தார்',
    icon: <Check className="w-3.5 h-3.5" />,
    classes: 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-200 shadow-sm',
    dot: 'bg-emerald-400',
  },
  late: {
    label: 'Late',
    tamilLabel: 'தாமதம்',
    icon: <Clock className="w-3.5 h-3.5" />,
    classes: 'bg-amber-500 text-white border-amber-500 shadow-amber-200 shadow-sm',
    dot: 'bg-amber-400',
  },
  absent: {
    label: 'Absent',
    tamilLabel: 'வரவில்லை',
    icon: <X className="w-3.5 h-3.5" />,
    classes: 'bg-rose-500 text-white border-rose-500 shadow-rose-200 shadow-sm',
    dot: 'bg-rose-400',
  },
};

const isSinger = (memberType: string) =>
  memberType === 'Singer';

export const AttendanceCard: React.FC<AttendanceCardProps> = ({
  member,
  massName,
  massDate,
  massTime,
  massCategory = 'Sunday Mass',
  onStatusChange,
}) => {
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [role, setRole] = useState<MemberRole>(isSinger(member.memberType) ? 'Singer' : 'Instrumentalist');
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const handleStatus = (s: AttendanceStatus) => {
    setStatus(s);
    onStatusChange?.(member.id, s, role);
  };

  const cfg = status ? STATUS_CONFIG[status] : null;
  const isSpecial = ['Special Mass', 'Death Mass', 'Death Anniversary Mass'].includes(massCategory);

  return (
    <div className={`relative w-full max-w-sm rounded-3xl border bg-white shadow-md overflow-visible transition-all duration-200 ${
      cfg ? 'border-transparent ring-2 ' + (status === 'present' ? 'ring-emerald-200' : status === 'late' ? 'ring-amber-200' : 'ring-rose-200') : 'border-slate-200'
    }`}>

      {/* Mass header band */}
      <div className={`px-5 py-3 rounded-t-3xl flex items-center justify-between ${isSpecial ? 'bg-amber-50' : 'bg-[#18392f]'}`}>
        <div className="min-w-0">
          <p className={`text-[9px] font-bold uppercase tracking-widest ${isSpecial ? 'text-amber-700' : 'text-emerald-300/70'}`}>
            {massCategory}
          </p>
          <p className={`text-sm font-bold truncate ${isSpecial ? 'text-amber-900' : 'text-white'}`}>{massName}</p>
        </div>
        <div className={`text-right shrink-0 ml-3 ${isSpecial ? 'text-amber-700' : 'text-emerald-200/80'}`}>
          <p className="text-[10px] font-bold">{massDate}</p>
          <p className="text-[10px]">{massTime}</p>
        </div>
      </div>

      {/* Member info */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-4">
        <div className="relative shrink-0">
          <img
            src={member.photoUrl}
            alt={member.firstName}
            referrerPolicy="no-referrer"
            className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
          />
          {cfg && (
            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${cfg.dot}`} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 text-sm leading-tight">
            {member.firstName} {member.lastName}
          </p>
          {member.tamilName && (
            <p className="text-[11px] text-slate-500 font-medium mt-0.5" style={{ fontFamily: 'inherit' }}>
              {member.tamilName}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {member.voiceType && member.voiceType !== 'None' && (
              <span className="flex items-center gap-0.5 px-2 py-0.5 bg-blue-50 text-blue-800 text-[9px] font-bold rounded-full border border-blue-100">
                <Mic2 className="w-2.5 h-2.5" /> {member.voiceType}
              </span>
            )}
            <span className="flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-full">
              {isSinger(member.memberType) ? <Music2 className="w-2.5 h-2.5" /> : <Guitar className="w-2.5 h-2.5" />}
              {member.memberType}
            </span>
          </div>
          <p className="flex items-center gap-1 text-[9px] text-slate-400 mt-1">
            <MapPin className="w-2.5 h-2.5 shrink-0" /> {member.parish}
          </p>
        </div>
      </div>

      {/* Role selector (for special masses) */}
      {isSpecial && (
        <div className="px-5 pb-2 relative">
          <button
            onClick={() => setShowRoleMenu((o) => !o)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <span>Role: <strong>{role}</strong> {role === 'Singer' ? '(Weight ×1)' : '(Weight ×2)'}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showRoleMenu ? 'rotate-180' : ''}`} />
          </button>
          {showRoleMenu && (
            <div className="absolute left-5 right-5 top-full z-10 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
              {(['Singer', 'Instrumentalist'] as MemberRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => { setRole(r); setShowRoleMenu(false); onStatusChange?.(member.id, status ?? 'present', r); }}
                  className={`w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-emerald-50 transition ${role === r ? 'text-emerald-700 bg-emerald-50' : 'text-slate-700'}`}
                >
                  {r} {r === 'Singer' ? '— Weight ×1' : '— Weight ×2'}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attendance status buttons */}
      <div className="px-5 pb-5 pt-2">
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">
          குடியிருப்பு நிலை · Attendance
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(STATUS_CONFIG) as [AttendanceStatus, typeof STATUS_CONFIG[AttendanceStatus]][]).map(([s, c]) => (
            <button
              key={s}
              onClick={() => handleStatus(s)}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-2xl border-2 text-[10px] font-bold transition-all duration-150 active:scale-95 ${
                status === s ? c.classes : 'border-slate-200 text-slate-500 bg-slate-50 hover:border-slate-300'
              }`}
            >
              {c.icon}
              <span>{c.label}</span>
              <span className={`text-[8px] font-medium ${status === s ? 'opacity-80' : 'text-slate-400'}`}>{c.tamilLabel}</span>
            </button>
          ))}
        </div>

        {/* Status pill */}
        {cfg && (
          <div className={`mt-3 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold ${
            status === 'present' ? 'bg-emerald-50 text-emerald-800' :
            status === 'late' ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-800'
          }`}>
            {cfg.icon} Marked {cfg.label} · {cfg.tamilLabel}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Demo grid ──────────────────────────────────────────────────────────────────
const DEMO_MEMBERS: AttendanceMember[] = [
  { id: 'M001', photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', firstName: 'Joseph', lastName: 'Raj', tamilName: 'யோசேப் ராஜ்', voiceType: 'Tenor', memberType: 'Singer', parish: 'St. Thomas Cathedral' },
  { id: 'M002', photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', firstName: 'Maria', lastName: 'Therese', tamilName: 'மரிய தெரேஸ்', voiceType: 'Soprano', memberType: 'Singer', parish: 'St. Thomas Cathedral' },
  { id: 'M003', photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', firstName: 'Anthony', lastName: 'Samy', tamilName: 'அந்தோணி சாமி', voiceType: 'None', memberType: 'Keyboard', parish: 'St. Thomas Cathedral' },
];

export const AttendanceCardDemo: React.FC = () => {
  const [log, setLog] = useState<Record<string, { status: AttendanceStatus; role: MemberRole }>>({});

  const handleChange = (id: string, status: AttendanceStatus, role: MemberRole) => {
    setLog((prev) => ({ ...prev, [id]: { status, role } }));
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 space-y-6">
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">CHOIR360 X · Demo</p>
          <h1 className="text-2xl font-bold text-slate-800">திருப்பலி வருகை · Mass Attendance</h1>
          <p className="text-sm text-slate-500">St. Thomas Cathedral Choir — Sunday Mass</p>
        </div>

        <div className="space-y-4">
          {DEMO_MEMBERS.map((m) => (
            <AttendanceCard
              key={m.id}
              member={m}
              massName="Sunday Solemn Mass"
              massDate="22 Jun 2025"
              massTime="06:30 AM"
              massCategory="Sunday Mass"
              onStatusChange={handleChange}
            />
          ))}
        </div>

        {Object.keys(log).length > 0 && (
          <div className="mt-6 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Live Attendance Log</p>
            <div className="space-y-2">
              {DEMO_MEMBERS.filter((m) => log[m.id]).map((m) => {
                const entry = log[m.id];
                const cfg = STATUS_CONFIG[entry.status];
                return (
                  <div key={m.id} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{m.firstName} {m.lastName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{entry.role}</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        entry.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                        entry.status === 'late' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>{cfg.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceCard;
