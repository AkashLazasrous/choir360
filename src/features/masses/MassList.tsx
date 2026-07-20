import React, { useState } from 'react';
import {
  BookOpen, Check, ChevronDown, ChevronUp, IndianRupee, Loader2, MoreHorizontal,
  Pencil, Plus, Trash2, UserPlus, Users, X,
} from 'lucide-react';
import { AttendanceStatus, Mass, MassGuest, MassGuestRole, Member, Payment } from '../../types';
import { formatINR } from '../../utils/currency';
import { calculatePaymentShares } from '../../utils/choirStats';
import { ALL_MASS_CATEGORIES, createUniqueId, isPaymentMass } from './shared';
import { AmPmTimeField } from './AmPmTimeField';
import { isOptInSpecialMassCategory } from '../../utils/attendanceTaxonomy';

export type MassAttendanceSavePayload = {
  mass: Mass;
  marks: Record<string, AttendanceStatus | null>;
  guests: MassGuest[];
};

interface MassListProps {
  masses: Mass[];
  payments: Payment[];
  members: Member[];
  isAdmin: boolean;
  onUpdateMass?: (mass: Mass) => Promise<{ ok: boolean; error?: string }> | void;
  onDeleteMass?: (massId: string) => void;
  onSaveMassAttendance?: (payload: MassAttendanceSavePayload) => Promise<{ ok: boolean; error?: string }>;
}

function memberInitials(member: Member): string {
  return `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase() || '?';
}

const MemberAvatar: React.FC<{ member: Member; present?: boolean }> = ({ member, present }) => {
  if (member.photoUrl) {
    return (
      <img
        src={member.photoUrl}
        alt=""
        className={`h-9 w-9 shrink-0 rounded-full object-cover ring-2 ${present ? 'ring-[#18392f]/40' : 'ring-black/10'}`}
      />
    );
  }
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
        present ? 'bg-[#18392f] text-white' : 'bg-slate-200 text-slate-700'
      }`}
      aria-hidden
    >
      {memberInitials(member)}
    </span>
  );
};

/** Logged liturgies with attendance sheet and edit modal — mobile overflow actions. */
export const MassList: React.FC<MassListProps> = ({
  masses,
  payments,
  members,
  isAdmin,
  onUpdateMass,
  onDeleteMass,
  onSaveMassAttendance,
}) => {
  const [attendanceOpen, setAttendanceOpen] = useState<string | null>(null);
  const [editingMass, setEditingMass] = useState<Mass | null>(null);
  const [editError, setEditError] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [draftPresent, setDraftPresent] = useState<Record<string, Record<string, boolean>>>({});
  const [draftGuests, setDraftGuests] = useState<Record<string, MassGuest[]>>({});
  const [guestFormOpen, setGuestFormOpen] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestRole, setGuestRole] = useState<MassGuestRole>('Singer');
  const [guestAmount, setGuestAmount] = useState<string>('');
  const [savingAttendanceId, setSavingAttendanceId] = useState<string | null>(null);
  const [attendanceMsg, setAttendanceMsg] = useState<string | null>(null);

  const activeMembers = members.filter((m) => ['Active Member', 'Approved', 'Admin'].includes(m.status));

  const presentMapFor = (mass: Mass): Record<string, boolean> => {
    if (draftPresent[mass.id]) return draftPresent[mass.id];
    const map: Record<string, boolean> = {};
    for (const id of mass.attendingMemberIds ?? []) map[id] = true;
    return map;
  };

  const guestsFor = (mass: Mass): MassGuest[] => {
    const raw = draftGuests[mass.id] ?? mass.guestAttendees ?? [];
    return raw.map((g) => ({
      ...g,
      amount: Number(g.amount) > 0 ? Math.round(Number(g.amount)) : 0,
    }));
  };

  const openAttendance = (mass: Mass) => {
    const nextOpen = attendanceOpen === mass.id ? null : mass.id;
    setAttendanceOpen(nextOpen);
    setMenuOpenId(null);
    setGuestFormOpen(null);
    if (nextOpen && !draftPresent[mass.id]) {
      const map: Record<string, boolean> = {};
      for (const id of mass.attendingMemberIds ?? []) map[id] = true;
      setDraftPresent((prev) => ({ ...prev, [mass.id]: map }));
    }
    if (nextOpen && !draftGuests[mass.id]) {
      setDraftGuests((prev) => ({ ...prev, [mass.id]: [...(mass.guestAttendees ?? [])] }));
    }
  };

  const togglePresent = (massId: string, memberId: string) => {
    setDraftPresent((prev) => {
      const current = { ...(prev[massId] ?? {}) };
      current[memberId] = !current[memberId];
      return { ...prev, [massId]: current };
    });
  };

  const addGuest = (massId: string) => {
    const name = guestName.trim();
    const amount = Math.max(0, Math.round(Number(guestAmount) || 0));
    if (!name || amount <= 0) return;
    const guest: MassGuest = {
      id: createUniqueId('guest'),
      name,
      role: guestRole,
      amount,
    };
    setDraftGuests((prev) => ({
      ...prev,
      [massId]: [...(prev[massId] ?? []), guest],
    }));
    setGuestName('');
    setGuestRole('Singer');
    setGuestAmount('');
    setGuestFormOpen(null);
  };

  const updateGuestAmount = (massId: string, guestId: string, amountRaw: string) => {
    const amount = Math.max(0, Math.round(Number(amountRaw) || 0));
    setDraftGuests((prev) => ({
      ...prev,
      [massId]: (prev[massId] ?? []).map((g) => (g.id === guestId ? { ...g, amount } : g)),
    }));
  };

  const removeGuest = (massId: string, guestId: string) => {
    setDraftGuests((prev) => ({
      ...prev,
      [massId]: (prev[massId] ?? []).filter((g) => g.id !== guestId),
    }));
  };

  const handleSaveAttendance = async (mass: Mass) => {
    if (!onSaveMassAttendance) return;
    const present = presentMapFor(mass);
    const optInSpecial = isOptInSpecialMassCategory(mass.category)
      || mass.activityKind === 'special_mass';
    const marks: Record<string, AttendanceStatus | null> = {};
    for (const mem of activeMembers) {
      if (present[mem.id]) {
        marks[mem.id] = 'Present';
      } else if (optInSpecial) {
        // Unmarked on special rites ≠ Absent — clear any prior auto-Absent.
        marks[mem.id] = null;
      } else {
        marks[mem.id] = 'Absent';
      }
    }
    const guests = guestsFor(mass);
    setSavingAttendanceId(mass.id);
    setAttendanceMsg(null);
    const result = await onSaveMassAttendance({
      mass: { ...mass, guestAttendees: guests },
      marks,
      guests,
    });
    setSavingAttendanceId(null);
    if (result.ok) {
      setAttendanceMsg(
        isPaymentMass(mass.category) || mass.specialMassBilling === 'paid'
          ? 'Attendance saved · shares split Singer ×1 / Musician ×2 and synced.'
          : 'Attendance saved.',
      );
      setTimeout(() => setAttendanceMsg(null), 4000);
    } else {
      setAttendanceMsg(result.error ?? 'Could not save attendance.');
    }
  };

  const getAttendees = (mass: Mass) => {
    const ids = Object.entries(presentMapFor(mass))
      .filter(([, present]) => present)
      .map(([id]) => id);
    const source = ids.length > 0 || draftPresent[mass.id]
      ? ids
      : (mass.attendingMemberIds ?? []);
    return source
      .map((id) => activeMembers.find((mem) => mem.id === id))
      .filter(Boolean) as Member[];
  };

  const getPaymentBreakdown = (mass: Mass) => {
    const attendees = getAttendees(mass);
    const guests = guestsFor(mass);
    const singerMembers = attendees.filter((mem) => mem.memberType === 'Singer' || mem.memberType === 'Other');
    const musicianMembers = attendees.filter((mem) => !['Singer', 'Other'].includes(mem.memberType));
    const singerCount = singerMembers.length;
    const musicianCount = musicianMembers.length;
    const guestTotal = guests.reduce((sum, g) => sum + (Number(g.amount) > 0 ? Number(g.amount) : 0), 0);

    const linked = payments.find((p) => p.massId === mass.id);
    const hintAmount = Number(mass.specialMassPayment?.amount);
    const amount = linked?.promisedAmount
      ?? (Number.isFinite(hintAmount) && hintAmount > 0 ? hintAmount : 0);
    if (amount <= 0) return null;

    const payment = linked ?? {
      id: `payment-${mass.id}`,
      massId: mass.id,
      partyName: mass.specialMassPayment?.whoPaid || 'Sponsor',
      mobile: '',
      massType: mass.category,
      massDate: mass.date,
      massTime: mass.time,
      promisedAmount: amount,
      receivedAmount: 0,
      pendingAmount: amount,
      status: 'Pending' as const,
    };

    const memberPool = Math.max(0, payment.promisedAmount - guestTotal);
    const c = calculatePaymentShares(memberPool, singerCount, musicianCount);
    return {
      singerMembers,
      musicianMembers,
      guests,
      singerCount,
      musicianCount,
      guestTotal,
      memberPool,
      ...c,
      payment,
    };
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMass || !onUpdateMass) return;
    setEditError('');
    const result = await onUpdateMass(editingMass);
    if (result && !result.ok) {
      setEditError(`Save failed: ${result.error}`);
      return;
    }
    setEditingMass(null);
  };

  const handleDeleteMass = (massId: string, massName: string) => {
    if (!onDeleteMass) return;
    if (window.confirm(`Delete "${massName}"? You can undo from the notification afterwards.`)) {
      onDeleteMass(massId);
    }
    setMenuOpenId(null);
  };

  if (masses.length === 0) return null;

  return (
    <div className="apple-card font-apple space-y-4 p-5 lg:p-6">
      <div className="mb-2 flex items-center gap-2 border-b border-black/[0.06] pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#18392f]">
          <BookOpen className="h-3.5 w-3.5 text-amber-300" />
        </div>
        <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">All Logged Liturgies</h3>
        <span className="ml-auto text-[12px] font-medium text-[#86868b]">{masses.length} entries</span>
      </div>

      <div className="space-y-3">
        {masses.map((m) => {
          const isOpen = attendanceOpen === m.id;
          const attendees = getAttendees(m);
          const guests = guestsFor(m);
          const bdown = getPaymentBreakdown(m);
          const presentCount = Object.values(presentMapFor(m)).filter(Boolean).length;
          const menuOpen = menuOpenId === m.id;
          const paid = isPaymentMass(m.category) || m.specialMassBilling === 'paid';

          return (
            <div key={m.id} className="overflow-hidden rounded-2xl border border-black/[0.06]">
              <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[16px] font-semibold tracking-[-0.015em] text-[#1d1d1f]">{m.name}</p>
                    <span className={isPaymentMass(m.category) ? 'apple-badge-gold' : 'apple-badge-muted'}>
                      {m.category}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[13px] text-[#86868b]">{m.date} · {m.time} · {m.language}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openAttendance(m)}
                    className="btn-pill btn-pill-secondary btn-pill-sm !min-h-[44px] flex-1 !text-[13px] sm:flex-none"
                  >
                    <Users className="h-4 w-4" />
                    {presentCount > 0 ? `${presentCount} present` : (isAdmin ? 'Put attendance' : 'Attendance')}
                    {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>

                  {isAdmin && (onUpdateMass || onDeleteMass) && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setMenuOpenId(menuOpen ? null : m.id)}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-black/[0.05] text-[#1d1d1f]"
                        aria-label="More actions"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                      {menuOpen && (
                        <>
                          <button
                            type="button"
                            className="fixed inset-0 z-10 cursor-default"
                            aria-label="Close menu"
                            onClick={() => setMenuOpenId(null)}
                          />
                          <div className="absolute right-0 top-[calc(100%+4px)] z-20 min-w-[10rem] overflow-hidden rounded-2xl border border-black/[0.08] bg-white py-1 shadow-lg">
                            {onUpdateMass && (
                              <button
                                type="button"
                                onClick={() => { setEditingMass({ ...m }); setMenuOpenId(null); }}
                                className="flex w-full min-h-[44px] items-center gap-2 px-4 text-left text-[15px] text-[#1d1d1f] hover:bg-black/[0.04]"
                              >
                                <Pencil className="h-4 w-4 text-[#86868b]" /> Edit
                              </button>
                            )}
                            {onDeleteMass && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMass(m.id, m.name)}
                                className="flex w-full min-h-[44px] items-center gap-2 px-4 text-left text-[15px] text-[#d70015] hover:bg-[rgba(14,61,76,0.06)]"
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {isOpen && (
                <div className="website-light-surface space-y-4 border-t border-slate-200 bg-[#f5f5f7] px-4 py-4">
                  <div>
                    <p className="mb-2 flex flex-wrap items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                      <Users className="h-3.5 w-3.5" /> Attendance
                      {paid && (
                        <span className="ml-1 font-normal normal-case tracking-normal text-[#8a6a10]">
                          · paid rite — shares use Singer ×1 · Musician ×2
                        </span>
                      )}
                    </p>
                    {(isOptInSpecialMassCategory(m.category) || m.activityKind === 'special_mass') && (
                      <p className="mb-2 text-[12px] text-slate-600">
                        Special rite: only tap members who attended. Unmarked members are not counted as Absent.
                      </p>
                    )}
                    {isAdmin && onSaveMassAttendance ? (
                      <>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                          {activeMembers.map((mem) => {
                            const present = !!presentMapFor(m)[mem.id];
                            const isInstrumentalist = !['Singer', 'Other'].includes(mem.memberType);
                            const optIn = isOptInSpecialMassCategory(m.category) || m.activityKind === 'special_mass';
                            const statusLabel = present ? 'Present' : (optIn ? 'Unmarked' : 'Absent');
                            return (
                              <button
                                key={mem.id}
                                type="button"
                                onClick={() => togglePresent(m.id, mem.id)}
                                className={`flex min-h-[56px] items-center gap-3 rounded-2xl border px-3 py-2.5 text-left text-[14px] transition ${
                                  present
                                    ? isInstrumentalist
                                      ? 'liturgy-attendee-musician border-[rgba(245,194,76,0.55)] bg-[rgba(245,194,76,0.22)]'
                                      : 'liturgy-attendee-present border-[rgba(24,57,47,0.35)] bg-[rgba(24,57,47,0.12)]'
                                    : 'liturgy-attendee-muted border-slate-200 bg-white'
                                }`}
                              >
                                <MemberAvatar member={mem} present={present} />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate font-semibold text-slate-900">
                                    {mem.firstName} {mem.lastName}
                                  </span>
                                  <span className="block text-[12px] text-slate-600">
                                    {mem.memberType} · {statusLabel}
                                  </span>
                                </span>
                                {present && (
                                  <Check className={`h-4 w-4 shrink-0 ${isInstrumentalist ? 'text-[#8a6a10]' : 'text-[#18392f]'}`} />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Guest pay — not attendance; fixed ₹ deducted before member split */}
                        {paid && (
                          <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
                            <p className="text-[12px] font-semibold text-slate-800">
                              Guest pay (fixed amount · not in attendance)
                            </p>
                            {guests.length > 0 && (
                              <div className="space-y-2">
                                {guests.map((g) => (
                                  <div
                                    key={g.id}
                                    className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:flex-row sm:items-center"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-[14px] font-semibold text-slate-900">{g.name}</p>
                                      <p className="text-[12px] text-slate-600">{g.role}</p>
                                    </div>
                                    <label className="flex items-center gap-2 text-[12px] font-medium text-slate-600">
                                      Amount ₹
                                      <input
                                        type="number"
                                        min={0}
                                        step={1}
                                        value={g.amount || ''}
                                        onChange={(e) => updateGuestAmount(m.id, g.id, e.target.value)}
                                        className="apple-input w-28 text-sm tabular-nums"
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => removeGuest(m.id, g.id)}
                                      className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-black/5"
                                      aria-label={`Remove guest ${g.name}`}
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            {guestFormOpen === m.id ? (
                              <div className="space-y-2 rounded-xl border border-dashed border-slate-300 p-3">
                                <input
                                  value={guestName}
                                  onChange={(e) => setGuestName(e.target.value)}
                                  placeholder="Guest name"
                                  className="apple-input text-sm"
                                />
                                <select
                                  value={guestRole}
                                  onChange={(e) => setGuestRole(e.target.value as MassGuestRole)}
                                  className="apple-select text-sm"
                                >
                                  <option value="Singer">Singer</option>
                                  <option value="Musician">Musician</option>
                                </select>
                                <input
                                  type="number"
                                  min={1}
                                  step={1}
                                  value={guestAmount}
                                  onChange={(e) => setGuestAmount(e.target.value)}
                                  placeholder="Amount ₹"
                                  className="apple-input text-sm tabular-nums"
                                />
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setGuestFormOpen(null);
                                      setGuestName('');
                                      setGuestAmount('');
                                    }}
                                    className="btn-pill btn-pill-secondary flex-1"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => addGuest(m.id)}
                                    disabled={!guestName.trim() || !(Number(guestAmount) > 0)}
                                    className="btn-pill btn-pill-primary flex-1 inline-flex items-center justify-center gap-1"
                                  >
                                    <Plus className="h-4 w-4" /> Add guest
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setGuestFormOpen(m.id)}
                                className="btn-pill btn-pill-secondary inline-flex items-center gap-2"
                              >
                                <UserPlus className="h-4 w-4" /> Guest
                              </button>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          disabled={savingAttendanceId === m.id || activeMembers.length === 0}
                          onClick={() => void handleSaveAttendance(m)}
                          className="btn-pill btn-pill-primary mt-3 inline-flex items-center gap-2"
                        >
                          {savingAttendanceId === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          Save attendance{paid ? ' & split shares' : ''}
                        </button>
                      </>
                    ) : attendees.length === 0 ? (
                      <p className="text-[14px] text-slate-600">No attendance logged yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                        {attendees.map((mem) => {
                          const isInstrumentalist = !['Singer', 'Other'].includes(mem.memberType);
                          return (
                            <div
                              key={mem.id}
                              className={`flex min-h-[56px] items-center gap-3 rounded-2xl border px-3 py-2.5 text-[14px] ${
                                isInstrumentalist
                                  ? 'liturgy-attendee-musician border-[rgba(245,194,76,0.45)] bg-[rgba(245,194,76,0.14)]'
                                  : 'liturgy-attendee-present border-[rgba(24,57,47,0.25)] bg-[rgba(24,57,47,0.08)]'
                              }`}
                            >
                              <MemberAvatar member={mem} present />
                              <span>
                                <span className="block font-semibold text-slate-900">{mem.firstName} {mem.lastName}</span>
                                <span className="block text-[12px] text-slate-600">{mem.memberType}</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {bdown && (attendees.length > 0 || bdown.guests.length > 0) && (
                    <div className="rounded-2xl border border-[rgba(245,194,76,0.35)] bg-[rgba(245,194,76,0.12)] p-4">
                      <p className="mb-3 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[#8a6a10]">
                        <IndianRupee className="h-3.5 w-3.5" /> Payment distribution
                      </p>
                      <div className="mb-3 flex flex-wrap gap-3 text-[13px] text-slate-700">
                        <span>Total: <strong className="text-[#18392f]">{formatINR(bdown.payment.promisedAmount)}</strong></span>
                        <span>Guests: <strong>{formatINR(bdown.guestTotal)}</strong></span>
                        <span>Member pool: <strong>{formatINR(bdown.memberPool)}</strong></span>
                        <span>Singers: <strong>{bdown.singerCount}</strong></span>
                        <span>Musicians: <strong>{bdown.musicianCount}</strong></span>
                      </div>
                      {bdown.guests.length > 0 && (
                        <div className="mb-3 space-y-1.5">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600">Guest fixed pay</p>
                          {bdown.guests.map((g) => (
                            <div key={g.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5">
                              <span className="text-[14px] font-medium text-slate-900">
                                {g.name} <span className="text-slate-500">· {g.role}</span>
                              </span>
                              <span className="text-[14px] font-semibold tabular-nums text-slate-800">{formatINR(g.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {(bdown.singerMembers.length > 0 || bdown.musicianMembers.length > 0) && (
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
                            Members (remaining · Singer ×1 · Musician ×2)
                          </p>
                          {bdown.singerMembers.map((mem) => (
                            <div key={mem.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5">
                              <span className="text-[14px] font-medium text-slate-900">{mem.firstName} {mem.lastName}</span>
                              <span className="text-[14px] font-semibold tabular-nums text-[#18392f]">{formatINR(bdown.singerShare)}</span>
                            </div>
                          ))}
                          {bdown.musicianMembers.map((mem) => (
                            <div key={mem.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5">
                              <span className="text-[14px] font-medium text-slate-900">{mem.firstName} {mem.lastName}</span>
                              <span className="text-[14px] font-semibold tabular-nums text-[#8a6a10]">{formatINR(bdown.instrumentalistShare)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {paid && !bdown && (
                    <p className="rounded-2xl bg-[rgba(245,194,76,0.14)] px-3 py-2.5 text-[13px] text-[#8a6a10]">
                      No payment amount yet — set billing amount when logging the mass, then save attendance to create payment & shares.
                    </p>
                  )}

                  {attendanceMsg && attendanceOpen === m.id && (
                    <p className="text-[13px] font-medium text-[#18392f]">{attendanceMsg}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingMass && (
        <div className="apple-modal-backdrop flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div className="apple-modal website-light-surface w-full max-w-md space-y-4 rounded-t-3xl p-6 sm:rounded-3xl">
            <div className="flex items-center justify-between">
              <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-slate-900">Edit Liturgy</h3>
              <button
                type="button"
                onClick={() => setEditingMass(null)}
                className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 hover:bg-black/[0.04]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editError && (
              <p className="rounded-2xl bg-[rgba(255,59,48,0.08)] p-3 text-[13px] font-medium text-[#d70015]">{editError}</p>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="apple-label">Mass name</label>
                <input required value={editingMass.name}
                  onChange={(e) => setEditingMass({ ...editingMass, name: e.target.value })}
                  className="apple-input" />
              </div>
              <div className="space-y-1.5">
                <label className="apple-label">Category</label>
                <select value={editingMass.category}
                  onChange={(e) => setEditingMass({ ...editingMass, category: e.target.value as Mass['category'] })}
                  className="apple-select">
                  {ALL_MASS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <label className="apple-label">Date</label>
                  <input type="date" value={editingMass.date}
                    onChange={(e) => setEditingMass({ ...editingMass, date: e.target.value })}
                    className="apple-input" />
                </div>
                <AmPmTimeField
                  label="Time"
                  value={editingMass.time}
                  onChange={(time) => setEditingMass({ ...editingMass, time })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="apple-label">Language</label>
                <select value={editingMass.language}
                  onChange={(e) => setEditingMass({ ...editingMass, language: e.target.value })}
                  className="apple-select">
                  {['Tamil','English','Malayalam','Telugu','Hindi'].map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingMass(null)}
                  className="btn-pill btn-pill-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-pill btn-pill-primary flex-1">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
