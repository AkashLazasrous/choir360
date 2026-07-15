import React, { useState } from 'react';
import { BookOpen, IndianRupee } from 'lucide-react';
import { Mass, MassCategory, Payment } from '../../types';
import { formatINR } from '../../utils/currency';
import { derivePaymentStatus } from '../../utils/choirStats';
import { ALL_MASS_CATEGORIES, createUniqueId, isPaymentMass } from './shared';

interface MassFormProps {
  isAdmin: boolean;
  onAddMass: (newMass: Mass) => Promise<{ ok: boolean; error?: string }> | void;
  onAddPayment: (newPayment: Payment) => Promise<{ ok: boolean; error?: string }> | void;
}

/** "Log Liturgy" card: creates a mass and, for payment rites, its payment record. */
export const MassForm: React.FC<MassFormProps> = ({ isAdmin, onAddMass, onAddPayment }) => {
  const [massName,     setMassName]     = useState('');
  const [massCategory, setMassCategory] = useState<MassCategory>('Sunday Mass');
  const [massDate,     setMassDate]     = useState(new Date().toISOString().slice(0, 10));
  const [massTime,     setMassTime]     = useState('06:30 AM');
  const [massLang,     setMassLang]     = useState('Tamil');

  // Payment fields (only for Special / Death / Death Anniversary)
  const [partyName,        setPartyName]        = useState('');
  const [amountProposed,   setAmountProposed]   = useState<number>(0);
  const [amountReceived,   setAmountReceived]   = useState<boolean>(false);
  const [receivedAmount,   setReceivedAmount]   = useState<number>(0);
  const [dateReceived,     setDateReceived]     = useState('');
  const [whoPaid,          setWhoPaid]          = useState('');
  const [paymentMode,      setPaymentMode]      = useState('Cash');
  const [receiptNo,        setReceiptNo]        = useState('');
  const [paymentRemarks,   setPaymentRemarks]   = useState('');

  const [massSuccess, setMassSuccess] = useState('');
  const [massSaveError, setMassSaveError] = useState('');

  const handleAddMass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!massName) return;
    setMassSaveError('');

    const massId = createUniqueId('mass');
    const newMass: Mass = {
      id: massId,
      name: massName,
      category: massCategory,
      date: massDate,
      time: massTime,
      language: massLang,
    };

    const massResult = await onAddMass(newMass);
    if (massResult && !massResult.ok) {
      const isPermission = massResult.error?.toLowerCase().includes('permission') || massResult.error?.toLowerCase().includes('insufficient');
      setMassSaveError(
        isPermission
          ? 'Save failed: Firestore permission denied. Please sign in with your admin email.'
          : `Save failed: ${massResult.error}`
      );
      return;
    }

    if (isPaymentMass(massCategory) && partyName && amountProposed > 0) {
      const recvAmt  = amountReceived ? receivedAmount : 0;
      const pending  = Math.max(amountProposed - recvAmt, 0);
      const status   = derivePaymentStatus(amountProposed, amountReceived, receivedAmount);
      const pid      = createUniqueId('payment');

      const newPayment: Payment = {
        id: pid, massId, partyName, mobile: '',
        massType: massCategory, massDate, massTime,
        promisedAmount: amountProposed, receivedAmount: recvAmt,
        pendingAmount: pending, dateReceived: dateReceived || undefined,
        status, whoPaid: whoPaid || undefined,
        paymentMode: paymentMode || undefined,
        receiptNo: receiptNo || undefined,
        remarks: paymentRemarks || undefined,
      };

      const paymentResult = await onAddPayment(newPayment);
      if (paymentResult && !paymentResult.ok) {
        const isPermission = paymentResult.error?.toLowerCase().includes('permission') || paymentResult.error?.toLowerCase().includes('insufficient');
        setMassSaveError(
          isPermission
            ? 'Mass logged but payment save failed: Firestore permission denied.'
            : `Payment save failed: ${paymentResult.error}`
        );
      }
    }

    setMassName(''); setPartyName(''); setAmountProposed(0); setAmountReceived(false);
    setReceivedAmount(0); setDateReceived(''); setWhoPaid('');
    setPaymentMode('Cash'); setReceiptNo(''); setPaymentRemarks('');
    setMassSuccess(`✓ Logged: ${massName}`);
    setTimeout(() => setMassSuccess(''), 4000);
  };

  return (
    <div className="apple-card font-apple p-6 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-[rgba(0,0,0,0.08)]">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#18392f]">
          <BookOpen className="w-4 h-4 text-[#f5c24c]" />
        </div>
        <div>
          <h3 className="apple-title text-sm">Log Liturgy</h3>
          <p className="apple-caption">Setup upcoming rites & payments</p>
        </div>
      </div>

      {massSuccess && (
        <p className="apple-badge-forest text-xs p-2 font-medium">{massSuccess}</p>
      )}
      {massSaveError && (
        <p className="apple-badge-danger text-xs p-2 font-medium">{massSaveError}</p>
      )}

      {!isAdmin ? (
        <div className="apple-badge-gold p-3 text-xs font-medium leading-5">
          Sign in with the parish admin email to log, edit, or delete liturgy entries.
        </div>
      ) : (
      <form onSubmit={handleAddMass} className="space-y-3 text-xs">
        <div className="space-y-1">
          <label className="apple-label">Mass Name / Description</label>
          <input required value={massName} onChange={(e) => setMassName(e.target.value)}
            placeholder="e.g. Wedding Solemn Mass of Dr. Joseph"
            className="apple-input text-sm" />
        </div>

        <div className="space-y-1">
          <label className="apple-label">Liturgical Rite Category</label>
          <select value={massCategory} onChange={(e) => setMassCategory(e.target.value as MassCategory)}
            className="apple-select text-sm">
            {ALL_MASS_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Date</label>
            <input type="date" value={massDate} onChange={(e) => setMassDate(e.target.value)}
              className="apple-input text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Start Time</label>
            <input value={massTime} onChange={(e) => setMassTime(e.target.value)} placeholder="06:30 AM"
              className="apple-input text-sm" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Principal Language</label>
          <select value={massLang} onChange={(e) => setMassLang(e.target.value)}
            className="apple-select text-sm">
            {['Tamil','English','Malayalam','Telugu','Hindi'].map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>

        {/* ── Special Mass Payment Fields ── */}
        {isPaymentMass(massCategory) && (
          <div className="space-y-3 border-t border-amber-100 pt-3 mt-2">
            <p className="text-[10px] font-bold text-amber-700 uppercase flex items-center gap-1">
              <IndianRupee className="w-3 h-3" /> Payment Details
            </p>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Sponsor / Party Name</label>
              <input value={partyName} onChange={(e) => setPartyName(e.target.value)} placeholder="e.g. Joseph Family"
                className="apple-input text-sm" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Amount Proposed (₹)</label>
              <input type="number" min={0} value={amountProposed || ''} onChange={(e) => setAmountProposed(Number(e.target.value))}
                placeholder="0"
                className="apple-input text-sm" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Amount Received?</label>
              <div className="flex gap-2">
                {[true, false].map((v) => (
                  <button key={String(v)} type="button"
                    onClick={() => setAmountReceived(v)}
                    className={`flex-1 py-2 rounded-lg border text-xs font-bold transition ${amountReceived === v
                      ? v ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-rose-100 text-rose-700 border-rose-300'
                      : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {v ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>

            {amountReceived && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Amount Received (₹)</label>
                  <input type="number" min={0} value={receivedAmount || ''} onChange={(e) => setReceivedAmount(Number(e.target.value))}
                    className="apple-input text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Date Received</label>
                    <input type="date" value={dateReceived} onChange={(e) => setDateReceived(e.target.value)}
                      className="apple-input text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Mode</label>
                    <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}
                      className="apple-select text-sm">
                      {['Cash','UPI','Bank Transfer','Cheque','DD'].map((m) => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Who Paid</label>
                  <input value={whoPaid} onChange={(e) => setWhoPaid(e.target.value)} placeholder="Payer name"
                    className="apple-input text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Receipt No. (optional)</label>
                  <input value={receiptNo} onChange={(e) => setReceiptNo(e.target.value)}
                    className="apple-input text-sm" />
                </div>
              </>
            )}

            <div className={`text-[10px] font-bold px-3 py-1.5 rounded-lg ${
              !amountReceived ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : receivedAmount >= amountProposed ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-orange-50 text-orange-800 border border-orange-200'
            }`}>
              Status:{' '}
              {!amountReceived ? 'Pending'
                : receivedAmount >= amountProposed ? 'Received (Full)'
                : `Partial — ${formatINR(Math.max(amountProposed - receivedAmount, 0))} pending`}
            </div>
          </div>
        )}

        <button type="submit"
          className="btn-pill btn-pill-primary w-full">
          Log Liturgy Mass
        </button>
      </form>
      )}
    </div>
  );
};
