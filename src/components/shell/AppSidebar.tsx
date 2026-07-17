import React from 'react';
import { motion } from 'motion/react';
import { AuthPanel } from '../AuthPanel';
import { ParishSidebarCard } from '../../features/parish/ParishSelector';
import { SIDEBAR_NAV } from './navConfig';
import type { Language, Role, Tab } from '../../types';
import type { User } from 'firebase/auth';
import type { SignInResult } from '../../hooks/useFirebaseAuth';

type AppSidebarProps = {
  activeTab: Tab;
  navLabel: (id: Tab) => string;
  canAccess: (role: Role) => boolean;
  isConfigured: boolean;
  onNavigate: (tab: Tab) => void;
  pendingCount: number;
  lang: Language;
  changeParishLabel: string;
  syncStatus: React.ReactNode;
  user: User | null;
  authError: string | null;
  effectiveRole: Role;
  onSignIn: (identifier: string, password: string) => Promise<SignInResult | void>;
  onLogout: () => Promise<void>;
  onRefreshToken: () => Promise<void>;
  onOpenRegistration: () => void;
  /** Signed-out marketing: hide sidebar so the page feels like a website */
  websiteMode?: boolean;
};

/**
 * Desktop sidebar — independent scroll pane under the header (≥1024).
 * Hidden below lg; mobile/tablet use bottom tabs + account sheet.
 */
export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeTab,
  navLabel,
  canAccess,
  isConfigured,
  onNavigate,
  pendingCount,
  lang,
  changeParishLabel,
  syncStatus,
  user,
  authError,
  effectiveRole,
  onSignIn,
  onLogout,
  onRefreshToken,
  onOpenRegistration,
  websiteMode = false,
}) => (
  <aside
    className={
      'app-sidebar website-chrome-sidebar hidden w-64 shrink-0 flex-col border-r border-black/5 bg-white/80 p-3 shadow-[8px_0_32px_rgba(0,0,0,0.04)] backdrop-blur-xl lg:flex ' +
      (websiteMode || (activeTab === 'landing' && !user) ? 'is-website-hidden' : '')
    }
  >
    <ParishSidebarCard
      songCount={0}
      changeParishLabel={changeParishLabel}
      syncStatus={syncStatus}
    />

    <div className="mt-4 shrink-0">
      <AuthPanel
        lang={lang}
        user={user}
        isConfigured={isConfigured}
        authError={authError}
        effectiveRole={effectiveRole}
        onSignIn={onSignIn}
        onLogout={onLogout}
        onRefreshToken={onRefreshToken}
        onOpenRegistration={onOpenRegistration}
      />
    </div>

    <nav className="mt-5 space-y-1 pb-4" aria-label="Main navigation">
      {SIDEBAR_NAV.filter(
        (item) => !isConfigured || canAccess(item.minRole) || item.minRole === 'public_user',
      ).map((item) => {
        const accessible = canAccess(item.minRole);
        const isActive = activeTab === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (accessible) onNavigate(item.id);
            }}
            disabled={!accessible}
            aria-current={isActive ? 'page' : undefined}
            className={
              'shell-nav-item relative flex min-h-[48px] w-full items-center gap-3 rounded-full px-3.5 py-2.5 text-[15px] font-medium tracking-[-0.015em] transition lg:min-h-[52px] lg:text-[16px] lg:tracking-[-0.02em] ' +
              (isActive
                ? 'is-active text-white'
                : accessible
                  ? 'text-[#1d1d1f] hover:bg-black/[0.04] lg:text-inherit lg:hover:bg-white/5'
                  : 'cursor-not-allowed text-[#d2d2d7]')
            }
          >
            {isActive && (
              <motion.span
                layoutId="sidebar-active-pill"
                className="absolute inset-0 rounded-full bg-[#0e3d4c]"
                transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              />
            )}
            <Icon
              className={
                'relative h-4 w-4 ' +
                (isActive
                  ? 'text-amber-300'
                  : accessible
                    ? 'text-[#86868b]'
                    : 'text-[#d2d2d7]')
              }
            />
            <span className="relative truncate">
              {item.id === 'ai_hub' ? 'AI Hub' : navLabel(item.id)}
            </span>
            {item.id === 'registration' && pendingCount > 0 && (
              <span className="relative ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800">
                {pendingCount}
              </span>
            )}
            {!accessible && isConfigured && (
              <span className="relative ml-auto text-[9px] text-slate-300">[locked]</span>
            )}
          </button>
        );
      })}
    </nav>
  </aside>
);
