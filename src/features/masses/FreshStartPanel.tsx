import React, { useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';

type FreshStartPanelProps = {
  isAdmin: boolean;
  massCount: number;
  paymentCount: number;
  onFreshStart: (confirm: string) => Promise<{ ok: boolean; error?: string; totalDeleted?: number }>;
};

/**
 * Admin-only hard wipe of parish liturgy / attendance / payment storage.
 */
export const FreshStartPanel: React.FC<FreshStartPanelProps> = ({
  isAdmin,
  massCount,
  paymentCount,
  onFreshStart,
}) => {
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isAdmin) return null;

  const handleWipe = async () => {
    const ok = window.confirm(
      `Permanently delete ALL liturgy logs, attendance marks, and payments for this parish?\n\n`
      + `Currently about ${massCount} masses and ${paymentCount} payments.\n\n`
      + 'This cannot be undone. Type FRESH START in the box first.',
    );
    if (!ok) return;
    setBusy(true);
    setMessage(null);
    const result = await onFreshStart(confirm.trim());
    setBusy(false);
    if (result.ok) {
      setConfirm('');
      setMessage(`Fresh start complete — deleted ${result.totalDeleted ?? 0} records. You can log new entries now.`);
    } else {
      setMessage(result.error ?? 'Fresh start failed.');
    }
  };

  return (
    <div className="apple-card space-y-3 border border-rose-400/35 bg-rose-500/5 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-300">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-semibold text-[#f5f5f7] max-lg:text-[#1d1d1f]">
            Fresh start — clear storage
          </h3>
          <p className="mt-1 text-[13px] text-[#a1a1a6] max-lg:text-[#86868b]">
            Permanently deletes masses, practices, attendance marks, payments, and share records for this parish
            so you can begin clean. Overview Clear only hides logs — this removes them from storage.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="block min-w-0 flex-1 space-y-1">
          <span className="apple-label">Type FRESH START to confirm</span>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="FRESH START"
            className="apple-input font-mono uppercase tracking-wide"
            autoComplete="off"
          />
        </label>
        <button
          type="button"
          disabled={busy || confirm.trim().toUpperCase() !== 'FRESH START'}
          onClick={() => void handleWipe()}
          className="btn-pill inline-flex min-h-[44px] items-center justify-center gap-2 !bg-rose-600 !text-white disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete all liturgy data
        </button>
      </div>
      {message && (
        <p className="text-[13px] text-amber-200 max-lg:text-[#8a6a10]">{message}</p>
      )}
    </div>
  );
};
