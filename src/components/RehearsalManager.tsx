import React, { useState, useMemo } from 'react';
import {
  Music2, Plus, Calendar, Clock, MapPin, Users, CheckCircle2,
  XCircle, ChevronDown, ChevronUp, Pencil, X, BookOpen,
} from 'lucide-react';
import { Rehearsal, RehearsalType, Member, AttendanceRecord } from '../types';

const REHEARSAL_TYPES: RehearsalType[] = [
  'Regular Practice',
  'Pre-Sunday Practice',
  'Feast Preparation',
  'New Song Workshop',
  'Special Preparation',
  'Sectional Practice',
];

const STATUS_COLORS: Record<Rehearsal['status'], string> = {
  Scheduled: 'apple-badge-blue',
  Completed:  'apple-badge-forest',
  Cancelled:  'apple-badge-danger',
};

interface RehearsalManagerProps {
  rehearsals: Rehearsal[];
  members: Member[];
  isAdmin: boolean;
  onAddRehearsal: (r: Rehearsal) => void;
  onUpdateRehearsal: (r: Rehearsal) => void;
  onMarkAttendance: (record: AttendanceRecord) => void;
}

const newId = () => `rehearsal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const RehearsalManager: React.FC<RehearsalManagerProps> = ({
  rehearsals, members, isAdmin, onAddRehearsal, onUpdateRehearsal, onMarkAttendance,
}) => {
  const today = new Date().toISOString().slice(0, 10);

  const [showForm, setShowForm]             = useState(false);
  const [expandedId, setExpandedId]         = useState<string | null>(null);
  const [attendanceOpen, setAttendanceOpen] = useState<string | null>(null);
  const [filter, setFilter]                 = useState<'all' | 'upcoming' | 'completed'>('upcoming');

  // Form state
  const [name, setName]             = useState('Choir Practice');
  const [type, setType]             = useState<RehearsalType>('Regular Practice');
  const [date, setDate]             = useState(today);
  const [start, setStart]           = useState('18:00');
  const [end, setEnd]               = useState('19:30');
  const [venue, setVenue]           = useState('Church Hall');
  const [conductor, setConductor]   = useState('');
  const [notes, setNotes]           = useState('');
  const [saving, setSaving]         = useState(false);

  const sorted = useMemo(() => {
    const list = [...rehearsals].sort((a, b) => a.date < b.date ? 1 : -1);
    if (filter === 'upcoming')  return list.filter(r => r.date >= today && r.status !== 'Cancelled');
    if (filter === 'completed') return list.filter(r => r.status === 'Completed');
    return list;
  }, [rehearsals, filter, today]);

  const activeMembers = useMemo(
    () => members.filter(m => m.status === 'Active Member' || m.status === 'Approved'),
    [members],
  );

  const handleAdd = async () => {
    if (!name || !date) return;
    setSaving(true);
    const rehearsal: Rehearsal = {
      id: newId(), name, type, date,
      startTime: start, endTime: end,
      venue, conductor, notes,
      status: 'Scheduled',
      attendingMemberIds: [],
    };
    onAddRehearsal(rehearsal);
    // reset form
    setName('Choir Practice'); setType('Regular Practice'); setDate(today);
    setStart('18:00'); setEnd('19:30'); setVenue('Church Hall');
    setConductor(''); setNotes('');
    setShowForm(false);
    setSaving(false);
  };

  const toggleAttend = (rehearsalId: string, memberId: string, memberName: string, attending: boolean) => {
    const rehearsal = rehearsals.find(r => r.id === rehearsalId);
    if (!rehearsal) return;
    const currentIds = rehearsal.attendingMemberIds ?? [];
    const newIds = attending
      ? [...currentIds, memberId]
      : currentIds.filter(id => id !== memberId);
    onUpdateRehearsal({ ...rehearsal, attendingMemberIds: newIds });
    onMarkAttendance({
      id: `att-${rehearsalId}-${memberId}`,
      entityId: rehearsalId,
      entityType: 'Rehearsal',
      entityName: rehearsal.name,
      date: rehearsal.date,
      memberId,
      memberName,
      status: attending ? 'Present' : 'Absent',
    });
  };

  const markComplete = (r: Rehearsal) => {
    onUpdateRehearsal({ ...r, status: 'Completed' });
  };

  return (
    <div className="space-y-5 font-apple">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="apple-title">Rehearsals</h2>
          <p className="apple-caption mt-0.5">{rehearsals.length} total · {rehearsals.filter(r=>r.status==='Scheduled').length} scheduled</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(v => !v)}
            className="btn-pill btn-pill-primary flex items-center gap-2">
            <Plus className="h-4 w-4 text-[#f5c24c]" />
            Schedule Rehearsal
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="apple-card p-5 space-y-4" style={{ background: 'rgba(24,57,47,0.06)' }}>
          <div className="flex items-center justify-between">
            <h3 className="apple-title text-sm">New Rehearsal</h3>
            <button onClick={() => setShowForm(false)} className="text-[#86868b] hover:text-[#1d1d1f]"><X className="h-4 w-4"/></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="apple-label">Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="apple-input text-sm" />
            </div>
            <div className="space-y-1">
              <label className="apple-label">Type</label>
              <select value={type} onChange={e => setType(e.target.value as RehearsalType)}
                className="apple-select text-sm">
                {REHEARSAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="apple-label">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="apple-input text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="apple-label">Start</label>
                <input type="time" value={start} onChange={e => setStart(e.target.value)}
                  className="apple-input text-sm" />
              </div>
              <div className="space-y-1">
                <label className="apple-label">End</label>
                <input type="time" value={end} onChange={e => setEnd(e.target.value)}
                  className="apple-input text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="apple-label">Venue</label>
              <input value={venue} onChange={e => setVenue(e.target.value)}
                className="apple-input text-sm" />
            </div>
            <div className="space-y-1">
              <label className="apple-label">Conductor</label>
              <input value={conductor} onChange={e => setConductor(e.target.value)}
                placeholder="Optional"
                className="apple-input text-sm" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="apple-label">Notes / Songs to Practice</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="apple-textarea text-sm" />
          </div>
          <button onClick={handleAdd} disabled={saving || !name || !date}
            className="btn-pill btn-pill-primary w-full disabled:opacity-50">
            {saving ? 'Saving…' : 'Schedule Rehearsal'}
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="apple-segmented">
        {(['upcoming', 'completed', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            aria-selected={filter === f}
            className={`capitalize ${filter === f ? 'is-active' : ''}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Rehearsal cards */}
      {sorted.length === 0 ? (
        <div className="apple-empty apple-card">
          <Music2 className="mx-auto h-8 w-8 text-[#c7c7cc]"/>
          <p className="text-sm font-medium">No rehearsals found</p>
          {isAdmin && <p className="text-xs">Click "Schedule Rehearsal" to add one.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(r => {
            const isExpanded  = expandedId === r.id;
            const showAtt     = attendanceOpen === r.id;
            const attendCount = (r.attendingMemberIds ?? []).length;

            return (
              <div key={r.id} className="apple-card overflow-hidden">
                {/* Card header */}
                <div className="flex items-start gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(24,57,47,0.1)]">
                    <Music2 className="h-5 w-5 text-[#18392f]"/>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold tracking-tight text-sm">{r.name}</p>
                      <span className={`apple-badge ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{r.type}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3"/>{r.date}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3"/>{r.startTime}–{r.endTime}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/>{r.venue}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3"/>{attendCount} attending</span>
                    </div>
                  </div>
                  <button onClick={() => setExpandedId(isExpanded ? null : r.id)} className="p-1 text-slate-400">
                    {isExpanded ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                  </button>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 space-y-3">
                    {r.conductor && <p className="text-xs text-slate-600"><strong>Conductor:</strong> {r.conductor}</p>}
                    {r.notes && (
                      <div className="apple-badge-gold p-3">
                        <p className="text-xs flex items-start gap-2">
                          <BookOpen className="h-3.5 w-3.5 shrink-0 mt-0.5"/>
                          {r.notes}
                        </p>
                      </div>
                    )}
                    {/* Admin actions */}
                    {isAdmin && (
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setAttendanceOpen(showAtt ? null : r.id)}
                          className="btn-pill btn-pill-secondary btn-pill-sm flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5"/> Mark Attendance
                        </button>
                        {r.status === 'Scheduled' && (
                          <button onClick={() => markComplete(r)}
                            className="btn-pill btn-pill-primary btn-pill-sm flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5"/> Mark Completed
                          </button>
                        )}
                        <button onClick={() => onUpdateRehearsal({ ...r, status: 'Cancelled' })}
                          className="btn-pill btn-pill-sm flex items-center gap-1.5 apple-badge-danger">
                          <XCircle className="h-3.5 w-3.5"/> Cancel
                        </button>
                      </div>
                    )}

                    {/* Attendance panel */}
                    {showAtt && (
                      <div className="apple-grouped overflow-hidden">
                        <div className="apple-list-row apple-label border-b border-[rgba(0,0,0,0.08)]">
                          Attendance — {r.date}
                        </div>
                        <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                          {activeMembers.map(m => {
                            const attending = (r.attendingMemberIds ?? []).includes(m.id);
                            return (
                              <div key={m.id} className="flex items-center justify-between px-3 py-2">
                                <div>
                                  <p className="text-xs font-semibold text-slate-800">{m.firstName} {m.lastName}</p>
                                  <p className="text-[10px] text-slate-400">{m.voiceType} · {m.memberType}</p>
                                </div>
                                <button onClick={() => toggleAttend(r.id, m.id, `${m.firstName} ${m.lastName}`, !attending)}
                                  className={`btn-pill btn-pill-xs ${attending ? 'apple-badge-forest' : 'apple-badge-muted'}`}>
                                  {attending ? '✓ Present' : '✗ Absent'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
