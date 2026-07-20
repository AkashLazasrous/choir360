import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ClipboardCheck,
  Music2,
  Plus,
  UserPlus,
  Users,
  X,
  Church,
} from 'lucide-react';
import type { DashboardVariant } from './types';
import type { Tab } from '../../types';
import { fabActions } from './dashboardMetrics';

type QuickActionFabProps = {
  variant: DashboardVariant;
  onNavigate: (tab: Tab) => void;
};

const ICONS: Record<string, React.FC<{ className?: string }>> = {
  mass: Church,
  att: ClipboardCheck,
  people: UserPlus,
  checkin: ClipboardCheck,
  ministry: Users,
  lyrics: Music2,
};

/**
 * Pattern 7 — Quick-action FAB hub; clears bottom tab bar via --bottom-chrome.
 */
export const QuickActionFab: React.FC<QuickActionFabProps> = ({
  variant,
  onNavigate,
}) => {
  const [open, setOpen] = useState(false);
  const actions = fabActions(variant, onNavigate);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            key="fab-scrim"
            className="fixed inset-0 z-[51] bg-black/35 lg:hidden"
            aria-label="Close quick actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="md-fab-hub pointer-events-none fixed z-[52] lg:hidden">
        <div className="pointer-events-auto flex flex-col items-end gap-2.5">
          <AnimatePresence>
            {open &&
              actions.map((action, i) => {
                const Icon = ICONS[action.id] ?? Plus;
                return (
                  <motion.button
                    key={action.id}
                    type="button"
                    initial={{ opacity: 0, y: 12, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.9 }}
                    transition={{
                      delay: i * 0.04,
                      type: 'spring',
                      stiffness: 420,
                      damping: 28,
                    }}
                    onClick={() => {
                      setOpen(false);
                      action.onClick();
                    }}
                    className="flex items-center gap-2.5 rounded-full border border-black/[0.06] bg-white py-2 pl-3 pr-3.5 text-[#121212] shadow-[0_10px_28px_rgba(18,18,18,0.12)]"
                  >
                    <span className="text-[12px] font-semibold">{action.label}</span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111111] text-white">
                      <Icon className="h-4 w-4" />
                    </span>
                  </motion.button>
                );
              })}
          </AnimatePresence>

          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? 'Close quick actions' : 'Open quick actions'}
            onClick={() => setOpen((o) => !o)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#111111] text-white shadow-[0_10px_28px_rgba(18,18,18,0.28)]"
          >
            {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          </button>
        </div>
      </div>
    </>
  );
};
