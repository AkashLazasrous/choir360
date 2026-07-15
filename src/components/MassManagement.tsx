import React, { useState } from 'react';
import { BookOpen, Bell } from 'lucide-react';
import { Mass, Payment, Member, Language } from '../types';
import { formatINR } from '../utils/currency';
import { calculatePaymentShares } from '../utils/choirStats';
import { MassForm } from '../features/masses/MassForm';
import { PaymentsTable } from '../features/masses/PaymentsTable';
import { ShareCalculator } from '../features/masses/ShareCalculator';
import { MassList } from '../features/masses/MassList';
import { LockedCalc } from '../features/masses/shared';

interface MassManagementProps {
  currentLang: Language;
  masses: Mass[];
  payments: Payment[];
  members: Member[];
  isAdmin: boolean;
  onAddMass: (newMass: Mass) => Promise<{ ok: boolean; error?: string }> | void;
  onUpdateMass?: (mass: Mass) => Promise<{ ok: boolean; error?: string }> | void;
  onDeleteMass?: (massId: string) => void;
  onAddPayment: (newPayment: Payment) => Promise<{ ok: boolean; error?: string }> | void;
  onUpdatePayment: (paymentId: string, receivedAmount: number, status: 'Pending' | 'Received') => void;
}

/**
 * Masses & Accounts desk. Orchestrates the feature modules in
 * src/features/masses/: MassForm (logging), PaymentsTable (accounts),
 * ShareCalculator (settlement), MassList (liturgies + attendance).
 */
export const MassManagement: React.FC<MassManagementProps> = ({
  masses,
  payments,
  members,
  isAdmin,
  onAddMass,
  onUpdateMass,
  onDeleteMass,
  onAddPayment,
  onUpdatePayment,
}) => {
  // ── Share calculator state ──────────────────────────────────────────────────
  const [selectedPaymentId,    setSelectedPaymentId]    = useState<string>(payments[0]?.id || '');
  const [singerCount,          setSingerCount]          = useState(6);
  const [instrumentalistCount, setInstrumentalistCount] = useState(2);
  const [lockedCalcs, setLockedCalcs] = useState<Record<string, LockedCalc>>({});
  const [notifMsg, setNotifMsg] = useState<string | null>(null);

  const activePayment = payments.find((p) => p.id === selectedPaymentId) || payments[0];
  const isLocked      = activePayment ? !!lockedCalcs[activePayment.id] : false;
  const calc = calculatePaymentShares(activePayment?.promisedAmount || 0, singerCount, instrumentalistCount);

  const handleLock = () => {
    if (!activePayment) return;
    setLockedCalcs({ ...lockedCalcs, [activePayment.id]: {
      singers: singerCount, instruments: instrumentalistCount,
      totalUnits: calc.totalUnits, unitValue: calc.unitValue,
      singerShare: calc.singerShare, instrumentShare: calc.instrumentalistShare,
    }});
    onUpdatePayment(activePayment.id, activePayment.receivedAmount || activePayment.promisedAmount, 'Received');
    alert(`Settlement locked for ${activePayment.partyName}.\nTotal distributed: ${formatINR(activePayment.promisedAmount)}`);
  };

  const handleUnlock = () => {
    if (!activePayment) return;
    const copy = { ...lockedCalcs };
    delete copy[activePayment.id];
    setLockedCalcs(copy);
  };

  const sendReminder = (p: Payment) => {
    setNotifMsg(`Reminder sent to "${p.partyName}" (${p.mobile}) for ${p.massType} — pending ${formatINR(p.pendingAmount)}`);
    setTimeout(() => setNotifMsg(null), 6000);
  };

  return (
    <div className="space-y-8">
      {/* ── Brand hero header ─────────────────────────────────────────────── */}
      <section className="apple-hero-soft mb-2 px-8 py-7 font-apple">
        <div className="choir-hero-ambient" aria-hidden />
        <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-300/15 px-3 py-1">
              <BookOpen className="h-3.5 w-3.5 text-amber-300" />
              <span className="text-[13px] font-medium text-amber-200">Liturgy & Accounts</span>
            </div>
            <h2 className="text-[32px] font-semibold tracking-[-0.03em] text-[#f5f5f7]">Masses & Accounts Desk</h2>
            <p className="mt-1 text-[15px] text-[#a1a1a6]">Log rites · manage payments · calculate choral shares</p>
          </div>
          <div className="shrink-0 rounded-2xl bg-white/10 px-5 py-3 text-center">
            <p className="text-[12px] font-medium text-[#86868b]">Share weights</p>
            <p className="mt-1 text-[15px] font-semibold text-amber-300">Singer ×1 · Musician ×2</p>
          </div>
        </div>
      </section>

      {notifMsg && (
        <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200 text-xs font-semibold flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-600 shrink-0" />
          {notifMsg}
        </div>
      )}

      {/* Form + Payments table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <MassForm isAdmin={isAdmin} onAddMass={onAddMass} onAddPayment={onAddPayment} />
        <PaymentsTable
          masses={masses}
          payments={payments}
          lockedCalcs={lockedCalcs}
          selectedPaymentId={selectedPaymentId}
          onSelectPayment={setSelectedPaymentId}
          onSendReminder={sendReminder}
        />
      </div>

      {/* ── Share Calculation Engine ── */}
      {activePayment && (
        <ShareCalculator
          activePayment={activePayment}
          calc={calc}
          isLocked={isLocked}
          lockedCalc={lockedCalcs[activePayment.id]}
          singerCount={singerCount}
          instrumentalistCount={instrumentalistCount}
          onSingerCountChange={setSingerCount}
          onInstrumentalistCountChange={setInstrumentalistCount}
          onLock={handleLock}
          onUnlock={handleUnlock}
        />
      )}

      {/* ── All Logged Liturgies ── */}
      <MassList
        masses={masses}
        payments={payments}
        members={members}
        isAdmin={isAdmin}
        onUpdateMass={onUpdateMass}
        onDeleteMass={onDeleteMass}
      />
    </div>
  );
};
