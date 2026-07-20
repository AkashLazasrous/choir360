import React, { useState } from 'react';
import { BookOpen, IndianRupee } from 'lucide-react';
import { Mass, MassCategory, Member, Payment } from '../../types';
import { formatINR } from '../../utils/currency';
import { derivePaymentStatus } from '../../utils/choirStats';
import { AmPmTimeField } from './AmPmTimeField';
import { ReceivedBySelect } from './ReceivedBySelect';
import { ALL_MASS_CATEGORIES, createUniqueId, isPaymentMass } from './shared';
import { omitUndefinedDeep, optionalNumber, optionalString } from '../../utils/omitUndefined';
import { massCategoryToActivityKind } from '../../utils/attendanceTaxonomy';

interface MassFormProps {
  isAdmin: boolean;
  members: Member[];
  onAddMass: (newMass: Mass) => Promise<{ ok: boolean; error?: string }> | void;
  onAddPayment: (newPayment: Payment) => Promise<{ ok: boolean; error?: string }> | void;
}

/** "Log Liturgy" card: creates a mass and, for payment rites, its payment record. */
export const MassForm: React.FC<MassFormProps> = ({ isAdmin, members, onAddMass, onAddPayment }) => {
  const [massName,     setMassName]     = useState('');
  const [massCategory, setMassCategory] = useState<MassCategory>('Sunday Mass');
  const [massDate,     setMassDate]     = useState(new Date().toISOString().slice(0, 10));
  const [massTime,     setMassTime]     = useState('06:30 AM');
  const [massLang,     setMassLang]     = useState('Tamil');

  // Payment fields (Special / Wedding / Death / …) — Free skips payment record
  const [billingType,      setBillingType]      = useState<'free' | 'paid'>('paid');
  const [partyName,        setPartyName]        = useState('');
  const [amountProposed,   setAmountProposed]   = useState<number>(0);
  const [amountReceived,   setAmountReceived]   = useState<boolean>(false);
  const [receivedAmount,   setReceivedAmount]   = useState<number>(0);
  const [dateReceived,     setDateReceived]     = useState('');
  const [receivedByMemberId, setReceivedByMemberId] = useState('');
  const [receivedBy,       setReceivedBy]       = useState('');
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
    const isSpecialLike = isPaymentMass(massCategory) || massCategory === 'Special Mass';
    const specialMassPayment = billingType === 'paid'
      ? omitUndefinedDeep({
          amount: optionalNumber(amountProposed > 0 ? amountProposed : undefined),
          receivedByMemberId: optionalString(receivedByMemberId),
          receivedBy: optionalString(receivedBy),
          notes: optionalString(paymentRemarks),
          dateReceived: optionalString(dateReceived),
          paymentMode: optionalString(paymentMode),
        })
      : undefined;
    const newMass = omitUndefinedDeep({
      id: massId,
      name: massName,
      category: massCategory,
      date: massDate,
      time: massTime,
      language: massLang,
      activityKind: massCategoryToActivityKind(massCategory),
      ...(isSpecialLike
        ? {
            specialMassBilling: billingType,
            ...(billingType === 'paid' && specialMassPayment
              ? { specialMassPayment }
              : {}),
          }
        : {}),
    }) as Mass;

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

    if (isPaymentMass(massCategory) && billingType === 'paid' && amountProposed > 0) {
      const recvAmt  = amountReceived ? receivedAmount : 0;
      const pending  = Math.max(amountProposed - recvAmt, 0);
      const status   = derivePaymentStatus(amountProposed, amountReceived, receivedAmount);
      const pid = `payment-${massId}`;

      const newPayment = omitUndefinedDeep({
        id: pid,
        massId,
        partyName: partyName.trim() || 'Sponsor',
        mobile: '',
        massType: massCategory,
        massDate,
        massTime,
        promisedAmount: amountProposed,
        receivedAmount: recvAmt,
        pendingAmount: pending,
        dateReceived: optionalString(dateReceived),
        status,
        receivedByMemberId: optionalString(receivedByMemberId),
        receivedBy: optionalString(receivedBy),
        paymentMode: optionalString(paymentMode),
        receiptNo: optionalString(receiptNo),
        remarks: optionalString(paymentRemarks),
      }) as Payment;

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
    setReceivedAmount(0); setDateReceived(''); setReceivedByMemberId(''); setReceivedBy('');
    setPaymentMode('Cash'); setReceiptNo(''); setPaymentRemarks('');
    setBillingType('paid');
    setMassSuccess(`✓ Logged: ${massName}`);
    setTimeout(() => setMassSuccess(''), 4000);
  };

  return (
    <div className="apple-card font-apple p-6 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-[rgba(0,0,0,0.08)]">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0e3d4c]">
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

        <div className="space-y-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Date</label>
            <input type="date" value={massDate} onChange={(e) => setMassDate(e.target.value)}
              className="apple-input text-sm" />
          </div>
          <AmPmTimeField
            value={massTime}
            onChange={setMassTime}
            label="Start Time"
          />
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
              <IndianRupee className="w-3 h-3" /> Billing
            </p>

            <div className="flex gap-2">
              {(['free', 'paid'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setBillingType(opt)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-bold transition ${
                    billingType === opt
                      ? 'bg-[#0e3d4c] text-white border-[#0e3d4c]'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  {opt === 'free' ? 'Free' : 'Paid'}
                </button>
              ))}
            </div>

            {billingType === 'paid' && (
              <>
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
                    <ReceivedBySelect
                      members={members}
                      value={receivedByMemberId}
                      onChange={(memberId, displayName) => {
                        setReceivedByMemberId(memberId);
                        setReceivedBy(displayName);
                      }}
                    />
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Receipt No. (optional)</label>
                      <input value={receiptNo} onChange={(e) => setReceiptNo(e.target.value)}
                        className="apple-input text-sm" />
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Notes (optional)</label>
                  <input value={paymentRemarks} onChange={(e) => setPaymentRemarks(e.target.value)}
                    className="apple-input text-sm" placeholder="Payment remarks" />
                </div>

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
              </>
            )}

            {billingType === 'free' && (
              <p className="text-[11px] text-slate-500">Free special mass — no payment record will be created.</p>
            )}
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
