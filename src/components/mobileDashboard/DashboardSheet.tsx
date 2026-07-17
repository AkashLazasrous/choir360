import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

type DashboardSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

/**
 * Pattern 6 — Action-oriented bottom sheet (mirrors AppAccountSheet motion).
 */
export const DashboardSheet: React.FC<DashboardSheetProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[56] lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-[#000000]/55 backdrop-blur-sm"
            aria-label="Close sheet"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-hidden rounded-t-[1.75rem] border-t border-white/10 bg-[#0a1628] shadow-2xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.12}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 600) onClose();
            }}
          >
            <div className="flex flex-col items-center bg-[linear-gradient(160deg,#134556_0%,#0a1628_55%,#000000_100%)] px-4 pb-4 pt-3 text-[#f5f5f7]">
              <div className="h-1 w-10 rounded-full bg-white/25" aria-hidden />
              <div className="mt-3 flex w-full items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[18px] font-semibold tracking-[-0.025em]">{title}</p>
                  {subtitle && (
                    <p className="mt-0.5 text-[12px] text-[#a1a1a6]">{subtitle}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#f5f5f7]"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="mobile-scroll-contain max-h-[calc(88dvh-7rem)] overflow-y-auto px-4 py-4 text-[#f5f5f7]">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
