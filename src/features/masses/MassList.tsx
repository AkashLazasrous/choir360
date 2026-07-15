import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, IndianRupee, MoreHorizontal, Pencil, Trash2, Users, X } from 'lucide-react';
import { Mass, Member, Payment } from '../../types';
import { formatINR } from '../../utils/currency';
import { calculatePaymentShares } from '../../utils/choirStats';
import { ALL_MASS_CATEGORIES, isPaymentMass } from './shared';

interface MassListProps {
  masses: Mass[];
  payments: Payment[];
  members: Member[];
  isAdmin: boolean;
  onUpdateMass?: (mass: Mass) => Promise<{ ok: boolean; error?: string }> | void;
  onDeleteMass?: (massId: string) => void;
}

/** Logged liturgies with attendance sheet and edit modal — mobile overflow actions. */
export const MassList: React.FC<MassListProps> = ({
  masses,
  payments,
  members,
  isAdmin,
  onUpdateMass,
  onDeleteMass,
}) => {
  const [attendanceOpen, setAttendanceOpen] = useState<string | null>(null);
  const [editingMass, setEditingMass] = useState<Mass | null>(null);
  const [editError, setEditError] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const activeMembers = members.filter((m) => ['Active Member', 'Approved', 'Admin'].includes(m.status));

  const getAttendees = (mass: Mass) =>
    (mass.attendingMemberIds ?? [])
      .map((id) => activeMembers.find((m) => m.id === id))
      .filter(Boolean) as Member[];

  const getPaymentBreakdown = (mass: Mass) => {
    const attendees = getAttendees(mass);
    const singers = attendees.filter((m) => m.memberType === 'Singer' || m.memberType === 'Other');
    const instrumentalists = attendees.filter((m) => !['Singer', 'Other'].includes(m.memberType));
    const payment = payments.find((p) => p.massId === mass.id);
    if (!payment) return null;
    const c = calculatePaymentShares(payment.promisedAmount, singers.length, instrumentalists.length);
    return { singers, instrumentalists, ...c, payment };
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
          const bdown = getPaymentBreakdown(m);
          const attendeeIds = m.attendingMemberIds ?? [];
          const menuOpen = menuOpenId === m.id;

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
                    onClick={() => { setAttendanceOpen(isOpen ? null : m.id); setMenuOpenId(null); }}
                    className="btn-pill btn-pill-secondary btn-pill-sm !min-h-[44px] flex-1 !text-[13px] sm:flex-none"
                  >
                    <Users className="h-4 w-4" />
                    {attendeeIds.length > 0 ? `${attendeeIds.length} present` : 'Attendance'}
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
                                className="flex w-full min-h-[44px] items-center gap-2 px-4 text-left text-[15px] text-[#d70015] hover:bg-[rgba(255,59,48,0.06)]"
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
                <div className="space-y-4 border-t border-black/[0.06] bg-[#f5f5f7] px-4 py-4">
                  <div>
                    <p className="apple-label mb-2 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> Attendance
                    </p>
                    {attendeeIds.length === 0 ? (
                      <p className="text-[14px] text-[#86868b]">
                        No attendance logged yet. Use the Attendance tab to mark members.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                        {attendees.map((mem) => {
                          const isInstrumentalist = !['Singer', 'Other'].includes(mem.memberType);
                          return (
                            <div
                              key={mem.id}
                              className={`flex min-h-[52px] items-center gap-3 rounded-2xl border px-3 py-2.5 text-[14px] ${
                                isInstrumentalist
                                  ? 'border-[rgba(245,194,76,0.45)] bg-[rgba(245,194,76,0.14)] text-[#8a6a10]'
                                  : 'border-[rgba(24,57,47,0.25)] bg-[rgba(24,57,47,0.08)] text-[#18392f]'
                              }`}
                            >
                              <span>
                                <span className="font-semibold">{mem.firstName} {mem.lastName}</span>
                                <span className="block text-[12px] opacity-70">{mem.memberType}</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {bdown && attendees.length > 0 && (
                    <div className="rounded-2xl border border-[rgba(245,194,76,0.35)] bg-[rgba(245,194,76,0.12)] p-4">
                      <p className="apple-label mb-3 flex items-center gap-1 text-[#8a6a10]">
                        <IndianRupee className="h-3.5 w-3.5" /> Payment distribution
                      </p>
                      <div className="mb-3 flex flex-wrap gap-3 text-[13px] text-[#3a3a3c]">
                        <span>Total: <strong className="text-[#18392f]">{formatINR(bdown.payment.promisedAmount)}</strong></span>
                        <span>Singers: <strong>{bdown.singers.length}</strong></span>
                        <span>Musicians: <strong>{bdown.instrumentalists.length}</strong></span>
                      </div>
                      <div className="space-y-1.5">
                        {bdown.singers.map((mem) => (
                          <div key={mem.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5">
                            <span className="text-[14px] font-medium text-[#1d1d1f]">{mem.firstName} {mem.lastName}</span>
                            <span className="text-[14px] font-semibold tabular-nums text-[#18392f]">{formatINR(bdown.singerShare)}</span>
                          </div>
                        ))}
                        {bdown.instrumentalists.map((mem) => (
                          <div key={mem.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5">
                            <span className="text-[14px] font-medium text-[#1d1d1f]">{mem.firstName} {mem.lastName}</span>
                            <span className="text-[14px] font-semibold tabular-nums text-[#8a6a10]">{formatINR(bdown.instrumentalistShare)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isPaymentMass(m.category) && !bdown && (
                    <p className="rounded-2xl bg-[rgba(245,194,76,0.14)] px-3 py-2.5 text-[13px] text-[#8a6a10]">
                      No payment record linked to this mass yet.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingMass && (
        <div className="apple-modal-backdrop flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div className="apple-modal w-full max-w-md space-y-4 rounded-t-3xl p-6 sm:rounded-3xl">
            <div className="flex items-center justify-between">
              <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">Edit Liturgy</h3>
              <button
                type="button"
                onClick={() => setEditingMass(null)}
                className="flex h-11 w-11 items-center justify-center rounded-full text-[#86868b] hover:bg-black/[0.04]"
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
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="apple-label">Date</label>
                  <input type="date" value={editingMass.date}
                    onChange={(e) => setEditingMass({ ...editingMass, date: e.target.value })}
                    className="apple-input" />
                </div>
                <div className="space-y-1.5">
                  <label className="apple-label">Time</label>
                  <input value={editingMass.time}
                    onChange={(e) => setEditingMass({ ...editingMass, time: e.target.value })}
                    className="apple-input" />
                </div>
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
