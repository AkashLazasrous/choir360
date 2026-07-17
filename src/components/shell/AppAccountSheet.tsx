import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { AuthPanel } from '../AuthPanel';
import { ParishSidebarCard } from '../../features/parish/ParishSelector';
import type { Language, Role } from '../../types';
import type { User } from 'firebase/auth';
import type { SignInResult } from '../../hooks/useFirebaseAuth';

type AppAccountSheetProps = {
  open: boolean;
  onClose: () => void;
  lang: Language;
  changeParishLabel: string;
  syncStatus: React.ReactNode;
  songCount?: number;
  user: User | null;
  isConfigured: boolean;
  authError: string | null;
  effectiveRole: Role;
  onSignIn: (identifier: string, password: string) => Promise<SignInResult | void>;
  onLogout: () => Promise<void>;
  onRefreshToken: () => Promise<void>;
  onOpenRegistration: () => void;
};

/**
 * Mobile account / parish sheet — replaces hamburger drawer for auth & parish.
 * Desktop keeps the sidebar; this is lg:hidden only.
 */
export const AppAccountSheet: React.FC<AppAccountSheetProps> = ({
  open,
  onClose,
  lang,
  changeParishLabel,
  syncStatus,
  songCount = 0,
  user,
  isConfigured,
  authError,
  effectiveRole,
  onSignIn,
  onLogout,
  onRefreshToken,
  onOpenRegistration,
}) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-[58] lg:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button
          type="button"
          className="absolute inset-0 bg-[#050a14]/45 backdrop-blur-sm"
          aria-label="Close account"
          onClick={onClose}
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Account and parish"
          className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-hidden rounded-t-[1.75rem] border-t border-white/10 bg-[#f3f8fa] shadow-2xl"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        >
          <div className="flex flex-col items-center bg-[linear-gradient(160deg,#134556_0%,#0a1628_55%,#050a14_100%)] px-4 pb-5 pt-3 text-[#f5f5f7]">
            <div className="h-1 w-10 rounded-full bg-white/25" aria-hidden />
            <div className="mt-3 flex w-full items-start justify-between">
              <div>
                <p className="text-[20px] font-semibold tracking-[-0.025em]">You & parish</p>
                <p className="mt-0.5 text-[12px] text-[#a1a1a6]">
                  Sign-in, sync, and parish switch
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-[#f5f5f7]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mobile-scroll-contain max-h-[calc(88dvh-7rem)] space-y-4 overflow-y-auto px-4 py-4">
            <ParishSidebarCard
              songCount={songCount}
              changeParishLabel={changeParishLabel}
              syncStatus={syncStatus}
            />
            <AuthPanel
              lang={lang}
              user={user}
              isConfigured={isConfigured}
              authError={authError}
              effectiveRole={effectiveRole}
              onSignIn={onSignIn}
              onLogout={async () => {
                await onLogout();
                onClose();
              }}
              onRefreshToken={onRefreshToken}
              onOpenRegistration={() => {
                onOpenRegistration();
                onClose();
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
