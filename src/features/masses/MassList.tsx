import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, IndianRupee, Pencil, Trash2, Users, X } from 'lucide-react';
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

/** "All Logged Liturgies" list with per-mass attendance marking, payment breakdown, edit modal. */
export const MassList: React.FC<MassListProps> = ({
  masses,
  payments,
  members,
  isAdmin,
  onUpdateMass,
  onDeleteMass,
}) => {
  const [attendanceOpen, setAttendanceOpen] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<Record<string, string[]>>({});
  const [editingMass, setEditingMass] = useState<Mass | null>(null);
  const [editError, setEditError] = useState('');

  const activeMembers = members.filter((m) => ['Active Member', 'Approved', 'Admin'].includes(m.status));

  const toggleAttendee = (massId: string, memberId: string) => {
    setAttendance((prev) => {
      const current = prev[massId] || [];
      const updated = current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId];
      return { ...prev, [massId]: updated };
    });
  };

  const getAttendees = (massId: string) =>
    (attendance[massId] || [])
      .map((id) => activeMembers.find((m) => m.id === id))
      .filter(Boolean) as Member[];

  const getPaymentBreakdown = (massId: string) => {
    const attendees = getAttendees(massId);
    const singers = attendees.filter((m) => m.memberType === 'Singer' || m.memberType === 'Other');
    const instrumentalists = attendees.filter((m) => !['Singer', 'Other'].includes(m.memberType));
    const payment = payments.find((p) => p.massId === massId);
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
  };

  if (masses.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#18392f]">
          <BookOpen className="h-3.5 w-3.5 text-amber-300" />
        </div>
        <h3 className="font-bold text-slate-900 text-sm">All Logged Liturgies</h3>
        <span className="ml-auto text-[10px] text-slate-400 font-semibold">{masses.length} entries</span>
      </div>

      <div className="space-y-3">
        {masses.map((m) => {
          const isOpen    = attendanceOpen === m.id;
          const attendees = getAttendees(m.id);
          const bdown     = getPaymentBreakdown(m.id);
          const attendeeIds = attendance[m.id] || [];

          return (
            <div key={m.id} className="rounded-xl border border-slate-100 overflow-hidden">
              {/* Row */}
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800 text-sm">{m.name}</p>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      isPaymentMass(m.category) ? 'bg-amber-50 text-amber-800 border border-amber-100' : 'bg-slate-100 text-slate-600'
                    }`}>{m.category}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{m.date} · {m.time} · {m.language}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Attendance toggle */}
                  <button
                    onClick={() => setAttendanceOpen(isOpen ? null : m.id)}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-600 transition"
                  >
                    <Users className="h-3 w-3" />
                    {attendeeIds.length > 0 ? `${attendeeIds.length} present` : 'Attendance'}
                    {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>

                  {/* Edit */}
                  {isAdmin && onUpdateMass && (
                    <button
                      onClick={() => setEditingMass({ ...m })}
                      className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition"
                      title="Edit mass"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Delete */}
                  {isAdmin && onDeleteMass && (
                    <button
                      onClick={() => handleDeleteMass(m.id, m.name)}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 transition"
                      title="Delete mass"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Attendance & Payment panel */}
              {isOpen && (
                <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 space-y-4">
                  {/* Member selection */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
                      <Users className="h-3 w-3" /> Mark Attendance
                    </p>
                    {activeMembers.length === 0 ? (
                      <p className="text-xs text-slate-400">No active members found.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {activeMembers.map((mem) => {
                          const checked = attendeeIds.includes(mem.id);
                          const isInstrumentalist = !['Singer', 'Other'].includes(mem.memberType);
                          return (
                            <label key={mem.id}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition text-xs ${
                                checked
                                  ? isInstrumentalist
                                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                              }`}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleAttendee(m.id, mem.id)}
                                className="rounded accent-emerald-600"
                              />
                              <span>
                                <span className="font-semibold">{mem.firstName} {mem.lastName}</span>
                                <span className="block text-[9px] opacity-60">{mem.memberType}</span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Payment breakdown (only for payment-type masses with a linked payment) */}
                  {bdown && attendees.length > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-3 flex items-center gap-1">
                        <IndianRupee className="h-3 w-3" /> Payment Distribution
                      </p>
                      <div className="flex gap-4 text-xs mb-3 flex-wrap">
                        <span className="text-slate-600">Total received: <strong className="text-emerald-700">{formatINR(bdown.payment.promisedAmount)}</strong></span>
                        <span className="text-slate-600">Singers: <strong>{bdown.singers.length}</strong></span>
                        <span className="text-slate-600">Musicians: <strong>{bdown.instrumentalists.length}</strong></span>
                        <span className="text-slate-600">Unit value: <strong>{formatINR(bdown.unitValue)}</strong></span>
                      </div>
                      <div className="space-y-1.5">
                        {bdown.singers.map((mem) => (
                          <div key={mem.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-emerald-100">
                            <span className="text-xs font-semibold text-slate-800">{mem.firstName} {mem.lastName}</span>
                            <span className="text-xs font-mono font-bold text-emerald-700">{formatINR(bdown.singerShare)} <span className="text-[9px] text-slate-400 font-normal">(×1)</span></span>
                          </div>
                        ))}
                        {bdown.instrumentalists.map((mem) => (
                          <div key={mem.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100">
                            <span className="text-xs font-semibold text-slate-800">{mem.firstName} {mem.lastName}</span>
                            <span className="text-xs font-mono font-bold text-amber-700">{formatINR(bdown.instrumentalistShare)} <span className="text-[9px] text-slate-400 font-normal">(×2)</span></span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex justify-between text-xs font-bold pt-2 border-t border-amber-200">
                        <span className="text-slate-600">Total distributed</span>
                        <span className="text-emerald-700 font-mono">
                          {formatINR(bdown.singerShare * bdown.singers.length + bdown.instrumentalistShare * bdown.instrumentalists.length)}
                        </span>
                      </div>
                    </div>
                  )}

                  {isPaymentMass(m.category) && !bdown && (
                    <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      No payment record linked to this mass. Log a payment with this mass selected to see the distribution.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Edit Mass Modal ── */}
      {editingMass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Edit Liturgy</h3>
              <button onClick={() => setEditingMass(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            {editError && (
              <p className="text-xs p-2 bg-rose-50 text-rose-800 border border-rose-200 rounded font-medium">{editError}</p>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Mass Name</label>
                <input required value={editingMass.name}
                  onChange={(e) => setEditingMass({ ...editingMass, name: e.target.value })}
                  className="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-400" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                <select value={editingMass.category}
                  onChange={(e) => setEditingMass({ ...editingMass, category: e.target.value as Mass['category'] })}
                  className="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400">
                  {ALL_MASS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Date</label>
                  <input type="date" value={editingMass.date}
                    onChange={(e) => setEditingMass({ ...editingMass, date: e.target.value })}
                    className="w-full px-3 py-2.5 min-h-[44px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Time</label>
                  <input value={editingMass.time}
                    onChange={(e) => setEditingMass({ ...editingMass, time: e.target.value })}
                    className="w-full px-3 py-2.5 min-h-[44px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Language</label>
                <select value={editingMass.language}
                  onChange={(e) => setEditingMass({ ...editingMass, language: e.target.value })}
                  className="w-full px-3 py-2.5 min-h-[44px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400">
                  {['Tamil','English','Malayalam','Telugu','Hindi'].map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditingMass(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#18392f] text-white text-xs font-bold hover:bg-[#0f2a22] transition">
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
