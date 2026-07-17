import React, { useState } from 'react';
import { Bell, ChevronRight, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ContextualAlert } from './types';
import type { Tab } from '../../types';

type ContextualAlertsProps = {
  alerts: ContextualAlert[];
  onNavigate: (tab: Tab) => void;
  /** Compact bell trigger (header-style) vs full preview strip */
  mode?: 'strip' | 'bell';
  className?: string;
};

/**
 * Pattern 9 — Notification badges with contextual action previews.
 */
export const ContextualAlerts: React.FC<ContextualAlertsProps> = ({
  alerts,
  onNavigate,
  mode = 'strip',
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  if (alerts.length === 0) return null;

  const primary = alerts[0];

  if (mode === 'bell') {
    return (
      <div className={`relative ${className}`}>
        <button
          type="button"
          className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition hover:bg-white/10"
          aria-label={`${alerts.length} alerts`}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-300 px-1 text-[9px] font-bold text-[#050a14]">
            {alerts.length}
          </span>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#050a14]/95 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                <p className="text-[12px] font-semibold text-[#f5f5f7]">Alerts</p>
                <button type="button" aria-label="Close" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4 text-[#86868b]" />
                </button>
              </div>
              <ul className="max-h-64 overflow-y-auto py-1">
                {alerts.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-white/5"
                      onClick={() => {
                        setOpen(false);
                        onNavigate(a.tab);
                      }}
                    >
                      <span
                        className={
                          'mt-1 h-2 w-2 shrink-0 rounded-full ' +
                          (a.tone === 'gold'
                            ? 'bg-amber-300'
                            : a.tone === 'warn'
                              ? 'bg-orange-400'
                              : 'bg-teal-300')
                        }
                      />
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold text-[#f5f5f7]">
                          {a.title}
                        </span>
                        <span className="block text-[11px] text-[#86868b]">{a.body}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <button
        type="button"
        onClick={() => onNavigate(primary.tab)}
        className="md-alert-chip flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-300/15 text-amber-200">
          <Bell className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold text-[#f5f5f7]">{primary.title}</span>
          <span className="block truncate text-[11px] text-[#a1a1a6]">{primary.body}</span>
        </span>
        {alerts.length > 1 && (
          <span className="shrink-0 rounded-full bg-teal-300/20 px-2 py-0.5 text-[10px] font-bold text-teal-200">
            +{alerts.length - 1}
          </span>
        )}
        <ChevronRight className="h-4 w-4 shrink-0 text-[#86868b]" />
      </button>

      {alerts.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {alerts.slice(1).map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onNavigate(a.tab)}
              className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-medium text-[#e5e5ea]"
            >
              {a.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
